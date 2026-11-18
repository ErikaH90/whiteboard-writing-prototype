import { useId, useState, type FormEvent } from "react";
import type { Lesson } from "../data/lessons";
import { submitCheckIn, type CheckInFeedback } from "../lib/coachApi";
import ChapterExitTicket from "./ChapterExitTicket";

type Props = {
  lesson: Lesson;
  phaseIndex: number;
};

export default function LessonCheckIn({ lesson, phaseIndex }: Props) {
  return phaseIndex === 4
    ? <ChapterExitTicket lesson={lesson} />
    : <LessonCheckInForm lesson={lesson} phaseIndex={phaseIndex} />;
}

function LessonCheckInForm({ lesson, phaseIndex }: Props) {
  const checkIn = lesson.checkIns[phaseIndex];
  const answerId = useId();
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [writtenAnswer, setWrittenAnswer] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<CheckInFeedback | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
      if (checkIn.mode === "choice") {
        const selected = selectedOption === null ? undefined : checkIn.options[selectedOption];
        if (!selected) throw new Error("Välj ett svar innan du skickar.");

        setFeedback(await submitCheckIn({
          mode: "choice",
          question: checkIn.question,
          answer: selected.label,
          focus: lesson.checkInFocus,
          isCorrect: selected.correct,
        }));
      } else {
        setFeedback(await submitCheckIn({
          mode: "text",
          question: checkIn.question,
          answer: writtenAnswer,
          focus: lesson.checkInFocus,
        }));
      }
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
      <p className="check-in-privacy">Frågan och ditt svar skickas till OpenAI när du väljer Svara.</p>
      {requestError && <p className="check-in-error" role="alert">{requestError}</p>}
      {feedback && (
        <div className={`check-in-feedback is-${feedback.kind === "on_track" ? "on-track" : "retry"}`} role="status">
          <strong>AI-coach</strong>
          <span>{feedback.feedback}</span>
        </div>
      )}
      <div className="check-in-actions">
        {hintAllowed && (
          <button className="hint-button" onClick={() => setShowHint((visible) => !visible)} type="button">
            {showHint ? "Dölj ledtråd" : "Jag behöver en ledtråd"}
          </button>
        )}
        <button className="primary-button check-in-submit" disabled={!canAnswer || isSubmitting} type="submit">
          {isSubmitting ? "Skickar …" : "Svara"}
        </button>
      </div>
    </form>
  );
}
