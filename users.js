/* -------------------------------------------------
   ------------------Requires START ----------------
   ------------------------------------------------- */

const passport = require('passport');
const express = require('express');

const {
  PORT: port = 3000, // sótt úr .env skjali ef ekki skilgreind þá default 3000
  HOST: host = '127.0.0.1', // sótt úr .env skjali  ef ekki til þá notar 127.0.0.1
} = process.env;

const {
  getUsers,
  getUserById,
  updateUser,
  getReadBooks,
  hasReadBook,
  readBook,
  updateImgPath,
} = require('./DUsers');

const {
  getBook,
} = require('./DBooks');

const router = express.Router();
router.use(fileUpload());

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

/* Notkun : validatePassAndName(password , name)
   Fyrir  : password er strengur sem verður að vera amk 6 stafir
            name er strengur má ekki vera tómur
   Efitir : skilar fylki af json obj sem gefa tilkynna ef
            það var brotið reglur um name og password */
function validatePassAndName(password, name) {
  const error = [];
  // chekka ef nafn er strengur og hvort hann er tómur
  if (typeof name !== 'string' || name === '') {
    error.push({ field: 'Name', error: 'Name has to be a Non-Empty string' });
  }
  // chekka ef password er strengur og stafafjölda >= 6
  if (typeof password !== 'string' || password.length < 6) {
    error.push({ field: 'Password', error: 'Password has to be a string and of lenght of bigger than or equal 6' });
  }
  return error;
}

/* Notkun : getUsersReadBooks(id, limit, offset)
   Fyrir  : id er heiltala stærra en 0
            limit er heiltala stærri en 0
            offset er heiltala
   Eftir  : skilar fylki af json obj af 10 lestum bókum notandans
            ásmat slóð til að fá næstu 10  */
async function getUsersReadBooks(id, limit, offset) {
  const userBooks = await getReadBooks(id, offset, limit);
  const result = {
    _links: {
      self: {
        href: `http://${host}:${port}/users/${id}/read?offset=${offset}&limit=${limit}`,
      },
    },
    items: userBooks,
  };
  if (offset > 0) {
    result._links.prev = {
      href: `http://${host}:${port}/users/${id}/read?offset=${Math.max(offset - limit, 0)}&limit=${limit}`,
    };
  }
  if (userBooks.length >= limit) {
    result._links.next = {
      href: `http://${host}:${port}/users/${id}/read?offset=${Number(offset) + Number(limit)}&limit=${limit}`,
    };
  }
  return result;
}

/* -------------------------------------------------
   ------- FUNCTION DECLERATION END ----------------
   ------------------------------------------------- */

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
router.get('/', async (req, res) => {
  const { offset = 0, limit = 10 } = req.query;
  const users = await getUsers(offset, limit);

  const result = {
    _links: {
      self: {
        href: `http://${host}:${port}/users?offset=${offset}&limit=${limit}`,
      },
    },
    items: users,
  };
  if (offset > 0) {
    result._links.prev = {
      href: `http://${host}:${port}/users?offset=${offset - limit}&limit=${limit}`,
    };
  }
  if (users.length >= limit) {
    result._links.next = {
      href: `http://${host}:${port}/users?offset=${Number(offset) + Number(limit)}&limit=${limit}`,
    };
  }
  res.status(200).json(result);
});

/* /users/me
     -GET skilar innskráðum notanda (þ.e.a.s. þér) */
router.get('/me', requireAuthentication, async (req, res) => {
  return res.status(200).json(req.user);
});

/* /users/me
     -PATCH uppfærir sendar upplýsingar um notanda fyrir utan notendanafn,
      þ.e.a.s. nafn eða lykilorð, ef þau eru gild */
router.patch('/me', requireAuthentication, async (req, res) => {
  const { password, name } = req.body;
  const errors = validatePassAndName(password, name);
  if (errors.length > 0) {
    return res.status(400).json(errors);
  }
  const result = await updateUser(req.user.id, { name, password });
  return res.status(200).json(result);
});

/* /users/me/read
     -GET skilar síðu af lesnum bókum innskráðs notanda */
router.get('/me/read', requireAuthentication, async (req, res) => {
  const { offset = 0, limit = 10 } = req.query;
  res.status(200).json(await getUsersReadBooks(req.user.id, offset, limit));
});

/* /users/me/read
     -POST býr til nýjan lestur á bók og skilar */
router.post('/me/read', requireAuthentication, async (req, res) => {
  const { bookId, bookRating, review } = req.body;
  const book = await getBook(bookId);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const userReadBook = await hasReadBook(req.user.id, bookId);
  if (userReadBook) {
    return res.status(400).json({ error: 'You have already Read this Book' });
  }

  if (bookRating < 1 || bookRating > 5) {
    return res.status(400).json({ error: 'Rating has to be a number between 1 and 5' });
  }

  const userRead = await readBook(req.user.id, bookId, bookRating, review);
  return res.status(200).json(userRead);
});

/* /users/:id
    -GET skilar stökum notanda ef til
     Lykilorðs hash skal ekki vera sýnilegt */
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const user = await getUserById(id);
  // ef user id er ekki til þá skila villu
  if (!user) {
    return res.status(404).json({ error: 'Id does not exist' });
  }
  // ef notandi er til þá skilum honum
  return res.status(200).json(user);
});

/* /users/:id/read
     -GET skilar síðu af lesnum bókum notanda */
router.get('/:id/read', async (req, res) => {
  const { id } = req.params;
  const user = await getUserById(id);
  // ef user id er ekki til þá skila villu
  if (!user) {
    return res.status(404).json({ error: 'Id does not exist' });
  }
  // ef komin hingað þá þyðir það að user id er til þá getum haldið áfram
  const { offset = 0, limit = 10 } = req.query;
  res.status(200).json(await getUsersReadBooks(id, offset, limit));
});

/* /users/me/read/:id
      -DELETE eyðir lestri bókar fyrir innskráðann notanda */
router.delete('/me/read', requireAuthentication, async (req, res) => {
  const { id } = req.params;
});


// --------------- Export Router ----------------------

module.exports = router;
