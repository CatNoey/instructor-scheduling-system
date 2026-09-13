# instructor-scheduling-backend
Backend for a scheduling system.

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file:

1. Copy the `.env.example` file to a new file named `.env`:
   ```
   cp .env.example .env
   ```
2. Open the `.env` file and replace the placeholder values with your actual configuration:
   - `DB_USER`: Your PostgreSQL username
   - `DB_HOST`: Your database host (usually 'localhost' for local development)
   - `DB_NAME`: Your database name
   - `DB_PASSWORD`: Your PostgreSQL password
   - `DB_PORT`: Your database port (default is 5432 for PostgreSQL)
   - `JWT_SECRET`: A random string of at least 32 characters for JWT token signing
   - `CORS_ALLOWED_ORIGINS`: Comma-separated browser origins allowed to send credentialed requests

Ensure that your `.env` file is listed in your `.gitignore` to prevent committing sensitive information to your repository.

## Starting and database changes

`npm run build && npm start` starts the built server. Startup validates its environment, connects to PostgreSQL before listening, and exposes `/health` and `/readiness`. The application never calls `sequelize.sync()` or modifies schema while starting.

For a new, dedicated database, run `npm run migrate`. The runner records completed migrations in `SchemaMigrations`; it is safe to rerun. The first migration creates `User`, `Schedule`, `Session`, and `InstructorApplication` tables with their cascade relationships. It intentionally does not add the instructor-application uniqueness constraint, which belongs to migration 002.

Do not point `npm run migrate` at an existing database from an earlier release. Before a baseline transition, back it up; inventory existing tables, enum types, primary/foreign keys, and application rows; choose an explicit baseline migration record only after comparing it to `001-initial-schema`; then run a staging restore and validate counts and foreign keys. Production migration requires that review and an explicit change window.

Public `POST /api/auth/register` always creates an `instructor`; it cannot create administrators. Create the first administrator only through the explicit command below, with values provided in the process environment (never commit them):

```sh
ADMIN_USERNAME=admin ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='change-this' npm run create:admin
```

Schedule dates are business-date strings (`YYYY-MM-DD`). Session timestamps include an explicit offset on requests and return as UTC ISO timestamps. The current client combines a schedule date and time in the browser's local time zone; a fixed business time-zone policy still needs product review.
