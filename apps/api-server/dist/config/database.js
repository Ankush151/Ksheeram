"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDatabase = connectDatabase;
exports.disconnectDatabase = disconnectDatabase;
exports.withTransaction = withTransaction;
const mongoose_1 = __importDefault(require("mongoose"));
const env_1 = require("./env");
async function connectDatabase() {
    try {
        mongoose_1.default.set('strictQuery', true);
        const conn = await mongoose_1.default.connect(env_1.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
            autoIndex: true, // create indexes in dev/staging
        });
        console.log(`[Database] MongoDB successfully connected: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
    }
    catch (err) {
        console.error(`[Database] MongoDB connection failed:`, err.message);
        throw err;
    }
}
async function disconnectDatabase() {
    await mongoose_1.default.disconnect();
    console.log('[Database] MongoDB disconnected cleanly.');
}
/**
 * Executes operations within a MongoDB transaction.
 * If the connected cluster does not support transactions (e.g. standalone local mongo),
 * gracefully falls back to non-transactional execution without failing the operation.
 */
async function withTransaction(work) {
    let session = null;
    try {
        session = await mongoose_1.default.startSession();
        session.startTransaction();
        const result = await work(session);
        await session.commitTransaction();
        return result;
    }
    catch (err) {
        if (session && session.inTransaction()) {
            await session.abortTransaction();
        }
        // If transactions are not supported on a standalone deployment, retry once without session
        if (err.message?.includes('Transactions are not supported') ||
            err.message?.includes('replica set') ||
            err.code === 20 // IllegalOperation on standalone
        ) {
            console.warn('[Database] Transaction not supported by MongoDB topology. Executing fallback sequential write.');
            return work(null);
        }
        throw err;
    }
    finally {
        if (session) {
            await session.endSession();
        }
    }
}
//# sourceMappingURL=database.js.map