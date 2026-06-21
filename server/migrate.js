import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = 'postgresql://goalign_db_user:w1LRaNQDoIiIyZuKKxiZQOZwyHbrViJL@dpg-d8s3stfavr4c73f9p530-a.oregon-postgres.render.com/goalign_db';

const pool = new pg.Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Connecting to Render DB...');
    await pool.query(schemaSql);
    console.log('Successfully ran schema.sql on Render DB!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

run();
