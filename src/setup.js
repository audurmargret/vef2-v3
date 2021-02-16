import dotenv from 'dotenv';
import fs from 'fs';
import util from 'util';
import pg from 'pg';
import faker from 'faker';

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
  await query('DROP TABLE IF EXISTS applications');
  console.info('Töflu eytt');

  // búa til töflu út frá skema
  try {
    const createTable = await readFileAsync('./schema.sql');
    await query(createTable.toString('utf8'));
    console.info('Tafla búin til');
  } catch (e) {
    console.error('Villa við að búa til töflu:', e.message);
    return;
  }

  // bæta færslum við töflu
  try {
    await query("TRUNCATE TABLE signatures;");
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
    console.info('Gögnum bætt við');
  } catch (e) {
    console.error('Villa við að bæta gögnum við:', e.message);
  }
}

main().catch((err) => {
  console.error(err);
});
