import { QueryInterface } from 'sequelize';

const constraintName = 'instructor_applications_instructor_session_unique';

/**
 * This migration intentionally refuses to choose a winner for existing duplicate
 * applications. Run it after the 001 migration runner is installed; if it stops
 * on duplicates, review and resolve those records before retrying.
 */
export const up = async (queryInterface: QueryInterface): Promise<void> => {
  const [rows] = await queryInterface.sequelize.query(
    `SELECT "instructorId", "sessionId", COUNT(*) AS "count"
     FROM "InstructorApplications"
     GROUP BY "instructorId", "sessionId"
     HAVING COUNT(*) > 1`,
  );
  if (Array.isArray(rows) && rows.length > 0) {
    throw new Error('Cannot add instructor application uniqueness: existing duplicate instructorId/sessionId pairs require manual resolution');
  }
  await queryInterface.addConstraint('InstructorApplications', {
    fields: ['instructorId', 'sessionId'],
    type: 'unique',
    name: constraintName,
  });
};

export const down = async (queryInterface: QueryInterface): Promise<void> => {
  await queryInterface.removeConstraint('InstructorApplications', constraintName);
};

export default { up, down };
