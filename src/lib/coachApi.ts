import type { LearningEvidence, SkillId } from "../data/lessons";
import type { EvidenceSummary, InterestId } from "./learnerProfile";

export type Finding = {
  id: string;
  start: number;
  end: number;
  quote: string;
  title: string;
  message: string;
  category: SkillId;
};

export type TextEvidence = {
  start: number;
  end: number;
  quote: string;
  message: string;
};

export type ReviewFeedback = {
  success: TextEvidence;
  nextStep: string;
  findings: Finding[];
};

type ReviewRequest = {
  draft: string;
  lessonTitle: string;
  phase: string;
  goal: string;
  criteria: string[];
  /** The writing task the student has just done, when Edda reads the text as part of that task. */
  task?: string;
  /** The advice the student got after the task and has now tried, when Edda looks at the text again. */
  followUp?: string;
};

type CheckInRequest = {
  mode: "choice" | "text";
  question: string;
  answer: string;
  focus: string;
  exampleContext?: {
    needsWork: string;
    developed: string;
  };
  isCorrect?: boolean;
  learningContext?: LearningContext;
};

export type CheckInFeedback = {
  kind: "on_track" | "retry";
  feedback: string;
  /**
   * How much the answer showed, for an answer on the right track: 1 = on track but brief,
   * 2 = explained, 3 = developed. Decides the size of Edda's star. Not a grade.
   */
  level?: 1 | 2 | 3;
};

export type LearningContext = {
  attempt: number;
  supportLevel: 0 | 1 | 2;
  priorEvidence: {
    skillId: SkillId;
    evidence: LearningEvidence;
    observations?: number;
    independent?: number;
    supported?: number;
    needsSupport?: number;
    selfReport?: "too_easy" | "about_right" | "too_hard" | null;
  }[];
};

export type PersonalizedExampleRequest = {
  skillId: SkillId;
  lessonTitle: string;
  goal: string;
  interest: InterestId | null;
  supportLevel: 0 | 1 | 2;
  evidence: EvidenceSummary[];
};

export type PersonalizedExample = {
  needsWork: string;
  developed: string;
  question: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isFinding(value: unknown): value is Finding {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.start === "number" &&
    Number.isSafeInteger(value.start) &&
    typeof value.end === "number" &&
    Number.isSafeInteger(value.end) &&
    typeof value.quote === "string" &&
    typeof value.title === "string" &&
    typeof value.message === "string" &&
    ["structure", "reasoning", "cohesion", "sentence", "language"].includes(String(value.category));
}

async function postJson(path: string, body: unknown): Promise<unknown> {
  let response: Response;

  try {
    response = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Kunde inte nå AI-tjänsten. Kontrollera att servern kör och försök igen.");
  }

  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error("AI-tjänsten gav ett svar som inte kunde läsas.");
  }

  if (!response.ok) {
    const message = isRecord(result) && typeof result.error === "string"
      ? result.error
      : "AI-tjänsten kunde inte behandla förfrågan.";
    throw new Error(message);
  }

  return result;
}

export async function reviewDraft(request: ReviewRequest): Promise<ReviewFeedback> {
  const result = await postJson("/api/review", request);
  if (
    !isRecord(result) ||
    !Array.isArray(result.findings) ||
    result.findings.length > 3 ||
    typeof result.nextStep !== "string" ||
    result.nextStep.trim().length === 0 ||
    result.nextStep.length > 240 ||
    !isRecord(result.success)
  ) {
    throw new Error("AI-granskningen gav ett ogiltigt resultat.");
  }

  const success = result.success;
  if (
    typeof success.start !== "number" ||
    !Number.isSafeInteger(success.start) ||
    typeof success.end !== "number" ||
    !Number.isSafeInteger(success.end) ||
    typeof success.quote !== "string" ||
    success.quote.length > 160 ||
    typeof success.message !== "string" ||
    success.message.trim().length === 0 ||
    success.message.length > 240 ||
    success.start < 0 ||
    success.end <= success.start ||
    success.end > request.draft.length ||
    request.draft.slice(success.start, success.end) !== success.quote
  ) {
    throw new Error("AI-granskningen gav en framgångsåterkoppling som inte stämmer med texten.");
  }

  const findings = result.findings.filter(isFinding);
  if (findings.length !== result.findings.length) {
    throw new Error("AI-granskningen gav en ogiltig markering.");
  }
  let previousEnd = 0;

  for (const finding of findings) {
    if (
      typeof finding.id !== "string" ||
      typeof finding.title !== "string" ||
      finding.title.trim().length === 0 ||
      typeof finding.message !== "string" ||
      finding.message.trim().length === 0 ||
      typeof finding.quote !== "string" ||
      !["structure", "reasoning", "cohesion", "sentence", "language"].includes(finding.category) ||
      finding.quote.length > 160 ||
      !Number.isSafeInteger(finding.start) ||
      !Number.isSafeInteger(finding.end) ||
      finding.start < previousEnd ||
      finding.end <= finding.start ||
      finding.end > request.draft.length ||
      request.draft.slice(finding.start, finding.end) !== finding.quote
    ) {
      throw new Error("AI-granskningen innehöll en markering som inte stämmer med texten.");
    }

    previousEnd = finding.end;
  }

  return {
    success: {
      start: success.start,
      end: success.end,
      quote: success.quote,
      message: success.message,
    },
    nextStep: result.nextStep,
    findings,
  };
}

export async function submitCheckIn(request: CheckInRequest): Promise<CheckInFeedback> {
  const result = await postJson("/api/check-in", request);
  if (
    !isRecord(result) ||
    (result.kind !== "on_track" && result.kind !== "retry") ||
    typeof result.feedback !== "string" ||
    result.feedback.trim().length === 0
  ) {
    throw new Error("AI-återkopplingen gav ett ogiltigt resultat.");
  }

  const level = result.level === 1 || result.level === 2 || result.level === 3 ? result.level : undefined;
  return { kind: result.kind, feedback: result.feedback, ...(result.kind === "on_track" && level && { level }) };
}

export async function generatePersonalizedExample(request: PersonalizedExampleRequest): Promise<PersonalizedExample> {
  const result = await postJson("/api/example", request);
  if (
    !isRecord(result) ||
    typeof result.needsWork !== "string" ||
    result.needsWork.trim().length === 0 ||
    result.needsWork.length > 240 ||
    typeof result.developed !== "string" ||
    result.developed.trim().length === 0 ||
    result.developed.length > 320 ||
    typeof result.question !== "string" ||
    result.question.trim().length === 0 ||
    result.question.length > 180
  ) {
    throw new Error("AI-exemplet kunde inte visas eftersom svaret var ogiltigt.");
  }

  return {
    needsWork: result.needsWork,
    developed: result.developed,
    question: result.question,
  };
}

export type LocatedPlace = { found: false } | { found: true; start: number; end: number; quote: string };

/** Asks Edda to point out where in the student's own text a self-check statement is shown. */
export async function requestLocate(draft: string, statement: string): Promise<LocatedPlace> {
  const result = await postJson("/api/locate", { draft, statement });
  if (!isRecord(result) || typeof result.found !== "boolean") {
    throw new Error("AI-tjänsten gav ett svar som inte kunde visas.");
  }
  if (!result.found) return { found: false };
  const { start, end } = result;
  if (
    typeof start !== "number" || typeof end !== "number" ||
    !Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
    start < 0 || end <= start || end > draft.length
  ) {
    throw new Error("AI-tjänsten gav ett svar som inte kunde visas.");
  }
  return { found: true, start, end, quote: draft.slice(start, end) };
}

export type MapSkill = "structure" | "reasoning" | "cohesion" | "sentence" | "language";

/** How far one part of the student's text has come, with a quote from the text as evidence. */
export type MapPart = {
  skill: MapSkill;
  level: 0 | 1 | 2 | 3;
  start?: number;
  end?: number;
  quote?: string;
  strength: string;
  next: string;
  /** What Edda has pointed out in the text for this part, kept so that it stays found on the next reading. */
  found: { id: string; quote: string }[];
};

/**
 * Asks Edda to read the student's own text and say how far each part has come. `known` is what
 * she pointed out last time: it stays found as long as that place is still in the text.
 */
export async function requestProgressMap(draft: string, skills: MapSkill[], known: MapPart[] = []): Promise<MapPart[]> {
  const result = await postJson("/api/progress-map", {
    draft,
    skills,
    known: known.flatMap((part) => part.found.map((entry) => ({ skill: part.skill, id: entry.id, quote: entry.quote }))),
  });
  const parts = isRecord(result) && Array.isArray(result.parts) ? result.parts : null;
  if (!parts || parts.length !== skills.length) throw new Error("AI-tjänsten gav ett svar som inte kunde visas.");

  return parts.map((part, index) => {
    if (
      !isRecord(part) ||
      part.skill !== skills[index] ||
      ![0, 1, 2, 3].includes(part.level as number) ||
      typeof part.strength !== "string" ||
      typeof part.next !== "string"
    ) {
      throw new Error("AI-tjänsten gav ett svar som inte kunde visas.");
    }
    const level = part.level as MapPart["level"];
    const found = Array.isArray(part.found)
      ? part.found.filter((entry): entry is { id: string; quote: string } =>
        isRecord(entry) && typeof entry.id === "string" && typeof entry.quote === "string")
      : [];
    if (level === 0) return { skill: skills[index], level, strength: "", next: part.next, found };
    const { start, end } = part;
    if (
      typeof start !== "number" || typeof end !== "number" ||
      !Number.isSafeInteger(start) || !Number.isSafeInteger(end) ||
      start < 0 || end <= start || end > draft.length
    ) {
      throw new Error("AI-tjänsten gav ett svar som inte kunde visas.");
    }
    return { skill: skills[index], level, start, end, quote: draft.slice(start, end), strength: part.strength, next: part.next, found };
  });
}
