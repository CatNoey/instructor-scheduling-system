// src/models/Schedule.ts

import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../config/database';
import { isDateOnly, scheduleStatuses, trainingTypes } from '../../shared/validation';

export interface ScheduleAttributes {
  id: CreationOptional<number>;
  date: string;
  institutionName: string;
  region: string;
  capacity: number;
  trainingType: 'class' | 'teacher' | 'all_staff' | 'remote' | 'other';
  status: 'open' | 'closed' | 'adjusted';
}

class Schedule extends Model<InferAttributes<Schedule>, InferCreationAttributes<Schedule>> implements ScheduleAttributes {
  declare id: CreationOptional<number>;
  declare date: string;
  declare institutionName: string;
  declare region: string;
  declare capacity: number;
  declare trainingType: 'class' | 'teacher' | 'all_staff' | 'remote' | 'other';
  declare status: CreationOptional<'open' | 'closed' | 'adjusted'>;
}

Schedule.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isValidDateOnly(value: string) {
          if (!isDateOnly(value)) throw new Error('date must be a valid YYYY-MM-DD value');
        },
      },
    },
    institutionName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    region: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: { notEmpty: true },
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { isInt: true, min: 1 },
    },
    trainingType: {
      type: DataTypes.ENUM(...trainingTypes),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(...scheduleStatuses),
      allowNull: false,
      defaultValue: 'open',
    },
  },
  {
    sequelize,
    modelName: 'Schedule',
  }
);

export { Schedule };
