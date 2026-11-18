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
};

type CheckInRequest = {
  mode: "choice" | "text";
  question: string;
  answer: string;
  focus: string;
  isCorrect?: boolean;
  learningContext?: LearningContext;
};

export type CheckInFeedback = {
  kind: "on_track" | "retry";
  feedback: string;
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

  return { kind: result.kind, feedback: result.feedback };
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
