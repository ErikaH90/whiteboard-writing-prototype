import { useState } from "react";
import EddaFeedback from "./EddaFeedback";
import type { LearningEvidence, Lesson, SkillId } from "../data/lessons";
import { submitCheckIn, type CheckInFeedback, type LearningContext } from "../lib/coachApi";
import { Written, useBoardSettled } from "./BoardWriting";

type Props = {
  lesson: Lesson;
  /** The pair to compare: the lesson's own examples or a personalized pair. */
  examples: { needsWork: string; strong: string };
  /** Show the stronger example first, so that its position cannot be learned by heart. */
  strongFirst: boolean;
  priorEvidence: LearningContext["priorEvidence"];
  onEvidence: (skillIds: SkillId[], evidence: LearningEvidence) => void;
  /** Called when the check is done: right answer, two tries, or the service failed. */
  onAttempt?: () => void;
};

const maxAttempts = 10;

/**
 * Modelling check: the student answers by clicking the better example directly,
 * while both examples are still in front of them.
 */
export default function ExamplePick({ lesson, examples, strongFirst, priorEvidence, onEvidence, onAttempt }: Props) {
  const settled = useBoardSettled();
  const [selected, setSelected] = useState<"strong" | "needsWork" | null>(null);
  const [feedback, setFeedback] = useState<CheckInFeedback | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [solved, setSolved] = useState(false);
  const order = strongFirst ? (["strong", "needsWork"] as const) : (["needsWork", "strong"] as const);
  const prompt = lesson.model.question;

  async function choose(choice: "strong" | "needsWork") {
    if (isSubmitting || solved || attempt >= maxAttempts) return;
    const isCorrect = choice === "strong";
    const nextAttempt = attempt + 1;
    setSelected(choice);
    setFeedback(null);
    setRequestError(null);
    setIsSubmitting(true);

    try {
      const result = await submitCheckIn({
        mode: "choice",
        question: prompt,
        answer: examples[choice],
        focus: lesson.checkInFocus,
        isCorrect,
        learningContext: {
          attempt: nextAttempt,
          supportLevel: 0,
          priorEvidence,
        },
      });
      setAttempt(nextAttempt);
      setFeedback(result);
      setSolved(isCorrect);
      if (isCorrect || nextAttempt >= 2) onAttempt?.();
      onEvidence(lesson.skillIds, !isCorrect
        ? "needs_support"
        : nextAttempt === 1 ? "independent" : "supported");
    } catch (error) {
      setSelected(null);
      onAttempt?.();
      setRequestError(error instanceof Error ? error.message : "Återkopplingen misslyckades. Försök igen.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="teaching-content example-pick">
      <p className="board-question example-pick-prompt"><Written>{prompt}</Written></p>
      <div className="example-pair" role="group" aria-label="Välj ett exempel">
        {order.map((choice, index) => (
          <ExampleOption
            key={choice}
            label={solved
              ? choice === "strong" ? "MER UTVECKLAT" : "MINDRE UTVECKLAT"
              : `EXEMPEL ${index === 0 ? "A" : "B"}`}
            text={examples[choice]}
            tone={solved ? choice : null}
            isSelected={selected === choice}
            disabled={!settled || isSubmitting || solved || attempt >= maxAttempts}
            onChoose={() => choose(choice)}
          />
        ))}
      </div>
      {isSubmitting && <p className="example-pick-status" role="status">Edda läser ditt val …</p>}
      {requestError && <p className="check-in-error" role="alert">{requestError}</p>}
      {feedback && (
        <EddaFeedback feedback={feedback} />
      )}
    </div>
  );
}

function ExampleOption({ label, text, tone, isSelected, disabled, onChoose }: {
  label: string;
  text: string;
  tone: "strong" | "needsWork" | null;
  isSelected: boolean;
  disabled: boolean;
  onChoose: () => void;
}) {
  return (
      <button
        aria-pressed={isSelected}
        className={`example-card example-option board-hold ${tone === "strong" ? "example-strong" : tone === "needsWork" ? "example-needs-work" : ""} ${isSelected ? "is-selected" : ""}`}
        disabled={disabled}
        onClick={onChoose}
        type="button"
      >
        <span className="example-label"><Written>{label}</Written></span>
        <span className="example-text"><Written>{text}</Written></span>
      </button>
  );
}
