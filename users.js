/* -------------------------------------------------
   ------------------Requires START ----------------
   ------------------------------------------------- */

const express = require('express');
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary');
const fs = require('fs');

const {
  PORT: port = 3000, // sótt úr .env skjali ef ekki skilgreind þá default 3000
  HOST: host = '127.0.0.1', // sótt úr .env skjali  ef ekki til þá notar 127.0.0.1
} = process.env;

const {
  getUsers,
  getUserById,
  updateUser,
  getReadBooks,
  readBook,
  hasReadBook,
  updateImgPath,
  deleteReadBook,
  readBookEntryExists,
} = require('./DUsers');

const {
  requireAuthentication,
  checkValidID,
} = require('./commonFunctions');

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
            ásmat slóð til að fá næstu 10 og fara á seinustu 10  */
async function getUsersReadBooks(id, limit, offset) {
  const userBooks = await getReadBooks(id, limit, offset);
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
  const parsedRating = parseFloat(bookRating, 10);

  if (!checkValidID(bookId)) { // eslint-disable-line
    return res.status(400).json({ error: 'Book ID has to be a  number bigger than 0' });
  }

  const book = await getBook(bookId);
  if (!book) {
    return res.status(404).json({ error: 'Book not found' });
  }

  const userReadBook = await hasReadBook(req.user.id, bookId);
  if (userReadBook) {
    return res.status(400).json({ error: 'You have already Read this Book' });
  }

  if (isNaN(parsedRating) || !Number.isInteger(parsedRating) || parsedRating < 0 || parsedRating > 5 ) { // eslint-disable-line
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
  if (!checkValidID(id)) {
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
  if (!checkValidID(id)) {
    return res.status(400).json({ error: 'ID has to be a  number bigger than 0' });
  }
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
router.delete('/me/read/:id', requireAuthentication, async (req, res) => {
  const { id } = req.params;
  if (!checkValidID(id)) { // eslint-disable-line
    return res.status(400).json({ error: 'ID has to be a  number bigger than 0' });
  }
  if (!(await readBookEntryExists(id))) {
    return res.status(404).json({ error: 'No such read Exists' });
  }
  await deleteReadBook(id);
  return res.status(204).json();
});

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

async function uploadToCloudinary(imgPath) {
  console.log('test', imgPath);
  cloudinary.uploader.upload(imgPath, (result) => {
    console.log(result);
    console.log(`${result.public_id}.${result.format}`);
    const result = await updateImgPath(req.user.id, imgPath);
  });
}

async function uploadImage(img) {
  console.log('from user', img);

  const imgPath = `img/temp_${img.name}`;
  await img.mv(imgPath);
  await uploadToCloudinary(imgPath);
  /*
  img.mv(imgPath, async (err) => {
    if (err) {
      console.log(err);
    }
    await uploadToCloudinary(imgPath);
  });
    */
  await fs.unlink(imgPath);
}

router.post('/me/profile', requireAuthentication, async (req, res) => {
  const img = req.files.image;
  await uploadImage(img);
  /*
  if (img) {
    const imgPath = `img/${img.name}`;
    img.mv(imgPath, async (err) => {
      if (err) {
        res.status(500).send(`error: ${err}`);
      } else {
        const result = await updateImgPath(req.user.id, imgPath);
        res.status(200).send(result);
      }
    });
  }
  else {
    res.status(400).send('no image received');
  }
    */
});

// --------------- Export Router ----------------------

module.exports = router;
