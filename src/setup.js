import dotenv from 'dotenv';
import fs from 'fs';
import util from 'util';
import pg from 'pg';
import faker from 'faker';
import bcrypt from 'bcrypt';

dotenv.config();

const { Client } = pg;

const connectionString = process.env.DATABASE_URL;

const readFileAsync = util.promisify(fs.readFile);

async function query(q, values=[]) {
  const client = new Client({ connectionString });

  await client.connect();

  try {
    const result = await client.query(q, values);

    const { rows } = result;
    return rows;
  } finally {
    await client.end();
  }
}

async function main() {
  console.info(`Set upp gagnagrunn á ${connectionString}`);
  // droppa töflu ef til
  await query('DROP TABLE IF EXISTS signatures');
  await query('DROP TABLE IF EXISTS users');

  console.info('Töflum eytt');

  // búa til töflu út frá skema
  try {
    const createTable = await readFileAsync('./schema.sql');
    await query(createTable.toString('utf8'));

    await query ('CREATE TABLE users (id serial primary key, username varchar(255) unique not null, password varchar(255) not null);');
    console.info('Töflur búnar til');
  } catch (e) {
    console.error('Villa við að búa til töflur:', e.message);
    return;
  }

  // bæta færslum við töflu
  try {
    await query("TRUNCATE TABLE signatures;");
    await query("TRUNCATE TABLE users;");

    const today = new Date();
    const twoWeeksAgo = new Date(Date.now()- 12096e5);
    for(let i = 0; i<500; i++) {
      const name = faker.fake("{{name.firstName}} {{name.lastName}}");
      const kt = Math.floor(100000000 + Math.random() * 900000000);
      const ath = Math.random() < 0.5 ? faker.lorem.sentence() : "";
      const anonymous = Math.random() < 0.5 ? true : false;
      const signed = new Date(faker.date.between(twoWeeksAgo, today));
      

      const s = 'INSERT INTO signatures (name, nationalid, comment, anonymous, signed) VALUES ($1, $2, $3, $4, $5);';
      const values = [name, kt, ath, anonymous, signed];
      await query(s, values);
    }

    const hashedPassword = await bcrypt.hash('123', 11);
    const q = 'INSERT INTO users (username, password) VALUES ($1, $2)'
    const values = ['admin', hashedPassword];
    await query(q, values);


    console.info('Gögnum bætt við');
  } catch (e) {
    console.error('Villa við að bæta gögnum við:', e.message);
  }
}

main().catch((err) => {
  console.error(err);
});
