import type { ExemplarSet } from "../exemplars";
import texts from "./school.json";

/** The exemplar texts about daily movement on the school timetable, with everything Edda shows in them. */
export const school: ExemplarSet = {
  id: "school",
  interest: "community",
  texts,
  models: [
    {
      strong: "Det är hög tid att skolan schemalägger rörelse varje dag, för stillasittandet påverkar både elevernas hälsa och deras lärande.",
      needsWork: "Jag tycker att det är jättedåligt.",
    },
    {
      strong: "För det första hänger rörelse och inlärning nära samman. Fysisk aktivitet ökar blodflödet till hjärnan och förbättrar koncentrationen, minnet och humöret, vilket i sin tur gör det lättare att ta till sig undervisningen.",
      needsWork: "För det första blir man piggare av att röra på sig. Då är det lättare att orka med lektionerna.",
    },
    {
      strong: "Visst hävdas det ofta att schemat redan är fullt och att daglig rörelse inkräktar på kärnämnena, men detta bemöts enkelt av att elever som har rört på sig arbetar mer fokuserat och därmed hinner mer under samma lektion.",
      needsWork: "Några säger nog att vi inte hinner med mer rörelse på schemat. Men man lär sig mycket på idrotten också, faktiskt!",
    },
    {
      strong: "Sammanfattningsvis är den stillasittande skoldagen en vana som vi måste bryta. Det är dags att sluta se rörelse som ett avbrott och i stället behandla den som en förutsättning.",
      needsWork: "För att sammanfatta blir vi både piggare och friskare om vi rör på oss varje dag i skolan. Det blir också mer rättvist för alla elever.",
    },
    {
      strong: "Daglig rörelse kan ge oss all den energi vi behöver för att orka med skoldagen.",
      needsWork: "daglig rörelse kan ge oss all den energin vi behöver orka med skoldagen",
    },
  ],
  focus: {
    structure: {
      boardNote: "Vi går igenom hur exempeltexten är uppbyggd, en del i taget. Följ det som lyser gult i texten.",
      boardKeys: ["Textens delar", "Det gula i texten"],
      highlights: {
        strong: [
          { quote: "Stillasittandets pris – dags att schemalägga rörelsen", ask: "Klicka på rubriken.", label: "Rubrik som visar ämnet och ståndpunkten", explain: "Rubriken säger både vad texten handlar om och vad skribenten tycker: rörelsen ska in på schemat." },
          { quote: "Det är hög tid att skolan schemalägger rörelse varje dag", ask: "Var står tesen, alltså det skribenten vill övertyga dig om?", label: "Tes: skribentens ståndpunkt", explain: "Här står tesen. Efter den här meningen vet läsaren precis vad skribenten vill." },
          { quote: "För det första hänger rörelse och inlärning nära samman.", ask: "Var börjar det första argumentet?", label: "Första argumentet", explain: "”För det första” visar att nu kommer det första argumentet. Hela stycket handlar om en sak: lärandet." },
          { quote: "Utöver inlärningen väcker bristen på rörelse en fråga om rättvisa.", ask: "Var börjar det andra argumentet?", label: "Andra argumentet", explain: "Nytt stycke, nytt argument. Nu handlar det om rättvisa." },
          { quote: "Visst hävdas det ofta att schemat redan är fullt och att daglig rörelse inkräktar på kärnämnena", ask: "Var tar skribenten upp vad andra tycker, alltså ett motargument?", label: "Motargument som skribenten bemöter", explain: "Skribenten tar upp vad andra brukar säga och svarar sedan på det. Då blir texten mer övertygande." },
          { quote: "Sammanfattningsvis är den stillasittande skoldagen en vana som vi måste bryta.", ask: "Var börjar avslutningen?", label: "Avslutning som knyter tillbaka till tesen", explain: "”Sammanfattningsvis” visar att texten avslutas. Skribenten knyter ihop argumenten och går tillbaka till tesen." },
        ],
        basic: [
          { quote: "Vi borde röra på oss varje dag i skolan!", label: "Rubrik som visar ståndpunkten" },
          { quote: "Jag tycker att det är jättedåligt.", label: "Tes: skribentens ståndpunkt" },
          { quote: "För det första blir man piggare av att röra på sig.", label: "Första argumentet" },
          { quote: "För det andra är det orättvist mot dem som inte tränar på fritiden.", label: "Andra argumentet" },
          { quote: "Några säger nog att vi inte hinner med mer rörelse på schemat.", label: "Motargument som skribenten bemöter" },
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
              simple: "Ändå sitter vi still nästan hela dagarna i skolan.",
              developed: "Ändå sitter eleverna lektion efter lektion vid sina bänkar, medan rörelsen alltför ofta trängs undan till enstaka idrottslektioner.",
              label: "Konkret i stället för allmänt",
              explain: "Det enkla exemplet säger bara att vi sitter still. Det utvecklade visar det med en bild: eleverna vid sina bänkar, lektion efter lektion.",
            },
            {
              simple: "Jag tycker att det är jättedåligt.",
              developed: "Att bortse från stillasittandets följder är inte bara bekvämt; det är oansvarigt.",
              label: "Precisa ord i stället för ”jag tycker”",
              explain: "”Jättedåligt” säger vad skribenten tycker. ”Bekvämt” och ”oansvarigt” säger också varför det är ett problem.",
            },
            {
              simple: "Det finns många anledningar till att jag tycker det.",
              developed: "Det är hög tid att skolan schemalägger rörelse varje dag, för stillasittandet påverkar både elevernas hälsa och deras lärande.",
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
          { quote: "För det första hänger rörelse och inlärning nära samman.", ask: "Klicka på meningen där skribenten ger sitt första skäl.", label: "Argument", explain: "Ett argument är ett skäl som stödjer tesen. Här är skälet att rörelse hjälper lärandet." },
          { quote: "Fysisk aktivitet ökar blodflödet till hjärnan och förbättrar koncentrationen, minnet och humöret, vilket i sin tur gör det lättare att ta till sig undervisningen.", ask: "Var stöder skribenten sitt skäl med fakta?", label: "Sakargument", explain: "Ett sakargument bygger på fakta som går att kontrollera, inte bara på vad skribenten tycker. Det gör argumentet utvecklat." },
          { quote: "När vi blir sittande hela förmiddagen avtar uppmärksamheten långt före lunch.", ask: "Var visar skribenten vad stillasittandet leder till?", label: "Följd: vad det leder till", explain: "Skribenten visar vad stillasittandet leder till. Läsaren får se varför argumentet spelar roll." },
          { quote: "Att lämna de barn som aldrig rör sig på fritiden åt sitt öde, år efter år, är försumligt.", ask: "Vilken mening vill väcka känslor hos läsaren?", label: "Pathos: argument som väcker känslor", explain: "Här vill skribenten att läsaren ska känna något. Det kallas pathos. Sakargumentet nyss talade till förnuftet; det kallas logos." },
          { quote: "Visst hävdas det ofta att schemat redan är fullt och att daglig rörelse inkräktar på kärnämnena", ask: "Var tar skribenten upp vad andra brukar säga?", label: "Motargument", explain: "Skribenten tar upp vad andra brukar säga. Det visar att hen har tänkt igenom frågan." },
          { quote: "elever som har rört på sig arbetar mer fokuserat och därmed hinner mer under samma lektion", ask: "Var svarar skribenten på motargumentet?", label: "Bemötande: svar på motargumentet", explain: "Motargumentet får ett svar med ett skäl. Då står skribentens tes kvar, starkare än förut." },
          { quote: "hälsa, koncentration och studieresultat", ask: "Var räknar skribenten upp tre saker i rad?", label: "Triad: tre saker i rad", explain: "Tre saker i rad ger rytm och gör att läsaren minns dem. Det kallas en triad." },
        ],
        basic: [
          { quote: "Då är det lättare att orka med lektionerna.", label: "Kort förklaring – jämför med den utmärkta texten" },
          { quote: "jag blir ledsen när jag tänker på dem som aldrig får röra på sig", label: "En känsla, inte en förklaring" },
          { quote: "Dessutom jobbar man snabbare när man har rört på sig.", label: "Motargumentet bemöts med ett skäl" },
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
          simple: "Man blir piggare av att röra på sig.\nDet är orättvist mot dem som inte tränar på fritiden.\nMan jobbar snabbare när man har rört på sig.",
          developed: "För det första blir man piggare av att röra på sig.\nFör det andra är det orättvist mot dem som inte tränar på fritiden.\nDessutom jobbar man snabbare när man har rört på sig.",
          simpleLabel: "Utan sambandsord",
          developedLabel: "Med sambandsord",
          simpleTag: "Före",
          developedTag: "Efter",
          pairs: [
            {
              simple: "Man blir piggare av att röra på sig.",
              developed: "För det första",
              label: "För det första: ordning",
              explain: "Tre lösa meningar blir tre argument i tur och ordning. ”För det första” säger till läsaren att fler skäl kommer.",
            },
            {
              simple: "Det är orättvist mot dem som inte tränar på fritiden.",
              developed: "För det andra",
              label: "För det andra: nästa argument",
              explain: "Nu vet läsaren att det här är ett nytt argument, inte en fortsättning på det förra.",
            },
            {
              simple: "Man jobbar snabbare när man har rört på sig.",
              developed: "Dessutom",
              label: "Dessutom: tillägg",
              explain: "”Dessutom” lägger till ännu ett skäl. Lägg märke till att ordföljden ändras: ”jobbar man”.",
            },
          ],
        },
      ],

      highlights: {
        strong: [
          { quote: "Ändå", ask: "Vilket ord i inledningen visar en kontrast, alltså en motsats?", label: "Kontrast", explain: "”Ändå” ställer två saker mot varandra: vi vet att rörelse är bra, men eleverna sitter still lektion efter lektion.", related: { label: "Fler ord för kontrast", words: ["däremot", "dock", "trots att", "å andra sidan", "medan"] } },
          { quote: "för stillasittandet påverkar", ask: "Vilka ord i inledningen visar en orsak?", label: "Orsak", explain: "Det lilla ordet ”för” visar varför skolan ska schemalägga rörelse. Efter ordet kommer skälet.", related: { label: "Fler ord för orsak", words: ["eftersom", "därför att", "på grund av"] } },
          { quote: "För det första", ask: "Vilka ord visar att det första argumentet börjar?", label: "Struktur: ordning", explain: "Orden visar ordningen. Läsaren förstår att fler argument kommer.", related: { label: "Fler ord för struktur och exempel", words: ["för det andra", "exempelvis", "framför allt", "sammanfattningsvis"] } },
          { quote: "vilket i sin tur", ask: "Vilka ord visar en följd, alltså vad något leder till?", label: "Konsekvens", explain: "Orden visar vad något leder till: rörelsen förbättrar koncentrationen, och följden blir att det är lättare att lära sig.", related: { label: "Fler ord för konsekvens", words: ["därför", "följaktligen", "vilket innebär att"] } },
          { quote: "Utöver inlärningen", ask: "Vilka ord knyter an till förra stycket och lägger till något nytt?", label: "Tillägg", explain: "Orden pekar tillbaka på förra stycket och lägger till något nytt. Så hänger styckena ihop.", related: { label: "Fler ord för tillägg", words: ["dessutom", "även", "också", "ytterligare"] } },
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
          simple: "Jag tycker att det är viktigt att elever rör på sig mer. Jag tycker att det är bra för kroppen och jag tycker också att det är bra för skolarbetet.",
          developed: "Jag anser att det är betydelsefullt att elever ökar sin fysiska aktivitet. Det är nyttigt för kroppen och dessutom gynnsamt för skolarbetet.",
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
              simple: "rör på sig mer",
              developed: "ökar sin fysiska aktivitet",
              label: "Ett exaktare uttryck",
              explain: "Skribenten säger samma sak med ett mer exakt uttryck. Det låter mer genomtänkt.",
            },
            {
              simple: "bra för skolarbetet",
              developed: "gynnsamt för skolarbetet",
              label: "Inte samma ord två gånger",
              explain: "Före står ”bra” två gånger. Efter har skribenten valt två olika ord: ”nyttigt” och ”gynnsamt”.",
            },
          ],
        },
        {
          title: "Variera meningsstarterna",
          intro: "Här är fyra meningar två gånger. Läs båda och titta på hur varje mening börjar.",
          simple: "Jag tycker att det är viktigt att elever rör på sig varje dag.\nJag tycker att stillasittandet gör oss trötta.\nJag tycker också att många elever rör sig för lite.\nJag tycker därför att skolan borde ha rörelse på schemat.",
          developed: "Det är viktigt att elever rör på sig varje dag.\nEnligt min uppfattning gör stillasittandet oss trötta.\nDessutom rör sig många elever alldeles för lite.\nDärför anser jag att skolan borde lägga in rörelse på schemat.",
          simpleLabel: "Samma meningsstart",
          developedLabel: "Varierade meningsstarter",
          simpleTag: "Före",
          developedTag: "Efter",
          pairs: [
            {
              simple: "Jag tycker att stillasittandet gör oss trötta.",
              developed: "Enligt min uppfattning",
              label: "Samma åsikt, ny början",
              explain: "Det är fortfarande skribentens åsikt, men meningen börjar inte med ”jag tycker”.",
            },
            {
              simple: "Jag tycker också att många elever rör sig för lite.",
              developed: "Dessutom",
              label: "Börja med ett sambandsord",
              explain: "Ett sambandsord först ger variation och visar samtidigt att det här är ett tillägg.",
            },
            {
              simple: "Jag tycker därför att skolan borde ha rörelse på schemat.",
              developed: "Därför anser jag",
              label: "Flytta fram det viktiga",
              explain: "”Därför” har flyttats först i meningen. Då ser läsaren direkt att det här är slutsatsen.",
            },
          ],
        },
        {
          title: "Blanda korta och långa meningar",
          intro: "Här är samma innehåll två gånger. Läs båda högt för dig själv. Hur låter rytmen?",
          simple: "Jag gillar inte att sitta still. Det är tråkigt. Man blir trött. Kroppen mår dåligt. Det är inte bra. Vi borde röra på oss mer. Det skulle hjälpa mycket.",
          developed: "Jag anser att skolan borde ge oss mer rörelse eftersom stillasittandet påverkar både orken och hälsan negativt. Många elever sitter nästan hela dagen. Det måste förändras. Genom att röra på oss varje dag kan vi få en skoldag där både kroppen och huvudet orkar mer.",
          simpleLabel: "Bara korta meningar",
          developedLabel: "Korta och långa meningar",
          simpleTag: "Före",
          developedTag: "Efter",
          pairs: [
            {
              simple: "Jag gillar inte att sitta still. Det är tråkigt. Man blir trött.",
              developed: "Jag anser att skolan borde ge oss mer rörelse eftersom stillasittandet påverkar både orken och hälsan negativt.",
              label: "Flera korta blir en lång",
              explain: "Tre korta meningar har bundits ihop till en lång med ”eftersom”. Då syns hur tankarna hänger ihop.",
            },
            {
              simple: "Kroppen mår dåligt. Det är inte bra.",
              developed: "Många elever sitter nästan hela dagen. Det måste förändras.",
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
          { quote: "Att bortse från stillasittandets följder är inte bara bekvämt; det är oansvarigt.", ask: "Var följs en längre sats av en kort och bestämd?", label: "Kort mening efter en lång", explain: "En längre sats följs av en kort och bestämd. Växlingen ger texten rytm." },
          { quote: "När vi blir sittande hela förmiddagen", ask: "Vilken mening börjar med en bisats?", label: "Meningen börjar med en bisats", explain: "Meningen börjar med en bisats, inte med ”vi”. Det ger variation." },
          { quote: "Det handlar inte om att ta tid från lärandet, utan om att ge det bättre villkor", ask: "Var ställs två saker mot varandra: inte det ena, utan det andra?", label: "Två led ställs mot varandra", explain: "Två led ställs mot varandra: inte det ena, utan det andra. Det gör tanken tydlig." },
          { quote: "Genom att lägga in rörelse på schemat varje dag", ask: "Vilken mening börjar med hur skolan kan göra något?", label: "Meningen börjar med hur något görs", explain: "Meningen börjar med hur skolan kan göra, i stället för med vem som gör det." },
          { quote: "avtar uppmärksamheten", ask: "Var har skribenten valt ett precist uttryck?", label: "Precist ordval", explain: "I stället för ”orkar man inte lyssna” står ett exaktare uttryck. Det är samma grepp som i exemplet nyss." },
        ],
        basic: [
          { quote: "Jag tycker att det är jättedåligt. Det finns många anledningar till att jag tycker det.", label: "Två korta meningar med samma uppbyggnad" },
          { quote: "För det första blir man", label: "Styckena börjar på samma sätt" },
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
          { text: "måste röra på oss mera", label: "Inget fel", explain: "Här finns inget fel, även om ”mera” gärna kan bli ”mer”." },
          { text: "för dom", label: "Talspråk", explain: "”Dom” är talspråk. I skrift heter det ”de” eller ”dem”." },
          { text: "sa att stilla sittande", label: "Särskrivning", explain: "”Stillasittande” är ett sammansatt ord och skrivs ihop." },
          { text: "förstör våran", label: "Talspråk", explain: "”Våran” är talspråk. I skrift heter det ”vår”." },
          { text: "hälssa.", label: "Stavfel", explain: "”Hälsa” stavas med ett s." },
          { text: "eftersom kroppen behöver rörelse.", label: "Ofullständig mening", explain: "En bisats som börjar med ”eftersom” kan inte stå ensam. Den behöver sitta ihop med en huvudsats." },
          { text: "och dessutom så", label: "Flera bindeord i rad", explain: "Tre bindeord efter varandra. Det räcker med ”Dessutom”." },
          { text: "blir man piggare.", label: "Inget fel", explain: "Här finns inget fel." },
        ],
        questions: [
          { prompt: "Klicka på ordet som ska börja med stor bokstav allra först i texten.", targets: [0] },
          { prompt: "Klicka på de två ställen där eleven skriver som man pratar.", targets: [2, 4] },
          { prompt: "Klicka på stället där ett sammansatt ord har skrivits isär.", targets: [3] },
          { prompt: "Klicka på stavfelet.", targets: [5] },
          { prompt: "Klicka på meningen som inte är fullständig.", targets: [6] },
        ],
        corrected: "Vi måste röra på oss mer, eftersom kroppen behöver rörelse. Dessutom blir man piggare av att röra på sig, och vi slipper det stillasittande som skadar vår hälsa.",
        areas: [
          { name: "Skrivregler och normer", fix: "Använd stor bokstav vid ny mening och kontrollera skiljetecknen." },
          { name: "Grammatik och struktur", fix: "Knyt ihop bisatser med huvudsatser och skriv sammansatta ord i ett ord." },
          { name: "Språklig variation och stavning", fix: "Skilj på talspråk och skriftspråk och kontrollera stavningen." },
        ],
      },
      highlights: {
        strong: [
          { quote: "bekvämt; det är oansvarigt", ask: "Var binder ett semikolon ihop två påståenden?", label: "Semikolon binder ihop två påståenden som hör ihop", explain: "Semikolon binder ihop två påståenden som hör nära ihop, utan att en ny mening börjar." },
          { quote: "koncentrationen, minnet och humöret", ask: "Var står ett komma mellan orden i en uppräkning?", label: "Komma i uppräkning", explain: "Komma mellan orden i en uppräkning, och ”och” före det sista." },
          { quote: "försumligt", ask: "Klicka på ett ord som passar en formell text bättre än ”slarvigt”.", label: "Ordval som passar en argumenterande text", explain: "”Försumligt” betyder att någon inte tar sitt ansvar. Det är ett precist ord som passar en argumenterande text." },
          { quote: "inkräktar på", ask: "Vilka ord betyder ”tar plats från något annat”?", label: "Precist ordval", explain: "Att något ”inkräktar på” något annat betyder att det tar plats eller tid från det. Ordvalet är exakt." },
        ],
        basic: [
          { quote: "jättedåligt", label: "Vardagligt ordval" },
          { quote: "faktiskt!", label: "Talspråklig ton och utropstecken" },
        ],
      },
    },
  },
};
