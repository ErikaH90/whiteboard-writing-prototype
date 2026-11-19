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
 * Edda's response to an answer. An answer on the right track earns a star whose size follows
 * how developed the answer was, so that a big star has to be worked for.
 */
export default function EddaFeedback({ feedback }: { feedback: CheckInFeedback }) {
  const onTrack = feedback.kind === "on_track";
  const level = feedback.level ?? 1;

  return (
    <div className={`check-in-feedback is-${onTrack ? "on-track" : "retry"}`} role="status">
      {onTrack && <EddaStar className={`is-earned is-level-${level}`} />}
      <strong>Edda</strong>
      <span>{feedback.feedback}</span>
    </div>
  );
}
