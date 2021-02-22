import dotenv from 'dotenv';
import fs from 'fs';
import util from 'util';
import pg from 'pg';
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
  console.info(`Set upp notendur á gagnagrunn á ${connectionString}`);
  // droppa töflu ef til
  await query('DROP TABLE IF EXISTS users');
  console.info('Töflu eytt');

  // búa til töflu út frá skema
  try {
    await query ('CREATE TABLE users (id serial primary key, username character varying(255) unique not null, password character varying(255) not null);');
    console.info('Tafla búin til');
  } catch (e) {
    console.error('Villa við að búa til töflu:', e.message);
    return;
  }

  // bæta færslum við töflu
  try {
    await query("TRUNCATE TABLE users;");
    const hashedPassword = await bcrypt.hash('123', 11);
    const q = 'INSERT INTO users (username, password) VALUES ($1, $2)'
    const values = ['admin', hashedPassword];

    await query(q, values);

/*
    for(let i = 0; i<500; i++) {
      const name = faker.fake("{{name.firstName}} {{name.lastName}}");
      const kt = Math.floor(100000000 + Math.random() * 900000000);
      const ath = Math.random() < 0.5 ? faker.lorem.sentence() : "";
      const anonymous = Math.random() < 0.5 ? true : false;
      const signed = new Date(faker.date.between(twoWeeksAgo, today));
      

      const s = 'INSERT INTO signatures (name, nationalid, comment, anonymous, signed) VALUES ($1, $2, $3, $4, $5);';
      const values = [name, kt, ath, anonymous, signed];
      await query(s, values);
    }*/
    console.info('Gögnum bætt við');
  } catch (e) {
    console.error('Villa við að bæta gögnum við:', e.message);
  }
}

main().catch((err) => {
  console.error(err);
});
