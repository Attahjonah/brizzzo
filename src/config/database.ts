import { createConnection } from 'mysql2/promise';
import type { Connection } from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

let connection: Connection;

export async function connectDB() {
  let attempts = 0;
  const maxAttempts = 10;
  const retryDelay = 2000; // 2 seconds

  while (attempts < maxAttempts) {
    try {
      connection = await createConnection(dbConfig);
      console.log('Connected to MySQL database');
      return;
    } catch (error) {
      attempts++;
      if (attempts >= maxAttempts) {
        console.error('Database connection failed after max attempts:', error);
        throw error;
      }
      console.log(`Database connection attempt ${attempts} failed, retrying in ${retryDelay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

export function getDB() {
  if (!connection) {
    throw new Error('Database not connected');
  }
  return connection;
}