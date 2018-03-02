/* -------------------------------------------------
   ------------------Requires START ----------------
   ------------------------------------------------- */

const passport = require('passport');
const bcrypt = require('bcrypt');
const express = require('express');
const jwt = require('jsonwebtoken');
const users = require('./DAuth');

/* -------------------------------------------------
   ------------------Requires START ----------------
   ------------------------------------------------- */

const router = express.Router();

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

/* Notkun : comparePasswords(hash, password)
   Fyrir  : hash - data to compare
            passowrd - data to be compared to
   Eftir  : skilar satt ef lýkillorðið passaði annars ósatt */
async function comparePasswords(hash, password) {
  const result = await bcrypt.compare(hash, password);
  return result;
}

/* /register
     POST býr til notanda og skilar án lykilorðs hash */

/* /login
     POST með notendanafni og lykilorði skilar token */
router.post('/login', async (req, res) => {
  // næ i notendanafn og lykill orð úr body
  const { username, password } = req.body;
  /*  útaf öll nöfn eru einstök i gagnagruni þá er hægt
  að leita af notenda með nafni mun skila alltaf 1 eða ekkert */
  const user = await users.userExists(username);
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

/* Útfæra þarf middleware sem passar upp á slóðir sem eiga að vera læstar
   séu læstar nema token sé sent með í Authorization haus í request. */

/* þarf að sjá um að taka við tokens frá notendanum og validate þau */

/* þarf að sjá um að gefa tokens til notendans */


/* þarf að exporta þetta er Route */
module.exports = router;
