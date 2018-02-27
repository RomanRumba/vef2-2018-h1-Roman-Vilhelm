/* Þegar gögn eru sótt, búin til eða uppfærð þarf að athuga hvort allt sé gilt og einingar séu til og 
   skila viðeigandi status kóðum/villuskilaboðum ef svo er ekki. */

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

