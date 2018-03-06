/* -------------------------------------------------
   ------------------Requires START ----------------
   ------------------------------------------------- */

const passport = require('passport');
const express = require('express');

const router = express.Router();
/* -------------------------------------------------
   ------------------Requires END ------------------
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
      next();
    }) (req, res, next);
}

/* -------------------------------------------------
   ------- FUNCTION DECLERATION END ----------------
   ------------------------------------------------- */

router.get('/admin', requireAuthentication, (req, res) => {
  res.json({ data: 'top secret' });
});
/* Fyrir notanda sem ekki er skráður er inn skal vera hægt að:
   -Skoða allar bækur og flokka
   -Leita að bókum */

/* Fyrir innskráðan notanda skal einnig vera hægt að:
   -Uppfæra upplýsingar um sjálfan sig
   -Skrá nýja bók
   -Uppfæra bók
   -Skrá nýjan flokk
   -Skrá lestur á bók
   -Eyða lestur á bók */

/* /users
     -GET skilar síðu (sjá að neðan) af notendum
     -Lykilorðs hash skal ekki vera sýnilegt */

/* /users/:id
    -GET skilar stökum notanda ef til
     Lykilorðs hash skal ekki vera sýnilegt */

/* /users/me
     -GET skilar innskráðum notanda (þ.e.a.s. þér)
     -PATCH uppfærir sendar upplýsingar um notanda fyrir utan notendanafn,
      þ.e.a.s. nafn eða lykilorð, ef þau eru gild */

/* /users/:id/read
     -GET skilar síðu af lesnum bókum notanda */

/* /users/me/read
     -GET skilar síðu af lesnum bókum innskráðs notanda
     -POST býr til nýjan lestur á bók og skilar */

/* /users/me/read/:id
      -DELETE eyðir lestri bókar fyrir innskráðann notanda */

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

/* þarf að exporta þetta er Route */

// --------------- Export Router ----------------------

module.exports = router;
