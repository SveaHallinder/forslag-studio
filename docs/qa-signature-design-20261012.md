# QA – fem olika helhetsstilar

Bild & berättelse, Studio, Magasin & arkitektur, Cinema och Pop har fått egna kompositioner för entré, sektioner, kontakt och sidfot. Designbiblioteket har fortfarande 15 designer. Förbättringarna används av den gemensamma renderaren i redigerare, kunddemo och HTML-export.

## Designgranskning

| Before | After | Why |
| --- | --- | --- |
| Liknande sektionsrytm och avslut mellan mallarna | Fem olika bildformat, typografiska hierarkier och kontakt-/sidfotskompositioner | Samma företagsunderlag kan få tydligt olika uttryck genom hela sidan |
| Stora färgbyten och stora namn tog över | Matta ytor, lugnare menyer och mindre namn i sidfoten | Bättre balans mellan innehåll, bilder och nästa steg |
| Mobilregler suddade ut Pop-kortens form | Sammanhållna bild-/textkort med mjuka former och läsbara färgpar | Stilens karaktär följer med till mobil |
| Personnamn riskerade att hamna i generisk företagslayout | Egen hierarki för namn, yrkesrubrik och porträtt | Författare och andra personliga varumärken behåller sin presentation |
| Tomma bildytor gav ett ofärdigt första intryck | Textbaserad entré när bild saknas; synlig information när kontakt saknas | Ärlig och användbar förhandsvisning även med lite underlag |

## QA-script: fem steg

Starta från projektmappen med `npm run build` följt av `npm start`. Öppna http://localhost:4183/. Använd ett separat QA-förslag.

1. Öppna **Alla mallar** och växla mellan de fem ovanstående designerna med samma innehåll. Scrolla varje förhandsvisning till kontakt och sidfot. Skillnaderna ska synas genom hela sidan.
2. Växla till **Mobil**. Kontrollera hela sidan, öppna menyn, följ ett internt ankare och stäng menyn med Escape. Ingen horisontell sidrullning eller överlappning.
3. Förhandsvisa en annan design och välj **Avbryt**. Utkastets namn, innehåll och tidigare design ska vara oförändrade. Använd därefter en design endast i QA-förslaget.
4. Prova längre rubriker, mörk accentfärg, egen rubrikfont och ett manuellt bildutsnitt. Kontrollera läsbarhet, att hela originaltexten finns kvar och att bildutsnittet respekteras. Ta bort huvudbilden och kontrollera textentrén.
5. Öppna kundförhandsvisningen och ladda ner demosidan. Kontrollera samma valda design, menyankare, kontaktvägar och text-/bildordning i båda.

## Verifierat den 12 oktober 2026

- `npm run lint`, `npm run build`, `git diff --check`: godkända.
- `npm test`: 397/397, inklusive sju nya regressionstester för innehåll, bildutsnitt, typografi och tomma underlag.
- `npm run test:browser`: 5/5 befintliga integrationstester för JavaScript-import.
- `tests/signature-design-browser.html`: 180/180 layoutfall. Fem stilar × fyra bredder (320/375/820/1280) × nio underlag, inklusive mörka färger, långa texter, galleri, manuella utkast, eget typsnitt, personligt varumärke och tomt innehåll. Kontroll av textkontrast för mörka färgvarianter.
- Befintliga `tests/page-design-browser.html`: 200/200. Sektionernas ordning, bildtexter, bokomslag, bildutsnitt och redigerarens sektionsindex bibehållna; inga överlappningar eller kort utanför sidan.
- Visuell kontroll med befintligt Pebble-underlag och Vegavista-bilder. Appens designbibliotek: förhandsvisning, mobilväxling och Avbryt kontrollerade utan att spara över återställt utkast. Mobilmenyn öppnades och stängdes med Escape.

## Ändrade filer och avgränsning

- `public/signature-design.mjs`: nytt presentationslager för de fem stilarna.
- `public/render.mjs`: kopplar in presentationslagret före kundens egna typsnitt.
- `public/templates.mjs`: beskrivningar som motsvarar de förbättrade designerna.
- `tests/signature-design.test.mjs`: sju regressionstester.
- `tests/signature-design-browser.html`: lokal, interaktiv jämförelse och layoutkontroller; ingår inte i den publicerade appen.
- Denna QA-fil.

Inga nya beroenden eller schemaändringar. Kundernas innehåll och länkar skrivs inte om. Befintliga delade demovyer får den uppdaterade designen när de renderas igen; redan nedladdad HTML behöver exporteras på nytt. Bildkvalitet och importerat underlag behöver fortfarande granskas före kundvisning. Förbättringen garanterar inte försäljningsresultat eller att godtyckligt underlag alltid blir perfekt automatiskt.
