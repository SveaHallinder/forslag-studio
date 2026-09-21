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

## Utökad importkontroll — 21 september

Importen hoppar nu över innehåll som entydigt döljs av tillgänglig CSS. Villkorliga regler, utskriftsstilar och möjliga visningsundantag hanteras konservativt. CSS parsas utan att installeras i sidan eller ladda dess resurser. Menykontroller och hopplänkar filtreras bort, medan riktiga länkar till undersidor med dropdown-menyer bevaras. Elementor-headerlogotyper känns igen. Bilders storlekssuffix används för att hindra små porträtt från att bli huvudbild. En tom sektion lånar inte längre efterföljande innehåll, och bilder i nästa avgränsade block tillhör det blocket.

Verifiering: 59 Node-tester, 25 DOM-regressioner, syntaxkontroll och bygge. Full import i editorn på localhost gav Pascalidous synliga introduktionsrubrik och 15 innehållsblock. Jämförelse med hämtad original-HTML från sex sidor visar rättad rubrik/porträtt för Pascalidou och rättad logo för Optinet; Hallinc, Vegavista och Verkli behåller tidigare huvudrubriker, logotyper och antal block. Dessa jämförelser är inte ett löfte om felfri import från alla webbplatser.

Kvar: CSS-bakgrunder, JavaScript-innehåll och varumärkesfärger utan tydlig källa behöver ibland manuella val. Mer branschmallar och undersidor ingår inte i denna rättning. Inga nya beroenden eller ändringar av sparformatet.

### QA i fem steg för rättningen

1. Öppna http://localhost:4174 eller webbverktyget. Spara eventuellt pågående arbete och ladda om.
2. Importera `pascalidou.com`: huvudrubriken ska börja med ”Flerfaldigt prisbelönt”, inte ”Hem”. Kontrollera porträttet och att hopplänken och menyknappen inte blivit menyalternativ.
3. Spara testutkastet. Importera `optinet.se`: kontrollera logotypen. Små kundporträtt ska inte bli huvudbild; välj en relevant bild manuellt om huvudbild saknas.
4. Spara mellan importer och prova Hallinc, Vegavista och Verkli. Jämför rubriker, meny, bilder och texter med respektive original.
5. Granska mobilvyn, spara och öppna en kundlänk. Kontrollera innehållet före delning och ta en projektkopia som backup.

## Namn, färger och fler bildkällor

Företagsnamn som kan styrkas av domänen väljs framför SEO-rubriker; undermappar och subdomänetiketter används inte som bevis för företagsnamnet. En identifierad headerlogos namn prioriteras framför sidtiteln. Elementor-sidans egna kit- och sidstilar prioriteras inom den befintliga gränsen på två stilmallar. Relativa CSS-adresser bedöms mot originalets adress och felaktiga länkar ignoreras.

Importen läser också `data-bg-image` och vanliga bildadresser i `data-background`. CSS-färger och gradienter blir inte bildadresser. Ett aktivt bildspel före den första innehållsrubriken kan ge huvudbild när rubrikens eget block saknar bild. Bildspel längre ned på sidan flyttas inte till huvudbilden.

Verifierat: 59 Node-tester och 37 DOM-regressioner. Full UI-import av Café Orion ger rätt namn och första bildspelsfoto; logotyp och huvudbild laddar i förhandsvisningen. Full UI-import av Optinet ger namnet Optinet, originalets blå färg `#324f7c`, 24 bildkandidater och 16 block, inklusive tidigare missade tjänstebilder. Sparande och öppning av skapad kunddemo har kontrollerats lokalt. Ingen ny dependency eller ändring av sparformatet.

### QA i fem steg

1. Öppna http://localhost:4174 eller den publicerade appen och spara pågående arbete innan import.
2. Importera `www.optinet.se`. Kontrollera namnet, blå accent och bilderna på tjänstekorten. Huvudbilden lämnas tom när ingen säker bild finns vid originalrubriken.
3. Spara, ladda om och kontrollera att innehåll och färg finns kvar. Välj Granska & dela och öppna demolänken; menyn ska leda till originalets undersidor.
4. Importera `www.cafeorion.se`. Kontrollera namnet Café Orion och att huvudbilden är första bilden från originalets bildspel. Granska kvarvarande påminnelser om färg och kontaktuppgifter.
5. Spara och kontrollera desktop och mobil innan kunddelning. Prova också Hallinc, Vegavista eller Verkli för att jämföra med tidigare fungerande importer.

## Huvudmeny, kontaktuppgifter och bildkopplingar

Importen väljer märkta huvudmenyer och stöder Max Mega Menu. Tomma menyknappar kan inte längre slå ut menyn, vilket rättar Vegavistas navigation. Vanliga undermenyer behåller sin föräldralänk; när föräldern endast öppnar en dropdown tas dess riktiga länkar med i den befintliga platta menyn. Undersidor öppnas fortfarande på originalet.

Uttryckligt märkta telefonnummer och mejladresser i vanlig text hämtas, med kontaktområden prioriterade framför brödtext. Kontaktlänkar går först. Gatuadress med postnummer kan läsas i kontaktområden. Exempeltext, organisationsnummer och öppettider ska inte bli kontaktuppgifter. Mindre bilder kan användas i sitt innehållsblock utan att bli huvudbild. Lazy-srcset med dataplatsmarkör och kommatecken i bildadressen stöds.

Verifierat: 60 Node-tester, 52 DOM-regressioner, lint och bygge. Jämförelse med originalinnehåll från sex webbplatser. Lokal UI-import av Café Orion visar telefon, adress, huvudbild och två mindre sektionsbilder; kontaktuppgifter följer med till sparande och kundlänk. Vegavistas fyra menylänkar visas efter import. Optinets huvudmeny och verkliga Om Optinet/Kontakta oss-länkar visas, och alla 11 valda bilder laddade i mobilförhandsvisningen. Ingen ny dependency eller ändring av sparformatet.

Kvarvarande begränsningar: JavaScript-renderade sidor och CSS-bilder utan läsbar bildkälla stöds inte fullständigt. Färg utan säker källa kräver manuellt val. Ljusa transparenta logotyper, exempelvis Optinets, behöver granskas mot mallens bakgrund. Importen bevarar en bild per block och använder en platt meny; den återskapar inte originalets interaktiva undermenyer. Fler mallar och importerade undersidor är fortfarande uppskjutna.

### QA i fem steg

1. Öppna http://localhost:4174 eller den publicerade länken. Spara pågående arbete och ladda om för att få uppdateringen.
2. Importera `www.cafeorion.se`. Kontrollera telefon `033-41 31 86`, adress `Österlånggatan 51, 503 37 Borås` och bilderna för Stort sortiment respektive Presentkort.
3. Spara och ladda om. Skapa kundlänk via Granska & dela; kontrollera samma kontaktuppgifter, telefonlänk och bilder där.
4. Spara före nästa import. Importera `vegavista.se`: menyn ska innehålla DooH, Media, För fastighetsägare och Om oss.
5. Importera `www.optinet.se`. Kontrollera huvudmenyn, länkarna Om Optinet och Kontakta oss samt bilder i mobilvyn. Granska logotypens kontrast och välj en lämplig variant före kunddelning.

## Designpolish med UI UX Pro Max

De tre befintliga mallarna har fått tydligare läsbredd, responsiva rubriker, avstånd och avdelare mellan originalets innehållsblock. Studio behåller sitt mörka uttryck med något kraftigare rubriktext. Tjänster behåller sin delade layout; importerade rubriker tvingas inte längre till versaler. Copy, bilder, färgval, länkar och sparformat är oförändrade.

Logotyper visas på en neutral grå platta tillsammans med företagsnamnet, så att exempelvis Optinets vita logo blir synlig även i den ljusa mallen. Detta är en generell bakgrund, inte automatisk analys av logotypens färger; ovanliga logotyper behöver fortfarande granskas. Menylänkar har minst 44 px höjd, synlig tangentbordsfokus och plats att radbrytas. Studio-menyn växer med innehållet på desktop. Reducerad rörelse stänger även av knappens förflyttning vid hover.

Underlag: UI UX Pro Max-sökningar om textkontrast, klickytor och reducerad rörelse. Befintlig HTML/CSS/JavaScript används utan nya beroenden. Verifierat med lint, bygge och 60 befintliga tester. Alla tre mallar kontrollerades med 12 menylänkar vid 320, 375, 820 och 1440 px: inget horisontellt sidöverflöde, minst 44 px länkhöjd och menylänkar inom huvudets höjd. Optinets ljusa logo kontrollerades visuellt i samtliga tre mallars mobilvy.

### QA i fem steg

1. Spara eventuellt utkast och ladda om http://localhost:4174 eller den publicerade appen.
2. Öppna ett importerat förslag, exempelvis Optinet. Kontrollera logotyp, företagsnamn och ursprungliga menytexter.
3. Växla mellan Bild & berättelse, Studio och Tjänster. Kontrollera att rubriker, texter, bilder och destinationer finns kvar.
4. Prova mobilvy och desktop. Kontrollera läsbredd, sektionsavstånd och att en lång meny ryms utan att täcka rubriken.
5. Spara och skapa en kundlänk. Öppna den och kontrollera samma design samt synligt fokus när du tabbar mellan länkarna.
