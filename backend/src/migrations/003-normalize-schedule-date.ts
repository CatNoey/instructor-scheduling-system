import { QueryInterface, Transaction } from 'sequelize';

/**
 * Older development databases stored the business date as a timestamp. The
 * application contract is DATEONLY, so timestamps prevent calendar matching
 * after a schedule is created. Preserve the calendar day while removing the
 * meaningless time portion. Fresh databases already have a DATE column.
 */
export const up = async (queryInterface: QueryInterface, transaction?: Transaction): Promise<void> => {
  const columns = await queryInterface.describeTable('Schedules');
  const dateColumn = columns.date;
  if (!dateColumn || /^DATE$/i.test(String(dateColumn.type))) return;

  await queryInterface.sequelize.query(
    'ALTER TABLE "Schedules" ALTER COLUMN "date" TYPE DATE USING ("date"::date)',
    { transaction },
  );
};

export const down = async (_queryInterface: QueryInterface, _transaction?: Transaction): Promise<void> => {
  // DATE is the intended canonical representation; reverting would reintroduce the defect.
};

export default { up, down };
