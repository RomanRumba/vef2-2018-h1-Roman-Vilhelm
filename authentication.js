/* Þegar gögn eru sótt, búin til eða uppfærð þarf að athuga hvort allt sé gilt og einingar séu til og 
   skila viðeigandi status kóðum/villuskilaboðum ef svo er ekki. */

/* /register
     POST býr til notanda og skilar án lykilorðs hash */

/* /login
     POST með notendanafni og lykilorði skilar token */


/* Útfæra þarf middleware sem passar upp á slóðir sem eiga að vera læstar
   séu læstar nema token sé sent með í Authorization haus í request. */

/* þarf að sjá um að taka við tokens frá notendanum og validate þau */

/* þarf að sjá um að gefa tokens til notendans */


/* þarf að exporta þetta er Route */