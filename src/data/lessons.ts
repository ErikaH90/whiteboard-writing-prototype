export type Phase =
  | "Modellering"
  | "Träna själv"
  | "Återkalla utan stöd"
  | "Självkontroll"
  | "Slutbedömning";

export type SkillId = "structure" | "reasoning" | "cohesion" | "sentence" | "language";
export type LearningEvidence = "independent" | "supported" | "needs_support";

export type EntryCheck = {
  skillIds: SkillId[];
  previousTopic: string;
  bridge: string;
  question: string;
  focus: string;
  supportQuestion: string;
  extensionQuestion: string;
};

export type CheckIn =
  | {
      mode: "choice";
      question: string;
      options: { label: string; correct: boolean }[];
    }
  | {
      mode: "text";
      question: string;
    };

export type ExitTicketStep = {
  learningProcess: string;
  title: string;
  question: string;
  placeholder: string;
  focus: string;
};

export type Lesson = {
  title: string;
  shortTitle: string;
  skillIds: SkillId[];
  entryCheck: EntryCheck;
  foundationSupport: string;
  foundationExample: string;
  /**
   * What the student has shown they can do after each check: choosing the better example,
   * the practice check, recall without support and the self-check.
   */
  canDo: [string, string, string, string];
  /** Opens the lesson: a short line that catches the student's attention. */
  hook: string;
  /** What the student will be able to do after the lesson, in the student's own language. */
  learnerGoal: string;
  /** The curriculum wording the lesson relates to. Shown as a reference, never invented. */
  goal: string;
  model: {
    strong: string;
    needsWork: string;
    /**
     * A better and a weaker example of the part the student is about to write, taken from the
     * two exemplar texts (about eating less meat, not the topic of the student's own text).
     * Edda shows both before the writing task and the student clicks the better one.
     */
    question: string;
  };
  /** The chapter's writing task in the student's own text. */
  practice: string;
  /**
   * What Edda says after the writing task to tie the student's writing to what they showed
   * earlier in the chapter. Empty when the chapter gives no such support.
   */
  taskLink: string;
  hint: string;
  recall: string;
  checklist: string[];
  criteria: string[];
  checkInFocus: string;
  checkIns: [CheckIn, CheckIn, CheckIn, CheckIn];
  exitTicket: ExitTicketStep[] | null;
};

export type FinalRecallQuestion = {
  skillId: SkillId;
  title: string;
  question: string;
  placeholder: string;
};

export const phases: Phase[] = [
  "Modellering",
  "Träna själv",
  "Återkalla utan stöd",
  "Självkontroll",
  "Slutbedömning",
];

const writingCriterion = "Eleven skriver olika slags texter med fungerande struktur och god anpassning till texttyp, syfte och mottagare.";
const languageCriterion = "Eleven följer språkliga normer på ett i huvudsak fungerande sätt.";

export const finalRecallQuestions: FinalRecallQuestion[] = [
  {
    skillId: "structure",
    title: "Struktur",
    question: "Vilka delar hjälper läsaren att förstå din ståndpunkt och följa textens uppbyggnad?",
    placeholder: "Återkalla textens delar och vad de gör...",
  },
  {
    skillId: "reasoning",
    title: "Resonemang",
    question: "Vad kan du förklara efter ett argument för att visa hur det stödjer din tes?",
    placeholder: "Beskriv hur du kan utveckla ett argument...",
  },
  {
    skillId: "cohesion",
    title: "Textbindning",
    question: "Hur hjälper ett sambandsord läsaren att förstå relationen mellan två tankar?",
    placeholder: "Beskriv en relation och hur du kan visa den...",
  },
  {
    skillId: "sentence",
    title: "Meningsbyggnad",
    question: "Nämn två sätt att variera meningar utan att göra sambandet mellan idéerna otydligt.",
    placeholder: "Återkalla två sätt att variera meningar...",
  },
  {
    skillId: "language",
    title: "Språklig korrekthet",
    question: "Vilka språkliga saker kan du kontrollera för att göra texten lättare att följa?",
    placeholder: "Beskriv vad du skulle kontrollera...",
  },
];

export const lessons: Lesson[] = [
  {
    title: "Bygg upp en argumenterande text",
    shortTitle: "Struktur",
    skillIds: ["structure"],
    entryCheck: {
      skillIds: ["structure"],
      previousTopic: "Dina förkunskaper",
      bridge: "Du börjar med att samla det du redan vet om argumenterande texter.",
      question: "Vad är en argumenterande text?",
      focus: "förkunskaper om argumenterande texter och deras struktur",
      // The very first question is the same simple one for every student.
      supportQuestion: "Vad är en argumenterande text?",
      extensionQuestion: "Vad är en argumenterande text?",
    },
    foundationSupport: "En argumenterande text visar en ståndpunkt och ger skäl som hjälper läsaren att förstå den.",
    foundationExample: "Skoldagen borde börja senare. Då kan fler elever hinna vakna ordentligt.",
    canDo: ["Hitta tesen i en argumenterande text", "Skriva en inledning med tes", "Förklara vad en tes är med egna ord", "Veta vad du letar efter när du granskar strukturen"],
    hook: "Kan en text få dig att ändra åsikt? Det beror mycket på hur den är uppbyggd.",
    learnerGoal: "När du är klar kan du peka ut tes, argument, motargument och avslutning i en argumenterande text, och bygga upp din egen text på samma sätt.",
    goal: writingCriterion,
    model: {
      strong: "Det är hög tid att vi ifrågasätter vår köttnorm, för konsekvenserna av vår kosthållning drabbar både planeten och dess invånare.",
      needsWork: "Jag tycker att det är helt fel.",
      question: "Här är två sätt att skriva en tes. Klicka på den som är bäst.",
    },
    practice: "Börja med att skriva din inledning med tes.",
    taskLink: "Du hittade tesen i exempeltexten. Samma blick kan du använda på din egen inledning.",
    hint: "En tes tar tydlig ställning. Börja gärna med ”Jag anser att …” eller ”Enligt mig borde …”.",
    recall: "Nu utan exempeltexten. Tänk på inledningen du just skrev.",
    checklist: ["Min text har en rubrik som visar ämnet.", "Min inledning presenterar frågan för läsaren.", "Min tes visar tydligt vad jag tycker."],
    criteria: ["Textens struktur och innehåll", "Anpassning till texttyp, syfte och mottagare"],
    checkInFocus: "hur en tes visar skribentens ståndpunkt",
    checkIns: [
      { mode: "choice", question: "Vilken formulering visar en tydlig tes?", options: [{ label: "Skoldagen borde börja senare.", correct: true }, { label: "Många elever går hem efter skolan.", correct: false }] },
      { mode: "choice", question: "Vad behöver läsaren förstå i din inledning?", options: [{ label: "Vilken ståndpunkt jag driver.", correct: true }, { label: "Hur många stycken texten ska ha.", correct: false }] },
      { mode: "text", question: "Vad är tesen i en argumenterande text? Svara med egna ord." },
      { mode: "choice", question: "Vad letar du efter när du granskar din inledning?", options: [{ label: "En tes som visar vad jag tycker.", correct: true }, { label: "Samma antal meningar i varje stycke.", correct: false }] },
    ],
    exitTicket: [
      {
        learningProcess: "Återkallning · Retrieval practice",
        title: "Textens övergripande delar",
        question: "Vilka grundläggande delar behöver finnas med för att bygga upp en argumenterande text? Förklara kort vad de fyller för funktion.",
        placeholder: "Beskriv textens delar och deras funktion...",
        focus: "textens delar och deras funktion",
      },
      {
        learningProcess: "Metakognition och självbedömning",
        title: "Bedöm din inledning",
        question: "Vad i din inledning är du mest nöjd med, och vad var svårast att få till?",
        placeholder: "Reflektera över din inledning och din tes...",
        focus: "elevens egen bedömning av inledningen och tesen",
      },
    ],
  },
  {
    title: "Utveckla innehåll och resonemang",
    shortTitle: "Resonemang",
    skillIds: ["reasoning"],
    entryCheck: {
      skillIds: ["structure"],
      previousTopic: "Struktur",
      bridge: "En tydlig tes visar ståndpunkten. Nu bygger du resonemang som hjälper läsaren att förstå skälen.",
      question: "Vad hjälper tesen läsaren att förstå i en argumenterande text?",
      focus: "återkallning av tesens funktion och textens struktur",
      supportQuestion: "Vad kallas meningen som visar skribentens ståndpunkt?",
      extensionQuestion: "Hur kan en inledning förbereda läsaren på både tesen och textens fortsatta argument?",
    },
    foundationSupport: "Ett argument blir tydligare när du förklarar hur skälet hänger ihop med din tes.",
    foundationExample: "En senare start kan göra elever piggare. Då kan det bli lättare att fokusera.",
    canDo: ["Känna igen sakargument, motargument och bemötande", "Skriva argument i din egen text", "Förklara vad som gör ett resonemang utvecklat", "Ställa rätt fråga när du granskar ett resonemang"],
    hook: "”Det är bättre för att det är bättre.” Blir du övertygad?",
    learnerGoal: "När du är klar kan du utveckla ett argument genom att förklara varför det stämmer och vad det leder till.",
    goal: writingCriterion,
    model: {
      strong: "För det första står köttindustrin för en massiv belastning på miljön. Att föda upp djur för slakt kräver enorma mängder mark, vatten och foder, vilket i sin tur genererar orimligt höga koldioxidutsläpp.",
      needsWork: "För det första är det inte bra för miljön att äta kött. Det kostar många onödiga koldioxidutsläpp att föda upp ett djur till slakt.",
      question: "Här är två sätt att skriva ett argument. Klicka på det som är bäst.",
    },
    practice: "Skriv nu dina första argument i texten.",
    taskLink: "Du kände igen ett sakargument i exempeltexten. Nu vet du vad dina egna argument kan byggas ut med.",
    hint: "Pröva frågorna: Vad kan hända? Vem påverkas? Hur stödjer det min tes?",
    recall: "Vad kan du lägga till efter ett argument för att utveckla resonemanget?",
    checklist: ["Jag förklarar mina argument, inte bara räknar upp dem.", "Jag visar hur argumenten stödjer min tes.", "Jag visar vad argumentet leder till."],
    criteria: ["Textens innehåll", "Argumentens underbyggnad"],
    checkInFocus: "hur ett skäl hänger ihop med tesen",
    checkIns: [
      { mode: "choice", question: "Vilken mening utvecklar ett argument?", options: [{ label: "När elever får mer sömn kan det bli lättare att fokusera.", correct: true }, { label: "En senare start är bra.", correct: false }] },
      { mode: "choice", question: "Vad kan du lägga till efter ett skäl?", options: [{ label: "En förklaring till hur det stödjer tesen.", correct: true }, { label: "Samma skäl en gång till.", correct: false }] },
      { mode: "text", question: "Förklara med egna ord vad som gör ett resonemang mer utvecklat." },
      { mode: "choice", question: "Vilken fråga hjälper dig granska ett resonemang?", options: [{ label: "Varför spelar det här skälet roll?", correct: true }, { label: "Hur många meningar skrev jag?", correct: false }] },
    ],
    exitTicket: [
      {
        learningProcess: "Återkallning · Retrieval practice",
        title: "Påstå eller förklara",
        question: "Vad är skillnaden mellan att bara påstå något och att förklara det? Ge ett kort exempel.",
        placeholder: "Förklara skillnaden och ge ett exempel...",
        focus: "skillnaden mellan ett påstående och ett förklarat argument",
      },
      {
        learningProcess: "Metakognition och självbedömning",
        title: "Utvärdera dina egna resonemang",
        question: "Är det något resonemang i din text som du är särskilt nöjd med, och vad tyckte du var svårast att utveckla?",
        placeholder: "Reflektera över dina resonemang och vad som var svårast...",
        focus: "elevens egen bedömning av resonemangens styrkor och svårigheter",
      },
    ],
  },
  {
    title: "Skapa tydlig textbindning",
    shortTitle: "Textbindning",
    skillIds: ["cohesion"],
    entryCheck: {
      skillIds: ["structure", "reasoning"],
      previousTopic: "Struktur och resonemang",
      bridge: "Argument blir tydligare när de kopplas till tesen. Nu visar du hur tankarna hänger ihop.",
      question: "Hur kan du visa att ett skäl hör ihop med din tes, i stället för att bara rada upp påståenden?",
      focus: "återkallning av sambandet mellan tes och utvecklade skäl",
      supportQuestion: "Vad gör en tes tydlig för läsaren?",
      extensionQuestion: "Hur kan du utveckla ett sakargument så att läsaren ser hur det stödjer tesen?",
    },
    foundationSupport: "Ett utvecklat resonemang förklarar hur ett skäl stödjer tesen; textbindning hjälper läsaren att följa kopplingen.",
    foundationExample: "Många elever är trötta på morgonen. Därför kan en senare start hjälpa.",
    canDo: ["Känna igen sambandsord för kontrast, konsekvens och avslutning", "Bemöta ett motargument och använda sambandsord", "Nämna olika samband som sambandsord kan visa", "Granska om ett sambandsord säger det du menar"],
    hook: "”Därför” eller ”däremot”? Ett enda ord kan vända hela meningen.",
    learnerGoal: "När du är klar kan du välja sambandsord som visar hur dina tankar hänger ihop.",
    goal: writingCriterion,
    model: {
      strong: "Visst hävdas det ofta att kött är en oumbärlig källa till protein och järn, men detta bemöts enkelt av att en väl sammansatt vegetarisk kost både täcker näringsbehovet och minskar risken för välfärdssjukdomar.",
      needsWork: "Några hävdar nog att vi behöver äta kött för att få i oss bra näringsämnen. Men det finns många bra näringsämnen i grönsaker också, faktiskt!",
      question: "Här är två sätt att bemöta ett motargument. Klicka på det som är bäst.",
    },
    practice: "Om du inte har hunnit skriva ett motargument, skriv det nu och lägg till sambandsord.",
    taskLink: "Du hittade sambandsorden i exempeltexten. Använd samma sorts ord när du binder ihop dina egna tankar.",
    hint: "Vill du visa orsak, följd, tillägg eller motsats? Välj sambandsord efter tanken.",
    recall: "Nämn två olika samband som sambandsord kan hjälpa dig att visa.",
    checklist: ["Mina sambandsord visar det samband jag menar.", "Jag har tagit upp ett motargument och svarat på det.", "Det är tydligt hur mina meningar hänger ihop."],
    criteria: ["Textens struktur", "Språklig variation och sammanhang"],
    checkInFocus: "hur sambandsord visar relationen mellan idéer",
    checkIns: [
      { mode: "choice", question: "Vilket ord visar följden av att elever är trötta?", options: [{ label: "Därför kan en senare start hjälpa.", correct: true }, { label: "Däremot kan en senare start hjälpa.", correct: false }] },
      { mode: "choice", question: "Vad ska ett sambandsord hjälpa läsaren med?", options: [{ label: "Se hur två tankar hänger ihop.", correct: true }, { label: "Göra texten längre utan att ändra innehållet.", correct: false }] },
      { mode: "text", question: "Nämn med egna ord två samband som sambandsord kan visa." },
      { mode: "choice", question: "Vad kontrollerar du när du granskar sambandsord?", options: [{ label: "Att ordet visar det samband jag menar.", correct: true }, { label: "Att varje mening börjar med ett sambandsord.", correct: false }] },
    ],
    exitTicket: [
      {
        learningProcess: "Återkallning · Retrieval practice",
        title: "Vad är sambandsord och textbindning?",
        question: "Förklara med egna ord vad ett sambandsord är och ge två korta exempel på ord som visar på ordning respektive motsats.",
        placeholder: "Förklara vad sambandsord är och ge två exempel...",
        focus: "vad sambandsord är och hur ord kan visa ordning respektive motsats",
      },
      {
        learningProcess: "Metakognition och självbedömning",
        title: "Utvärdera din egen textbindning",
        question: "Vilka sambandsord använde du mest i din text, och vad tycker du var svårast när du skulle variera din textbindning?",
        placeholder: "Reflektera över din användning av sambandsord och vad som var svårt...",
        focus: "elevens egen användning av och svårigheter med sambandsord",
      },
    ],
  },
  {
    title: "Variera meningsbyggnaden",
    shortTitle: "Meningsbyggnad",
    skillIds: ["sentence"],
    entryCheck: {
      skillIds: ["reasoning", "cohesion"],
      previousTopic: "Resonemang och textbindning",
      bridge: "Sambandsord synliggör relationer mellan idéer. Nu varierar du meningarna som bär resonemanget.",
      question: "Hur kan ett sambandsord hjälpa läsaren att se varför ett argument stödjer din ståndpunkt?",
      focus: "återkallning av sambandet mellan argument, tes och textbindning",
      supportQuestion: "Nämn ett samband som ett sambandsord kan visa, till exempel orsak eller motsats.",
      extensionQuestion: "Hur kan ett sambandsord och en förklaring tillsammans visa relationen mellan argument och tes?",
    },
    foundationSupport: "Välj först vilken relation du vill visa, till exempel orsak eller motsats. Välj sedan meningsbyggnad och sambandsord som gör relationen tydlig.",
    foundationExample: "En senare start kan göra skillnad. Fler elever kanske orkar delta.",
    canDo: ["Se när en mening börjar med en bisats", "Skriva en avslutning och granska meningsbyggnaden", "Beskriva ett sätt att variera meningsbyggnaden", "Granska om upprepade starter gör texten enformig"],
    hook: "Jag tycker. Jag tycker. Jag tycker. Hur länge orkar du läsa?",
    learnerGoal: "När du är klar kan du variera dina ord, hur dina meningar börjar och hur långa de är, utan att texten blir svår att följa.",
    goal: languageCriterion,
    model: {
      strong: "Sammanfattningsvis är köttnormen ett systemfel som vi måste börja montera ned. Det är dags att sluta äta av vana och i stället välja medvetet.",
      needsWork: "För att sammanfatta gör vi inte bara en god gärning för miljön och djurens liv när vi slutar äta kött. Vi får också ett hälsosammare matintag som förbättrar vår hälsa avsevärt.",
      question: "Här är två avslutningar. Klicka på den som är bäst.",
    },
    practice: "Skriv nu din avslutning på texten, och glöm inte att kontrollera meningsbyggnaden i hela textens meningar.",
    taskLink: "Du såg hur meningarna varierade i exemplen. Pröva samma grepp i en av dina egna meningar.",
    hint: "Du kan börja med en tid, en orsak eller det viktigaste ordet – inte bara med ”jag tycker”.",
    recall: "Vad kan du ändra för att minska enformiga meningsstarter?",
    checklist: ["Min avslutning knyter tillbaka till tesen.", "Jag varierar meningsstarter där det passar.", "Meningslängden hjälper läsaren att följa resonemanget."],
    criteria: ["Språklig variation", "Fungerande meningsbyggnad"],
    checkInFocus: "hur meningsbyggnad kan varieras utan att tappa tydlighet",
    checkIns: [
      { mode: "choice", question: "Vad kan göra meningsbyggnaden mer varierad?", options: [{ label: "Variera meningsstarter där det passar.", correct: true }, { label: "Börja varje mening med samma fras.", correct: false }] },
      { mode: "choice", question: "Vad kan du prova när flera meningar börjar likadant?", options: [{ label: "En annan meningsstart.", correct: true }, { label: "Ta bort alla skiljetecken.", correct: false }] },
      { mode: "text", question: "Beskriv med egna ord ett sätt att variera meningsbyggnaden." },
      { mode: "choice", question: "Vad granskar du i din text?", options: [{ label: "Om upprepade starter gör texten enformig.", correct: true }, { label: "Om alla meningar har samma längd.", correct: false }] },
    ],
    exitTicket: [
      {
        learningProcess: "Återkallning · Retrieval practice",
        title: "Vad innebär språklig variation och meningsbyggnad?",
        question: "Förklara med egna ord två konkreta sätt att skapa variation i dina meningar, till exempel hur du börjar meningarna eller varierar meningslängd.",
        placeholder: "Beskriv två sätt att variera dina meningar...",
        focus: "två sätt att variera meningsstarter eller meningslängd",
      },
      {
        learningProcess: "Metakognition och självbedömning",
        title: "Utvärdera din egen meningsbyggnad",
        question: "Vilken förändring i dina meningar är du mest nöjd med i din text, och vad tyckte du var klurigast att variera?",
        placeholder: "Reflektera över din egen meningsbyggnad och vad som var klurigast...",
        focus: "elevens egen bedömning av meningsbyggnadens styrkor och svårigheter",
      },
    ],
  },
  {
    title: "Utveckla variation och språklig korrekthet",
    shortTitle: "Språk",
    skillIds: ["language"],
    entryCheck: {
      skillIds: ["cohesion", "sentence"],
      previousTopic: "Textbindning och meningsbyggnad",
      bridge: "Textbindning och meningsbyggnad hjälper läsaren att följa tanken. Nu granskar du språkets tydlighet.",
      question: "Hur kan du variera en mening och ändå hjälpa läsaren att följa sambandet mellan idéerna?",
      focus: "återkallning av textbindning och varierad meningsbyggnad",
      supportQuestion: "Nämn ett sätt att ändra hur en mening börjar.",
      extensionQuestion: "Hur kan du kombinera en varierad meningsstart och ett sambandsord utan att förlora tydlighet?",
    },
    foundationSupport: "En variation hjälper bara om meningen fortfarande är tydlig. Kontrollera att läsaren kan följa sambandet mellan idéerna.",
    foundationExample: "En senare skolstart kan ge elever bättre möjlighet att möta dagen utvilade.",
    canDo: ["Hitta språkfel i en text", "Granska stavning och skiljetecken i din text", "Förklara hur språkliga normer hjälper läsaren", "Använda ett korrektursteg som fungerar"],
    hook: "En punkt eller ett ord på fel plats kan få läsaren att tappa tråden.",
    learnerGoal: "När du är klar kan du granska stavning, skiljetecken och ordval så att din text blir lätt att följa.",
    goal: languageCriterion,
    model: {
      strong: "En vegetarisk kost kan ge oss all den näring vi behöver för att må bra.",
      needsWork: "en vegetarisk kost kan ge oss all den näringen vi behöver må bra",
      question: "Här är samma mening två gånger. Klicka på den som följer skrivreglerna.",
    },
    practice: "Läs igenom hela texten och kontrollera att du har följt skrivreglerna, som stavning och skiljetecken.",
    taskLink: "Du hittade språkfelen i texten på tavlan. Läs din egen text med samma ögon.",
    hint: "Kontrollera stor bokstav, meningsgränser och att orden passar ihop. Ändra bara det du själv kan motivera.",
    recall: "Vilka två saker kan du kontrollera när du korrekturläser en mening?",
    checklist: ["Ett ställe där jag har kontrollerat stavningen.", "Ett ställe där jag har kontrollerat stor bokstav och skiljetecken.", "Ett ord som jag har valt för att det passar texten."],
    criteria: ["Språkliga normer", "Anpassning och språklig variation"],
    checkInFocus: "hur språkliga normer hjälper läsaren",
    checkIns: [
      { mode: "choice", question: "Vad gör den andra meningen lättare att läsa?", options: [{ label: "Stor bokstav och tydliga meningsgränser.", correct: true }, { label: "Fler utropstecken.", correct: false }] },
      { mode: "choice", question: "Vad kan du kontrollera när du läser igenom din mening?", options: [{ label: "Stavning och skiljetecken.", correct: true }, { label: "Att varje ord byts mot en synonym.", correct: false }] },
      { mode: "text", question: "Beskriv med egna ord hur skiljetecken och ordval kan hjälpa läsaren." },
      { mode: "choice", question: "Vilket är ett användbart korrektursteg?", options: [{ label: "Kontrollera stor bokstav och meningsgräns.", correct: true }, { label: "Ändra ord även när betydelsen blir otydlig.", correct: false }] },
    ],
    exitTicket: [
      {
        learningProcess: "Återkallning · Retrieval practice",
        title: "Formell ton",
        question: "Förklara med egna ord hur ett formellt språk påverkar hur din text uppfattas av läsaren.",
        placeholder: "Beskriv hur skiljetecken och formell ton påverkar texten...",
        focus: "hur formellt språk påverkar läsarens uppfattning av texten",
      },
      {
        learningProcess: "Metakognition och självbedömning",
        title: "Utvärdera ditt eget språk",
        question: "Vad i ditt språk, till exempel kommatecken, ordval eller grammatik, behöver du granska extra noga under bearbetningen?",
        placeholder: "Reflektera över din språkliga utveckling och vad som kräver granskning...",
        focus: "elevens egen bedömning av vilka språkliga drag som behöver granskas",
      },
    ],
  },
  {
    title: "Slutdiagnos: bearbeta och granska texten",
    shortTitle: "Slutdiagnos",
    skillIds: ["structure", "reasoning", "cohesion", "sentence", "language"],
    entryCheck: {
      skillIds: ["sentence", "language"],
      previousTopic: "Meningsbyggnad och språk",
      bridge: "Du har arbetat med meningsbyggnad och språk. Nu prövar du strategierna i en ny skrivsituation.",
      question: "Vilka två saker kan du kontrollera när du vill göra en mening både tydlig och språkligt korrekt?",
      focus: "återkallning av meningsbyggnad och språkliga normer",
      supportQuestion: "Vad kan du kontrollera först för att se var en mening börjar och slutar?",
      extensionQuestion: "Hur kan du granska språklig tydlighet utan att ändra en formulering som redan fungerar?",
    },
    foundationSupport: "Läs meningen högt och kontrollera sedan meningsgräns, ord som passar ihop och om meningen uttrycker det du menar.",
    foundationExample: "En tydlig mening hjälper läsaren att förstå en tanke.",
    canDo: ["Välja ett arbetssätt som hjälper dig att bearbeta", "Skriva klart din egen text", "Beskriva ett eget granskningssteg", "Sätta ett bra mål för självkontrollen"],
    hook: "Nu får du visa vad du har lärt dig, i en helt ny text.",
    learnerGoal: "När du är klar har du skrivit och granskat en egen argumenterande text med det du har övat på.",
    goal: `${writingCriterion}\n${languageCriterion}`,
    model: {
      strong: "Börja med att läsa texten som en läsare. Välj sedan ett utvecklingsområde och gör en egen ändring som du kan förklara.",
      needsWork: "Försök ändra allt på en gång utan att veta vad du vill förbättra.",
      question: "Klicka på det arbetssätt som hjälper dig mest när du bearbetar din text.",
    },
    practice: "Skriv klart din argumenterande text och välj själv vad du vill bearbeta först.",
    taskLink: "",
    hint: "Stöd är avsiktligt begränsat här. Använd dina egna granskningsfrågor från tidigare moment.",
    recall: "Vilket granskningssteg brukar hjälpa dig mest? Beskriv det med egna ord.",
    checklist: ["Ett ställe där jag har ändrat innehåll eller struktur.", "Ett ställe där jag har bearbetat språket.", "En ändring som jag kan förklara varför jag gjorde."],
    criteria: ["Struktur, innehåll och språklig variation", "Anpassning till syfte, mottagare och sammanhang", "Språkliga normer"],
    checkInFocus: "hur du självständigt granskar och förbättrar din text",
    checkIns: [
      { mode: "choice", question: "Vad gör du först när du ska bearbeta en text?", options: [{ label: "Väljer ett utvecklingsområde och läser med det i åtanke.", correct: true }, { label: "Ändrar allt på en gång utan att läsa.", correct: false }] },
      { mode: "choice", question: "Hur kan du arbeta självständigt med en text?", options: [{ label: "Välja ett område och göra en egen ändring.", correct: true }, { label: "Be någon annan skriva om hela texten.", correct: false }] },
      { mode: "text", question: "Beskriv med egna ord ett steg du själv kan använda för att granska en text." },
      { mode: "choice", question: "Vad är ett bra mål med självkontrollen?", options: [{ label: "Hitta en ändring jag själv kan motivera.", correct: true }, { label: "Ändra så mycket som möjligt.", correct: false }] },
    ],
    exitTicket: null,
  },
];
