const { Client } = require('pg');
const xss = require('xss');

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:Pass.3219@localhost:5432/vef2h1';

/**
 * create a category asynchronously.
 *
 * @param {string} name - Name of category
 *
 * @returns {Promise} Promise representing the object result of creating the category
 */
async function createCategory(name) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    INSERT INTO categories(id)
    VALUES($1)`, [
    xss(name),
  ]);
  await client.end();
  return result.rows;
}

/**
 * Read all categories.
 *
 * @returns {Promise} Promise representing an array of all note objects
 */
async function getCategories() {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    SELECT id 
    FROM categories`);
  await client.end();
  return result.rows;
}

/**
 * create a book asynchronously.
 *
 * @param {Object} book - book to create
 * @param {string} title - title of book
 * @param {string} author - author of book
 * @param {string} description - description of book
 * @param {string} isbn10 - isbn10 of book
 * @param {string} isbn13 - isbn13 of book
 * @param {string} published - published of book
 * @param {int} pagecount - pagecount of book
 * @param {string} language - language of book
 * @param {string} category - category of book
 *
 * @returns {Promise} Promise representing the object result of creating the book
 */
async function createBook({
  title,
  author,
  description,
  isbn10,
  isbn13,
  published,
  pagecount,
  language,
  category,
} = {}) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    INSERT INTO books(title,author,description,isbn10,isbn13,published,pagecount,language,category) 
    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) 
    RETURNING title,author,description,isbn10,isbn13,published,pagecount,language,category `, [
    xss(title),
    xss(author),
    xss(description),
    xss(isbn10),
    xss(isbn13),
    xss(published),
    xss(pagecount),
    xss(language),
    xss(category),
  ]);
  await client.end();
  return result.rows;
}

/**
 * Read all books.
 * 
 * @param {int} offset -offset for query
 * @param {int} limit - limit for query
 *
 * @returns {Promise} Promise representing an array of offset and limited book objects
 */
async function getBooks(offset = 0, limit = null) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    SELECT title,author,description,isbn10,isbn13,published,pagecount,language,category 
    FROM books
    OFFSET $1
    LIMIT $2`, [
    offset,
    limit,
  ]);
  await client.end();
  return result.rows;
}

/**
 * Read all books.
 * @param {string} search - search string for query
 * @param {int} offset -offset for query
 * @param {int} limit - limit for query
 *
 * @returns {Promise} Promise representing an array of offset and limited book objects
 */
async function bookSearch(search, offset = 0, limit = null) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    SELECT title,author,description,isbn10,isbn13,published,pagecount,language,category 
    FROM books
    WHERE to_tsvector('english', title) @@ to_tsquery('english', '$1');
    OFFSET $2,
    LIMIT $3`, [
    search,
    offset,
    limit,
  ]);
  await client.end();
  return result.rows;
}
/**
 * get a book.
 *
 * @param {int} id - id of book to read
 *
 * @returns {Promise} Promise representing an array of offset and limited book objects
 */
async function getBook(id) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    SELECT title,author,description,isbn10,isbn13,published,pagecount,language,category 
    FROM books
    WHERE id = $1`, [
    id,
  ]);
  await client.end();
  return result.rows;
}

/**
 * update a book asynchronously.
 *
 * @param {id} id - Id of book to update
 * @param {Object} book - book to create
 * @param {string} title - title of book
 * @param {string} author - author of book
 * @param {string} description - description of book
 * @param {string} isbn10 - isbn10 of book
 * @param {string} isbn13 - isbn13 of book
 * @param {string} published - published of book
 * @param {int} pagecount - pagecount of book
 * @param {string} language - language of book
 * @param {string} category - category of book
 *
 * @returns {Promise} Promise representing the object result of updating the book
 */
async function updateBook(id, {
  title,
  author,
  description,
  isbn10,
  isbn13,
  published,
  pagecount,
  language,
  category,
} = {}) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    UPDATE books SET 
    title = $1,
    author = $2,
    description = $3,
    isbn10 = $4,
    isbn13 = $5,
    published = $6,
    pagecount = $7,
    language = $8,
    category = $9,
    WHERE id = $10`, [
    xss(title),
    xss(author),
    xss(description),
    xss(isbn10),
    xss(isbn13),
    xss(published),
    xss(pagecount),
    xss(language),
    xss(category),
    xss(id),
  ]);
  await client.end();
  return result.rows;
}

module.exports = {
  createCategory,
  getCategories,
  createBook,
  getBooks,
  getBook,
  bookSearch,
  updateBook,
};
