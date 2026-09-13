import { Sequelize } from 'sequelize';
import './env';

const isTestEnvironment = process.env.NODE_ENV === 'test';
const testDatabaseName = process.env.TEST_DB_NAME || 'instructor_scheduling_test';

if (isTestEnvironment && process.env.DB_NAME !== testDatabaseName) {
  throw new Error('Tests must use the dedicated TEST_DB_NAME database');
}

/** Constructing Sequelize does not connect; server.ts owns connection lifecycle. */
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  logging: false,
});

export default sequelize;
