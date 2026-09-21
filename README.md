# Förslag Studio online

Webbversion för en säljare som ska kunna börja direkt från en länk, utan installation eller konto. Samma tre mallar och redigeringsflöde som den lokala versionen.

Projekt sparas i IndexedDB i den egna webbläsaren. Andra besökare får en egen projektlista. Ingen projektdata lagras på servern, och listan synkas inte mellan enheter. Rensad webbplatsdata, privat läge eller byte av webbläsare kan innebära att sparade projekt inte finns kvar. Ladda ner **Projektkopia** som backup och öppna den på en annan dator vid behov.

Servern hämtar offentlig HTML och bildfiler för import respektive export. Text, mallar och bildval granskas av säljaren innan delning. JavaScript-beroende eller blockerande företagssidor kan kräva manuell redigering. Kundlänkar använder den befintliga publika demovisaren och fungerar oberoende av säljarens webbläsare.

Inga paketberoenden eller betalda API:er. Worker-koden använder Cloudflares publika nätverksåtkomst utan privata nätverkskopplingar. Adresser och omdirigeringar valideras, svarsstorlek och tid begränsas. Publik hämtning följer plattformens användningsgränser.

## Lokal kontroll

`npm run lint`, `npm test`, `npm run build`, `npm start`. Webbversionen visas då på http://localhost:4174. Den ursprungliga lokala appen på 4173 är separat och oförändrad.

## Fem QA-steg

1. Öppna verktyget, duplicera Vegavista och spara kopian med ett eget namn.
2. Ladda om och öppna Mina förslag. Kontrollera att kopian och samma mall finns kvar.
3. Importera en företagsadress och granska text och bilder. Spara förslaget.
4. Arkivera och återställ testförslaget. Ladda ner en projektkopia som backup.
5. Välj Granska & dela och skapa en demolänk. Öppna länken och kontrollera design, bilder och scrollning. Prova HTML-export.

## Struktur

- `public/`: befintlig editor, med webbläsarlagring och innehållsextraktion som separata moduler.
- `worker.mjs`: begränsade serverrutter för offentlig HTML och bilder; servern har ingen projektdatabas.
- `scripts/`: kontroll, bygge och lokal förhandsvisning, endast Node-standardbibliotek.
- `tests/`: nätverksgränser, omdirigeringar, svarsstorlek och API-avgränsning.
- `seed.json`: offentligt Vegavista-exempel; inga lokala kundutkast ingår.

## Verifierat inför publicering

49 automatiserade tester och syntaxkontroll passerar. I webbgränssnittet på localhost:4174 verifierades duplicering, namnbyte, sparande efter omladdning, import från Vegavista (19 bildkandidater och 6 bildkort), arkivering, återställning, skapad publik kundlänk samt HTML-export med inbäddade pilotbilder. Den tidigare lokala servern på 4173 användes inte av webbversionen.

En granskning hittade att ett första foto utan alt-text kunde klassas som logotyp. Det är rättat och täcks av regressionstest. SVG-logotyper kan visas, men behöver bytas till rasterbild eller tas bort för en fristående HTML-export; feltexten förklarar det.

## Rättning av Hallinc-import

Hallincs rotadress svarade med HTTP 200 och endast 156 byte JavaScript som omdirigerar till `/sv/`. Importen behandlade detta som färdigt innehåll. Hämtaren följer nu identifierbara JavaScript-omdirigeringar, inklusive språkvalet, utan att köra koden. Varje ny adress valideras och kedjan delar gränser för tid och antal omdirigeringar. Allmän JavaScript-rendering ingår fortfarande inte.

Importen tar även med lazy-loaded bakgrundsbilder och h4-rubriker, bevarar mellanrum vid radbrytningar och känner igen en första logotyp vars alt-text matchar domänen. Sidor utan läsbart innehåll ger fel; det öppna projektet och utkastet behålls.

54 tester passerar, inklusive den verkliga typen av språkredirect, blockerade interna mål, omdirigeringsloop, tom import och utkastbevarande. Lokal UI-kontroll av `https://hallinc.se/` gav HallInc, beskrivning, svea@hallinc.se, 9 bildkandidater och 6 bildkort. Logotyp och huvudbild syntes i förhandsvisningen.

### Tre steg för att kontrollera rättningen

1. Ladda om webbverktyget och ange `https://hallinc.se/` under Företagets hemsida.
2. Välj Hämta innehåll. Kontrollera HallInc, text, logotyp och bildkandidater; granska och välj lämpliga bilder innan delning.
3. Spara, ladda om och öppna förslaget igen. Kontrollera att innehållet finns kvar och välj därefter Granska & dela.

## Korrekt startsida — 21 september

Denna ändring fokuserar på startsidan. Fler mallar och importerade undersidor är uppskjutna enligt användarens val. Menyetiketter och CTA hämtas från originalet. Ankare som kan kopplas till importerade innehållsblock stannar i demon; övriga länkar öppnar originalet. Nya kundlänkar använder `/demo.html` på verktygets egen domän och samma renderare som redigeraren. Tidigare delade länkar påverkas inte.

Importen väljer text och bilder inom samma DOM-block och använder innehållet mellan rubriker när avgränsande behållare saknas. Stycken och listor bevaras. Dolda responsiva kopior, navigationsinnehåll, fotnavigering och formulärfält ska inte bli innehållskort. Originalets explicit angivna brandfärg, temafärg eller huvudknappsfärg används när den kan läsas; osäker färg/logotyp/hero markeras för granskning. Upp till två stilmallar läses som text, aldrig som körbar kod. Ingen ny dependency har lagts till.

Hämtningen provar www-adressen för en startsida om den första anslutningen tar mer än sju sekunder eller får ett nätverksfel. Totalt gäller fortfarande 22 sekunder och alla mål valideras. Bildadresser och undersidor ändras inte. Serverloggar visar värdnamn, steg och tid, utan frågesträngar.

Begränsningar: importen kör inte företagets JavaScript eller fullständig CSS-layout. Animationer, formulär och betalflöden återskapas inte. Konfigurerade bakgrunder/video kan representeras med originalets stillbild. Högst 40 textblock med 6 000 tecken per block och 80 bildkandidater tas med; långa sidor får en varning. Ett block använder en vald bild, övriga bilder finns som kandidater. Granska därför förslaget mot originalet innan kunddelning.

### QA i fem steg

1. Öppna `http://localhost:4174` eller publicerade verktyget. Importera `hallinc.se`: kontrollera första rubriken ”Vi realiserar era digitala drömmar.”, blå accent, logo och menyn Hem/Tjänster/Kontakt/Annat.
2. Importera `vegavista.se`: kontrollera Maximal synlighet, originalets bakgrundsbild, meny samt att varje plats har sin egen storlek och bild.
3. Importera `verkli.com`: kontrollera omdirigering till `www.verkli.com/waitlist`, rubriken ”Your story. Goes further.” och att ”Loading signup” inte ingår.
4. Spara och ladda om. Byt mall och mobilvy: originalmeny och texter ska finnas kvar. Undersideslänkar öppnar originalet.
5. Skapa kundlänk via Granska & dela och öppna den. Jämför innehåll och navigation med förhandsvisningen; kontrollera också projektkopia och HTML-export innan användning med kund.

Automatiska kontroller: 59 Node-tester samt 16 regressioner med riktig DOM i `tests/import-browser.html`. Browserfilen serveras endast lokalt vid QA och ingår inte i den publicerade appen.
