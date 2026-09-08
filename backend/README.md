# instructor-scheduling-backend
Backend for a scheduling system

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
   - `JWT_SECRET`: A secure random string for JWT token signing

Ensure that your `.env` file is listed in your `.gitignore` to prevent committing sensitive information to your repository.