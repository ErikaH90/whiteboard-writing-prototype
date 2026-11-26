import type { WritingTopic } from "../data/topics";

/**
 * A small drawn picture for each writing topic, in the colours of the rest of the page.
 * The pictures are decoration: the topic's name is the button's text.
 */
export default function TopicPicture({ id }: { id: WritingTopic["id"] }) {
  return (
    <svg aria-hidden="true" className={`topic-picture is-${id}`} viewBox="0 0 56 56">
      <rect className="topic-picture-tile" height="56" rx="14" width="56" />
      {id === "school-start" && (
        // The school day: a classroom clock.
        <g>
          <circle cx="28" cy="29" fill="#fff" r="16" stroke="#2563eb" strokeWidth="3" />
          <path d="M22 11.5 18.5 8M34 11.5 37.5 8" stroke="#2563eb" strokeLinecap="round" strokeWidth="3" />
          {[0, 90, 180, 270].map((angle) => (
            <path d="M28 16.5v3" key={angle} stroke="#9db4ee" strokeLinecap="round" strokeWidth="2" transform={`rotate(${angle} 28 29)`} />
          ))}
          <path d="M28 29v-8M28 29l6 4" fill="none" stroke="#23262f" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
          <circle cx="28" cy="29" fill="#2563eb" r="2.2" />
        </g>
      )}
      {id === "phones" && (
        // The phone: a screen with two messages.
        <g>
          <rect fill="#23262f" height="38" rx="6" width="24" x="16" y="9" />
          <rect fill="#fff" height="28" rx="2.5" width="18" x="19" y="13" />
          <rect fill="#6a4fd0" height="6" rx="3" width="11" x="21" y="17" />
          <rect fill="#d9d1f5" height="6" rx="3" width="11" x="24" y="26" />
          <rect fill="#6a4fd0" height="4" rx="2" width="7" x="21" y="34.5" />
          <circle cx="28" cy="43.8" fill="#fff" r="1.3" />
        </g>
      )}
      {id === "leisure" && (
        // Free time: a football.
        <g>
          <circle cx="28" cy="28" fill="#fff" r="17" stroke="#23262f" strokeWidth="3" />
          <path d="M28 19.5 35.6 25 32.7 34h-9.4L20.4 25Z" fill="#23262f" />
          <path d="M28 19.5V11.5M35.6 25l7.6-2.5M32.7 34l4.7 6.5M23.3 34l-4.7 6.5M20.4 25l-7.6-2.5" fill="none" stroke="#23262f" strokeLinecap="round" strokeWidth="2.5" />
        </g>
      )}
      {id === "own" && (
        // The student's own topic: a pencil.
        <g>
          <path d="m17 39 3-10 15-15 7 7-15 15Z" fill="#fff" stroke="#23262f" strokeLinejoin="round" strokeWidth="3" />
          <path d="m31 18 7 7" stroke="#23262f" strokeWidth="3" />
          <path d="m17 39 3-10 7 7Z" fill="#f0c94a" stroke="#23262f" strokeLinejoin="round" strokeWidth="3" />
        </g>
      )}
    </svg>
  );
}
