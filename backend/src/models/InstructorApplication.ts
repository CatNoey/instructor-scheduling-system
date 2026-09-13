// src/models/InstructorApplication.ts

import { DataTypes, Model, InferAttributes, InferCreationAttributes, CreationOptional } from 'sequelize';
import sequelize from '../config/database';

export interface InstructorApplicationAttributes {
  id: CreationOptional<number>;
  status: 'pending' | 'approved' | 'rejected';
  instructorId: number;
  sessionId: number;
}

class InstructorApplication extends Model<InferAttributes<InstructorApplication>, InferCreationAttributes<InstructorApplication>> implements InstructorApplicationAttributes {
  declare id: CreationOptional<number>;
  declare status: 'pending' | 'approved' | 'rejected';
  declare instructorId: number;
  declare sessionId: number;
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
      references: { model: 'Users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    sessionId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: { model: 'Sessions', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
  },
  {
    sequelize,
    modelName: 'InstructorApplication',
    indexes: [{ unique: true, fields: ['instructorId', 'sessionId'], name: 'instructor_applications_instructor_session_unique' }],
  }
);

export { InstructorApplication };
