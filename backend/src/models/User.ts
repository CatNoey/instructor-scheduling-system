// src/models/User.ts

import { DataTypes, Model, CreationOptional, InferAttributes, InferCreationAttributes } from 'sequelize';
import bcryptjs from 'bcryptjs';
import sequelize from '../config/database';

export interface UserAttributes {
  id: CreationOptional<number>;
  username: string;
  email: string;
  password: string;
  role: string;
}

class User extends Model<InferAttributes<User>, InferCreationAttributes<User>> implements UserAttributes {
  declare id: CreationOptional<number>;
  declare username: string;
  declare email: string;
  declare password: string;
  declare role: string;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
  }
);

User.beforeCreate(async (user: User) => {
  const salt = await bcryptjs.genSalt(10);
  user.password = await bcryptjs.hash(user.password, salt);
});

export const createUser = async (userData: Omit<UserAttributes, 'id'>): Promise<User> => {
  return await User.create(userData);
};

export const getUserByUsername = async (username: string): Promise<User | null> => {
  return await User.findOne({ where: { username } });
};

export { User };