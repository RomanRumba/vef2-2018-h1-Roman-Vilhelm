/* -------------------------------------------------
   ------------------Requires START ----------------
   ------------------------------------------------- */
const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary');
const bcrypt = require('bcrypt');

const uploads = multer({ dest: './temp' }); // temp staður fyrir allar myndir

const {
  CLOUDINARY_CLOUD,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
} = process.env;

const {
  getUsers,
  getUserById,
  updateUser,
  getReadBooks,
  hasReadBook,
  readBook,
  updateImgPath,
  deleteReadBook,
  readBookEntryExists,
} = require('./DUsers');

const {
  getBook,
} = require('./DBooks');

const {
  requireAuthentication,
  checkValidID,
} = require('./commonFunctions');

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

const router = express.Router();

/* if (!CLOUDINARY_CLOUD || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  console.log(CLOUDINARY_CLOUD);
  console.log(CLOUDINARY_API_KEY);
  console.log(CLOUDINARY_API_SECRET);
  console.warn('Missing cloudinary config, uploading images will not work');
} */

/* -------------------------------------------------
   ------------------Requires END ------------------
   ------------------------------------------------- */

/* -------------------------------------------------
   ------- FUNCTION DECLERATION START --------------
   ------------------------------------------------- */

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
        href: `/users/${id}/read?offset=${offset}&limit=${limit}`,
      },
    },
    items: userBooks,
  };
  if (offset > 0) {
    result._links.prev = {
      href: `/users/${id}/read?offset=${Math.max(offset - limit, 0)}&limit=${limit}`,
    };
  }
  if (userBooks.length >= limit) {
    result._links.next = {
      href: `/users/${id}/read?offset=${Number(offset) + Number(limit)}&limit=${limit}`,
    };
  }
  return result;
}

/* -------------------------------------------------
   ------- FUNCTION DECLERATION END ----------------
   ------------------------------------------------- */

/* /users
     -GET skilar síðu (sjá að neðan) af notendum
     -Lykilorðs hash skal ekki vera sýnilegt */
router.get('/', async (req, res) => {
  const { offset = 0, limit = 10 } = req.query;
  const users = await getUsers(offset, limit);

  const result = {
    _links: {
      self: {
        href: `/users?offset=${offset}&limit=${limit}`,
      },
    },
    items: users,
  };
  if (offset > 0) {
    result._links.prev = {
      href: `/users?offset=${Math.max(offset - limit, 0)}&limit=${limit}`,
    };
  }
  if (users.length >= limit) {
    result._links.next = {
      href: `/users?offset=${Number(offset) + Number(limit)}&limit=${limit}`,
    };
  }
  res.status(200).json(result);
});

/* /users/me
     -GET skilar innskráðum notanda (þ.e.a.s. þér) */
router.get('/me', requireAuthentication, async (req, res) => res.status(200).json(req.user));

/* /users/me
     -PATCH uppfærir sendar upplýsingar um notanda fyrir utan notendanafn,
      þ.e.a.s. nafn eða lykilorð, ef þau eru gild */
router.patch('/me', requireAuthentication, async (req, res) => {
  const { password, name } = req.body;
  const errors = validatePassAndName(password, name);
  if (errors.length > 0) {
    return res.status(400).json(errors);
  }
  // búum til dulkóðað password
  const hashedPassword = await bcrypt.hash(password, 11);
  const updateInfo = {
    name,
    password: hashedPassword,
  };
  const result = await updateUser(req.user.id, updateInfo);
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
  if (!checkValidID(bookId)) { // eslint-disable-line
    return res.status(400).json({ error: 'ID has to be a  number bigger than 0' });
  }
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
  if (!checkValidID(id)) { // eslint-disable-line
    return res.status(400).json({ error: 'ID has to be a  number bigger than 0' });
  }
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
  if (!checkValidID(id)) { // eslint-disable-line
    return res.status(400).json({ error: 'ID has to be a  number bigger than 0' });
  }
  const user = await getUserById(id);
  // ef user id er ekki til þá skila villu
  if (!user) {
    return res.status(404).json({ error: 'Id does not exist' });
  }
  // ef komin hingað þá þyðir það að user id er til þá getum haldið áfram
  const { offset = 0, limit = 10 } = req.query;
  return res.status(200).json(await getUsersReadBooks(id, offset, limit));
});

/* /users/me/read/:id
      -DELETE eyðir lestri bókar fyrir innskráðann notanda */
router.delete('/me/read/:id', requireAuthentication, async (req, res) => {
  const { id } = req.params;
  if (!checkValidID(id)) {
    return res.status(400).json({ error: 'ID has to be a  number bigger than 0' });
  }
  if (!(await readBookEntryExists(id))) {
    return res.status(404).json({ error: 'No such read Exists' });
  }
  await deleteReadBook(id);
  return res.status(204).json();
});

/* Notkun : upload(req, res, next)
   Fyrir  : kijka á hin req, res og next
   Efrir  : yfirfærir gögnin á cloudanary og vistar slóð á myndi
            i gagnagrunu ef slóð á myndini er lögleg */
async function upload(req, res, next) {
  const { file: { path } = {} } = req; // sótt slóð úr myndini

  // slóð á mynd er ólögleg
  if (!path) {
    return res.status(400).json({ error: 'Gat ekki lesið mynd' });
  }
  // þar sem niðurstaðan er geymd úr myndna yfirfærslu
  let uploadPic = null;
  // reynt er að yfirfæra myndina á cloudanary ef það virkar ekki þá er skilað villu
  try {
    uploadPic = await cloudinary.v2.uploader.upload(path);
  } catch (error) {
    console.error('Unable to upload file to cloudinary:', path);
    return next(error);
  }

  // secure_url er attribute i cloudanary ekki breyta es-lint sér
  // þetta sem eitthva sem við getum lagað en i raun ekki
  const { secure_url } = uploadPic; // eslint-disable-line
  const resultImg = await updateImgPath(req.user.id, secure_url);
  return res.status(200).json(resultImg);
}

router.post('/me/profile', requireAuthentication, uploads.single('image'), upload);

// --------------- Export Router ----------------------

module.exports = router;
