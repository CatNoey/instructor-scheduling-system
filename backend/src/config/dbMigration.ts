import pool from './database';

const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL
  )
`;

const runMigration = async () => {
  try {
    const client = await pool.connect();
    try {
      await client.query(createUsersTable);
      console.log('Migration completed successfully');
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    await pool.end();
  }
};

runMigration();