# Förslag Studio – profilflöde och visuellt designbibliotek

Ett långt formulär med färger, text, bilder och exportknapp konkurrerade om uppmärksamheten. Designbiblioteket visade i huvudsak namn och bokstavsprover. Ändringen följer arbetsytans befintliga lugna formspråk och behåller import, sparning och kundkontroll.

## Det nya flödet

- Socialstart: **Profil → Företaget → Bilder & stil**. Ett steg visas åt gången. Saknade eller ogiltiga uppgifter får ett tydligt fel och fokus på rätt fält. Backning ändrar inte uppgifterna.
- Profilhämtningen kan följas av manuell komplettering. Begränsningar visas även när användaren går vidare. Ett tomt underlag visar en riktig empty state i stället för ett fiktivt företagsförslag.
- En stängd dialog kan återuppta sitt senaste underlag medan appen är öppen. Snabb återöppning avbryter tidigare anrop och ignorerar gamla stängningshändelser. Detta är återställning inom sessionen, inte molnsynk eller lagring efter omladdning.
- Bild- och logotypuppladdning har riktiga knappar för tangentbord. Färger, längre text och kontaktuppgifter kan fällas ut. Smala bildkort och förhandsvisning ska rymmas inne i mobilens dialog.
- Designbiblioteket börjar med nuvarande design och upp till tre rekommendationer. Engelska coffee/espresso-profiler känns igen; en känd designbransch hjälper urvalet när texten inte ger tydliga signaler. Hela biblioteket och sökningen finns kvar.
- Miniatyrerna är beskurna, stilla versioner av den riktiga renderingen med kundens innehåll. De saknar script och interaktiva kontroller. Synliga kort laddas först. Val av en annan design byter bara provsidan; utkastet ändras först efter **Använd designen**.
- Dialoger och steg har korta övergångar. Minskad rörelse stänger av övergångarna och laddningsindikatorns rotation.

## Verifiering

- 443 kodtester samt lint och build passerar.
- 158 UI-kontroller: 320, 375, 820 och 1280 px. Den sista testvyn har faktiskt 720 px höjd. Kontrollerna omfattar startval, validering, designbyte utan textförlust, miniatyrer, bildfiluppladdning, dialogernas inre bredd, utkastskydd, återöppning, sparning och kundlänk.
- 12 sociala regressioner omfattar sena profil- och pilotsvar, blockerad hämtning, bild- och logotyppreparering, bildgräns, egen rubrik, palett, återställning, snabb stängning/öppning och ogiltig mejladress.
- Separat lokal testadress används för QA-data. Publicerade kundprojekt ändras inte av regressionstesterna.
- Native visuell kontroll på dator och mobil. Minskad rörelse har emulerats i webbläsaren och dialogens animation kontrollerats som `none`, därefter återställts.

## QA i UI – sex steg

1. Öppna `http://localhost:4183/` och välj **Börja med sociala medier**. Bara profilsteget ska visas. Prova att fortsätta med tom eller felaktig länk; rätt fält ska få fokus.
2. Lägg till en riktig Instagram-, Facebook- eller TikTok-profil. Prova **Läs profil** eller **Fyll i själv**. Fyll namn och beskrivning. Profilbegränsningar ska visas, och färger och bilder ska inte konkurrera med dessa fält.
3. Gå vidare till **Bilder & stil**, lägg till en bild och logotyp. Prova olika bildroller och en palett. Gå tillbaka och kontrollera att texten finns kvar. På mobil ska inga kontroller klippas åt sidan.
4. Stäng dialogen och öppna socialstart igen. Välj **Fortsätt med senaste underlaget**. Uppgifter, bildroller och bilder ska återställas. Skapa förslaget och spara.
5. Öppna **Välj design**. Kontrollera riktiga miniatyrer och relevant kort urval. Visa alla designer, sök och prova Desktop/Mobil. Avbryt ett designval; öppet utkast ska vara oförändrat. Använd sedan ett val; text och bilder ska finnas kvar.
6. Välj **Granska & dela**. Rätta eventuella markerade fält och skapa kundlänken. Med minskad rörelse aktiverad ska steg och dialoger öppnas utan rörelse.

Omfattningen är plattformens start- och designflöden. Ingen dependency, databasstruktur, betalningskoppling, mejlavsändare eller åtkomstpolicy ändras. Importerat företagsunderlag behöver fortsatt granskas före kundvisning.
