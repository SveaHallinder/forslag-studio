# Designbibliotek och större förhandsvisning

Utgångspunkt: `29fcd6edf61bd84856bf874d79b528b81b607dd5`.

## Ändrat

- Ett sökbart bibliotek för de 15 befintliga designerna, med branschfilter och företagets innehåll i en scrollbar förhandsvisning.
- Förhandsval ändrar inte utkastet. Designen används först med den tydliga bekräftelseknappen; Avbryt och Escape lämnar utkastet kvar.
- Tre designförslag leder vidare till samma fullständiga granskning.
- Desktop och mobil kan jämföras, inklusive meny, sektioner och sidfot.
- Utöka vyn ger mer plats åt sidan. Tillbaka till redigering eller Escape återställer arbetsytan, även när fokus ligger i förhandsvisningen.
- Diskret tryckfeedback, synligt tangentbordsfokus och stöd för minskad rörelse.

Inga nya appberoenden eller schemaändringar. Installerade agentskills påverkar hur Codex arbetar; de körs inte i den publicerade appen.

## Installerade skills

Åtta kompletterande skills från `emilkowalski/skill`, commit `e8a175de22ae1e49370fc144c1f3bb9aeedf988d`: animate, review-animations, improve-animations, find-animation-opportunities, prototype, animation-vocabulary, apple-design och pick-ui-library. De finns i `/Users/admin/.codex/skills/` och är tillgängliga från nästa tur.

Den befintliga `emil-design-eng` i `/Users/admin/.agents/skills/` matchade samma officiella version. Installationen gjordes med skill-installer från den offentliga källan https://emilkowal.ski/skill.

## QA via UI

Öppna http://localhost:4183/ efter `npm run build` och `npm start -- --port 4183`.

1. Öppna ett förslag och välj Alla mallar. Kontrollera att de 15 designerna visas med företagets innehåll.
2. Sök på `cafe`, välj Mat & resor och prova Little Café. Sök sedan på en obefintlig design och använd Visa alla designer i det tomma resultatet.
3. Välj Cinema och scrolla eller använd menyn till kontakt och sidfot. Växla Desktop/Mobil. Kontrollera att vald design i utkastet fortfarande är oförändrad.
4. Avbryt, öppna igen och tryck Escape inne i förhandsvisningen. Utgå från ett sparat förslag; det ska fortfarande visa SPARAT.
5. I ett separat QA-utkast: använd Cinema, spara och ladda om. Kontrollera att både Cinema och huvudrubriken finns kvar.
6. Klicka Utöka vyn. Kontrollera att redigeringspanelen döljs och att Tillbaka till redigering samt Escape inne i förhandsvisningen återställer arbetsytan.
7. Prova 375, 768, 1024 och desktopbredd. Kontrollera att designbiblioteket ryms utan horisontell sidscroll och att Avbryt/Använd syns, även med Rådgivning & juridik.

## Verifierat lokalt

- UI-stegen ovan: sökning, tomt resultat, filter, förhandsval, kontakt/sidfot, avbryt, Escape, designbyte, sparning och omladdning.
- Sparning testades i ett separat, märkt Designbibliotek QA-utkast. HallInc och Vegavista behöll sina sparade designer.
- 375 × 812, 768 × 1024, 1024 × 768 och ordinarie desktop 1280 × 720; inga överflödande bibliotekskanter eller dolda handlingsknappar i dessa mått.
- Webbläsarkonsol utan fel eller varningar under granskningen.
- `npm run lint`, `npm run build` och `git diff --check` godkända. `npm test`: 387/387; `npm run test:browser`: 5/5.

## Filer

`public/index.html`, `public/studio.mjs`, `public/studio.css`, `public/design-workbench.mjs`, `public/design-workbench.css`, nya `public/template-picker.mjs`, `tests/template-picker.test.mjs` samt denna QA-fil.
