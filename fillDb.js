/* NOTICE !!!
   þetta er stand alone skjal sem á að vera keyrt einusinni */


/* Sér um að búa til gagna grun úr schema.sql 
   og svo setja gögn i hana frá book.cvs sem er i data skjali */

require('dotenv').config();

const fs = require('fs');
const util = require('util');

const { Client } = require('pg');

const csv = require('csvtojson');

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:Pass.3219@localhost:5432/vef2h1';

const readFileAsync = util.promisify(fs.readFile);

const schemaFile = './schema.sql';

async function schema(q) {
  const client = new Client({ connectionString });

  await client.connect();

  try {
    const result = await client.query(q);

    const { rows } = result;
    return rows;
  } catch (err) {
    console.error('Error running query');
    throw err;
  } finally {
    await client.end();
  }
}

async function insertBooks(books) {
  const client = new Client({ connectionString });
  await client.connect();
  for (let i = 0; i < books.length; i += 1) {
    await client.query('INSERT INTO books(title,author,description,isbn10,isbn13,published,pagecount,language,category) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)', [ // eslint-disable-line
      books[i].title,
      books[i].author,
      books[i].description,
      books[i].isbn10,
      books[i].isbn13,
      books[i].published,
      parseInt(books[i].pagecount, 10) ? parseInt(books[i].pagecount, 10) : null,
      books[i].language,
      books[i].category,
    ]);
  }
  await client.end();
}

async function readCSVandInsertBooks(file) {
  const rows = [];

  csv().fromFile(file).on('json', (data) => {
    rows.push(data);
  }).on('done', async (error) => {
    if (error) {
      console.error('Error: ', error);
      return null;
    }
    await insertBooks(rows);
  });
}

async function create() {
  const data = await readFileAsync(schemaFile);

  // búa til gagnagrunninn
  await schema(data.toString('utf-8'));

  console.info('Schema created');

  await readCSVandInsertBooks('./data/books.csv');

  console.info('Data inserted');
}

create().catch((err) => {
  console.error('Error creating schema', err);
});
