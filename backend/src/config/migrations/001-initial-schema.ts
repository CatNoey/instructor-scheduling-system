import { DataTypes } from 'sequelize';
import { Migration } from './types';

export const initialSchemaMigration: Migration = {
  name: '001-initial-schema',
  async up(queryInterface, transaction) {
    const options = { transaction };
    await queryInterface.createTable('Users', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      username: { type: DataTypes.STRING, allowNull: false, unique: true },
      email: { type: DataTypes.STRING, allowNull: false, unique: true },
      password: { type: DataTypes.STRING, allowNull: false },
      role: { type: DataTypes.ENUM('admin', 'instructor'), allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, options);
    await queryInterface.createTable('Schedules', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      date: { type: DataTypes.DATEONLY, allowNull: false },
      institutionName: { type: DataTypes.STRING, allowNull: false },
      region: { type: DataTypes.STRING, allowNull: false },
      capacity: { type: DataTypes.INTEGER, allowNull: false },
      trainingType: { type: DataTypes.ENUM('class', 'teacher', 'all_staff', 'remote', 'other'), allowNull: false },
      status: { type: DataTypes.ENUM('open', 'closed', 'adjusted'), allowNull: false, defaultValue: 'open' },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, options);
    await queryInterface.createTable('Sessions', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      scheduleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Schedules', key: 'id' },
        onDelete: 'CASCADE',
      },
      startTime: { type: DataTypes.DATE, allowNull: false },
      endTime: { type: DataTypes.DATE, allowNull: false },
      instructor: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
      notes: { type: DataTypes.TEXT, allowNull: true },
      trainingType: { type: DataTypes.ENUM('class', 'teacher', 'all_staff', 'remote', 'other'), allowNull: false },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, options);
    await queryInterface.createTable('InstructorApplications', {
      id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
      instructorId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Users', key: 'id' },
        onDelete: 'CASCADE',
      },
      sessionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: { model: 'Sessions', key: 'id' },
        onDelete: 'CASCADE',
      },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    }, options);
  },
  async down(queryInterface, transaction) {
    const options = { transaction };
    await queryInterface.dropTable('InstructorApplications', options);
    await queryInterface.dropTable('Sessions', options);
    await queryInterface.dropTable('Schedules', options);
    await queryInterface.dropTable('Users', options);
  },
};
