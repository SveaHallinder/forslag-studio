# Förslagskvalitet — 2026-10-26

## Ändring

- Bildvalet väger in bildens egna etiketter och den aktuella sektionens text. Importen bevarar uttryckligt bildfokus och väljer hel bild för omaskerade porträtt/produkter. Manuella bildutsnitt bevaras.
- Tydligt märkta meny-, öppettids-, tjänste- och kundcaseavsnitt i introduktionen kan flyttas till separata redigerbara sektioner. Befintliga ord, priser och tider bevaras.
- Tre designförslag visar sina föreslagna typsnitt. Konsultförslagen använder mer åtskilda kompositioner. Originaltypsnitt finns kvar som val.
- Generiska kontaktknappar kan få en konkret etikett för en befintlig destination. Anpassad knapptext lämnas kvar. Text- och bildändringar kräver ett aktivt val och kan ångras.
- Granska & dela samt Förfina hela sidan provrenderar startsida och undersidor vid 320 och 1280 px. Horisontellt överflöde och klippta rubriker blockerar delning. Möjlig oskärpa och omfattande text visas som granskningspunkter. En avbruten eller ofullständig layoutkontroll godkänns inte.

## Verifierat

- `npm test`: 491 godkända, 0 fel.
- `npm run lint`: godkänd syntax och unika HTML-id:n.
- `npm run build`: godkänd editor- och Worker-build.
- `tests/visual-quality-browser.html`: 56 godkända webbläsarkontroller. Alla 18 designer i mobil/desktop, undersidor, avsiktligt överflöde, avbrott, källtext, knappar, kompositionsvariation och avkodad bildindikering.
- `tests/import-browser.html`: 94 godkända, 0 fel; inklusive befintligt fokus samt porträtt-/produktinramning.
- `tests/proposal-refinements-browser.html`: 124 godkända; inklusive oberoende val, tillämpning, ångra, skydd för senare ändringar och snabb stängning/återöppning.
- Byggd app på `http://localhost:4183/`: Granska & dela visar 2 av 2 layoutvyer för ett sparat QA-exempel. Saknade caféuppgifter markeras. Inget sparat kundprojekt ändrades eller sparades under kontrollen.
- Mobilgranskning i 390 px: dialogens clientWidth och scrollWidth båda 360 px, två sammanställningskolumner och synlig stängknapp.
- Befintlig lokal Chromium-importer startar med `Chromium ready`. Ingen ny dependency eller schemaändring. Leverantörernas boknings-, betalnings- och mejlflöden ändrades inte och är inte slutprovade av denna iteration.

## Kort QA-script

1. Öppna `http://localhost:4183/` och en projektkopia. Gå till **Design → Fler verktyg → Få tre förslag**. Jämför komposition och typografi; kontrollera att kundens innehåll finns kvar.
2. I kopian, använd en introduktion med en kort inledning följd av separata rubrikrader **MENY** och **ÖPPETTIDER**, med företagets bekräftade text under respektive rubrik. Välj **Förfina hela sidan** och kontrollera det föreslagna innehållet före tillämpning.
3. Välj text-, bild- och knappförbättringar var för sig. Kontrollera att inga ord/priser/destinationer uppfinns. Tillämpa, kontrollera förhandsvisningen och använd **Ångra förbättringar**. Gör därefter en manuell ändring och kontrollera att en gammal förbättringsplan inte kan skriva över den.
4. Öppna **Bilder** och kontrollera bildfokus i mobil/desktop. En liten eller möjligen mjuk bild ska ge en granskningspunkt. Ett manuellt bildutsnitt ska vara kvar efter förfiningen.
5. Välj **Granska & dela**. Kontrollera räknaren för bilder och layoutvyer, följ **Rätta** till rätt sida/fält och kontrollera igen. Stäng och öppna snabbt; den nya kontrollen ska kunna avslutas.
6. Granska den kompletta kunddemon på en verklig mobil före kundvisning. Bekräfta meny, priser, öppettider, adress, kontaktvägar och företagets externa system. Spara först när du godkänt förslaget.

## Avgränsningar

Bildrelevans bygger på källans ord och bildmått, inte motivigenkänning. Bildfokus läses från säkra inline-värden; ingen ansiktsposition gissas. Den begränsade detaljskärpemätningen är en uppskattning för avkodade JPEG/WebP/AVIF-bilder, inte ett garanterat oskärpetest. Tom grafik undantas.

Strukturerad text kräver tydliga befintliga rubriker och en kort inledning; saknade affärsuppgifter skapas inte. Layoutkontrollen täcker två bestämda bredder, högst de importerbara sex sidorna och utvalda viktiga textelement. Den ersätter inte visuell granskning av varje bild, sektion och interaktivt kundflöde.
