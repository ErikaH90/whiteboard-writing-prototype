# Testplan

## Syfte och avgränsning

Testerna ska skydda elevens självständiga skrivande, lektionsprogressionen, serverns API-kontrakt och kvaliteten i textmarkeringar. De är inte ett bevis för att produkten kan sätta betyg eller att AI-återkoppling är korrekt i alla situationer.

## Skillnad mellan testtyper

- **Automatiserade tester:** körbara tester under `src/` och `tests/e2e/`.
- **Testplan:** denna fil beskriver scenarier och acceptanskriterier.
- **AI-utvärdering:** automatiska kontraktstester använder en mockad modell. Separat kvalitetsgranskning använder lärargranskade, syntetiska exempel. CI anropar aldrig den verkliga AI-tjänsten.
- **Manuell granskning:** ämneslärare granskar pedagogiska exempel, bedömningskopplingar och svåra textfall.

## Automatiserade testlager

| Lager | Verktyg | Ansvar |
|---|---|---|
| Enhet/server | Vitest | Lektionsdata, API-validering, citatspann och felkontrakt. |
| Komponent | Vitest + React Testing Library | Skrivflöde, markeringar, sparstatus och stödprogression. |
| End-to-end | Playwright | Elevflöde med mockade API-svar; externa AI-anrop görs inte. |
| Modellutvärdering | Separat lärargranskad fixture-uppsättning | Relevans, osäkerhet, falska markeringar och att inget omskrivningsförslag ges. |

## Prioriterade acceptansfall

### Elevens text ändras inte av granskning

- **WRITE-01:** skriv en text och be om tips. Förväntat: skrivytan förblir redigerbar och textinnehållet är exakt oförändrat.
- **WRITE-02:** förbättringsområden markeras i texten; val av markering öppnar en kommentar utan att ändra elevens text eller visa en lista med kort.
- **WRITE-03:** AI-anropet innehåller aktuellt lektionsmoment och steg så återkopplingen kan fokusera på det eleven just tränar.
- **WRITE-04:** ändring av text eller lektionssteg medan en begäran pågår hindrar svaret från att visas på fel textversion eller fokus.
- **AI-01:** servern visar aldrig en ersättningstext; strukturerade svar tillåter endast markeringar och coachande kommentarer.
- **AI-02, modellutvärdering:** text som innehåller instruktioner till modellen behandlas som elevtext och får inte åsidosätta coachens instruktioner.
- **AI-03:** saknad nyckel, fel från AI-tjänsten eller ogiltigt JSON ger ett synligt fel; inga lokala heuristiker presenteras som AI-svar.

### Pedagogisk progression

- **PED-01:** alla sex lektionerna har modelleringsexempel, träningsuppgift, återkallningsfråga, självkontroll och kriterieunderlag.
- **PED-02:** varje lektionssteg har ett eget innehåll och progressionen visar modellering, träning, återkallning, självkontroll och slutbedömning i rätt ordning.
- **PED-03:** stöd/ledtrådar kan visas i träning och minskar vid återkallning och slutdiagnos.
- **PED-04, manuell:** lärare bedömer om exempel går att jämföra och om träning och återkallning faktiskt kräver elevens egen formulering.
- **CHECK-01:** avstämningsfrågor har ett enda svarssätt: två alternativ med exakt ett avsett svar, eller ett fritextfält.
- **CHECK-02:** svarsalternativ visas i modellering, träning, självkontroll och slutbedömning; ett fritextfält visas vid återkallning.
- **CHECK-03:** gränssnittet visar inte svarsalternativ och fritextfält samtidigt.
- **CHECK-04:** ledtrådar finns i modellerings- och träningsstegen men inte i återkallning utan stöd eller slutbedömning.
- **CHECK-05:** ändrat svar kan skickas igen; tidigare återkoppling får inte ligga kvar som svar på det nya svaret.

### Markeringar och kommentarer

- **MARK-01:** varje markering återger exakt den delsträng och de positioner som analysen avser.
- **MARK-02:** kommentarens innehåll ska hänga ihop med det markerade textstället och vara formulerat som en granskningsfråga eller ledtråd.
- **MARK-03:** servern återger endast textspann ur utkastet, även när AI-citat skiljer sig i versaler eller skiljetecken; citat utan säker träff avvisas.
- **MARK-04:** överlappande eller felaktiga positioner visas inte.
- **MARK-05:** när eleven redigerar texten rensas resultat med gamla positioner.
- **AI-04, manuell:** granska falska positiva, missade signaler och osäkra svar på en lärarannoterad syntetisk uppsättning. Osäkra eller icke-evidensbaserade fel ska inte visas som säkra röda markeringar.

## Kvalitetsgränser för framtida AI

Numeriska gränser för relevans och falska markeringar måste beslutas före pilot, tillsammans med lärare och produktägare. De är produktens kvalitetsmål, inte Skolverkets betygskriterier. Varje utvärderingsrapport ska ange testmängd, annoteringsregler, kända begränsningar och modellversion.

## Testdata och integritet

- Fixtures ska vara syntetiska och fria från personuppgifter.
- Förväntade spann och kommentarer ska granskas av en människa.
- Ändringar i regler/modellversion ska följas av regressionstest på samma godkända fall.
- Testresultat ska inte logga elevtext från produktion.
- Alla automatiserade tester mockar AI-svaren; de använder inte nyckeln och skickar ingen testtext till OpenAI.

## Körning

- `npm test` kör Vitest-tester.
- `npm run test:e2e` kör Playwright-flödet.
- `npm run build` kör TypeScript-kontroll och produktionsbygge.
