const express = require('express');

const router = express.Router();

const {
  PORT: port = 3000, // sótt úr .env skjali ef ekki skilgreind þá default 3000
  HOST: host = '127.0.0.1', // sótt úr .env skjali  ef ekki til þá notar 127.0.0.1
} = process.env;


/* Þegar gögn eru sótt, búin til eða uppfærð þarf að athuga hvort allt sé gilt
og einingar séu til og skila viðeigandi status kóðum/villuskilaboðum ef svo er ekki. */

const {
  categoryExists,
  createCategory,
  getCategories,
  createBook,
  getBooks,
  getBook,
  bookSearch,
  updateBook,
  bookTitleExists,
  bookIdExists,
} = require('./DBooks');

async function validateBookInsertInput({
  title,
  isbn13,
  category,
  pageCount,
  language,
} = {}) {
  const errors = [];
  if (!title || title.length < 1) {
    errors.push({ field: 'title', message: 'title is a required field' });
  }
  if (await bookTitleExists(title)) {
    errors.push({ field: 'title', message: 'title already exists' });
  }
  // disable hér eslint því því líkar ekki við isNaN
  if (isbn13.length !== 13 || isNaN(isbn13) || !Number.isInteger(parseFloat(isbn13, 10))) { // eslint-disable-line
    errors.push({ field: 'isbn13', message: 'isbn13 must be an integer of length 13' });
  }
  if (!category) {
    errors.push({ field: 'category', message: 'missing category' });
  } else if (!(await categoryExists(category))) {
    errors.push({ field: 'category', message: 'category does not exist' });
  }
  // disable hér eslint því því líkar ekki við isNaN
  if (typeof pageCount !== 'undefined' &&
    (isbn13 > 0 || isNaN(pageCount) || !Number.isInteger(parseFloat(pageCount, 10)))) { // eslint-disable-line
    errors.push({ field: 'pageCount', message: 'pageCount must be a positive integer' });
  }
  if (typeof language !== 'undefined' && (!language || language.length !== 2)) {
    errors.push({ field: 'language', message: 'language has to be exactly 2 characters' });
  }
  return errors;
}

async function validateBookUpdateInput(id, {
  title,
  isbn13,
  category,
  pageCount,
  language,
} = {}) {
  const errors = [];
  // ef title er defined, en er tómur
  if (typeof title !== 'undefined' && title.length < 1) {
    errors.push({ field: 'title', message: 'title is a required field' });
  }
  // title er tekinn, en er ekki title bókarinnar sem er uppfærð
  if ((await bookTitleExists(title)) && ((await getBook(id)).title !== title)) {
    errors.push({ field: 'title', message: 'title already exists' });
  }
  // disable hér eslint því því líkar ekki við isNaN
  if (typeof isbn13 !== 'undefined' &&
    (isbn13.length !== 13 || isNaN(isbn13) || !Number.isInteger(parseFloat(isbn13, 10)))) { // eslint-disable-line
    errors.push({ field: 'isbn13', message: 'isbn13 must be an integer of length 13' });
  }
  if (typeof category !== 'undefined' && !category) {
    errors.push({ field: 'category', message: 'category must not be empty or null' });
  } else if (!(await categoryExists(category))) {
    errors.push({ field: 'category', message: 'category does not exist' });
  }
  // disable hér eslint því því líkar ekki við isNaN
  if (typeof pageCount !== 'undefined' &&
    (isbn13 > 0 || isNaN(pageCount) || !Number.isInteger(parseFloat(pageCount, 10)))) { // eslint-disable-line
    errors.push({ field: 'pageCount', message: 'pageCount must be a positive integer' });
  }
  if (typeof language !== 'undefined' && (!language || language.length !== 2)) {
    errors.push({ field: 'language', message: 'language has to be exactly 2 characters' });
  }
  return errors;
}

/* /categories
-GET skilar síðu af flokkum
-POST býr til nýjan flokk og skilar */
router.get('/categories', async (req, res) => {
  const data = await getCategories();
  res.status(200).json(data);
});

router.post('/categories', async (req, res) => {
  const { name } = req.body;
  const data = await createCategory(name);
  res.status(201).json(data);
});


/* /books
     -GET skilar síðu af bókum
     -POST býr til nýja bók ef hún er gild og skilar
      Fyrir fyrirspurnir sem skila listum af gögnum þarf að _page_a þau gögn.
      Þ.e.a.s. að sækja aðeins takmarkað magn úr heildarlista í einu og láta vita af næstu síðu. */
/* /books?search=query
     -GET skilar síðu af bókum sem uppfylla leitarskilyrði, sjá að neðan */

router.get('/books', async (req, res) => {
  const { search = '', offset = 0, limit = 10 } = req.query;
  let data;
  if (search) {
    data = await bookSearch(search, offset, limit);
  } else {
    data = await getBooks(offset, limit);
  }
  const result = {
    _links: {
      self: {
        href: `http://${host}:${port}/books?search=${search}search=${search}&offset=${offset}&limit=${limit}`,
      },
    },
    items: data,
  };
  if (offset > 0) {
    result._links.prev = {
      href: `http://${host}:${port}/books?search=${search}&offset=${Math.max(offset - limit, 0)}&limit=${limit}`,
    };
  }
  if (data.length >= limit) {
    result._links.next = {
      href: `http://${host}:${port}/books?search=${search}&offset=${Number(offset) + Number(limit)}&limit=${limit}`,
    };
  }
  res.status(200).json(result);
});

router.post('/books', async (req, res) => {
  const book = req.body;
  const errors = await validateBookInsertInput(book);
  if (errors.length > 0) {
    res.status(400).json(errors);
    return;
  }
  const data = await createBook(book);
  res.status(201).json(data);
});

/* /books/:id
     -GET skilar stakri bók
     -PATCH uppfærir bók */

router.get('/books/:id', async (req, res) => {
  const id = parseFloat(req.params.id, 10);

  // disable hér eslint því því líkar ekki við isNaN
  if (isNaN(id) || !Number.isInteger(id) || id <= 0) { // eslint-disable-line
    res.status(400).json([{ field: 'id', message: 'Id must be a positive integer number' }]);
    return;
  }
  if (!await bookIdExists(id)) { // eslint-disable-line
    res.status(404).json([{ field: 'id', message: 'Id not found' }]);
    return;
  }

  const data = await getBook(id);
  res.status(200).json(data);
});

router.post('/books/:id', async (req, res) => {
  const id = parseFloat(req.params.id, 10);

  const originalBook = await getBook(id);
  const {
    title = originalBook.title,
    author = originalBook.author,
    description = originalBook.description,
    isbn10 = originalBook.isbn10,
    isbn13 = originalBook.isbn13,
    published = originalBook.published,
    pagecount = originalBook.pagecount,
    language = originalBook.language,
    category = originalBook.category,
  } = req.body;

  // disable hér eslint því því líkar ekki við isNaN
  if (isNaN(id) || !Number.isInteger(id) || id <= 0) { // eslint-disable-line
    res.status(400).json([{ field: 'id', message: 'Id must be a positive integer number' }]);
    return;
  }
  if (!await bookIdExists(id)) {
    res.status(404).json([{ field: 'id', message: 'Id not found' }]);
    return;
  }
  const errors = await validateBookUpdateInput(id, {
    title,
    author,
    description,
    isbn10,
    isbn13,
    published,
    pagecount,
    language,
    category,
  });
  if (errors.length > 0) {
    res.status(400).json(errors);
    return;
  }
  const data = await updateBook(id, {
    title,
    author,
    description,
    isbn10,
    isbn13,
    published,
    pagecount,
    language,
    category,
  });
  res.status(200).json(data);
});

module.exports = router;
