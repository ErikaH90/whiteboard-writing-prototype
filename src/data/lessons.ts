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
  checkIns: CheckIn[];
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
      { mode: "choice", question: "Vad visar att strukturen hjälper läsaren?", options: [{ label: "Läsaren kan följa ståndpunkten och skälen.", correct: true }, { label: "Alla meningar börjar på samma sätt.", correct: false }] },
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
      { mode: "choice", question: "Vad letar du efter i ett utvecklat argument?", options: [{ label: "Ett skäl och en förklaring som stödjer tesen.", correct: true }, { label: "Ett påstående utan koppling till tesen.", correct: false }] },
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
      { mode: "choice", question: "Vad gör textbindningen fungerande?", options: [{ label: "Den visar hur idéerna hänger ihop.", correct: true }, { label: "Den upprepar samma ord utan tydlig funktion.", correct: false }] },
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
      { mode: "choice", question: "Vad kännetecknar en fungerande meningsbyggnad?", options: [{ label: "Meningarna är tydliga och varierade.", correct: true }, { label: "Meningarna följer exakt samma mönster.", correct: false }] },
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
      { mode: "choice", question: "Vad visar att språket fungerar för läsaren?", options: [{ label: "Texten följer normer och är begriplig.", correct: true }, { label: "Texten använder så många svåra ord som möjligt.", correct: false }] },
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
      { mode: "choice", question: "Vad visar att du kan bearbeta texten självständigt?", options: [{ label: "Jag kan förklara vad jag ändrade och varför.", correct: true }, { label: "Jag kopierade alla förslag utan att granska dem.", correct: false }] },
    ],
  },
];
