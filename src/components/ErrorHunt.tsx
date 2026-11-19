import { useState } from "react";
import type { ErrorHunt as ErrorHuntData } from "../data/exemplars";
import type { LearningEvidence, Lesson, SkillId } from "../data/lessons";
import { submitCheckIn, type CheckInFeedback, type LearningContext } from "../lib/coachApi";
import { Written } from "./BoardWriting";
import EddaFeedback from "./EddaFeedback";

type Props = {
  lesson: Lesson;
  hunt: ErrorHuntData;
  priorEvidence: LearningContext["priorEvidence"];
  onEvidence: (skillIds: SkillId[], evidence: LearningEvidence) => void;
  /** Called when the student has gone through all the questions. */
  onDone?: () => void;
};

/**
 * An invented text with language errors on the whiteboard. Edda asks for one kind of error at
 * a time and the student answers by clicking in the text. Every part of the text can be
 * clicked, so nothing gives the answers away. Afterwards the corrected version is shown.
 */
export default function ErrorHunt({ lesson, hunt, priorEvidence, onEvidence, onDone }: Props) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [solvedParts, setSolvedParts] = useState<number[]>([]);
  const [found, setFound] = useState<number[]>([]);
  const [missed, setMissed] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [solved, setSolved] = useState(false);
  const [feedback, setFeedback] = useState<CheckInFeedback | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const question = hunt.questions[questionIndex];
  const isLastQuestion = questionIndex === hunt.questions.length - 1;
  // A question is done when it is solved, tried twice, or the service failed.
  const isResolved = solved || attempt >= 2 || requestError !== null;

  async function choose(index: number) {
    if (isSubmitting || solved || isFinished || solvedParts.includes(index) || found.includes(index)) return;
    const isCorrect = question.targets.includes(index);
    const nextFound = isCorrect ? [...found, index] : found;
    setRequestError(null);
    setFeedback(null);

    // With several errors of the same kind the first finds are confirmed in the text.
    if (isCorrect && nextFound.length < question.targets.length) {
      setFound(nextFound);
      setMissed(null);
      return;
    }

    const nextAttempt = attempt + 1;
    setFound(nextFound);
    setMissed(isCorrect ? null : index);
    setIsSubmitting(true);
    try {
      const result = await submitCheckIn({
        mode: "choice",
        question: question.prompt,
        answer: isCorrect ? nextFound.map((part) => hunt.segments[part].text).join(" / ") : hunt.segments[index].text,
        focus: lesson.checkInFocus,
        isCorrect,
        learningContext: { attempt: nextAttempt, supportLevel: 0, priorEvidence },
      });
      setAttempt(nextAttempt);
      setFeedback(result);
      setSolved(isCorrect);
      onEvidence(lesson.skillIds, !isCorrect ? "needs_support" : nextAttempt === 1 ? "independent" : "supported");
    } catch (error) {
      setMissed(null);
      setRequestError(error instanceof Error ? error.message : "Återkopplingen misslyckades. Försök igen.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function next() {
    // The errors of this question stay marked in the text, also when the student moved on without finding them.
    setSolvedParts((current) => [...new Set([...current, ...question.targets])]);
    setFound([]);
    setMissed(null);
    setAttempt(0);
    setSolved(false);
    setFeedback(null);
    setRequestError(null);
    if (isLastQuestion) {
      setIsFinished(true);
      onDone?.();
    } else {
      setQuestionIndex(questionIndex + 1);
    }
  }

  const shownAsFound = (index: number) => solvedParts.includes(index) || found.includes(index);
  const explained = isFinished
    ? []
    : question.targets.filter((target) => solved ? true : found.includes(target));

  return (
    <div className="board-activity error-hunt">
      <p className="board-kicker">
        {isFinished ? "RÄTTAD TEXT" : `DIN TUR · ${questionIndex + 1} AV ${hunt.questions.length}`}
      </p>
      <p className="board-prompt">
        <Written>{isFinished ? "Så här kan texten bli" : question.prompt}</Written>
      </p>

      <p className="hunt-text" role="group" aria-label="Elevens text">
        {isFinished && <span className="compare-label">Före</span>}
        {hunt.segments.map((segment, index) => (
          <button
            aria-pressed={shownAsFound(index)}
            className={`hunt-part ${shownAsFound(index) ? "is-found" : ""} ${missed === index ? "is-missed" : ""}`}
            disabled={isFinished || isSubmitting || solved || shownAsFound(index)}
            key={index}
            onClick={() => choose(index)}
            type="button"
          >
            {segment.text}
          </button>
        ))}
      </p>

      {isFinished ? (
        <>
          <p className="compare-quote is-developed"><span className="compare-label">Efter</span>{hunt.corrected}</p>
          <ul className="hunt-areas">
            {hunt.areas.map((area) => (
              <li key={area.name}><strong>{area.name}:</strong> {area.fix}</li>
            ))}
          </ul>
        </>
      ) : (
        <>
          {question.targets.length > 1 && found.length > 0 && !solved && !isSubmitting && (
            <p className="example-pick-status" role="status">{found.length} av {question.targets.length} hittade.</p>
          )}
          {explained.length > 0 && (
            <ul className="hunt-explanations">
              {explained.map((target) => (
                <li key={target}><strong>{hunt.segments[target].label}:</strong> {hunt.segments[target].explain}</li>
              ))}
            </ul>
          )}
          {isSubmitting && <p className="example-pick-status" role="status">Edda läser ditt val …</p>}
          {requestError && <p className="check-in-error" role="alert">{requestError}</p>}
          {feedback && <EddaFeedback feedback={feedback} />}
          {isResolved && !isSubmitting && (
            <button className="primary-button hunt-next" onClick={next} type="button">
              {isLastQuestion ? "Visa rättad text" : "Nästa fel"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
