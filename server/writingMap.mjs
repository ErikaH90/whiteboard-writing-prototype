/**
 * The writing map: how far each part of the student's own argumentative text has come.
 *
 * To be reliable, a part's step is never the model's overall impression. Each part has a fixed
 * list of things Edda has taught and that can be pointed out in a text. Some are found by plain
 * rules (a heading, linking words, sentence length), the others by the model, which must quote
 * the place in the text. The step is then counted from how many of them are there. Edda's praise
 * and her hint for the next step are the course's own sentences, one per thing.
 *
 * The steps are support for the student's revision. They are not grades or grading criteria.
 */

const linkingWords = {
  order: ["för det första", "för det andra", "för det tredje", "till att börja med", "slutligen", "till sist", "avslutningsvis", "sammanfattningsvis"],
  cause: ["eftersom", "därför att", "på grund av", "beror på"],
  effect: ["vilket leder till", "leder till", "vilket innebär", "följaktligen", "alltså", "i sin tur", "så att", "därför"],
  contrast: ["däremot", "trots att", "å andra sidan", "samtidigt", "medan", "ändå", "dock", "men"],
  addition: ["dessutom", "ytterligare", "utöver", "också", "även"],
};

export const mapFeatures = {
  structure: [
    { id: "heading", by: "rule", praise: "Du har en rubrik som visar vad texten handlar om.", hint: "Vilken rubrik kan visa både ämnet och vad du tycker?" },
    { id: "thesis", by: "model", look: "En mening i inledningen där skribenten tydligt säger sin ståndpunkt (tesen).", praise: "Du har en tes som säger tydligt vad du tycker.", hint: "Var i inledningen kan du säga tydligt vad du tycker?" },
    { id: "arguments", by: "model", pair: true, look: "Minst två olika argument (skäl) för tesen, i olika meningar. Räkna först argumenten. Finns bara ett argument är found false. När det finns två: citera det första argumentet, skriv sedan tecknet | och citera det andra argumentet.", praise: "Du har flera argument som stöder din tes.", hint: "Vilket skäl till kan du ge för din åsikt?" },
    { id: "counter", by: "model", look: "Ett motargument, alltså något som den som tycker annorlunda skulle säga.", praise: "Du tar upp vad andra kan tycka, ett motargument.", hint: "Vad skulle någon som inte håller med dig säga?" },
    { id: "conclusion", by: "model", look: "En avslutning sist i texten som sammanfattar eller upprepar ståndpunkten. Ett vanligt argument eller ett motargument sist i texten räknas inte.", praise: "Du har en avslutning som knyter ihop texten.", hint: "Hur kan du avsluta så att läsaren minns vad du tycker?" },
  ],
  reasoning: [
    { id: "reason", by: "model", look: "Ett argument där skribenten ger ett skäl för sin åsikt.", praise: "Du ger ett skäl för din åsikt.", hint: "Vilket skäl har du för din åsikt?" },
    { id: "explain", by: "model", look: "En förklaring av varför ett argument stämmer, ofta med ord som eftersom eller därför att. Att bara påstå något räknas inte.", praise: "Du förklarar varför ditt argument stämmer.", hint: "Varför stämmer ditt argument? Pröva att förklara det." },
    { id: "example", by: "model", look: "Ett konkret exempel eller en faktauppgift som stöder ett argument.", praise: "Du stöder ett argument med ett exempel eller fakta.", hint: "Vilket exempel eller vilken fakta kan stödja ditt argument?" },
    { id: "consequence", by: "model", look: "En mening som visar vad argumentet leder till, alltså en följd eller konsekvens.", praise: "Du visar vad ditt argument leder till.", hint: "Vad händer om det blir som du vill? Visa vad det leder till." },
    { id: "rebuttal", by: "model", look: "Ett svar på ett motargument, där skribenten förklarar varför den ändå tycker som den gör.", praise: "Du svarar på motargumentet.", hint: "Hur kan du svara den som inte håller med dig?" },
  ],
  cohesion: [
    { id: "order", by: "rule", praise: "Du använder sambandsord som visar ordningen mellan dina argument.", hint: "Vilka ord kan visa i vilken ordning dina argument kommer?" },
    { id: "cause", by: "rule", praise: "Du använder sambandsord som visar en orsak.", hint: "Vilket ord kan visa en orsak, alltså varför något är så?" },
    { id: "effect", by: "rule", praise: "Du använder sambandsord som visar en följd.", hint: "Vilket ord kan visa en följd, alltså vad något leder till?" },
    { id: "contrast", by: "rule", praise: "Du använder sambandsord som visar en kontrast.", hint: "Vilket ord kan ställa två saker mot varandra?" },
    { id: "addition", by: "rule", praise: "Du använder sambandsord som lägger till något nytt.", hint: "Vilket ord kan visa att du lägger till en tanke?" },
  ],
  sentence: [
    { id: "starts", by: "rule", praise: "Dina meningar börjar på olika sätt.", hint: "Titta på hur dina meningar börjar. Kan någon börja på ett annat sätt?" },
    { id: "lengths", by: "rule", praise: "Du blandar korta och långa meningar.", hint: "Pröva att blanda en kort mening med en längre. Hur låter rytmen då?" },
    { id: "wording", by: "model", look: "Ett ställe där skribenten har valt ett precist eller formellt ord i stället för ett vardagligt och allmänt, till exempel betydelsefullt i stället för viktigt. Vanliga, enkla ord räknas inte.", praise: "Du har valt ett precist ord som passar texten.", hint: "Finns det ett vanligt ord som du kan byta mot ett mer precist?" },
  ],
  language: [
    { id: "capitals", by: "rule", praise: "Dina meningar börjar med stor bokstav.", hint: "Kontrollera att varje mening börjar med stor bokstav." },
    { id: "endmarks", by: "rule", praise: "Du avslutar dina meningar med skiljetecken.", hint: "Kontrollera att varje mening slutar med punkt, frågetecken eller utropstecken." },
    { id: "spelling", by: "issue", look: "Ett ord som är felstavat. Citera bara det felstavade ordet, exakt som det står. Finns inget säkert stavfel är found false.", praise: "Stavningen stämmer i hela texten.", hint: "Läs texten ord för ord. Det finns en stavning att kontrollera." },
    { id: "formal", by: "issue", look: "Ett ord eller uttryck som är talspråk eller slang och inte passar i en argumenterande text. Citera bara det uttrycket, exakt som det står. Finns inget sådant är found false.", praise: "Dina ord passar en argumenterande text.", hint: "Finns det ett vardagligt ord som du kan byta mot ett som passar texten bättre?" },
  ],
};

export const mapSkillIds = Object.keys(mapFeatures);

/** How many of a part's things must be in the text for step 1, 2 and 3. */
const steps = {
  structure: [1, 3, 5],
  reasoning: [1, 2, 4],
  cohesion: [1, 2, 4],
  sentence: [1, 2, 3],
  language: [1, 3, 4],
};

/** Variation and correctness cannot be shown in a few lines: these parts need some text. */
const wordsNeeded = { sentence: [0, 30, 80], language: [0, 30, 80] };

/** The text as heading and sentences, with their places in the text. */
export function readText(draft) {
  const lines = [];
  for (const match of draft.matchAll(/[^\n]+/gu)) {
    if (match[0].trim()) lines.push({ start: match.index, text: match[0] });
  }
  const first = lines[0];
  const hasHeading = Boolean(first) && lines.length > 1 && first.text.trim().length <= 90 && !/[.,;:]$/u.test(first.text.trim());
  const heading = hasHeading
    ? { start: first.start + first.text.indexOf(first.text.trim()), end: first.start + first.text.trimEnd().length }
    : null;

  const sentences = [];
  for (const line of hasHeading ? lines.slice(1) : lines) {
    for (const match of line.text.matchAll(/[^.!?]+[.!?]*["”')]*/gu)) {
      const text = match[0].trim();
      if (!/\p{L}/u.test(text)) continue;
      const start = line.start + match.index + match[0].indexOf(text);
      sentences.push({ start, end: start + text.length, text, words: text.match(/[\p{L}\p{N}]+/gu) ?? [], endsLine: match.index + match[0].length >= line.text.trimEnd().length });
    }
  }
  return { heading, sentences, wordCount: (draft.match(/[\p{L}\p{N}]+/gu) ?? []).length };
}

function findPhrase(draft, phrases) {
  let best = null;
  for (const phrase of phrases) {
    const pattern = new RegExp(`(?<![\\p{L}])${phrase.replace(/ /gu, "\\s+")}(?![\\p{L}])`, "iu");
    const match = pattern.exec(draft);
    if (match && (!best || match.index < best.start)) best = { start: match.index, end: match.index + match[0].length };
  }
  return best;
}

/** The things in a part that plain rules can find. Returns the place in the text, or null. */
export function readByRule(draft, skill, text = readText(draft)) {
  const { heading, sentences } = text;
  const place = (sentence) => sentence ? { start: sentence.start, end: sentence.end } : null;
  const found = {};

  if (skill === "structure") found.heading = heading;
  if (skill === "cohesion") {
    for (const [id, phrases] of Object.entries(linkingWords)) {
      // "därför att" gives a cause, so a bare "därför" is looked for as an effect only without "att".
      const effect = id === "effect" ? draft.replace(/därför(\s+)att/giu, (whole) => " ".repeat(whole.length)) : draft;
      found[id] = findPhrase(effect, phrases);
    }
  }
  if (skill === "sentence") {
    const starts = sentences.map((sentence) => (sentence.words[0] ?? "").toLocaleLowerCase("sv"));
    const counts = new Map();
    for (const start of starts) counts.set(start, (counts.get(start) ?? 0) + 1);
    const most = Math.max(0, ...counts.values());
    const varied = sentences.length >= 4 && most <= Math.ceil(sentences.length * 0.4);
    found.starts = varied ? place(sentences.find((_, index) => counts.get(starts[index]) === 1) ?? sentences[0]) : null;
    const short = sentences.find((sentence) => sentence.words.length <= 7);
    const long = sentences.find((sentence) => sentence.words.length >= 14);
    found.lengths = short && long ? place(short) : null;
  }
  if (skill === "language") {
    const enough = sentences.length >= 2;
    const capitals = enough && sentences.every((sentence) => /^["”'(]*\p{Lu}/u.test(sentence.text) || /^["”'(]*\p{N}/u.test(sentence.text));
    const endmarks = enough && sentences.filter((sentence) => sentence.endsLine).every((sentence) => /[.!?]["”')]*$/u.test(sentence.text));
    found.capitals = capitals ? place(sentences[0]) : null;
    found.endmarks = endmarks ? place(sentences[0]) : null;
  }
  return found;
}

/** The things in a part that the model is asked to point out, with what to look for. */
export function modelFeatures(skill) {
  return mapFeatures[skill].filter((feature) => feature.by !== "rule").map(({ id, look, pair }) => ({ id, look, pair: Boolean(pair) }));
}

/**
 * Puts one part together. `places` holds, for each thing, where it is in the text: for a thing
 * of the kind "issue" a place means that a problem was found there.
 */
export function buildPart(draft, skill, places, text = readText(draft)) {
  const features = mapFeatures[skill];
  const isThere = (feature) => feature.by === "issue"
    // Spelling and word choice can only be judged when there is some text to read.
    ? !places[feature.id] && text.sentences.length >= 2
    : Boolean(places[feature.id]);
  const there = features.filter(isThere);
  const missing = features.filter((feature) => !isThere(feature));

  let level = steps[skill].filter((needed) => there.length >= needed).length;
  const limits = wordsNeeded[skill];
  if (limits) level = Math.min(level, limits.filter((needed) => text.wordCount >= needed).length);
  const isHeldBack = limits !== undefined && level < steps[skill].filter((needed) => there.length >= needed).length;

  const next = isHeldBack
    ? "Skriv vidare på din text. Edda behöver mer text för att kunna se det här tydligt."
    : missing[0]?.hint ?? "";
  // The first thing that is not in the text yet: what Edda goes back to and shows an example of.
  const gap = isHeldBack ? null : missing[0]?.id ?? null;
  // Everything of this part that is not in the text yet.
  const lacks = missing.map((feature) => feature.id);
  if (level === 0) return { skill, level: 0, strength: "", next, missing: gap, lacks, found: [] };

  // Edda shows the latest thing in the list that is in the text, with its place as evidence.
  const shown = [...there].reverse().find((feature) => places[feature.id]) ?? null;
  const evidence = shown ? places[shown.id] : text.sentences[0] ?? null;
  if (!evidence) return { skill, level: 0, strength: "", next, missing: gap, lacks, found: [] };
  return {
    skill,
    level,
    start: evidence.start,
    end: evidence.end,
    quote: draft.slice(evidence.start, evidence.end),
    strength: (shown ?? there[there.length - 1]).praise,
    next,
    missing: gap,
    lacks,
    // What the model pointed out, so that it stays found while that place is still in the text.
    found: features
      .filter((feature) => feature.by === "model" && places[feature.id])
      .map((feature) => ({ id: feature.id, quote: draft.slice(places[feature.id].start, places[feature.id].end) })),
  };
}
