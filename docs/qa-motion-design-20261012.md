# Galleri, Affisch och rörelse på kundsidor

## Visuell genomgång

| Före | Efter | Varför |
| --- | --- | --- |
| 15 valbara designer | 17 designer, inklusive Galleri och Affisch | Två ytterligare uttryck för hela sidan. |
| Gemensam struktur för dessa nya användningsfall | Galleri: bilden först, serif, förskjutna bildserier och en lågmäld sidfot. Affisch: stora versaler, linjer, panoramabild och grafiskt avslut. | Variation i komposition, typografi och sektionsrytm. |
| Statiska kundförhandsvisningar | Kort entré och en gång spelad sektionsrörelse; olika tempo för lugna, filmiska och grafiska mallar | Innehållet får en mjuk introduktion utan ständig rörelse. |
| Samma rörelseförutsättningar överallt | Redigeringsvyn är stilla. Tangentbord och utskrift avbryter rörelsen. Reducerad rörelse ger endast en kort, stationär toning. | Bekväm redigering och tillgänglig kundvisning. |

Originalets texter, logotyp, länkar, bildassociationer, manuella bildutsnitt och egna typsnitt behålls. Rörelsen använder webbläsarens befintliga API och inga nya paket. Innehåll är synligt när JavaScript eller animationsstödet saknas.

## Verifierat lokalt

- `npm run lint`: godkänd.
- `npm test`: 410/410 godkända.
- `npm run build`: godkänd.
- `npm run test:browser`: 5/5 godkända, inklusive verklig Chromium-import.
- `tests/signature-design-browser.html`: 252 layoutfall godkända för sju stilar, fyra bredder och nio innehållsvarianter.
- `tests/page-design-browser.html`: 200 befintliga helsidesscenarier godkända.
- `tests/site-motion-browser.html`: sju kontroller godkända med vanlig rörelse och sju med emulerad reducerad rörelse. Kontrollerna kör verkliga exporter, sandboxad förhandsvisning/redigering och flersidiga förslag.
- Designbiblioteket visar 17/17. Galleri och Affisch kan förhandsvisas; Avbryt behåller utkastets design. Kundförhandsvisningen öppnas i en separat flik.
- `tests/navigation-browser.html`: Galleri och Affisch klarar samtliga 18 nya menyfall. Hela matrisen har fem befintliga höjdmarkeringar: café/820/4, dining/820/4, dining/1280/4, wellness/1280/4 och hospitality/1280/4. Exakt samma markeringar finns på baslinjen `fe204fb14c7475989675e01fc1118579f7f33bcf`; inga nya menyfel infördes.

## QA-script för användaren

1. Öppna `http://localhost:4183/`, välj ett förslag och klicka **Alla mallar**. Biblioteket ska visa 17 designer.
2. Prova **Galleri** och **Affisch**, växla mellan Desktop och Mobil och scrolla till kontakt och sidfot. Välj **Avbryt** för att behålla ditt utkast, eller använd vald design.
3. Skriv i en rubrik. Redigeringsvyn ska vara stilla. Klicka **Öppna förhandsvisning i ny flik** och kontrollera den mjuka entrén och sektionsrörelsen.
4. Navigera med Tab och öppna mobilmenyn. Rörelsen ska avbrytas, fokus ska synas och alla menylänkar ska fungera. Kontrollera även eventuell sida två.
5. Ladda ner demosidan och öppna HTML-filen. Kontrollera rörelsen och slå sedan på operativsystemets **Minska rörelse**: innehållet ska ligga stilla och bara tonas in kort.

Designkvaliteten behöver fortfarande bedömas med respektive företags verkliga bilder och innehåll. Denna uppdatering förändrar presentation och rörelse, inte importtjänster, bokning, betalning eller mejlleverans.
