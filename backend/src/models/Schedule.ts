// src/models/Schedule.ts

import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../config/database';

export interface ScheduleAttributes {
  id: CreationOptional<number>;
  date: Date;
  institutionName: string;
  region: string;
  capacity: number;
  trainingType: 'class' | 'teacher' | 'all_staff' | 'remote' | 'other';
  status: 'open' | 'closed' | 'adjusted';
}

class Schedule extends Model<InferAttributes<Schedule>, InferCreationAttributes<Schedule>> implements ScheduleAttributes {
  declare id: CreationOptional<number>;
  declare date: Date;
  declare institutionName: string;
  declare region: string;
  declare capacity: number;
  declare trainingType: 'class' | 'teacher' | 'all_staff' | 'remote' | 'other';
  declare status: 'open' | 'closed' | 'adjusted';
}

Schedule.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    institutionName: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    region: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    trainingType: {
      type: DataTypes.ENUM('class', 'teacher', 'all_staff', 'remote', 'other'),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('open', 'closed', 'adjusted'),
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