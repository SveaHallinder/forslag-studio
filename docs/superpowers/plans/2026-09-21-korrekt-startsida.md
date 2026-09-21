# Korrekt startsida — genomförande

Godkänd omfattning: startsida. Inga nya branschmallar eller importerade undersidor i denna ändring.

- [ ] `worker.mjs`, `tests/worker.test.mjs`: test för nätverkstimeout på rotadress; begränsad www-reservväg, gemensam tidsgräns och oförändrad säkerhetsvalidering. Logga steg och värdnamn utan frågesträng.
- [ ] `public/import-content.mjs`: bevara DOM-sammanhang. Separera sidhuvud/huvudinnehåll/footer, välj hero inom huvudrubrikens sektion, koppla kortbild inom närmaste gemensamma innehållsblock, behåll copy och CTA. Läs originalmenyn och tydliga brandvärden.
- [ ] `public/render.mjs`, `public/studio.mjs`: normalisera valfria startsidesfält bakåtkompatibelt, rendera originalmeny och CTA, sektioners ankare, gör navigeringen användbar på mobil. Visa granskningsvarningar.
- [ ] `public/browser-api.mjs`, `public/demo.html`, `public/demo.mjs`: gemensam renderare i nya kundlänkar, oförändrade gamla länkar. Begränsa hämtning av CSS till brandinformation.
- [ ] Tester för säker navigation, innehållsbevarande, gamla projekt och delning. Kör lint, test och build. Jämför verkliga importer med original via UI. Rätta observerade fel innan publicering.

QA: importera Hallinc, jämför rubrik/bilder; importera Vegavista och kontrollera menyn; importera verkli.com och kontrollera faktisk landningssida; spara/ladda om och byt mall; öppna ny kundlänk och testa mobilnavigation. Blockerade källor måste ge begripligt fel och behålla utkastet.
