// src/models/InstructorApplication.ts

import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../config/database';

export interface InstructorApplicationAttributes {
  id: CreationOptional<number>;
  status: 'pending' | 'approved' | 'rejected';
  instructorId: number;
  scheduleId: number;
}

class InstructorApplication extends Model<InferAttributes<InstructorApplication>, InferCreationAttributes<InstructorApplication>> implements InstructorApplicationAttributes {
  declare id: CreationOptional<number>;
  declare status: 'pending' | 'approved' | 'rejected';
  declare instructorId: number;
  declare scheduleId: number;
}

InstructorApplication.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending',
    },
    instructorId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
    scheduleId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'InstructorApplication',
  }
);

export { InstructorApplication };