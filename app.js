/* -------------------------------------------------
   ------------------Requires START ----------------
   ------------------------------------------------- */

require('dotenv').config();

const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Strategy, ExtractJwt } = require('passport-jwt');

const auth = require('./authentication');
const books = require('./books');
const userAth = require('./DAuth');
const userDB = require('./DUsers');

// const users = require('./users');
// const books = require('./books');

/* -------------------------------------------------
   ------------------Requires END ------------------
   ------------------------------------------------- */

/* -------------------------------------------------
   ---------------- Init START ---------------------
   ------------------------------------------------- */

const app = express();
app.use(express.json());
app.use(auth);
app.use(books);

/* Stillingar fyrir vefþjón
   PORT : á hvaða porti er hlustað
   JWT_SECRET : dulkóðun fyrir upplýsingar
   TOKEN_LIFETIME : liftimi tókens sem notandi fær */
const {
  PORT: port = 3000, // sótt úr .env skjali ef ekki skilgreind þá default 3000
  HOST: host = '127.0.0.1', // sótt úr .env skjali  ef ekki til þá notar 127.0.0.1 
  /* !!!!!!!!!! NOTICE ÞEGAR ÞAÐ ÞARF AÐ KOMA ÞESSU Á HEROKU ÞARF AÐ STILLA ÞESSA BREYTUR !!!!! */
  JWT_SECRET: jwtSecret, // sótt úr .env skali
  /* !!!!!!!!!! NOTICE ÞEGAR ÞAÐ ÞARF AÐ KOMA ÞESSU Á HEROKU ÞARF AÐ STILLA ÞESSA BREYTUR !!!!! */
  // sótt úr .env skjali ef ekki skilgreind þá default 20 sem er 20 seconds
  TOKEN_LIFETIME: tokenLifetime = 20,
} = process.env;

app.use(express.urlencoded({ extended: true }));

/* Ef það er ekki til dulkóðun fyrir upplýsingar þá er drept á vefþjónustuni */
if (!jwtSecret) {
  console.error('JWT_SECRET not registered in .env');
  process.exit(1);
}

/* -------------------------------------------------
   ----------------- Init END ----------------------
   ------------------------------------------------- */

/* -------------------------------------------------
   ----------------- PASSPORT START ----------------
   ------------------------------------------------- */

const jwtOptions = {
  // býr til nýjan búnað sem leitar eftir JWT i "authorization headder" með 'bearer' schemið
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  /* is a string or buffer containing the secret (symmetric)
  or PEM-encoded public key (asymmetric) for verifying the token's signature */
  secretOrKey: jwtSecret,
};

/* Notkun : start(data,next)
   Fyrir  : data json obj
            next er kall á næsta fallið i middleware keðjuni
   Eftir  : skilar notenda á næsta falli i middleware keðjuni ef hann er til
            annars skilað false á næsta fallið i middleware keðjuni */
async function strat(data, next) {
  const user = await userDB.getUser(data.id);
  if (user) {
    next(null, user);
  } else {
    next(null, false);
  }
}

// segjum passport að nota strat stretegiuna til að auðkenna notenda með ásamt jwtOptions stillingum
passport.use(new Strategy(jwtOptions, strat));

app.use(passport.initialize());

/* -------------------------------------------------
   ----------------- PASSPORT END-- ----------------
   ------------------------------------------------- */

/* -------------------------------------------------
   ------------------- LOGGIN START ----------------
   ------------------------------------------------- */

/* Notkun : comparePasswords(hash, password)
   Fyrir  : hash - data to compare
            passowrd - data to be compared to
   Eftir  : skilar satt ef lýkillorðið passaði annars ósatt */
async function comparePasswords(hash, password) {
  const result = await bcrypt.compare(hash, password);
  return result;
}

/* /login
   POST með notendanafni og lykilorði skilar token */
app.post('/login', async (req, res) => {
  // næ i notendanafn og lykill orð úr body
  const { username, password } = req.body;
  /*  útaf öll nöfn eru einstök i gagnagruni þá er hægt
      að leita af notenda með nafni mun skila alltaf 1 eða ekkert */
  const user = await userAth.getUser(username);
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
   --------------------LOGGIN END-------------------
   -------------------------------------------------  */

/* -------------------------------------------------
   ------------Error Functions START----------------
   ------------------------------------------------- */

/* NOTKUN : notFoundHandler(req, res, next)
   Fyrir  : -req er lesanlegur straumur sem gefur
             okkur aðgang að upplýsingum um HTTP request frá client.
            -res er skrifanlegur straumur sem sendur verður til clients.
            -next er næsti middleware i keðjuni.
   Eftir  : skilar status kóða 404 ásamt json skali með attribute error
            sem hefur strengin 'Not found' */
function notFoundHandler(req, res, next) { // eslint-disable-line
  res.status(404).json({ error: 'Not found' });
}

/* NOTKUN : errorHandler(req, res, next)
   Fyrir  : -req er lesanlegur straumur sem gefur
             okkur aðgang að upplýsingum um HTTP request frá client.
            -res er skrifanlegur straumur sem sendur verður til clients.
            -next er næsti middleware i keðjuni.
   Eftir  :  Ef er sent ólöglegt json format þá skilar status kóða 400
             með skali með attribute error sem hefur strengin 'Invalid json'
             annars skilar status kóða 400 með skali með attribute error
             sem hefur strengin 'Internal server error' */
function errorHandler(err, req, res, next) { // eslint-disable-line
  console.error(err);
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {  // eslint-disable-line
    return res.status(400).json({ error: 'Invalid json' });
  }
  return res.status(500).json({ error: 'Internal server error' });
}

app.use(notFoundHandler);
app.use(errorHandler);

/* -------------------------------------------------
   ------------Error Functions END -----------------
   ------------------------------------------------- */


/* ---------------------INIT SERVER --------------------------- */

app.listen(port, () => {
  console.info(`Server running at http://${host}:${port}/`);
});
