# Kundens bildvisare

| Before | After | Why |
| --- | --- | --- |
| Även första huvudbilden i ett galleri laddas med `lazy`. | Första huvudbilden laddas direkt med hög prioritet. Loggor och senare bilder får inte konkurrera om samma prioritet. | Huvudbilden kan börja laddas tidigare. Faktisk laddtid beror på bildfil och nätverk. |
| Besökaren ser bara sidans valda utsnitt. | Huvudbilder och bildgallerier får en knapp som öppnar hela bilden med dess befintliga bildtext. | Detaljer går att granska utan att förstöra sidans komposition eller ändra kundens manuella utsnitt. |
| Gallerier saknar en sammanhängande visning på mobilen. | En bildvisare fyller mobilskärmen, med 48 px knappar, bildtexter och bläddring inom samma galleri. | Besökaren kan se företagets bilder och enkelt återgå till kontakt- eller bokningsflödet. |
| Bilder på undersidor är isolerade från en eventuell visare. | Bildvisaren följer den aktiva undersidan och stängs vid sidbyte. | Startsidan blandas inte ihop med undersidans innehåll. |
| Bildinteraktion kan konkurrera med redigering. | Öppningsknapparna döljs i redigeringsläge. Logotypgrupper får inga visarknappar. | Redaktionellt arbete och företagets varumärke behåller sina befintliga flöden. |

## Verifierat

- 426 Node-tester och fem tester av webbläsarimport passerar.
- 68 bildflöden: 17 designer i 320, 375, 820 och 1280 px. Öppning, hela bilden, bildtext, bläddring, fokusåterställning, undersidor, enstaka bild, redigeringsläge och reducerad rörelse kontrolleras.
- Trasig bild visar ett felmeddelande. Bilder och bildtexter visas även utan JavaScript; webbläsare utan stöd för native dialog får inga inaktiva öppningsknappar.
- 136 befintliga kontroller av hela kundsidan och 252 layoutfall passerar: meny, mobilhandlingar, sidfot, originaltext, bildutsnitt, branding och typsnitt.
- Enter, piltangent och Escape är kontrollerade genom faktisk tangentbordsinmatning. Escape återför fokus till öppningsknappen.
- Rörelsen använder 200 ms för öppning och 120 ms för bildbyte. Tangentbordsanvändning, reducerad rörelse och statisk förhandsvisning får ingen sådan animation.

## QA i UI – fem steg

1. Öppna `http://localhost:4183/`, välj ett projekt och öppna kundens hela förhandsvisning. Tryck på bildens utökningsknapp.
2. Kontrollera att hela bilden visas, att rätt bildtext finns och att **Nästa bild** håller sig inom samma bildgrupp. En enstaka bild ska sakna bläddringsknappar.
3. Stäng med Escape. Kontrollera att fokus återgår till öppningsknappen och att sidan går att scrolla igen. Prova även Enter och piltangenter.
4. Öppna en undersida och prova dess galleri. Byt till mobilvy; kontrollera att knappar och bildtext ryms och att du kan återvända till företagets kontaktvägar.
5. Aktivera redigering: bildens befintliga redigeringsflöde ska fungera och utökningsknappen ska vara dold. Stäng redigeringsläget och öppna bildvisaren igen.

Lokalt regressionstest: `http://localhost:4184/qa/customer-gallery-browser.html` medan QA-servern körs. Testbilderna är illustrativa och sparas inte som kundprojekt.

## Gränser

Visaren använder projektets redan valda bildfiler. Den skapar inga nya bilder eller större originalfiler. Direkta sektionsbilder utan galleri behåller sin befintliga presentation. Kontakt-, betalnings- och bokningsdestinationer ändras inte av den här förbättringen.
