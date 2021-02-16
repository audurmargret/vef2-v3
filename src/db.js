import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();
const { Client } = pg;

const {
  DATABASE_URL: connectionString,
  NODE_ENV: nodeEnv = 'development',
} = process.env;

if (!connectionString) {
  console.error('Vantar DATABASE_URL');
  process.exit(1);
}

const ssl = nodeEnv !== 'development' ? { rejectUnauthorized: false } : false;

async function query(q, values = []) {
  const client = new Client({
    connectionString, ssl,
  });
  await client.connect();

  try {
    const result = await client.query(q, values);
    return result;
  } catch (err) {
    console.error(err);
    throw err;
  } finally {
    await client.end();
  }
}

async function select() {
  const result = await query('SELECT * FROM signatures ORDER BY signed DESC');
  return result.rows;
}

async function insert(data) {
  const s = 'INSERT INTO signatures (name, nationalid, comment,anonymous) VALUES ($1, $2, $3, $4);';
  const values = [data.name, data.kt, data.ath, data.hidden];
  return query(s, values);
}

export const db = { select, insert, query };
