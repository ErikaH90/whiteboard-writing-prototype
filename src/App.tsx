import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import FinalRecall from "./components/FinalRecall";
import DemoTeacherInbox from "./components/DemoTeacherInbox";
import FinalDiagnosisChecklist from "./components/FinalDiagnosisChecklist";
import LessonEntryCheck from "./components/LessonEntryCheck";
import LessonCheckIn from "./components/LessonCheckIn";
import ExamplePick from "./components/ExamplePick";
import ErrorHunt from "./components/ErrorHunt";
import EddaFeedback, { EddaStar } from "./components/EddaFeedback";
import ExemplarPanel, { type ExemplarMode } from "./components/ExemplarPanel";
import { exemplarFocus } from "./data/exemplars";
import { useFitToHeight } from "./lib/useFitToHeight";
import { useExemplarAudio } from "./lib/useExemplarAudio";
import { AfterWriting, BoardSequence, BoardStep, Written } from "./components/BoardWriting";
import { finalRecallQuestions, lessons, phases, type LearningEvidence, type SkillId } from "./data/lessons";
import {
  reviewDraft,
  type Finding,
  submitCheckIn,
  type CheckInFeedback,
  type ReviewFeedback,
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
  // The check in the modelling step is answered by clicking a part of the exemplar text.
  const [textPick, setTextPick] = useState<{
    lesson: number;
    /** Which of the chapter's checks the state belongs to. */
    check: number;
    /** Right parts found so far, for checks with several right parts. */
    found: number[];
    selected: number | null;
    solved: boolean;
    attempt: number;
    submitting: boolean;
    feedback: CheckInFeedback | null;
    error: string | null;
  } | null>(null);
  const [completedEntryLessons, setCompletedEntryLessons] = useState<number[]>([]);
  const [seenBoards, setSeenBoards] = useState<string[]>([]);
  const [hasMetExemplar, setHasMetExemplar] = useState(false);
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
  const [activeFinding, setActiveFinding] = useState<string | null>(null);
  const [isRevising, setIsRevising] = useState(false);
  const [editorScrollTop, setEditorScrollTop] = useState(0);
  const [popoverPosition, setPopoverPosition] = useState({ left: 8, top: 8 });
  const [checkedItems, setCheckedItems] = useState<string[]>([]);
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
  const findings = reviewFeedback?.findings ?? null;
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
    setCheckedItems([]);
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
    setCheckedItems([]);
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

  async function runReview() {
    const requestId = ++reviewRequestId.current;
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
      });
      if (reviewRequestId.current !== requestId) return;
      setReviewFeedback(result);
      if (isFinalDiagnosis && !isSeparateRevision) setTeacherSubmissionId(null);
    } catch (error) {
      if (reviewRequestId.current !== requestId) return;
      setReviewError(error instanceof Error ? error.message : "AI-granskningen misslyckades. Försök igen.");
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
  const isBlankStart = !isFinalDiagnosis
    && !isFinalRecall
    && !hasMetExemplar
    && !hasCompletedEntry
    && lessonIndex < lessons.length - 1;
  const surfaceView = exemplarAvailable ? "exemplar" : "draft";
  const hasBoardCheck = phaseIndex < 4 || lesson.exitTicket !== null;
  // In guided mode the next step opens when the whole board has been shown and the student has
  // answered its check or finished its task.
  const canAdvance = freeNavigation
    || (seenBoards.includes(boardKey) && (!hasBoardCheck || attemptedBoards.includes(boardKey)));

  function markAttempted() {
    setAttemptedBoards((current) => current.includes(boardKey) ? current : [...current, boardKey]);
  }

  // In the modelling step the whiteboard walks through the exemplar one part at a time:
  // page 0 is the goal, then one page per highlighted part, and last the comparison of two examples.
  const walkthrough = exemplarAvailable && phaseIndex === 0
    ? exemplarFocus[lesson.skillIds[0]].highlights.strong
    : [];
  const currentBoardPage = boardPage?.board === boardKey ? boardPage.page : 0;
  // Some chapters first compare a simple and a developed example: one page to read both,
  // then one page per pair of matching parts.
  const comparisons = walkthrough.length > 0 ? exemplarFocus[lesson.skillIds[0]].comparisons ?? [] : [];
  // One board page per comparison to read both examples, then one per pair of matching parts.
  const compareSteps = comparisons.flatMap((item, comparisonIndex) => [
    { comparisonIndex, pairIndex: null as number | null },
    ...item.pairs.map((_, index) => ({ comparisonIndex, pairIndex: index as number | null })),
  ]);
  const comparePages = compareSteps.length;
  const compareStep = hasCompletedEntry && currentBoardPage >= 1 && currentBoardPage <= comparePages
    ? compareSteps[currentBoardPage - 1]
    : null;
  const isComparePage = compareStep !== null;
  const comparison = compareStep ? comparisons[compareStep.comparisonIndex] : null;
  const pairIndex = compareStep?.pairIndex ?? null;
  const walkthroughStart = comparePages + 1;
  const focusIndex = hasCompletedEntry
    && currentBoardPage >= walkthroughStart
    && currentBoardPage < walkthroughStart + walkthrough.length
    ? currentBoardPage - walkthroughStart
    : null;
  const textChecks = walkthrough.length > 0 ? exemplarFocus[lesson.skillIds[0]].checks : [];
  // Some chapters end the modelling with an error hunt on the whiteboard instead.
  const errorHunt = walkthrough.length > 0 ? exemplarFocus[lesson.skillIds[0]].hunt ?? null : null;
  // The checks follow the walk-through, one board page each.
  const checksStart = walkthroughStart + walkthrough.length;
  const checkIndex = hasCompletedEntry
    && currentBoardPage >= checksStart
    && currentBoardPage < checksStart + textChecks.length
    ? currentBoardPage - checksStart
    : null;
  const textCheck = checkIndex !== null ? textChecks[checkIndex] : null;
  const isTextCheckPage = textCheck !== null;
  const emptyPick = { lesson: lessonIndex, check: checkIndex ?? 0, found: [], selected: null, solved: false, attempt: 0, submitting: false, feedback: null, error: null };
  const pick = textPick?.lesson === lessonIndex && textPick.check === (checkIndex ?? textChecks.length - 1)
    ? textPick
    : emptyPick;
  // A check is done when it is solved, tried twice, or the service failed.
  const isPickResolved = pick.solved || pick.attempt >= 2 || pick.error !== null;
  const exemplarMode: ExemplarMode = isListeningIntro
    ? "listen"
    : !hasCompletedEntry
      ? "plain"
      : isComparePage ? "compare" : focusIndex !== null ? "focus" : isTextCheckPage ? "pick" : "plain";

  async function pickInText(index: number) {
    if (!textCheck || checkIndex === null || pick.submitting || pick.solved || pick.attempt >= 10) return;
    const isCorrect = textCheck.targets.includes(index);
    const found = isCorrect ? [...pick.found, index] : pick.found;
    const isLastCheck = checkIndex === textChecks.length - 1;

    // With several right parts, the first finds are confirmed in the text; Edda answers when all are found.
    if (isCorrect && found.length < textCheck.targets.length) {
      setTextPick({ ...pick, found, selected: null, feedback: null, error: null });
      return;
    }

    const attempt = pick.attempt + 1;
    const base = { ...pick, found };
    setTextPick({ ...base, selected: isCorrect ? null : index, submitting: true, feedback: null, error: null });

    try {
      const feedback = await submitCheckIn({
        mode: "choice",
        question: textCheck.prompt,
        answer: isCorrect ? found.map((part) => walkthrough[part].quote).join(" / ") : walkthrough[index].quote,
        focus: lesson.checkInFocus,
        isCorrect,
        learningContext: { attempt, supportLevel: 0, priorEvidence },
      });
      setTextPick({ ...base, selected: isCorrect ? null : index, solved: isCorrect, attempt, submitting: false, feedback, error: null });
      if (isLastCheck && (isCorrect || attempt >= 2)) markAttempted();
      recordCheck(lesson.skillIds, !isCorrect ? "needs_support" : attempt === 1 ? "independent" : "supported");
    } catch (error) {
      setTextPick({
        ...base,
        selected: null,
        submitting: false,
        feedback: null,
        error: error instanceof Error ? error.message : "Återkopplingen misslyckades. Försök igen.",
      });
      // A failing service must not lock the student in the step.
      if (isLastCheck) markAttempted();
    }
  }

  // Where in the chapter the student is, shown in the top bar.
  const stepLabel = !hasCompletedEntry
    ? "Start"
    : isListeningIntro
      ? "Lyssna"
      : ["Genomgång", "Din uppgift", "Utan stöd", "Egenkontroll", "Avslut"][phaseIndex];
  const boardHeader = (
    <>
      <p className="board-kicker"><Written>{`DEL ${lessonIndex + 1}: ${lesson.shortTitle.toUpperCase()}`}</Written></p>
      <p className="board-goal"><strong><Written>Mål:</Written></strong> <Written>{lesson.learnerGoal}</Written></p>
      <div className="board-divider" />
    </>
  );

  return (
    <main className={`app-shell ${isFinalDiagnosis || isFinalRecall ? "" : "is-fitted"}`}>
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
          <span className="topbar-count">{lessonIndex + 1}/{lessons.length}</span>
          <span className="topbar-pill">{stepLabel}</span>
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
                      <p className="board-prompt"><Written>Lyssna nu</Written></p>
                      <p className="activity-instruction">
                        <Written>Till höger finns ett gott exempel på en argumenterande text. Lyssna på hela texten och följ med medan du lyssnar. Sedan går vi igenom vad som gör den bra.</Written>
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
              {phaseIndex > 0 && (
                <p className="board-kicker">{`DEL ${lessonIndex + 1}: ${lesson.shortTitle.toUpperCase()}`}</p>
              )}
              <BoardSequence
                key={boardKey}
                instant={seenBoards.includes(boardKey)}
                onComplete={() => setSeenBoards((current) => current.includes(boardKey) ? current : [...current, boardKey])}
                onPageChange={(page) => setBoardPage({ board: boardKey, page })}
              >
                {phaseIndex === 0 && (
                  <BoardStep pause>
                    {boardHeader}
                    {exemplarAvailable && (
                      <p className="board-exemplar-note"><Written>{exemplarFocus[lesson.skillIds[0]].boardNote}</Written></p>
                    )}
                  </BoardStep>
                )}
                {compareSteps.map((step, stepIndex) => {
                  const item = comparisons[step.comparisonIndex];
                  if (step.pairIndex === null) {
                    return (
                      <BoardStep key={`compare-${stepIndex}`} pause>
                        <div className="board-activity focus-walk">
                          {comparisons.length > 1 && (
                            <p className="board-kicker">{`${step.comparisonIndex + 1} AV ${comparisons.length}`}</p>
                          )}
                          <p className="board-prompt"><Written>{item.title}</Written></p>
                          <p className="activity-instruction"><Written>{item.intro}</Written></p>
                        </div>
                      </BoardStep>
                    );
                  }
                  const pair = item.pairs[step.pairIndex];
                  return (
                    <BoardStep key={`compare-${stepIndex}`} pause>
                      <div className="board-activity focus-walk">
                        <p className="board-kicker">{`JÄMFÖR · ${step.pairIndex + 1} AV ${item.pairs.length}`}</p>
                        <p className="board-prompt"><Written>{pair.label}</Written></p>
                        <p className="compare-quote"><span className="compare-label">{item.simpleTag}</span><Written>{`”${pair.simple}”`}</Written></p>
                        <p className="compare-quote is-developed"><span className="compare-label">{item.developedTag}</span><Written>{`”${pair.developed}”`}</Written></p>
                        <p className="activity-instruction"><Written>{pair.explain}</Written></p>
                      </div>
                    </BoardStep>
                  );
                })}
                {walkthrough.map((part, index) => (
                  <BoardStep key={`part-${index}`} pause>
                    <div className="board-activity focus-walk">
                      <p className="board-kicker">{`${index + 1} AV ${walkthrough.length}`}</p>
                      <p className="board-prompt"><Written>{part.label}</Written></p>
                      <p className="focus-quote"><Written>{`”${part.quote}”`}</Written></p>
                      <p className="activity-instruction"><Written>{part.explain ?? ""}</Written></p>
                      {part.related && (
                        <p className="related-words">
                          <span className="compare-label">{part.related.label}</span>
                          <Written>{part.related.words.join(" · ")}</Written>
                        </p>
                      )}
                    </div>
                  </BoardStep>
                ))}
                {textChecks.map((check, index) => {
                  const isCurrent = index === checkIndex;
                  return (
                    <BoardStep
                      key={`check-${index}`}
                      pause={index < textChecks.length - 1}
                      locked={!freeNavigation && !(isCurrent && isPickResolved)}
                    >
                      <div className="board-activity text-pick">
                        <p className="board-kicker">{textChecks.length > 1 ? `DIN TUR · ${index + 1} AV ${textChecks.length}` : "DIN TUR"}</p>
                        <p className="board-prompt"><Written>{check.prompt}</Written></p>
                        <p className="board-small-note"><Written>Svara genom att klicka i texten till höger.</Written></p>
                        {isCurrent && check.targets.length > 1 && pick.found.length > 0 && !pick.solved && (
                          <p className="example-pick-status" role="status">{pick.found.length} av {check.targets.length} hittade.</p>
                        )}
                        {isCurrent && pick.submitting && <p className="example-pick-status" role="status">Edda läser ditt val …</p>}
                        {isCurrent && pick.error && <p className="check-in-error" role="alert">{pick.error}</p>}
                        {isCurrent && pick.feedback && <EddaFeedback feedback={pick.feedback} />}
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
                {phaseIndex === 1 && lessonIndex < lessons.length - 1 && (
                  <BoardStep pause locked={!freeNavigation && !pickedExamples.includes(boardKey)}>
                    {/* Before the student writes, Edda shows a better and a weaker example of the same part. */}
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
                  <BoardStep>
                    <div className="board-activity writing-task">
                      <p className="board-prompt"><Written>Din uppgift</Written></p>
                      <p className="activity-instruction"><Written>{lesson.practice}</Written></p>
                      <p className="board-small-note"><Written>Skriv i din text till höger.</Written></p>
                      {showHint && <p className="hint-card"><span aria-hidden="true">✦</span> <Written>{lesson.hint}</Written></p>}
                      <AfterWriting>
                        <div className="task-actions">
                          {attemptedBoards.includes(boardKey) ? (
                            <p className="task-done" role="status"><EddaStar /> Uppgiften är klar. Gå vidare med Nästa steg.</p>
                          ) : (
                            <button
                              className="primary-button"
                              disabled={!draft.trim()}
                              onClick={() => {
                                // Finishing the task is the student's own report, not a learning signal.
                                markAttempted();
                                earnAchievement();
                              }}
                              type="button"
                            >
                              Jag är klar med uppgiften
                            </button>
                          )}
                          <button className="text-button" onClick={() => setShowHint((visible) => !visible)} type="button">
                            {showHint ? "Dölj ledtråd" : "Visa en ledtråd"}
                          </button>
                        </div>
                      </AfterWriting>
                    </div>
                  </BoardStep>
                )}
                {phaseIndex === 2 && (
                  <BoardStep pause>
                    <div className="board-activity recall-activity">
                      <p className="board-prompt"><Written>Försök utan stöd</Written></p>
                      <p className="activity-instruction"><Written>{lesson.recall}</Written></p>
                      <p className="board-small-note"><Written>Titta inte på exemplen medan du tänker efter.</Written></p>
                    </div>
                  </BoardStep>
                )}
                {phaseIndex === 3 && (
                  <BoardStep pause>
                    <div className="board-activity">
                      <p className="board-prompt"><Written>Din egenkontroll</Written></p>
                      <div className="checklist">
                        {lesson.checklist.map((item) => (
                          <label className="check-item board-hold" key={item}>
                            <input
                              type="checkbox"
                              checked={checkedItems.includes(item)}
                              onChange={() => setCheckedItems((current) => current.includes(item) ? current.filter((entry) => entry !== item) : [...current, item])}
                            />
                            <span><Written>{item}</Written></span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </BoardStep>
                )}
                {phaseIndex === 4 && (
                  <BoardStep pause>
                    <div className="board-activity">
                      <p className="board-goal goal-reminder"><strong><Written>Målet:</Written></strong> <Written>{lesson.learnerGoal}</Written></p>
                      <p className="board-prompt"><Written>Det här granskar du</Written></p>
                      <ul className="criteria-list">
                        {lesson.criteria.map((criterion) => (
                          <li className="board-hold" key={criterion}><Written>{criterion}</Written></li>
                        ))}
                      </ul>
                      <p className="assessment-note"><Written>Detta är stöd för din bearbetning – inte ett officiellt betyg.</Written></p>
                      <p className="board-small-note"><Written>Använd kriterierna när du granskar ditt utkast till höger.</Written></p>
                    </div>
                  </BoardStep>
                )}
                {phaseIndex > 1 && (phaseIndex < 4 || lesson.exitTicket) && (
                  <BoardStep>
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
              </BoardSequence>
              <div className="board-footer">
                <div className="phase-controls">
                  {freeNavigation && (
                    <button className="quiet-button" onClick={() => movePhase(Math.max(0, phaseIndex - 1))} disabled={phaseIndex === 0}>Tillbaka</button>
                  )}
                  {phaseIndex < phases.length - 1 ? (
                    <button className="primary-button" disabled={!canAdvance} onClick={() => movePhase(phaseIndex + 1)}>Nästa steg <span aria-hidden="true">→</span></button>
                  ) : lessonIndex < lessons.length - 1 ? (
                    <button className="primary-button" disabled={!canAdvance} onClick={() => selectLesson(lessonIndex + 1)}>Nästa kapitel <span aria-hidden="true">→</span></button>
                  ) : <span className="finish-label">Sista kapitlet</span>}
                </div>
              </div>
                </>
              )}
            </div>
          </div>
        </section>}

        {!isFinalRecall && <section className={`writing-card ${isFinalDiagnosis ? "final-diagnosis-card" : ""}`} aria-label={isFinalDiagnosis ? "Slutdiagnosens skrivyta" : surfaceView === "exemplar" ? "Exempeltext" : "Elevens skrivyta"}>
          {surfaceView === "exemplar" && (
            <ExemplarPanel
              skillId={lesson.skillIds[0]}
              mode={exemplarMode}
              focusIndex={focusIndex}
              comparison={comparison}
              pairIndex={pairIndex}
              pick={{ selected: pick.selected, found: pick.found, disabled: pick.submitting || pick.solved }}
              onPick={pickInText}
            />
          )}
          {surfaceView === "draft" && !isBlankStart && (
          <>
          <div className="writing-prompt">
            {isFinalDiagnosis
              ? <h1 className="prompt-label">{isSeparateRevision ? "SEPARAT BEARBETNING" : "SLUTDIAGNOS"}</h1>
              : <span className="prompt-label">SKRIVUPPGIFT</span>}
            <p>{isFinalDiagnosis ? diagnosisPrompt : "Ta ställning: Borde skoldagen börja senare för elever i högstadiet?"}</p>
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
                  onClick={isFinalDiagnosis && !isDiagnosisSubmitted ? markDiagnosisComplete : runReview}
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
          {isFinalDiagnosis && teacherSubmissionId && (
            <FinalDiagnosisChecklist
              isRevision={isSeparateRevision}
              onStartRevision={startSeparateRevision}
            />
          )}

          {reviewLoading && <p className="review-state" role="status">Tutorn läser texten med fokus på {lesson.shortTitle.toLocaleLowerCase("sv")} …</p>}
          {reviewError && <p className="review-error" role="alert">{reviewError}</p>}
          {reviewFeedback && (
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
          {findings?.length === 0 && <p className="empty-review" role="status">Läs ändå texten själv – AI kan missa saker.</p>}

          <div className="editor-wrap" ref={editorWrapRef}>
            <textarea
              ref={editorRef}
              className={`text-editor ${findings?.length ? "has-inline-findings" : ""} ${isRevising ? "is-revising" : ""}`}
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
            {findings && findings.length > 0 && !isRevising && (
              <div className="text-highlight-layer">
                <div className="text-highlight-content" style={{ transform: `translateY(-${editorScrollTop}px)` }}>
                  {findings.map((finding, index) => {
                    const previousEnd = index > 0 ? findings[index - 1].end : 0;
                    return (
                      <Fragment key={finding.id}>
                        <span aria-hidden="true">{activeDraft.slice(previousEnd, finding.start)}</span>
                        <button
                          ref={(element) => {
                            if (element) findingButtonsRef.current.set(finding.id, element);
                            else findingButtonsRef.current.delete(finding.id);
                          }}
                          className="finding-mark"
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
                  <span aria-hidden="true">{activeDraft.slice(findings[findings.length - 1].end)}</span>
                </div>
                {activeFinding && (() => {
                  const finding = findings.find((item) => item.id === activeFinding);
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
