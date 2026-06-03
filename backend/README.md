# Salikop Backend

This `backend/` workspace contains the Laravel backend for SALIKOP, the Centralized Campus Organization and Event Management System.

## Requirements

- PHP 8.2+
- Composer
- XAMPP (MySQL + Apache)
- Laravel 11

## Setup

1. Clone the repository.
2. Run `composer install`.
3. Copy `.env.example` to `.env` and fill in the database credentials.
4. Run `php artisan key:generate`.
5. Run `php artisan migrate`.
6. Run `php artisan db:seed`.
7. Run `php artisan serve`.

## Environment Variables

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=campus_system
DB_USERNAME=root
DB_PASSWORD=

SANCTUM_STATEFUL_DOMAINS=localhost:3000
SESSION_DOMAIN=localhost
FRONTEND_URL=http://localhost:3000
```

## Password Reset Email

Salikop sends password reset OTP codes through Laravel mail. Local development can keep `MAIL_MAILER=log`, which writes reset emails to `storage/logs/laravel.log`.

For a free SMTP option, use Brevo's free SMTP tier:

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp-relay.brevo.com
MAIL_PORT=587
MAIL_USERNAME=your-brevo-login
MAIL_PASSWORD=your-brevo-smtp-key
MAIL_FROM_ADDRESS=no-reply@your-verified-domain-or-sender.com
MAIL_FROM_NAME="Salikop"
```

Brevo requires a verified sender or domain before real emails can be delivered. Keep the SMTP key only in `.env`; do not commit it.

## Seeded Lookup Data

After seeding, the backend preloads:

- CvSU departments
- venues
- event categories
- organization categories

## Notes

- API routes are versioned under `/api/v1/`.
- CORS is configured in `config/cors.php` to allow `http://localhost:3000`.
- This backend serves the Salikop frontend in `../app`.
