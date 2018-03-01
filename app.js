/* -------------------------------------------------
   ------------------Requires START ----------------
   ------------------------------------------------- */

require('dotenv').config();
const express = require('express');
const passport = require('passport');
const { Strategy, ExtractJwt } = require('passport-jwt');
const jwt = require('jsonwebtoken');
const users = require('./users');
const books = require('./books');
const auth = require('./authentication');
const db = require('./dbData');

/* -------------------------------------------------
   ------------------Requires END ------------------
   ------------------------------------------------- */

/* -------------------------------------------------
   ---------------- Init START ---------------------
   ------------------------------------------------- */

const app = express();
app.use(express.json());
app.use(users);
app.use(books);
app.use(authentication);
app.use(dbData);

/* Stillingar fyrir vefþjón
   PORT : á hvaða porti er hlustað
   JWT_SECRET : dulkóðun fyrir upplýsingar
   TOKEN_LIFETIME : liftimi tókens sem notandi fær */
const {
  PORT: port = 3000, // sótt úr .env skjali ef ekki skilgreind þá default 3000
  /* !!!!!!!!!! NOTICE ÞEGAR ÞAÐ ÞARF AÐ KOMA ÞESSU Á HEROKU ÞARF AÐ STILLA ÞESSA BREYTUR !!!!! */
  JWT_SECRET: jwtSecret, // sótt úr .env skali
  /* !!!!!!!!!! NOTICE ÞEGAR ÞAÐ ÞARF AÐ KOMA ÞESSU Á HEROKU ÞARF AÐ STILLA ÞESSA BREYTUR !!!!! */
  TOKEN_LIFETIME: tokenLifetime = 20,// sótt úr .env skjali ef ekki skilgreind þá default 20 sem er 20 seconds
} = process.env;

/* Ef það er ekki til dulkóðun fyrir upplýsingar þá er drept á vefþjónustuni */
if (!jwtSecret) {
  console.error('JWT_SECRET not registered in .env');
  process.exit(1);
}

/* -------------------------------------------------
   ----------------- Init END ----------------------
   ------------------------------------------------- */




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
function errorHandler(err, req, res, next) {
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


/*---------------------INIT SERVER --------------------------- */

app.listen(port, () => {
  console.info(`Server running at http://${host}:${port}/`);
});
