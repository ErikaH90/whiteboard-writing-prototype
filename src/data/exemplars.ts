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
};

export type ExemplarFocus = {
  /** How the whiteboard introduces the walk-through of the exemplar. */
  boardNote: string;
  /**
   * The check after the walk-through: the student answers by clicking one of the lesson's
   * highlighted parts in the utmärkt text. `target` is the index of the right part.
   */
  check: { prompt: string; target: number };
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
    check: { prompt: "Klicka på tesen i texten till höger.", target: 1 },
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
    boardNote: "Vi går igenom hur skribenten förklarar sina argument, en del i taget. Följ det som lyser gult till höger.",
    check: { prompt: "Klicka på meningen där skribenten visar vad vårt val leder till.", target: 1 },
    highlights: {
      strong: [
        { quote: "Att föda upp djur för slakt kräver enorma mängder mark, vatten och foder, vilket i sin tur genererar orimligt höga koldioxidutsläpp.", label: "Förklaring: varför kött belastar miljön", explain: "Skribenten nöjer sig inte med att säga att kött är dåligt för miljön. Här förklaras varför." },
        { quote: "När vi väljer biffen bidrar vi direkt till en accelererad klimatförsämring.", label: "Följd: vad valet leder till", explain: "Nu visas följden av vårt val. Läsaren får se vad som händer om vi väljer biffen." },
        { quote: "Argumentet att människan alltid har ätit kött håller inte i ett samhälle med fullgod tillgång till näring från växtriket.", label: "Skribenten prövar en invändning och förklarar varför den inte håller", explain: "Skribenten tar upp ett vanligt försvar för kött och förklarar varför det inte håller i dag." },
        { quote: "en väl sammansatt vegetarisk kost både täcker näringsbehovet och minskar risken för välfärdssjukdomar", label: "Motargumentet bemöts med ett skäl", explain: "Motargumentet får ett svar med ett skäl: vegetarisk kost räcker, och den är dessutom bra för hälsan." },
      ],
      basic: [
        { quote: "Det kostar många onödiga koldioxidutsläpp att föda upp ett djur till slakt.", label: "Kort förklaring – jämför med den utmärkta texten" },
        { quote: "jag blir arg när jag tänker på hur människor behandlar djur", label: "En känsla, inte en förklaring" },
        { quote: "Dessutom innehåller grönsaker många viktiga vitaminer som kött saknar.", label: "Motargumentet bemöts med ett skäl" },
      ],
    },
  },
  cohesion: {
    boardNote: "Vi går igenom orden som binder ihop texten, ett i taget. Följ det som lyser gult till höger.",
    check: { prompt: "Klicka på orden som binder ihop orsak och följd.", target: 2 },
    highlights: {
      strong: [
        { quote: "ändå", label: "Motsats", explain: "”Ändå” visar en motsats: vi vet att grönt är bra, men butikerna är fulla av kött." },
        { quote: "För det första", label: "Ordning: första argumentet", explain: "Orden visar ordningen. Läsaren förstår att fler argument kommer." },
        { quote: "vilket i sin tur", label: "Orsak och följd", explain: "Orden binder ihop orsak och följd: uppfödningen kräver resurser, och det leder till utsläpp." },
        { quote: "Utöver miljöaspekten", label: "Tillägg: knyter an till förra stycket", explain: "Orden pekar tillbaka på förra stycket och lägger till något nytt. Så hänger styckena ihop." },
        { quote: "men detta bemöts", label: "Motsats: svaret på motargumentet", explain: "”Men” vänder från motargumentet till skribentens svar." },
        { quote: "Sammanfattningsvis", label: "Sammanfattning", explain: "Ordet säger till läsaren att nu knyts allt ihop." },
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
    boardNote: "Vi går igenom hur meningarna varierar, en del i taget. Följ det som lyser gult till höger.",
    check: { prompt: "Klicka på stället där en mening börjar med en bisats.", target: 1 },
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
    boardNote: "Vi går igenom skiljetecken och ordval, en del i taget. Följ det som lyser gult till höger.",
    check: { prompt: "Klicka på stället där ett semikolon binder ihop två påståenden.", target: 0 },
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
