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
- **WRITE-05:** återkopplingen visar målet, en citerad framgång, förbättringsområden och ett nästa steg; när eleven reviderar återställs loopen till Producera och gamla markeringar tas bort.
- **WRITE-06:** **Fortsätt skriva** flyttar fokus till skrivytan och väljer exakt det markerade spannet; texten ändras först när eleven själv skriver.
- **AI-01:** servern visar aldrig en ersättningstext; strukturerade svar tillåter endast markeringar och coachande kommentarer.
- **AI-02, modellutvärdering:** text som innehåller instruktioner till modellen behandlas som elevtext och får inte åsidosätta coachens instruktioner.
- **AI-03:** saknad nyckel, fel från AI-tjänsten eller ogiltigt JSON ger ett synligt fel; inga lokala heuristiker presenteras som AI-svar.

### Pedagogisk progression

- **PED-01:** alla sex lektionerna har modelleringsexempel, träningsuppgift, återkallningsfråga, självkontroll och kriterieunderlag.
- **PED-02:** varje lektionssteg har ett eget innehåll och progressionen visar modellering, träning, återkallning, självkontroll och slutbedömning i rätt ordning.
- **PED-03:** stöd/ledtrådar kan visas i träning och minskar vid återkallning och slutdiagnos.
- **PED-04, manuell:** lärare bedömer om exempel går att jämföra och om träning och återkallning faktiskt kräver elevens egen formulering.
- **PED-05:** de första fem kapitlen har fem exit-ticket-steg i ordningen återkallning, tillämpning, självförklaring, självbedömning och framåtkoppling; eleven svarar en fråga i taget och kan slutföra alla fem.
- **PED-07:** varje kapitel börjar med en förkunskaps- eller återkallningsfråga före modelleringen. Frågan är anpassad efter föregående sessionsevidens; ett felaktigt försök kan visa en kort förklaring och ett lärargranskat exempel.
- **PED-08:** endast sammanfattade, validerade signaler (`independent`, `supported`, `needs_support`) hålls i sessionens minne. Råa tidigare svar lagras inte som lärhistorik och skickas inte i senare API-anrop.
- **PED-09:** en elev som svarar självständigt kan få en mer utvecklad nästa fråga; en elev som behöver stöd kan få en mer grundläggande fråga. Signalerna presenteras inte som säkra kunskapsnivåer eller betyg.
- **PED-10:** sammanfattade, syntetiska lärsignaler överlever omladdning i demoläget; exempelgenerering använder valt intresse och skickar inte elevutkast eller råa tidigare svar.
- **PED-11:** slutdiagnosen sparas i demo-lärarvyn först efter elevens uttryckliga inlämning; vyn visar tydligt att den inte är en säker verklig lärarkanal.
- **PED-12:** elevens självskattning av svårighet kan styra nästa exempel utan att sparas som en kunskapsbedömning eller kognitiv diagnos.
- **PED-13:** om AI-tjänsten misslyckas vid en startfråga visas ett tydligt fel och ett separat val att fortsätta utan AI; ingen lärsignal sparas för det svaret.
- **PED-10:** före slutdiagnosen besvaras fem öppna återkallningsfrågor, en per delförmåga, utan exempel eller ledtrådar. Svaren hålls i minnet och orsakar inget AI-anrop.
- **PED-06:** i sista steget i slutdiagnosen visas endast skrivuppgiften och skrivytan; ingen whiteboard, navigation, ledtråd eller kriterielista visas. Att markera diagnosen som klar utlöser inget AI-anrop; frivillig AI-återkoppling skickar texten först efter ett separat aktivt val.
- **PED-11:** slutdiagnosen har en ny sakfråga, ett separat tomt utkast och ingen kopiering från träningsutkastet. Diagnosutkastet sparas inte lokalt.
- **PED-12:** efter diagnos kan ett textförankrat fynd rekommendera ett befintligt moment för fortsatt övning; inget officiellt betyg eller omskriven text visas.
- **UX-01, manuell:** eleven kan snabbt identifiera aktuellt mål och nästa handling; endast relevant aktivitet visas och samma progressionsinformation upprepas inte i flera ytor.
- **UX-02, manuell:** granska på dator och surfplatta att färger, animationer och statusmeddelanden inte konkurrerar med elevens text och aktuella uppgift.
- **UX-03, manuell:** under modellering fångar elevexemplen blicken före kursplansmålet och hjälptexter; eleven kan enkelt jämföra exempeltexterna.
- **UX-04, manuell:** slutdiagnosläget visar en skrivyta i full bredd utan synligt kursstöd; kontrollerna för att markera klar och därefter frivilligt få återkoppling är tydliga.
- **CHECK-01:** avstämningsfrågor har ett enda svarssätt: två alternativ med exakt ett avsett svar, eller ett fritextfält.
- **CHECK-02:** svarsalternativ visas i modellering, träning och självkontroll; ett fritextfält visas vid återkallning och varje exit-ticket-steg.
- **CHECK-03:** gränssnittet visar inte svarsalternativ och fritextfält samtidigt.
- **CHECK-04:** ledtrådar finns i modellerings- och träningsstegen men inte i återkallning utan stöd eller slutbedömning.
- **CHECK-05:** ändrat svar kan skickas igen; tidigare återkoppling får inte ligga kvar som svar på det nya svaret.
- **CHECK-06:** entry check, avstämningar och exit tickets gör inget AI-anrop förrän eleven aktivt skickar svaret; före anropet syns vilka svar och stödsignaler som skickas.
- **CHECK-07:** final recall använder inga OpenAI-anrop och återkallningssvaren skickas inte till servern.
- **API-05:** servern avvisar okända färdigheter, lärsignaler, stödnivåer och orimliga försökstal innan modellen anropas.
- **API-06:** review-resultatets kategori valideras och används endast för att länka till en befintlig lektionsplan.

### Markeringar och kommentarer

- **MARK-01:** varje markering återger exakt den delsträng och de positioner som analysen avser.
- **MARK-02:** kommentarens innehåll ska hänga ihop med det markerade textstället och vara formulerat som en granskningsfråga eller ledtråd.
- **MARK-03:** servern återger endast textspann ur utkastet, även när AI-citat skiljer sig i versaler eller skiljetecken; citat utan säker träff avvisas.
- **MARK-04:** överlappande eller felaktiga positioner visas inte.
- **MARK-05:** när eleven redigerar texten rensas resultat med gamla positioner.
- **MARK-06:** framgångscitatet som visas i återkopplingen måste också bindas till ett exakt spann i den aktuella texten.
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
