import { useState } from "react";
import type { LearningEvidence, Lesson, SkillId } from "../data/lessons";
import type { LearningContext } from "../lib/coachApi";
import ExamplePick from "./ExamplePick";
import LessonCheckIn from "./LessonCheckIn";

type Stage = "example" | "recall" | "apply";

type Props = {
  /** The chapter that taught this part of the text. */
  lesson: Lesson;
  label: string;
  /** How far the part has come in the student's own text (0–3), from the writing map. */
  level: number;
  /** Edda's hint for the next step in this part, from the writing map. */
  hint: string;
  priorEvidence: LearningContext["priorEvidence"];
  onEvidence: (skillIds: SkillId[], evidence: LearningEvidence) => void;
  /** The student has changed the text since the practice began. */
  hasRevised: boolean;
  loading: boolean;
  onReadAgain: () => void;
  onBack: () => void;
};

/** The less of a part there is in the student's text, the more of the repetition comes first. */
function stagesFor(level: number): Stage[] {
  if (level <= 0) return ["example", "recall", "apply"];
  if (level === 1) return ["recall", "apply"];
  return ["apply"];
}

const reasons = [
  "Den här delen syns inte i din text än. Vi börjar med ett exempel, och sedan prövar du själv.",
  "Du har börjat på den här delen. Vi repeterar kärnan, och sedan prövar du i din text.",
  "Du har grunden. Pröva direkt i din egen text.",
  "Den här delen är välutvecklad i din text. Vill du ändå slipa på den, pröva direkt i texten.",
];

/**
 * More practice on one part of the text, chosen by the student in the writing map. What the
 * round contains follows how well the student masters the part: repetition for the one who
 * needs it, and straight to the student's own text for the one who has the basics.
 */
export default function PracticeRound({ lesson, label, level, hint, priorEvidence, onEvidence, hasRevised, loading, onReadAgain, onBack }: Props) {
  const [stages] = useState(() => stagesFor(level));
  const [index, setIndex] = useState(0);
  const [isDone, setIsDone] = useState(false);
  const stage = stages[index];

  function next() {
    setIndex((current) => current + 1);
    setIsDone(false);
  }

  return (
    <div className="board-activity practice-round">
      <p className="board-kicker">{`TRÄNA MER · ${label.toUpperCase()}`}</p>
      {index === 0 && <p className="practice-reason">{reasons[Math.min(3, Math.max(0, level))]}</p>}
      {stage === "example" && (
        <ExamplePick
          lesson={lesson}
          examples={lesson.model}
          strongFirst
          priorEvidence={priorEvidence}
          onEvidence={onEvidence}
          onAttempt={() => setIsDone(true)}
        />
      )}
      {stage === "recall" && (
        <LessonCheckIn
          lesson={lesson}
          phaseIndex={2}
          priorEvidence={priorEvidence}
          onEvidence={onEvidence}
          onAttempt={() => setIsDone(true)}
        />
      )}
      {stage === "apply" && (
        <>
          <p className="board-prompt">Pröva i din egen text</p>
          <p className="develop-note">
            <span className="compare-label">Att pröva</span>
            {hint || "Välj själv vad du vill utveckla i den här delen av din text."}
          </p>
          <button className="primary-button" disabled={!hasRevised || loading} onClick={onReadAgain} type="button">
            {loading ? "Edda läser din text …" : "Jag har prövat – låt Edda titta igen"}
          </button>
        </>
      )}
      <div className="practice-actions">
        {stage !== "apply" && isDone && (
          <button className="primary-button" onClick={next} type="button">Fortsätt</button>
        )}
        <button className="text-button" onClick={onBack} type="button">Tillbaka till skrivkartan</button>
      </div>
    </div>
  );
}
