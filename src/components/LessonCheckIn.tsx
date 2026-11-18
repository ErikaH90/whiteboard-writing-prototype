import { useId, useState, type FormEvent } from "react";
import type { LearningEvidence, Lesson, SkillId } from "../data/lessons";
import { submitCheckIn, type CheckInFeedback, type LearningContext } from "../lib/coachApi";
import ChapterExitTicket from "./ChapterExitTicket";

type Props = {
  lesson: Lesson;
  phaseIndex: number;
  priorEvidence: LearningContext["priorEvidence"];
  onEvidence: (skillIds: SkillId[], evidence: LearningEvidence) => void;
};
const maxAttempts = 10;

export default function LessonCheckIn({ lesson, phaseIndex, priorEvidence, onEvidence }: Props) {
  return phaseIndex === 4
    ? lesson.exitTicket
      ? <ChapterExitTicket lesson={lesson} exitTicket={lesson.exitTicket} priorEvidence={priorEvidence} onEvidence={onEvidence} />
      : null
    : <LessonCheckInForm lesson={lesson} phaseIndex={phaseIndex} priorEvidence={priorEvidence} onEvidence={onEvidence} />;
}

function LessonCheckInForm({ lesson, phaseIndex, priorEvidence, onEvidence }: Props) {
  const checkIn = lesson.checkIns[phaseIndex];
  const answerId = useId();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [writtenAnswer, setWrittenAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<CheckInFeedback | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [showExample, setShowExample] = useState(false);
  const canAnswer = checkIn.mode === "choice"
    ? selectedOption !== null
    : writtenAnswer.trim().length > 0;
  const hintAllowed = phaseIndex < 2;

  async function submitAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setRequestError(null);
    setFeedback(null);
    setIsSubmitting(true);

    try {
      const nextAttempt = attempt + 1;
      const supportLevel = showExample ? 2 : showHint ? 1 : 0;
      let result: CheckInFeedback;
      if (checkIn.mode === "choice") {
        const selected = selectedOption === null ? undefined : checkIn.options[selectedOption];
        if (!selected) throw new Error("Välj ett svar innan du skickar.");

        result = await submitCheckIn({
          mode: "choice",
          question: checkIn.question,
          answer: selected.label,
          focus: lesson.checkInFocus,
          isCorrect: selected.correct,
          learningContext: {
            attempt: nextAttempt,
            supportLevel,
            priorEvidence,
          },
        });
      } else {
        result = await submitCheckIn({
          mode: "text",
          question: checkIn.question,
          answer: writtenAnswer,
          focus: lesson.checkInFocus,
          learningContext: {
            attempt: nextAttempt,
            supportLevel,
            priorEvidence,
          },
        });
      }
      setAttempt(nextAttempt);
      setFeedback(result);
      onEvidence(lesson.skillIds, result.kind === "retry"
        ? "needs_support"
        : supportLevel === 0 ? "independent" : "supported");
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "AI-återkopplingen misslyckades. Försök igen.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="check-in" onSubmit={submitAnswer}>
      <p className="check-in-question">{checkIn.question}</p>
      {checkIn.mode === "choice" ? (
        <div className="check-in-options" role="group" aria-label="Välj ett svar">
          {checkIn.options.map((option, index) => (
            <button
              aria-pressed={selectedOption === index}
              className={`check-in-option ${selectedOption === index ? "is-selected" : ""}`}
              key={option.label}
              onClick={() => {
                setSelectedOption(index);
                setWrittenAnswer("");
                setFeedback(null);
                setRequestError(null);
              }}
              type="button"
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : (
        <>
          <label className="check-in-answer-label" htmlFor={answerId}>Ditt svar</label>
          <textarea
            className="check-in-answer"
            id={answerId}
            onChange={(event) => {
              setWrittenAnswer(event.target.value);
              setSelectedOption(null);
              setFeedback(null);
              setRequestError(null);
            }}
            placeholder="Skriv ditt svar här …"
            rows={2}
            value={writtenAnswer}
          />
        </>
      )}
      {showHint && <p className="check-in-hint">{lesson.hint}</p>}
      {showExample && (
        <div className="check-in-foundation">
          <strong>Exempel att undersöka</strong>
          <p>{lesson.foundationSupport}</p>
          <q>{lesson.foundationExample}</q>
          <p>Vad i exemplet hjälper läsaren att följa tanken?</p>
        </div>
      )}
      {requestError && <p className="check-in-error" role="alert">{requestError}</p>}
      {feedback && (
        <div className={`check-in-feedback is-${feedback.kind === "on_track" ? "on-track" : "retry"}`} role="status">
          <strong>AI-coach</strong>
          <span>{feedback.feedback}</span>
        </div>
      )}
      <div className="check-in-actions">
        {!feedback && <span className="request-disclosure">Ditt svar och tidigare stödsignaler skickas till OpenAI</span>}
        {hintAllowed && (
          <button className="hint-button" onClick={() => setShowHint((visible) => !visible)} type="button">
            {showHint ? "Dölj ledtråd" : "Jag behöver en ledtråd"}
          </button>
        )}
        {hintAllowed && feedback?.kind === "retry" && attempt > 1 && !showExample && (
          <button className="hint-button" onClick={() => setShowExample(true)} type="button">
            Se ett exempel
          </button>
        )}
        <button className="primary-button check-in-submit" disabled={!canAnswer || isSubmitting || attempt >= maxAttempts} type="submit">
          {isSubmitting ? "Skickar …" : feedback ? "Försök igen" : "Svara"}
        </button>
      </div>
    </form>
  );
}
