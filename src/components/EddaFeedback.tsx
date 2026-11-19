import type { CheckInFeedback } from "../lib/coachApi";

/** A small hand-drawn star in colour: the reward when the student is on the right track. */
export function EddaStar({ className = "" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={`edda-star ${className}`} viewBox="0 0 32 32">
      <path d="M16 3.2l3.7 8.1 8.8 1-6.6 6 1.9 8.7L16 22.6 8.2 27l1.9-8.7-6.6-6 8.8-1z" />
    </svg>
  );
}

/**
 * Edda's response to an answer, shown as Edda speaking: her face and a speech bubble.
 * An answer on the right track earns a star whose size follows how developed the answer was,
 * so that a big star has to be worked for.
 */
export default function EddaFeedback({ feedback }: { feedback: CheckInFeedback }) {
  const onTrack = feedback.kind === "on_track";
  const level = feedback.level ?? 1;

  return (
    <div className={`edda-says is-${onTrack ? "on-track" : "retry"}`} role="status">
      <span aria-hidden="true" className="edda-face" />
      <div className="edda-bubble-wrap">
        <strong className="edda-name">Edda</strong>
        <div className="edda-bubble">
          {onTrack && <EddaStar className={`is-earned is-level-${level}`} />}
          <span>{feedback.feedback}</span>
        </div>
      </div>
    </div>
  );
}
