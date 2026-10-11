import { app } from './app';
import { env } from './config/env';
import { connectDatabase, disconnectDatabase } from './config/database';

async function bootstrap() {
  try {
    console.log('--- Initializing Ksheeraam Backend Services ---');
    console.log(`Environment: ${env.NODE_ENV}`);
    console.log(`Port: ${env.PORT}`);

    // Connect to MongoDB Atlas / Local MongoDB
    await connectDatabase();

    const server = app.listen(env.PORT, () => {
      console.log(`[HTTP Server] Ksheeraam API listening on http://localhost:${env.PORT}`);
      console.log(`[API Base] REST Endpoints mounted on http://localhost:${env.PORT}/api/v1`);
      console.log(`[Health] Probes available on http://localhost:${env.PORT}/health`);
    });

    const shutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Gracefully shutting down HTTP server and database...`);
      server.close(async () => {
        await disconnectDatabase();
        console.log('Ksheeraam backend shutdown completed cleanly.');
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (err: any) {
    console.error('Fatal initialization error during startup:', err);
    process.exit(1);
  }
}

bootstrap();
