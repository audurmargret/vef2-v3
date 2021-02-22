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

async function select(offset=0, limit=50) {
  const result = await query('SELECT * FROM signatures ORDER BY signed DESC OFFSET $1 LIMIT $2', [offset, limit]);

  return result.rows;
}

async function insert(data) {
  const s = 'INSERT INTO signatures (name, nationalid, comment,anonymous) VALUES ($1, $2, $3, $4);';
  const values = [data.name, data.kt, data.ath, data.hidden];
  return query(s, values);
}

async function count() {
  const c = await query('SELECT * FROM signatures;');
  return c.rows.length;
}

async function findByUsername(username) {
  const q = 'SELECT * FROM users WHERE username = $1';
  const result = await query(q, [username]);

  if(result.rowCount === 1) {
    return result.rows[0];
  }

  return null;
}

export const db = { select, insert, query, count, findByUsername };
