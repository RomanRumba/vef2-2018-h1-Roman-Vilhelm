const { Client } = require('pg');
const xss = require('xss');

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:Pass.3219@localhost:5432/vef2h1';

/* Þarf að utbúa sql fyrirspurnir fyrir gagnagrunsvirkni */

/* /categories
    -GET skilar síðu af flokkum
    -POST býr til nýjan flokk og skilar */

/**
 * create a category asynchronously.
 *
 * @param {string} name - Name of category
 *
 * @returns {Promise} Promise representing the object result of creating the note
 */
async function createCategory(name) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query('UPDATE notes SET title = $2, text = $3, datetime = $4 where id = $1 returning id, title, text, datetime', [
    xss(id),
    xss(title),
    xss(text),
    xss(datetime),
  ]);
  await client.end();
  return result.rows;
}

/* /books
     -GET skilar síðu af bókum
     -POST býr til nýja bók ef hún er gild og skilar 
      Fyrir fyrirspurnir sem skila listum af gögnum þarf að _page_a þau gögn. 
      Þ.e.a.s. að sækja aðeins takmarkað magn úr heildarlista í einu og láta vita af næstu síðu. */

/* /books?search=query
     -GET skilar síðu af bókum sem uppfylla leitarskilyrði, sjá að neðan */

/* /books/:id
     -GET skilar stakri bók
     -PATCH uppfærir bók */


/* þarf að exporta þetta er Route */
module.exports = {
    create,
    readAll,
    readOne,
    update,
    del,
  };