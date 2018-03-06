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
  bookExists,
} = require('./DBooks');

async function validateBookInput({
  title,
  isbn13,
  category,
} = {}) {
  const errors = [];
  if (!title || title.length < 1) {
    errors.push({ field: 'title', message: 'title is a required field' });
  }
  if (bookExists) {
    errors.push({ field: 'title', message: 'title already exists' });
  }
  if (isbn13.length !== 13 || isNaN(isbn13.length) || !Number.isInteger(isbn13.length)) {
    errors.push({ field: 'isbn13', message: 'isbn13 must be an integer of length 13' });
  }
  if (!category) {
    errors.push({ field: 'category', message: 'missing category' });
  } else if (!(await categoryExists(category))) {
    errors.push({ field: 'category', message: 'category does not exist' });
  }
  console.log(await categoryExists(category));
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
  res.status(200).json(data);
});


/* /books
     -GET skilar síðu af bókum
     -POST býr til nýja bók ef hún er gild og skilar
      Fyrir fyrirspurnir sem skila listum af gögnum þarf að _page_a þau gögn.
      Þ.e.a.s. að sækja aðeins takmarkað magn úr heildarlista í einu og láta vita af næstu síðu. */

router.get('/books', async (req, res) => {
  const { offset = 0, limit = 10 } = req.query;
  console.log(offset, limit);
  const data = await getBooks(offset, limit);
  const result = {
    _links: {
      self: {
        href: `http://${host}:${port}/books?offset=${offset}&limit=${limit}`,
      },
    },
    items: data,
  };
  if (offset > 0) {
    result._links.prev = {
      href: `http://${host}:${port}/books?offset=${offset - limit}&limit=${limit}`,
    };
  }
  if (data.length <= limit) {
    result._links.next = {
      href: `http://${host}:${port}/books?offset=${Number(offset) + Number(limit)}&limit=${limit}`,
    };
  }
  res.status(200).json(result);
});

router.post('/books', async (req, res) => {
  const book = req.body;
  const errors = await validateBookInput(book);
  if (errors.length > 0) {
    res.status(400).json(errors);
    return;
  }
  console.log(book, errors);
  const data = await createBook(book);
  res.status(200).json(data);
});
/* /books?search=query
     -GET skilar síðu af bókum sem uppfylla leitarskilyrði, sjá að neðan */

/* /books/:id
     -GET skilar stakri bók
     -PATCH uppfærir bók */

/* þarf að exporta þetta er Route */

module.exports = router;
