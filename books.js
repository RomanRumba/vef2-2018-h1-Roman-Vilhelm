/* Þegar gögn eru sótt, búin til eða uppfærð þarf að athuga hvort allt sé gilt og einingar séu til og 
   skila viðeigandi status kóðum/villuskilaboðum ef svo er ekki. */

/* /categories
    -GET skilar síðu af flokkum
    -POST býr til nýjan flokk og skilar */

/* /books
     -GET skilar síðu af bókum
     -POST býr til nýja bók ef hún er gild og skilar 
      Fyrir fyrirspurnir sem skila listum af gögnum þarf að _page_a þau gögn. 
      Þ.e.a.s. að sækja aðeins takmarkað magn úr heildarlista í einu og láta vita af næstu síðu. */

/* /books?search=query
     -GET skilar síðu af bókum sem uppfylla leitarskilyrði, sjá að neðan */

/* /books/:id
     -GET skilar stakri bók
     -PATCH uppfærir bók */

/* þarf að exporta þetta er Route */
