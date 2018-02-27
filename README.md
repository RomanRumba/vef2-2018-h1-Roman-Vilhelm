# Hópverkefni 1

Útfæra skal vefþjónustu fyrir „bókasafn“ með notendaumsjón. Gefin eru gögn fyrir bækur og flokka.

## Notendaumsjón

Hægt á að vera að skrá notendur með nafni, notendanafni og lykilorði. Auðkenning skal fara fram með JWT og passport, token er úthlutað þegar `POST`að er á `/login`.

Útfæra þarf middleware sem passar upp á slóðir sem eiga að vera læstar séu læstar nema token sé sent með í `Authorization` haus í request.

Eftir að notandi er innskráður er möguleiki á að setja inn mynd fyrir notanda með því að framkvæma `POST` á `/users/me/profile` með mynd (`.png`, `.jpg` eða `.jpeg`) í body á request. Þar sem ekki er hægt að vista myndir beint á disk á Heroku skal notast við [Cloudinary](https://cloudinary.com/), þjónustu sem geymir myndir og bíður upp á API til að vista, sækja og eiga við myndir. Heroku bíður upp á ókeypis útgáfu gegnum [Cloudinary add-on](https://elements.heroku.com/addons/cloudinary).

Flæði væri:

1. Notandi sendir `multipart/form-data` `POST` á `/users/me/profile` með mynd
2. Bakendi les mynd úr request, t.d. með [`multer`](https://github.com/expressjs/multer)
3. Mynd er send á cloudinary API, sjá [Heroku: Cloudinary with node.js](https://devcenter.heroku.com/articles/cloudinary#using-with-node-js)
4. Ef allt gengur eftir skilar Cloudinary JSON hlut með upplýsingum
5. `url` úr svari er vistað í notenda töflu

## Gögn

Útbúa þarf töflur fyrir eftirfarandi gögn, gefnar eru kröfur á gögnum sem passa þarf upp á þegar nýjar færslur eru gerðar eða eldri uppfærðar.

* Notendur
  - Auðkenni, _primary key_
  - Notendanafn, _einstakt gildi_, a.m.k. 3 stafir, krafist
  - Lykilorðs hash, lykilorð verður að vera a.m.k. 6 stafir, krafist
  - Nafn, ekki tómi strengurinn, krafist
  - Slóð á mynd, ekki krafist
* Flokkar
  - Auðkenni, _primary key_
  - Heiti, _einstakt gildi_, ekki tómi strengurinn, krafist
* Bækur
  - Auðkenni, _primary key_
  - Titill, _einstakt gildi_, ekki tómi strengurinn, krafist
  - ISBN13, _einstakt gildi_, nákvæmlega 13 stafa strengur gerður úr tölum, krafist
  - Höfundur, ekki krafist
  - Lýsing, lengri texti, ekki krafist
  - Flokkur, _foreign key_ í flokka töflu, krafist
  - ISBN10, strengur, ekki krafist, ekki krafa að hafa með í verkefni
  - Útgáfudagsetning, ekki krafist, strengur, ekki krafa að hafa með í verkefni
  - Síðufjöldi, tala, stærri en 0, ekki krafist, ekki krafa að hafa með í verkefni
  - Tungumál, 2 stafa strengur, ekki krafist, ekki krafa að hafa með í verkefni
* Lesnar bækur notenda
  - Auðkenni
  - Auðkenni notanda, _foreign key_ í notanda töflu, krafist
  - Auðkenni bókar, _foreign key_ í bóka töflu, krafist
  - Einkunn notanda, gildi úr eftirfarandi lista `1, 2, 3, 4, 5` þar sem `1` er lægsta einkunn og `5` hæsta, krafist
  - Dómur notanda, lengri texti, ekki krafist

Þar sem merkt er _krafist_ verða gögn að innihalda gildi og þau að vera gild skv. lýsingu. Þar sem merkt er _ekki krafst_ má sleppa gildi í gögnum, bæði þegar eining er búin til og henni skilað.

Þar sem merkt er _primary key_, _foreign key_ eða _einstakt gildi_ (unique) þarf að setja viðeigandi skoður á töflu, sjá https://www.postgresql.org/docs/current/static/ddl-constraints.html

Gögn eru gefin innan `data/` möppu þar sem `books.csv` inniheldur 532 færslur, fyrsta lína skilgreinir dálka. Ef `"` kemur fyrir í texta er það kóðað sem `""`, t.d.
`"Þetta er lýsing með ""gæsalöppum"""`. Gögn innihalda ekki nýlínu tákn.

## Vefþjónustur

Eftirfarandi slóðir eiga að vera til staðar, öll gögn sem send eru inn skulu vera á `JSON` formi og gögnum skilað á `JSON` formi.

* `/register`
  - `POST` býr til notanda og skilar án lykilorðs hash
* `/login`
  - `POST` með notendanafni og lykilorði skilar token
* `/users`
  - `GET` skilar _síðu_ (sjá að neðan) af notendum
  - Lykilorðs hash skal ekki vera sýnilegt
* `/users/:id`
  - `GET` skilar stökum notanda ef til
  - Lykilorðs hash skal ekki vera sýnilegt
* `/users/me`
  - `GET` skilar innskráðum notanda (þ.e.a.s. _þér_)
  - `PATCH` uppfærir sendar upplýsingar um notanda fyrir utan notendanafn, þ.e.a.s. nafn eða lykilorð, ef þau eru gild
* `/users/me/profile`
  - `POST` setur eða uppfærir mynd fyrir notanda í gegnum Cloudinary og skilar slóð
* `/categories`
  - `GET` skilar _síðu_ af flokkum
  - `POST` býr til nýjan flokk og skilar
* `/books`
  - `GET` skilar _síðu_ af bókum
  - `POST` býr til nýja bók ef hún er gild og skilar
* `/books?search=query`
  - `GET` skilar _síðu_ af bókum sem uppfylla leitarskilyrði, sjá að neðan
* `/books/:id`
  - `GET` skilar stakri bók
  - `PATCH` uppfærir bók
* `/users/:id/read`
  - `GET` skilar _síðu_ af lesnum bókum notanda
* `/users/me/read`
  - `GET` skilar _síðu_ af lesnum bókum innskráðs notanda
  - `POST` býr til nýjan lestur á bók og skilar
* `/users/me/read/:id`
  - `DELETE` eyðir lestri bókar fyrir innskráðann notanda

Þegar gögn eru sótt,  búin til eða uppfærð þarf að athuga hvort allt sé gilt og einingar séu til og skila viðeigandi status kóðum/villuskilaboðum ef svo er ekki.

Fyrir notanda sem ekki er skráður er inn skal vera hægt að:

* Skoða allar bækur og flokka
* Leita að bókum

Fyrir innskráðan notanda skal einnig vera hægt að:

* Uppfæra upplýsingar um sjálfan sig
* Skrá nýja bók
* Uppfæra bók
* Skrá nýjan flokk
* Skrá lestur á bók
* Eyða lestur á bók

### Síður (paging)

Fyrir fyrirspurnir sem skila listum af gögnum þarf að _page_a þau gögn. Þ.e.a.s. að sækja aðeins takmarkað magn úr heildarlista í einu og láta vita af næstu síðu. Þetta kemur í veg fyrir að við sækjum of mikið af efni í einu, t.d. ef gagnagrunnur myndi innihalda tugþúsundir bóka og notanda.

Til að útfæra með postgres nýtum við [`LIMIT` og `OFFSET`](https://www.postgresql.org/docs/current/static/queries-limit.html) í fyrirspurnum. Við útfærum almennu fyrirspurnina (með `ORDER BY <dálk til að raða eftir>`) en bætum síðan við t.d. `LIMIT 10 OFFSET 0` sem biður um fyrstu 10 niðurstöður, `LIMIT 10 OFFSET 10` myndi skila okkur næstu 10, þ.e. frá 11-20 o.s.fr.

Upplýsingum um limit og offset skal skila í svari ásamt gögnum á forminu:

```json
{
  "limit": 10,
  "offset": 0,
  "items": [
    // 10 hlutir úr svari
  ]
}
```

### Leit

Aðeins þarf að leita í bókatöflu í reitunum titil og lýsingarreitum. Postgres býður upp á textaleit í töflum án þess að setja upp eitthvað sérstakt, sjá [Chapter 12. Full Text Search: Tables and Indexes](https://www.postgresql.org/docs/current/static/textsearch-tables.html).

## Annað

Ekki þarf að útfæra „týnt lykilorð“ virkni.

Bækur geta aðeins verið í einum flokk.

Þegar gögn eru flutt inn í gagnagrunn getur verið gott að nýta `await` í lykkju þó að eslint mæli gegn því. Ef t.d. er reynt að setja inn yfir 500 færslur í einu í gagnagrunn með `Promise.all`, getur tenging rofnað vegna villu.

## Hópavinna

Verkefnið skal unnið í hóp, helst með þremur einstaklingum. Hópar með tveim eða fjórum einstaklingum eru einnig í lagi. Hafið samband við kennara ef ekki tekst eða ekki mögulegt að vinna í hóp.

## README

Í rót verkefnis skal vera `README.md` skjal sem tilgreinir:

* Upplýsingar um hvernig setja skuli upp verkefnið
  - Hvernig gagnagrunnur og töflur eru settar upp
  - Hvernig gögnum er komið inn í töflur
* Dæmi um köll í vefþjónustu
* Nöfn og notendanöfn allra í hóp

## Git og GitHub

Verkefni þetta er sett fyrir á GitHub og almennt ætti að skila því úr einka (private) repo nemanda. Nemendur geta fengið gjaldfrjálsan aðgang að einka repos á meðan námi stendur, sjá https://education.github.com/.

Til að byrja er hægt að afrita þetta repo og bæta við á sínu eigin:

```bash
> git clone https://github.com/vefforritun/vef2-2018-h1.git
> cd vef2-2018-h1
> git remote remove origin # fjarlægja remote sem verkefni er í
> git remote add origin <slóð á repo> # bæta við í þínu repo
> git push
```

## Mat

* 20% – Töflur og gögn lesin inn
* 30% – Auðkenning og notendaumsjón
* 50% – Vefþjónusta

## Sett fyrir

Verkefni sett fyrir í fyrirlestri fimmtudaginn 22. febrúar 2018.

## Skil

Einn aðili í hóp skal skila fyrir hönd allra og skila skal undir „Verkefni og hlutaprófa“ á Uglu í seinasta lagi fyrir lok dags fimmtudaginn 15. mars 2018.

Skilaboð skulu innihalda slóð á GitHub repo fyrir verkefni, slóð á Heroku og nöfn allra þá sem eru í hópnum. Dæmatímakennurum skal hafa verið boðið í repo ([sjá leiðbeiningar](https://help.github.com/articles/inviting-collaborators-to-a-personal-repository/)). Notendanöfn þeirra eru `ernir` og `elvarhelga`.

## Einkunn

Sett verða fyrir sex minni verkefni þar sem fimm bestu gilda 6% hvert, samtals 30% af lokaeinkunn.

Sett verða fyrir tvö hópa verkefni þar sem hvort um sig gildir 15%, samtals 30% af lokaeinkunn.
