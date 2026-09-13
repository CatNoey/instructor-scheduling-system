import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import sequelize from '../config/database';

export class Session extends Model<InferAttributes<Session>, InferCreationAttributes<Session>> {
  declare id: CreationOptional<number>;
  declare scheduleId: number;
  declare startTime: Date;
  declare endTime: Date;
  declare instructor: string;
  declare notes: CreationOptional<string | null>;
  declare trainingType: 'class' | 'teacher' | 'all_staff' | 'remote' | 'other';
}

Session.init({
  id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
  scheduleId: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
  startTime: { type: DataTypes.DATE, allowNull: false },
  endTime: { type: DataTypes.DATE, allowNull: false },
  instructor: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
  notes: { type: DataTypes.TEXT, allowNull: true },
  trainingType: { type: DataTypes.ENUM('class', 'teacher', 'all_staff', 'remote', 'other'), allowNull: false },
}, { sequelize, modelName: 'Session' });
