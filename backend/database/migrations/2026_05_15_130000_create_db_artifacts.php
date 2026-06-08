<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Create view v_event_dashboard
        DB::unprepared(<<<'SQL'
        CREATE OR REPLACE VIEW v_event_dashboard AS
        SELECT
          e.id AS event_id,
          e.title,
          e.status,
          e.start_date,
          e.end_date,
          e.capacity,
          e.audience_type,
          e.is_paid,
          o.name AS org_name,
          v.name AS venue_name,
          ec.name AS category_name,
          COUNT(r.id) AS total_registered,
          SUM(CASE WHEN r.payment_status = 'Paid' THEN 1 ELSE 0 END) AS total_confirmed,
          SUM(CASE WHEN r.payment_status = 'Pending' THEN 1 ELSE 0 END) AS total_pending,
          (e.capacity - COUNT(r.id)) AS remaining_capacity
        FROM events e
        LEFT JOIN organizations o ON e.host_org_id = o.id
        LEFT JOIN venues v ON e.venue_id = v.id
        LEFT JOIN event_categories ec ON e.category_id = ec.id
        LEFT JOIN registrations r ON e.id = r.event_id
        GROUP BY
          e.id, e.title, e.status, e.start_date, e.end_date,
          e.capacity, e.audience_type, e.is_paid,
          o.name, v.name, ec.name;
        SQL
        );

        // Create stored procedure register_student_for_event
        DB::unprepared(<<<'SQL'
        DROP PROCEDURE IF EXISTS register_student_for_event;
        CREATE PROCEDURE register_student_for_event(
            IN p_event_id CHAR(36),
            IN p_user_id CHAR(36),
            IN p_payment_selection VARCHAR(10)
        )
        BEGIN
            DECLARE v_capacity INT;
            DECLARE v_is_paid TINYINT(1);
            DECLARE v_audience VARCHAR(32);
            DECLARE v_host_org CHAR(36);
            DECLARE v_reg_count INT;
            DECLARE v_exists INT;
            DECLARE v_new_reg_id CHAR(36);

            DECLARE EXIT HANDLER FOR SQLEXCEPTION
            BEGIN
                ROLLBACK;
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Registration failed due to an internal error.';
            END;

            START TRANSACTION;

            SELECT capacity, is_paid, audience_type, host_org_id
            INTO v_capacity, v_is_paid, v_audience, v_host_org
            FROM events WHERE id = p_event_id AND status = 'Open' FOR UPDATE;

            IF v_capacity IS NULL THEN
                ROLLBACK;
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Event not found or not open.';
            END IF;

            SELECT COUNT(*) INTO v_exists FROM registrations WHERE event_id = p_event_id AND user_id = p_user_id;
            IF v_exists > 0 THEN
                ROLLBACK;
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'User already registered for this event.';
            END IF;

            SELECT COUNT(*) INTO v_reg_count FROM registrations WHERE event_id = p_event_id;
            IF v_reg_count >= v_capacity THEN
                ROLLBACK;
                SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Event capacity reached.';
            END IF;

            IF v_audience = 'CvSU_Only' THEN
                -- enforce user has global_role = 'User'
                IF (SELECT global_role FROM users WHERE id = p_user_id) <> 'User' THEN
                    ROLLBACK;
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Event limited to CvSU users only.';
                END IF;
            ELSEIF v_audience = 'Org_Members_Only' THEN
                IF (SELECT COUNT(*) FROM org_officers WHERE user_id = p_user_id AND org_id = v_host_org AND is_active = 1) = 0 THEN
                    ROLLBACK;
                    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Event limited to organization members only.';
                END IF;
            END IF;

            SET v_new_reg_id = UUID();

            INSERT INTO registrations (id, event_id, user_id, reg_date, payment_selection, payment_status, attendance_status, created_at, updated_at)
            VALUES (v_new_reg_id, p_event_id, p_user_id, NOW(), p_payment_selection, 'Pending', 'Not_Arrived', NOW(), NOW());

            -- If event is paid and payment selection is Online, create placeholder payment_proofs row
            IF v_is_paid = 1 AND p_payment_selection = 'Online' THEN
                INSERT INTO payment_proofs (id, reg_id, image_url, uploaded_at, status, verified_by, created_at, updated_at)
                VALUES (UUID(), v_new_reg_id, NULL, NOW(), 'Pending_Review', NULL, NOW(), NOW());
            END IF;

            -- Insert registration confirmation notification
            INSERT INTO notifications (id, user_id, type, reference_id, message, sent_at, created_at, updated_at)
            VALUES (UUID(), p_user_id, 'Registration_Confirm', v_new_reg_id, 'Your registration has been received.', NOW(), NOW(), NOW());

            COMMIT;
        END;
        SQL
        );

        // Create trigger after_registration_insert
        DB::unprepared(<<<'SQL'
        DROP TRIGGER IF EXISTS after_registration_insert;
        CREATE TRIGGER after_registration_insert
        AFTER INSERT ON registrations
        FOR EACH ROW
        BEGIN
          DECLARE event_is_paid TINYINT(1);
          SELECT is_paid INTO event_is_paid FROM events WHERE id = NEW.event_id;
          IF event_is_paid = 0 THEN
            UPDATE registrations SET payment_status = 'Paid' WHERE id = NEW.id;
          END IF;
        END;
        SQL
        );

        // Create registrations index with justification comment in migration
        // INDEX JUSTIFICATION:
        // registrations.event_id is the most frequently queried column in the system.
        // Every Masterlist load, Entrance Panel load, capacity check, and dashboard
        // aggregate filters or joins on this column. Without an index, MySQL performs
        // a full table scan on every query. As registration volume grows across
        // hundreds of events and thousands of students, this index eliminates those
        // full table scans and keeps all event-related queries performant.
        Schema::table('registrations', function (Blueprint $table) {
            $table->index('event_id', 'idx_registrations_event_id');
        });
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        // Drop view
        DB::unprepared('DROP VIEW IF EXISTS v_event_dashboard');
        // Drop trigger and procedure
        DB::unprepared('DROP TRIGGER IF EXISTS after_registration_insert');
        DB::unprepared('DROP PROCEDURE IF EXISTS register_student_for_event');
        // MySQL may use this index to support the registrations.event_id foreign key.
        // If so, keep it; the registrations migration will remove it when the table is dropped.
        try {
            Schema::table('registrations', function (Blueprint $table) {
                $table->dropIndex('idx_registrations_event_id');
            });
        } catch (QueryException $exception) {
            if (($exception->errorInfo[1] ?? null) !== 1553) {
                throw $exception;
            }
        }
    }
};
