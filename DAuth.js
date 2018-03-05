require('dotenv').config();

const { Client } = require('pg');
const xss = require('xss');

const connectionString = process.env.DATABASE_URL;

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
/*
createUser({
  username: 'uname',
  password: 'pass',
  name: 'nafn',
  imgPath: '/',
});
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
  return result.rows[0];
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
async function getUser(username) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
    SELECT id, username, password, name, imgPath 
    FROM users
    WHERE username = $1`, [
    xss(username),
  ]);
  await client.end();
  return result.rows[0];
}

/**
 * Do username and password correspond?
 *
 * @returns {Promise} Promise representing a boolean representing whether the login succeeded.
 */
async function login(username, password) {
  const client = new Client({ connectionString });
  await client.connect();
  const result = await client.query(`
  SELECT id
  FROM users
  WHERE username = $1
  AND password = $2`, [
    xss(username),
    xss(password),
  ]);
  await client.end();
  return result.rows > 0;
}

module.exports = {
  createUser,
  userExists,
  getUser,
  login,
};
