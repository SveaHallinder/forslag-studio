# Innehåll som styr kompositionen

| Före | Efter | Varför |
| --- | --- | --- |
| Produkter och teampresentationer fick generiska projektsektioner | Sammanhängande produkt- och teamgrupper får en, två eller tre kolumner | Anpassar sidan till det faktiska innehållet och håller grupperna åtskilda |
| Partnerloggor behandlades som stora fotografier | Kompakt logorad utan bildvisare | Ger rätt visuell vikt utan att ändra företagets loggor |
| Prislistor och frågor såg ut som vanlig brödtext | Inramad prislista och öppningsbara frågor med bevarade svar | Priser blir lättare att hitta och svar kan läsas vid behov |
| Bildserier hade likadana rutor | Förskjutna bildpar och större inledande bild i serier om tre | Ger en tydligare rytm, med kvarvarande ordning och bildtexter |
| Nästan samma mobilöppning för alla nya designer | Cinema och Hotell visar bilden först; Studio och Hälsa behåller egna bildformat | Designens karaktär följer med till mobil |
| Små huvudbilder och bildserier kunde förstoras | Intrinsiska bildmått begränsar automatisk uppskalning | Undviker onödig oskärpa; manuellt valda utsnitt behålls |
| Stående huvudbilder kunde beskäras till ett panorama | Automatisk presentation visar stående bilder i sina proportioner | Minskar risken att beskära bort bildens motiv |

Ändringen är en presentationsförbättring i `public/website-redesign.mjs`. Befintliga projekt, originaltexter, priser, bildordning, bildtexter, destinationer och egna utsnitt finns kvar. Inga dependencies, databasscheman eller kundsystem ändras.

## Verifiering

- 455 kodtester, lint och build.
- 1 526 kontroller av de 14 designer som använder den nya kompositionen: 320/390/820/1280 px, produktgrupper, team, priser, FAQ, loggor, bildserier, små bilder, manuella utsnitt och stående huvudbild.
- Alla 17 designer ingår även i befintlig layout- och bildvisarregression.
- Testet av importerade/sparade underlag rapporterar nu antalet underlag som faktiskt kunde laddas. Om extern import misslyckas redovisas den begränsningen; ett saknat underlag räknas inte som testat.
- Separat lokal QA-origin används. Inga publicerade kundprojekt ändras av kontrollerna.

## QA i UI – sju steg

1. Öppna `http://localhost:4183/`, öppna ett förslag och välj **Välj design**. Jämför exempelvis Magasin & arkitektur, Butik & sortiment och Cinema med samma innehåll.
2. Använd en design med **Använd designens typsnitt** markerat. Scrolla hela sidan och kontrollera att samtliga originalsektioner och deras länkar finns kvar.
3. Prova två eller tre bilder i en huvudbildsgrupp och i en innehållssektion. Kontrollera ordning, bildtexter och bildvisning med tangentbord.
4. Under **Innehåll**, öppna en sektion och prova **Sektionstyp → Produkter**, **Team**, **Prislista** eller **Frågor & svar** med relevant testinnehåll. Lägg frågan och svaret i separata stycken. Kontrollera förhandsvisningen och öppna och stäng ett svar. En bildserie med rubriken Samarbetspartners ska visa kompakta loggor.
5. Byt till mobilvy. Kontrollera produktgruppernas läsordning, meny, bildserier och kontaktväg utan horisontell scroll.
6. Välj ett eget bildutsnitt under Bilder. Kontrollera att passning, fokuspunkt och format fortfarande används efter designbyte. En stående huvudbild utan eget utsnitt ska behålla sitt motiv.
7. Spara, välj **Granska & dela** och öppna kundlänken i en ny flik. Kontrollera hela sidan och en eventuell undersida. Öppna kontaktlänkens destination utan att skicka mejl, boka eller betala.

Design kan inte återskapa detaljer som saknas i en lågupplöst originalbild. De automatiska kontrollerna ersätter inte granskning av företagets fakta, bilder eller externa kundsystem.
