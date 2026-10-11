import mongoose, { ClientSession } from 'mongoose';
import { env } from './env';

export async function connectDatabase(): Promise<typeof mongoose> {
  try {
    mongoose.set('strictQuery', true);
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true, // create indexes in dev/staging
    });
    console.log(`[Database] MongoDB successfully connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err: any) {
    console.error(`[Database] MongoDB connection failed:`, err.message);
    throw err;
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  console.log('[Database] MongoDB disconnected cleanly.');
}

/**
 * Executes operations within a MongoDB transaction.
 * If the connected cluster does not support transactions (e.g. standalone local mongo),
 * gracefully falls back to non-transactional execution without failing the operation.
 */
export async function withTransaction<T>(
  work: (session: ClientSession | null) => Promise<T>
): Promise<T> {
  let session: ClientSession | null = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();

    const result = await work(session);
    await session.commitTransaction();
    return result;
  } catch (err: any) {
    if (session && session.inTransaction()) {
      await session.abortTransaction();
    }

    // If transactions are not supported on a standalone deployment, retry once without session
    if (
      err.message?.includes('Transactions are not supported') ||
      err.message?.includes('replica set') ||
      err.code === 20 // IllegalOperation on standalone
    ) {
      console.warn('[Database] Transaction not supported by MongoDB topology. Executing fallback sequential write.');
      return work(null);
    }

    throw err;
  } finally {
    if (session) {
      await session.endSession();
    }
  }
}
