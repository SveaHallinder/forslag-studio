# Hela kundsidan: bilder, text och nästa steg

Det här steget gäller alla 17 designer och projektets importerade undersidor. Knappen **Förfina hela sidan** granskar bildfiler, text, varumärkesunderlag, länkar och aktiva kundformulär. Den pekar vidare till rätt sida och redigeringsfält.

| Before | After | Why |
| --- | --- | --- |
| Bildproblem upptäcks inför delning, utan samlad förbättringsvy. | Genomgången visar upplösning och föreslår en större läsbar bild från samma bildgrupp. Bildbyten kan användas och ångras. | Bättre skärpa med bevarad koppling mellan innehåll och bilder. Manuella utsnitt ersätts inte. |
| Lång importerad löptext blir ett sammanhängande block. | Text utan egna radbrytningar delas vid meningsgränser när den är lång. | Läsbarare sektioner utan att ändra ord, priser eller fakta. Menyer och egna radbrytningar behålls. |
| Kontaktknappens etikett är visuellt dold i flera designer. | Knappens text visas och adressen får en kartlänk. | Besökaren förstår nästa steg. Kontaktsektionen prioriterar kontakt framför sidans köpknapp. |
| Mobilen behöver scrolla till en handling; undersidor kan sakna importerade kontaktuppgifter. | Mobilen får en kompakt handlingsrad. Undersidor ärver företagets kontaktuppgifter om de saknar egna. | Kontakt och vägbeskrivning finns tillgängliga genom hela kundflödet. Raden döljs när menyn öppnas. |
| Genomgången kan missa kvarvarande arbetsmaterial. | Platshållare, långa rubriker, tomma sektioner och saknade nästa steg markeras på rätt sida. | Granskaren kan rätta underlaget före kundvisning. |

## Verifierat

- `npm run lint`, `npm run build` och 422 Node-tester passerar.
- De fem testerna för import via lokal/online webbläsaragent passerar.
- 136 kundsidor: alla 17 designer i 320, 375, 820 och 1280 px, med vanlig och lång knapptext. Ingen horisontell scroll; mobilknappar, meny/Escape, synlig kontaktetikett, reserverat sidfotsutrymme och originaltext kontrolleras.
- 252 befintliga layoutfall för sju helhetsstilar passerar, inklusive egna typsnitt, färger, personliga sidor, manuella bildutsnitt och längre text.
- UI: genomgång, bildbyte, ångra, reparation till undersidans rubrik och navigation till undersida med ärvda kontaktvägar kontrollerade.

## QA i UI – fem steg

1. Öppna `http://localhost:4183/`, välj ett förslag och tryck **Förfina hela sidan**. Kontrollera antalet sidor och bildfiler.
2. Tryck **Öppna delen** på en markerad punkt. Kontrollera att rätt sida, flik och fält öppnas. Rätta text eller bildval med företagets underlag.
3. Om ett bättre bildval föreslås: använd det, granska utsnittet i förhandsvisningen och prova **Ångra bildbyten**. Kontrollera igen efter ändringar.
4. Välj **Mobil**, öppna hela förhandsvisningen, scrolla till sidfoten och använd menyn och undersidorna. Kontrollera kontaktknapp och **Hitta hit**. Långa etiketter förkortas visuellt till två rader; hela etiketten finns för skärmläsare.
5. Tryck **Granska & dela**. Åtgärda blockerande bild-/länk-/formulärfel och granska faktapåminnelser. Öppna kundlänken på telefon. Slutkontrollera företagets kopplade boknings- och betalningssystem hos leverantören.

## Praktiska gränser

Genomgången skapar inte nya bilder, uppskalade pixlar eller påhittad företagstext. Bildförslag använder bara läsbara bilder i samma redan valda grupp med jämförbara proportioner och fler pixlar; en trasig bild kan ersättas från sin egen grupp. Originalsnapshot och ångra bevarar underlaget. Om färskt underlag saknas behöver användaren komplettera det.

Högst 64 bildfiler kontrolleras per genomgång. Ett större projekt markeras som ofullständigt. Manuella utsnitt, vektorer och osäkra bildmått lämnas orörda. En gammal bildplan får inte skriva över senare redigeringar.

Kontaktknappar, kartor och länkar fungerar med företagets angivna destinationer. Ett läsbart kundformulär kontrolleras mot appens API. Det är inte ett bevis på levererade mejl, tillgängliga bokningstider eller genomförd betalning. Ingen reservation, beställning eller kundkommunikation skapas av granskningen.

Lokalt visuellt regressionstest: `http://localhost:4184/qa/whole-page-quality-browser.html` när QA-servern är igång. Bilderna där är illustrativa testdata och sparas inte som kundprojekt.
