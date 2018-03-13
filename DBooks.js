require('dotenv').config();

const { Client } = require('pg');
const xss = require('xss');

const connectionString = process.env.DATABASE_URL;

// books

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
    VALUES($1)
    RETURNING id`, [
    xss(name),
  ]);
  await client.end();
  return result.rowCount === 1 ? result.rows[0] : null;
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
 * Does the category existss.
 *
 * @returns {Promise} Promise representing a boolean representing whether the category exists
 */
async function categoryExists(category) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    SELECT id
    FROM categories
    WHERE id = $1`, [
    xss(category),
  ]);
  await client.end();
  return result.rowCount > 0;
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
  author = null,
  description = null,
  isbn10 = null,
  isbn13,
  published = null,
  pagecount = null,
  language = null,
  category,
} = {}) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    INSERT INTO books(title,author,description,isbn10,isbn13,published,pagecount,language,category) 
    VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) 
    RETURNING id,title,author,description,isbn10,isbn13,published,pagecount,language,category `, [
    xss(title),
    xss(author),
    xss(description),
    xss(isbn10),
    xss(isbn13),
    xss(published),
    parseInt(xss(pagecount), 10) ? parseInt(xss(pagecount), 10) : null,
    xss(language),
    xss(category),
  ]);
  await client.end();
  return result.rowCount === 1 ? result.rows[0] : null;
}

/**
 * Read all books.
 *
 * @param {int} offset -offset for query
 * @param {int} limit - limit for query
 *
 * @returns {Promise} Promise representing an array of offset and limited book objects
 */
async function getBooks(offset = 0, limit = 10) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    SELECT id, title, author, description, isbn10, isbn13, published, pagecount, language, category 
    FROM books
    ORDER BY id
    OFFSET $1
    LIMIT $2`, [
    offset === 0 ? 0 : xss(offset), // ef offset = 0, þá mun xss breyta honum í tíma strenginn
    limit === 0 ? 0 : xss(limit), // ef limit = 0, þá mun xss breyta honum í tíma strenginn,
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
async function bookSearch(search = '', offset = 0, limit = 10) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    SELECT id,title,author,description,isbn10,isbn13,published,pagecount,language,category 
    FROM books
    WHERE to_tsvector('english', title) @@ to_tsquery('english', $1)
    OR to_tsvector('english', description) @@ to_tsquery('english', $1)
    ORDER BY id
    OFFSET $2
    LIMIT $3`, [
    xss(search),
    offset === 0 ? 0 : xss(offset), // ef offset = 0, þá mun xss breyta honum í tíma strenginn
    limit === 0 ? 0 : xss(limit), // ef limit = 0, þá mun xss breyta honum í tíma strenginn
  ]);
  await client.end();
  return result.rows;
}

/**
 * get a book.
 *
 * @param {int} id - id of book to read
 *
 * @returns {Promise} Promise representing a book object
 */
async function getBook(id) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    SELECT id,title,author,description,isbn10,isbn13,published,pagecount,language,category 
    FROM books
    WHERE id = $1`, [
    xss(id),
  ]);
  await client.end();
  return result.rowCount === 1 ? result.rows[0] : null;
}

/**
 * update a book asynchronously.
 *
 * @param {id} id - Id of book to update
 * @param {Object} book - book to update
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
    category = $9
    WHERE id = $10
    RETURNING title, author, description, isbn10, isbn13, published, pagecount, language, category`, [
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
  return result.rowCount === 1 ? result.rows[0] : null;
}

/**
 * Does the book title exist.
 *
 * @param {string} title - username of user
 *
 * @returns {Promise} Promise representing a boolean representing whether the book title exists
 */
async function bookTitleExists(title) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
  SELECT title
  FROM books
  WHERE title = $1`, [
    xss(title),
  ]);
  await client.end();
  return result.rowCount > 0;
}

/**
 * Does the book exist.
 *
 * @param {string} id - username of user
 *
 * @returns {Promise} Promise representing a boolean representing whether the book id exists
 */
async function bookIdExists(id) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
  SELECT id
  FROM books
  WHERE id = $1`, [
    xss(id),
  ]);
  await client.end();
  return result.rowCount > 0;
}

module.exports = {
  categoryExists,
  createCategory,
  getCategories,
  createBook,
  getBooks,
  getBook,
  bookSearch,
  updateBook,
  bookTitleExists,
  bookIdExists,
};
