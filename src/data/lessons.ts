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
     * The two examples share the exemplar text's topic (eating less meat), not the topic of the
     * student's own writing task. The student answers by clicking one of them.
     */
    question: string;
  };
  practice: string;
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
    canDo: ["Hitta tesen i en argumenterande text", "Veta vad inledningen ska visa läsaren", "Förklara vad en tes är med egna ord", "Veta vad du letar efter när du granskar strukturen"],
    hook: "Kan en text få dig att ändra åsikt? Det beror mycket på hur den är uppbyggd.",
    learnerGoal: "När du är klar kan du peka ut tes, argument, motargument och avslutning i en argumenterande text, och bygga upp din egen text på samma sätt.",
    goal: writingCriterion,
    model: {
      strong: "Vi borde äta mindre kött. Köttproduktionen orsakar stora utsläpp, vilket skadar klimatet. Att välja vegetariskt oftare är därför ett enkelt sätt att göra skillnad.",
      needsWork: "Kött är inte så bra. Jag gillar inte tanken på det. Något borde ändras.",
      question: "Klicka på det exempel som tydligast visar vad skribenten vill övertyga läsaren om.",
    },
    practice: "Skriv en möjlig tes till frågan: Borde skoldagen börja senare?",
    hint: "En tes tar tydlig ställning. Börja gärna med ”Skoldagen borde …” eller ”Skoldagen borde inte …”.",
    recall: "Utan att titta på exemplen: vilka delar kan hjälpa läsaren att förstå en argumenterande text?",
    checklist: ["Min text visar tydligt vilken ståndpunkt jag har.", "Mina stycken hjälper läsaren att följa tankegången.", "Jag avslutar genom att knyta tillbaka till min ståndpunkt."],
    criteria: ["Textens struktur och innehåll", "Anpassning till texttyp, syfte och mottagare"],
    checkInFocus: "hur en tes visar skribentens ståndpunkt",
    checkIns: [
      { mode: "choice", question: "Vilken formulering visar en tydlig tes?", options: [{ label: "Skoldagen borde börja senare.", correct: true }, { label: "Många elever går hem efter skolan.", correct: false }] },
      { mode: "choice", question: "Vad behöver läsaren förstå i din inledning?", options: [{ label: "Vilken ståndpunkt jag driver.", correct: true }, { label: "Hur många stycken texten ska ha.", correct: false }] },
      { mode: "text", question: "Vad är tesen i en argumenterande text? Svara med egna ord." },
      { mode: "choice", question: "Vad letar du efter när du självkontrollerar strukturen?", options: [{ label: "En tydlig ståndpunkt som går att hitta.", correct: true }, { label: "Samma antal meningar i varje stycke.", correct: false }] },
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
        learningProcess: "Tillämpning · Interleaving",
        title: "Kännetecken och struktur",
        question: "Vad är det som skiljer en argumenterande text från andra texttyper, som berättande texter? Ge ett exempel på hur inledningen och tesen hänger ihop.",
        placeholder: "Beskriv skillnaden och hur inledningen hänger ihop med tesen...",
        focus: "skillnaden mellan argumenterande och berättande text samt inledningens koppling till tesen",
      },
      {
        learningProcess: "Självförklaring · Self-explanation",
        title: "Varför har texten en fast struktur?",
        question: "Varför tror du att det är viktigt att följa en struktur när man argumenterar för sin åsikt?",
        placeholder: "Förklara varför strukturen hjälper läsaren...",
        focus: "varför textstruktur hjälper läsaren",
      },
      {
        learningProcess: "Metakognition och självbedömning",
        title: "Bedöm din egen struktur",
        question: "Vilken del av textens övergripande struktur, till exempel inledning eller avslutning, tycker du att du fick till bäst, och vad upplevde du som svårast i det här kapitlet?",
        placeholder: "Reflektera över din struktur och vad som var svårast...",
        focus: "elevens egen bedömning av strukturens styrkor och svårigheter",
      },
      {
        learningProcess: "Framåtkoppling · Aktivering inför nästa kapitel",
        title: "Att utveckla och förbättra argumenten",
        question: "I nästa kapitel ska vi arbeta med att utveckla våra resonemang och göra argumenten starkare. Hur tror du att du kan bygga vidare på dina grundläggande argument därifrån?",
        placeholder: "Beskriv hur du vill utveckla dina argument i nästa kapitel...",
        focus: "hur grundläggande argument kan utvecklas i nästa kapitel",
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
    canDo: ["Hitta var skribenten visar vad något leder till", "Veta vad som ska följa efter ett skäl", "Förklara vad som gör ett resonemang utvecklat", "Ställa rätt fråga när du granskar ett resonemang"],
    hook: "”Det är bättre för att det är bättre.” Blir du övertygad?",
    learnerGoal: "När du är klar kan du utveckla ett argument genom att förklara varför det stämmer och vad det leder till.",
    goal: writingCriterion,
    model: {
      strong: "Vegetarisk mat är bättre för klimatet. Att föda upp djur kräver mycket mark, vatten och foder, och det leder till stora utsläpp.",
      needsWork: "Det är bättre att äta vegetariskt för att det är bättre.",
      question: "Klicka på det exempel som förklarar sitt argument, så att läsaren får veta mer än bara skribentens åsikt.",
    },
    practice: "Välj ett skäl för din ståndpunkt. Förklara sedan varför det skälet spelar roll för elever.",
    hint: "Pröva frågorna: Vad kan hända? Vem påverkas? Hur stödjer det min tes?",
    recall: "Vad kan du lägga till efter ett argument för att utveckla resonemanget?",
    checklist: ["Jag förklarar mina argument, inte bara räknar upp dem.", "Jag visar hur argumenten stödjer min tes.", "Jag har funderat på en invändning eller ett annat perspektiv."],
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
        title: "Vad innebär ett sakargument?",
        question: "Förklara med egna ord vad ett sakargument är och hur det skiljer sig från ett argument baserat på personliga tyckanden eller gissningar.",
        placeholder: "Förklara vad ett sakargument är...",
        focus: "vad som kännetecknar ett sakargument jämfört med tyckanden eller gissningar",
      },
      {
        learningProcess: "Tillämpning · Interleaving",
        title: "Stärka inledningen med bakgrund och tes",
        question: "Reflektera över om du använde sakargument eller andra typer av argument för att göra textens tes starkare och väcka intresse.",
        placeholder: "Beskriv hur du kopplar sakargument till inledningen...",
        focus: "hur sakargument eller andra argument används för att stärka inledningens tes",
      },
      {
        learningProcess: "Självförklaring · Self-explanation",
        title: "Varför bygger vi utvecklade resonemang?",
        question: "Varför räcker det inte med att bara skriva ett påstående där du gissar? Förklara varför texten blir mer övertygande när du utvecklar dina resonemang med sakargument.",
        placeholder: "Förklara varför utvecklade resonemang övertygar läsaren...",
        focus: "varför utvecklade resonemang med sakargument kan övertyga läsaren",
      },
      {
        learningProcess: "Metakognition och självbedömning",
        title: "Utvärdera dina egna resonemang",
        question: "Är det något resonemang i din text som du är särskilt nöjd med, och vad tyckte du var svårast att utveckla?",
        placeholder: "Reflektera över dina resonemang och vad som var svårast...",
        focus: "elevens egen bedömning av resonemangens styrkor och svårigheter",
      },
      {
        learningProcess: "Framåtkoppling · Aktivering inför nästa kapitel",
        title: "Struktur och textbindning",
        question: "Hur tror du att du kan ta dina sakargument ett steg längre i nästa kapitel när vi ska arbeta med textbindning?",
        placeholder: "Beskriv hur du vill utveckla dina sakargument med textbindning...",
        focus: "hur sakargument kan utvecklas med textbindning i nästa kapitel",
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
    canDo: ["Hitta ord som binder ihop orsak och följd", "Veta vad sambandsord hjälper läsaren med", "Nämna olika samband som sambandsord kan visa", "Granska om ett sambandsord säger det du menar"],
    hook: "”Därför” eller ”däremot”? Ett enda ord kan vända hela meningen.",
    learnerGoal: "När du är klar kan du välja sambandsord som visar hur dina tankar hänger ihop.",
    goal: writingCriterion,
    model: {
      strong: "Köttproduktionen orsakar stora utsläpp. Därför kan en mer vegetarisk kost minska vår klimatpåverkan.",
      needsWork: "Köttproduktionen orsakar stora utsläpp. Däremot kan en mer vegetarisk kost minska vår klimatpåverkan.",
      question: "Klicka på det exempel där sambandsordet visar det samband som skribenten verkar vilja uttrycka.",
    },
    practice: "Skriv två meningar om din ståndpunkt och välj ett sambandsord som visar sambandet mellan dem.",
    hint: "Vill du visa orsak, följd, tillägg eller motsats? Välj sambandsord efter tanken.",
    recall: "Nämn två olika samband som sambandsord kan hjälpa dig att visa.",
    checklist: ["Mina sambandsord visar det samband jag menar.", "Jag varierar orden där det behövs.", "Det är tydligt hur mina meningar hänger ihop."],
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
        learningProcess: "Tillämpning · Interleaving",
        title: "Skapa den röda tråden mellan argument",
        question: "Hur kan du använda sambandsord för att binda samman ett sakargument med ditt motargument och dess bemötande?",
        placeholder: "Beskriv hur du knyter ihop argument och motargument med bindeord...",
        focus: "hur sambandsord kan binda samman argument, motargument och bemötande",
      },
      {
        learningProcess: "Självförklaring · Self-explanation",
        title: "Varför skapar textbindning flyt?",
        question: "Varför blir en text lättare och trevligare att läsa när meningarna hör ihop med hjälp av textbindning, i stället för att bestå av korta, upphackade påståenden?",
        placeholder: "Förklara varför textbindning gör texten lättare att följa...",
        focus: "hur textbindning hjälper läsaren att följa textens tankegång",
      },
      {
        learningProcess: "Metakognition och självbedömning",
        title: "Utvärdera din egen textbindning",
        question: "Vilka sambandsord använde du mest i din text, och vad tycker du var svårast när du skulle variera din textbindning?",
        placeholder: "Reflektera över din användning av sambandsord och vad som var svårt...",
        focus: "elevens egen användning av och svårigheter med sambandsord",
      },
      {
        learningProcess: "Framåtkoppling · Aktivering inför nästa kapitel",
        title: "Från textbindning till snygg meningsbyggnad",
        question: "I nästa kapitel ska vi arbeta med korrekt språk och att bygga meningar. Hur tror du att bra textbindning påverkar hela din meningsbyggnad och grammatik?",
        placeholder: "Beskriv hur textbindning kan påverka meningsbyggnad och grammatik...",
        focus: "hur textbindning samspelar med meningsbyggnad och grammatik",
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
    canDo: ["Se när en mening börjar med en bisats", "Veta vad du kan prova när meningar börjar likadant", "Beskriva ett sätt att variera meningsbyggnaden", "Granska om upprepade starter gör texten enformig"],
    hook: "Jag tycker. Jag tycker. Jag tycker. Hur länge orkar du läsa?",
    learnerGoal: "När du är klar kan du variera hur dina meningar börjar och hur långa de är, utan att texten blir svår att följa.",
    goal: languageCriterion,
    model: {
      strong: "Mindre kött kan göra stor skillnad. När fler väljer vegetariskt minskar både utsläppen och djurens lidande.",
      needsWork: "Jag tycker att vi borde äta mindre kött. Jag tycker att djuren har det dåligt. Jag tycker att det är ett problem.",
      question: "Klicka på det exempel där meningarna börjar på olika sätt.",
    },
    practice: "Skriv två meningar om ditt ämne. Prova att börja dem på olika sätt.",
    hint: "Du kan börja med en tid, en orsak eller det viktigaste ordet – inte bara med ”jag tycker”.",
    recall: "Vad kan du ändra för att minska enformiga meningsstarter?",
    checklist: ["Mina meningar är begripliga.", "Jag varierar meningsstarter där det passar.", "Meningslängden hjälper läsaren att följa resonemanget."],
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
        learningProcess: "Tillämpning · Interleaving",
        title: "Koppla meningsbyggnad till sakargument och textbindning",
        question: "Hur kan du kombinera sambandsord från förra kapitlet med varierad meningsbyggnad för att förklara ett sakargument utan att hamna i tjatiga ”jag tycker”-upprepningar?",
        placeholder: "Förklara hur du kombinerar sambandsord och varierad meningsbyggnad...",
        focus: "hur sambandsord och varierad meningsbyggnad kan utveckla ett sakargument",
      },
      {
        learningProcess: "Självförklaring · Self-explanation",
        title: "Varför skapar varierad meningslängd rytm?",
        question: "Varför blir en text mer intressant och lättläst när du blandar korta och långa meningar, i stället för att alla meningar ser likadana ut?",
        placeholder: "Förklara varför rytm och varierad meningslängd gör texten mer engagerande...",
        focus: "hur varierad meningslängd påverkar textens rytm och läsbarhet",
      },
      {
        learningProcess: "Metakognition och självbedömning",
        title: "Utvärdera din egen meningsbyggnad",
        question: "Vilken förändring i dina meningar är du mest nöjd med i din text, och vad tyckte du var klurigast att variera?",
        placeholder: "Reflektera över din egen meningsbyggnad och vad som var klurigast...",
        focus: "elevens egen bedömning av meningsbyggnadens styrkor och svårigheter",
      },
      {
        learningProcess: "Framåtkoppling · Aktivering inför nästa kapitel",
        title: "Koppling till språkregler, grammatik och interpunktion",
        question: "I nästa kapitel ska vi arbeta med språkregler som stavning, grammatik, kommatecken och ordval. Hur tror du att rätt interpunktion, till exempel komma och punkt, hjälper dig att bygga ännu tydligare meningar?",
        placeholder: "Beskriv hur interpunktion kan hjälpa dig att bygga tydliga meningar...",
        focus: "hur interpunktion kan hjälpa till att bygga tydliga meningar",
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
    canDo: ["Se hur ett semikolon binder ihop två påståenden", "Veta vad du kontrollerar när du läser igenom en mening", "Förklara hur språkliga normer hjälper läsaren", "Använda ett korrektursteg som fungerar"],
    hook: "En punkt eller ett ord på fel plats kan få läsaren att tappa tråden.",
    learnerGoal: "När du är klar kan du granska stavning, skiljetecken och ordval så att din text blir lätt att följa.",
    goal: languageCriterion,
    model: {
      strong: "En vegetarisk kost kan ge oss all den näring vi behöver för att må bra.",
      needsWork: "en vegetarisk kost kan ge oss all den näringen vi behöver må bra",
      question: "Klicka på det exempel som är lättast för läsaren att följa.",
    },
    practice: "Läs en mening i din text högt. Välj ett ställe där ett ord eller ett skiljetecken kan göra betydelsen tydligare.",
    hint: "Kontrollera stor bokstav, meningsgränser och att orden passar ihop. Ändra bara det du själv kan motivera.",
    recall: "Vilka två saker kan du kontrollera när du korrekturläser en mening?",
    checklist: ["Jag har kontrollerat stavning och skiljetecken.", "Meningarna är fullständiga och begripliga.", "Ordvalet passar textens syfte och mottagare."],
    criteria: ["Språkliga normer", "Anpassning och språklig variation"],
    checkInFocus: "hur språkliga normer hjälper läsaren",
    checkIns: [
      { mode: "choice", question: "Vad gör den andra meningen lättare att läsa?", options: [{ label: "Stor bokstav och tydliga meningsgränser.", correct: true }, { label: "Fler utropstecken.", correct: false }] },
      { mode: "choice", question: "Vad kan du kontrollera när du läser igenom din mening?", options: [{ label: "Stavning och skiljetecken.", correct: true }, { label: "Att varje ord byts mot en synonym.", correct: false }] },
      { mode: "text", question: "Beskriv med egna ord hur språkliga normer kan hjälpa läsaren." },
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
        learningProcess: "Tillämpning · Interleaving",
        title: "Språkregler",
        question: "Kan du ge ett exempel på korrekt satsbindning med bindeordet ”eftersom”?",
        placeholder: "Förklara hur språkregler och satsbindning stöttar argumentationen...",
        focus: "korrekt satsbindning med eftersom och dess funktion i argumentationen",
      },
      {
        learningProcess: "Självförklaring · Self-explanation",
        title: "Varför är språklig korrekthet viktig?",
        question: "Varför kan läsarens förtroende för dina argument minska om texten innehåller många stavfel, saknar skiljetecken eller har ett alltför vardagligt språk?",
        placeholder: "Förklara varför korrekt språk stärker trovärdigheten...",
        focus: "hur språklig korrekthet kan påverka läsarens förtroende",
      },
      {
        learningProcess: "Metakognition och självbedömning",
        title: "Utvärdera ditt eget språk",
        question: "Vad i ditt språk, till exempel kommatecken, ordval eller grammatik, behöver du granska extra noga under bearbetningen?",
        placeholder: "Reflektera över din språkliga utveckling och vad som kräver granskning...",
        focus: "elevens egen bedömning av vilka språkliga drag som behöver granskas",
      },
      {
        learningProcess: "Framåtkoppling · Aktivering inför nästa kapitel",
        title: "Förberedelse inför textbearbetning och slutdiagnos",
        question: "I nästa kapitel ska du bearbeta hela din text och slutligen genomföra en slutdiagnos helt utan stöd. Hur planerar du att använda dina samlade kunskaper för att granska din egen text?",
        placeholder: "Beskriv hur du planerar att granska och bearbeta din text...",
        focus: "hur eleven planerar att använda tidigare kunskaper i självständig textbearbetning",
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
    canDo: ["Välja ett arbetssätt som hjälper dig att bearbeta", "Arbeta självständigt med din text", "Beskriva ett eget granskningssteg", "Sätta ett bra mål för självkontrollen"],
    hook: "Nu får du visa vad du har lärt dig, i en helt ny text.",
    learnerGoal: "När du är klar har du skrivit och granskat en egen argumenterande text med det du har övat på.",
    goal: `${writingCriterion}\n${languageCriterion}`,
    model: {
      strong: "Börja med att läsa texten som en läsare. Välj sedan ett utvecklingsområde och gör en egen ändring som du kan förklara.",
      needsWork: "Försök ändra allt på en gång utan att veta vad du vill förbättra.",
      question: "Klicka på det arbetssätt som hjälper dig mest när du bearbetar din text.",
    },
    practice: "Skriv klart din argumenterande text och välj själv vad du vill bearbeta först.",
    hint: "Stöd är avsiktligt begränsat här. Använd dina egna granskningsfrågor från tidigare moment.",
    recall: "Vilket granskningssteg brukar hjälpa dig mest? Beskriv det med egna ord.",
    checklist: ["Jag har granskat innehåll och struktur.", "Jag har bearbetat språket och läst igenom texten igen.", "Jag kan beskriva en ändring jag gjort och varför."],
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
