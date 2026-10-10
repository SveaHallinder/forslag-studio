# QA – fokuserad redigerare

Testa på http://localhost:4183/ eller den publicerade appen. Använd ett separat QA-förslag.

1. Öppna ett sparat förslag. Företagets underlag är infällt; öppna det och kontrollera hemsideimport, sociala medier och eventuella importnotiser. Ett nytt tomt förslag visar importen direkt.
2. Växla mellan Innehåll, Bilder, Stil och Kontakt. Testa även vänster/höger pil samt Home/End. Endast vald flik ska ha tabbstopp; färger och typsnitt finns under Stil.
3. Lägg till två sektioner. Ändra rubrik och beskrivning, stäng dem och kontrollera att namn och typ syns i listan. Öppna en, byt bild, flytta upp/ned och kontrollera att rätt sektion förblir öppen och att förhandsvisningen följer ordningen.
4. Lägg till och ta bort en tillfällig QA-sektion. Fokus ska hamna på närmaste kvarvarande sektion. Spara, ladda om och kontrollera att innehåll och ordning finns kvar.
5. Öppna Granska & dela på ett importerat förslag med färgvarning. Välj Rätta: Stil ska öppnas och Accentfärg få fokus. Om företaget & fördelar ska kunna öppnas under Innehåll.
6. Kontrollera 1280 × 720, 1024 × 768, 768 × 1024, 375 × 812 och ett kort fönster. Inga horisontella sidrullningar. Desktop visar redigeraren och förhandsvisningen samtidigt; mobilfält använder 16 px och flikarna är minst 44 px höga. Testa Utöka vyn och Escape.
7. Öppna Alla mallar, förhandsgranska en annan design och avbryt. Den sparade designen ska finnas kvar. Kontrollera även Mina förslag och att du kan återgå till redigering.

## Verifiering

- `npm run lint`: syntax och unika HTML-id:n.
- `npm test`: 390 tester, inklusive tre navigationsregressioner.
- `npm run test:browser`: fem befintliga tester för JavaScript-import; dessa ersätter inte visuell UI-kontroll.
- `npm run build`: Worker och redigerarens resurser byggda.
- Manuell UI-kontroll via Codex-webbläsaren: flikar/tangentbord, sektioner, ordning, sparning/omladdning, rättningslänk, responsivitet och utökad vy.

## Designgranskning

| Före | Efter |
| --- | --- |
| Alla sektioner expanderade i ett långt formulär | Namngivna sektioner som öppnas vid behov |
| Färger och typsnitt mellan text och bildkort | Egen Stil-flik; innehåll samlat under Innehåll |
| Importverktyg alltid öppna | Infällda på sparade förslag; synliga importnotiser och separat status |
| Förhandsvisningen fortsatte nedanför laptopskärmen | Delad arbetsyta inom fönstret; vanlig sidrullning på mobil och korta fönster |

Inga nya beroenden, schemaändringar eller ändringar av kundsidornas mallar.
