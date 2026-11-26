import type { ExemplarSet } from "../exemplars";
import texts from "./screens.json";

/** The exemplar texts about a higher age limit for social media, with everything Edda shows in them. */
export const screens: ExemplarSet = {
  id: "screens",
  interest: "technology",
  texts,
  models: [
    {
      strong: "Det är hög tid att åldersgränsen höjs till 15 år och verkligen kontrolleras, för dagens tandlösa regler drabbar både ungas sömn och deras självbild.",
      needsWork: "Jag tycker att åldersgränsen ska höjas till 15 år.",
    },
    {
      strong: "För det första är apparna medvetet utformade för att stjäla vår tid. Oändliga flöden och ständiga notiser gör det svårt att lägga ifrån sig mobilen, vilket i sin tur går ut över sömn, rörelse och umgänge.",
      needsWork: "För det första är det inte bra för sömnen att ha sociala medier. Man fastnar lätt med mobilen på kvällen och då blir man trött dagen efter.",
    },
    {
      strong: "Visst hävdas det ofta att en högre åldersgräns stänger unga ute från gemenskapen, men detta bemöts enkelt av att vänskap går utmärkt att vårda utan flöden som tjänar pengar på varje vaken minut.",
      needsWork: "Några hävdar nog att barn behöver sociala medier för att ha kontakt med sina kompisar. Men man kan ju träffas på riktigt också, faktiskt!",
    },
    {
      strong: "Sammanfattningsvis är en åldersgräns utan kontroll bara en ruta att kryssa i. Det är dags att sluta skylla på barnen och i stället ställa krav på företagen.",
      needsWork: "För att sammanfatta gör vi inte bara något bra för sömnen när vi höjer åldersgränsen. Vi hjälper också barn att må bättre och vara nöjda med sig själva.",
    },
    {
      strong: "En högre åldersgräns kan ge unga den sömn de behöver för att må bra.",
      needsWork: "en högre åldersgräns kan ge unga den sömnen de behöver må bra",
    },
  ],
  focus: {
    structure: {
      boardNote: "Vi går igenom hur exempeltexten är uppbyggd, en del i taget. Följ det som lyser gult i texten.",
      boardKeys: ["Textens delar", "Det gula i texten"],
      highlights: {
        strong: [
          { quote: "Barndom till salu – höj åldersgränsen för sociala medier", ask: "Klicka på rubriken.", label: "Rubrik som visar ämnet och ståndpunkten", explain: "Rubriken säger både vad texten handlar om och vad skribenten tycker: åldersgränsen för sociala medier ska höjas." },
          { quote: "Det är hög tid att åldersgränsen höjs till 15 år och verkligen kontrolleras", ask: "Var står tesen, alltså det skribenten vill övertyga dig om?", label: "Tes: skribentens ståndpunkt", explain: "Här står tesen. Efter den här meningen vet läsaren precis vad skribenten vill." },
          { quote: "För det första är apparna medvetet utformade för att stjäla vår tid.", ask: "Var börjar det första argumentet?", label: "Första argumentet", explain: "”För det första” visar att nu kommer det första argumentet. Hela stycket handlar om en sak: tiden som apparna tar." },
          { quote: "Utöver den förlorade tiden urholkar den ständiga jämförelsen ungas självbild.", ask: "Var börjar det andra argumentet?", label: "Andra argumentet", explain: "Nytt stycke, nytt argument. Nu handlar det om självbilden." },
          { quote: "Visst hävdas det ofta att en högre åldersgräns stänger unga ute från gemenskapen", ask: "Var tar skribenten upp vad andra tycker, alltså ett motargument?", label: "Motargument som skribenten bemöter", explain: "Skribenten tar upp vad andra brukar säga och svarar sedan på det. Då blir texten mer övertygande." },
          { quote: "Sammanfattningsvis är en åldersgräns utan kontroll bara en ruta att kryssa i.", ask: "Var börjar avslutningen?", label: "Avslutning som knyter tillbaka till tesen", explain: "”Sammanfattningsvis” visar att texten avslutas. Skribenten knyter ihop argumenten och går tillbaka till tesen." },
        ],
        basic: [
          { quote: "Höj åldersgränsen för sociala medier!", label: "Rubrik som visar ståndpunkten" },
          { quote: "Jag tycker att åldersgränsen ska höjas till 15 år.", label: "Tes: skribentens ståndpunkt" },
          { quote: "För det första är det inte bra för sömnen att ha sociala medier.", label: "Första argumentet" },
          { quote: "För det andra är det synd om barn som jämför sig med andra.", label: "Andra argumentet" },
          { quote: "Några hävdar nog att barn behöver sociala medier för att ha kontakt med sina kompisar.", label: "Motargument som skribenten bemöter" },
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
              simple: "Ändå har många barn egna konton fast de är små.",
              developed: "Ändå lyser skärmarna i barnrummen långt efter läggdags medan allt yngre barn skaffar konton.",
              label: "Konkret i stället för allmänt",
              explain: "Det enkla exemplet säger bara att många barn har konton. Det utvecklade visar det med en bild: skärmarna som lyser i barnrummen.",
            },
            {
              simple: "Jag tycker att det är jättedåligt.",
              developed: "Att lämna barn ensamma på plattformar byggda för vuxna är inte bara naivt; det är ansvarslöst.",
              label: "Precisa ord i stället för ”jag tycker”",
              explain: "”Jättedåligt” säger vad skribenten tycker. ”Naivt” och ”ansvarslöst” säger också varför det är ett problem.",
            },
            {
              simple: "Jag tycker att åldersgränsen ska höjas till 15 år.",
              developed: "Det är hög tid att åldersgränsen höjs till 15 år och verkligen kontrolleras, för dagens tandlösa regler drabbar både ungas sömn och deras självbild.",
              label: "Tes med ett skäl",
              explain: "Det enkla exemplet säger vad skribenten vill men inte varför. Det utvecklade ger ett skäl direkt, efter ordet ”för”.",
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
          { quote: "För det första är apparna medvetet utformade för att stjäla vår tid.", ask: "Klicka på meningen där skribenten ger sitt första skäl.", label: "Argument", explain: "Ett argument är ett skäl som stödjer tesen. Här är skälet att apparna tar vår tid." },
          { quote: "Oändliga flöden och ständiga notiser gör det svårt att lägga ifrån sig mobilen, vilket i sin tur går ut över sömn, rörelse och umgänge.", ask: "Var stöder skribenten sitt skäl med fakta?", label: "Sakargument", explain: "Ett sakargument bygger på fakta som går att kontrollera, inte bara på vad skribenten tycker. Det gör argumentet utvecklat." },
          { quote: "När vi låter en tioåring skapa ett konto riskerar vi hennes nattsömn.", ask: "Var visar skribenten vad vårt val leder till?", label: "Följd: vad det leder till", explain: "Skribenten visar vad valet leder till. Läsaren får se varför argumentet spelar roll." },
          { quote: "Att låta ett barn mäta sitt värde i gillamarkeringar är hänsynslöst.", ask: "Vilken mening vill väcka känslor hos läsaren?", label: "Pathos: argument som väcker känslor", explain: "Här vill skribenten att läsaren ska känna något. Det kallas pathos. Sakargumentet nyss talade till förnuftet; det kallas logos." },
          { quote: "Visst hävdas det ofta att en högre åldersgräns stänger unga ute från gemenskapen", ask: "Var tar skribenten upp vad andra brukar säga?", label: "Motargument", explain: "Skribenten tar upp vad andra brukar säga. Det visar att hen har tänkt igenom frågan." },
          { quote: "vänskap går utmärkt att vårda utan flöden som tjänar pengar på varje vaken minut", ask: "Var svarar skribenten på motargumentet?", label: "Bemötande: svar på motargumentet", explain: "Motargumentet får ett svar med ett skäl. Då står skribentens tes kvar, starkare än förut." },
          { quote: "sömn, självbild och fritid", ask: "Var räknar skribenten upp tre saker i rad i avslutningen?", label: "Triad: tre saker i rad", explain: "Tre saker i rad ger rytm och gör att läsaren minns dem. Det kallas en triad." },
        ],
        basic: [
          { quote: "Man fastnar lätt med mobilen på kvällen och då blir man trött dagen efter.", label: "Kort förklaring – jämför med den utmärkta texten" },
          { quote: "jag blir ledsen när jag tänker på hur dåligt många mår av det", label: "En känsla, inte en förklaring" },
          { quote: "Dessutom kan man ringa eller skicka sms till varandra.", label: "Motargumentet bemöts med ett skäl" },
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
          simple: "Det är inte bra för sömnen att ha sociala medier.\nDet är synd om barn som jämför sig med andra.\nFöretagen tjänar pengar på barnens tid.",
          developed: "För det första är det inte bra för sömnen att ha sociala medier.\nFör det andra är det synd om barn som jämför sig med andra.\nDessutom tjänar företagen pengar på barnens tid.",
          simpleLabel: "Utan sambandsord",
          developedLabel: "Med sambandsord",
          simpleTag: "Före",
          developedTag: "Efter",
          pairs: [
            {
              simple: "Det är inte bra för sömnen att ha sociala medier.",
              developed: "För det första",
              label: "För det första: ordning",
              explain: "Tre lösa meningar blir tre argument i tur och ordning. ”För det första” säger till läsaren att fler skäl kommer.",
            },
            {
              simple: "Det är synd om barn som jämför sig med andra.",
              developed: "För det andra",
              label: "För det andra: nästa argument",
              explain: "Nu vet läsaren att det här är ett nytt argument, inte en fortsättning på det förra.",
            },
            {
              simple: "Företagen tjänar pengar på barnens tid.",
              developed: "Dessutom",
              label: "Dessutom: tillägg",
              explain: "”Dessutom” lägger till ännu ett skäl. Lägg märke till att ordföljden ändras: ”tjänar företagen”.",
            },
          ],
        },
      ],

      highlights: {
        strong: [
          { quote: "Ändå", ask: "Vilket ord i inledningen visar en kontrast, alltså en motsats?", label: "Kontrast", explain: "”Ändå” ställer två saker mot varandra: vi vet att sociala medier slukar tid, men skärmarna lyser i barnrummen i alla fall.", related: { label: "Fler ord för kontrast", words: ["däremot", "dock", "trots att", "å andra sidan", "medan"] } },
          { quote: "för dagens tandlösa regler", ask: "Vilka ord i inledningen visar en orsak?", label: "Orsak", explain: "Det lilla ordet ”för” visar varför åldersgränsen ska höjas. Efter ordet kommer skälet.", related: { label: "Fler ord för orsak", words: ["eftersom", "därför att", "på grund av"] } },
          { quote: "För det första", ask: "Vilka ord visar att det första argumentet börjar?", label: "Struktur: ordning", explain: "Orden visar ordningen. Läsaren förstår att fler argument kommer.", related: { label: "Fler ord för struktur och exempel", words: ["för det andra", "exempelvis", "framför allt", "sammanfattningsvis"] } },
          { quote: "vilket i sin tur", ask: "Vilka ord visar en följd, alltså vad något leder till?", label: "Konsekvens", explain: "Orden visar vad något leder till: det är svårt att lägga ifrån sig mobilen, och följden blir mindre sömn, rörelse och umgänge.", related: { label: "Fler ord för konsekvens", words: ["därför", "följaktligen", "vilket innebär att"] } },
          { quote: "Utöver den förlorade tiden", ask: "Vilka ord knyter an till förra stycket och lägger till något nytt?", label: "Tillägg", explain: "Orden pekar tillbaka på förra stycket och lägger till något nytt. Så hänger styckena ihop.", related: { label: "Fler ord för tillägg", words: ["dessutom", "även", "också", "ytterligare"] } },
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
          simple: "Jag tycker att det är viktigt att barn är mindre på sociala medier. Jag tycker att det är dåligt för sömnen och jag tycker också att det är dåligt för självkänslan.",
          developed: "Jag anser att det är angeläget att barn minskar sin skärmtid. Den är skadlig för sömnen och dessutom negativ för ungas självkänsla.",
          simpleLabel: "Samma ord flera gånger",
          developedLabel: "Varierat ordval",
          simpleTag: "Före",
          developedTag: "Efter",
          pairs: [
            {
              simple: "viktigt",
              developed: "angeläget",
              label: "Ett mer precist ord",
              explain: "”Viktigt” har blivit ”angeläget”. Betydelsen är nästan densamma, men ordet passar bättre i en argumenterande text.",
            },
            {
              simple: "är mindre på sociala medier",
              developed: "minskar sin skärmtid",
              label: "Ett exaktare uttryck",
              explain: "Skribenten säger samma sak med ett mer exakt uttryck. Det låter mer genomtänkt.",
            },
            {
              simple: "dåligt för självkänslan",
              developed: "negativ för ungas självkänsla",
              label: "Inte samma ord två gånger",
              explain: "Före står ”dåligt” två gånger. Efter har skribenten valt två olika ord: ”skadlig” och ”negativ”.",
            },
          ],
        },
        {
          title: "Variera meningsstarterna",
          intro: "Här är fyra meningar två gånger. Läs båda och titta på hur varje mening börjar.",
          simple: "Jag tycker att det är viktigt att åldersgränsen höjs.\nJag tycker att apparna stjäl ungas sömn.\nJag tycker också att företagen tar för lite ansvar.\nJag tycker därför att gränsen borde vara 15 år.",
          developed: "Det är viktigt att åldersgränsen för sociala medier höjs.\nEnligt min uppfattning stjäl apparna ungas sömn.\nDessutom tar företagen alldeles för lite ansvar.\nDärför anser jag att gränsen borde vara 15 år.",
          simpleLabel: "Samma meningsstart",
          developedLabel: "Varierade meningsstarter",
          simpleTag: "Före",
          developedTag: "Efter",
          pairs: [
            {
              simple: "Jag tycker att apparna stjäl ungas sömn.",
              developed: "Enligt min uppfattning",
              label: "Samma åsikt, ny början",
              explain: "Det är fortfarande skribentens åsikt, men meningen börjar inte med ”jag tycker”.",
            },
            {
              simple: "Jag tycker också att företagen tar för lite ansvar.",
              developed: "Dessutom",
              label: "Börja med ett sambandsord",
              explain: "Ett sambandsord först ger variation och visar samtidigt att det här är ett tillägg.",
            },
            {
              simple: "Jag tycker därför att gränsen borde vara 15 år.",
              developed: "Därför anser jag",
              label: "Flytta fram det viktiga",
              explain: "”Därför” har flyttats först i meningen. Då ser läsaren direkt att det här är slutsatsen.",
            },
          ],
        },
        {
          title: "Blanda korta och långa meningar",
          intro: "Här är samma innehåll två gånger. Läs båda högt för dig själv. Hur låter rytmen?",
          simple: "Jag gillar inte sociala medier. De är dåliga. De stjäl tid. Barn sover sämre. Det är inte rätt. Vi borde höja åldersgränsen. Det skulle hjälpa mycket.",
          developed: "Jag anser att åldersgränsen för sociala medier borde höjas eftersom apparna påverkar både ungas sömn och deras självbild negativt. Många barn ligger vakna med mobilen. Det måste förändras. Genom att höja gränsen kan vi ge unga en lugnare vardag och mer tid för det som får dem att må bra.",
          simpleLabel: "Bara korta meningar",
          developedLabel: "Korta och långa meningar",
          simpleTag: "Före",
          developedTag: "Efter",
          pairs: [
            {
              simple: "Jag gillar inte sociala medier. De är dåliga. De stjäl tid.",
              developed: "Jag anser att åldersgränsen för sociala medier borde höjas eftersom apparna påverkar både ungas sömn och deras självbild negativt.",
              label: "Flera korta blir en lång",
              explain: "Tre korta meningar har bundits ihop till en lång med ”eftersom”. Då syns hur tankarna hänger ihop.",
            },
            {
              simple: "Barn sover sämre. Det är inte rätt.",
              developed: "Många barn ligger vakna med mobilen. Det måste förändras.",
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
          { quote: "Att lämna barn ensamma på plattformar byggda för vuxna är inte bara naivt; det är ansvarslöst.", ask: "Var följs en längre sats av en kort och bestämd?", label: "Kort mening efter en lång", explain: "En lång sats följs av en kort och bestämd. Växlingen ger texten rytm." },
          { quote: "När vi låter en tioåring skapa ett konto", ask: "Vilken mening börjar med en bisats?", label: "Meningen börjar med en bisats", explain: "Meningen börjar med en bisats, inte med ”vi”. Det ger variation." },
          { quote: "Det handlar inte om bristande självdisciplin, utan om ett barns kamp", ask: "Var ställs två saker mot varandra: inte det ena, utan det andra?", label: "Två led ställs mot varandra", explain: "Två led ställs mot varandra: inte det ena, utan det andra. Det gör tanken tydlig." },
          { quote: "Genom att höja gränsen och kräva verklig kontroll", ask: "Vilken mening börjar med hur vi kan göra något?", label: "Meningen börjar med hur något görs", explain: "Meningen börjar med hur vi kan göra, i stället för med vem som gör det." },
          { quote: "medvetet utformade", ask: "Var har skribenten valt ett precist uttryck i det första argumentet?", label: "Precist ordval", explain: "I stället för ”gjorda” står ett exaktare uttryck. Det är samma grepp som i exemplet nyss." },
        ],
        basic: [
          { quote: "Jag tycker att det är jättedåligt. Jag tycker att åldersgränsen ska höjas till 15 år.", label: "Två korta meningar med samma uppbyggnad" },
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
          { text: "måste skydda yngre barn", label: "Inget fel", explain: "Här finns inget fel." },
          { text: "för dom", label: "Talspråk", explain: "”Dom” är talspråk. I skrift heter det ”de” eller ”dem”." },
          { text: "sa att en ålders gräns", label: "Särskrivning", explain: "”Åldersgräns” är ett sammansatt ord och skrivs ihop." },
          { text: "räddar våran", label: "Talspråk", explain: "”Våran” är talspråk. I skrift heter det ”vår”." },
          { text: "sömmn.", label: "Stavfel", explain: "”Sömn” stavas med ett m." },
          { text: "eftersom apparna stjäl tid.", label: "Ofullständig mening", explain: "En bisats som börjar med ”eftersom” kan inte stå ensam. Den behöver sitta ihop med en huvudsats." },
          { text: "och dessutom så", label: "Flera bindeord i rad", explain: "Tre bindeord efter varandra. Det räcker med ”Dessutom”." },
          { text: "mår man bättre.", label: "Inget fel", explain: "Här finns inget fel." },
        ],
        questions: [
          { prompt: "Klicka på ordet som ska börja med stor bokstav allra först i texten.", targets: [0] },
          { prompt: "Klicka på de två ställen där eleven skriver som man pratar.", targets: [2, 4] },
          { prompt: "Klicka på stället där ett sammansatt ord har skrivits isär.", targets: [3] },
          { prompt: "Klicka på stavfelet.", targets: [5] },
          { prompt: "Klicka på meningen som inte är fullständig.", targets: [6] },
        ],
        corrected: "Vi måste skydda yngre barn, eftersom apparna stjäl tid. Dessutom kan en åldersgräns som verkligen kontrolleras rädda vår sömn och göra att man mår bättre.",
        areas: [
          { name: "Skrivregler och normer", fix: "Använd stor bokstav vid ny mening och kontrollera skiljetecknen." },
          { name: "Grammatik och struktur", fix: "Knyt ihop bisatser med huvudsatser och skriv sammansatta ord i ett ord." },
          { name: "Språklig variation och stavning", fix: "Skilj på talspråk och skriftspråk och kontrollera stavningen." },
        ],
      },
      highlights: {
        strong: [
          { quote: "naivt; det är ansvarslöst", ask: "Var binder ett semikolon ihop två påståenden?", label: "Semikolon binder ihop två påståenden som hör ihop", explain: "Semikolon binder ihop två påståenden som hör nära ihop, utan att en ny mening börjar." },
          { quote: "sömn, rörelse och umgänge", ask: "Var står ett komma mellan orden i en uppräkning i det första argumentet?", label: "Komma i uppräkning", explain: "Komma mellan orden i en uppräkning, och ”och” före det sista." },
          { quote: "hänsynslöst", ask: "Klicka på ett ord som passar en formell text bättre än ”taskigt”.", label: "Ordval som passar en argumenterande text", explain: "Ett precist ord som passar en argumenterande text." },
          { quote: "tandlösa regler", ask: "Vilka ord betyder ”bestämmelser som inte har någon verkan”?", label: "Precist ordval", explain: "Regler som är ”tandlösa” biter inte, alltså har de ingen verkan. Ordvalet är exakt och ger en bild." },
        ],
        basic: [
          { quote: "jättedåligt", label: "Vardagligt ordval" },
          { quote: "faktiskt!", label: "Talspråklig ton och utropstecken" },
        ],
      },
    },
  },
};
