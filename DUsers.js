require('dotenv').config();

const { Client } = require('pg');
const xss = require('xss');

const connectionString = process.env.DATABASE_URL;

/* /users
     -GET skilar síðu (sjá að neðan) af notendum
     -Lykilorðs hash skal ekki vera sýnilegt */

/**
 * Read all users.
 *
 * @param {int} offset -offset for query
 * @param {int} limit - limit for query
 *
 * @returns {Promise} Promise representing an array of offset and limited user objects
 */
async function getUsers(offset = 0, limit = 10) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    SELECT id, username, name, imgPath 
    FROM users
    ORDER BY id
    OFFSET $1
    LIMIT $2`, [
    offset === 0 ? 0 : xss(offset), // ef offset = 0, þá mun xss breyta honum í tíma strenginn
    limit === 0 ? 0 : xss(limit), // ef limit = 0, þá mun xss breyta honum í tíma strenginn,
  ]);
  await client.end();
  return result.rows;
}
/* /users/:id
    -GET skilar stökum notanda ef til
     Lykilorðs hash skal ekki vera sýnilegt */

/**
 * get a user.
 *
 * @param {int} id - id of user to read
 *
 * @returns {Promise} Promise representing an array of offset and limited user objects
 */
async function getUserById(id) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    SELECT id, username, name, imgPath 
    FROM users
    WHERE id = $1`, [
    xss(id),
  ]);
  await client.end();
  return result.rowCount === 1 ? result.rows[0] : null;
}

/* /users/me
     -GET skilar innskráðum notanda (þ.e.a.s. þér)
     -PATCH uppfærir sendar upplýsingar um notanda fyrir utan notendanafn,
      þ.e.a.s. nafn eða lykilorð, ef þau eru gild */

// nota getUser fallið fyrir GET

/**
 * update a user asynchronously.
 *
 * @param {id} id - Id of user to update
 * @param {Object} user - user to update
 * @param {string} name - name of user
 * @param {string} password - password of user
 *
 * @returns {Promise} Promise representing the object result of updating the user
 */
async function updateUser(id, {
  name,
  password,
} = {}) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    UPDATE users SET 
    name = $1,
    password = $2
    WHERE id = $3
    RETURNING username, name`, [
    xss(name),
    xss(password),
    xss(id),
  ]);
  await client.end();
  return result.rowCount === 1 ? result.rows[0] : null;
}


/* /users/:id/read
     -GET skilar síðu af lesnum bókum notanda */

/**
 * Read all books read by user.
 *
 * @param {int} id - id of user
 * @param {int} offset -offset for query
 * @param {int} limit - limit for query
 *
 * @returns {Promise} Promise representing an array of offset and limited book objects
 */
async function getReadBooks(id, offset = 0, limit = 10) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    SELECT books.id, title, author, description, isbn10, isbn13, published, pagecount, language, category 
    FROM books
    JOIN booksRead ON books.id = booksRead.bookID
    WHERE booksRead.userID = $1
    ORDER BY books.id
    OFFSET $2
    LIMIT $3`, [
    xss(id),
    offset === 0 ? 0 : xss(offset), // ef offset = 0, þá mun xss breyta honum í tíma strenginn
    limit === 0 ? 0 : xss(limit), // ef limit = 0, þá mun xss breyta honum í tíma strenginn,
  ]);
  await client.end();
  return result.rows;
}

/* /users/me/read
     -GET skilar síðu af lesnum bókum innskráðs notanda
     -POST býr til nýjan lestur á bók og skilar */

/**
 * Read all books read by user.
 *
 * @param {int} userId - id of user
 * @param {int} bookId - id of book
 * @param {int} rating - rating of book
 * @param {int} review - review of book
 *
 * @returns {Promise} Promise representing an array of offset and limited book objects
 */
async function readBook(userId, bookId, rating, review = null) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    INSERT INTO booksRead(userID, bookID, rating, review)
    VALUES($1, $2, $3, $4)
    RETURNING id, userID, bookID, rating, review`, [
    xss(userId),
    xss(bookId),
    xss(rating),
    xss(review),
  ]);
  await client.end();
  return result.rowCount === 1 ? result.rows[0] : null;
}

/* /users/me/read/:id
      -DELETE eyðir lestri bókar fyrir innskráðann notanda */

/**
 * Read all books read by user.
 *
 * @param {int} id - id of read book entry
 *
 * @returns {Promise} Promise representing an array of offset and limited book objects
 */
async function deleteReadBook(id) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    DELETE FROM booksRead
    WHERE id = $1`, [
    xss(id),
  ]);
  await client.end();
  return result.rows;
}

/* /users/me/profile
     -POST setur eða uppfærir mynd fyrir notanda í gegnum Cloudinary og skilar slóð
      með mynd (.png, .jpg eða .jpeg) í body á request.
      Þar sem ekki er hægt að vista myndir beint á disk á Heroku skal notast við Cloudinary

     Flæði væri:
        Notandi sendir multipart/form-data POST á /users/me/profile með mynd
        Bakendi les mynd úr request, t.d. með multer
        Mynd er send á cloudinary API, sjá Heroku: Cloudinary with node.js
        Ef allt gengur eftir skilar Cloudinary JSON hlut með upplýsingum
        url úr svari er vistað í notenda töflu */

/**
 * update a user image path asynchronously.
 *
 * @param {id} id - Id of book to update
 * @param {string} imgPath - image path of user
 *
 * @returns {Promise} Promise representing the object result of updating the user
 */
async function updateImgPath(id, imgPath) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    UPDATE users SET 
    imgPath = $1
    WHERE id = $2
    RETURNING imgPath`, [
    xss(imgPath),
    xss(id),
  ]);
  await client.end();
  return result.rowCount === 1 ? result.rows[0] : null;
}

// authenication

/**
 * create a user asynchronously.
 *
 * @param {Object} user - user to create
 * @param {string} username - username of user
 * @param {string} password - password of user
 * @param {string} name - name of user
 * @param {string} imgPath - image path for user image
 *
 * @returns {Promise} Promise representing the object result of creatung the user
 */
async function createUser({
  username,
  password,
  name,
  imgPath,
} = {}) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    INSERT INTO users(username, password, name, imgPath) 
    VALUES($1, $2, $3, $4) 
    RETURNING id, username, password, name, imgPath`, [
    xss(username),
    xss(password),
    xss(name),
    xss(imgPath),
  ]);
  await client.end();
  return result.rowCount === 1 ? result.rows[0] : null;
}

/**
 * Does the user existss.
 *
 * @param {string} username - username of user
 *
 * @returns {Promise} Promise representing a boolean representing whether the user exists
 */
async function userExists(username) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
  SELECT id
  FROM users
  WHERE username = $1`, [
    xss(username),
  ]);
  await client.end();
  return result.rowCount > 0;
}

/**
 * get a user.
 *
 * @param {int} username - username of user to read
 *
 * @returns {Promise} Promise representing an array of offset and limited user objects
 */
async function getUserByUsername(username) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    SELECT id, username, password, name, imgPath 
    FROM users
    WHERE username = $1`, [
    xss(username),
  ]);
  await client.end();
  return result.rowCount === 1 ? result.rows[0] : null;
}

/**
 * Has user read the book.
 *
 * @param {int} userId - id of user
 * @param {int} bookId - id of book
 *
 * @returns {Promise} Promise representing a boolean representing whether the user has read the book
 */
async function hasReadBook(userId, bookId) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
  SELECT id
  FROM booksRead
  WHERE userID = $1
  AND bookID = $2`, [
    xss(userId),
    xss(bookId),
  ]);
  await client.end();
  return result.rowCount > 0;
}

/**
 * Has user read the book.
 *
 * @param {int} id - id of user
 *
 * @returns {Promise} Promise representing a boolean representing whether the read book entry exists
 */
async function readBookEntryExists(id) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
  SELECT id
  FROM booksRead
  WHERE id = $1`, [
    xss(id),
  ]);
  await client.end();
  return result.rowCount > 0;
}

module.exports = {
  // users
  getUsers,
  getUserById,
  updateUser,
  getReadBooks,
  readBook,
  deleteReadBook,
  updateImgPath,
  hasReadBook,
  readBookEntryExists,
  // authentication
  createUser,
  userExists,
  getUserByUsername,
};
