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
    SELECT username, name, imgPath 
    FROM users
    ORDER BY id
    OFFSET $1
    LIMIT $2`, [
    xss(offset),
    xss(limit),
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
async function getUser(id) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    SELECT username, name, imgPath 
    FROM users
    WHERE id = $1`, [
    xss(id),
  ]);
  await client.end();
  return result.rows;
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
    password = $2,
    WHERE id = $3`, [
    xss(name),
    xss(password),
    xss(id),
  ]);
  await client.end();
  return result.rows;
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
    SELECT id, title, author, description, isbn10, isbn13, published, pagecount, language, category 
    FROM books
    JOIN booksRead ON books.id = booksRead.bookID
    WHERE booksRead.userID = $1
    ORDER BY id
    OFFSET $2
    LIMIT $3`, [
    xss(id),
    xss(offset),
    xss(limit),
  ]);
  await client.end();
  return result.rows;
}

/* /users/me/read
     -GET skilar síðu af lesnum bókum innskráðs notanda
     -POST býr til nýjan lestur á bók og skilar */
// nota getReadBooks

/* /users/me/read/:id
      -DELETE eyðir lestri bókar fyrir innskráðann notanda */

/**
 * Read all books read by user.
 *
 * @param {int} id - id of user
 * @param {int} offset -offset for query
 * @param {int} limit - limit for query
 *
 * @returns {Promise} Promise representing an array of offset and limited book objects
 */
async function deleteReadBook(userID, bookID) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    DELETE FROM booksRead
    WHERE userID = $1
    AND bookID = $2`, [
    xss(userID),
    xss(bookID),
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
    imgPath = $1,
    WHERE id = $2`, [
    xss(imgPath),
    xss(id),
  ]);
  await client.end();
  return result.rows;
}

/* þarf að exporta þetta er Route */

module.exports = {
  getUsers,
  getUser,
  updateUser,
  getReadBooks,
  deleteReadBook,
  updateImgPath,
};