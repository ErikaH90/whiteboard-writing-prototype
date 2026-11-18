export type Phase =
  | "Modellering"
  | "Träna själv"
  | "Återkalla utan stöd"
  | "Självkontroll"
  | "Slutbedömning";

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
  goal: string;
  model: {
    strong: string;
    needsWork: string;
    question: string;
  };
  practice: string;
  hint: string;
  recall: string;
  checklist: string[];
  criteria: string[];
  checkInFocus: string;
  checkIns: [CheckIn, CheckIn, CheckIn, CheckIn];
  exitTicket: ExitTicketStep[];
};

export const phases: Phase[] = [
  "Modellering",
  "Träna själv",
  "Återkalla utan stöd",
  "Självkontroll",
  "Slutbedömning",
];

export const lessons: Lesson[] = [
  {
    title: "Bygg upp en argumenterande text",
    shortTitle: "Struktur",
    goal: "Känna igen hur tes, argument, motargument och avslutning hjälper läsaren att följa en ståndpunkt.",
    model: {
      strong: "Skoldagen borde börja senare. Många ungdomar är trötta på morgonen, vilket gör det svårare att koncentrera sig. En senare start skulle därför kunna ge fler en bättre början på dagen.",
      needsWork: "Skolan är dålig. Jag gillar inte att gå upp. Det borde vara annorlunda.",
      question: "Vilket exempel gör det tydligast vad skribenten vill övertyga läsaren om – och varför?",
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
    goal: "Utveckla argument genom att förklara hur de hänger ihop med tesen och ta hänsyn till andra perspektiv.",
    model: {
      strong: "En senare start kan göra det lättare att koncentrera sig. När elever är piggare kan de också få bättre förutsättningar att delta i undervisningen.",
      needsWork: "Det är bättre med en senare start för att det är bättre.",
      question: "Vilket exempel förklarar sitt argument så att läsaren får veta mer än bara skribentens åsikt?",
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
    goal: "Använda sambandsord och hänvisningar som visar hur idéerna i texten hör ihop.",
    model: {
      strong: "Många elever är trötta tidigt på morgonen. Därför kan en senare skolstart göra det lättare att koncentrera sig.",
      needsWork: "Många elever är trötta tidigt på morgonen. Däremot kan en senare skolstart göra det lättare att koncentrera sig.",
      question: "Vilket sambandsord visar det samband som skribenten verkar vilja uttrycka?",
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
    goal: "Skapa meningar som är tydliga och varierade utan att tappa den egna tanken.",
    model: {
      strong: "En senare start kan göra stor skillnad. Fler elever kanske orkar lyssna och delta när skoldagen börjar.",
      needsWork: "Jag tycker att skolan borde börja senare. Jag tycker att elever är trötta. Jag tycker att det är ett problem.",
      question: "Vad händer med rytmen och tydligheten när samma inledning upprepas?",
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
    goal: "Bearbeta språket så att ordval, stavning och skiljetecken hjälper läsaren att förstå texten.",
    model: {
      strong: "En senare skolstart kan ge elever bättre möjlighet att möta skoldagen utvilade.",
      needsWork: "en senare skolstart kan ge elever bättre möjligheter möta skoldagen utvilad",
      question: "Vad behöver läsaren för att den andra meningen ska bli lättare att följa?",
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
    goal: "Använda dina kunskaper självständigt för att granska och bearbeta en sammanhängande text.",
    model: {
      strong: "Börja med att läsa texten som en läsare. Välj sedan ett utvecklingsområde och gör en egen ändring som du kan förklara.",
      needsWork: "Försök ändra allt på en gång utan att veta vad du vill förbättra.",
      question: "Vilken ändring skulle göra störst skillnad för läsarens förståelse – och hur vet du det?",
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
    exitTicket: [
      {
        learningProcess: "Återkallning · Retrieval practice",
        title: "Samla dina strategier",
        question: "Utan att titta på tidigare svar: nämn minst tre strategier du kan använda för att granska en argumenterande text, från struktur och argument till språk.",
        placeholder: "Beskriv tre granskningsstrategier med egna ord...",
        focus: "återkallning av tidigare strategier för argumenterande text",
      },
      {
        learningProcess: "Tillämpning · Interleaving",
        title: "Se hur delarna samverkar",
        question: "Välj ett ställe i din text där ett argument kopplas till tesen. Hur hjälper textbindning och meningsbyggnad läsaren att följa ditt resonemang?",
        placeholder: "Beskriv hur argument, tes, textbindning och meningsbyggnad samverkar...",
        focus: "tillämpning av struktur, argument, textbindning och meningsbyggnad i den egna texten",
      },
      {
        learningProcess: "Självförklaring · Self-explanation",
        title: "Varför behöver texten flera delar?",
        question: "Varför blir en argumenterande text tydligare och mer övertygande när struktur, utvecklade argument, textbindning och språklig korrekthet samverkar?",
        placeholder: "Förklara hur flera skrivstrategier tillsammans hjälper läsaren...",
        focus: "varför flera språkliga och strukturella strategier samverkar för läsaren",
      },
      {
        learningProcess: "Metakognition och självbedömning",
        title: "Utvärdera din bearbetning",
        question: "Vilken förändring i din text är du mest nöjd med, vad var svårast att bearbeta och hur vet du att ändringen hjälper läsaren?",
        placeholder: "Reflektera över din bearbetning och vad du har lärt dig...",
        focus: "elevens egen bedömning av bearbetning, svårigheter och textens tydlighet",
      },
      {
        learningProcess: "Framåtkoppling · Överföring till framtida skrivande",
        title: "Ta kunskaperna vidare",
        question: "När du skriver nästa argumenterande text utan den här lektionsserien, vilken strategi vill du börja med och hur ska du märka att den hjälper din läsare?",
        placeholder: "Beskriv vilken strategi du vill använda i nästa skrivuppgift...",
        focus: "överföring av lärda skrivstrategier till framtida skrivuppgifter",
      },
    ],
  },
];
