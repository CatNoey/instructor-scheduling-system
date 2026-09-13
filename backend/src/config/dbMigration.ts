import sequelize from './database';

const runMigration = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('Migration completed successfully');
  } catch (error) {
    console.error('Error running migration:', error);
  } finally {
    await sequelize.close();
  }
};

void runMigration();
