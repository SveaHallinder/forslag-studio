# Hela hemsidan – ny komposition

Den tidigare renderingen gjorde importerade rubriker, brödtext, skärmbilder och sidfotsinnehåll till upprepade stora sektioner. Den nya renderingen använder skilda ytor för erbjudande, tjänsteöversikt, projekt, bildserier, referenser och kontakt.

| Före | Efter | Varför |
| --- | --- | --- |
| En lång ingress konkurrerar med huvudknappen | Kort ingress vid meningsgräns, hela texten under Läs mer | Ett tydligare första intryck utan att skriva om företagets fakta |
| Samma bild och text-layout upprepas | Projektöversikt, växlande uppslag, breda bilder eller produkthyllor beroende på design | Hela sidan får en sammanhängande rytm |
| Små bilder förstoras i stora ytor | Inramade originalbilder med gräns från deras faktiska pixelbredd | Begränsar uppskalning; skapar inte nya bilddetaljer som saknas i originalet |
| Ett citat och företagets egen kommentar har samma uttryck | Citatet skiljs från efterföljande kommentar | Tydligare attribution och läsning |
| Kontakt och legaltext blir en stor innehållssektion | Kontaktfält och kort avslut, övriga originaluppgifter kan öppnas | Besökaren hittar nästa steg |
| Originalfont kan göra flera mallar lika | Explicit val av designens typsnitt i designväljaren | Riktiga designskillnader, med möjlighet att behålla egna fontval |
| Den generiska menylänken Annat konkurrerar med huvudsidor | Sekundär menylänk finns kvar i hela menyn | Mer avsiktlig navigation utan förlorad destination |

14 mallar använder den nya kompositionen. De separata café-, restaurang- och Atelier-renderingarna finns kvar. Alla 17 designer ingår i browserkontrollerna. Företagets sektioner, originaltexter, bildkopplingar, destinationer och redigerbara index finns kvar; utkastet ändras inte när en design bara förhandsvisas.

Typsnittsval under Stil fungerar även efter ombyggnaden. Använd designens typsnitt är markerat i designbiblioteket och påverkar utkastet först vid Använd. Avmarkera för att behålla egna typsnitt. Originalfontens alternativ kan återväljas när ett originalunderlag finns sparat.

Telefon och mejl i tydligt identifierad importerad kontakttext hamnar i redigerbara kontaktfält. Renderingen återställer inte ett telefonfält som användaren har tömt. Originaltexten finns kvar i sitt avsnitt.

## Verifiering

- Kodtester, lint och build körs för den publicerade källversionen.
- 1 320 browserkontroller: riktig HallInc-import, sparat Pebble-underlag och ett tydligt märkt Ateljé Nord-test med illustrativa bilder; 17 designer i 320/375/820/1280 px.
- 174 UI-kontroller för start, designval, egna/designens typsnitt, mobilvy, sparning, återöppning, utkastskydd och kundlänk.
- 70 bildflöden för 17 designer, inklusive delade undersidor, tangentbord, reducerad rörelse, bildtexter, felbild och fallback utan JavaScript.
- Importregressioner med riktig DOM, inklusive kontaktuppgifter i ett importerat innehållsblock.
- Visuell kontroll av hela HallInc-sidan på dator och mobil, inte endast översta skärmen.

## QA i UI – sju steg

1. Öppna `http://localhost:4183/`. Öppna ett sparat förslag eller importera `https://hallinc.se/`. Kontrollera namn, bilder och kontaktfält mot originalet.
2. Välj **Välj design → Bild & berättelse**. Kontrollera att **Använd designens typsnitt** är markerat och prova hela sidan med scroll. Välj Använd för att använda den visade kompositionen.
3. Jämför **Studio**, **Precision** och **Magasin & arkitektur**. Byt till mobilprovsidan. Avbryt ett val och kontrollera att sparad text och stil finns kvar.
4. Under **Stil**, välj Georgia för rubriker och Verdana för brödtext. Förhandsvisningen ska följa med. Öppna designväljaren, avmarkera typsnittsvalet och använd en design; egna fontval ska behållas.
5. På mobil: öppna menyn, välj en tjänst, öppna Läs mer, visa en bild och stäng med Escape. Kontrollera att sidan ryms utan horisontell scroll och att bildtexter och fokus finns kvar.
6. Läs referensen och kontaktavslutet. Originalets extra uppgifter ska kunna öppnas. Kontrollera mejl- och telefonlänkens destination; testet skickar inget mejl och ringer inget samtal.
7. Spara och välj **Granska & dela**. Öppna kundlänken i en ny flik och kontrollera hela sidan och en eventuell importerad undersida.

Inga nya dependencies, databasscheman, åtkomstregler eller externa kundsystem ingår i ändringen. QA sker på separat lokal origin och ändrar inte publicerade kundprojekt. En källbild som redan är suddig behöver fortfarande ersättas med bättre underlag; inramning kan förbättra presentationen men inte återskapa saknade detaljer.
