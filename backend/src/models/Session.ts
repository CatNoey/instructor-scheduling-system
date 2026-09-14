import { CreationOptional, DataTypes, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import sequelize from '../config/database';
import { trainingTypes } from '../../shared/validation';

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
  scheduleId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    references: { model: 'Schedules', key: 'id' },
    onUpdate: 'CASCADE',
    onDelete: 'CASCADE',
  },
  startTime: { type: DataTypes.DATE, allowNull: false },
  endTime: { type: DataTypes.DATE, allowNull: false },
  instructor: { type: DataTypes.STRING, allowNull: false, validate: { notEmpty: true } },
  notes: { type: DataTypes.TEXT, allowNull: true },
  trainingType: { type: DataTypes.ENUM(...trainingTypes), allowNull: false },
}, {
  sequelize,
  modelName: 'Session',
  validate: {
    chronologicalRange(this: Session) {
      if (this.endTime <= this.startTime) throw new Error('endTime must be after startTime');
    },
  },
});
