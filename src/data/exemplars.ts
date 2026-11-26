import type { InterestId } from "../lib/learnerProfile";
import { food } from "./exemplarSets/food";
import { leisure } from "./exemplarSets/leisure";
import { school } from "./exemplarSets/school";
import { screens } from "./exemplarSets/screens";
import type { Lesson, SkillId } from "./lessons";
import type { WritingTopic } from "./topics";

export type ExemplarId = "strong" | "basic";

export type ExemplarText = {
  title: string;
  paragraphs: string[];
};

export type ExemplarHighlight = {
  /** Exact wording from the exemplar. Must occur exactly once in the text. */
  quote: string;
  label: string;
  /**
   * The question the whiteboard asks before the part is shown (utmärkt text): the student first
   * tries to find the part in the text themselves.
   */
  ask?: string;
  /** The teacher's explanation on the whiteboard once the part has been found or shown. */
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

/** One step of the modelling: a comparison or a part of the exemplar text. */
export type FlowStep = { compare: number } | { part: number };

export type ExemplarFocus = {
  /** How the whiteboard introduces the walk-through of the exemplar. */
  boardNote: string;
  /** A few key words that stay on the board when Edda has said the note. */
  boardKeys: string[];
  /** Comparisons shown before the walk-through, in order. */
  comparisons?: ExemplarComparison[];
  /** An error hunt on the whiteboard, after the walk-through. */
  hunt?: ErrorHunt;
  /**
   * The order of comparisons and parts, so that related things come together.
   * Without a flow: all comparisons, then all parts.
   */
  flow?: FlowStep[];
  highlights: Record<ExemplarId, ExemplarHighlight[]>;
};


export type ExemplarSetId = "food" | "school" | "screens" | "leisure";

/**
 * Everything that belongs to one exemplar topic: the two texts, what Edda shows in them in each
 * chapter, and the two short examples she shows before each writing task. The sets are built the
 * same way, part for part, so that the lesson works the same whichever topic the student meets.
 */
export type ExemplarSet = {
  id: ExemplarSetId;
  /** The interest in the learner profile that this topic belongs to. */
  interest: InterestId;
  texts: Record<ExemplarId, ExemplarText>;
  focus: Record<SkillId, ExemplarFocus>;
  /**
   * A better and a weaker example of the part the student is about to write, for chapters 1–5.
   * In chapters 1–4 they are taken word for word from the two texts.
   */
  models: { strong: string; needsWork: string }[];
};

export const exemplarLabels: Record<ExemplarId, string> = {
  strong: "Utmärkt text",
  basic: "Okej text",
};

export const exemplarSets: ExemplarSet[] = [food, school, screens, leisure];

/** The set used when nothing else fits, and in most tests. */
export const defaultExemplarSet = food;

export function exemplarSetById(id: string): ExemplarSet {
  return exemplarSets.find((set) => set.id === id) ?? defaultExemplarSet;
}

/**
 * The exemplar the student reads is about the same area as the topic the student chose to write
 * about, but never about the same question: the student's own text must be the student's own.
 */
export function exemplarSetForTopic(topic: Pick<WritingTopic, "id" | "prompt">): ExemplarSet {
  if (topic.id === "school-start") return school;
  if (topic.id === "phones") return screens;
  if (topic.id === "leisure") return leisure;
  // The student's own question: the area is read from its words. A set whose text argues the very
  // same question is passed over, so that the exemplar never becomes a text to copy from.
  const words = topic.prompt.toLocaleLowerCase("sv");
  const free = (set: ExemplarSet) => !ownQuestions[set.id].test(words);
  return ownTopicAreas.find(([set, area]) => area.test(words) && free(set))?.[0]
    ?? [food, school].find(free)
    ?? defaultExemplarSet;
}

/** Words that place a student's own question in the same area as an exemplar. */
const ownTopicAreas: [ExemplarSet, RegExp][] = [
  [screens, /mobil|skärm|sociala medier|internet|dataspel|tv-spel|gaming|dator|\bappar\b|\bai\b|teknik|tiktok|youtube|influencer/u],
  [leisure, /fritid|idrott|sport|träning|fotboll|förening|musik|kultur|\blov|helg/u],
  [school, /skol|läx|betyg|lärare|lektion|\brast|\bprov|klassrum|undervisning/u],
];

/** The question each exemplar itself argues. */
const ownQuestions: Record<ExemplarSetId, RegExp> = {
  food: /kött|vegetar|vegan/u,
  school: /rörelse|röra på|idrott/u,
  screens: /åldersgräns/u,
  leisure: /fritidsgård|ungdomsgård/u,
};

/** Edda's two examples before the writing task, about the topic of the student's exemplar. */
export function lessonModel(
  lesson: Lesson,
  lessonIndex: number,
  set: ExemplarSet,
): { question: string; strong: string; needsWork: string } {
  const pair = set.models[lessonIndex];
  return {
    question: lesson.model.question,
    strong: pair?.strong ?? lesson.model.strong ?? "",
    needsWork: pair?.needsWork ?? lesson.model.needsWork ?? "",
  };
}


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

/** The modelling steps of a chapter in order. */
export function modellingFlow(focus: ExemplarFocus): FlowStep[] {
  return focus.flow ?? [
    ...(focus.comparisons ?? []).map((_, index) => ({ compare: index })),
    ...focus.highlights.strong.map((_, index) => ({ part: index })),
  ];
}
