<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::unprepared("DROP TRIGGER IF EXISTS after_registration_insert");

        DB::unprepared(<<<'SQL'
        CREATE TRIGGER before_registration_insert
        BEFORE INSERT ON registrations
        FOR EACH ROW
        BEGIN
          DECLARE event_is_paid TINYINT(1);
          SELECT is_paid INTO event_is_paid FROM events WHERE id = NEW.event_id;
          IF event_is_paid = 0 THEN
            SET NEW.payment_status = 'Paid';
          END IF;
        END;
        SQL);
    }

    public function down(): void
    {
        if (DB::getDriverName() !== 'mysql') {
            return;
        }

        DB::unprepared("DROP TRIGGER IF EXISTS before_registration_insert");

        DB::unprepared(<<<'SQL'
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
        SQL);
    }
};
