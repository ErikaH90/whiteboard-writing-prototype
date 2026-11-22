import { useEffect } from "react";
import type { CheckInFeedback } from "../lib/coachApi";
import { stopSpeaking } from "../lib/eddaVoice";

const stepNames = ["", "Grundläggande svar", "Utvecklat svar", "Välutvecklat svar"];
const rings: [number, number][] = [[7, 15], [15, 24], [24, 33]];

function point(radius: number, angle: number): string {
  const radians = ((angle - 90) * Math.PI) / 180;
  return `${(20 + radius * Math.cos(radians)).toFixed(1)},${(36 + radius * Math.sin(radians)).toFixed(1)}`;
}

function sector(inner: number, outer: number): string {
  return `M${point(outer, -30)} A${outer},${outer} 0 0 1 ${point(outer, 30)} L${point(inner, 30)} A${inner},${inner} 0 0 0 ${point(inner, -30)} Z`;
}

/**
 * Edda's mark for work on the right track. With a level it is one slice of the writing map,
 * filled from the centre outwards in the same three steps and colours: it shows how developed
 * the answer was, as information about the work and not as a prize. Without a level it is a
 * plain mark that something is done.
 */
export function EddaMark({ level, className = "" }: { level?: number; className?: string }) {
  if (level === undefined) {
    return (
      <svg aria-hidden="true" className={`edda-mark is-done ${className}`} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="11" />
        <path d="M6.8 12.4l3.4 3.4 7-7.4" />
      </svg>
    );
  }
  const step = Math.min(3, Math.max(1, level));
  return (
    <svg aria-label={stepNames[step]} className={`edda-mark is-level-${step} ${className}`} role="img" viewBox="0 0 40 36">
      {rings.map(([inner, outer], ring) => (
        <path className={ring < step ? "is-filled" : ""} d={sector(inner + 1, outer - 1)} key={inner} />
      ))}
    </svg>
  );
}

/**
 * Edda's response to an answer, shown as Edda speaking: her face and a speech bubble.
 * An answer on the right track gets a mark that shows how developed the answer was, in the same
 * three steps as the writing map.
 */
export default function EddaFeedback({ feedback }: { feedback: CheckInFeedback }) {
  const onTrack = feedback.kind === "on_track";
  const level = feedback.level;

  // A written bubble and Edda's voice are never used at once: if she is still talking, she stops.
  useEffect(() => {
    stopSpeaking();
  }, []);

  return (
    <div className={`edda-says is-${onTrack ? "on-track" : "retry"}`} role="status">
      <span aria-hidden="true" className="edda-face" />
      <div className="edda-bubble-wrap">
        <strong className="edda-name">Edda</strong>
        <div className="edda-bubble">
          {onTrack && (level === undefined ? (
            // A click on the right place is simply right; an answer in the student's own words has a step.
            <EddaMark className="is-earned" />
          ) : (
            <span className="edda-step">
              <EddaMark className="is-earned" level={level} />
              <span className="edda-step-name">{["", "grundläggande", "utvecklat", "välutvecklat"][Math.min(3, Math.max(1, level))]}</span>
            </span>
          ))}
          <span>{feedback.feedback}</span>
        </div>
      </div>
    </div>
  );
}
