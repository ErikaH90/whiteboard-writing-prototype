# Designprinciper

## Sidlayout utan whiteboard

Skrivcoachen delar formspråk med läsförståelseprototypen. Det finns ingen whiteboard längre:

- Sidan är vit. Texten (exempeltexten eller elevens egen text) är själva sidan och ligger till vänster, utan kort eller ram, med en liten etikett (”Exempeltext”) över exempeltextens rubrik.
- Edda talar från en pratbubbla till höger om texten: vit, rundad, med mjuk skugga, en liten pil mot texten och hennes lila ansikte uppe till vänster i bubblan. Allt som tidigare stod på whiteboarden (rubriker, frågor, svarsalternativ, skrivkartan, checklistor och knappar) visas i bubblan.
- Bubblan är bara så hög som innehållet kräver. Medan Edda talar syns bara hennes ansikte, rubriken och tre punkter.
- Texten i bubblan sätts i DM Sans med lila rubriker. Handstilen Patrick Hand används inte i bubblan.
- På breda skärmar tar texten cirka 60 procent och bubblan cirka 40. Vid högst 900 px staplas de, med Edda överst, och pilen döljs.
- Innan det finns någon text att visa står bubblan ensam, centrerad på sidan.
- Den lilla skrivkartan ligger alltid i toppraden, även innan Edda har läst något. Ett klick öppnar hela hjulet med färgförklaring, så att eleven själv kan se hur det färgläggs under vägen.
- Edda hänvisar till ”texten”, aldrig till höger eller vänster, eftersom placeringen skiljer sig mellan bred och smal skärm.

Där resten av dokumentet säger ”whiteboarden” eller ”tavlan” avses Eddas bubbla. Reglerna om ett steg i taget, tal före text och guidad gång gäller oförändrat. I koden heter delarna fortfarande `board-frame`, `board-surface` och `board-content`.

## Visuell huvudreferens

Skrivcoachen ska kännas som samma produkt som matematikvyn. Det som delas är:

- ljus bakgrund, och en skrivyta med tunn ljus kant och rundade hörn,
- en topprad som en vit remsa över hela sidan med en tunn linje under: fet titel med underrad (”Kapitel 1 av 6 · Struktur”), en förloppslinje med ett segment per kapitel (klara kapitel är fyllda i blått, det aktuella har blå kontur och vit insida, kommande är grå) och ”1/6”,
- vänsterställd text i Eddas bubbla: lila rubriker och mörk brödtext,
- Edda som figur: ett lila runt ansikte uppe till vänster i pratbubblan; Eddas markering ligger i hennes svar,
- knappar som rundade rektanglar: blå för huvudhandlingen, vit med tunn kant för övriga och varmt gul för ledtråd.

Ingen yta har rutnät, och skrivytan är vit med sin egen seriftypografi.

Färgerna är uppskattade från en skärmbild av matematikvyn och ligger som variabler överst i avsnittet ”Shared look with the mathematics view” i `src/styles.css`. Byt dem där när de exakta värdena finns.

Skrivytans text behåller sin egen lättlästa seriftypografi. Ladda inte typsnitt från en extern webbfontstjänst.

## Layout

- På breda skärmar tar texten till vänster cirka 60 procent och Eddas bubbla till höger cirka 40.
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
- AI-coachen heter **Edda** i gränssnittet. När eleven är på rätt spår visas Eddas markering bredvid hennes svar, i samma formspråk som skrivkartan och utan markering eller andra priser. För ett svar med elevens egna ord är markeringen en bit av skrivkartans hjul som fylls inifrån och ut i tre steg, med stegets namn under: grundläggande (gul), utvecklat (grön) och välutvecklat (grön, helt fylld). För ett rätt klick är den en enkel grön bock. Ett svar som behöver ett nytt försök får ingen markering.
- När exit ticketen är klar visas **Det här kan du nu**: momentets mål, en lista med gröna bockar över det eleven har visat att den kan under lektionen, och (när lektionens första fråga gäller samma område) elevens första svar bredvid det senaste. Efter ett svar som är på rätt spår visas ingen **Försök igen**-knapp; eleven går vidare med **Nästa steg**.
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
- Varje kapitel har en tydlig skrivuppgift i elevens egen text som följer direkt på genomgången (till exempel ”Börja med att skriva din inledning med tes”). När eleven väljer **Jag är klar – låt Edda läsa** läser Edda det eleven skrivit. På tavlan säger hon en styrka (med markering), en sak att pröva och en mening som knyter texten till det eleven visade tidigare i kapitlet. I elevens text markeras styrkan i grönt och det som kan utvecklas i lila, lika tydligt. Rött används inte här. Medan eleven sedan ändrar i sin text ligger rådet kvar på tavlan tillsammans med knappen **Jag har prövat – låt Edda titta igen**; Edda säger då vad som blev bättre och ger inga nya punkter. Slutdiagnoskapitlets uppgift läses inte av Edda.
- Sidan **Målet med lektionen** visar målet och därunder en rad om varför kapitlet lönar sig (`worth` i lektionsdata): nyttan för elevens egen text och att det bedöms i svenska. Kursplanscitatet visas inte längre där; det finns kvar i återkopplingen på utkastet.
- Redundans undviks: det Edda har sagt visas inte en gång till som text. När hon har hörts till slut står bara några nyckelord kvar som små etiketter (målet och genomgångens inledning), eller ingenting alls när rubriken redan är nyckelordet (ett hittat ställe, jämförelsernas inledning, välkomsten). Det som eleven behöver ha framför sig för att kunna arbeta visas som text efter att hon tystnat: frågor och uppgifter. Är ljudet av, eller blev hon avbruten, visas hela texten i stället, så att inget går förlorat.
- Målet upprepas inte som text när genomgången börjar; steget har bara kapitlets namn som rubrik.
- Efter en inlämnad skrivuppgift visar tavlan först Eddas korta svar om vad som fungerar. Saknas något av det uppgiften bad om finns knappen **Se hur exempeltexten gör**: exempeltexten kommer då tillbaka bredvid tavlan med just det stället gult, och tavlan visar bara ställets namn och Eddas förklaring. **Pröva i din text** tar eleven tillbaka till sin egen text med en fråga under **Att pröva**, och **Jag har prövat – låt Edda titta igen** tänds när texten har ändrats.
- Samma sak sägs bara på ett ställe. Toppraden visar var eleven är (kapitel och sex streck); tavlan har inga egna räknare eller kapiteletiketter. Bara en knapp för att gå framåt syns åt gången: **Fortsätt** inom ett steg, och **Nästa steg** först när steget är klart.
- Genomgången börjar med att eleven letar själv: en öppen fråga på tavlan, och i texten är ingenting markerat förrän eleven har hittat det. Fynden lyser gult och Edda sätter namn på det senaste i sin pratbubbla.
- När eleven har hittat ett ställe i exempeltexten (eller Edda har visat det) är tavlan ren: rubriken och det Edda säger om stället, i hennes pratbubbla, och inget mer. Texten i bubblan visas först när hon har sagt den. Citatet upprepas inte på tavlan, eftersom det lyser gult i texten bredvid, och AI:n skriver inget eget svar på ett rätt klick. Bubblan har en grön bock när eleven själv hittade stället.
- Eddas AI-svar är korta: högst två korta meningar, utan långa förklaringar och utan beskrivningar av vad ett bättre svar skulle ha innehållit.
- Startsidan låter eleven välja ämne bland tre förslag eller skriva en egen fråga att ta ställning i. Därefter väljer eleven vem texten ska övertyga (rektorn, kommunens politiker, skoltidningens läsare eller en egen mottagare). Valen visas ovanför elevens text: skrivuppgiften och raden **Du skriver för att övertyga …**. De sparas i webbläsaren och skickas inte till AI.
- Varje kapitel slutar med **Min skrivkarta** på tavlan (”Så här långt har du kommit”), efter exit ticketen i kapitel 1–5 och efter egenkontrollen i kapitel 6. Kartan är ett hjul med fem delar (Struktur, Resonemang, Textbindning, Meningar, Språk) och en sjätte bit, **Redo för slutdiagnos**, med Edda i mitten. Varje del fylls inifrån och ut i tre steg: grundläggande (gul), utvecklad (grön) och välutvecklad (grön, helt fylld). Ingen röd färg används. Delar som Edda inte har gått igenom än är nedtonade och går inte att välja. När alla fem delar är minst utvecklade blir **Redo för slutdiagnos** grön. Först visas bara hjulet och den korta förklaringen av färgerna, med tom yta under, för att hålla nere den kognitiva belastningen. Vill eleven veta mer klickar den på en del; då visar Edda sitt belägg som citat, citatet markeras grönt i elevens text och en sak **Att pröva för nästa steg** visas. Ett klick till på samma del lägger undan tipsen. Under tipsen finns **Träna mer på …**: då byts hjulet mot en kort övningsrunda för den delen, anpassad efter hur långt delen har kommit i elevens text. Syns delen inte alls börjar rundan med ett exempel, sedan repetition med egna ord och till sist ett försök i den egna texten; är delen påbörjad hoppas exemplet över; är den utvecklad går eleven direkt till sin text. Rundan slutar med att Edda läser texten igen och kartan visar vad arbetet ledde till. Knappen för att låta Edda läsa igen visas först när eleven har ändrat sin text. Kartan ritar sig själv: Edda läser texten när eleven lämnar in kapitlets skrivuppgift (**Jag är klar – låt Edda läsa**), och kartan visas sedan direkt vid kapitlets slut och som en liten karta utan ord i toppraden. Delarna Textbindning och Meningar följer texten medan eleven skriver. Knappen **Visa min skrivkarta** finns bara kvar som reserv när Edda ännu inte har läst texten, till exempel i visningsläget `?fri`. Under hjulet finns länken **Visa min skrivkarta för läraren**; när eleven har valt det står det att läraren kan se kartan, och lärarvyn (lokalt demoläge) visar samma hjul med stegen och Eddas belägg, inte hela texten.
- I kapitel 6 följs skrivuppgiften, medan elevens egen text fortfarande visas och före slutrepetitionen och slutdiagnosen, av **Checklista inför inlämning** på tavlan: 28 punkter i fyra delar (struktur och innehåll, resonemang, språk/stil/textbindning, språkriktighet). En del visas i taget så att allt ryms utan rullning; eleven klickar på en punkt för att bocka av och stryka över den, och en räknare visar hur många som är avklarade. Inget skickas till AI.
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
- Knappen **Textformat** i toppraden (och i slutdiagnosens verktygsrad) öppnar elevens egna läsinställningar för skrivytan: textstorlek, radavstånd, avstånd mellan bokstäver och ord, bakgrundsfärg och läslinjal. Panelen är stängd tills eleven öppnar den, och valen sparas i webbläsaren.
- Inställningarna gäller exempeltexten och elevens egen text på skrivytan. Typsnittet ändras inte, och whiteboarden påverkas inte.
- Det finns ingen gul bakgrund, eftersom de gula markeringarna måste synas tydligt.
- När eleven har valt större eller glesare text krymps exempeltexten inte längre för att rymmas: den behåller sin storlek och rullas i stället, och avstavningen stängs av.
- Läslinjalen följer pekaren över skrivytan och försvinner medan eleven skriver.

## Responsiv granskning

Manuellt kontrollera dator, surfplatta och smal mobilbredd. Surfplatta ska behålla två kolumner när innehållet fortfarande går att läsa och använda; annars ska panelerna staplas utan att innehåll eller kontroller kapas.
