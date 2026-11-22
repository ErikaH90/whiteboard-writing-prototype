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
- **PED-05:** de första fem kapitlen har en exit ticket med två steg: återkallning av kapitlets innehåll och självbedömning av den egna texten. Slutdiagnoskapitlet har ingen exit ticket.
- **PED-17:** varje moment öppnar med en uppmärksamhetsrad, därefter ett elevnära mål som börjar med ”När du är klar” tillsammans med kursplanens formulering, och först sedan förkunskapsfrågan. Målet visas igen när modelleringen börjar, inför exit ticketen och när exit ticketen är klar.
- **PED-07:** varje kapitel börjar med en förkunskaps- eller återkallningsfråga före modelleringen. Frågan är anpassad efter föregående sessionsevidens; ett felaktigt försök kan visa en kort förklaring och ett lärargranskat exempel.
- **PED-08:** endast sammanfattade, validerade signaler (`independent`, `supported`, `needs_support`) hålls i sessionens minne. Råa tidigare svar lagras inte som lärhistorik och skickas inte i senare API-anrop.
- **PED-09:** en elev som svarar självständigt kan få en mer utvecklad nästa fråga; en elev som behöver stöd kan få en mer grundläggande fråga. Signalerna presenteras inte som säkra kunskapsnivåer eller betyg.
- **PED-10:** sammanfattade, syntetiska lärsignaler överlever omladdning i demoläget; råa svar sparas inte.
- **PED-11:** slutdiagnosen sparas i demo-lärarvyn först efter elevens uttryckliga inlämning; vyn visar tydligt att den inte är en säker verklig lärarkanal.
- **PED-12:** eleven ombeds inte skatta frågans svårighet och startfrågan visar ingen separat kopplingstext; anpassningen av frågor och exempel utgår från lärsignalerna i elevens svar.
- **PED-13:** om AI-tjänsten misslyckas vid en startfråga visas ett tydligt fel och ett separat val att fortsätta utan AI; ingen lärsignal sparas för det svaret.
- **PED-10:** före slutdiagnosen besvaras fem öppna återkallningsfrågor, en per delförmåga, utan exempel eller ledtrådar. Svaren hålls i minnet och orsakar inget AI-anrop.
- **PED-06:** i sista steget i slutdiagnosen visas endast skrivuppgiften och skrivytan; ingen whiteboard, navigation, ledtråd eller kriterielista visas. Att markera diagnosen som klar utlöser inget AI-anrop; frivillig AI-återkoppling skickar texten först efter ett separat aktivt val.
- **PED-11:** slutdiagnosen har en ny sakfråga, ett separat tomt utkast och ingen kopiering från träningsutkastet. Diagnosutkastet sparas inte lokalt.
- **PED-12:** efter diagnos kan ett textförankrat fynd rekommendera ett befintligt moment för fortsatt övning; inget officiellt betyg eller omskriven text visas.
- **PED-14:** den avslutande checklistan visas först efter uttrycklig inlämning och omfattar de fyra specificerade områdena. Den är inte synlig eller tillgänglig under den stödfria diagnosen.
- **PED-26:** skrivkartan ritas först på elevens begäran, läser bara de delar Edda har gått igenom, visar belägget som grön markering i elevens text, tänder **Redo för slutdiagnos** när alla delar är minst utvecklade och kan läsas om när texten har ändrats (`tests/e2e/writing-map.spec.ts`).
- **PED-25:** slutdiagnosens checklista visas medan diagnostexten kan ändras (före inlämning), läggs undan på det låsta originalet och visas igen med samma bockar i den separata bearbetningskopian.
- **PED-15:** efter inlämning är diagnosens originaltext låst. Checklistans separata bearbetningskopia börjar med samma text; ändringar i kopian ändrar inte den text eller återkoppling som lärarvyn redan tagit emot.
- **UX-01, manuell:** eleven kan snabbt identifiera aktuellt mål och nästa handling; endast relevant aktivitet visas och samma progressionsinformation upprepas inte i flera ytor.
- **UX-02, manuell:** granska på dator och surfplatta att färger, animationer och statusmeddelanden inte konkurrerar med elevens text och aktuella uppgift.
- **UX-03, manuell:** under modellering fångar elevexemplen blicken före kursplansmålet och hjälptexter; eleven kan enkelt jämföra exempeltexterna.
- **UX-04, manuell:** slutdiagnosläget visar en skrivyta i full bredd utan synligt kursstöd; kontrollerna för att markera klar och därefter frivilligt få återkoppling är tydliga.
- **UX-05:** rubriken i varje del av whiteboarden skrivs ut gradvis och övrig text visas direkt när rubriken är klar; hela texten finns för hjälpmedel medan den skrivs. Det finns ingen knapp för att hoppa över skrivandet; **Fortsätt** visas först när delen är färdig.
- **UX-06:** tavlan stannar efter målet, mellan modelleringens två exempel och före avstämningen i övriga steg tills eleven väljer **Fortsätt**; svarsfält och svarsalternativ visas först när frågan är skriven. Stoppen gäller även med minskad rörelse, där texten visas direkt.
- **UX-07:** ett lektionssteg som eleven redan har sett visas direkt utan skrivanimation och utan stopp när eleven går tillbaka.
- **UX-09:** på en bred skärm syns hela whiteboarden utan att sidan eller tavlan behöver rullas; tavlan visar en del i taget, och det finns ingen knapp för att gå tillbaka till en tidigare del.
- **UX-08, manuell:** granska att skrivtakten går att följa för en elev i årskurs 9 och att tavlan inte hoppar när ny text skrivs.
- **EX-01:** sessionen börjar med förkunskapsfrågan ”Vad är en argumenterande text?” utan att exempeltexten visas och med en helt tom skrivyta, även när ett utkast finns sparat sedan tidigare. Efter frågan visas exempeltexten utan markeringar och whiteboarden väntar medan eleven lyssnar; modelleringen startar när uppläsningen är klar eller när eleven väljer att starta utan att lyssna. Gulmarkeringarna visas först när modelleringen börjar.
- **EX-02:** uppläsningen hämtas först efter elevens klick, endast exempeltextens id skickas, och ett fel från tjänsten visas som ett tydligt meddelande. Automatiska tester mockar ljudet och använder inte ElevenLabs-nyckeln.
- **EX-03:** varje gulmarkering motsvarar exakt en ordalydelse i exempeltexten och varje del i den utmärkta texten har en förklaring för tavlans genomgång; exempeltextens ordalydelse ändras inte av markeringarna.
- **EX-06:** under modelleringen är exakt en del gulmarkerad i exempeltexten, den som whiteboarden visar, och övrig text är suddig; markeringen följer med när eleven går vidare på tavlan och vid kontrollen lyser alla momentets delar som klickbara alternativ.
- **EX-07:** på en bred skärm syns hela exempeltexten utan rullning när eleven lyssnar och under genomgången.
- **EX-04:** exempeltexten visas bara under kapitlets öppning och modellering; från skrivuppgiften och framåt, i återkallningsrundan och i slutdiagnosen visas den inte. Eleven har ingen kontroll för att växla mellan exempeltext och egen text, och utkastet ändras inte när ytan byter innehåll.
- **PED-20:** felsökningen i kapitel 5 görs på whiteboarden: varje del av den påhittade texten går att klicka på, frågor med två fel kräver båda, fel val ger en knuff utan förklaring, och efter sista frågan visas den rättade texten. Två försök eller ett fel från AI-tjänsten räcker för att få gå vidare.
- **VOICE-02:** när en pratbubbla med Eddas text syns på tavlan läser hon inget högt; texten visas direkt och inget röstanrop görs.
- **VOICE-03:** en genomgång av varje steg i alla sex kapitel och slutrepetitionen med rösten på (`tests/e2e/edda-voice-audit.spec.ts`): medan Edda pratar syns bara rubrik och bubblan med punkter på tavlan.
- **VOICE-01:** medan Edda läser upp sin vägledning visas bara bubblan **Edda berättar**; texten, knapparna och svarsfälten visas först när uppläsningen är klar. Hela texten finns för hjälpmedel under tiden.
- **VOICE-02:** med ljudet avstängt, utan röst på servern eller om uppspelningen blockeras visas texten direkt och lektionen fortsätter som vanligt. Automatiska tester använder aldrig den riktiga rösttjänsten.
- **START-01:** lektionen öppnar med en välkomstsida där eleven väljer ett av tre ämnen att skriva om; valet blir skrivuppgiften och sparas lokalt, och skrivytan visar kapitlen och arbetsgången. Inget AI-anrop görs.
- **NAV-01:** utan `?fri` är övriga kapitel låsta, **Tillbaka** saknas och **Nästa steg** är avstängd tills tavlan visats i sin helhet och stegets kontroll är besvarad eller uppgiften markerad som klar.
- **NAV-02:** ett fel från AI-tjänsten i en kontroll öppnar **Nästa steg** så att eleven inte fastnar.
- **PED-21:** i genomgången visas varken citat eller förklaring för en del förrän eleven har hittat den i texten eller Edda har visat den efter två försök; alla kapitlets delar är klickbara medan eleven letar. I jämförelserna gäller samma sak för de ändrade ställena i det andra exemplet. Ett fel från AI-tjänsten gör att Edda visar stället.
- **PED-22:** efter Eddas råd på skrivuppgiften kan eleven ändra i texten och be Edda titta igen; förfrågan innehåller rådet, Edda ger inga nya punkter och loopen har högst en omgång.
- **PED-24:** checklistan inför inlämning i kapitel 6 (före slutrepetitionen, med elevens text synlig) låter eleven bocka av och ångra punkter, en del i taget, och räknar avklarade punkter; den visas först när skrivuppgiften är gjord.
- **PED-23:** i egenkontrollen visar Edda på elevens begäran stället i elevens text med gult; saknas stället sägs det och inget markeras; texten ändras aldrig.
- **CHECK-10:** Eddas svar slutar med en fråga endast när eleven ska försöka igen; servern kräver frågetecken för sådana svar men inte för svar på rätt spår.
- **PED-19:** i kapitel 1–5 föregås skrivuppgiften av två exempel på den del som ska skrivas; eleven väljer det bästa genom att klicka, etiketterna avslöjar inte svaret i förväg, och i guidat läge visas uppgiften först när valet är gjort (rätt, två försök eller fel från AI-tjänsten).
- **NAV-03:** skrivuppgiften kan lämnas till Edda först när elevens text inte är tom. Inget AI-anrop görs medan eleven skriver, bara när eleven väljer **Jag är klar – låt Edda läsa**. Ett fel från AI-tjänsten låser inte eleven.
- **FB-01:** efter skrivuppgiften visar Edda en styrka och högst en sak att pröva; styrkan är grönmarkerad och utvecklingspunkten lilamarkerad i elevens text, och texten ändras inte. Även vid återkoppling på begäran markeras styrkan i texten.
- **FB-02, manuell:** granska att Eddas styrka är sann och konkret, att utvecklingspunkten är formulerad som något att pröva och inte som ett fel, och att ingen färdig formulering ges.
- **EX-05, manuell:** en lärare granskar att markeringarna och deras förklaringar stämmer med momentets innehåll och att uppläsningens röst och uttal fungerar på svenska.
- **CHECK-01:** avstämningsfrågor har ett enda svarssätt: två alternativ med exakt ett avsett svar, eller ett fritextfält.
- **CHECK-02:** svarsalternativ visas i modellering, träning och självkontroll; ett fritextfält visas vid återkallning och varje exit-ticket-steg.
- **CHECK-03:** gränssnittet visar inte svarsalternativ och fritextfält samtidigt.
- **CHECK-04:** ledtrådar finns i träningssteget men inte i återkallning utan stöd eller slutbedömning; i modelleringen kan eleven välja om efter Eddas återkoppling.
- **CHECK-09:** ett svar på rätt spår visar Eddas stjärna i en storlek som följer svarets nivå (1–3); ett svar som behöver ett nytt försök visar ingen stjärna. Ett rätt klick kan inte ge den största stjärnan.
- **PED-18:** efter exit ticketen visas vad eleven har visat att den kan (endast kontroller eleven klarat) och, i första momentet, elevens första svar bredvid det senaste. Svaren hålls bara i sessionens minne.
- **AI-05, manuell:** granska att Eddas beröm är konkret, sant och knutet till elevens arbete.
- **CHECK-08:** efter ett svar som är på rätt spår visas ingen **Försök igen**- eller **Svara**-knapp för den frågan.
- **CHECK-05:** ändrat svar kan skickas igen; tidigare återkoppling får inte ligga kvar som svar på det nya svaret.
- **CHECK-06:** entry check, avstämningar, exempelval och exit tickets gör inget AI-anrop förrän eleven aktivt svarar. Gränssnittet visar ingen särskild OpenAI-upplysning.
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
