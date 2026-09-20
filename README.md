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
