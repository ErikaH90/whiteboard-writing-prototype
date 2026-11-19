import texts from "./exemplarTexts.json";
import type { SkillId } from "./lessons";

export type ExemplarId = "strong" | "basic";

export type ExemplarText = {
  title: string;
  paragraphs: string[];
};

export type ExemplarHighlight = {
  /** Exact wording from the exemplar. Must occur exactly once in the text. */
  quote: string;
  label: string;
  /** The teacher's think-aloud on the whiteboard when this part is in focus (utmärkt text). */
  explain?: string;
  /** Other words of the same kind, shown under the explanation (for example more linking words). */
  related?: { label: string; words: string[] };
};

/** Two short examples about the same thing, compared part by part before the walk-through. */
export type ExemplarComparison = {
  /** Heading and text on the whiteboard when both examples are first shown. */
  title: string;
  intro: string;
  simple: string;
  developed: string;
  /** Headings above the two examples on the writing surface, and short tags for the whiteboard. */
  simpleLabel: string;
  developedLabel: string;
  simpleTag: string;
  developedTag: string;
  /** Matching parts of the two examples, with what makes the developed one developed. */
  pairs: { simple: string; developed: string; label: string; explain: string }[];
};

/**
 * A short invented text with language errors, shown on the whiteboard. The student finds the
 * errors by clicking them, one question at a time, and then sees a corrected version.
 */
export type ErrorHunt = {
  intro: string;
  /** The text in clickable parts, in order; joined with spaces they form the whole text. */
  segments: { text: string; label: string; explain: string }[];
  /** Each question asks for one kind of error; `targets` are indexes into `segments`. */
  questions: { prompt: string; targets: number[] }[];
  corrected: string;
  /** The kinds of errors and how they are fixed, shown with the corrected version. */
  areas: { name: string; fix: string }[];
};

export type ExemplarFocus = {
  /** How the whiteboard introduces the walk-through of the exemplar. */
  boardNote: string;
  /**
   * The checks after the walk-through: the student answers each one by clicking the right part or
   * parts among the lesson's highlighted parts in the utmärkt text. `targets` are indexes into
   * the lesson's highlights; with several targets the student has to find them all.
   */
  checks: { prompt: string; targets: number[] }[];
  /** Comparisons shown before the walk-through, in order. */
  comparisons?: ExemplarComparison[];
  /** An error hunt on the whiteboard, after the walk-through. */
  hunt?: ErrorHunt;
  highlights: Record<ExemplarId, ExemplarHighlight[]>;
};

export const exemplarTexts: Record<ExemplarId, ExemplarText> = texts;

export const exemplarLabels: Record<ExemplarId, string> = {
  strong: "Utmärkt text",
  basic: "Okej text",
};

export const exemplarFocus: Record<SkillId, ExemplarFocus> = {
  structure: {
    boardNote: "Vi går igenom hur exempeltexten är uppbyggd, en del i taget. Följ det som lyser gult till höger.",
    checks: [
      { prompt: "Klicka på tesen.", targets: [1] },
      { prompt: "Klicka på argumenten. Det finns två.", targets: [2, 3] },
      { prompt: "Klicka på motargumentet.", targets: [4] },
      { prompt: "Klicka på avslutningen.", targets: [5] },
    ],
    highlights: {
      strong: [
        { quote: "Tallrikens tysta offer – dags att duka av köttet", label: "Rubrik som visar ämnet och ståndpunkten", explain: "Rubriken säger både vad texten handlar om och vad skribenten tycker: köttet ska bort från tallriken." },
        { quote: "Det är hög tid att vi ifrågasätter vår köttnorm", label: "Tes: skribentens ståndpunkt", explain: "Här står tesen. Efter den här meningen vet läsaren precis vad skribenten vill." },
        { quote: "För det första står köttindustrin för en massiv belastning på miljön.", label: "Första argumentet", explain: "”För det första” visar att nu kommer det första argumentet. Hela stycket handlar om en sak: miljön." },
        { quote: "Utöver miljöaspekten väcker den industriella djurhållningen en djupt etisk fråga.", label: "Andra argumentet", explain: "Nytt stycke, nytt argument. Nu handlar det om djuren." },
        { quote: "Visst hävdas det ofta att kött är en oumbärlig källa till protein och järn", label: "Motargument som skribenten bemöter", explain: "Skribenten tar upp vad andra brukar säga och svarar sedan på det. Då blir texten mer övertygande." },
        { quote: "Sammanfattningsvis är köttnormen ett systemfel som vi måste börja montera ned.", label: "Avslutning som knyter tillbaka till tesen", explain: "”Sammanfattningsvis” visar att texten avslutas. Skribenten knyter ihop argumenten och går tillbaka till tesen." },
      ],
      basic: [
        { quote: "Alla borde äta vegetarisk mat!", label: "Rubrik som visar ståndpunkten" },
        { quote: "Jag tycker att det är helt fel.", label: "Tes: skribentens ståndpunkt" },
        { quote: "För det första är det inte bra för miljön att äta kött.", label: "Första argumentet" },
        { quote: "För det andra är det synd om djuren som dödas.", label: "Andra argumentet" },
        { quote: "Några hävdar nog att vi behöver äta kött för att få i oss bra näringsämnen.", label: "Motargument som skribenten bemöter" },
        { quote: "För att sammanfatta", label: "Avslutningen börjar" },
      ],
    },
  },
  reasoning: {
    boardNote: "Vi tittar på vad som gör ett argument utvecklat. Först jämför vi två inledningar, sedan går vi igenom begreppen i texten. Följ det som lyser gult till höger.",
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
            simple: "Ändå äter många människor kött istället.",
            developed: "Ändå kryllar hyllorna i matbutikerna av köttprodukter medan det vegetariska alternativet alltför ofta reduceras till ett sidospår.",
            label: "Konkret i stället för allmänt",
            explain: "Det enkla exemplet säger bara att många äter kött. Det utvecklade visar det med en bild: hyllorna i butiken.",
          },
          {
            simple: "Jag tycker att det är helt fel.",
            developed: "Att blunda för köttets baksidor är inte bara kortsiktigt; det är ohållbart.",
            label: "Precisa ord i stället för ”jag tycker”",
            explain: "”Helt fel” säger vad skribenten tycker. ”Kortsiktigt” och ”ohållbart” säger också varför det är ett problem.",
          },
          {
            simple: "Det finns många anledningar till att jag tycker det.",
            developed: "Det är hög tid att vi ifrågasätter vår köttnorm, för konsekvenserna av vår kosthållning drabbar både planeten och dess invånare.",
            label: "Tes med ett skäl",
            explain: "Det enkla exemplet lovar anledningar men ger ingen. Det utvecklade ger ett skäl direkt, efter ordet ”för”.",
          },
        ],
      },
    ],
    checks: [
      { prompt: "Klicka på sakargumentet.", targets: [1] },
      { prompt: "Klicka på motargumentet.", targets: [4] },
      { prompt: "Klicka på bemötandet, alltså svaret på motargumentet.", targets: [5] },
    ],
    highlights: {
      strong: [
        { quote: "För det första står köttindustrin för en massiv belastning på miljön.", label: "Argument", explain: "Ett argument är ett skäl som stödjer tesen. Här är skälet miljön." },
        { quote: "Att föda upp djur för slakt kräver enorma mängder mark, vatten och foder, vilket i sin tur genererar orimligt höga koldioxidutsläpp.", label: "Sakargument", explain: "Ett sakargument bygger på fakta som går att kontrollera, inte bara på vad skribenten tycker. Det gör argumentet utvecklat." },
        { quote: "När vi väljer biffen bidrar vi direkt till en accelererad klimatförsämring.", label: "Följd: vad det leder till", explain: "Skribenten visar vad valet leder till. Läsaren får se varför argumentet spelar roll." },
        { quote: "Att betrakta levande, kännande varelser som blotta råvaror på ett löpande band är inhumant.", label: "Pathos: argument som väcker känslor", explain: "Här vill skribenten att läsaren ska känna något. Det kallas pathos. Sakargumentet nyss talade till förnuftet; det kallas logos." },
        { quote: "Visst hävdas det ofta att kött är en oumbärlig källa till protein och järn", label: "Motargument", explain: "Skribenten tar upp vad andra brukar säga. Det visar att hen har tänkt igenom frågan." },
        { quote: "en väl sammansatt vegetarisk kost både täcker näringsbehovet och minskar risken för välfärdssjukdomar", label: "Bemötande: svar på motargumentet", explain: "Motargumentet får ett svar med ett skäl. Då står skribentens tes kvar, starkare än förut." },
        { quote: "klimatet, djuren och vår egen hälsa", label: "Triad: tre saker i rad", explain: "Tre saker i rad ger rytm och gör att läsaren minns dem. Det kallas en triad." },
      ],
      basic: [
        { quote: "Det kostar många onödiga koldioxidutsläpp att föda upp ett djur till slakt.", label: "Kort förklaring – jämför med den utmärkta texten" },
        { quote: "jag blir arg när jag tänker på hur människor behandlar djur", label: "En känsla, inte en förklaring" },
        { quote: "Dessutom innehåller grönsaker många viktiga vitaminer som kött saknar.", label: "Motargumentet bemöts med ett skäl" },
      ],
    },
  },
  cohesion: {
    boardNote: "Vi tittar på hur sambandsord binder ihop en text. Först ser vi hur tre lösa meningar blir en sammanhängande text, sedan går vi igenom sambandsorden i exempeltexten. Följ det som lyser gult till höger.",
    comparisons: [
      {
        title: "Före och efter",
        intro: "Här är samma tre meningar två gånger. Läs båda. Vad är det som gör att den andra hänger ihop bättre?",
        simple: "Det är inte bra för miljön att äta kött.\nDet är synd om djuren som dödas.\nGrönsaker innehåller många viktiga vitaminer som kött saknar.",
        developed: "För det första är det inte bra för miljön att äta kött.\nFör det andra är det synd om djuren som dödas.\nDessutom innehåller grönsaker många viktiga vitaminer som kött saknar.",
        simpleLabel: "Utan sambandsord",
        developedLabel: "Med sambandsord",
        simpleTag: "Före",
        developedTag: "Efter",
        pairs: [
          {
            simple: "Det är inte bra för miljön att äta kött.",
            developed: "För det första",
            label: "För det första: ordning",
            explain: "Tre lösa meningar blir tre argument i tur och ordning. ”För det första” säger till läsaren att fler skäl kommer.",
          },
          {
            simple: "Det är synd om djuren som dödas.",
            developed: "För det andra",
            label: "För det andra: nästa argument",
            explain: "Nu vet läsaren att det här är ett nytt argument, inte en fortsättning på det förra.",
          },
          {
            simple: "Grönsaker innehåller många viktiga vitaminer som kött saknar.",
            developed: "Dessutom",
            label: "Dessutom: tillägg",
            explain: "”Dessutom” lägger till ännu ett skäl. Lägg märke till att ordföljden ändras: ”innehåller grönsaker”.",
          },
        ],
      },
    ],
    checks: [
      { prompt: "Klicka på de två ställen som visar kontrast, alltså en motsats.", targets: [0, 5] },
      { prompt: "Klicka på orden som visar en konsekvens.", targets: [3] },
      { prompt: "Klicka på ordet som visar att texten avslutas.", targets: [6] },
    ],
    highlights: {
      strong: [
        { quote: "Ändå", label: "Kontrast", explain: "”Ändå” ställer två saker mot varandra: vi vet att grönt är bra, men butikerna är fulla av kött.", related: { label: "Fler ord för kontrast", words: ["däremot", "dock", "trots att", "å andra sidan", "medan"] } },
        { quote: "för konsekvenserna av vår kosthållning", label: "Orsak", explain: "Det lilla ordet ”för” visar varför vi ska ifrågasätta köttnormen. Efter ordet kommer skälet.", related: { label: "Fler ord för orsak", words: ["eftersom", "därför att", "på grund av"] } },
        { quote: "För det första", label: "Struktur: ordning", explain: "Orden visar ordningen. Läsaren förstår att fler argument kommer.", related: { label: "Fler ord för struktur och exempel", words: ["för det andra", "exempelvis", "framför allt", "sammanfattningsvis"] } },
        { quote: "vilket i sin tur", label: "Konsekvens", explain: "Orden visar vad något leder till: uppfödningen kräver resurser, och följden blir utsläpp.", related: { label: "Fler ord för konsekvens", words: ["därför", "följaktligen", "vilket innebär att"] } },
        { quote: "Utöver miljöaspekten", label: "Tillägg", explain: "Orden pekar tillbaka på förra stycket och lägger till något nytt. Så hänger styckena ihop.", related: { label: "Fler ord för tillägg", words: ["dessutom", "även", "också", "ytterligare"] } },
        { quote: "men detta bemöts", label: "Kontrast: svaret på motargumentet", explain: "”Men” vänder från motargumentet till skribentens svar." },
        { quote: "Sammanfattningsvis", label: "Struktur: avslutning", explain: "Ordet säger till läsaren att nu knyts allt ihop." },
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
    comparisons: [
      {
        title: "Variera ordvalet",
        intro: "Här är samma tanke två gånger. Läs båda. Vilka ord har bytts ut?",
        simple: "Jag tycker att det är viktigt att människor slutar äta kött. Jag tycker att det är dåligt för miljön och jag tycker också att det är dåligt för djuren.",
        developed: "Jag anser att det är betydelsefullt att människor minskar sin köttkonsumtion. Det är skadligt för miljön och dessutom negativt för djurens välmående.",
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
            simple: "slutar äta kött",
            developed: "minskar sin köttkonsumtion",
            label: "Ett exaktare uttryck",
            explain: "Skribenten säger samma sak med ett mer exakt uttryck. Det låter mer genomtänkt.",
          },
          {
            simple: "dåligt för djuren",
            developed: "negativt för djurens välmående",
            label: "Inte samma ord två gånger",
            explain: "Före står ”dåligt” två gånger. Efter har skribenten valt två olika ord: ”skadligt” och ”negativt”.",
          },
        ],
      },
      {
        title: "Variera meningsstarterna",
        intro: "Här är fyra meningar två gånger. Läs båda och titta på hur varje mening börjar.",
        simple: "Jag tycker att det är viktigt att människor slutar äta kött.\nJag tycker att köttindustrin påverkar miljön negativt.\nJag tycker också att djuren behandlas orättvist.\nJag tycker därför att alla borde äta mer vegetariskt.",
        developed: "Det är viktigt att människor slutar äta så mycket kött.\nEnligt min uppfattning påverkar köttindustrin miljön negativt.\nDessutom behandlas många djur på ett orättvist sätt.\nDärför anser jag att fler borde välja vegetariska alternativ.",
        simpleLabel: "Samma meningsstart",
        developedLabel: "Varierade meningsstarter",
        simpleTag: "Före",
        developedTag: "Efter",
        pairs: [
          {
            simple: "Jag tycker att köttindustrin påverkar miljön negativt.",
            developed: "Enligt min uppfattning",
            label: "Samma åsikt, ny början",
            explain: "Det är fortfarande skribentens åsikt, men meningen börjar inte med ”jag tycker”.",
          },
          {
            simple: "Jag tycker också att djuren behandlas orättvist.",
            developed: "Dessutom",
            label: "Börja med ett sambandsord",
            explain: "Ett sambandsord först ger variation och visar samtidigt att det här är ett tillägg.",
          },
          {
            simple: "Jag tycker därför att alla borde äta mer vegetariskt.",
            developed: "Därför anser jag",
            label: "Flytta fram det viktiga",
            explain: "”Därför” har flyttats först i meningen. Då ser läsaren direkt att det här är slutsatsen.",
          },
        ],
      },
      {
        title: "Blanda korta och långa meningar",
        intro: "Här är samma innehåll två gånger. Läs båda högt för dig själv. Hur låter rytmen?",
        simple: "Jag gillar inte kött. Det är dåligt. Det skadar miljön. Djuren lider. Det är inte rätt. Vi borde sluta äta kött. Det skulle hjälpa mycket.",
        developed: "Jag anser att vi borde äta mindre kött eftersom köttproduktionen påverkar både miljön och djurens välmående negativt. Många djur lever under svåra förhållanden. Det måste förändras. Genom att välja mer vegetarisk mat kan vi bidra till en bättre framtid för både djuren och planeten.",
        simpleLabel: "Bara korta meningar",
        developedLabel: "Korta och långa meningar",
        simpleTag: "Före",
        developedTag: "Efter",
        pairs: [
          {
            simple: "Jag gillar inte kött. Det är dåligt. Det skadar miljön.",
            developed: "Jag anser att vi borde äta mindre kött eftersom köttproduktionen påverkar både miljön och djurens välmående negativt.",
            label: "Flera korta blir en lång",
            explain: "Tre korta meningar har bundits ihop till en lång med ”eftersom”. Då syns hur tankarna hänger ihop.",
          },
          {
            simple: "Djuren lider. Det är inte rätt.",
            developed: "Många djur lever under svåra förhållanden. Det måste förändras.",
            label: "Korta meningar efter en lång",
            explain: "Efter den långa meningen kommer två korta. De får läsaren att stanna upp, och det viktiga får tyngd.",
          },
        ],
      },
    ],
    checks: [
      { prompt: "Klicka på stället där en mening börjar med en bisats.", targets: [1] },
    ],
    highlights: {
      strong: [
        { quote: "Att blunda för köttets baksidor är inte bara kortsiktigt; det är ohållbart.", label: "Kort mening efter en lång", explain: "En lång mening följs av en kort och bestämd. Växlingen ger texten rytm." },
        { quote: "När vi väljer biffen", label: "Meningen börjar med en bisats", explain: "Meningen börjar med en bisats, inte med ”vi”. Det ger variation." },
        { quote: "Det handlar inte längre om en personlig preferens, utan om en överlevnadsfråga", label: "Två led ställs mot varandra", explain: "Två led ställs mot varandra: inte det ena, utan det andra. Det gör tanken tydlig." },
        { quote: "Genom att ställa om till en växtbaserad kost", label: "Meningen börjar med hur något görs", explain: "Meningen börjar med hur vi kan göra, i stället för med vem som gör det." },
      ],
      basic: [
        { quote: "Jag tycker att det är helt fel. Det finns många anledningar till att jag tycker det.", label: "Två korta meningar med samma uppbyggnad" },
        { quote: "För det första är det", label: "Styckena börjar på samma sätt" },
        { quote: "För det andra är det", label: "Styckena börjar på samma sätt" },
      ],
    },
  },
  language: {
    boardNote: "Först tittar vi på hur exempeltexten till höger använder skiljetecken och ordval. Sedan får du leta språkfel i en annan text, här på tavlan.",
    checks: [],
    hunt: {
      intro: "Här är en påhittad elevtext med flera språkfel. Kan du hitta dem?",
      segments: [
        { text: "vi", label: "Stor bokstav", explain: "En mening börjar med stor bokstav: ”Vi”." },
        { text: "måste äta mera grönt", label: "Inget fel", explain: "Här finns inget fel, även om ”mera” gärna kan bli ”mer”." },
        { text: "för dom", label: "Talspråk", explain: "”Dom” är talspråk. I skrift heter det ”de” eller ”dem”." },
        { text: "sa att kött industri", label: "Särskrivning", explain: "”Köttindustri” är ett sammansatt ord och skrivs ihop." },
        { text: "förstör våran", label: "Talspråk", explain: "”Våran” är talspråk. I skrift heter det ”vår”." },
        { text: "miljöö.", label: "Stavfel", explain: "”Miljö” stavas med ett ö." },
        { text: "eftersom köttet skadar klimatet.", label: "Ofullständig mening", explain: "En bisats som börjar med ”eftersom” kan inte stå ensam. Den behöver sitta ihop med en huvudsats." },
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
      corrected: "Vi måste äta mer grönt, eftersom köttet skadar klimatet. Dessutom visar forskning att en växtbaserad kost gör att vi blir piggare och att vi minskar utsläppen från köttindustrin avsevärt för vår gemensamma miljö.",
      areas: [
        { name: "Skrivregler och normer", fix: "Använd stor bokstav vid ny mening och kontrollera skiljetecknen." },
        { name: "Grammatik och struktur", fix: "Knyt ihop bisatser med huvudsatser och skriv sammansatta ord i ett ord." },
        { name: "Språklig variation och stavning", fix: "Skilj på talspråk och skriftspråk och kontrollera stavningen." },
      ],
    },
    highlights: {
      strong: [
        { quote: "kortsiktigt; det är ohållbart", label: "Semikolon binder ihop två påståenden som hör ihop", explain: "Semikolon binder ihop två påståenden som hör nära ihop, utan att en ny mening börjar." },
        { quote: "mark, vatten och foder", label: "Komma i uppräkning", explain: "Komma mellan orden i en uppräkning, och ”och” före det sista." },
        { quote: "inhumant", label: "Ordval som passar en argumenterande text", explain: "Ett precist ord som passar en argumenterande text." },
        { quote: "oumbärlig källa", label: "Precist ordval", explain: "”Oumbärlig” betyder att man inte klarar sig utan något. Ordvalet är exakt." },
      ],
      basic: [
        { quote: "helt fel", label: "Vardagligt ordval" },
        { quote: "faktiskt!", label: "Talspråklig ton och utropstecken" },
      ],
    },
  },
};

export type ExemplarSegment =
  | { kind: "text"; text: string }
  | { kind: "mark"; text: string; number: number; label: string; /** Index in the highlights passed in. */ index: number };

export type ExemplarBlock = {
  role: "title" | "paragraph";
  text: string;
  segments: ExemplarSegment[];
};

export type MarkedExemplar = {
  blocks: ExemplarBlock[];
  legend: { number: number; label: string }[];
};

/** Splits the exemplar into text and numbered marks, in reading order. */
export function markExemplar(text: ExemplarText, highlights: ExemplarHighlight[]): MarkedExemplar {
  const sources: { role: ExemplarBlock["role"]; text: string }[] = [
    { role: "title", text: text.title },
    ...text.paragraphs.map((paragraph) => ({ role: "paragraph" as const, text: paragraph })),
  ];
  const legend: MarkedExemplar["legend"] = [];
  let number = 0;

  const blocks = sources.map((source) => {
    const found = highlights
      .map((highlight, index) => ({ highlight, index, start: source.text.indexOf(highlight.quote) }))
      .filter((item) => item.start >= 0)
      .sort((a, b) => a.start - b.start);
    const segments: ExemplarSegment[] = [];
    let cursor = 0;

    for (const { highlight, index, start } of found) {
      if (start < cursor) continue;
      if (start > cursor) segments.push({ kind: "text", text: source.text.slice(cursor, start) });
      number += 1;
      segments.push({ kind: "mark", text: highlight.quote, number, label: highlight.label, index });
      legend.push({ number, label: highlight.label });
      cursor = start + highlight.quote.length;
    }
    if (cursor < source.text.length) segments.push({ kind: "text", text: source.text.slice(cursor) });

    return { ...source, segments };
  });

  return { blocks, legend };
}
