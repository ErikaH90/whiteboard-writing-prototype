# Pedagogisk modell

## Lektionens upplägg enligt Nine Events of Instruction

Varje moment på whiteboarden följer Gagnés nio steg, i den här ordningen:

1. **Fånga uppmärksamheten:** momentet öppnar med en kort rad eller fråga som väcker intresse (`hook` i `src/data/lessons.ts`).
2. **Presentera lärandemålen:** därefter visas ett elevnära mål som börjar med ”När du är klar kan du …” (`learnerGoal`), med kursplanens formulering som liten referens. Målet upprepas när modelleringen börjar.
3. **Aktivera tidigare kunskaper:** en förkunskaps- eller återkallningsfråga utan ledtråd.
4. **Presentera innehållet:** eleven lyssnar på och läser exempeltexten.
5. **Ge vägledning:** whiteboarden går igenom exempeltexten en del i taget med lärarens förklaringar; ledtrådar och stöd finns i träningen.
6. **Låt eleven öva:** eleven pekar ut rätt del i exempeltexten och gör sedan kapitlets skrivuppgift i sin egen text.
7. **Ge återkoppling:** Edda svarar efter varje svar och säger konkret vad eleven har visat att den kan, och eleven kan be om återkoppling på sitt utkast.
8. **Utvärdera lärandet:** återkallning utan stöd, självkontroll och exit ticket. Målet visas igen inför exit ticketen och när den är klar, så att eleven stämmer av sina svar mot det.
9. **Stärk minnet och överföringen:** nästa moment börjar med att återkalla det föregående, återkallningsrundan före slutdiagnosen täcker alla moment och slutdiagnosen har ett nytt ämne.

De elevnära målen och öppningsraderna är författade för prototypen och ska granskas av en lärare. De är inte kursplans- eller betygskriterier.

## Eleven gör tankearbetet

Edda ska inte göra jobbet åt eleven. Fyra regler gäller i hela lektionen:

- **Leta först.** I genomgången ställer whiteboarden en fråga om varje del av exempeltexten innan delen visas, och eleven letar själv upp stället genom att klicka i texten. Först när eleven har hittat det förklarar Edda. Efter två försök, eller om AI-tjänsten inte svarar, visar Edda stället, så att ingen fastnar.
- **Hitta skillnaden.** I jämförelserna lyser en del i det första exemplet, och eleven letar upp vad den har blivit i det andra innan Edda förklarar ändringen.
- **Pröva och se.** Efter skrivuppgiften ger Edda en sak att pröva. Eleven ändrar i sin text och ber Edda titta igen, och Edda säger då vad som blev bättre. En omgång räcker; eleven kan också gå vidare utan att pröva.
- **Visa i din egen text.** I egenkontrollen bockar eleven inte av påståenden utan markerar det ställe i sin egen text som visar dem. Inget skickas till AI.

## Hänsyn till kognitiv belastning

- **En sak i taget, som eleven själv arbetar med.** Varje del av genomgången är en egen fråga som eleven besvarar i texten, så det finns inga långa sträckor där eleven bara läser.
- **Inga lösa trådar.** Edda avslutar med en fråga bara när eleven kan svara på den, alltså när svaret behöver ett nytt försök. Efter ett svar på rätt spår avslutar hon med ett påstående.
- **Kort avslutning.** Exit ticketen har två frågor: en om det eleven har lärt sig och en om den egna texten.
- **Ingen onödig väntan.** Bara rubrikerna på tavlan skrivs för hand; resten visas direkt.

## Kontrollfrågorna följer kapitlets innehåll

Allt eleven får frågor om efter skrivuppgiften (återkallning, självkontroll och exit ticket) ska gälla antingen det Edda har gått igenom i kapitlets exempeltext eller det eleven just har skrivit. Frågor om delar av texten som eleven ännu inte har skrivit, eller om begrepp som inte har tagits upp, hör inte hemma i kapitlet. Exit ticketens sista fråga får peka framåt mot nästa kapitels skrivuppgift.

| Kapitel | Edda går igenom | Eleven skriver | Självkontrollen gäller |
|---|---|---|---|
| 1 Struktur | rubrik, tes, argument, motargument, avslutning | inledning med tes | rubrik, inledning, tes |
| 2 Resonemang | jämförelse mellan en enkel och en utvecklad inledning; begreppen argument, sakargument, följd, pathos och logos, motargument, bemötande, triad | de första argumenten | förklarade argument som stödjer tesen |
| 3 Textbindning | före och efter: tre lösa meningar binds ihop med sambandsord; sedan de fem slagen av sambandsord i exempeltexten (tillägg, orsak, konsekvens, kontrast, struktur) med fler ord av varje slag | motargument och sambandsord | motargumentet och sambandsorden |
| 4 Meningsbyggnad | tre före/efter-exempel på språklig variation (ordval, meningsstarter, korta och långa meningar); sedan meningsstarter och meningslängd i exempeltexten | avslutning, meningsbyggnad i hela texten | avslutningen och meningarnas variation |
| 5 Språk | skiljetecken och ordval i exempeltexten; sedan en felsökning på whiteboarden i en påhittad elevtext (stor bokstav, talspråk, särskrivning, stavfel, ofullständig mening) med rättad version | genomläsning mot skrivreglerna | stavning, skiljetecken, ordval |

## Återkommande lektionssteg

1. **Modellering:** jämför exempel och synliggör kvalitetsval.
2. **Träna själv:** kapitlets skrivuppgift i elevens egen text, med ledtråd vid behov. Uppgifterna bygger steg för steg upp en hel text: inledning med tes (kapitel 1), argument (2), motargument och sambandsord (3), avslutning och meningsbyggnad (4), skrivregler i hela texten (5).
3. **Återkallning:** visa kunskap utan att modellen eller ledtråden visas.
4. **Självkontroll:** granska och bearbeta den egna texten.
5. **Slutbedömning:** få återkoppling mot tydliga, relevanta kriterier.

Stödet ska minska över tid. Återkallning och slutdiagnos ska inte visa färdiga svar som eleven kan kopiera.

Under momenten Struktur till Språk arbetar eleven parallellt med en exempeltext som visas på skrivytan. Eleven hämtar först fram sina förkunskaper med en enkel fråga, lyssnar sedan på hela texten och följer därefter lektionen på whiteboarden, där läraren modellerar genom att gå igenom exempeltexten en del i taget: delen lyser gult i texten medan tavlan förklarar vad den gör. Därefter kontrolleras förståelsen i samma text: tavlan frågar och eleven klickar på rätt del. Tavlan och texten ska hela tiden handla om samma material, för att inte belasta arbetsminnet med parallella exempel. Exempeltexterna är författade exempel från läraren, inte bedömda nationella prov, och får inte beskrivas med ett betyg. De handlar om ett annat ämne än elevens skrivuppgift och slutdiagnosen, och visas inte i återkallningssteg eller slutdiagnos. Texterna och markeringarna finns i `src/data/exemplarTexts.json` och `src/data/exemplars.ts`; markeringarnas förklaringar behöver granskas av en lärare.

Inom varje steg presenterar whiteboarden innehållet i mindre delar som skrivs fram en i taget, i elevens egen takt: eleven läser målet, studerar ett exempel i taget och får sedan frågan. Syftet är att minska mängden information som ska bearbetas samtidigt; uppdelningen ändrar inte stegens innehåll eller ordning.

Varje kapitel börjar med en kort förkunskaps- eller återkallningsfråga innan modelleringen visas. Första frågan sonderar förkunskaper; senare frågor återkommer till tidigare delförmågor. Frågan anpassas med begränsade signaler från den lokala demoprofilen: vid tidigare svårighet blir frågan mer grundläggande, och efter självständiga svar kan den kräva en mer utvecklad koppling.

Avstämningsfrågorna under lektionsstegen ger eleven ytterligare tillfällen att visa förståelse. Vid behov kan stödet öka stegvis från en ledtråd till ett lärargranskat exempel. Eleven kan försöka igen eller gå vidare till modelleringen. I återkallningssteg och slutdiagnos visas inga ledtrådar. Visa aldrig svarsalternativ och fritextfält samtidigt.

Lärsignalerna är begränsade till `independent`, `supported` eller `needs_support`. Demoprofilen sammanställer antal observationer och senaste signal per delförmåga; råa elevsvar sparas inte i profilen. Eleven ombeds inte själv skatta svårighet; nivån på frågor och exempel anpassas utifrån lärsignalerna. Lärsignalerna är preliminära underlag, inte en säker mätning av elevens kunskap eller ett betyg. I demoläget sparas profilen lokalt i webbläsaren, utan elevkonto eller åtkomstskydd, och får endast användas med syntetiska texter. Vid OpenAI-anrop skickas endast aktuellt svar och sammanfattade signaler efter elevens uttryckliga val.

Whiteboardens exempel hämtas alltid ur exempeltexten. Ämnesanpassade exempel och ämnesväljaren är borttagna ur gränssnittet; serverns `/api/example` finns kvar men anropas inte.
När ett personligt exempel skapats utgår den aktiva avstämningsfrågan från just det exemplet. Eleven svarar då med egna ord i stället för att välja mellan generiska alternativ, och det fiktiva exempelparet skickas som bedömningskontext först när eleven skickar sitt svar.

Återkallning återkommer mellan kapitel och i en avslutande runda inför slutdiagnosen. Demoprofilen kan bevara sammanfattade signaler mellan besök i samma webbläsare, men repetition är inte tidsstyrd över dagar och profilen är inte kopplad till ett elevkonto. Återkopplingen ska visa vad eleven verkar förstå och ge ett nästa tänkesteg, inte framställa en enkel kontroll som ett säkert kunskapstest.

Elevens utkast är en pågående text från första momentet. Whiteboardens modellering och frågor ska hjälpa eleven att fortsätta skriva och bearbeta samma utkast. Eleven kan själv be tutorn om råd; råden knyts till aktuellt moment och steg. Eleven avgör vad hen ändrar, och AI:n gör inga rättelser direkt i texten.

## Exit ticket och kunskapsbefästning

De fem första kapitlen avslutas med fem uppgifter i följande ordning:

1. **Återkallning (Retrieval practice):** eleven hämtar kunskap ur minnet utan svarsalternativ.
2. **Tillämpning (Interleaving):** eleven kopplar kapitlets kunskap till den egna texten och relevanta tidigare kunskaper.
3. **Självförklaring (Self-explanation):** eleven förklarar varför strategin hjälper argumentationen eller läsaren.
4. **Metakognition och självbedömning:** eleven bedömer sin egen utveckling och vad som varit svårt.
5. **Framåtkoppling:** eleven förbereder hur kunskapen kan användas i nästa kapitel. I slutdiagnosen riktas överföringen mot framtida skrivuppgifter.

Eleven besvarar en uppgift i taget och får kort, vägledande återkoppling efter ett aktivt svar. Vid ett svar som behöver utvecklas kan eleven försöka igen; efter två försök kan hen välja att gå vidare. Exit ticket är inte ett betyg. Frågor och svar ska vara specifika för kapitlet, men lärandegången återkommer för att befästa strategierna.

Före slutdiagnosen besvarar eleven fem lärarformulerade återkallningsfrågor, en per delförmåga: struktur, resonemang, textbindning, meningsbyggnad och språklig korrekthet. Frågorna visas utan exempel eller ledtrådar. Svaren hålls endast i minnet under sessionen och skickas inte till AI; de följer inte med in i diagnosvyn.

Slutdiagnosen använder en ny skrivkontext (ungdomars fria resor med kollektivtrafik i stället för skolstart) men samma texttyp. Det tränade utkastet återanvänds inte: diagnosens skrivyta börjar tom och diagnossvaret sparas inte lokalt. I slutdiagnosens skrivläge döljs whiteboard, lektionsnavigering, mål, kriterier och skrivstöd. Att markera diagnosen som klar är en lokal handling och skickar inte texten till en tjänst. Därefter kan eleven frivilligt begära AI-återkoppling; först då skickas diagnosutkastet till OpenAI. En textförankrad förbättringspunkt kan rekommendera ett relevant undervisningsmoment för fortsatt övning. Återkopplingen är vägledande, inte ett betyg. Om eleven ändrar texten efter att den markerats som klar behöver diagnosen markeras som klar igen innan ny återkoppling begärs.

Efter markering som klar kan eleven uttryckligen lämna in sluttexten och eventuell AI-återkoppling till lärarvyn. Den nuvarande lärarvyn är en lokal demofunktion i samma webbläsare, inte en verklig leverans; använd endast syntetiska texter. En faktisk lärarinlämning kräver elev-/lärarautentisering, säker koppling till rätt klass och ett godkänt beslut om lagring och gallring.

Efter den uttryckliga inlämningen visas elevens slutliga självkontroll i fyra delar: struktur och innehåll, resonemang och argumentation, språk/stil/textbindning samt språkriktighet och korrektur. Checklistan visas inte under den stödfria diagnosen och ingår inte i underlaget som redan lämnats till läraren. Originaldiagnosen förblir låst; om eleven vill bearbeta texten öppnas en separat kopia som inte ändrar lärarens inlämning.

## Formativ skrivloop

Skrivytan stödjer en återkommande loop:

1. **Producera:** eleven formulerar och äger sitt utkast.
2. **Få återkoppling:** efter en aktiv begäran synliggörs det aktuella målet, en konkret framgång med belägg i texten, möjliga förbättringsområden och ett hanterbart nästa steg.
3. **Revidera:** eleven använder återkopplingen för att själv bearbeta texten. När texten ändras blir tidigare markeringar inaktuella och loopen börjar om.

Framgången ska vara specifik och belagd i ett citerat textspann. Förbättringsområden visas som röda markeringar i texten med korta frågor i en popup. Nästa steg ska hjälpa eleven att agera utan att ge färdiga formuleringar. Återkopplingen är vägledande och inte ett betyg.

## Momentens progression

| Moment | Fokus |
|---|---|
| Struktur | Tes, argument, motargument, bemötande och avslutning som delar i en argumenterande text. |
| Innehåll och resonemang | Utveckla argument och förklara hur de stödjer en ståndpunkt. |
| Textbindning | Välja sambandsord och hänvisningar efter det samband som uttrycks. |
| Meningsbyggnad | Arbeta med tydlighet och variation i meningsstarter och meningslängd. |
| Språklig variation och korrekthet | Bearbeta ordval, stavning, meningsgränser och språkliga normer. |
| Slutdiagnos | Självständigt granska och bearbeta en sammanhängande text. |

## Didaktiska riktlinjer

- Exempel ska användas för jämförelse och samtal, inte som färdig text att kopiera.
- Övningar ska låta eleven formulera egna idéer och uttryck.
- Återkoppling ska rikta uppmärksamheten mot ett hanterbart nästa steg.
- Språklig variation ska inte likställas med ett enda föredraget sätt att skriva.
- Slutdiagnosens återkoppling är formativ och ersätter inte lärarens samlade bedömning.
