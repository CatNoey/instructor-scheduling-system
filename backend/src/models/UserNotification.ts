import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import sequelize from '../config/database';

export class UserNotification extends Model<InferAttributes<UserNotification>, InferCreationAttributes<UserNotification>> {
  declare id: CreationOptional<number>;
  declare userId: number;
  declare message: string;
  declare type: 'info' | 'warning' | 'error';
  declare readAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

UserNotification.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'Users', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  message: { type: DataTypes.STRING(500), allowNull: false, validate: { notEmpty: true } },
  type: { type: DataTypes.ENUM('info', 'warning', 'error'), allowNull: false, defaultValue: 'info' },
  readAt: { type: DataTypes.DATE, allowNull: true },
  createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
}, {
  sequelize,
  modelName: 'UserNotification',
  indexes: [{ fields: ['userId', 'createdAt'], name: 'user_notifications_user_created_at' }],
});
