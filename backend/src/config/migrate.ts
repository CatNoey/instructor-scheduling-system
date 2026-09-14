import { DataTypes, QueryTypes } from 'sequelize';
import sequelize from './database';
import { getAppConfig } from './env';
import { initialSchemaMigration } from './migrations/001-initial-schema';
import { Migration } from './migrations/types';
import instructorApplicationUniqueConstraint from '../migrations/002-add-instructor-application-unique-constraint';

const migrations: Migration[] = [
  initialSchemaMigration,
  {
    name: '002-instructor-application-unique-constraint',
    up: (queryInterface, transaction) => instructorApplicationUniqueConstraint.up(queryInterface, transaction),
    down: (queryInterface, transaction) => instructorApplicationUniqueConstraint.down(queryInterface, transaction),
  },
];
const historyTable = 'SchemaMigrations';

export const runMigrations = async (): Promise<string[]> => {
  getAppConfig();
  await sequelize.authenticate();
  const queryInterface = sequelize.getQueryInterface();
  await queryInterface.createTable(historyTable, {
    name: { type: DataTypes.STRING, allowNull: false, primaryKey: true },
    executedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }).catch(async (error: unknown) => {
    // PostgreSQL reports an existing history table as a database error; it is safe to continue.
    if (!(error instanceof Error) || !/already exists/i.test(error.message)) throw error;
  });
  const rows = await sequelize.query<{ name: string }>(`SELECT name FROM "${historyTable}"`, { type: QueryTypes.SELECT });
  const applied = new Set(rows.map((row) => row.name));
  const pending = migrations.filter((migration) => !applied.has(migration.name));

  for (const migration of pending) {
    await sequelize.transaction(async (transaction) => {
      await migration.up(queryInterface, transaction);
      await queryInterface.bulkInsert(historyTable, [{ name: migration.name, executedAt: new Date() }], { transaction });
    });
  }
  return pending.map((migration) => migration.name);
};

if (require.main === module) {
  void runMigrations()
    .then((applied) => console.log(applied.length ? `Applied migrations: ${applied.join(', ')}` : 'Database is already current'))
    .finally(() => sequelize.close())
    .catch((error: unknown) => {
      console.error('Migration failed', error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
