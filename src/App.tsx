import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import FinalRecall from "./components/FinalRecall";
import DemoTeacherInbox from "./components/DemoTeacherInbox";
import FinalDiagnosisChecklist from "./components/FinalDiagnosisChecklist";
import SubmissionChecklist from "./components/SubmissionChecklist";
import ProgressMap, { mapSkills, MapWheel } from "./components/ProgressMap";
import { buildPart, mapFeatures, readByRule, readText } from "../server/writingMap.mjs";
import PracticeRound from "./components/PracticeRound";
import { effortTimes, minTaskWords } from "./lib/effort";
import LessonEntryCheck from "./components/LessonEntryCheck";
import LessonCheckIn from "./components/LessonCheckIn";
import ExamplePick from "./components/ExamplePick";
import ErrorHunt from "./components/ErrorHunt";
import EddaFeedback, { EddaMark } from "./components/EddaFeedback";
import ExemplarPanel, { type ExemplarMode } from "./components/ExemplarPanel";
import ReadingSettings, { ReadingRuler } from "./components/ReadingSettings";
import { exemplarFocus, exemplarTexts, modellingFlow } from "./data/exemplars";
import {
  maxOwnTopicLength,
  maxRecipientLength,
  ownTopic,
  readSavedRecipient,
  readSavedTopic,
  recipientStorageKey,
  recipients,
  topicStorageKey,
  topicToSave,
  writingTopics,
  type WritingTopic,
} from "./data/topics";
import { useFitToHeight } from "./lib/useFitToHeight";
import { setSoundOn, useSoundOn } from "./lib/eddaVoice";
import { readingStyle, takesMoreRoom, useReadingSettings } from "./lib/readingSettings";
import { useExemplarAudio } from "./lib/useExemplarAudio";
import { AfterWriting, BoardSequence, BoardStep, Written } from "./components/BoardWriting";
import { finalRecallQuestions, lessons, phases, type LearningEvidence, type SkillId } from "./data/lessons";
import {
  reviewDraft,
  type Finding,
  submitCheckIn,
  type CheckInFeedback,
  type ReviewFeedback,
  requestLocate,
  requestProgressMap,
  setStudentModel,
  type MapPart,
  type MapSkill,
} from "./lib/coachApi";
import {
  clearLearnerProfile,
  emptyLearnerProfile,
  getEvidenceSummaries,
  getLatestEvidence,
  readLearnerProfile,
  recordEvidence as appendEvidence,
  writeLearnerProfile,
  type LearnerProfile,
} from "./lib/learnerProfile";
import {
  clearDemoSubmissions,
  readDemoSubmissions,
  saveDemoSubmission,
  type DemoSubmission,
  readDemoMaps,
  saveDemoMap,
  type DemoSharedMap,
} from "./lib/demoSubmissions";

const storageKey = "skrivcoach-argumenterande-draft";
const diagnosisPrompt = "Ta ställning: Borde ungdomar få åka gratis med kollektivtrafiken i sin kommun?";

function readSavedDraft(): { draft: string; error: boolean } {
  try {
    return { draft: window.localStorage.getItem(storageKey) ?? "", error: false };
  } catch {
    return { draft: "", error: true };
  }
}

/** The open question while the student looks around in the exemplar alone, one per part of the text. */
const exploreAsks: Record<MapSkill, string> = {
  structure: "Vilka delar bygger upp texten?",
  reasoning: "Var gör skribenten sina argument starka?",
  cohesion: "Vilka ord binder ihop texten?",
  sentence: "Var varierar skribenten sitt språk?",
  language: "Var är skiljetecken och ord noga valda?",
};

/**
 * For each thing that can be missing in the student's text: the place in the exemplar that shows
 * it (an index into the chapter's marked places). Edda goes back to that place and explains it.
 */
const gapExamples: Partial<Record<MapSkill, Record<string, number>>> = {
  structure: { heading: 0, thesis: 1, arguments: 3, counter: 4, conclusion: 5 },
  reasoning: { reason: 0, explain: 1, example: 1, consequence: 2, rebuttal: 5 },
  cohesion: { order: 2, cause: 1, effect: 3, contrast: 0, addition: 4 },
  sentence: { starts: 1, lengths: 0, wording: 4 },
  language: { formal: 2 },
};

/**
 * How each chapter is tied to what the student has already written: the thing to look for in the
 * student's own text, and what Edda says when it is there. Her sentence is the course's own; the
 * student's words are shown on the board and are never sent to the voice service.
 */
const chapterBridges: Partial<Record<number, { skill: MapSkill; feature: string; say: string }>> = {
  1: { skill: "structure", feature: "thesis", say: "Du har redan en tes i din text. Nu tittar vi på hur skälen för den blir starka." },
  2: { skill: "structure", feature: "arguments", say: "Du har redan argument i din text. Nu tittar vi på hur de binds ihop." },
  3: { skill: "cohesion", feature: "order", say: "Du binder redan ihop din text med sambandsord. Nu tittar vi på hur meningarna kan låta olika." },
  4: { skill: "structure", feature: "conclusion", say: "Din text har nu en avslutning. Nu putsar vi språket." },
};

/**
 * What each chapter's writing task asks the student to write, as things from the writing map, in
 * the order Edda goes back to them: the introduction with a thesis first, then arguments and how
 * they are developed, the counter-argument and linking words, the conclusion and sentence variation,
 * and last the writing rules.
 */
const taskFeatures: [MapSkill, string][][] = [
  [["structure", "heading"], ["structure", "thesis"]],
  [["structure", "arguments"], ["reasoning", "reason"], ["reasoning", "explain"], ["reasoning", "consequence"]],
  [["structure", "counter"], ["reasoning", "rebuttal"], ["cohesion", "order"], ["cohesion", "cause"], ["cohesion", "contrast"]],
  [["structure", "conclusion"], ["sentence", "starts"], ["sentence", "lengths"]],
  [["language", "capitals"], ["language", "endmarks"], ["language", "formal"]],
];

/** The parts of the writing map that follow plain rules and therefore follow the text as it is written. */
const liveSkills: MapSkill[] = ["cohesion", "sentence"];

/** Where in the exemplar a quote is, said the way a teacher would point: a hint, not the answer. */
function placeInExemplar(quote: string): string {
  const text = exemplarTexts.strong;
  if (text.title.includes(quote)) return "rubriken";
  const index = text.paragraphs.findIndex((paragraph) => paragraph.includes(quote));
  if (index <= 0) return index === 0 ? "inledningen" : "texten en gång till";
  return index === text.paragraphs.length - 1 ? "avslutningen" : `stycke ${index + 1}`;
}

function App() {
  const [lessonIndex, setLessonIndex] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [savedDraft] = useState(readSavedDraft);
  const [savedLearnerProfile] = useState(() => {
    try {
      return readLearnerProfile(window.localStorage);
    } catch {
      return { profile: emptyLearnerProfile, error: true };
    }
  });
  const [draft, setDraft] = useState(savedDraft.draft);
  const [diagnosisDraft, setDiagnosisDraft] = useState("");
  const [revisionDraft, setRevisionDraft] = useState("");
  const [isSeparateRevision, setIsSeparateRevision] = useState(false);
  const [isDiagnosisSubmitted, setIsDiagnosisSubmitted] = useState(false);
  const [teacherSubmissionId, setTeacherSubmissionId] = useState<string | null>(null);
  const [demoSubmissions, setDemoSubmissions] = useState<DemoSubmission[]>([]);
  const [showTeacherInbox, setShowTeacherInbox] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [learnerProfile, setLearnerProfile] = useState<LearnerProfile>(savedLearnerProfile.profile);
  const [profileLoadError, setProfileLoadError] = useState(savedLearnerProfile.error);
  const [profileSaveError, setProfileSaveError] = useState(false);
  // In the modelling step the student first looks for each part themselves, by clicking in the
  // text. The state belongs to one page of one board; Edda shows the answer after two tries.
  const [pagePick, setPagePick] = useState<{
    board: string;
    page: number;
    selected: number | null;
    solved: boolean;
    revealed: boolean;
    attempt: number;
    submitting: boolean;
    feedback: CheckInFeedback | null;
    error: string | null;
    /** The place was found while Edda explains briefly: her words are shown without being read aloud. */
    brief?: boolean;
  } | null>(null);
  // How the walk-through of the exemplar has gone in each chapter. Edda follows it and adjusts the
  // support herself, without asking: shorter explanations for the one who finds the places alone,
  // and help that comes by itself for the one who is stuck.
  const [walks, setWalks] = useState<Record<number, {
    /** Places found at the first try, in a row. */
    streak: number;
    found: number;
    misses: number;
    reveals: number;
    /** The page where Edda says that she now explains more briefly. */
    toldAt: number | null;
  }>>({});
  // Before Edda asks her questions, the student looks around in the exemplar on their own. What
  // the student finds is not gone through again; Edda only takes up what is left.
  const [explores, setExplores] = useState<Record<number, { found: number[]; stray: number; latest: number | null; done: boolean }>>({});
  const [completedEntryLessons, setCompletedEntryLessons] = useState<number[]>([]);
  const [seenBoards, setSeenBoards] = useState<string[]>([]);
  const [hasMetExemplar, setHasMetExemplar] = useState(false);
  // The lesson opens with a welcome where the student chooses what to write about.
  const [hasStarted, setHasStarted] = useState(false);
  // Edda reads her guidance aloud; the student can turn her voice off.
  const soundOn = useSoundOn();
  const reading = useReadingSettings();
  const writingCardRef = useRef<HTMLElement>(null);
  const [topic, setTopic] = useState<WritingTopic>(() => {
    try {
      return readSavedTopic(window.localStorage);
    } catch {
      return writingTopics[0];
    }
  });
  // Who the student wants to convince, and the choices on the welcome board before the lesson starts.
  const [recipient, setRecipient] = useState(() => {
    try {
      return readSavedRecipient(window.localStorage);
    } catch {
      return recipients[0];
    }
  });
  const [chosenTopic, setChosenTopic] = useState<WritingTopic | null>(null);
  const [ownTopicText, setOwnTopicText] = useState("");
  const [ownRecipientText, setOwnRecipientText] = useState("");
  // The read-aloud is started from the whiteboard; when it ends the lesson begins.
  const exemplarAudio = useExemplarAudio(() => setHasMetExemplar(true));
  // What the student has shown they can do, per lesson (index into lesson.canDo), and their first
  // answer in each lesson. Kept only in this session; never stored or sent anywhere.
  const [achievements, setAchievements] = useState<Record<number, number[]>>({});
  const [entryAnswers, setEntryAnswers] = useState<Record<number, string>>({});
  const [boardPage, setBoardPage] = useState<{ board: string; page: number } | null>(null);
  // The lesson is guided: the student moves forward one step at a time. Adding ?fri to the address
  // unlocks free navigation between chapters and steps, for demonstration and review.
  const [freeNavigation] = useState(() => new URLSearchParams(window.location.search).has("fri"));
  // Boards where the student has answered the check or finished the task of that step.
  const [attemptedBoards, setAttemptedBoards] = useState<string[]>([]);
  // Boards where the student has chosen between Edda's two examples before the writing task.
  const [pickedExamples, setPickedExamples] = useState<string[]>([]);
  const [showFinalRecall, setShowFinalRecall] = useState(false);
  const [finalRecallIndex, setFinalRecallIndex] = useState(0);
  const [finalRecallAnswers, setFinalRecallAnswers] = useState<string[]>([]);
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const boardSurfaceRef = useRef<HTMLDivElement>(null);
  const boardContentRef = useRef<HTMLDivElement>(null);
  // Keep the whole whiteboard visible in the window; the query matches the fitted layout in styles.css.
  useFitToHeight(boardSurfaceRef, boardContentRef, "(min-width: 901px) and (min-height: 480px)");
  const editorWrapRef = useRef<HTMLDivElement>(null);
  const findingButtonsRef = useRef(new Map<string, HTMLButtonElement>());
  const reviewRequestId = useRef(0);
  const [showHint, setShowHint] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewFeedback, setReviewFeedback] = useState<ReviewFeedback | null>(null);
  // "task": Edda read the text when the student finished a writing task. "request": the student asked.
  const [reviewSource, setReviewSource] = useState<"task" | "request">("request");
  const [activeFinding, setActiveFinding] = useState<string | null>(null);
  const [isRevising, setIsRevising] = useState(false);
  const [editorScrollTop, setEditorScrollTop] = useState(0);
  const [popoverPosition, setPopoverPosition] = useState({ left: 8, top: 8 });
  // Self-check: for each statement the student marks the place in their own text that shows it.
  const [selfMarks, setSelfMarks] = useState<Record<string, string>>({});
  // The writing map: Edda's latest reading of the student's own text, bound to the text she read.
  const [progressMap, setProgressMap] = useState<{ draft: string; parts: MapPart[] } | null>(null);
  const [mapSelected, setMapSelected] = useState<MapSkill | null>(null);
  const mapReadings = useRef(new Map<string, MapPart[]>());
  // After a writing task Edda goes back to what is still missing in the student's text: she shows
  // how the exemplar does just that, the student tries it in the own text, and she reads again.
  const [taskLoop, setTaskLoop] = useState<{
    board: string;
    round: number;
    /** The thing that is missing (a part and an id from the course's list) and Edda's hint for it. */
    skill: MapSkill;
    feature: string;
    hint: string;
    /** The place in the exemplar that shows it, if there is one. */
    example: number | null;
    stage: "praise" | "model" | "try" | "done";
    /** The text Edda last read. */
    draft: string;
    /** What the student tried last time is now in the text. */
    closed: boolean;
    reading: boolean;
  } | null>(null);
  // More practice on a part the student has chosen in the map, and the text when the practice began.
  const [practice, setPractice] = useState<{ skill: MapSkill; level: number; hint: string; draft: string } | null>(null);
  // Maps the student has chosen to show the teacher (a local demo), and the text of the map last shown.
  const [sharedMaps, setSharedMaps] = useState<DemoSharedMap[]>([]);
  const [sharedMapDraft, setSharedMapDraft] = useState<string | null>(null);
  const [mapShareError, setMapShareError] = useState<string | null>(null);
  const [mapLoading, setMapLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selfCheck, setSelfCheck] = useState<
    | { key: string; state: "loading" | "empty" | "missing" }
    | { key: string; state: "error"; message: string }
    | { key: string; state: "shown"; start: number; end: number; draft: string }
    | null
  >(null);
  // The advice Edda gave after a writing task, kept while the student tries it in the text.
  const [taskAdvice, setTaskAdvice] = useState<{ board: string; message: string; reviewedDraft: string; round: 1 | 2 } | null>(null);
  const [saveError, setSaveError] = useState(savedDraft.error);

  const lesson = lessons[lessonIndex];
  const phase = phases[phaseIndex];
  const learningEvidence = getLatestEvidence(learnerProfile);
  const priorEvidence = getEvidenceSummaries(learnerProfile).map(({ skillId, latest, ...summary }) => ({
    skillId,
    evidence: latest,
    ...summary,
  }));
  const isFinalDiagnosis = lessonIndex === lessons.length - 1 && phaseIndex === phases.length - 1 && !showFinalRecall;
  const isFinalRecall = showFinalRecall;
  const hasCompletedEntry = completedEntryLessons.includes(lessonIndex);
  const activeDraft = isFinalDiagnosis
    ? isSeparateRevision ? revisionDraft : diagnosisDraft
    : draft;
  // After a writing task Edda points at one thing to develop; on request she may point at up to three.
  // While Edda goes back to something missing, that is the one thing in focus: no other mark competes with it.
  const isClosingGap = taskLoop !== null && taskLoop.board === `${lessonIndex}-${phaseIndex}`;
  const findings = reviewFeedback
    ? reviewSource === "task" ? (isClosingGap ? [] : reviewFeedback.findings.slice(0, 1)) : reviewFeedback.findings
    : null;
  // The strength is marked in the text too, so that it is as visible as what can be developed.
  const strength = reviewFeedback
    && !findings?.some((finding) => finding.start < reviewFeedback.success.end && reviewFeedback.success.start < finding.end)
    ? reviewFeedback.success
    : null;
  // Edda's yellow mark from the self-check belongs to the text version she read and to that step only.
  const selfSpot = selfCheck?.state === "shown" && selfCheck.draft === activeDraft && selfCheck.key.startsWith(`${lessonIndex}-${phaseIndex}:`) && phaseIndex === 3
    ? selfCheck
    : null;
  // At the end of a chapter the writing map is on the board. The chosen part's evidence is then
  // shown in green in the text, as long as the text is the one Edda read.
  const hasProgressMap = !isFinalDiagnosis && !isFinalRecall && (lessonIndex < lessons.length - 1 ? phaseIndex === 4 : phaseIndex === 3);
  // The parts Edda has gone through so far. The map shows these; the part of the next chapter is
  // read too, so that Edda knows what the student's text already shows before she teaches it.
  const taughtSkills = mapSkills.map(({ skill }) => skill).filter((skill) =>
    lessons.slice(0, lessonIndex + 1).some((item) => item.skillIds.includes(skill)));
  // Linking words and sentence variation follow plain rules, so those parts of the map follow the
  // text while the student writes. The other parts are from Edda's latest reading.
  const liveParts = useMemo(() => {
    if (!draft.trim()) return [];
    const text = readText(draft);
    return liveSkills.map((skill) => buildPart(draft, skill, readByRule(draft, skill, text), text) as MapPart);
  }, [draft]);
  const mapNow: MapPart[] = mapSkills.flatMap(({ skill }) => {
    const part = liveParts.find((item) => item.skill === skill) ?? progressMap?.parts.find((item) => item.skill === skill);
    return part ? [part] : [];
  });
  // What Edda knows about this student, for every answer she gives: what the text already shows
  // and what comes next, in the course's own words (never the student's text).
  const knownLines = mapNow.filter((part) => taughtSkills.includes(part.skill)).flatMap((part) =>
    mapFeatures[part.skill].filter((feature) => part.lacks && !part.lacks.includes(feature.id)).map((feature) => feature.praise));
  const nextLines = mapNow.filter((part) => taughtSkills.includes(part.skill)).flatMap((part) =>
    mapFeatures[part.skill].filter((feature) => part.lacks?.includes(feature.id)).slice(0, 1).map((feature) => feature.hint));
  const modelKey = `${lessonIndex}|${knownLines.join("|")}|${nextLines.join("|")}`;
  useEffect(() => {
    setStudentModel(hasStarted ? {
      knows: knownLines.slice(0, 24),
      next: nextLines.slice(0, 6),
      taught: lessons.slice(0, lessonIndex + 1).map((item) => item.shortTitle),
      upcoming: lessons.slice(lessonIndex + 1, lessons.length - 1).map((item) => item.shortTitle),
    } : null);
    // The lines are the course's own sentences; the key changes when they do.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelKey, hasStarted]);
  const mapLevels = Object.fromEntries(mapNow.map((part) => [part.skill, part.level])) as Partial<Record<MapSkill, number>>;
  // A new chapter starts in what the student's text already has: Edda names it, and the student's
  // own words are shown, before the new thing is built on top of it.
  const bridge = chapterBridges[lessonIndex];
  const bridgeQuote = !bridge
    ? null
    : liveSkills.includes(bridge.skill)
      ? liveParts.find((part) => part.skill === bridge.skill && part.level > 0)?.quote ?? null
      : progressMap?.parts.find((part) => part.skill === bridge.skill)?.found.find((entry) => entry.id === bridge.feature)?.quote ?? null;
  const ownBridge = bridge && bridgeQuote && draft.includes(bridgeQuote) ? { say: bridge.say, quote: bridgeQuote } : null;
  // The map is shown when Edda has read the text, which she does when the student hands in a writing task.
  const shownMap = progressMap ? mapNow.filter((part) => taughtSkills.includes(part.skill)) : null;
  const mapPart = hasProgressMap
    ? shownMap?.find((part) => part.skill === mapSelected && part.start !== undefined
      && (liveSkills.includes(part.skill) || progressMap?.draft === activeDraft)) ?? null
    : null;
  const textMarks = selfSpot
    ? [{ kind: "self" as const, start: selfSpot.start, end: selfSpot.end }]
    : mapPart
      ? [{ kind: "strength" as const, start: mapPart.start ?? 0, end: mapPart.end ?? 0 }]
    : [
      ...(findings ?? []).map((finding) => ({ kind: "finding" as const, start: finding.start, end: finding.end, finding })),
      ...(strength ? [{ kind: "strength" as const, start: strength.start, end: strength.end }] : []),
    ].sort((a, b) => a.start - b.start);
  const wordCount = useMemo(() => activeDraft.trim().split(/\s+/).filter(Boolean).length, [activeDraft]);
  const recommendedLessonIndex = reviewFeedback?.findings.length
    ? lessons.findIndex((item) => item.skillIds.includes(reviewFeedback.findings[0].category))
    : -1;

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, draft);
      setSaveError(false);
    } catch {
      setSaveError(true);
    }
  }, [draft]);

  useEffect(() => {
    if (profileLoadError) return;
    try {
      setProfileSaveError(!writeLearnerProfile(window.localStorage, learnerProfile));
    } catch {
      setProfileSaveError(true);
    }
  }, [learnerProfile, profileLoadError]);

  function updateDraft(value: string) {
    reviewRequestId.current += 1;
    const editingSeparateRevision = isFinalDiagnosis && isSeparateRevision && teacherSubmissionId !== null;
    if (editingSeparateRevision) {
      setRevisionDraft(value);
    } else if (isFinalDiagnosis) {
      setDiagnosisDraft(value);
    } else {
      setDraft(value);
    }
    setReviewFeedback(null);
    setActiveFinding(null);
    setIsRevising(false);
    setReviewError(null);
    setReviewLoading(false);
    if (!editingSeparateRevision) {
      setIsDiagnosisSubmitted(false);
      setTeacherSubmissionId(null);
      setSubmissionError(null);
    }
  }

  function selectLesson(index: number) {
    reviewRequestId.current += 1;
    setLessonIndex(index);
    setPhaseIndex(0);
    setShowHint(false);
    setSelfCheck(null);
    setReviewFeedback(null);
    setActiveFinding(null);
    setIsRevising(false);
    setReviewError(null);
    setReviewLoading(false);
    setIsDiagnosisSubmitted(false);
    setTeacherSubmissionId(null);
    setSubmissionError(null);
    setShowFinalRecall(false);
    setIsSeparateRevision(false);
    setRevisionDraft("");
  }

  function movePhase(index: number) {
    if (lessonIndex === lessons.length - 1 && index === phases.length - 1 && !showFinalRecall) {
      reviewRequestId.current += 1;
      setShowFinalRecall(true);
      setFinalRecallIndex(0);
      setFinalRecallAnswers([]);
      setReviewFeedback(null);
      setReviewError(null);
      setReviewLoading(false);
      setActiveFinding(null);
      return;
    }

    reviewRequestId.current += 1;
    setPhaseIndex(index);
    setShowHint(false);
    setSelfCheck(null);
    setReviewFeedback(null);
    setActiveFinding(null);
    setIsRevising(false);
    setReviewError(null);
    setReviewLoading(false);
    setIsDiagnosisSubmitted(false);
    setTeacherSubmissionId(null);
    setSubmissionError(null);
    setIsSeparateRevision(false);
    setRevisionDraft("");
    setShowFinalRecall(false);
  }

  function recordEvidence(skillIds: SkillId[], evidence: LearningEvidence) {
    setLearnerProfile((current) => appendEvidence(current, skillIds, evidence));
  }

  function recordCheck(skillIds: SkillId[], evidence: LearningEvidence) {
    recordEvidence(skillIds, evidence);
    if (evidence !== "needs_support") earnAchievement();
  }

  /** Adds the current step to what the student has shown they can do in this chapter. */
  function earnAchievement() {
    if (phaseIndex > 3) return;
    setAchievements((current) => {
      const earned = current[lessonIndex] ?? [];
      return earned.includes(phaseIndex) ? current : { ...current, [lessonIndex]: [...earned, phaseIndex].sort() };
    });
  }

  /** The student is done with the chapter's writing task: Edda reads what they wrote. */
  async function finishWritingTask() {
    // The last chapter is written without support, so Edda does not read the text here.
    if (lesson.taskLink) {
      const reviewedDraft = draft;
      const result = await runReview(lesson.practice);
      const advice = result?.findings[0]?.message;
      setTaskAdvice(advice ? { board: boardKey, message: advice, reviewedDraft, round: 1 } : null);
    }
    // A failing service must not lock the student in the step.
    markAttempted();
    earnAchievement();
    // The same hand-in lets Edda bring the writing map up to date, so that it needs no click of its own.
    const handedIn = draft;
    const parts = await assessProgress(true);
    // What is still missing of the chapter's part decides what Edda goes back to.
    const gap = lesson.taskLink ? gapIn(parts, handedIn) : null;
    if (gap) {
      setTaskAdvice(null);
      setTaskLoop({ board: boardKey, round: 1, ...gap, stage: gap.example !== null ? "praise" : "try", draft: handedIn, closed: false, reading: false });
    }
  }

  /**
   * The first thing this chapter's writing task asked for that is missing in the text, with the
   * exemplar's place for it. Edda does not go back to things the student has not been asked to write yet.
   */
  function gapIn(parts: MapPart[] | null, text: string) {
    for (const [skill, feature] of taskFeatures[lessonIndex] ?? []) {
      const part = liveSkills.includes(skill)
        ? buildPart(text, skill, readByRule(text, skill)) as MapPart
        : parts?.find((item) => item.skill === skill);
      if (!part?.lacks?.includes(feature)) continue;
      const hint = mapFeatures[skill].find((item) => item.id === feature)?.hint ?? "";
      return { skill, feature, hint, example: gapExamples[skill]?.[feature] ?? null };
    }
    return null;
  }

  /** The student has tried it in the text: Edda reads again and goes back to the next thing, at most twice. */
  async function readAfterTrying() {
    if (!loop) return;
    const tried = draft;
    setTaskLoop({ ...loop, reading: true });
    const gap = gapIn(await assessProgress(true), tried);
    const closed = !gap || gap.feature !== loop.feature || gap.skill !== loop.skill;
    if (gap && loop.round < 2) {
      setTaskLoop({ board: loop.board, round: loop.round + 1, ...gap, stage: gap.example !== null ? "model" : "try", draft: tried, closed, reading: false });
    } else {
      setTaskLoop({ ...loop, stage: "done", draft: tried, closed, reading: false });
    }
  }

  /** The student has tried Edda's advice in their text and asks her to look again. */
  async function retryWritingTask() {
    if (!taskAdvice) return;
    const result = await runReview(lesson.practice, taskAdvice.message);
    if (result) setTaskAdvice({ ...taskAdvice, reviewedDraft: draft, round: 2 });
    void assessProgress(true);
  }

  /** Self-check: the student selects the place in their own text that shows the statement. */
  // The writing map: on the student's request Edda reads the text and says how far each part has come.
  async function assessProgress(isQuiet = false) {
    const assessedDraft = draft;
    // The next chapter's part is read too: Edda then knows what the text already shows of it.
    const upcoming = lessons[lessonIndex + 1]?.skillIds.length === 1 ? lessons[lessonIndex + 1].skillIds : [];
    const skills = mapSkills.map(({ skill }) => skill).filter((skill) => taughtSkills.includes(skill) || upcoming.includes(skill));
    if (!assessedDraft.trim() || skills.length === 0) return null;
    if (!isQuiet) setMapLoading(true);
    setMapError(null);
    try {
      // The same text always gives the same map: a text Edda has already read is not read again.
      const key = `${skills.join(",")}\n${assessedDraft}`;
      const parts = mapReadings.current.get(key) ?? await requestProgressMap(assessedDraft, skills, progressMap?.parts ?? []);
      mapReadings.current.set(key, parts);
      setProgressMap({ draft: assessedDraft, parts });
      // Only the map is shown at first. Edda says more about a part when the student chooses it.
      setMapSelected(null);
      return parts;
    } catch (error) {
      // When Edda reads on her own after a writing task, a failure is not the student's concern.
      if (!isQuiet) setMapError(error instanceof Error ? error.message : "Edda kunde inte läsa texten just nu.");
      return null;
    } finally {
      if (!isQuiet) setMapLoading(false);
    }
  }

  // The student chooses to show the map to the teacher. In the prototype it is saved in this browser only.
  function shareMapWithTeacher() {
    if (!progressMap) return;
    try {
      const result = saveDemoMap(window.localStorage, `kapitel ${lessonIndex + 1}: ${lesson.shortTitle}`, shownMap ?? progressMap.parts);
      if (result.error || !result.map) {
        setMapShareError("Skrivkartan kunde inte visas för läraren. Kontrollera webbläsarens lagring och försök igen.");
        return;
      }
      const shared = result.map;
      setSharedMaps((current) => [...current, shared]);
      setSharedMapDraft(progressMap.draft);
      setMapShareError(null);
    } catch {
      setMapShareError("Skrivkartan kunde inte visas för läraren. Kontrollera webbläsarens lagring och försök igen.");
    }
  }

  // The self-check: on the student's request Edda shows in yellow where the text shows the statement.
  async function showInOwnText(item: string) {
    const key = `${boardKey}:${item}`;
    const checkedDraft = draft;
    if (!checkedDraft.trim()) {
      setSelfCheck({ key, state: "empty" });
      return;
    }
    setSelfCheck({ key, state: "loading" });
    try {
      const place = await requestLocate(checkedDraft, item);
      if (!place.found) {
        setSelfMarks((current) => {
          const next = { ...current };
          delete next[key];
          return next;
        });
        setSelfCheck({ key, state: "missing" });
        return;
      }
      setSelfMarks((current) => ({ ...current, [key]: place.quote.length > 160 ? `${place.quote.slice(0, 157)}…` : place.quote }));
      setSelfCheck({ key, state: "shown", start: place.start, end: place.end, draft: checkedDraft });
    } catch (error) {
      setSelfCheck({ key, state: "error", message: error instanceof Error ? error.message : "Edda kunde inte läsa texten just nu." });
    }
  }

  function startLesson(chosen: WritingTopic, reader: string) {
    setTopic(chosen);
    setRecipient(reader);
    setHasStarted(true);
    try {
      window.localStorage.setItem(topicStorageKey, topicToSave(chosen));
      window.localStorage.setItem(recipientStorageKey, reader);
    } catch {
      // The choices still apply for this visit.
    }
  }

  function completeEntryCheck(answer: string | null) {
    if (answer) setEntryAnswers((current) => current[lessonIndex] ? current : { ...current, [lessonIndex]: answer });
    setCompletedEntryLessons((current) => current.includes(lessonIndex) ? current : [...current, lessonIndex]);
  }

  function startFinalDiagnosis() {
    reviewRequestId.current += 1;
    setDiagnosisDraft("");
    setRevisionDraft("");
    setIsSeparateRevision(false);
    setShowFinalRecall(false);
    setPhaseIndex(phases.length - 1);
    setReviewFeedback(null);
    setReviewError(null);
    setReviewLoading(false);
    setActiveFinding(null);
    setIsDiagnosisSubmitted(false);
    setTeacherSubmissionId(null);
    setSubmissionError(null);
  }

  function markDiagnosisComplete() {
    setReviewFeedback(null);
    setReviewError(null);
    setActiveFinding(null);
    setIsSeparateRevision(false);
    setIsDiagnosisSubmitted(true);
  }

  function startSeparateRevision() {
    setRevisionDraft(diagnosisDraft);
    setIsSeparateRevision(true);
    setReviewFeedback(null);
    setReviewError(null);
    setActiveFinding(null);
    setIsRevising(false);
  }

  function submitDiagnosisToTeacher() {
    setSubmissionError(null);
    try {
      const result = saveDemoSubmission(
        window.localStorage,
        diagnosisDraft,
        diagnosisPrompt,
        reviewFeedback,
      );
      const submission = result.submission;
      if (result.error || !submission) {
        setSubmissionError("Den lokala demo-inlämningen kunde inte sparas. Kontrollera webbläsarens lagring och försök igen.");
        return;
      }

      setTeacherSubmissionId(submission.id);
      setDemoSubmissions((current) => [...current, submission]);
    } catch {
      setSubmissionError("Den lokala demo-inlämningen kunde inte sparas. Kontrollera webbläsarens lagring och försök igen.");
    }
  }

  function openTeacherInbox() {
    try {
      const result = readDemoSubmissions(window.localStorage);
      if (result.error) {
        setSubmissionError("Den lokala lärarvyn kunde inte läsa demo-inlämningarna.");
        return;
      }
      setDemoSubmissions(result.submissions);
      setSharedMaps(readDemoMaps(window.localStorage).maps);
      setShowTeacherInbox(true);
      setSubmissionError(null);
    } catch {
      setSubmissionError("Den lokala lärarvyn kunde inte läsa demo-inlämningarna.");
    }
  }

  function clearTeacherInbox() {
    try {
      if (!clearDemoSubmissions(window.localStorage)) {
        setSubmissionError("Demo-inlämningarna kunde inte rensas från webbläsaren.");
        return;
      }
    } catch {
      setSubmissionError("Demo-inlämningarna kunde inte rensas från webbläsaren.");
      return;
    }
    setDemoSubmissions([]);
    setSharedMaps([]);
    setSharedMapDraft(null);
    setTeacherSubmissionId(null);
    setSubmissionError(null);
  }

  function resetLearnerProfile() {
    try {
      if (!clearLearnerProfile(window.localStorage)) {
        setProfileSaveError(true);
        return;
      }
      setLearnerProfile(emptyLearnerProfile);
      setProfileLoadError(false);
      setProfileSaveError(false);
    } catch {
      setProfileSaveError(true);
    }
  }

  async function runReview(task?: string, followUp?: string): Promise<ReviewFeedback | null> {
    const requestId = ++reviewRequestId.current;
    setReviewSource(task ? "task" : "request");
    const reviewedDraft = activeDraft;
    const reviewedLesson = lesson;
    const reviewedPhase = phase;
    setReviewLoading(true);
    setReviewError(null);
    setReviewFeedback(null);
    setActiveFinding(null);
    setIsRevising(false);

    try {
      const result = await reviewDraft({
        draft: reviewedDraft,
        lessonTitle: reviewedLesson.title,
        phase: reviewedPhase,
        goal: reviewedLesson.goal,
        criteria: reviewedLesson.criteria,
        ...(task && { task }),
        ...(followUp && { followUp }),
      });
      if (reviewRequestId.current !== requestId) return null;
      setReviewFeedback(result);
      if (isFinalDiagnosis && !isSeparateRevision) setTeacherSubmissionId(null);
      return result;
    } catch (error) {
      if (reviewRequestId.current !== requestId) return null;
      setReviewError(error instanceof Error ? error.message : "AI-granskningen misslyckades. Försök igen.");
      return null;
    } finally {
      if (reviewRequestId.current === requestId) setReviewLoading(false);
    }
  }

  function toggleFinding(finding: Finding, button: HTMLButtonElement) {
    if (activeFinding === finding.id) {
      setActiveFinding(null);
      return;
    }

    const wrapper = editorWrapRef.current;
    if (wrapper) {
      const wrapperRect = wrapper.getBoundingClientRect();
      const buttonRect = button.getBoundingClientRect();
      const popoverWidth = Math.min(280, Math.max(wrapper.clientWidth - 16, 0));
      const left = Math.max(8, Math.min(
        buttonRect.left - wrapperRect.left,
        wrapper.clientWidth - popoverWidth - 8,
      ));
      const below = buttonRect.bottom - wrapperRect.top + 6;
      const top = below + 120 <= wrapper.clientHeight
        ? below
        : Math.max(8, buttonRect.top - wrapperRect.top - 126);
      setPopoverPosition({ left, top });
    }

    setActiveFinding(finding.id);
  }

  function continueWriting(finding: Finding) {
    const editor = editorRef.current;
    if (!editor) return;
    setActiveFinding(null);
    setIsRevising(true);
    editor.focus();
    editor.setSelectionRange(finding.start, finding.end);
  }

  const boardKey = `${lessonIndex}-${phaseIndex}`;
  // The exemplar text supports the lesson, but is hidden when the student should recall or be assessed without a model.
  // Before the exemplar is presented, the student first retrieves what they already know.
  // Edda decides what the writing surface shows. The exemplar text belongs to the opening and the
  // modelling of chapters 1–5; in every other step the student works in their own text.
  // Before the exemplar is presented, the student first retrieves what they already know.
  const exemplarAvailable = !isFinalDiagnosis
    && !isFinalRecall
    && (hasMetExemplar || hasCompletedEntry)
    && lessonIndex < lessons.length - 1
    && phaseIndex === 0;
  // The student meets the exemplar by listening to it once, right after the first entry question.
  const isListeningIntro = exemplarAvailable && !hasMetExemplar;
  // At the very start the writing surface is blank: neither the exemplar nor a saved draft is shown yet.
  const isBlankStart = !hasStarted || (!isFinalDiagnosis
    && !isFinalRecall
    && !hasMetExemplar
    && !hasCompletedEntry
    && lessonIndex < lessons.length - 1);
  // When Edda shows how the exemplar does something that is missing, the exemplar is back beside the board.
  const loop = taskLoop?.board === boardKey ? taskLoop : null;
  const gapWalk = exemplarFocus[loop?.skill ?? lesson.skillIds[0]].highlights.strong;
  const surfaceView = exemplarAvailable || loop?.stage === "model" ? "exemplar" : "draft";
  const hasBoardCheck = phaseIndex < 4 || lesson.exitTicket !== null;
  // In guided mode the next step opens when the whole board has been shown and the student has
  // answered its check or finished its task.
  // In the last chapter the writing task ends with a checklist for the whole text, while the student's
  // own text is still shown beside the board and before the final recall and diagnosis begin.
  const hasSubmissionChecklist = phaseIndex === 1 && lessonIndex === lessons.length - 1;
  // What the student's own text already shows of this chapter's part (from the writing map).
  const alreadyInText = lesson.skillIds.length === 1 && (mapLevels[lesson.skillIds[0]] ?? 0) >= 2;
  const walk = walks[lessonIndex] ?? { streak: alreadyInText ? 2 : 0, found: 0, misses: 0, reveals: 0, toldAt: null };
  // Edda explains more briefly while the student keeps finding the places at the first try.
  const explainsBriefly = walk.streak >= 2;
  // The student found the places in the walk-through alone: all of them with at most one miss and
  // without Edda showing any. Then the example before the writing task is not needed.
  const foundAlone = walk.found >= 2 && walk.reveals === 0 && walk.misses <= 1;
  const canAdvance = freeNavigation
    || (seenBoards.includes(boardKey) && (!hasBoardCheck || attemptedBoards.includes(boardKey)));

  function markAttempted() {
    setAttemptedBoards((current) => current.includes(boardKey) ? current : [...current, boardKey]);
  }

  // In the modelling step the whiteboard walks through the exemplar: comparisons of two examples,
  // one part of the text at a time, and checks right after the parts they are about.
  const modelling = exemplarAvailable && phaseIndex === 0 ? exemplarFocus[lesson.skillIds[0]] : null;
  const walkthrough = modelling?.highlights.strong ?? [];
  const comparisons = modelling?.comparisons ?? [];
  // Some chapters end the modelling with an error hunt on the whiteboard instead.
  const errorHunt = modelling?.hunt ?? null;
  // How much the student explores on their own follows how the last chapter went, so that nobody
  // is left alone longer than they can manage: wide for the one who found the places alone (or whose
  // own text already shows this chapter's part), none for the one who needed Edda to show the way.
  const lastWalk = walks[lessonIndex - 1];
  const exploring: "wide" | "short" | "none" = !effortTimes.explore || walkthrough.length === 0
    ? "none"
    : lastWalk && (lastWalk.reveals >= 1 || lastWalk.misses >= 3)
      ? "none"
      : alreadyInText || (lastWalk && lastWalk.found >= 2 && lastWalk.misses <= 1) ? "wide" : "short";
  // A student who needed Edda to show the way in the last chapter gets clear examples: Edda shows
  // every other place herself, and the student tries the ones in between.
  const needsModelling = Boolean(lastWalk && (lastWalk.reveals >= 1 || lastWalk.misses >= 3));
  const explore = explores[lessonIndex] ?? { found: [], stray: 0, latest: null, done: false };
  const isExploring = exploring !== "none" && !explore.done;
  // After the exploration the board starts again with what is left.
  const boardStage = exploring !== "none" && explore.done ? `${boardKey}:rest` : boardKey;
  type BoardPage =
    | { kind: "explore" }
    | { kind: "compare"; comparisonIndex: number; pairIndex: number | null }
    | { kind: "part"; index: number; number: number };
  // Board page 0 is the goal; these pages follow it, in the chapter's own order.
  const boardPages: BoardPage[] = [];
  if (modelling && isExploring) {
    boardPages.push({ kind: "explore" });
  } else if (modelling) {
    let partNumber = 0;
    for (const step of modellingFlow(modelling)) {
      if ("compare" in step) {
        boardPages.push({ kind: "compare", comparisonIndex: step.compare, pairIndex: null });
        comparisons[step.compare].pairs.forEach((_, pairIndex) => {
          boardPages.push({ kind: "compare", comparisonIndex: step.compare, pairIndex });
        });
      } else if (!explore.found.includes(step.part)) {
        // What the student found on their own is not gone through again.
        partNumber += 1;
        boardPages.push({ kind: "part", index: step.part, number: partNumber });
      }
    }
  }
  const currentBoardPage = boardPage?.board === boardKey ? boardPage.page : 0;
  const currentPage = hasCompletedEntry && currentBoardPage >= 1 ? boardPages[currentBoardPage - 1] ?? null : null;
  const isComparePage = currentPage?.kind === "compare";
  const comparison = currentPage?.kind === "compare" ? comparisons[currentPage.comparisonIndex] : null;
  const pairIndex = currentPage?.kind === "compare" ? currentPage.pairIndex : null;
  const focusIndex = currentPage?.kind === "part" ? currentPage.index : null;
  const pick = pagePick?.board === boardKey && pagePick.page === currentBoardPage
    ? pagePick
    : { board: boardKey, page: currentBoardPage, selected: null, solved: false, revealed: false, attempt: 0, submitting: false, feedback: null, error: null };
  const pageKey = `${boardKey}:${currentBoardPage}`;
  // Help comes out when the student has tried for a while, not after a few quick clicks.
  const pageStarted = useRef({ key: pageKey, at: Date.now() });
  if (pageStarted.current.key !== pageKey) pageStarted.current = { key: pageKey, at: Date.now() };
  const [, setEffortTick] = useState(0);
  const workedFor = Date.now() - pageStarted.current.at;
  // Edda shows this place as an example; the student tries the next one.
  const isModelledPage = needsModelling && currentPage?.kind === "part" && currentPage.number % 2 === 1;
  // The page is done when the student found the place, or Edda has shown it.
  const isPickResolved = pick.solved || pick.revealed || isModelledPage;
  const isSearchingPart = currentPage?.kind === "part" && !isPickResolved;
  const exemplarMode: ExemplarMode = isListeningIntro
    ? "listen"
    : !hasCompletedEntry
      ? "plain"
      : isComparePage ? "compare" : isSearchingPart || currentPage?.kind === "explore" ? "pick" : focusIndex !== null ? "focus" : "plain";

  /** The student clicks where they think the answer is: a part of the exemplar or of the second example. */
  async function pickOnPage(index: number) {
    if (!currentPage || pick.submitting || isPickResolved) return;
    let target: number;
    let question: string;
    let answer: string;
    if (currentPage.kind === "part") {
      const part = walkthrough[currentPage.index];
      target = currentPage.index;
      question = part.ask ?? part.label;
      answer = walkthrough[index].quote;
    } else if (currentPage.kind === "compare" && currentPage.pairIndex !== null) {
      const item = comparisons[currentPage.comparisonIndex];
      target = currentPage.pairIndex;
      question = `Vilket ställe i den andra texten motsvarar ”${item.pairs[target].simple}”?`;
      answer = item.pairs[index].developed;
    } else {
      return;
    }

    const isCorrect = index === target;
    const attempt = pick.attempt + 1;
    // Edda does not take over after a miss. From the second try the student can ask her to show
    // the place, so that nobody gets stuck and nobody is hurried.
    const reveal = false;
    const isLastPage = currentBoardPage === boardPages.length && !errorHunt;
    const before = walk;
    const streak = isCorrect && attempt === 1 ? before.streak + 1 : isCorrect ? before.streak : 0;
    setWalks((current) => ({
      ...current,
      [lessonIndex]: {
        ...before,
        streak,
        found: before.found + (isCorrect ? 1 : 0),
        misses: before.misses + (isCorrect ? 0 : 1),
        // The first time Edda starts explaining more briefly she says so, on the next page.
        toldAt: before.toldAt === null && before.streak < 2 && streak >= 2 ? currentBoardPage + 1 : before.toldAt,
      },
    }));

    // A place that is found needs no reading by the AI: Edda's own short explanation is the answer.
    // While the student keeps finding the places at the first try it is shown without being read aloud.
    if (isCorrect) {
      setPagePick({ ...pick, selected: null, solved: true, attempt, submitting: false, feedback: null, error: null, brief: before.streak >= 2 && attempt === 1 });
      if (isLastPage) markAttempted();
      recordCheck(lesson.skillIds, attempt === 1 ? "independent" : "supported");
      return;
    }

    setPagePick({ ...pick, selected: isCorrect ? null : index, submitting: true, feedback: null, error: null });

    try {
      const feedback = await submitCheckIn({
        mode: "choice",
        question,
        answer,
        focus: lesson.checkInFocus,
        isCorrect,
        learningContext: { attempt, supportLevel: 0, priorEvidence },
      });
      setPagePick({
        ...pick,
        selected: isCorrect || reveal ? null : index,
        solved: isCorrect,
        revealed: reveal,
        attempt,
        submitting: false,
        feedback,
        error: null,
      });
      if ((isCorrect || reveal) && isLastPage) markAttempted();
      recordCheck(lesson.skillIds, !isCorrect ? "needs_support" : attempt === 1 ? "independent" : "supported");
    } catch (error) {
      // A failing service must not lock the student in the step: Edda shows the place.
      setPagePick({
        ...pick,
        selected: null,
        revealed: true,
        attempt,
        submitting: false,
        feedback: null,
        error: error instanceof Error ? error.message : "Återkopplingen misslyckades.",
      });
      if (isLastPage) markAttempted();
    }
  }

  // Help comes by itself when the student is stuck. A hint: after a try and a while on the question,
  // or after a long while without any try. Then, after a second try and longer still, Edda shows the place.
  const isStuck = !isPickResolved && !pick.submitting && (
    (pick.attempt >= 1 && workedFor >= effortTimes.hint) || workedFor >= effortTimes.idle);
  const shouldBeShown = !isPickResolved && !pick.submitting && pick.attempt >= 2 && workedFor >= effortTimes.reveal;
  const isSearching = (currentPage?.kind === "part" || (currentPage?.kind === "compare" && currentPage.pairIndex !== null)) && !isPickResolved;
  useEffect(() => {
    if (!isSearching) return;
    if (shouldBeShown) {
      showPlaceOnPage();
      return;
    }
    const waits = [effortTimes.hint - workedFor, effortTimes.reveal - workedFor, effortTimes.idle - workedFor].filter((wait) => wait > 0);
    if (waits.length === 0) return;
    const timer = window.setTimeout(() => setEffortTick((tick) => tick + 1), Math.min(...waits) + 20);
    return () => window.clearTimeout(timer);
  });

  // The writing task is the student's own work: Edda reads when the student has written something
  // new in the text since the task was given.
  const taskStart = useRef({ board: boardKey, draft, at: Date.now() });
  if (taskStart.current.board !== boardKey) taskStart.current = { board: boardKey, draft, at: Date.now() };
  // Edda notices when the text stands still in the writing task and then gives a first step, unasked.
  const lastWrite = useRef({ draft, at: Date.now() });
  if (lastWrite.current.draft !== draft) lastWrite.current = { draft, at: Date.now() };
  const isWaitingToWrite = phaseIndex === 1 && !showHint && !attemptedBoards.includes(boardKey) && !isFinalDiagnosis && !isFinalRecall;
  useEffect(() => {
    if (!isWaitingToWrite) return;
    const stillFor = Date.now() - Math.max(taskStart.current.at, lastWrite.current.at);
    if (stillFor >= effortTimes.writingIdle) {
      setShowHint(true);
      return;
    }
    const timer = window.setTimeout(() => setEffortTick((tick) => tick + 1), effortTimes.writingIdle - stillFor + 20);
    return () => window.clearTimeout(timer);
  });
  const hasWrittenForTask = draft !== taskStart.current.draft
    && draft.trim().split(/\s+/).filter(Boolean).length >= minTaskWords;

  // When the last place of the walk-through is one Edda shows, the step is done when it is shown.
  const isModelledLast = isModelledPage && currentBoardPage === boardPages.length && !errorHunt;
  useEffect(() => {
    if (isModelledLast && !attemptedBoards.includes(boardKey)) markAttempted();
  });

  const isOnExplorePage = currentPage?.kind === "explore" && isExploring;
  /** The exploration is over: the student found everything, has looked enough, or has come to a stop. */
  function endExploring(found = explore.found) {
    setExplores((current) => ({ ...current, [lessonIndex]: { ...explore, found, done: true } }));
    // When nothing is left to go through, the step is done.
    const hasMore = found.length < walkthrough.length || comparisons.length > 0 || errorHunt !== null;
    if (!hasMore) {
      setSeenBoards((current) => current.includes(boardKey) ? current : [...current, boardKey]);
      markAttempted();
    }
  }

  /** The student clicked a place in the text on their own and it is one of the chapter's parts. */
  function exploreFind(index: number) {
    if (!isOnExplorePage || explore.found.includes(index)) return;
    const found = [...explore.found, index];
    setExplores((current) => ({ ...current, [lessonIndex]: { ...explore, found, latest: index } }));
    setWalks((current) => ({ ...current, [lessonIndex]: { ...walk, streak: walk.streak + 1, found: walk.found + 1 } }));
    recordCheck(lesson.skillIds, "independent");
    pageStarted.current = { key: pageKey, at: Date.now() };
    if (found.length === walkthrough.length) endExploring(found);
  }

  /** A click in the text that is not one of the parts. Several in a row mean the student has come to a stop. */
  function exploreStray() {
    if (!isOnExplorePage) return;
    const stray = explore.stray + 1;
    if (stray >= (exploring === "wide" ? effortTimes.exploreStrayWide : effortTimes.exploreStray)) endExploring();
    else setExplores((current) => ({ ...current, [lessonIndex]: { ...explore, stray } }));
  }

  // Edda takes over when nothing has been found for a while: sooner for the one who is new to
  // looking alone, later for the one who has shown that it works.
  const exploreIdle = exploring === "wide" ? effortTimes.exploreIdleWide : effortTimes.exploreIdle;
  useEffect(() => {
    if (!isOnExplorePage) return;
    if (workedFor >= exploreIdle) {
      endExploring();
      return;
    }
    const timer = window.setTimeout(() => setEffortTick((tick) => tick + 1), exploreIdle - workedFor + 20);
    return () => window.clearTimeout(timer);
  });

  /** Edda shows the place the student has been looking for. */
  function showPlaceOnPage() {
    if (!currentPage || pick.submitting || isPickResolved) return;
    setPagePick({ ...pick, selected: null, revealed: true });
    setWalks((current) => ({ ...current, [lessonIndex]: { ...walk, streak: 0, reveals: walk.reveals + 1 } }));
    if (currentBoardPage === boardPages.length && !errorHunt) markAttempted();
  }

  const currentAdvice = taskAdvice?.board === boardKey ? taskAdvice : null;
  return (
    <main
      className={`app-shell ${isFinalDiagnosis || isFinalRecall ? "" : "is-fitted"} ${takesMoreRoom(reading) ? "has-roomy-text" : ""}`}
      style={readingStyle(reading)}
    >
      <ReadingRuler surface={writingCardRef} />
      {!isFinalDiagnosis && !isFinalRecall && (
        <header className="topbar">
          <div className="topbar-title">
            <h1 className="page-title">Argumenterande text</h1>
            <span className="topbar-subtitle">Kapitel {lessonIndex + 1} av {lessons.length} · {lesson.shortTitle}</span>
          </div>
          <nav className="lesson-progress" aria-label="Lektionens moment">
            {lessons.map((item, index) => (
              <button
                aria-current={index === lessonIndex ? "step" : undefined}
                aria-label={`Kapitel ${index + 1}: ${item.shortTitle}`}
                className={`lesson-segment ${index === lessonIndex ? "is-current" : ""} ${index < lessonIndex ? "is-complete" : ""}`}
                disabled={!freeNavigation && index !== lessonIndex}
                key={item.shortTitle}
                onClick={() => selectLesson(index)}
                title={item.title}
                type="button"
              />
            ))}
          </nav>
          {/* The student's writing map fills in by itself while the student works. */}
          {shownMap && (
            <span className="topbar-map" title="Din skrivkarta">
              <MapWheel
                compact
                label="Din skrivkarta i litet format"
                levelOf={(skill) => shownMap.find((part) => part.skill === skill)?.level ?? null}
                taught={taughtSkills}
              />
            </span>
          )}
          <ReadingSettings />
          <button
            aria-pressed={soundOn}
            className="sound-toggle"
            onClick={() => setSoundOn(!soundOn)}
            type="button"
          >
            {soundOn ? "Ljud på" : "Ljud av"}
          </button>
        </header>
      )}

      <section
        className={`workspace-grid ${isFinalDiagnosis ? "is-final-diagnosis" : ""} ${isFinalRecall ? "is-final-recall" : ""}`}
        aria-label={isFinalDiagnosis ? "Slutdiagnos" : isFinalRecall ? "Återkallning inför slutdiagnos" : "Skrivcoachens arbetsyta"}
      >
        {!isFinalDiagnosis && <section
          className="board-frame"
          aria-label={isFinalRecall
            ? "Återkallning inför slutdiagnos"
            : hasCompletedEntry
              ? `Whiteboard för ${lesson.shortTitle}. Aktivt steg: ${phase}.`
              : `Startfråga inför ${lesson.shortTitle}`}
        >
          <span className="frame-corner corner-top-left" aria-hidden="true" />
          <span className="frame-corner corner-top-right" aria-hidden="true" />
          <span className="frame-corner corner-bottom-left" aria-hidden="true" />
          <span className="frame-corner corner-bottom-right" aria-hidden="true" />
          <div className="board-surface" ref={boardSurfaceRef}>
            <div className="board-content" ref={boardContentRef}>
              <span aria-hidden="true" className="edda-face edda-host" />
              {isFinalRecall ? (
                <FinalRecall
                  index={finalRecallIndex}
                  answers={finalRecallAnswers}
                  onAnswer={(index, answer) => setFinalRecallAnswers((current) => {
                    const next = [...current];
                    next[index] = answer;
                    return next;
                  })}
                  onPrevious={() => setFinalRecallIndex((current) => Math.max(0, current - 1))}
                  onNext={() => setFinalRecallIndex((current) => Math.min(finalRecallQuestions.length - 1, current + 1))}
                  onComplete={startFinalDiagnosis}
                />
              ) : !hasStarted ? (
                <BoardSequence key="welcome">
                  <BoardStep>
                    <div className="board-activity welcome">
                      <p className="board-kicker">START</p>
                      <h2 className="board-prompt welcome-title"><Written byHand>Välkommen!</Written></h2>
                      <p className="activity-instruction">
                        <Written keys={[]} spoken>Hej! Jag heter Edda. Vi ska träna på att skriva argumenterande text tillsammans, steg för steg. Först vill jag veta: vad vill du skriva om? Det blir din skrivuppgift.</Written>
                      </p>
                      <AfterWriting>
                        {chosenTopic === null ? (
                          <>
                            <div className="topic-choices" role="group" aria-label="Välj vad du vill skriva om">
                              {writingTopics.map((item) => (
                                <button className="topic-choice" key={item.id} onClick={() => setChosenTopic(item)} type="button">
                                  <span aria-hidden="true" className="topic-icon">{item.icon}</span>
                                  {item.label}
                                </button>
                              ))}
                            </div>
                            {/* The student can also write about something of their own choice. */}
                            <form
                              className="own-choice"
                              onSubmit={(event) => {
                                event.preventDefault();
                                if (ownTopicText.trim().length >= 5) setChosenTopic(ownTopic(ownTopicText));
                              }}
                            >
                              <label htmlFor="own-topic">Eller välj helt själv. Vilken fråga vill du ta ställning i?</label>
                              <div className="own-choice-row">
                                <input
                                  id="own-topic"
                                  maxLength={maxOwnTopicLength}
                                  onChange={(event) => setOwnTopicText(event.target.value)}
                                  placeholder="Till exempel: Borde läxor avskaffas?"
                                  type="text"
                                  value={ownTopicText}
                                />
                                <button className="quiet-button" disabled={ownTopicText.trim().length < 5} type="submit">Välj mitt ämne</button>
                              </div>
                            </form>
                          </>
                        ) : (
                          <>
                            <p className="welcome-question">Vem vill du övertyga med din text?</p>
                            <div className="topic-choices is-compact" role="group" aria-label="Välj vem du skriver till">
                              {recipients.map((item) => (
                                <button className="topic-choice" key={item} onClick={() => startLesson(chosenTopic, item)} type="button">
                                  {item.charAt(0).toLocaleUpperCase("sv") + item.slice(1)}
                                </button>
                              ))}
                            </div>
                            <form
                              className="own-choice"
                              onSubmit={(event) => {
                                event.preventDefault();
                                if (ownRecipientText.trim().length >= 2) startLesson(chosenTopic, ownRecipientText.trim());
                              }}
                            >
                              <label htmlFor="own-recipient">Eller någon annan. Vem?</label>
                              <div className="own-choice-row">
                                <input
                                  id="own-recipient"
                                  maxLength={maxRecipientLength}
                                  onChange={(event) => setOwnRecipientText(event.target.value)}
                                  placeholder="Till exempel: mina föräldrar"
                                  type="text"
                                  value={ownRecipientText}
                                />
                                <button className="quiet-button" disabled={ownRecipientText.trim().length < 2} type="submit">Välj min mottagare</button>
                              </div>
                            </form>
                            <button className="text-button" onClick={() => setChosenTopic(null)} type="button">Byt ämne</button>
                          </>
                        )}
                      </AfterWriting>
                    </div>
                  </BoardStep>
                </BoardSequence>
              ) : !hasCompletedEntry ? (
                <LessonEntryCheck
                  key={lessonIndex}
                  lesson={lesson}
                  learningEvidence={learningEvidence}
                  priorEvidence={priorEvidence}
                  onEvidence={recordEvidence}
                  onComplete={completeEntryCheck}
                />
              ) : isListeningIntro ? (
                <BoardSequence key="listening-intro">
                  <BoardStep>
                    <div className="board-activity">
                      <p className="board-prompt"><Written byHand>Lyssna nu</Written></p>
                      <p className="activity-instruction">
                        <Written keys={[]} spoken>Här finns ett gott exempel på en argumenterande text. Lyssna på hela texten och följ med medan du lyssnar. Sedan går vi igenom vad som gör den bra.</Written>
                      </p>
                      <AfterWriting>
                        <div className="listen-actions">
                          <button
                            className="primary-button"
                            disabled={exemplarAudio.state === "loading"}
                            onClick={exemplarAudio.toggle}
                            type="button"
                          >
                            {exemplarAudio.state === "loading"
                              ? "Hämtar uppläsningen …"
                              : exemplarAudio.state === "playing"
                                ? "Pausa uppläsningen"
                                : exemplarAudio.state === "paused" ? "Fortsätt lyssna" : "Lyssna på texten"}
                          </button>
                          <button
                            className="text-button"
                            onClick={() => {
                              exemplarAudio.stop();
                              setHasMetExemplar(true);
                            }}
                            type="button"
                          >
                            Starta lektionen utan att lyssna
                          </button>
                        </div>
                        {exemplarAudio.error && <p className="check-in-error" role="alert">{exemplarAudio.error}</p>}
                      </AfterWriting>
                    </div>
                  </BoardStep>
                </BoardSequence>
              ) : (
                <>
              <BoardSequence
                key={boardStage}
                instant={seenBoards.includes(boardKey) && !isExploring}
                // While the student explores, the step is not done: Edda's part comes after.
                onComplete={isExploring ? undefined : () => setSeenBoards((current) => current.includes(boardKey) ? current : [...current, boardKey])}
                onPageChange={(page) => setBoardPage({ board: boardKey, page })}
              >
                {phaseIndex === 0 && (boardStage === boardKey ? (
                  <BoardStep pause>
                    <p className="board-prompt"><Written byHand>{lesson.shortTitle}</Written></p>
                    {exemplarAvailable && (
                      <p className="board-exemplar-note">
                        {/* The new chapter starts in something the student's own text already has. */}
                        <Written keys={exemplarFocus[lesson.skillIds[0]].boardKeys} spoken>
                          {ownBridge ? `${ownBridge.say} ${exemplarFocus[lesson.skillIds[0]].boardNote}` : exemplarFocus[lesson.skillIds[0]].boardNote}
                        </Written>
                      </p>
                    )}
                    {exemplarAvailable && ownBridge && (
                      <p className="own-words"><span className="compare-label">Ur din text</span>{`”${ownBridge.quote}”`}</p>
                    )}
                  </BoardStep>
                ) : (
                  // After the exploration Edda says in one line what happens next.
                  <BoardStep pause={boardPages.length > 0 || errorHunt !== null}>
                    <p className="board-prompt"><Written byHand>{explore.found.length === walkthrough.length ? "Du hittade allt själv" : explore.found.length > 0 ? `Du hittade ${explore.found.length} av ${walkthrough.length} själv` : "Nu letar vi tillsammans"}</Written></p>
                    {(boardPages.length > 0 || errorHunt !== null) && (
                      <p className="activity-instruction">
                        <Written>{explore.found.length === walkthrough.length ? "Nu tittar vi på resten av genomgången." : "Nu tar vi resten, en sak i taget."}</Written>
                      </p>
                    )}
                  </BoardStep>
                ))}
                {boardPages.map((page, pageIndex) => {
                  const isCurrent = pageIndex + 1 === currentBoardPage;
                  const showAnswer = isCurrent && isPickResolved;
                  const isLast = pageIndex === boardPages.length - 1 && !errorHunt;
                  const eddaResponse = isCurrent && (
                    <>
                      {pick.submitting && <p className="example-pick-status" role="status">Edda läser ditt val …</p>}
                      {pick.error && <p className="check-in-error" role="alert">{pick.error}</p>}
                      {pick.feedback && <EddaFeedback feedback={pick.feedback} />}
                    </>
                  );

                  // When the place is found or shown, the board holds only what Edda says about it, in her
                  // speech bubble. It appears when she has said it. The place itself is lit in the text.
                  const eddaExplains = (text: string) => (
                    <div className="edda-line" role="status">
                      <span aria-hidden="true" className="edda-face" />
                      <div className="edda-bubble-wrap">
                        <strong className="edda-name">Edda</strong>
                        <div className="edda-bubble">
                          {pick.solved && <EddaMark className="is-earned" />}
                          {/* When Edda has said it, the heading is the key word and the place is lit in the text. */}
                          <span><Written keys={[]} spoken={!pick.brief}>{text}</Written></span>
                        </div>
                      </div>
                    </div>
                  );
                  // Edda says it once when she starts explaining more briefly, so that the student sees why.
                  const stepsBack = isCurrent && walk.toldAt === currentBoardPage && (
                    <p aria-live="polite" className="edda-steps-back">Du hittar ställena själv, så jag förklarar kortare nu.</p>
                  );

                  if (page.kind === "explore") {
                    const latest = explore.latest !== null ? walkthrough[explore.latest] : null;
                    return (
                      <BoardStep key="explore">
                        <div className="board-activity focus-walk">
                          <p className="board-prompt"><Written byHand>{exploreAsks[lesson.skillIds[0]]}</Written></p>
                          <p className="board-small-note"><Written>Titta själv i texten och klicka på det du hittar.</Written></p>
                          <AfterWriting>
                            {/* Edda puts a name on what the student has just found; the place lights up in the text. */}
                            {latest && (
                              <div className="edda-line" key={explore.latest} role="status">
                                <span aria-hidden="true" className="edda-face" />
                                <div className="edda-bubble-wrap">
                                  <strong className="edda-name">{`Edda · ${latest.label}`}</strong>
                                  <div className="edda-bubble">
                                    <EddaMark className="is-earned" />
                                    <span>{latest.explain}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                            <button className="text-button" onClick={() => endExploring()} type="button">Jag har letat klart</button>
                          </AfterWriting>
                        </div>
                      </BoardStep>
                    );
                  }

                  if (page.kind === "compare") {
                    const item = comparisons[page.comparisonIndex];
                    if (page.pairIndex === null) {
                      return (
                        <BoardStep key={`page-${pageIndex}`} pause>
                          <div className="board-activity focus-walk">
                            <p className="board-prompt"><Written byHand>{item.title}</Written></p>
                            <p className="activity-instruction"><Written keys={[]} spoken>{item.intro}</Written></p>
                          </div>
                        </BoardStep>
                      );
                    }
                    const pair = item.pairs[page.pairIndex];
                    return (
                      <BoardStep key={`page-${pageIndex}`} pause={!isLast} locked={!freeNavigation && !showAnswer}>
                        <div className="board-activity focus-walk">
                          {showAnswer ? (
                            <>
                              <p className="board-prompt"><Written byHand>{pair.label}</Written></p>
                              {isCurrent && pick.error && <p className="check-in-error" role="alert">{pick.error}</p>}
                              {eddaExplains(pair.explain)}
                            </>
                          ) : (
                            <>
                              <p className="board-prompt"><Written byHand>Hitta samma ställe i den andra texten</Written></p>
                              <p className="board-small-note"><Written>Titta på det som lyser gult i den övre rutan. Klicka på det som motsvarar det i den nedre.</Written></p>
                              {eddaResponse}
                            </>
                          )}
                        </div>
                      </BoardStep>
                    );
                  }

                  const part = walkthrough[page.index];
                  return (
                    <BoardStep key={`page-${pageIndex}`} pause={!isLast} locked={!freeNavigation && !showAnswer}>
                      <div className="board-activity focus-walk">
                        {showAnswer ? (
                          <>
                            <p className="board-prompt"><Written byHand>{part.label}</Written></p>
                            {isCurrent && pick.error && <p className="check-in-error" role="alert">{pick.error}</p>}
                            {eddaExplains(part.explain ?? part.label)}
                            {part.related && (
                              <p className="related-words">
                                <span className="compare-label">{part.related.label}</span>
                                <Written>{part.related.words.join(" · ")}</Written>
                              </p>
                            )}
                          </>
                        ) : (
                          <>
                            <p className="board-prompt"><Written byHand>{part.ask ?? part.label}</Written></p>
                            {stepsBack}
                            <p className="board-small-note"><Written>{explainsBriefly ? "Klicka i texten." : "Leta själv först: det du hittar själv minns du bättre. Klicka i texten."}</Written></p>
                            {eddaResponse}
                            {/* The hint comes by itself when the student has tried and stood still for a while. */}
                            {isCurrent && isStuck && (
                              <p aria-live="polite" className="hint-card"><span aria-hidden="true">✦</span> {`Ett första steg: titta i ${placeInExemplar(part.quote)}.`}</p>
                            )}
                          </>
                        )}
                      </div>
                    </BoardStep>
                  );
                })}
                {errorHunt && (
                  <BoardStep>
                    <ErrorHunt
                      key={lessonIndex}
                      lesson={lesson}
                      hunt={errorHunt}
                      priorEvidence={priorEvidence}
                      onEvidence={recordCheck}
                      onDone={markAttempted}
                    />
                  </BoardStep>
                )}
                {phaseIndex === 0 && walkthrough.length === 0 && (
                  <BoardStep>
                    <ExamplePick
                      key={lessonIndex}
                      lesson={lesson}
                      examples={lesson.model}
                      strongFirst={lessonIndex % 2 === 1}
                      priorEvidence={priorEvidence}
                      onEvidence={recordCheck}
                      onAttempt={markAttempted}
                    />
                  </BoardStep>
                )}
                {phaseIndex === 1 && lessonIndex < lessons.length - 1 && !foundAlone && (
                  <BoardStep pause locked={!freeNavigation && !pickedExamples.includes(boardKey)}>
                    {/* Before the student writes, Edda shows a better and a weaker example of the same part. */}
                    {/* A student who found the places alone goes straight to the task instead. */}
                    <ExamplePick
                      key={lessonIndex}
                      lesson={lesson}
                      examples={lesson.model}
                      strongFirst={lessonIndex % 2 === 1}
                      priorEvidence={priorEvidence}
                      onEvidence={recordEvidence}
                      onAttempt={() => setPickedExamples((current) => current.includes(boardKey) ? current : [...current, boardKey])}
                    />
                  </BoardStep>
                )}
                {phaseIndex === 1 && (
                  <BoardStep
                    locked={hasSubmissionChecklist && !freeNavigation && !attemptedBoards.includes(boardKey)}
                    pause={hasSubmissionChecklist}
                  >
                    <div className="board-activity writing-task">
                      {/* While Edda shows how the exemplar does it, only that is on the board. */}
                      <div className="task-brief" hidden={loop?.stage === "model"}>
                      <p className="board-prompt"><Written byHand>Din uppgift</Written></p>
                      {/* Said once, before the student writes; it is gone when Edda has read the text. */}
                      {foundAlone && lessonIndex < lessons.length - 1 && !attemptedBoards.includes(boardKey) && (
                        <p className="edda-steps-back">Du hittade ställena i exempeltexten själv, så du går direkt till din uppgift.</p>
                      )}
                      <p className="activity-instruction"><Written spoken>{lesson.practice}</Written></p>
                      {showHint && <p aria-live="polite" className="hint-card"><span aria-hidden="true">✦</span> Ett första steg: {lesson.hint}</p>}
                      </div>
                      <AfterWriting>
                        <div className="task-actions">
                          {loop?.reading ? (
                            <p className="example-pick-status" role="status">Edda läser din text …</p>
                          ) : loop?.stage === "model" && loop.example !== null ? (
                            // Back to modelling, aimed at what is missing: the place is lit in the exemplar and Edda explains it.
                            <div className="gap-model">
                              <p className="board-prompt">{gapWalk[loop.example].label}</p>
                              <div className="edda-line" role="status">
                                <span aria-hidden="true" className="edda-face" />
                                <div className="edda-bubble-wrap">
                                  <strong className="edda-name">Edda</strong>
                                  <div className="edda-bubble">
                                    <span><Written keys={[]} spoken>{gapWalk[loop.example].explain ?? gapWalk[loop.example].label}</Written></span>
                                  </div>
                                </div>
                              </div>
                              <button className="primary-button" onClick={() => setTaskLoop({ ...loop, stage: "try" })} type="button">Pröva i din text</button>
                            </div>
                          ) : loop?.stage === "try" ? (
                            <div className="task-feedback">
                              {loop.closed && <p className="task-done" role="status"><EddaMark /> Nu finns det i din text.</p>}
                              <p className="develop-note">
                                <span className="compare-label">Att pröva</span>
                                {loop.hint}
                              </p>
                              <button
                                className="primary-button"
                                disabled={draft === loop.draft || !draft.trim()}
                                onClick={readAfterTrying}
                                type="button"
                              >
                                Jag har prövat – låt Edda titta igen
                              </button>
                            </div>
                          ) : loop?.stage === "done" ? (
                            <p className="task-done" role="status"><EddaMark /> {loop.closed ? "Nu finns det i din text." : "Uppgiften är klar."}</p>
                          ) : reviewLoading && reviewSource === "task" ? (
                            <p className="example-pick-status" role="status">Edda läser din text …</p>
                          ) : attemptedBoards.includes(boardKey) ? (
                            reviewFeedback && reviewSource === "task" ? (
                              <div className="task-feedback">
                                <EddaFeedback
                                  feedback={{
                                    kind: "on_track",
                                    feedback: reviewFeedback.success.message,
                                  }}
                                />
                                {loop?.stage === "praise" ? (
                                  // First what works; then Edda shows how the exemplar does what is still missing.
                                  <button className="primary-button" onClick={() => setTaskLoop({ ...loop, stage: "model" })} type="button">Se hur exempeltexten gör</button>
                                ) : currentAdvice?.round === 2 ? (
                                  <p className="task-link">Du prövade, och din text förändrades. Så arbetar en skribent.</p>
                                ) : (
                                  <>
                                    {currentAdvice && (
                                      <p className="develop-note">
                                        <span className="compare-label">Att pröva</span>
                                        {currentAdvice.message}
                                      </p>
                                    )}
                                  </>
                                )}
                              </div>
                            ) : currentAdvice?.round === 1 ? (
                              // The student is trying the advice: it stays on the board while they write.
                              <div className="task-feedback">
                                <p className="develop-note">
                                  <span className="compare-label">Att pröva</span>
                                  {currentAdvice.message}
                                </p>
                                <button
                                  className="primary-button"
                                  disabled={draft === currentAdvice.reviewedDraft || !draft.trim()}
                                  onClick={retryWritingTask}
                                  type="button"
                                >
                                  Jag har prövat – låt Edda titta igen
                                </button>
                              </div>
                            ) : (
                              <p className="task-done" role="status"><EddaMark /> Uppgiften är klar.</p>
                            )
                          ) : (
                            <button
                              className="primary-button"
                              disabled={!hasWrittenForTask}
                              onClick={finishWritingTask}
                              type="button"
                            >
                              {lesson.taskLink ? "Jag är klar – låt Edda läsa" : "Jag är klar med uppgiften"}
                            </button>
                          )}
                        </div>
                      </AfterWriting>
                    </div>
                  </BoardStep>
                )}
                {hasSubmissionChecklist && (
                  // Before the final diagnosis the student goes through the whole text with a checklist.
                  <BoardStep>
                    <SubmissionChecklist key={lessonIndex} />
                  </BoardStep>
                )}
                {phaseIndex === 2 && (
                  <BoardStep pause>
                    <div className="board-activity recall-activity">
                      <p className="board-prompt"><Written byHand>Försök utan stöd</Written></p>
                      <p className="activity-instruction"><Written spoken>{lesson.recall}</Written></p>
                      <p className="board-small-note"><Written>Pröva utan exemplen först. Att minnas själv gör att det fastnar.</Written></p>
                    </div>
                  </BoardStep>
                )}
                {phaseIndex === 3 && (
                  <BoardStep pause>
                    <div className="board-activity">
                      <p className="board-prompt"><Written byHand>Din egenkontroll</Written></p>
                      <p className="board-small-note"><Written>Tryck på knappen, så visar Edda stället i din text med gult.</Written></p>
                      <ul className="self-check">
                        {lesson.checklist.map((item) => {
                          const key = `${boardKey}:${item}`;
                          const marked = selfMarks[key];
                          const state = selfCheck?.key === key ? selfCheck : null;
                          return (
                            <li className={`self-check-item board-hold ${marked ? "is-marked" : ""}`} key={item}>
                              <span className="self-check-statement"><Written>{item}</Written></span>
                              {marked && <q className="self-check-quote">{marked}</q>}
                              {state?.state === "missing" && (
                                <p className="self-check-note" role="status">Edda hittar inte det i din text än. Lägg till det och pröva igen.</p>
                              )}
                              {state?.state === "empty" && (
                                <p className="self-check-note" role="status">Skriv i din text först.</p>
                              )}
                              {state?.state === "error" && <p className="check-in-error" role="alert">{state.message}</p>}
                              <button
                                className="quiet-button"
                                disabled={selfCheck?.state === "loading"}
                                onClick={() => showInOwnText(item)}
                                type="button"
                              >
                                {state?.state === "loading" ? "Edda letar i din text …" : "Visa var i din text"}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </BoardStep>
                )}
                {phaseIndex === 4 && (
                  <BoardStep pause>
                    <div className="board-activity">
                      <p className="board-goal goal-reminder"><strong><Written>Målet:</Written></strong> <Written>{lesson.learnerGoal}</Written></p>
                      <p className="board-prompt"><Written byHand>Det här granskar du</Written></p>
                      <ul className="criteria-list">
                        {lesson.criteria.map((criterion) => (
                          <li className="board-hold" key={criterion}><Written>{criterion}</Written></li>
                        ))}
                      </ul>
                      <p className="assessment-note"><Written>Detta är stöd för din bearbetning – inte ett officiellt betyg.</Written></p>
                      <p className="board-small-note"><Written>Använd kriterierna när du granskar ditt utkast.</Written></p>
                    </div>
                  </BoardStep>
                )}
                {phaseIndex > 1 && (phaseIndex < 4 || lesson.exitTicket) && (
                  <BoardStep
                    locked={hasProgressMap && !freeNavigation && !attemptedBoards.includes(boardKey)}
                    pause={hasProgressMap}
                  >
                    <LessonCheckIn
                      key={`${lessonIndex}-${phaseIndex}`}
                      lesson={lesson}
                      phaseIndex={phaseIndex}
                      priorEvidence={priorEvidence}
                      onEvidence={recordCheck}
                      onAttempt={markAttempted}
                      achievements={(achievements[lessonIndex] ?? []).map((index) => lesson.canDo[index])}
                      firstAnswer={lesson.entryCheck.skillIds.every((skillId) => lesson.skillIds.includes(skillId))
                        ? entryAnswers[lessonIndex] ?? null
                        : null}
                    />
                  </BoardStep>
                )}
                {hasProgressMap && (
                  // The chapter ends with the student's writing map: how far each part of their own text has come.
                  <BoardStep>
                    {practice ? (
                      <PracticeRound
                        key={practice.skill}
                        lesson={lessons.find((item) => item.skillIds.length === 1 && item.skillIds[0] === practice.skill) ?? lesson}
                        label={mapSkills.find(({ skill }) => skill === practice.skill)?.label ?? ""}
                        level={practice.level}
                        hint={practice.hint}
                        priorEvidence={priorEvidence}
                        onEvidence={recordEvidence}
                        hasRevised={draft !== practice.draft && draft.trim().length > 0}
                        loading={mapLoading}
                        onReadAgain={async () => {
                          const practised = practice.skill;
                          await assessProgress();
                          setPractice(null);
                          setMapSelected(practised);
                        }}
                        onBack={() => setPractice(null)}
                      />
                    ) : (
                    <ProgressMap
                      taught={taughtSkills}
                      parts={shownMap}
                      selected={mapSelected}
                      onSelect={(skill) => setMapSelected((current) => current === skill ? null : skill)}
                      onAssess={assessProgress}
                      loading={mapLoading}
                      error={mapError}
                      isEmpty={!draft.trim()}
                      isOutdated={progressMap !== null && progressMap.draft !== draft}
                      onShare={shareMapWithTeacher}
                      isShared={progressMap !== null && sharedMapDraft === progressMap.draft}
                      shareError={mapShareError}
                      onOpenTeacherView={openTeacherInbox}
                      onPractice={(skill) => {
                        const part = shownMap?.find((item) => item.skill === skill);
                        setPractice({ skill, level: part?.level ?? 0, hint: part?.next ?? "", draft });
                      }}
                    />
                    )}
                  </BoardStep>
                )}
              </BoardSequence>
              <div className="board-footer">
                <div className="phase-controls">
                  {freeNavigation && (
                    <button className="quiet-button" onClick={() => movePhase(Math.max(0, phaseIndex - 1))} disabled={phaseIndex === 0}>Tillbaka</button>
                  )}
                  {phaseIndex < phases.length - 1 ? (
                    canAdvance && <button className="primary-button" onClick={() => movePhase(phaseIndex + 1)}>Nästa steg <span aria-hidden="true">→</span></button>
                  ) : lessonIndex < lessons.length - 1 ? (
                    canAdvance && <button className="primary-button" onClick={() => selectLesson(lessonIndex + 1)}>Nästa kapitel <span aria-hidden="true">→</span></button>
                  ) : <span className="finish-label">Sista kapitlet</span>}
                </div>
              </div>
                </>
              )}
            </div>
          </div>
        </section>}

        {!isFinalRecall && <section ref={writingCardRef} className={`writing-card ${isFinalDiagnosis ? "final-diagnosis-card" : ""}`} aria-label={isFinalDiagnosis ? "Slutdiagnosens skrivyta" : surfaceView === "exemplar" ? "Exempeltext" : "Elevens skrivyta"}>
          {surfaceView === "exemplar" && (
            <ExemplarPanel
              skillId={loop?.stage === "model" ? loop.skill : lesson.skillIds[0]}
              mode={loop?.stage === "model" ? "focus" : exemplarMode}
              focusIndex={loop?.stage === "model" ? loop.example : focusIndex}
              comparison={comparison}
              pairIndex={pairIndex}
              pick={{ selected: pick.selected, found: isOnExplorePage ? explore.found : [], disabled: pick.submitting, candidates: walkthrough.map((_, index) => index) }}
              onPick={isOnExplorePage ? exploreFind : pickOnPage}
              isExploring={isOnExplorePage}
              onStray={exploreStray}
              comparePick={{ resolved: isPickResolved, selected: pick.selected, disabled: pick.submitting }}
              onPickPair={pickOnPage}
            />
          )}
          {!hasStarted && !isFinalDiagnosis && (
            <div className="lesson-plan">
              <h2>Så här går lektionen till</h2>
              <ol>
                {lessons.map((item) => <li key={item.shortTitle}>{item.title}</li>)}
              </ol>
              <p>
                I varje kapitel: <strong>1. Genomgång</strong> (Edda frågar och du letar själv i en exempeltext)
                {" → "}<strong>2. Din uppgift</strong> (du skriver i din egen text och Edda läser)
                {" → "}<strong>3. Utan stöd</strong> (du visar vad du kan och kontrollerar din text).
              </p>
              <p>
                Du tar ett steg i taget, så att du kan tänka på en sak åt gången. Du prövar själv först, för det är så du lär dig.
                Hjälp finns när du har prövat en stund.
              </p>
              <p className="lesson-plan-note">Edda anpassar stödet efter hur det går för dig.</p>
            </div>
          )}
          {surfaceView === "draft" && !isBlankStart && (
          <>
          <div className="writing-prompt">
            {isFinalDiagnosis
              ? <h1 className="prompt-label">{isSeparateRevision ? "SEPARAT BEARBETNING" : "SLUTDIAGNOS"}</h1>
              : <span className="prompt-label">SKRIVUPPGIFT</span>}
            <p>{isFinalDiagnosis ? diagnosisPrompt : topic.prompt}</p>
            {!isFinalDiagnosis && <p className="prompt-recipient">Du skriver för att övertyga {recipient}.</p>}
            {isFinalDiagnosis && (
              <p className="demo-teacher-warning">
                {isSeparateRevision
                  ? "Detta är en separat bearbetad kopia. Originaldiagnosen är låst och redan inlämnad."
                  : "Lokal prototyp: använd endast syntetisk text. Inlämning visas i demolärarvyn på samma webbläsare."}
              </p>
            )}
          </div>

          <div className="editor-toolbar">
            <div className="editor-status">
              <span className="word-count">{wordCount} ord</span>
              {saveError && !isFinalDiagnosis && <span className="save-status has-error" role="status">Kunde inte spara lokalt</span>}            </div>
            <div className="editor-actions">
              {isFinalDiagnosis && <ReadingSettings />}
              {isFinalDiagnosis && isDiagnosisSubmitted && !isSeparateRevision && (
                <button
                  className="quiet-button"
                  onClick={() => selectLesson(recommendedLessonIndex >= 0 ? recommendedLessonIndex : lessonIndex - 1)}
                  type="button"
                >
                  {recommendedLessonIndex >= 0 ? `Öva vidare på ${lessons[recommendedLessonIndex].shortTitle}` : "Tillbaka till undervisningen"}
                </button>
              )}
              {isFinalDiagnosis && (
                <button className="quiet-button" onClick={openTeacherInbox} type="button">
                  Lärarvy (demoläge)
                </button>
              )}
              {isFinalDiagnosis && teacherSubmissionId !== null && !isSeparateRevision ? (
                <span className="diagnosis-locked-note">Originaldiagnosen är låst</span>
              ) : (
                <button
                  className="primary-button coach-review-button"
                  onClick={isFinalDiagnosis && !isDiagnosisSubmitted ? markDiagnosisComplete : () => runReview()}
                  disabled={!activeDraft.trim() || reviewLoading}
                  type="button"
                >
                  {isFinalDiagnosis && !isDiagnosisSubmitted
                    ? "Markera slutdiagnosen som klar"
                    : reviewLoading
                      ? "Tutorn läser …"
                      : reviewFeedback
                        ? "Få ny återkoppling"
                        : "Få återkoppling"}
                </button>
              )}
            </div>
          </div>
          {isFinalDiagnosis && isDiagnosisSubmitted && !isSeparateRevision && (
            <div className="diagnosis-handoff">
              <p className="diagnosis-status" role="status">
                Slutdiagnosen är markerad som klar. AI-återkoppling är valfri.
              </p>
              <p className="demo-teacher-warning">
                Demoläge: inlämningen sparas i samma webbläsares lärarvy, inte till en verklig lärare. Använd endast syntetisk text.
                Sluttexten och eventuell AI-återkoppling delas när du väljer att lämna in.
              </p>
              {teacherSubmissionId ? (
                <p className="diagnosis-status" role="status">Inlämnad i den lokala lärarvyn.</p>
              ) : (
                <button className="primary-button" onClick={submitDiagnosisToTeacher} type="button">
                  Lämna in till läraren (demo)
                </button>
              )}
            </div>
          )}
          {isFinalDiagnosis && submissionError && <p className="check-in-error" role="alert">{submissionError}</p>}
          {isFinalDiagnosis && profileLoadError && (
            <p className="check-in-error" role="alert">
              Den tidigare demoprofilen kunde inte läsas. Anpassning från tidigare besök är pausad.
            </p>
          )}
          {isFinalDiagnosis && (
            <FinalDiagnosisChecklist
              stage={isSeparateRevision ? "revision" : teacherSubmissionId ? "locked" : "writing"}
              onStartRevision={startSeparateRevision}
            />
          )}

          {reviewLoading && <p className="review-state" role="status">Tutorn läser texten med fokus på {lesson.shortTitle.toLocaleLowerCase("sv")} …</p>}
          {reviewError && <p className="review-error" role="alert">{reviewError}</p>}
          {reviewFeedback && reviewSource === "request" && (
            <section className="formative-feedback" aria-label="Återkoppling på ditt utkast">
              <p><strong>Målet</strong>{lesson.goal}</p>
              <p>
                <strong>Din framgång</strong>
                {reviewFeedback.success.message} <q>{reviewFeedback.success.quote}</q>
              </p>
              <p>
                <strong>Vad kan bli bättre?</strong>
                {findings && findings.length > 0
                  ? "Klicka på de röda markeringarna i texten för att läsa vad du kan undersöka."
                  : "Ingen tydlig förbättringspunkt markerades den här gången."}
              </p>
              <p><strong>Nästa steg</strong>{reviewFeedback.nextStep}</p>
              {isFinalDiagnosis && <p className="diagnosis-disclaimer">Återkopplingen är vägledande, inte ett officiellt betyg.</p>}
              {isFinalDiagnosis && recommendedLessonIndex >= 0 && (
                <p className="diagnosis-recommendation">
                  <strong>Förslag på fortsatt övning</strong>
                  {lessons[recommendedLessonIndex].title}
                </p>
              )}
            </section>
          )}
          {findings?.length === 0 && reviewSource === "request" && <p className="empty-review" role="status">Läs ändå texten själv – AI kan missa saker.</p>}

          <div className="editor-wrap" ref={editorWrapRef}>
            <textarea
              ref={editorRef}
              className={`text-editor ${textMarks.length ? "has-inline-findings" : ""} ${isRevising ? "is-revising" : ""}`}
              value={activeDraft}
              onChange={(event) => updateDraft(event.target.value)}
              onFocus={() => setActiveFinding(null)}
              onBlur={() => setIsRevising(false)}
              onScroll={(event) => {
                setEditorScrollTop(event.currentTarget.scrollTop);
                setActiveFinding(null);
              }}
              readOnly={isFinalDiagnosis && teacherSubmissionId !== null && !isSeparateRevision}
              placeholder={isFinalDiagnosis ? "" : "Skriv din rubrik här …\n\nBörja sedan med att presentera din ståndpunkt. Du kan alltid ändra texten senare."}
              aria-label={isSeparateRevision ? "Din separata bearbetade text" : "Din argumenterande text"}
              spellCheck
            />
            {textMarks.length > 0 && !isRevising && (
              <div className="text-highlight-layer">
                <div className="text-highlight-content" style={{ transform: `translateY(-${editorScrollTop}px)` }}>
                  {textMarks.map((mark, index) => {
                    const previousEnd = index > 0 ? textMarks[index - 1].end : 0;
                    if (mark.kind !== "finding") {
                      return (
                        <Fragment key={mark.kind}>
                          <span aria-hidden="true">{activeDraft.slice(previousEnd, mark.start)}</span>
                          <span aria-hidden="true" className={mark.kind === "self" ? "self-mark" : "strength-mark"}>{activeDraft.slice(mark.start, mark.end)}</span>
                        </Fragment>
                      );
                    }
                    const finding = mark.finding;
                    return (
                      <Fragment key={finding.id}>
                        <span aria-hidden="true">{activeDraft.slice(previousEnd, finding.start)}</span>
                        <button
                          ref={(element) => {
                            if (element) findingButtonsRef.current.set(finding.id, element);
                            else findingButtonsRef.current.delete(finding.id);
                          }}
                          className={`finding-mark ${reviewSource === "task" ? "is-develop" : ""}`}
                          type="button"
                          aria-label={`Visa förklaring för markeringen ”${finding.quote}”. ${finding.title}`}
                          aria-expanded={activeFinding === finding.id}
                          aria-controls="finding-feedback-popover"
                          onClick={(event) => toggleFinding(finding, event.currentTarget)}
                          onKeyDown={(event) => {
                            if (event.key === "Escape") setActiveFinding(null);
                          }}
                        >
                          {activeDraft.slice(finding.start, finding.end)}
                        </button>
                      </Fragment>
                    );
                  })}
                  <span aria-hidden="true">{activeDraft.slice(textMarks[textMarks.length - 1].end)}</span>
                </div>
                {activeFinding && (() => {
                  const finding = findings?.find((item) => item.id === activeFinding);
                  if (!finding) return null;
                  return (
                    <aside
                      className="finding-popover"
                      id="finding-feedback-popover"
                      role="dialog"
                      aria-label={`Förklaring: ${finding.title}`}
                      style={{ left: popoverPosition.left, top: popoverPosition.top }}
                      onKeyDown={(event) => {
                        if (event.key === "Escape") {
                          setActiveFinding(null);
                          findingButtonsRef.current.get(finding.id)?.focus();
                        }
                      }}
                    >
                      <div className="finding-popover-heading">
                        <div>
                          <span>Att utveckla</span>
                          <strong>{finding.title}</strong>
                        </div>
                        <button
                          className="finding-popover-close"
                          type="button"
                          aria-label="Stäng förklaringen"
                          onClick={() => {
                            setActiveFinding(null);
                            findingButtonsRef.current.get(finding.id)?.focus();
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <p>{finding.message}</p>
                      <div className="finding-popover-actions">
                        <button className="primary-button finding-popover-continue" onClick={() => continueWriting(finding)} type="button">
                          Fortsätt skriva
                        </button>
                      </div>
                    </aside>
                  );
                })()}
              </div>
            )}
          </div>
          </>
          )}
          {showTeacherInbox && (
            <DemoTeacherInbox
              maps={sharedMaps}
              submissions={demoSubmissions}
              onClose={() => setShowTeacherInbox(false)}
              onClear={clearTeacherInbox}
            />
          )}
        </section>}
      </section>
      {!isFinalDiagnosis && !isFinalRecall && (profileLoadError || profileSaveError || submissionError) && (
        <footer className="page-footer">
          {(profileLoadError || profileSaveError) && (
            <span>{profileLoadError ? "Sparad lärprofil kunde inte läsas" : "Lärprofilen kunde inte sparas lokalt"}</span>
          )}
          {profileLoadError && (
            <button className="text-button" onClick={resetLearnerProfile} type="button">
              Rensa felaktig demo-profil
            </button>
          )}
          {submissionError && <span role="alert">{submissionError}</span>}
        </footer>
      )}
    </main>
  );
}

export default App;
