/* -------------------------------------------------
   ------------------Requires START ----------------
   ------------------------------------------------- */

const jwt = require('jsonwebtoken');
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
  getUserByUsername,
} = require('./DUsers');

/* þarf að gera nokkrar endurtekningar til að aðskilja föll og virkni frá app.js */
const {
  JWT_SECRET: jwtSecret, // sótt úr .env skali
  // sótt úr .env skjali ef ekki skilgreind þá default 20 sem er 20 seconds
  TOKEN_LIFETIME: tokenLifetime = 20,
} = process.env;

const jwtOptions = {
  /* is a string or buffer containing the secret (symmetric)
  or PEM-encoded public key (asymmetric) for verifying the token's signature */
  secretOrKey: jwtSecret,
};

const router = express.Router();

/* -------------------------------------------------
   ------------------Requires END ------------------
   ------------------------------------------------- */

/* -------------------------------------------------
   ---------- FUNCTION DECLARATION START -----------
   ------------------------------------------------- */

/* Notkun : comparePasswords(hash, password)
   Fyrir  : hash - data to compare
            passowrd - data to be compared to
   Eftir  : skilar satt ef lýkillorðið passaði annars ósatt */
async function comparePasswords(hash, password) {
  const result = await bcrypt.compare(hash, password);
  return result;
}

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

/* -------------------------------------------------
   ---------- FUNCTION DECLARATION END -------------
   ------------------------------------------------- */

/* -------------------------------------------------
   ---------- ROUTER DECLARATION START -------------
   ------------------------------------------------- */

/* /register
     POST býr til notanda og skilar án lykilorðs hash */
router.post('/register', async (req, res) => {
  const { username, password, name, imgPath } = req.body;
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
    name,
    imgPath,
  };
  const data = await createUser(usrInfo);
  const output = {
    Message: 'User was created!',
    Id: data.id,
    Username: data.username,
    Name: data.name !== '' ? data.name : null,
    ImgPath: data.imgpath !== '' ? data.imgpath : null,
  };
  return res.status(201).json(output);
});

/* /login
   POST með notendanafni og lykilorði skilar token */
router.post('/login', async (req, res) => {
  // næ i notendanafn og lykill orð úr body
  const { username, password } = req.body;
  /*  útaf öll nöfn eru einstök i gagnagruni þá er hægt
      að leita af notenda með nafni mun skila alltaf 1 eða ekkert */
  const user = await getUserByUsername(username);
  /* ef það var skilað tómu rows þá er notandanafnið ekki til
        og það er skilað json með error ásamt 401 status kóða */
  if (!user) {
    return res.status(401).json({ error: 'No such user' });
  }
  /* kallað á comparePasswords sem mun auðkenna hvort passwordið sem
       sem slegið var inn er löglegt */
  const passwordIsCorrect = await comparePasswords(password, user.password);
  if (passwordIsCorrect) {
    const payload = { id: user.id };
    const tokenOptions = { expiresIn: tokenLifetime };
    const token = jwt.sign(payload, jwtOptions.secretOrKey, tokenOptions);
    return res.json({ token });
  }
  // ef notandi er ekki til þá er skilað json með error ásamt 401 status kóða
  return res.status(401).json({ error: 'Invalid password' });
});

/* -------------------------------------------------
   ---------- ROUTER DECLARATION END ---------------
   ------------------------------------------------- */

// --------------- Export Router ----------------------

module.exports = router;
