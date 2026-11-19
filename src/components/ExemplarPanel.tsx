import { useMemo, useRef } from "react";
import { exemplarFocus, exemplarLabels, exemplarTexts, markExemplar, type ExemplarComparison } from "../data/exemplars";
import type { SkillId } from "../data/lessons";
import { useFitToHeight } from "../lib/useFitToHeight";

export type ExemplarMode =
  /** First meeting: the whole text is visible while the student listens (the button is on the whiteboard). */
  | "listen"
  /** The whole text without marks. */
  | "plain"
  /** One part is lit in yellow and enlarged, in step with the whiteboard; the rest is blurred. */
  | "focus"
  /** The check: the lesson's parts are lit and the student answers by clicking one of them. */
  | "pick"
  /** A simple and a developed example side by side; matching parts are lit in step with the whiteboard. */
  | "compare";

type Props = {
  skillId: SkillId;
  mode: ExemplarMode;
  /** Which of the lesson's highlights is in focus (mode "focus"). */
  focusIndex?: number | null;
  /** State of the check in mode "pick". */
  pick?: { selected: number | null; found: number[]; disabled: boolean };
  onPick?: (index: number) => void;
  /** The two examples and which pair of parts is in focus (mode "compare"). */
  comparison?: ExemplarComparison | null;
  pairIndex?: number | null;
};

const fittedLayout = "(min-width: 901px) and (min-height: 480px)";

/**
 * The exemplar text on the writing surface. Edda decides what it shows: the student cannot
 * switch views here, the text follows the whiteboard.
 */
export default function ExemplarPanel({ skillId, mode, focusIndex = null, pick, onPick, comparison = null, pairIndex = null }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLElement>(null);

  const isPick = mode === "pick";
  const text = exemplarTexts.strong;
  const lessonHighlights = exemplarFocus[skillId].highlights.strong;
  const focused = mode === "focus" && focusIndex !== null ? lessonHighlights[focusIndex] ?? null : null;
  const marked = useMemo(
    () => markExemplar(text, isPick ? lessonHighlights : focused ? [focused] : []),
    [text, isPick, lessonHighlights, focused],
  );

  // The whole text stays visible without scrolling.
  useFitToHeight(stageRef, textRef, fittedLayout, 0.45);

  if (mode === "compare" && comparison) {
    const pair = pairIndex !== null ? comparison.pairs[pairIndex] ?? null : null;
    return (
      <div className="exemplar-panel is-compare">
        <div className="exemplar-stage" ref={stageRef}>
          <article
            aria-label="Två exempel att jämföra"
            className={`exemplar-text exemplar-compare ${pair ? "is-focusing" : ""}`}
            ref={textRef}
          >
            <ComparedExample label={comparison.simpleLabel} text={comparison.simple} quote={pair?.simple ?? null} />
            <ComparedExample label={comparison.developedLabel} text={comparison.developed} quote={pair?.developed ?? null} />
          </article>
        </div>
      </div>
    );
  }

  return (
    <div className={`exemplar-panel is-${mode}`}>
      <div className="exemplar-stage" ref={stageRef}>
        <article
          aria-label={`${exemplarLabels.strong}: ${text.title}`}
          className={`exemplar-text ${focused ? "is-focusing" : ""}`}
          ref={textRef}
        >
          {marked.blocks.map((block, blockIndex) => {
            const content = block.segments.map((segment, index) => {
              if (segment.kind !== "mark") return <span className="exemplar-plain" key={index}>{segment.text}</span>;

              if (isPick) {
                const isFound = pick?.found.includes(segment.index) ?? false;
                const isSelected = pick?.selected === segment.index;
                return (
                  <button
                    aria-pressed={isFound || isSelected}
                    className={`exemplar-mark is-candidate ${isFound ? "is-solved" : isSelected ? "is-selected" : ""}`}
                    disabled={(pick?.disabled ?? true) || isFound}
                    key={index}
                    onClick={() => onPick?.(segment.index)}
                    type="button"
                  >
                    {segment.text}
                  </button>
                );
              }

              return (
                <mark className="exemplar-mark is-focus" key={index}>
                  {segment.text}
                  <span className="exemplar-mark-label"> ({segment.label}) </span>
                </mark>
              );
            });

            return block.role === "title"
              ? <h2 key={blockIndex}>{content}</h2>
              : <p key={blockIndex}>{content}</p>;
          })}
        </article>
      </div>
    </div>
  );
}

/** One of the two compared examples, with the part in focus lit and the rest stepped back. */
function ComparedExample({ label, text, quote }: { label: string; text: string; quote: string | null }) {
  const start = quote ? text.indexOf(quote) : -1;

  return (
    <section className="compared-example">
      <h2>{label}</h2>
      <p>
        {start < 0 || !quote ? (
          <span className="exemplar-plain">{text}</span>
        ) : (
          <>
            <span className="exemplar-plain">{text.slice(0, start)}</span>
            <mark className="exemplar-mark is-focus">{quote}</mark>
            <span className="exemplar-plain">{text.slice(start + quote.length)}</span>
          </>
        )}
      </p>
    </section>
  );
}
