/* -------------------------------------------------
   ------------------Requires START ----------------
   ------------------------------------------------- */

const passport = require('passport');
const bcrypt = require('bcrypt');
const express = require('express');
const {
  createUser,
  userExists,
} = require('./DAuth');

/* -------------------------------------------------
   ------------------Requires START ----------------
   ------------------------------------------------- */

const router = express.Router();

/* Útfæra þarf middleware sem passar upp á slóðir sem eiga að vera læstar
   séu læstar nema token sé sent með í Authorization haus í request. */
/* Notkun : requireAuthentication(req, res, next)
   Fyrir  : Fyrir  : -req er lesanlegur straumur sem gefur
             okkur aðgang að upplýsingum um HTTP request frá client.
            -res er skrifanlegur straumur sem sendur verður til clients.
            -next er næsti middleware i keðjuni.
   Eftir  : athugar hvort aðili er skráður inn ef hann er skráður inn þá er kallað
            á næsta fall i middleware keðjuni annars það er skilað json string með villu */
function requireAuthentication(req, res, next) {
  return passport.authenticate(
    'jwt',
    { session: false },
    (err, user, info) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        const error = info.name === 'TokenExpiredError' ? 'expired token' : 'invalid token';
        return res.status(401).json({ error });
      }

      req.user = user;
      next();
    }
  ) (req, res, next);
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


router.get('/admin', requireAuthentication, (req, res) => {
  res.json({ data: 'top secret' });
});
/* þarf að sjá um að taka við tokens frá notendanum og validate þau */

/* þarf að sjá um að gefa tokens til notendans */


/* þarf að exporta þetta er Route */
module.exports = router;
