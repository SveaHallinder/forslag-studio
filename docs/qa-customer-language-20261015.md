# Samma språk genom kundsidan

| Före | Efter | Varför |
| --- | --- | --- |
| Engelska förslag kunde ha svenska menyknappar, kontaktetiketter och sidfot | Genererad gränssnittstext följer svenska, engelska eller rumänska genom samtliga 17 designer | Kundens resa ska kännas sammanhängande |
| Delade kundlänkar tappade dokumentets språk när HTML monterades | Rätt `html lang` följer med vid öppning, payloadbyte och undersidenavigering | Skärmläsare och bildvisare får rätt språk |
| Bildvisaren behöll språk från föregående undersida | Knappar, dialogetikett och räknare uppdateras vid sidbyte | Samma upplevelse i export och delad kundlänk |
| Kontaktknappens handling doldes bakom en ensam pil i den nya designen | En synlig, lokaliserad knapptext tillsammans med pilen | Besökaren ser vad nästa klick gör |
| Källhänvisningen kallade även Instagram för en webbplats | Riktiga sociala domäner får korrekt profilhänvisning | Tydligare proveniens utan att ändra källänken |

Språket härleds från huvudtext och tydliga navigationsetiketter. Företagsnamn, domän och bildtexter avgör inte språket. Vid otydligt underlag används svenska. Det är ingen automatisk översättning av företagets innehåll. Originaltexter, menyetiketter, bilder, priser, kontaktvägar och bokningsdestinationer behålls. Inga dependencies eller databasscheman läggs till.

## Verifiering

- `tests/customer-language-browser.html`: **3 016 godkända kontroller** i 17 designer, tre språk och 320/375/820/1280 px. Fristående export, dokumentets språk, meny, kontakt, sidfot, öppna/stäng bildvisaren, synlig kontaktknappstext, bildtexter, delad kundlänk, payloadbyte och undersidans språkbyte ingår.
- Manuell UI-kontroll: engelsk mobilmeny med Escape; rumänsk bildserie med högerpil, rätt bildtext och `2 din 2`.
- `npm test`: **462 tester**. `npm run lint` och `npm run build` krävs före publicering.
- Testerna använder illustrativt underlag på separat lokal QA-origin. Befintliga kundprojekt ändras inte.

## QA via UI – sex steg

1. Öppna `http://localhost:4183/`. Välj **Nytt förslag → Sociala medier** och fyll i ett testföretag, profillänk, beskrivning och egna bilder. Välj engelska som språk och skapa förslaget.
2. Under **Välj design**, jämför Little Café, Magasin & arkitektur och Cinema. Menyknapp, kontakt, sidfot och genererad extraläsning ska vara på engelska.
3. Byt till mobilvy. Öppna menyn, använd en ankarlänk och prova Escape. Kontrollera att kontakt- och kartlänken pekar på inmatade uppgifter.
4. Öppna en bildserie. Bläddra med piltangenterna och stäng med Escape. Kontrollera bildtext, räknare och återställt fokus.
5. Välj **Granska & dela**, öppna kundlänken och prova samma resa. Exportera även HTML och kontrollera den fristående sidan. Det ska finnas en tydlig konceptetikett.
6. Upprepa med svenska och rumänska. För importerade förslag med undersidor, navigera fram och tillbaka och kontrollera att språk och bildvisarens etiketter följer den aktiva sidan.

Språkvalet översätter inte en bio som har skrivits på ett annat språk. Blandat eller mycket kort underlag kan kräva manuell textgranskning. Den här ändringen aktiverar inga betalningar, reservationer eller mejlutskick och verifierar inte externa kundsystem.
