import sequelize from '../config/database';
import { getAppConfig } from '../config/env';
import { createUser, getUserByUsername } from '../models/User';

const requiredAdminInput = (name: 'ADMIN_USERNAME' | 'ADMIN_EMAIL' | 'ADMIN_PASSWORD'): string => {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} must be supplied as an environment variable`);
  return value;
};

export const createInitialAdmin = async (): Promise<number> => {
  getAppConfig();
  const username = requiredAdminInput('ADMIN_USERNAME');
  const email = requiredAdminInput('ADMIN_EMAIL').toLowerCase();
  const password = requiredAdminInput('ADMIN_PASSWORD');
  if (username.length < 3 || password.length < 8) throw new Error('Admin username must be 3+ characters and password 8+ characters');

  await sequelize.authenticate();
  if (await getUserByUsername(username)) throw new Error('An account with that username already exists');
  const user = await createUser({ username, email, password, role: 'admin' });
  return user.id;
};

if (require.main === module) {
  void createInitialAdmin()
    .then((id) => console.log(`Admin account ${id} created`))
    .finally(() => sequelize.close())
    .catch((error: unknown) => {
      console.error('Admin creation failed', error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
