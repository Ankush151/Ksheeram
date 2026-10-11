"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = require("./app");
const env_1 = require("./config/env");
const database_1 = require("./config/database");
async function bootstrap() {
    try {
        console.log('--- Initializing Ksheeraam Backend Services ---');
        console.log(`Environment: ${env_1.env.NODE_ENV}`);
        console.log(`Port: ${env_1.env.PORT}`);
        // Connect to MongoDB Atlas / Local MongoDB
        await (0, database_1.connectDatabase)();
        const server = app_1.app.listen(env_1.env.PORT, () => {
            console.log(`[HTTP Server] Ksheeraam API listening on http://localhost:${env_1.env.PORT}`);
            console.log(`[API Base] REST Endpoints mounted on http://localhost:${env_1.env.PORT}/api/v1`);
            console.log(`[Health] Probes available on http://localhost:${env_1.env.PORT}/health`);
        });
        const shutdown = async (signal) => {
            console.log(`\nReceived ${signal}. Gracefully shutting down HTTP server and database...`);
            server.close(async () => {
                await (0, database_1.disconnectDatabase)();
                console.log('Ksheeraam backend shutdown completed cleanly.');
                process.exit(0);
            });
        };
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
    }
    catch (err) {
        console.error('Fatal initialization error during startup:', err);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=index.js.map