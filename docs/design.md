# Designprinciper

## Visuell huvudreferens

Den användartillhandahållna skärmbilden styr appens grundläggande visuella identitet. Behåll:

- ljusgrå bakgrund,
- kompakt progression högt upp,
- stor vit whiteboard till vänster med kraftig mörk ram och markerade hörn,
- separat vit, rundad skrivyta till höger,
- diskreta accentfärger, rundade hörn och tydlig typografi.

Introducera inte ett separat designsystem. Anpassa bara referensens innehåll till skrivuppgiften.

Whiteboarden använder det lokalt bundlade handskriftsfontet Patrick Hand för all undervisningstext. Skrivytans text behåller sin egen lättlästa seriftypografi. Ladda inte typsnittet från en extern webbfontstjänst.

## Layout

- På breda skärmar fördelas tvåkolumnslayouten med ungefär 45 procent till whiteboarden och 55 procent till skrivytan.
- När skärmbredden är högst 900 px staplas panelerna så skrivytan förblir användbar; progressionen får kunna rullas horisontellt.
- Visa lektionsprogressionen en gång högst upp; undvik extra status- och fasrader.
- Whiteboarden visar ett undervisningssteg åt gången.
- Hela whiteboarden ska synas utan att eleven behöver rulla. På breda skärmar fyller arbetsytan fönstrets höjd; långt innehåll på skrivytan rullar inne i sitt eget kort. Tavlan visar en del i taget och suddas inför nästa del, och eleven kan gå tillbaka med **Visa föregående del**. Om en del ändå inte ryms förminskas tavlans innehåll precis så mycket som behövs (som lägst till 60 procent). På smala, staplade skärmar rullar sidan som vanligt.
- Whiteboarden skriver sin undervisningstext för hand, del för del, i stället för att visa allt samtidigt. Vid varje stopp (efter målet, mellan exemplen och före avstämningen i övriga steg) väntar tavlan tills eleven väljer **Fortsätt**; svarsfält och knappar visas först när frågan är färdigskriven.
- Eleven kan alltid välja **Visa hela texten** för att hoppa över skrivandet av den aktuella delen. Ett steg som eleven redan har sett visas direkt när eleven går tillbaka till det.
- Eddas återkoppling och elevens egna svar skrivs inte ut med skrivanimationen.
- Avstämningen visar antingen svarsalternativ eller ett fritextfält beroende på uppgiften, aldrig båda samtidigt.
- Varje nytt kapitel börjar med en kort återkallningsfråga; visa vid behov ett kort författat stöd först efter elevens försök.
- Eleven ombeds inte skatta svårighet; anpassningen utgår från lärsignalerna i elevens svar. Startfrågan visar bara frågan, svarsfältet och återkopplingen; visa inte anpassade exempel förrän eleven ber om dem.
- Det finns inga ämnesanpassade exempel och ingen ämnesväljare; de drog uppmärksamheten bort från exempeltexten. Endast slutdiagnosmomentet, som saknar exempeltext, har kvar en jämförelse mellan två korta exempel som eleven klickar på.
- AI-coachen heter **Edda** i gränssnittet. När eleven svarar rätt eller är på rätt spår visas en gul stjärna bredvid Eddas svar. Stjärnans storlek följer hur utvecklat svaret var: liten och blek för ett kort svar på rätt spår, mellanstor för ett förklarat svar och stor med sken för ett utvecklat svar. Ett rätt klick ger som mest den mellanstora stjärnan; den stora kräver ett svar med egna ord. Stjärnan är tavlans enda färgstarka belöning och används inte för något annat; den studsar in en gång och står still vid minskad rörelse.
- När exit ticketen är klar visas **Det här kan du nu**: momentets mål, en stjärnmärkt lista över det eleven har visat att den kan under lektionen, och (när lektionens första fråga gäller samma område) elevens första svar bredvid det senaste. Efter ett svar som är på rätt spår visas ingen **Försök igen**-knapp; eleven går vidare med **Nästa steg**.
- Sidan har ingen sidfot med demotexter. En rad visas längst ned bara om lärprofilen inte kan läsas eller sparas.
- Före slutdiagnosen visas en fråga i taget i en separat återkallningsrunda utan elevutkast, exempel eller AI-feedback.
- Skrivytan ska förbli den tydligaste platsen för elevens eget skrivande.
- Skrivytan visar en exempeltext under momenten Struktur till Språk, från det att eleven har lyssnat på den första gången. Eleven växlar mellan **Exempeltext** och **Din text**; exempeltexten visas som standard under startfrågan och modelleringen, och elevens text i övriga steg. Exempeltexten går inte att redigera och elevens utkast ändras aldrig av växlingen.
- Varje moment öppnar med tre korta sidor på whiteboarden: en rad som fångar uppmärksamheten, momentets elevnära mål (med kursplanens formulering som liten referens) och sedan förkunskapsfrågan. I första momentet är frågan ”Vad är en argumenterande text?” och exempeltexten presenteras först efter den. Under de sidorna är skrivytan helt tom: varken skrivuppgift, verktyg eller ett tidigare sparat utkast visas. Utkastet finns kvar och visas under **Din text** när lektionen har börjat. Därefter lyssnar eleven på hela exempeltexten utan markeringar medan whiteboarden väntar, och sedan börjar modelleringen. I senare moment ligger exempeltexten kvar utan markeringar under startfrågan. Därefter är det tyst: uppläsningen startar aldrig av sig själv.
- När eleven lyssnar visas hela exempeltexten utan rullning; på breda skärmar förminskas texten så att den ryms i kortet. Skrivytan visar då bara texten; knappen **Lyssna på texten** ligger på whiteboarden så att den inte tar plats från texten. Efter lyssnandet är lektionen tyst och det finns ingen knapp för att lyssna igen.
- I modelleringen är exempeltexten synkad med whiteboarden. Tavlan går igenom texten en liten del i taget: delen citeras på tavlan med en kort förklaring från läraren, och samma del lyser gult och förstoras i exempeltexten medan resten av texten blir suddig. Eleven styr takten med **Fortsätt** och kan gå tillbaka med **Visa föregående del**; exempeltexten följer med åt båda håll. Under genomgången finns ingen lyssna-knapp och ingen lista över alla markeringar.
- Whiteboarden ska aldrig arbeta med annat material än exempeltexten under modelleringen: allt som tavlan lyfter fram är hämtat ur texten bredvid, så att eleven inte behöver hålla två olika exempel i huvudet.
- Genomgången avslutas med en kontroll som görs i själva texten: tavlan ställer en fråga (till exempel ”Klicka på tesen i texten till höger”), momentets delar lyser gult i exempeltexten och eleven svarar genom att klicka på rätt del. Edda svarar på tavlan. Fel val kan göras om; rätt val låser markeringarna.
- I övriga steg kan eleven öppna exempeltexten som en sammanfattning: alla momentets markeringar är gula och numrerade med förklaringar ovanför texten, så att färgen inte är den enda informationsbäraren, och den enklare texten finns att jämföra med. Gult används bara för exempeltextens markeringar; rött är fortsatt reserverat för möjliga problem i elevens text.
- Exempeltexten döljs i återkallningssteget, i återkallningsrundan före slutdiagnosen och i hela slutdiagnosmomentet.

## Kognitiv belastning och teknologisk mättnad

- Minska konkurrerande UI-signaler: varje synligt element ska hjälpa eleven att förstå målet, göra nästa handling eller tolka återkoppling.
- Prioritera aktiv bearbetning genom att låta eleven jämföra, återkalla, förklara, tillämpa och revidera i stället för att visa långa informationsblock.
- I modelleringen ska elevexemplen vara whiteboardens tydligaste innehåll; kursplansmålet och hjälptexten ska vara visuellt sekundära och upprepade instruktioner tas bort.
- Använd progressiv visning: visa ett undervisningssteg och en exit-ticket-fråga i taget; dölj stöd när det inte hör till den aktuella uppgiften.
- Undvik upprepade instruktioner, statusmeddelanden och progressionsindikatorer när samma information redan är tydlig.
- I slutdiagnosens sista steg visas bara skrivuppgiften och skrivytan. Dölj whiteboard, kursnavigering, mål, kriterier och skrivstöd; erbjud AI-återkoppling först efter att eleven markerat diagnosen som klar.
- Slutdiagnosens ämne ska vara nytt, skrivytan tom och skild från det tränade utkastet. Diagnosutkastet autosparas inte; i demoläget sparas det först efter elevens tydliga inlämning och med synlig varning om att lärarvyn inte är en säker verklig kanal.
- Återkoppling visas efter elevens uttryckliga handling och placeras nära texten eller svaret den gäller.
- Visa slutchecklistan först efter att slutdiagnosen har lämnats in. Håll checklistan hopfällbar och tydligt skild från diagnosläget; separat bearbetning får aldrig skriva över den låsta originaltexten.

## Återkoppling och tillgänglighet

- Rött reserveras för konkreta möjliga problem och kompletteras alltid med text.
- Förbättringsområden markeras direkt i skrivtexten; kommentaren visas i en liten kontextuell ruta när eleven väljer markeringen.
- Popupen har en **Fortsätt skriva**-knapp som fokuserar det markerade textspannet utan att ändra innehållet.
- Återkoppling visas inte som en lista med kort under skrivytan.
- Formativ återkoppling visar målet, belagd framgång, förbättringsområden och nästa steg i en kompakt sammanfattning före skrivytan.
- Positiv återkoppling och utvecklingsförslag skiljs visuellt från röda markeringar.
- Gränssnittet visar ingen särskild upplysning om OpenAI vid entry check, avstämningar, exit tickets, exempelval eller skrivytans återkoppling.
- Färg är aldrig den enda informationsbäraren.
- Kontroller ska kunna användas med tangentbord och ha begripliga namn.
- Rörelse ska respektera användarens inställning för minskad rörelse: då visas varje del av whiteboarden direkt, men stoppen mellan delarna finns kvar.
- Medan tavlan skriver finns hela texten för den aktuella delen tillgänglig för skärmläsare; den delvis skrivna texten är dold för hjälpmedel.
- Text, fokusmarkeringar och interaktiva ytor ska ha tillräcklig läsbarhet.

## Responsiv granskning

Manuellt kontrollera dator, surfplatta och smal mobilbredd. Surfplatta ska behålla två kolumner när innehållet fortfarande går att läsa och använda; annars ska panelerna staplas utan att innehåll eller kontroller kapas.
