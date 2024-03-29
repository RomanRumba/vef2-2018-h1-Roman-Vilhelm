const express = require('express');

const router = express.Router();

const {
  requireAuthentication,
  checkValidID,
} = require('./commonFunctions');
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
  pagecount,
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
  if (!isbn13 || isbn13.length !== 13 || isNaN(isbn13) || !Number.isInteger(parseFloat(isbn13, 10))) { // eslint-disable-line
    errors.push({ field: 'isbn13', message: 'isbn13 must be an integer of length 13' });
  }
  if (!category) {
    errors.push({ field: 'category', message: 'missing category' });
  } else if (!(await categoryExists(category))) {
    errors.push({ field: 'category', message: 'category does not exist' });
  }
  // disable hér eslint því því líkar ekki við isNaN
  if (typeof pagecount !== 'undefined' &&
    (pagecount < 0 || isNaN(pagecount) || !Number.isInteger(parseFloat(pagecount, 10)))) { // eslint-disable-line
    errors.push({ field: 'pagecount', message: 'pagecount must be a positive integer' });
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
  pagecount,
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
  // disable hér eslint þ
  if (typeof pagecount !== 'undefined' &&
    (pagecount < 0 || isNaN(pagecount) || !Number.isInteger(parseFloat(pagecount, 10)))) { // eslint-disable-line
    errors.push({ field: 'pagecount', message: 'pagecount must be a positive integer' });
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
  const { offset = 0, limit = 10 } = req.query;
  const data = await getCategories();
  const result = {
    _links: {
      self: {
        href: `/categories?offset=${offset}&limit=${limit}`,
      },
    },
    items: data,
  };
  if (offset > 0) {
    result._links.prev = {
      href: `/categories?offset=${Math.max(offset - limit, 0)}&limit=${limit}`,
    };
  }
  if (data.length >= limit) {
    result._links.next = {
      href: `/categories?offset=${Number(offset) + Number(limit)}&limit=${limit}`,
    };
  }
  res.status(200).json(result);
});

router.post('/categories', requireAuthentication, async (req, res) => {
  const { id } = req.body;
  if (await categoryExists(id)) {
    res.status(400).json({ error: 'category already exists' });
    return;
  }
  const data = await createCategory(id);
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
        href: `/books?search=${search}&offset=${offset}&limit=${limit}`,
      },
    },
    items: data,
  };
  if (offset > 0) {
    result._links.prev = {
      href: `/books?search=${search}&offset=${Math.max(offset - limit, 0)}&limit=${limit}`,
    };
  }
  if (data.length >= limit) {
    result._links.next = {
      href: `/books?search=${search}&offset=${Number(offset) + Number(limit)}&limit=${limit}`,
    };
  }
  res.status(200).json(result);
});

router.post('/books', requireAuthentication, async (req, res) => {
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
  if (!checkValidID(req.params.id)) {
    res.status(400).json({ error: 'Id must be a positive integer number' });
    return;
  }
  if (!(await bookIdExists(id))) {
    res.status(404).json({ error: 'Id not found' });
    return;
  }

  const data = await getBook(id);
  res.status(200).json(data);
});

router.patch('/books/:id', requireAuthentication, async (req, res) => {
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
  if (!checkValidID(req.params.id)) {
    res.status(400).json({ error: 'Id must be a positive integer number' });
    return;
  }
  if (!(await bookIdExists(id))) {
    res.status(404).json({ error: 'Id not found' });
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
