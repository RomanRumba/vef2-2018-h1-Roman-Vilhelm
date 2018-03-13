# Hópverkefni 1
## Róman (ror9@hi.is) & Vilhelm (vilhelml@hi.is)

# Verkefna upsetning 
## Fyrir local uppsetningu
* git clone https://github.com/RomanDatabasePimp/vef2-2018-h1-Roman-Vilhelm.git
* npm install
* bæta .env skjali með eftirfarandi breytur
  - DATABASE_URL
  - PORT
  - JWT_SECRET
  - TOKEN_LIFETIME 
  - CLOUDINARY_URL
  - CLOUDINARY_CLOUD
  - CLOUDINARY_API_KEY
  - CLOUDINARY_API_SECRET
* node fillDb.js (byr til allar töflur og setur gögn i þau úr books.csv)
* npm start 

# Dæmi um köll
## her er notuð heroku slóð
* Skrá aðila (POST) 
  - http://mighty-fortress-80354.herokuapp.com/register 
  - Body skal hafa JSON(application/json) = {"username":"roman","password":"abcabc"}
* Skrá aðilan inn (POST)
  - http://mighty-fortress-80354.herokuapp.com/login
  - Body skal hafa JSON(application/json) = {"username":"roman","password":"abcabc"}
  - það er skilað Token sem það þarf að halda utan um
* Skoða alla notendur (GET)
  - http://mighty-fortress-80354.herokuapp.com/users
* Skoða ákveðin aðila (GET)
  - http://mighty-fortress-80354.herokuapp.com/users/:id
  - þar sem id er heiltala > 0
* Skoða aðilan sem á token (GET)
  - http://mighty-fortress-80354.herokuapp.com/users/me
  - ATH ! svo þetta virki það þarf að bæta Token i hausin 
  - lykill Authorization og gildi bearer xxxx 
* Upfærar upplýsingar aðila sem á token (PATCH)
  - http://mighty-fortress-80354.herokuapp.com/users/me/
  - ATH ! svo þetta virki það þarf að bæta Token i hausin 
  - lykill Authorization og gildi bearer xxxx 
  - Body skal hafa JSON(application/json) = {"name":"roman","password":"abcabc"}
* Ná i allar bækur aðila sem á token (GET)
  - http://mighty-fortress-80354.herokuapp.com/users/me/read
  - ATH ! svo þetta virki það þarf að bæta Token i hausin 
  - lykill Authorization og gildi bearer xxxx 
* Skrá bók á aðilann sem á token (POST) 
  - ATH ! svo þetta virki það þarf að bæta Token i hausin 
  - lykill Authorization og gildi bearer xxxx 
  - Body skal hafa JSON(application/json) = { "bookId":"1", "bookRating":"1", "review":"it was meh"}
* Ná i bækur sem ákveðin aðili hefur lesið (GET)
  - http://mighty-fortress-80354.herokuapp.com/users/:id/read
* Eyða lestum bók af aðila sem á token (DELETE)
  - http://mighty-fortress-80354.herokuapp.com/users/me/read/:id
  - ATH ! svo þetta virki það þarf að bæta Token i hausin 
  - lykill Authorization og gildi bearer xxxx 
* Uppfæra prófil mynd á aðila sem á Token (POST)
  - http://mighty-fortress-80354.herokuapp.com/users/me/profile
  - ATH ! svo þetta virki það þarf að bæta Token i hausin 
  - lykill Authorization og gildi bearer xxxx 
  - ATH ! i body á að vera form data með key : image , file value sem er lögleg mynd
* sækja flokka (GET)
   - https://mighty-fortress-80354.herokuapp.com/categories
* skrá nýjan flokk (POST)
   - https://mighty-fortress-80354.herokuapp.com/categories
   - með json í body: { "id": "my category" }
   - þarf authentication
* sækja bækur (GET)
   - https://mighty-fortress-80354.herokuapp.com/books
* leita að bók (GET)
   - https://mighty-fortress-80354.herokuapp.com/books?search=green
* sækja ákveðna bók (GET)
   - https://mighty-fortress-80354.herokuapp.com/books/1
* skrá nýja bók (POST)
   - https://mighty-fortress-80354.herokuapp.com/books/
   - með json í body: { "title":"my new book", "isbn13":"1231231231123", "category":"Horror" }
   - þætti sem hægt er að srká: title, author, description, isbn10, isbn13, published, pagecount, language, category
   - þarf authentication
 * uppfæra bók (PATCH)
   - https://mighty-fortress-80354.herokuapp.com/books/1
   - með json í body: { "pagecount": 50, "language": "is" }
   - þættir sem hægt er að uppfæra: title, author, description, isbn10, isbn13, published, pagecount, language, category
   - þarf authentication

