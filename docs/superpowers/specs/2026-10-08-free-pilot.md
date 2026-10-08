# Gratispilot: reservationer, mejlkö och Mac-import

Ägarens godkännande 2026-10-08 omfattar de tre nya tabellerna i `drizzle/0001_customer_flows.sql`. Befintliga tabeller och den första migrationen är oförändrade. Inga nya dependencies eller betalabonnemang har lagts till. Lokal implementation och gränssnitt är verifierade; publicering och Mac-anslutning redovisas separat i releaseunderlaget.

## Funktion och gränser

- **Reservationer:** Kopplingar & status → Bokning, betalning & mejl. Ett sparat arbetsyteprojekt kan aktivera framtida tillfällen, tidszon, besökslängd och kapacitet. Kundens bokning reserverar platsen och ger en referens. Arbetsytans inkorg visar samma reservation. Avbokning frigör kapaciteten och stoppar ännu inte påbörjade utskick. Ett redan pågående utskick kan hinna fram; inget avbokningsmejl skickas automatiskt.
- **Kapacitet:** Reservation och mejlkö skrivs atomärt. Sista platsen kan inte bokas två gånger. Upprepade försök med samma bokningsnyckel skapar ingen ny bokning. Upplägg som skulle ändra en bekräftad bokning stoppas, även när en bokning anländer under aktiveringen.
- **Mejl:** Bokningsbekräftelse och valfri företagsavisering hamnar i en privat kö. Utskicken kräver `RESEND_PLAN=free`, en giltig `RESEND_API_KEY` och en verifierad `RESEND_FROM` i Sites servermiljö. Nyckeln hör aldrig hemma i projekt, länkar, HTML-export eller webbläsare. Avsändare saknas vid den lokala verifieringen: inget riktigt mejl är skickat eller leveransverifierat.
- **Mejlstatus:** "Accepterat av mejltjänsten" betyder att Resend tog emot utskicket, inte att mottagaren fick det. Tillfälliga fel försöks igen med samma innehåll och idempotensnyckel. Osäkra svar lämnas för kontroll. Osäkra försök äldre än 23 timmar skickas inte om automatiskt, eftersom [Resends idempotensnycklar gäller i 24 timmar](https://resend.com/docs/dashboard/emails/idempotency-keys).
- **Onlineimport:** Inloggade användares kortlivade importjobb hämtas av Macens befintliga Chromium via utgående HTTPS. Varje användare kan bara läsa sitt eget resultat. Inga portar öppnas på Macen. Agenten behöver en vaken Mac med internet; arbetsytans status visar när den är offline. Sociala plattformars inloggning eller blockering kringgås inte; bio och bilder kan fortfarande behöva läggas in manuellt. Import och branding behöver granskas före kundvisning.
- **Betalningar:** Företagets externa betalningslänk kan kopplas och följer med till kunddemo och HTML-export. Verktyget skapar inget Stripe-konto, drar ingen betalning, verifierar inget köp och gör ingen reservation via ett köp. Transaktionsavgifter tillkommer enligt [företagets betalningsleverantör](https://stripe.com/se/pricing).

Resend Free har 100 mejl per UTC-dag och 3 000 per månad. Varje mottagare räknas separat. Appen begränsar även sina egna utskicksförsök till dessa nivåer. Andra appar och inkommande mejl på samma konto kan använda kvoten; leverantörens gräns gäller alltid. Inget betalt planbyte görs automatiskt. [Resends kontokvoter](https://resend.com/docs/knowledge-base/account-quotas-and-limits).

## Mac-agent

Den privata konfigurationen ligger i den ignorerade `.sites-runtime/browser-agent.json`, med filrättigheter 600. Servernyckeln lagras som hemlig `BROWSER_AGENT_TOKEN` i Sites. `npm run browser:agent:install` installerar den egna `com.forslagstudio.browser-agent` för start vid Mac-inloggning. `npm run browser:agent` kör den i en terminal. Kvotstyrda mejlomförsök körs också när agenten hämtar jobb; med sovande eller avstängd Mac väntar kön tills agenten återkommer. Själva onlinebokningen kräver inte Macen.

## QA, sex steg

1. Kör `npm run build` och `npm start`. Öppna http://localhost:4183/ (eller http://127.0.0.1:4183/). Logga in i den lokala testarbetsytan, öppna eller spara ett förslag och välj Kopplingar & status → Bokning, betalning & mejl.
2. Lägg till framtida tillfällen, 60 minuters besök och kapacitet 1. Förhandsvisa först: denna sida ska tydligt säga att ingen plats reserveras. Aktivera därefter egen bokning för det sparade projektet.
3. Öppna den aktiverade bokningslänken, välj tid och boka med testuppgifter. Kunden ska få en verklig bokningsreferens. Kontrollera samma referens och rätt tidszon i arbetsytans inkorg. När avsändare saknas ska båda vyerna säga att inget mejl skickats.
4. Ladda om kundsidan: den fullbokade tiden ska inte kunna väljas. Avboka i inkorgen och ladda om kundsidan igen: platsen ska åter vara tillgänglig. Kontrollera även mobilbredd 375 px utan horisontell scroll.
5. Online: kontrollera "Mac ansluten" och läs en offentlig JavaScript-sida med webbläsarimporten. Stoppa eller låt Macen sova: status ska bli offline efter 60 sekunder och importen ska ge ett begripligt fel medan utkastet finns kvar. En annan användare får inte läsa importresultatet.
6. Före kundmejl: verifiera avsändardomänen i Resend och lägg de tre servervariablerna ovan i Sites; publicera en version med den nya miljörevisionen. Boka med en godkänd testmottagare och kontrollera både inkorgens providerstatus och faktisk mottagen leverans. Saknad nyckel/avsändare ska aldrig visas som lyckat utskick. Kontrollera en kopplad betalningslänk utan att genomföra köp.

## Verifiering och kvarvarande acceptans

- Lint, build och enhetstester körs för den slutliga källversionen; exakta resultat redovisas i releaseunderlaget.
- Chromium-integration provar riktiga JavaScript-importer, inklusive serverkö → Mac-agent → Chromium → privat resultat.
- Lokalt UI: verklig reservation, bokningsreferens, sista plats, inkorg, avbokning och frigjord kapacitet verifierade. Bokningssidan har innehållsbredd 375 px vid viewport 375 px.
- Mejlkö, beständigt kvotskydd, samtidiga försök, återförsök, lease-gränser och 23-timmarsgräns är automatiskt testade med simulerade providersvar.
- **Återstår för riktiga kundmejl:** verifierat Resend-konto/avsändare, hemlig API-nyckel i Sites och ett faktiskt leveranstest. Detta är inte gjort genom kodtesterna.
- **Ingår inte:** garanterad hämtning från varje social plattform, automatisk felfri branding, egna betalningar eller betalkopplade reservationer. Inga riktiga köp eller kundutskick har utförts i QA.
