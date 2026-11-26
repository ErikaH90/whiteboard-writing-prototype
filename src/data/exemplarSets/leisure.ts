import type { ExemplarSet } from "../exemplars";
import texts from "./leisure.json";

/** The exemplar texts about keeping the youth centres open, with everything Edda shows in them. */
export const leisure: ExemplarSet = {
  id: "leisure",
  interest: "sports",
  texts,
  models: [
    {
      strong: "Det är hög tid att kommunen håller fritidsgårdarna öppna även på helger och lov, för det är då behovet av en trygg mötesplats är störst.",
      needsWork: "Jag tycker att det är helt fel.",
    },
    {
      strong: "För det första ger fritidsgården unga en gemenskap som är svår att ersätta. Där finns lokaler, aktiviteter och närvarande vuxna, vilket i sin tur ger unga ett meningsfullt sammanhang.",
      needsWork: "För det första är det bra att ha någonstans att träffa kompisar. På fritidsgården kan man umgås och göra roliga saker tillsammans.",
    },
    {
      strong: "Visst hävdas det ofta att helg- och lovöppet blir en tung post i kommunens budget, men detta bemöts enkelt av att förebyggande arbete både stärker ungas trygghet och minskar behovet av dyrare insatser senare.",
      needsWork: "Några hävdar nog att det blir för dyrt för kommunen att ha öppet så mycket. Men det kostar också pengar när ungdomar hamnar i bråk, faktiskt!",
    },
    {
      strong: "Sammanfattningsvis är den låsta dörren en besparing som kommunen inte har råd med. Det är dags att se fritidsgården som en nödvändighet, inte som en lyx.",
      needsWork: "För att sammanfatta får ungdomar inte bara något att göra när fritidsgården är öppen. De får också en trygg plats med vuxna som bryr sig.",
    },
    {
      strong: "En öppen fritidsgård kan ge unga den trygghet de behöver för att må bra.",
      needsWork: "en öppen fritidsgård kan ge unga den tryggheten de behöver må bra",
    },
  ],
  focus: {
    structure: {
      boardNote: "Vi går igenom hur exempeltexten är uppbyggd, en del i taget. Följ det som lyser gult i texten.",
      boardKeys: ["Textens delar", "Det gula i texten"],
      highlights: {
        strong: [
          { quote: "Stängda dörrar, tomma kvällar – håll fritidsgårdarna öppna", ask: "Klicka på rubriken.", label: "Rubrik som visar ämnet och ståndpunkten", explain: "Rubriken säger både vad texten handlar om och vad skribenten tycker: fritidsgårdarna ska vara öppna." },
          { quote: "Det är hög tid att kommunen håller fritidsgårdarna öppna även på helger och lov", ask: "Var står tesen, alltså det skribenten vill övertyga dig om?", label: "Tes: skribentens ståndpunkt", explain: "Här står tesen. Efter den här meningen vet läsaren precis vad skribenten vill." },
          { quote: "För det första ger fritidsgården unga en gemenskap som är svår att ersätta.", ask: "Var börjar det första argumentet?", label: "Första argumentet", explain: "”För det första” visar att nu kommer det första argumentet. Hela stycket handlar om en sak: gemenskapen." },
          { quote: "Utöver gemenskapen erbjuder fritidsgården något som inte alla har hemma: vuxna som lyssnar.", ask: "Var börjar det andra argumentet?", label: "Andra argumentet", explain: "Nytt stycke, nytt argument. Nu handlar det om trygga vuxna." },
          { quote: "Visst hävdas det ofta att helg- och lovöppet blir en tung post i kommunens budget", ask: "Var tar skribenten upp vad andra tycker, alltså ett motargument?", label: "Motargument som skribenten bemöter", explain: "Skribenten tar upp vad andra brukar säga och svarar sedan på det. Då blir texten mer övertygande." },
          { quote: "Sammanfattningsvis är den låsta dörren en besparing som kommunen inte har råd med.", ask: "Var börjar avslutningen?", label: "Avslutning som knyter tillbaka till tesen", explain: "”Sammanfattningsvis” visar att texten avslutas. Skribenten knyter ihop argumenten och går tillbaka till tesen." },
        ],
        basic: [
          { quote: "Fritidsgårdarna måste vara öppna på helgerna!", label: "Rubrik som visar ståndpunkten" },
          { quote: "Jag tycker att det är helt fel.", label: "Tes: skribentens ståndpunkt" },
          { quote: "För det första är det bra att ha någonstans att träffa kompisar.", label: "Första argumentet" },
          { quote: "För det andra är det viktigt att det finns vuxna att prata med.", label: "Andra argumentet" },
          { quote: "Några hävdar nog att det blir för dyrt för kommunen att ha öppet så mycket.", label: "Motargument som skribenten bemöter" },
          { quote: "För att sammanfatta", label: "Avslutningen börjar" },
        ],
      },
    },
    reasoning: {
      boardNote: "Vi tittar på vad som gör ett argument utvecklat. Först jämför vi två inledningar, sedan går vi igenom begreppen i texten. Följ det som lyser gult i texten.",
      boardKeys: ["Två inledningar jämförs", "Begreppen i texten"],
      comparisons: [
        {
          title: "Enkelt eller utvecklat?",
          intro: "Här är två inledningar om samma sak. Läs båda. Vad är det som gör den andra mer utvecklad?",
          simpleLabel: "Enkelt exempel",
          developedLabel: "Utvecklat exempel",
          simpleTag: "Enkelt",
          developedTag: "Utvecklat",
          simple: texts.basic.paragraphs[0],
          developed: texts.strong.paragraphs[0],
          pairs: [
            {
              simple: "Ändå är fritidsgården ofta stängd på helger och lov.",
              developed: "Ändå möts många tonåringar av en låst dörr just när skolan har stängt.",
              label: "Konkret i stället för allmänt",
              explain: "Det enkla exemplet säger bara att det ofta är stängt. Det utvecklade visar det med en bild: tonåringen framför den låsta dörren.",
            },
            {
              simple: "Jag tycker att det är helt fel.",
              developed: "Att bomma igen fritidsgården när unga är lediga är inte bara snålt; det är kortsiktigt.",
              label: "Precisa ord i stället för ”jag tycker”",
              explain: "”Helt fel” säger vad skribenten tycker. ”Snålt” och ”kortsiktigt” säger också varför det är ett problem.",
            },
            {
              simple: "Det finns många anledningar till att jag tycker det.",
              developed: "Det är hög tid att kommunen håller fritidsgårdarna öppna även på helger och lov, för det är då behovet av en trygg mötesplats är störst.",
              label: "Tes med ett skäl",
              explain: "Det enkla exemplet lovar anledningar men ger ingen. Det utvecklade ger ett skäl direkt, efter ordet ”för”.",
            },
          ],
        },
      ],
      flow: [
        { compare: 0 },
        { part: 0 }, { part: 1 }, { part: 2 }, { part: 3 }, { part: 6 }, { part: 4 }, { part: 5 },
      ],
      highlights: {
        strong: [
          { quote: "För det första ger fritidsgården unga en gemenskap som är svår att ersätta.", ask: "Klicka på meningen där skribenten ger sitt första skäl.", label: "Argument", explain: "Ett argument är ett skäl som stödjer tesen. Här är skälet gemenskapen." },
          { quote: "Där finns lokaler, aktiviteter och närvarande vuxna, vilket i sin tur ger unga ett meningsfullt sammanhang.", ask: "Var stöder skribenten sitt skäl med fakta?", label: "Sakargument", explain: "Ett sakargument bygger på fakta som går att kontrollera, inte bara på vad skribenten tycker. Det gör argumentet utvecklat." },
          { quote: "När vi låser dörren flyttar umgänget ut till gator och parkeringsplatser, utom synhåll för vuxna.", ask: "Var visar skribenten vad en stängd fritidsgård leder till?", label: "Följd: vad det leder till", explain: "Skribenten visar vad den låsta dörren leder till. Läsaren får se varför argumentet spelar roll." },
          { quote: "Att låta en fjortonåring stå ensam utanför en släckt lokal under ett helt lov är oförsvarligt.", ask: "Vilken mening vill väcka känslor hos läsaren?", label: "Pathos: argument som väcker känslor", explain: "Här vill skribenten att läsaren ska känna något. Det kallas pathos. Sakargumentet nyss talade till förnuftet; det kallas logos." },
          { quote: "Visst hävdas det ofta att helg- och lovöppet blir en tung post i kommunens budget", ask: "Var tar skribenten upp vad andra brukar säga?", label: "Motargument", explain: "Skribenten tar upp vad andra brukar säga. Det visar att hen har tänkt igenom frågan." },
          { quote: "förebyggande arbete både stärker ungas trygghet och minskar behovet av dyrare insatser senare", ask: "Var svarar skribenten på motargumentet?", label: "Bemötande: svar på motargumentet", explain: "Motargumentet får ett svar med ett skäl. Då står skribentens tes kvar, starkare än förut." },
          { quote: "gemenskap, trygghet och vuxna att lita på", ask: "Var räknar skribenten upp tre saker som unga får när det är öppet?", label: "Triad: tre saker i rad", explain: "Tre saker i rad ger rytm och gör att läsaren minns dem. Det kallas en triad." },
        ],
        basic: [
          { quote: "På fritidsgården kan man umgås och göra roliga saker tillsammans.", label: "Kort förklaring – jämför med den utmärkta texten" },
          { quote: "jag blir ledsen när jag tänker på dem som inte har någonstans att vara", label: "En känsla, inte en förklaring" },
          { quote: "Dessutom mår ungdomar bättre när de har en trygg plats att gå till.", label: "Motargumentet bemöts med ett skäl" },
        ],
      },
    },
    cohesion: {
      boardNote: "Vi tittar på hur sambandsord binder ihop en text. Först ser vi hur tre lösa meningar blir en sammanhängande text, sedan går vi igenom sambandsorden i exempeltexten. Följ det som lyser gult i texten.",
      boardKeys: ["Lösa meningar blir en text", "Sambandsorden i texten"],
      comparisons: [
        {
          title: "Före och efter",
          intro: "Här är samma tre meningar två gånger. Läs båda. Vad är det som gör att den andra hänger ihop bättre?",
          simple: "Det är bra att ha någonstans att träffa kompisar.\nDet är viktigt att det finns vuxna att prata med.\nUngdomar mår bättre när de har en trygg plats att gå till.",
          developed: "För det första är det bra att ha någonstans att träffa kompisar.\nFör det andra är det viktigt att det finns vuxna att prata med.\nDessutom mår ungdomar bättre när de har en trygg plats att gå till.",
          simpleLabel: "Utan sambandsord",
          developedLabel: "Med sambandsord",
          simpleTag: "Före",
          developedTag: "Efter",
          pairs: [
            {
              simple: "Det är bra att ha någonstans att träffa kompisar.",
              developed: "För det första",
              label: "För det första: ordning",
              explain: "Tre lösa meningar blir tre argument i tur och ordning. ”För det första” säger till läsaren att fler skäl kommer.",
            },
            {
              simple: "Det är viktigt att det finns vuxna att prata med.",
              developed: "För det andra",
              label: "För det andra: nästa argument",
              explain: "Nu vet läsaren att det här är ett nytt argument, inte en fortsättning på det förra.",
            },
            {
              simple: "Ungdomar mår bättre när de har en trygg plats att gå till.",
              developed: "Dessutom",
              label: "Dessutom: tillägg",
              explain: "”Dessutom” lägger till ännu ett skäl. Lägg märke till att ordföljden ändras: ”mår ungdomar”.",
            },
          ],
        },
      ],

      highlights: {
        strong: [
          { quote: "Ändå", ask: "Vilket ord i inledningen visar en kontrast, alltså en motsats?", label: "Kontrast", explain: "”Ändå” ställer två saker mot varandra: vi vet att unga behöver någonstans att ta vägen, men dörren är låst.", related: { label: "Fler ord för kontrast", words: ["däremot", "dock", "trots att", "å andra sidan", "medan"] } },
          { quote: "för det är då behovet", ask: "Vilka ord i inledningen visar en orsak?", label: "Orsak", explain: "Det lilla ordet ”för” visar varför fritidsgårdarna ska vara öppna. Efter ordet kommer skälet.", related: { label: "Fler ord för orsak", words: ["eftersom", "därför att", "på grund av"] } },
          { quote: "För det första", ask: "Vilka ord visar att det första argumentet börjar?", label: "Struktur: ordning", explain: "Orden visar ordningen. Läsaren förstår att fler argument kommer.", related: { label: "Fler ord för struktur och exempel", words: ["för det andra", "exempelvis", "framför allt", "sammanfattningsvis"] } },
          { quote: "vilket i sin tur", ask: "Vilka ord visar en följd, alltså vad något leder till?", label: "Konsekvens", explain: "Orden visar vad något leder till: på fritidsgården finns lokaler och vuxna, och följden blir att unga får ett sammanhang.", related: { label: "Fler ord för konsekvens", words: ["därför", "följaktligen", "vilket innebär att"] } },
          { quote: "Utöver gemenskapen", ask: "Vilka ord knyter an till förra stycket och lägger till något nytt?", label: "Tillägg", explain: "Orden pekar tillbaka på förra stycket och lägger till något nytt. Så hänger styckena ihop.", related: { label: "Fler ord för tillägg", words: ["dessutom", "även", "också", "ytterligare"] } },
          { quote: "men detta bemöts", ask: "Vilka ord vänder från motargumentet till skribentens svar?", label: "Kontrast: svaret på motargumentet", explain: "”Men” vänder från motargumentet till skribentens svar." },
          { quote: "Sammanfattningsvis", ask: "Vilket ord visar att texten avslutas?", label: "Struktur: avslutning", explain: "Ordet säger till läsaren att nu knyts allt ihop." },
        ],
        basic: [
          { quote: "Ändå", label: "Motsats" },
          { quote: "För det första", label: "Ordning: första argumentet" },
          { quote: "För det andra", label: "Ordning: andra argumentet" },
          { quote: "Men", label: "Motsats" },
          { quote: "Dessutom", label: "Tillägg" },
          { quote: "För att sammanfatta", label: "Sammanfattning" },
        ],
      },
    },
    sentence: {
      boardNote: "Vi tittar på tre sätt att variera språket: ordval, meningsstarter och meningslängd. För varje sätt ser vi en text före och efter bearbetning. Sedan går vi igenom hur exempeltexten gör.",
      boardKeys: ["Ordval", "Meningsstarter", "Meningslängd"],
      comparisons: [
        {
          title: "Variera ordvalet",
          intro: "Här är samma tanke två gånger. Läs båda. Vilka ord har bytts ut?",
          simple: "Jag tycker att det är viktigt att ungdomar har något att göra på helgerna. Jag tycker att det är bra för ungdomarna och jag tycker också att det är bra för området.",
          developed: "Jag anser att det är betydelsefullt att ungdomar har en meningsfull fritid även på helgerna. Det är värdefullt för ungdomarna och dessutom positivt för tryggheten i området.",
          simpleLabel: "Samma ord flera gånger",
          developedLabel: "Varierat ordval",
          simpleTag: "Före",
          developedTag: "Efter",
          pairs: [
            {
              simple: "viktigt",
              developed: "betydelsefullt",
              label: "Ett mer precist ord",
              explain: "”Viktigt” har blivit ”betydelsefullt”. Betydelsen är densamma, men ordet passar bättre i en argumenterande text.",
            },
            {
              simple: "har något att göra",
              developed: "har en meningsfull fritid",
              label: "Ett exaktare uttryck",
              explain: "Skribenten säger samma sak med ett mer exakt uttryck. Det låter mer genomtänkt.",
            },
            {
              simple: "bra för området",
              developed: "positivt för tryggheten i området",
              label: "Inte samma ord två gånger",
              explain: "Före står ”bra” två gånger. Efter har skribenten valt två olika ord: ”värdefullt” och ”positivt”.",
            },
          ],
        },
        {
          title: "Variera meningsstarterna",
          intro: "Här är fyra meningar två gånger. Läs båda och titta på hur varje mening börjar.",
          simple: "Jag tycker att det är viktigt att fritidsgården har öppet på loven.\nJag tycker att många ungdomar saknar någonstans att vara.\nJag tycker också att fritidsledarna gör ett viktigt jobb.\nJag tycker därför att kommunen borde ha öppet oftare.",
          developed: "Det är viktigt att fritidsgården har öppet även på loven.\nEnligt min uppfattning saknar många ungdomar någonstans att vara.\nDessutom gör fritidsledarna ett viktigt arbete för ungas trygghet.\nDärför anser jag att kommunen borde hålla öppet oftare.",
          simpleLabel: "Samma meningsstart",
          developedLabel: "Varierade meningsstarter",
          simpleTag: "Före",
          developedTag: "Efter",
          pairs: [
            {
              simple: "Jag tycker att många ungdomar saknar någonstans att vara.",
              developed: "Enligt min uppfattning",
              label: "Samma åsikt, ny början",
              explain: "Det är fortfarande skribentens åsikt, men meningen börjar inte med ”jag tycker”.",
            },
            {
              simple: "Jag tycker också att fritidsledarna gör ett viktigt jobb.",
              developed: "Dessutom",
              label: "Börja med ett sambandsord",
              explain: "Ett sambandsord först ger variation och visar samtidigt att det här är ett tillägg.",
            },
            {
              simple: "Jag tycker därför att kommunen borde ha öppet oftare.",
              developed: "Därför anser jag",
              label: "Flytta fram det viktiga",
              explain: "”Därför” har flyttats först i meningen. Då ser läsaren direkt att det här är slutsatsen.",
            },
          ],
        },
        {
          title: "Blanda korta och långa meningar",
          intro: "Här är samma innehåll två gånger. Läs båda högt för dig själv. Hur låter rytmen?",
          simple: "Jag gillar fritidsgården. Den är bra. Man träffar kompisar. Många är ensamma. Det är inte rätt. Den borde vara öppen. Det skulle hjälpa mycket.",
          developed: "Jag anser att fritidsgården borde ha öppet oftare eftersom den ger unga både gemenskap och vuxna att prata med. Många ungdomar är ensamma på loven. Det måste förändras. Genom att hålla dörrarna öppna kan kommunen bidra till en tryggare fritid för alla unga.",
          simpleLabel: "Bara korta meningar",
          developedLabel: "Korta och långa meningar",
          simpleTag: "Före",
          developedTag: "Efter",
          pairs: [
            {
              simple: "Jag gillar fritidsgården. Den är bra. Man träffar kompisar.",
              developed: "Jag anser att fritidsgården borde ha öppet oftare eftersom den ger unga både gemenskap och vuxna att prata med.",
              label: "Flera korta blir en lång",
              explain: "Tre korta meningar har bundits ihop till en lång med ”eftersom”. Då syns hur tankarna hänger ihop.",
            },
            {
              simple: "Många är ensamma. Det är inte rätt.",
              developed: "Många ungdomar är ensamma på loven. Det måste förändras.",
              label: "Korta meningar efter en lång",
              explain: "Efter den långa meningen kommer två korta. De får läsaren att stanna upp, och det viktiga får tyngd.",
            },
          ],
        },
      ],
      flow: [
        { compare: 0 }, { part: 4 },
        { compare: 1 }, { part: 1 }, { part: 3 },
        { compare: 2 }, { part: 0 }, { part: 2 },
      ],
      highlights: {
        strong: [
          { quote: "Att bomma igen fritidsgården när unga är lediga är inte bara snålt; det är kortsiktigt.", ask: "Var följs en längre sats av en kort och bestämd?", label: "Kort mening efter en lång", explain: "En lång sats följs av en kort och bestämd. Växlingen ger texten rytm." },
          { quote: "När vi låser dörren", ask: "Vilken mening börjar med en bisats?", label: "Meningen börjar med en bisats", explain: "Meningen börjar med en bisats, inte med ”vi”. Det ger variation." },
          { quote: "Det handlar inte om förströelse, utan om trygghet.", ask: "Var ställs två saker mot varandra: inte det ena, utan det andra?", label: "Två led ställs mot varandra", explain: "Två led ställs mot varandra: inte tidsfördriv, utan trygghet. Det gör tanken tydlig." },
          { quote: "Genom att hålla öppet på helger och lov", ask: "Vilken mening börjar med hur kommunen kan göra något?", label: "Meningen börjar med hur något görs", explain: "Meningen börjar med hur kommunen kan göra, i stället för med vem som gör det." },
          { quote: "meningsfullt sammanhang", ask: "Var har skribenten valt ett precist uttryck för att unga får något att göra och höra till?", label: "Precist ordval", explain: "I stället för ”något att göra” står ett exaktare uttryck. Det är samma grepp som i exemplet nyss." },
        ],
        basic: [
          { quote: "Jag tycker att det är helt fel. Det finns många anledningar till att jag tycker det.", label: "Två korta meningar med samma uppbyggnad" },
          { quote: "För det första är det", label: "Styckena börjar på samma sätt" },
          { quote: "För det andra är det", label: "Styckena börjar på samma sätt" },
        ],
      },
    },
    language: {
      boardNote: "Först tittar vi på hur exempeltexten använder skiljetecken och ordval. Sedan får du leta språkfel i en annan text, här hos mig.",
      boardKeys: ["Skiljetecken och ordval", "Leta språkfel"],
      hunt: {
        intro: "Här är en påhittad elevtext med flera språkfel. Kan du hitta dem?",
        segments: [
          { text: "vi", label: "Stor bokstav", explain: "En mening börjar med stor bokstav: ”Vi”." },
          { text: "måste ha mera öppet", label: "Inget fel", explain: "Här finns inget fel, även om ”mera” gärna kan bli ”mer”." },
          { text: "för dom", label: "Talspråk", explain: "”Dom” är talspråk. I skrift heter det ”de” eller ”dem”." },
          { text: "sa att fritids gården", label: "Särskrivning", explain: "”Fritidsgården” är ett sammansatt ord och skrivs ihop." },
          { text: "är våran", label: "Talspråk", explain: "”Våran” är talspråk. I skrift heter det ”vår”." },
          { text: "trygga platts.", label: "Stavfel", explain: "”Plats” stavas med ett t." },
          { text: "eftersom många är ensamma på loven.", label: "Ofullständig mening", explain: "En bisats som börjar med ”eftersom” kan inte stå ensam. Den behöver sitta ihop med en huvudsats." },
          { text: "och dessutom så", label: "Flera bindeord i rad", explain: "Tre bindeord efter varandra. Det räcker med ”Dessutom”." },
          { text: "blir det lugnare ute.", label: "Inget fel", explain: "Här finns inget fel." },
        ],
        questions: [
          { prompt: "Klicka på ordet som ska börja med stor bokstav allra först i texten.", targets: [0] },
          { prompt: "Klicka på de två ställen där eleven skriver som man pratar.", targets: [2, 4] },
          { prompt: "Klicka på stället där ett sammansatt ord har skrivits isär.", targets: [3] },
          { prompt: "Klicka på stavfelet.", targets: [5] },
          { prompt: "Klicka på meningen som inte är fullständig.", targets: [6] },
        ],
        corrected: "Fritidsgården måste ha öppet oftare, eftersom många är ensamma på loven. Dessutom är den vår trygga plats, och när den har öppet blir det lugnare ute.",
        areas: [
          { name: "Skrivregler och normer", fix: "Använd stor bokstav vid ny mening och kontrollera skiljetecknen." },
          { name: "Grammatik och struktur", fix: "Knyt ihop bisatser med huvudsatser och skriv sammansatta ord i ett ord." },
          { name: "Språklig variation och stavning", fix: "Skilj på talspråk och skriftspråk och kontrollera stavningen." },
        ],
      },
      highlights: {
        strong: [
          { quote: "snålt; det är kortsiktigt", ask: "Var binder ett semikolon ihop två påståenden?", label: "Semikolon binder ihop två påståenden som hör ihop", explain: "Semikolon binder ihop två påståenden som hör nära ihop, utan att en ny mening börjar." },
          { quote: "lokaler, aktiviteter och närvarande vuxna", ask: "Var står ett komma mellan orden i en uppräkning av vad som finns på fritidsgården?", label: "Komma i uppräkning", explain: "Komma mellan orden i en uppräkning, och ”och” före det sista." },
          { quote: "oförsvarligt", ask: "Klicka på ett ord som passar en formell text bättre än ”helt fel”.", label: "Ordval som passar en argumenterande text", explain: "Ett precist ord som passar en argumenterande text. Det betyder att något inte går att försvara." },
          { quote: "förebyggande arbete", ask: "Vilka ord betyder ”det man gör för att problem inte ska uppstå”?", label: "Precist ordval", explain: "”Förebyggande” betyder att man hindrar problem innan de uppstår. Ordvalet är exakt." },
        ],
        basic: [
          { quote: "helt fel", label: "Vardagligt ordval" },
          { quote: "faktiskt!", label: "Talspråklig ton och utropstecken" },
        ],
      },
    },
  },
};
