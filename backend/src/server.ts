import { Server } from 'node:http';
import { createApp } from './app';
import { getAppConfig } from './config/env';
import sequelize from './config/database';

export const startServer = async (): Promise<{ server: Server; close: () => Promise<void> }> => {
  const config = getAppConfig();
  let ready = false;
  const app = createApp({ corsAllowedOrigins: config.corsAllowedOrigins, isReady: () => ready });

  await sequelize.authenticate();
  ready = true;

  const server = await new Promise<Server>((resolve, reject) => {
    const listener = app.listen(config.port, () => resolve(listener));
    listener.once('error', reject);
  });

  const close = async () => {
    ready = false;
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    await sequelize.close();
  };
  return { server, close };
};

const main = async () => {
  const running = await startServer();
  const shutdown = () => {
    void running.close().then(() => process.exit(0)).catch(() => process.exit(1));
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
};

if (require.main === module) {
  void main().catch((error: unknown) => {
    console.error('Server failed to start', error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
