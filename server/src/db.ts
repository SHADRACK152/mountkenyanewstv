import { Pool } from 'pg';

const connectionString = process.env.NEON_DATABASE_URL;

if (!connectionString) {
  console.error('NEON_DATABASE_URL is not set');
  process.exit(1);
}

export const pool = new Pool({ connectionString });

export async function query(text: string, params?: any[]) {
  const client = await pool.connect();
  try {
    const res = await client.query(text, params);
    return res;
  } finally {
    client.release();
  }
}
