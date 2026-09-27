# Förslag Studio online

Webbversion för en säljare som ska kunna börja direkt från en länk, utan installation eller konto. Sex mallar och stöd för startsida plus upp till fem undersidor.

Projekt sparas i IndexedDB i den egna webbläsaren. Andra besökare får en egen projektlista. Ingen projektdata lagras på servern, och listan synkas inte mellan enheter. Rensad webbplatsdata, privat läge eller byte av webbläsare kan innebära att sparade projekt inte finns kvar. Ladda ner **Projektkopia** som backup och öppna den på en annan dator vid behov.

Servern hämtar offentlig HTML och bildfiler för import respektive export. Text, mallar och bildval granskas av säljaren innan delning. JavaScript-beroende eller blockerande företagssidor kan kräva manuell redigering. Kundlänkar använder den befintliga publika demovisaren och fungerar oberoende av säljarens webbläsare.

Inga paketberoenden. Worker-koden använder Cloudflares publika nätverksåtkomst utan privata nätverkskopplingar. Adresser och omdirigeringar valideras, svarsstorlek och tid begränsas. Publik hämtning följer plattformens användningsgränser.

## Originaltypsnitt, branding och bildgrupper

Ny import bevarar separata rubrik- och brödtextfonter med upp till 32 fontvarianter, inklusive Unicode-intervall. Verktyget läser upp till åtta länkade CSS-filer och två importerade stilmallar. Det följer matchande CSS-regler, variabler och arv; osäkra responsiva konflikter markeras för manuell granskning. Fontfiler hämtas genom en begränsad proxy med URL-, storleks- och filtypskontroll. Fallback-text visas direkt under laddning och fontfel syns i redigeraren. Under Innehåll går det att välja originalfont, systemfont eller mallens font.

Färgval utgår från huvudknappen och globala varumärkesvariabler. En genomskinlig huvudlänks textfärg kan användas när samma färg stöds av en global brandvariabel. Fristående widgetfärger, vita/svarta temafärger och osäkra konflikter används inte som säker branding.

Varje innehållsblock och huvudsektionen kan ha upp till tolv bilder med egna bildtexter. Bilder mellan ett avsnitts introduktion och nästa underrubrik stannar i rätt grupp. Teamnamn och roller från bildknappar följer med utan dekorativa nummer. Redigeraren låter dig lägga till, ta bort, sortera och ändra bildtexter. Gallerier staplas på mobil och behåller originalbildens proportioner.

Valfria fält: `typography`, `heroGallery` och `cards[].gallery`. Användaren har godkänt typsnittsdelen och därefter fortsatt arbete med föreslagna bildlistor. Gamla projekt fungerar utan dessa fält. Sparande, projektkopior och kundlänkar behåller dem. HTML-export bäddar in bilder och fontfiler och avbryts med tydligt fel om en nödvändig fil saknas.

Verifierat: lint, bygge, 121 Node-tester, 81 DOM-importfall, 15 CSS-brandingfall samt typsnitt och tvåbildsgalleri i sex mallar vid 375 px. Verklis original jämfördes i webbläsaren: Montserrat Alternates för rubriker, Inter för brödtext och huvudlänkens lila `#7456bd`. Ny import hämtade samma värden och fem teambilder; bildsortering samt sparande/omladdning provades i UI.

Begränsningar: detta är en statisk redesign, ingen garanti att varje webbplats kan återskapas automatiskt. JavaScript-genererade tillstånd, blockerade resurser, CSS utanför hämtningsgränsen och komplexa dynamiska layouter kan kräva handpåläggning. Färger och bildkopplingar behöver fortfarande kontrolleras mot originalet. Att välja mallfont är en avsiktlig reservmöjlighet, inte bevis på lyckad originalfontimport. Ladda om appen och importera på nytt för att förbättra gammalt felimporterat innehåll.

### QA i fem steg

1. Spara utkastet och ladda om appen. Skapa ett nytt förslag och importera `https://www.verkli.com/waitlist`.
2. Kontrollera Montserrat Alternates/Inter under Typsnitt och lila accentfärg. Vänta på fontstatus; byt till mallfont och tillbaka för att se skillnaden.
3. Kontrollera fem bilder under teamavsnittet. Flytta en bild, ändra dess bildtext och kontrollera förhandsvisningen.
4. Prova Desktop/Mobil och de sex mallarna. Spara och ladda om; bildordning, bildtexter och fontval ska vara kvar.
5. Skapa kundlänk och ladda ner HTML. Kontrollera galleri och typografi, och jämför text, navbar, branding och bilder med originalet innan kunddelning.

## Git-backup

Privat repo: https://github.com/sveahall/forslag-studio, standardgren `dev`. Hela den lokala Git-historiken är uppladdad. Backupen innehåller designrättningarna och den valfria reservhämtningen som fortfarande väntar på kontoanslutning. Att spara i Git publicerar inte automatiskt appen.

Återställ med `git clone https://github.com/sveahall/forslag-studio.git`, gå in i mappen och kör `npm run build` följt av `npm start`. Inga npm-paket behöver installeras. Hemliga miljöfiler ignoreras. Kundutkast sparas separat i webbläsaren och ingår inte i kodbackupen; exportera dem med **Projektkopia**. Framtida ändringar behöver committas och pushas för att finnas på GitHub.

## Reservhämtning med webbläsare — anslutning återstår

Koden stöder valfri Cloudflare Browser Run. När vanlig HTML saknar läsbart innehåll gör importen ett reservförsök med en serverbaserad webbläsare. Vanligt HTML-innehåll använder inte denna tjänst. Renderad text och meny behandlas av samma importör. Kvotfel och saknad anslutning avbryter importen; utkastet ska inte ersättas av ett tomt förslag.

**Inte aktiverat eller verifierat mot ett riktigt Cloudflare-konto ännu.** Användaren har godkänt gratisnivån. Kontoanslutning och ett skarpt test återstår. Inga betalplaner har aktiverats. Förberedande verifiering: 105 Node-tester, 68 DOM-importtester, lint och bygge passerar. Lyckat reservflöde, kvotfel och saknad anslutning har provats i UI med simulerade providersvar; utkastet bevarades vid båda felen.

Serverinställningar: `CLOUDFLARE_ACCOUNT_ID`, hemlig `CLOUDFLARE_BROWSER_TOKEN` med endast Browser Rendering Edit för valt konto, och `CLOUDFLARE_BROWSER_PLAN=free`. Sätt den sista först efter att **Workers Free** kontrollerats hos Cloudflare. Flaggan är en aktiveringsspärr, inte en egen faktureringsgräns. Cloudflare hanterar gratiskvoten; ett konto som uppgraderas till Paid måste kopplas från innan det används här. Alla användare av verktyget delar kontots kvot. Inställningarna ska lagras som servermiljövariabler i Sites, aldrig i Git eller i frontend. Lokal förhandsvisning läser samma tre variabler från processen.

[Cloudflares prisvillkor](https://developers.cloudflare.com/browser-run/pricing/) anger 10 webbläsarminuter per dag för Workers Free. [Content-endpointen](https://developers.cloudflare.com/browser-run/quick-actions/content-endpoint/) hämtar HTML efter JavaScript. Kontrollerat 2026-09-22. Botblockering, cookiekrav och ofullständigt laddat innehåll kan fortfarande hindra import.

### QA för reservhämtning

1. Starta med `npm run build` och `npm start`; öppna http://localhost:4174.
2. Importera vanlig HTML, till exempel Verkli. Kontrollera text och meny; ingen reservhämtning ska behövas.
3. Importera en JavaScript-sida utan anslutna serverinställningar. Kontrollera att anslutningsfelet syns och att befintligt utkast är kvar.
4. Efter kontoanslutning: importera en verklig JavaScript-sida, jämför originalets text och meny, spara och öppna kunddemon. Detta steg återstår.

## Innehållsanpassad design

Importerade avsnitt får layout efter sitt innehåll: korta bildblock blir bildkort, längre bildtexter får två kolumner på desktop och rena textavsnitt får läsbar bredd utan tomma bildrutor. På mobil staplas bild och text. Originalets ordning, länkar och sektionsankare bevaras. Tydliga FAQ-par visas med öppningsbara frågor, med svaren synliga från början. Osäker FAQ-struktur behålls som vanlig text. Ändringen gäller alla sex befintliga mallar; inga nya mallar eller sparfält tillkommer.

Importen skiljer navigationsordet Start från företagsnamnet, undviker uttryckligt namngivna dekorationsbilder, behåller citat i rätt avsnitt och separerar intilliggande textetiketter. Synliga bilder med aria-hidden bevaras. Varje block stöder fortfarande en bild: komplexa bildcollage och interaktiva originalkomponenter återskapas inte automatiskt. Den äldre versionens begränsning kring originaltypsnitt är ersatt av uppdateringen ovan. Branding och bildkopplingar behöver fortsatt granskas.

Verifierat: 110 Node-tester, 74 DOM-importtester, lint och bygge. Ny Verkli-import i UI samt sparande/omladdning bevarade separerade etiketter och FAQ-text. Café Orions två bildkort verifierades i rätt ordning på desktop och 375 px, utan horisontell overflow. Underlaget för Café Orion var tidigare hämtad original-HTML.

### QA för designen

1. Spara pågående arbete och ladda om appen. Skapa ett nytt förslag och importera Verkli eller Café Orion.
2. Kontrollera att originalets meny, rubriker och bildtexter hör ihop. Ny import behövs för att rätta tidigare felaktigt importerad text.
3. Växla mellan de sex mallarna och Desktop/Mobil. Bildfria avsnitt ska sakna tomma bildrutor; längre text ska vara läsbar.
4. På Verkli: kontrollera fyra FAQ-frågor med rätt svar, öppna/stäng dem och prova FAQ-länken i menyn.
5. Spara, ladda om och öppna förhandsvisningen. Granska branding och bildval innan kunddelning. Kontrollera även de importerade originalfonterna.

## Senaste importrättningar

FAQ-frågor i HTML-elementet `summary` följer nu med sina svar i originalets ordning. Nästlad text dupliceras inte och dolda FAQ-block tas inte med. Det rättar bland annat Verklis fyra frågor, som tidigare försvann medan svaren importerades.

Responsiva bilder i `picture` kan hämtas från en generell `source`, inklusive lazy-srcset. Bilden stannar i sitt innehållsblock; enbart mobilvillkorliga källor ersätter inte desktopbilden. AVIF stöds genom hämtning och inbäddning i HTML-export, så formatet inte tappas bort vid normalisering.

Huvudknappens bakgrundsfärg kan hämtas ur sidans lästa stilmallar när dess färg är entydig och ogenomskinlig. Villkorliga, transparenta eller motstridiga färgregler används inte som säker branding. Befintliga uttryckliga varumärkesvariabler behåller sitt företräde, och kontrastanpassningen av knapptexten finns kvar. Ingen ny dependency eller ändring av sparformatet.

Verifierat: 96 Node-tester, 68 DOM-importtester, lint och bygge. Ny UI-import av Verkli visar alla fyra FAQ-frågor med rätt svar. Innehållet finns kvar efter sparande/omladdning och i den skapade kundlänken. Varje huvudfel återskapades i ett misslyckat regressionstest före rättningen.

### QA i fyra steg

1. Spara öppet utkast och ladda om appen. Importera `https://www.verkli.com/waitlist` på nytt.
2. Leta upp blocket Before the next chapter. Kontrollera att frågorna What is Verkli?, Who is the waitlist for?, When can I get access? och Can I bring a book I’ve already written? står framför rätt svar.
3. Spara, ladda om och skapa kundlänk. Kontrollera att frågorna och svaren finns kvar och ryms i mobilvyn.
4. För en webbplats med responsiva bilder eller huvudknapp i CSS: jämför vald bild och accentfärg med originalet. Prova HTML-export; importerade AVIF-bilder ska inte försvinna. Osäkra färgval ska fortsatt markeras för manuell granskning.

## Sex designer och importerade undersidor (version 12)

Markera **Ta med upp till fem undersidor från menyn** vid import. Verktyget hämtar unika sidlänkar på samma webbplats, med högst två sidimporter samtidigt. Sidor som inte kan hämtas lämnar startsidan intakt och deras menylänkar går till originalet. Fler än fem sidlänkar, dokument, externa sidor och länkar med sökparametrar importeras inte. Omdirigeringar och läsbara sektionsankare kopplas till den importerade sidan.

**Sida att redigera** väljer innehåll, bildval och kontaktuppgifter. Företagsnamn, meny, logotyp, accentfärg och mall gäller hela webbplatsen. Sparande, projektkopior, kundlänkar och HTML-export inkluderar alla importerade sidor. Det nya valfria `pages`-fältet är godkänt av användaren; gamla projekt och länkar fungerar fortsatt. Granskningen kontrollerar även undersidornas rubriker och länkar och leder till rätt sida vid Rätta.

Tre nya uttryck finns utöver Bild & berättelse, Studio och Tjänster: **Café & restaurang**, **Hälsa & skönhet** och **Butik & sortiment**. De använder samma originalinnehåll, inga påhittade produkter, priser eller recensioner. Kunddemon växlar mellan importerade sidor med samma meny. Bakåtknappen och omladdning behåller vald sida. Länkar till originalets formulär eller saknade avsnitt fortsätter gå till originalet. HTML-export bäddar in använda bilder på samtliga sidor och avbryts tydligt om en bild inte går att hämta.

Begränsningar: detta är designförslag, inte återbyggda betalningar, bokningssystem eller formulär. Importen läser offentlig HTML och upp till två stilmallar per sida; den kör inte företagets JavaScript. Sidor med botblockering eller innehåll som kräver JavaScript kan behöva fyllas i manuellt. Navigationen är platt, högst tolv länkar; varje innehållsblock har en bild. Säljaren behöver fortsatt jämföra innehåll, branding och bildval med originalet. Ingen ny dependency, betald tjänst eller gemensam säljarinloggning har lagts till.

Verifierat i denna uppdatering: 94 automatiserade tester, 61 DOM-importtester, lint och bygge. Café Orion importerades via det riktiga gränssnittet med fem undersidor. Separat sidredigering, sparande/omladdning, mallbyte, delningsgranskning och sidval i förhandsvisning testades. Kundlänkens nya version visas även i samma flik. Delad och fristående navigering klarade Bakåt, omladdning, sektionslänkar och extern formulärlänk. De tre nya designerna och redigeraren ryms vid 375 px. Nedladdad HTML innehöll sex sidmallar och 23 inbäddade bildreferenser, utan externa bildreferenser.

### QA i sex steg

1. Öppna http://localhost:4174 eller den publicerade appen. Spara pågående utkast och ladda om. Importera `https://www.cafeorion.se/` med undersidor markerade.
2. Välj Om Caféet under Sida att redigera. Ändra dess rubrik, återgå till Startsida och kontrollera att startsidans rubrik är kvar. Prova också sidval i förhandsvisningens meny.
3. Byt mellan de sex mallarna. Kontrollera originaltext, bilder och menylänkar på desktop och mobil. Spara och ladda om; undersidans ändring och valt utseende ska finnas kvar.
4. Töm tillfälligt en undersidas huvudrubrik. Granska & dela ska stoppa delning och Rätta öppna den sidan. Återställ rubriken och skapa kundlänk.
5. Öppna kundlänken, växla mellan startsida och undersidor och prova Bakåt samt omladdning. En ny demolänk i samma flik ska visa den nya versionen. Länkar till sidor eller formulär som inte importerats ska gå till originalet.
6. Ladda ner HTML och projektkopia. Öppna HTML-filen och prova undersidorna med inbäddade bilder. Återställ projektkopian och kontrollera samma sidor och innehåll.

Äldre leveransanteckningar nedan beskriver tidigare versioner; uppgifterna om enbart tre mallar och startsida är ersatta av denna version.

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

## Redigera huvudmenyn och återställ större projekt

Under Innehåll → Redigera meny går det att ändra text, destination och ordning, samt lägga till eller ta bort länkar. Välj ett befintligt innehållsblock för en intern länk eller ange en fullständig extern adress. Högst tolv länkar stöds. Ändringar används först vid Använd menyn; Avbryt lämnar förslaget orört. Felaktiga länkar markeras vid rätt fält. Manuellt skrivna ankare måste motsvara ett befintligt block; väljaren visar giltiga destinationer. Undersidor öppnas på originalets webbplats.

UI UX Pro Max ligger till grund för tydliga fältfel, fokusmarkering och klickytor. Menyn följer med vid sparande, projektkopia och kunddelning. Befintliga förslags introduktion och huvudknapp behålls när deras meny redigeras. Textbaserade importer behåller sin layout även utan meny, och äldre kundlänkar utan importdatum fungerar fortsatt. Projektkopior kan återställas med upp till 40 innehållsblock, samma gräns som importen och visningen; tidigare avvisades fler än tolv.

Verifierat: 66 Node-tester, lint och bygge. Lokal UI-kontroll av menytext, intern destination, ordning, tillägg, tolvgräns, ogiltig länk, Avbryt, sparande efter omladdning och samma meny i kundlänk. Dialogen ryms vid 375 px utan horisontellt överflöde. Återställning med 40 block och avvisning av 41 verifieras automatiskt. Inga nya beroenden eller ändringar av sparformatet. Importens tidigare begränsningar gäller fortfarande.

### QA i fem steg

1. Spara pågående utkast och ladda om http://localhost:4174 eller den publicerade appen. Öppna ett sparat förslag.
2. Välj Innehåll → Redigera meny. Ändra en text, välj Överst på sidan och flytta länken. Välj Använd menyn och kontrollera förhandsvisningen.
3. Öppna menyn igen och skriv en ogiltig destination. Använd menyn ska visa ett tydligt fältfel. Välj Avbryt och kontrollera att föregående meny är kvar.
4. Spara, ladda om och skapa kundlänk via Granska & dela. Kontrollera texter, ordning och destinationer på kundsidan, även i mobilvy.
5. Ladda ner en projektkopia från ett förslag med fler än tolv innehållsblock. Återställ den via Mina förslag och kontrollera sista blocket och menyn.

## Leveranskontroll: startsida, redigering och export

Importen bevarar nu enkel sidbyggartext i div-element och föredrar högupplösta responsiva bilder framför små src-filer. Uttryckliga lazy-bilder behåller företräde framför vanliga platshållare. Bakgrundsbilder från lästa stilmallar kopplas till rätt innehållsblock och deras relativa adresser löses mot stilmallens slutadress efter omdirigering. Riktiga innehållsbilder går före CSS-dekorationer, även när bilden är liten. Motstridiga eller villkorliga bakgrunder och sidomfattande dekorationer väljs inte automatiskt.

Innehållsblock kan flyttas upp/ned med text, bild och sektionsankare tillsammans. Blockets rubriklänk kan ändras eller tömmas. Granska & dela hittar ogiltiga huvudknappslänkar och länkar till borttagna block; Rätta leder till rätt fält. Menyredigeraren accepterar bara interna ankare som finns i förslaget. Mobilens projektlista kan nu innehålla många förslag utan att göra hela sidan bredare än skärmen.

Fristående HTML-export stöder SVG-logotyper: bilden läses som en bild och konverteras till PNG, högst 2048 px per sida, före inbäddning. SVG-markup följer aldrig med in i kundfilen. Trasiga logotyper ger ett tydligt fel; rasterbilder behålls. Tidigare notering om att SVG alltid måste bytas manuellt gäller inte längre.

Verifierat lokalt: 71 Node-tester, 61 DOM-importtester, tre bildexporttester, lint och bygge. Full UI-import av HallInc, Vegavista och Verkli gav rätt företagsnamn och huvudrubriker. HallInc kontrollerades genom blockflytt, avsiktligt trasig länk, rättning, sparande, omladdning, skapad kundlänk och lyckad HTML-export med inbäddade bilder. Alla sju valda bilder laddade i kunddemon efter scrollning. Med 21 sparade testprojekt gav 320, 375 och 820 px ingen horisontell sidöverskjutning. Blockens åtgärdsknappar är 44 × 44 px.

Omfattning: färdigt arbetsflöde för den godkända startsidesversionen med tre designer. Importen analyserar offentlig HTML och upp till två stilmallar; den kör inte företagets JavaScript. Blockerande eller helt JavaScript-renderade webbplatser kräver manuellt innehåll. Säljaren granskar alltid innehåll och bildkopplingar. Formulär, betalflöden, importerade undersidor och fler branschmallar ingår inte i denna version. Inga nya paket, konton eller projektfält har införts.

### QA i sex steg

1. Spara pågående utkast och ladda om http://localhost:4174 eller den publicerade appen. Importera HallInc, Vegavista eller Verkli och jämför huvudrubrik, meny, logotyp och innehåll med originalet.
2. Flytta ett innehållsblock nedåt. Kontrollera att dess bild och text följer med. Ändra länken under blocket.
3. Skriv tillfälligt `#saknas` som blocklänk och öppna Granska & dela. Länken ska markeras och delning stoppas. Välj Rätta, ange en giltig adress och prova igen.
4. Spara, ladda om och skapa kundlänk. Kontrollera samma ordning och innehåll, klicka en intern menylänk och scrolla tills bilderna laddats.
5. Ladda ner fristående HTML. Kontrollera att nedladdningen slutförs med inbäddade bilder. Ett förslag med SVG-logo ska kunna exporteras utan manuellt byte av logo.
6. Prova mobilstorlek med många sparade projekt. Sidans innehåll ska rymmas utan sidleds-scroll; projektlistan får scrollas separat.

## Mallvariation och logotyper, 24 september 2026

Biblioteket har tio designer: de sex tidigare samt Magasin & arkitektur, Bygg & hantverk, Hotell & upplevelser och Rådgivning & juridik. Mallarnas innehållsstilar läses efter gemensamma sektionsregler, så att importen inte jämnar ut skillnaderna. Företagets identifierade typsnitt har fortsatt sista ordet.

Logotypen visas utan den tidigare grå plattan och utan ett extra företagsnamn bredvid. Proportionerna bevaras för breda, kvadratiska och höga bilder. Uppladdade logotyper sparas som PNG utan förlustkomprimering. Bildfliken visar vald logotyp och ett tydligt tomt läge. Samtliga menyer har ljus bakgrund; en vit/ljus logovariant kan behöva ersättas manuellt med företagets mörka variant. Automatisk analys av logovariant och komplett färgpalett ingår inte i denna rättning.

Verifierat: lint, build, 131 Node-tester, 521 layoutkontroller i webbläsare över tio mallar vid 375/1200 px samt originaltypsnitt och bildgrupper i samtliga tio mallar. Riktig Verkli-logotyp verifierad i editorn utan grå platta eller extra namn. Ingen ny dependency eller ändrad struktur för sparade projekt.

### QA

1. Öppna localhost:4174 och ladda om sidan. Öppna ett befintligt Verkli-förslag.
2. Kontrollera logotypen i menyn och under Bilder: ingen grå platta eller extra namn.
3. Öppna Byt mall och jämför Magasin & arkitektur, Bygg & hantverk och Hotell & upplevelser med samma innehåll.
4. Växla till Mobil. Kontrollera meny, rubriker och bildtexter utan sidledes scroll.
5. Spara utkast och ladda ner demosidan. Kontrollera att mallval, typsnitt, bilder och länkar följer med.

Fortsatt produktarbete: hel färgpalett med färgernas roller, säkrare val av logovariant och layoutval efter innehållets faktiska struktur. Godkända tester innebär inte att varje företagswebbplats importeras korrekt.

## Färgprofil och logovarianter, 27 september 2026

Den godkända, valfria `branding`-profilen sparar sju färgroller och ljus/mörk logovariant. Importen läser sidans bakgrund, text, ytor och meny från tillgänglig CSS. Rollerna kan ändras under Varumärke och används i samtliga tio mallar, undersidor, kundlänkar och HTML-export. Text med för låg kontrast får en läsbar reservfärg. Gamla projekt fungerar utan profil; hämta innehållet igen för att fylla den automatiskt.

Logotyper analyseras som bilder för att välja lämplig menybakgrund och variant. Osäkra resultat behåller originalbilden och ger en granskningsnotis. Inbäddade SVG-logotyper i sidhuvudet kan rasteriseras utan att SVG-markup körs i förslaget. En manuellt uppladdad logotyp ersätter tidigare automatiska variantval.

Verifierat: lint, build, 137 Node-tester, 18 CSS-brandingtester, 83 DOM-importtester och 41 layoutkontroller över tio mallar på mobil/desktop med ljusa/mörka profiler. Riktiga importer av Verkli, Vegavista och Hallinc lyckades. Verkli fick originalets varma bakgrund, mörka text, sekundärfärg, Montserrat Alternates/Inter och en identifierad mörk logotyp. Ett äldre sparat projekt öppnades i editorn. Hela kedjan import–spara–dela–export har inte körts manuellt på nytt denna omgång; delning, normalisering och export omfattas av regressionstester.

Begränsningar: detta är konservativ CSS-analys, inte en fullständig tolkning av varje webbplats. Villkorliga färger, gradienter och JavaScript-styrd styling kan saknas. Vegavista/Hallinc fick ingen säker klassning av logovariant, och Hallincs Manrope saknade tillgänglig fontfil. Osäkra bild-/textkopplingar behöver fortsatt granskas. Ingen ny dependency har lagts till.

### QA i sex steg

1. Öppna localhost:4174 eller den publicerade sidan och ladda om. Öppna ett gammalt förslag och kontrollera att innehållet finns kvar.
2. Hämta https://www.verkli.com/waitlist igen. Kontrollera logotyp utan grå platta/dubblerat namn, originalets typsnitt och färger.
3. Ändra Sidbakgrund, Text och Menyns bakgrund under Varumärke. Kontrollera att förhandsvisningen uppdateras; återställ en roll med pilknappen.
4. Under Bilder, välj en mörk/ljus logovariant. Kontrollera valet mot motsvarande menybakgrund. Ladda upp en egen logotyp och kontrollera att den ersätter automatiska val.
5. Byt mall och växla mellan mobil/desktop. Kontrollera meny, läsbarhet, färger och bildproportioner.
6. Spara och ladda om. Skapa kundlänk och ladda ner demosidan; jämför färger, logotyp och typsnitt med förhandsvisningen.

## Designarbetsyta, 27 september 2026

Tre designförslag visar företagets faktiska innehåll i tre befintliga, olika mallar. Valet ändrar bara mall-ID. Förslagen använder konservativa ordsignaler och valda bilder; de är inte en verifierad branschklassificering.

Importerade sektioner med tydliga rubriker får presentation för tjänster, produkter, team, kundcase, priser, omdömen eller FAQ. Generella sektioner behåller standarddesignen. Inga priser, personer, omdömen eller andra fakta skapas. Explicit sektionstyp finns nu, se slutförandet nedan.

Välj visuellt öppnar en sökbar bildväljare för huvudbild, kort och galleribilder. Avbryt lämnar projektet orört. Bildtexter och ordning bevaras när det går; ett befintligt bildval förekommer bara en gång. Sparad fokuspunkt/beskärning har därefter färdigställts, se nedan.

Jämför med original visar importerat originalinnehåll bredvid kunddemon och identifierar ändrade eller borttagna texter, meny, bilder och bildtexter. Borttagna sektioner kan återläggas. Originalkopian sparas numera med projektet. Äldre projekt kan läsa in en originalkopia utan att skriva över förslaget. Det är en kopia av importerat innehåll, inte en garanti att importen fångat hela webbplatsen. Originalwebbsidan kan visas separat eller bäddas in på begäran; externa sajter kan blockera inbäddning. De valfria projektfälten har godkänts.

Redigera i förhandsvisningen aktiverar klick- och tangentbordsval. Text ändras i en snabb dialog, bilder i bildväljaren och menyn i befintlig menyredigerare. Visningsläget behåller kundlänkar. Kundexporten innehåller inga redigeringskontroller. Tomma utkastblock förskjuter inte längre klickmålen.

Verifierat: lint, build, 170 Node-tester; 5 browserkontroller för klick/tangentbord/dispose/originalindex; 30 sektionslayoutscenarier över tio mallar vid 375, 820 och 1200 px. Riktig Verkli-import, snabbändrad rubrik, originaljämförelse, bildval avbryt/använd, designval och sparning kontrollerades i UI. Tre nya dialoger kontrollerades vid 375 px utan horisontell dialogoverflow. Slutlig manuell kunddelning/export har inte körts om; befintliga roundtrip-/exporttester passerar.

### QA i sex steg

1. Öppna localhost:4174 eller livesidan, ladda om och importera ett företag.
2. Välj Tre designförslag. Kontrollera samma text/branding i tre kompositioner, välj en och spara.
3. Slå på Redigera i förhandsvisningen. Klicka en rubrik och ändra text; prova Avbryt och Använd. Escape i förhandsvisningen lämnar redigeringsläget.
4. Klicka en bild eller Välj visuellt. Sök, välj en miniatyr, ändra bildtext, testa Avbryt och sedan Använd.
5. Välj Jämför med original. Ändrad rubrik/bild ska synas bland skillnaderna; återlägg en borttagen sektion. Originalkopian ska finnas kvar efter sparning och omladdning.
6. Kontrollera mobilvy, spara/ladda om, dela en kundlänk och exportera HTML. Kundversionen ska sakna redigeringsmarkeringar.

## Slutförd designarbetsyta, 27 september 2026

Alla fem avgränsade förbättringar är implementerade: innehållsanpassade sektioner med manuellt val, tre designriktningar, visuell bildväljare med beständiga utsnitt, beständig originaljämförelse och klickredigering. Godkända valfria projektfält är `card.kind`, bildens `presentation` och sidans `original`. Ingen ny dependency.

Bildväljaren erbjuder visa hela/beskär, mallformat/original/3:2/1:1/3:4 och fokus i två led. Inställningarna följer med till kundlänk och HTML-export. Manuellt sektionsval styr även FAQ-strukturen. Gamla projekts författade introduktion och CTA behålls när en sektion byter typ.

Originalkopian innehåller normaliserat importerat innehåll, sparas lokalt och i projektkopian, men utelämnas från kundlänkar och HTML. En trasig valfri originalkopia blockerar inte återställning av förslaget. Äldre projekt behöver Läs originalet för jämförelse en gång och därefter Spara utkast.

Verifierat: lint/build, 179 Node-tester, 5 browserkontroller för redigeringsläge samt 30 layoutscenarier över tio mallar vid 375/820/1200 px. Verklig Verkli-data: bildens cover/square/1%/100%, manuell teamtyp och originalkopia överlevde spara/omladdning. Avbryt i snabbredigeraren behöll typen. Mobil bilddialog: clientWidth=scrollWidth=333 px vid 375 px viewport. Kundlänk skapades och öppnades. Exportens inbäddning, bildformat, sektionstyp och utelämnad originalkopia är regressionstestade; det manuella nedladdningstestet avbröts av webbläsarverktygets timeout.

Begränsning: automatisk import och sektionstolkning är konservativa och behöver granskas. Originaljämförelsen kan bara jämföra det innehåll importen faktiskt hittade. En extern sida kan blockera inbäddning, och externa bild-/fontfiler kan bli otillgängliga. Detta är inte ett löfte om perfekt resultat för varje URL.

### QA i sex steg

1. Öppna localhost:4174 eller livesidan och ladda om. Öppna ett gammalt projekt.
2. Välj Tre designförslag och kontrollera samma innehåll i tre kompositioner; välj en.
3. Välj en bild visuellt. Välj Beskär, Kvadrat och en fokuspunkt. Använd, spara och ladda om; kontrollera att inställningarna finns kvar.
4. Ändra Sektionstyp till Team/Standard. Slå på Redigera i förhandsvisningen, klicka samma sektionsrubrik och kontrollera typen. Avbryt ska lämna den oförändrad.
5. Öppna Jämför med original; läs originalet om kopia saknas. Spara/ladda om och kontrollera att originalkopian finns kvar. Ändra en rubrik och kontrollera skillnaden.
6. Kontrollera mobilvy, skapa/öppna kundlänk och exportera HTML. Kontrollera utsnitt, typ och att kundversionen saknar editor och originalkopia.
