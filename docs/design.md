# Designprinciper

## Visuell huvudreferens

Skrivcoachen ska kännas som samma produkt som matematikvyn. Det som delas är:

- ljus bakgrund, och en skrivyta med tunn ljus kant och rundade hörn,
- en topprad som en vit remsa över hela sidan med en tunn linje under: fet titel med underrad (”Kapitel 1 av 6 · Struktur”), en förloppslinje med ett segment per kapitel (klara kapitel är fyllda i blått, det aktuella har blå kontur och vit insida, kommande är grå) och ”1/6”,
- vänsterställd handskriven text på whiteboarden: lila rubriker och mörk brödtext,
- Edda som figur: ett lila runt ansikte med en pratbubbla med lila kant och namnet ovanför; stjärnan ligger i bubblan,
- knappar som rundade rektanglar: blå för huvudhandlingen, vit med tunn kant för övriga och varmt gul för ledtråd.

Det som skiljer sig från matematikvyn är avsiktligt: whiteboarden ska se ut som en whiteboard, med kraftig mörk ram, markerade hörn och vit yta. Varken whiteboarden eller skrivytan har rutnät, och skrivytan är helt vit med sin egen seriftypografi.

Färgerna är uppskattade från en skärmbild av matematikvyn och ligger som variabler överst i avsnittet ”Shared look with the mathematics view” i `src/styles.css`. Byt dem där när de exakta värdena finns.

Whiteboarden använder det lokalt bundlade handskriftsfontet Patrick Hand för all undervisningstext. Skrivytans text behåller sin egen lättlästa seriftypografi. Ladda inte typsnittet från en extern webbfontstjänst.

## Layout

- På breda skärmar fördelas tvåkolumnslayouten med ungefär 45 procent till whiteboarden och 55 procent till skrivytan.
- När skärmbredden är högst 900 px staplas panelerna så skrivytan förblir användbar; progressionen får kunna rullas horisontellt.
- Visa lektionsprogressionen en gång högst upp, i toppraden; undvik extra status- och fasrader.
- Whiteboarden visar ett undervisningssteg åt gången.
- Hela whiteboarden ska synas utan att eleven behöver rulla. På breda skärmar fyller arbetsytan fönstrets höjd; långt innehåll på skrivytan rullar inne i sitt eget kort. Tavlan visar en del i taget och suddas inför nästa del; det går inte att bläddra tillbaka. Om en del ändå inte ryms förminskas tavlans innehåll precis så mycket som behövs (som lägst till 60 procent). På smala, staplade skärmar rullar sidan som vanligt.
- Edda vägleder muntligt. När det är hennes tur att förklara, ställa en fråga eller ge en uppgift läser hon texten högt, och under tiden visar tavlan bara hennes figur med en bubbla märkt **Edda berättar** och tre punkter. Texten visas först när hon har tystnat, så att eleven lyssnar eller läser, aldrig båda samtidigt. Knappar och svarsfält kommer efter texten. Rubriker, citat ur exempeltexten och Eddas svar på det eleven gör läses inte upp. Medan Edda pratar visar tavlan bara rubriken och hennes bubbla med punkter: all annan text, hennes skrivna pratbubbla, **Fortsätt** och **Nästa steg** är dolda tills hon har tystnat. Efter att eleven hittat ett ställe i texten säger hon alltså sin förklaring först, och därefter visas pratbubblan, citatet och förklaringen tillsammans. Hon pratar aldrig medan en skriven pratbubbla syns. Med **Ljud av** i toppraden, eller om rösten inte går att använda, visas texten direkt.
- Whiteboarden visar sitt innehåll del för del i stället för allt samtidigt. Bara rubriken i varje del skrivs för hand, bokstav för bokstav; förklaringar, citat och frågor visas direkt när rubriken är skriven, så att eleven inte behöver vänta på långa stycken. Vid varje stopp (efter målet, mellan exemplen och före avstämningen i övriga steg) väntar tavlan tills eleven väljer **Fortsätt**; svarsfält och knappar visas först när frågan är färdigskriven.
- Det finns ingen knapp för att hoppa över skrivandet: Edda bestämmer när texten visas, i takt med det hon lyfter fram på tavlan. Eleven kan gå vidare först när delen är färdigskriven. Ett steg som eleven redan har sett visas direkt om eleven kommer tillbaka till det.
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
- Lektionen är guidad. Eleven går framåt ett steg i taget: övriga kapitel i progressionen är låsta, det finns ingen **Tillbaka**-knapp, och **Nästa steg** öppnas först när hela tavlan för steget har visats och eleven har svarat på stegets kontroll eller gjort klart dess uppgift. Två försök räcker för att få gå vidare, och ett fel från AI-tjänsten låser aldrig eleven.
- Edda bestämmer vad skrivytan visar; eleven kan inte själv växla. Exempeltexten visas under kapitlets öppning och modellering (kapitel 1–5), och elevens egen text visas från och med kapitlets skrivuppgift. Elevens utkast ändras aldrig av att ytan byter innehåll.
- Fri navigering för visning och granskning: lägg till `?fri` i adressen. Då går kapitlen att öppna i valfri ordning och **Tillbaka**/**Nästa steg** är alltid tillgängliga. Skrivytan styrs fortfarande av Edda.
- Lektionen börjar med en startsida. På whiteboarden hälsar Edda välkommen och eleven väljer vad den vill skriva om bland tre ämnen; valet blir skrivuppgiften ovanför elevens text och sparas lokalt. Skrivytan visar samtidigt **Så här går lektionen till**: de sex kapitlen och vad som händer i varje kapitel. Ingenting skickas till AI på startsidan.
- Varje moment öppnar med tre korta sidor på whiteboarden: en rad som fångar uppmärksamheten, momentets elevnära mål (med kursplanens formulering som liten referens) och sedan förkunskapsfrågan. I första momentet är frågan ”Vad är en argumenterande text?” och exempeltexten presenteras först efter den. Under de sidorna är skrivytan helt tom: varken skrivuppgift, verktyg eller ett tidigare sparat utkast visas. Utkastet finns kvar och visas under **Din text** när lektionen har börjat. Därefter lyssnar eleven på hela exempeltexten utan markeringar medan whiteboarden väntar, och sedan börjar modelleringen. I senare moment ligger exempeltexten kvar utan markeringar under startfrågan. Hela exempeltexten läses bara upp när eleven själv väljer det.
- När eleven lyssnar visas hela exempeltexten utan rullning; på breda skärmar förminskas texten så att den ryms i kortet. Skrivytan visar då bara texten; knappen **Lyssna på texten** ligger på whiteboarden så att den inte tar plats från texten. Det finns ingen knapp för att lyssna på hela exempeltexten igen.
- I modelleringen är exempeltexten synkad med whiteboarden. Tavlan går igenom texten en liten del i taget: när delen är hittad citeras den på tavlan med en kort förklaring från läraren, och samma del lyser gult och förstoras i exempeltexten medan resten av texten blir suddig. Eleven går vidare med **Fortsätt** och exempeltexten följer med. Under genomgången finns ingen lyssna-knapp och ingen lista över alla markeringar.
- Whiteboarden ska aldrig arbeta med annat material än exempeltexten under modelleringen: allt som tavlan lyfter fram är hämtat ur texten bredvid, så att eleven inte behöver hålla två olika exempel i huvudet.
- Ett kapitel kan börja genomgången med en jämförelse: skrivytan visar då ett enkelt och ett utvecklat exempel i var sin ruta, och tavlan lyfter ett par motsvarande delar i taget som lyser gult i båda exemplen. Det utvecklade exemplet är exempeltextens egen inledning, ordagrant. Kapitel 2 gör så innan Edda går igenom begreppen i hela texten.
- Kapitel 5 avslutar genomgången med en felsökning på whiteboarden i stället för kontroller i exempeltexten. En kort påhittad elevtext med språkfel står på tavlan, Edda frågar efter en sorts fel i taget och eleven klickar i texten på tavlan. Alla delar av texten är klickbara och har samma prickade understrykning, så att markeringarna inte avslöjar svaren; hittade fel blir gula och får en kort förklaring. Sist visas texten före och efter rättning tillsammans med de tre språkliga områdena. Texten är påhittad, inte en verklig elevtext.
- Genomgången är inte en föreläsning: för varje del frågar tavlan först (till exempel ”Var står tesen?”), kapitlets alla delar lyser svagt gult i exempeltexten och eleven klickar på den den tror är rätt. När eleven har hittat stället, eller Edda har visat det efter två försök, lyser bara den delen och tavlan visar citatet och Eddas förklaring. Det finns inga separata kontrollfrågor efter genomgången.
- I jämförelserna lyser en del i den övre rutan, och de ändrade ställena i den nedre rutan går att klicka på; eleven letar upp det som motsvarar den lysande delen innan förklaringen visas.
- Före skrivuppgiften visar Edda ett bättre och ett svagare exempel på just den del eleven ska skriva (i kapitel 1 en tes, i kapitel 2 ett argument och så vidare). Eleven klickar på det som är bäst och får Eddas svar; först därefter visas uppgiften. Korten heter **Exempel A** och **Exempel B** tills eleven har valt rätt. Exemplen är hämtade ordagrant ur de två exempeltexterna och handlar därför om ett annat ämne än elevens egen text.
- Varje kapitel har en tydlig skrivuppgift i elevens egen text som följer direkt på genomgången (till exempel ”Börja med att skriva din inledning med tes”). När eleven väljer **Jag är klar – låt Edda läsa** läser Edda det eleven skrivit. På tavlan säger hon en styrka (med stjärna), en sak att pröva och en mening som knyter texten till det eleven visade tidigare i kapitlet. I elevens text markeras styrkan i grönt och det som kan utvecklas i lila, lika tydligt. Rött används inte här. Medan eleven sedan ändrar i sin text ligger rådet kvar på tavlan tillsammans med knappen **Jag har prövat – låt Edda titta igen**; Edda säger då vad som blev bättre och ger inga nya punkter. Slutdiagnoskapitlets uppgift läses inte av Edda.
- Egenkontrollen har inga kryssrutor. För varje påstående trycker eleven **Visa var i din text**; Edda markerar då stället med gult i elevens egen text och visar det som citat under påståendet. Hittar hon inget ställe säger hon det och markerar ingenting. Markeringen försvinner när eleven ändrar texten.
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
