# Förslag Studio – förenklad arbetsyta

| Före | Efter | Varför |
| --- | --- | --- |
| Tomt utkast, import, mallval och kunddelning visas samtidigt. | Översikten visar två startval: hemsida eller sociala medier. Tom sida är ett mindre tredje val. | Det är tydligt var användaren ska börja. |
| Import och redigering konkurrerar med varandra. | Underlag och Design är separata steg. Granska & dela öppnar den befintliga kundkontrollen. | Ett sammanhängande flöde med en uppgift åt gången. |
| Menyinställningar kommer före företagets viktigaste text. | Företagsnamn, huvudrubrik, introduktion och sektioner visas först. Meny och små rubriker kan fällas ut. | Vanliga ändringar kräver färre beslut; granskningens rättningslänkar öppnar rätt steg och fält. |
| Tre designverktyg och flera exportknappar konkurrerar. | Välj design är huvudvalet. Fler verktyg och projektalternativ har egna menyer. | Funktionerna finns kvar och får en tydlig plats. |
| Mobilen visar en lång blandning av formulär och förhandsvisning. | Redigera och Förhandsvisa är separata mobilvyer. | Användaren kan arbeta med hela formuläret och sedan se hela kundsidan. |
| Limefärger, små dekorativa etiketter och flera visuella uttryck. | Neutrala ytor, systemtypsnitt, blå länkar, lugnare avstånd och konsekventa kontroller. | Ett enklare gränssnitt med fokus på kundens hemsida. |

## Slutlig putsning av arbetsytan

- Kortare projekthuvud och verktygsrad ger mer plats åt formulär och kundsida. UI-testet kräver minst 330 px hög förhandsvisningsyta och 420 px hög redigerare i ett 1280 × 720-fönster.
- Mobilens Redigera/Förhandsvisa ligger kvar vid sidans överkant när användaren scrollar. Utökad preview visar bara kundsidan och dess egna kontroller.
- Projekt-, design-, preview- och inställningsmenyer stänger varandra. Klick utanför och genomförda menyval stänger dem. Escape stänger först menyn och återställer fokus; nästa Escape kan lämna utökad preview.
- Översikt och återöppnad redigerare börjar överst, även efter att användaren scrollat långt. Rubriken får fokus så att bytet även är tydligt med tangentbord och skärmläsare.
- Delning visar **Kontrollera före delning** följt av **Din kundlänk är klar**. Delningsdialogen har en tillgänglig rubrik och beskrivning. Skyddet för utkast använder samma knappnamn som gränssnittet.

## Verifiering

- Lint, build och 435 kodtester passerar.
- 106 UI-kontroller i 320, 375, 820 och 1280 px: översikt, hemsidestart, social start, manuell redigering, designval utan textförlust, mobilväxling, utökad preview/Escape, sparning och återöppning, sökningens empty state, avbrutet projektbyte och skapad kundlänk.
- Endast ett orört standardutkast kan hoppa över dialogen för osparade ändringar. Egen text, design, färg, bild och sparat projekt omfattas fortsatt av skyddet.
- Granskningens rättningslänkar väljer Design, återställer redigering från utökad preview och öppnar eventuella infällda avsnitt kring fältet.
- UI-testet skapar endast lokala QA-förslag på en separat testadress. Befintliga kundutkast i den publicerade appen ändras inte av testet.

## QA i UI – fem steg

1. Öppna `http://localhost:4183/`. Kontrollera att översikten visar **Utgå från en hemsida**, **Börja med sociala medier** och dina tidigare förslag. Ett återställt utkast nås via **Fortsätt med utkastet**.
2. Välj hemsidestart. Kontrollera att URL-fältet får fokus och att tom preview och redigeringsfält inte visas. Prova social start från översikten; rätt profilflöde ska öppnas.
3. Välj **Börja med en tom sida istället**. Fyll i företagsnamn och rubrik, lägg till en sektion och välj design. Texten ska finnas kvar. Prova **Meny & små rubriker**, **Fler verktyg** och projektmenyn med tre punkter.
4. På mobil: scrolla och växla mellan **Redigera** och **Förhandsvisa** med kontrollen som följer med överst. Utöka preview och återvänd med **Tillbaka till redigering**. På dator: öppna en meny i utökad preview; första Escape stänger menyn, nästa lämnar den utökade vyn. Kontrollera även klick utanför och Inställningar. Ingen horisontell scroll ska behövas.
5. Spara, scrolla ned, återgå till Översikt och öppna förslaget igen. Båda vyerna ska börja överst med fokus på rubriken. Gör en osparad ändring och starta ett nytt förslag; avbryt och kontrollera att ändringen finns kvar. Välj **Granska & dela**, rätta eventuella markerade fält och skapa en kundlänk.

Omfattningen är plattformens användargränssnitt och navigation. Kundsidornas designer, lagringsmodell, externa betalnings- och bokningssystem samt befintliga importbegränsningar ändras inte.
