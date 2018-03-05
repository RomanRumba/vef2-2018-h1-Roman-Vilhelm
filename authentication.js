/* -------------------------------------------------
   ------------------Requires START ----------------
   ------------------------------------------------- */

const express = require('express');
const bcrypt = require('bcrypt');

const {
  // getUsers,
  // getUserById,
  // updateUser,
  // getReadBooks,
  // deleteReadBook,
  // updateImgPath,
  createUser,
  userExists,
  // getUserByUsername,
} = require('./DUsers');

/* -------------------------------------------------
   ------------------Requires END ------------------
   ------------------------------------------------- */

const router = express.Router();

/* Notkun : validateUser(username, passoword)
   Fyrir  : username er str af lengd >= 3
            password er str af lengd >= 6
   Eftir  : skilar fylki af json obj sem gefa tilkynna ef
            það var brotið reglur um username og password */
function validateUser(username, password) {
  const error = [];
  // chekka ef notendanafnið er strengur og stafafjölda >= 3
  if (typeof username !== 'string' || username.length < 3) {
    error.push({ field: 'Username', error: 'Username has to be a string and of lenght of bigger than or equal 3' });
  }
  // chekka ef password er strengur og stafafjölda >= 6
  if (typeof password !== 'string' || password.length < 6) {
    error.push({ field: 'Password', error: 'Password has to be a string and of lenght of bigger than or equal 6' });
  }
  return error;
}

/* /register
     POST býr til notanda og skilar án lykilorðs hash */
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  const error = validateUser(username, password);
  if (error.length > 0) {
    return res.status(400).json(error);
  }
  // chekka ef notendanafnið er til
  const user = await userExists(username);
  if (user) {
    return res.status(401).json({ error: 'This username is already taken please choose another one' });
  }
  // búum til dulkóðað password
  const hashedPassword = await bcrypt.hash(password, 11);
  // svo það er hægt að vera tilbuin fyrir frammtiðina það er hægt að bæta auka
  const usrInfo = {
    username,
    password: hashedPassword,
    name: '',
    imgPath: '/',
  };
  const data = await createUser(usrInfo);
  data.password = password;// spurja ernir
  return res.status(201).json(data);
});

module.exports = router;
