import { DataTypes, QueryInterface, Transaction } from 'sequelize';

export const up = async (queryInterface: QueryInterface, transaction?: Transaction): Promise<void> => {
  await queryInterface.createTable('UserNotifications', {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    message: { type: DataTypes.STRING(500), allowNull: false },
    type: { type: DataTypes.ENUM('info', 'warning', 'error'), allowNull: false, defaultValue: 'info' },
    readAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  }, { transaction });
  await queryInterface.addIndex('UserNotifications', ['userId', 'createdAt'], {
    name: 'user_notifications_user_created_at',
    transaction,
  });
};

export const down = async (queryInterface: QueryInterface, transaction?: Transaction): Promise<void> => {
  await queryInterface.dropTable('UserNotifications', { transaction });
};

export default { up, down };
