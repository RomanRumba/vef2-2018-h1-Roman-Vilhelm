/* -------------------------------------------------
   ------------------Requires START ----------------
   ------------------------------------------------- */

const passport = require('passport');


/* -------------------------------------------------
   ------------------Requires END  -----------------
   ------------------------------------------------- */

/* -------------------------------------------------
   ------- FUNCTION DECLERATION START --------------
   ------------------------------------------------- */

/* þarf að sjá um að gefa tokens til notendans */
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
      return next();
    },
  )(req, res, next);
}

/* Notkun : checkValidID(id)
   Fyrir  : id er heiltala stærri en 0
   Eftir  : skilar satt ef talan er lögleg annars ósatt */
function checkValidID(id) {
  const parsedID = parseFloat(id, 10);
  // disable hér eslint því því líkar ekki við isNaN
  if (isNaN(parsedID) || !Number.isInteger(parsedID) || parsedID <= 0) { // eslint-disable-line
    return false;
  }
  return true;
}

/* -------------------------------------------------
   ------- FUNCTION DECLERATION END  ---------------
   ------------------------------------------------- */

// -----------------------------Exporta föllin min ----------
module.exports = {
  requireAuthentication,
  checkValidID,
};
