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
* Skoða alla notendur
  - http://mighty-fortress-80354.herokuapp.com/users
* Skoða ákveðin aðila
  - http://mighty-fortress-80354.herokuapp.com/users/:id
  - þar sem id er heiltala > 0
* Skoða aðilan sem er skráður inn
  - http://mighty-fortress-80354.herokuapp.com/users/me
  - ATH ! svo þetta virki það þarf að bæta Token i hausin 
  - lykill Authorization og gildi bearer xxxx 


* Upplýsingar um hvernig setja skuli upp verkefnið
  - Hvernig gagnagrunnur og töflur eru settar upp
  - Hvernig gögnum er komið inn í töflur
* Dæmi um köll í vefþjónustu
* Nöfn og notendanöfn allra í hóp
