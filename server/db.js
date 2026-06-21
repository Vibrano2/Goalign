import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// We use the DATABASE_URL environment variable provided by Render.com
// Format: postgres://USER:PASSWORD@HOST:PORT/DATABASE
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);
export const getClient = () => pool.connect();
