import { useMemo, useRef } from "react";
import { exemplarFocus, exemplarLabels, exemplarTexts, markExemplar, type ExemplarComparison } from "../data/exemplars";
import type { SkillId } from "../data/lessons";
import { takesMoreRoom, useReadingSettings } from "../lib/readingSettings";
import { useFitToHeight } from "../lib/useFitToHeight";

export type ExemplarMode =
  /** First meeting: the whole text is visible while the student listens (the button is on the whiteboard). */
  | "listen"
  /** The whole text without marks. */
  | "plain"
  /** One part is lit in yellow and enlarged, in step with the whiteboard; the rest is blurred. */
  | "focus"
  /** The student looks for a part themselves: the lesson's parts are lit and one of them is clicked. */
  | "pick"
  /** A simple and a developed example side by side; matching parts are lit in step with the whiteboard. */
  | "compare";

type Props = {
  skillId: SkillId;
  mode: ExemplarMode;
  /** Which of the lesson's highlights is in focus (mode "focus"). */
  focusIndex?: number | null;
  /** State of the check in mode "pick". */
  /** `candidates` are the parts the whiteboard has gone through so far (indexes into the lesson's highlights). */
  pick?: { selected: number | null; found: number[]; disabled: boolean; candidates: number[] };
  onPick?: (index: number) => void;
  /** The two examples and which pair of parts is in focus (mode "compare"). */
  comparison?: ExemplarComparison | null;
  pairIndex?: number | null;
  /**
   * While the pair is unresolved the student looks for the matching part in the second example:
   * every changed part there can be clicked. `selected` is a wrong try.
   */
  comparePick?: { resolved: boolean; selected: number | null; disabled: boolean };
  onPickPair?: (pairIndex: number) => void;
  /**
   * The student looks around alone (mode "pick"): the parts are not marked until they are found,
   * so finding them takes reading. `onStray` is called for a click in the text beside the parts.
   */
  isExploring?: boolean;
  onStray?: () => void;
};

const fittedLayout = "(min-width: 901px) and (min-height: 480px)";

/**
 * The exemplar text on the writing surface. Edda decides what it shows: the student cannot
 * switch views here, the text follows the whiteboard.
 */
export default function ExemplarPanel({
  skillId,
  mode,
  focusIndex = null,
  pick,
  onPick,
  comparison = null,
  pairIndex = null,
  comparePick,
  onPickPair,
  isExploring = false,
  onStray,
}: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLElement>(null);

  const isPick = mode === "pick";
  const text = exemplarTexts.strong;
  const lessonHighlights = exemplarFocus[skillId].highlights.strong;
  const candidateKey = (pick?.candidates ?? []).join(",");
  const candidates = useMemo(() => candidateKey ? candidateKey.split(",").map(Number) : [], [candidateKey]);
  const focused = mode === "focus" && focusIndex !== null ? lessonHighlights[focusIndex] ?? null : null;
  const marked = useMemo(
    () => markExemplar(text, isPick ? candidates.map((index) => lessonHighlights[index]) : focused ? [focused] : []),
    [text, isPick, candidates, lessonHighlights, focused],
  );

  // The whole text stays visible without scrolling. When the student has asked for larger or wider
  // text it keeps that size and scrolls instead.
  const isRoomy = takesMoreRoom(useReadingSettings());
  useFitToHeight(stageRef, textRef, isRoomy ? "not all" : fittedLayout, 0.45);

  if (mode === "compare" && comparison) {
    const pair = pairIndex !== null ? comparison.pairs[pairIndex] ?? null : null;
    const isSearching = pair !== null && comparePick !== undefined && !comparePick.resolved;
    return (
      <div className="exemplar-panel is-compare">
        <div className="exemplar-stage" ref={stageRef}>
          <article
            aria-label="Två exempel att jämföra"
            className={`exemplar-text exemplar-compare ${pair && !isSearching ? "is-focusing" : ""}`}
            ref={textRef}
          >
            <ComparedExample
              label={comparison.simpleLabel}
              text={comparison.simple}
              marks={pair ? [{ quote: pair.simple }] : []}
            />
            <ComparedExample
              label={comparison.developedLabel}
              text={comparison.developed}
              marks={isSearching
                ? comparison.pairs.map((item, index) => ({
                  quote: item.developed,
                  isSelected: comparePick.selected === index,
                  disabled: comparePick.disabled,
                  onPick: () => onPickPair?.(index),
                }))
                : pair ? [{ quote: pair.developed }] : []}
            />
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
          className={`exemplar-text ${focused ? "is-focusing" : ""} ${isPick && isExploring ? "is-exploring" : ""}`}
          onClick={isPick && isExploring ? (event) => {
            if (!(event.target as HTMLElement).closest(".exemplar-mark")) onStray?.();
          } : undefined}
          ref={textRef}
        >
          {marked.blocks.map((block, blockIndex) => {
            const content = block.segments.map((segment, index) => {
              if (segment.kind !== "mark") return <span className="exemplar-plain" key={index}>{segment.text}</span>;

              if (isPick) {
                const partIndex = candidates[segment.index];
                const isFound = pick?.found.includes(partIndex) ?? false;
                const isSelected = pick?.selected === partIndex;
                return (
                  <button
                    aria-pressed={isFound || isSelected}
                    className={`exemplar-mark is-candidate ${isFound ? "is-solved" : isSelected ? "is-selected" : ""}`}
                    // While the student explores, the parts are not announced before they are found.
                    tabIndex={isExploring && !isFound ? -1 : undefined}
                    disabled={(pick?.disabled ?? true) || isFound}
                    key={index}
                    onClick={() => onPick?.(partIndex)}
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

type ComparedMark = { quote: string; isSelected?: boolean; disabled?: boolean; onPick?: () => void };

/**
 * One of the two compared examples. Marks without `onPick` are lit; marks with `onPick` are
 * parts the student can click while looking for the matching place.
 */
function ComparedExample({ label, text, marks }: { label: string; text: string; marks: ComparedMark[] }) {
  const found = marks
    .map((mark) => ({ mark, start: text.indexOf(mark.quote) }))
    .filter((item) => item.start >= 0)
    .sort((a, b) => a.start - b.start);
  const content: JSX.Element[] = [];
  let cursor = 0;

  found.forEach(({ mark, start }, index) => {
    if (start < cursor) return;
    if (start > cursor) content.push(<span className="exemplar-plain" key={`text-${index}`}>{text.slice(cursor, start)}</span>);
    content.push(mark.onPick ? (
      <button
        aria-pressed={mark.isSelected ?? false}
        className={`exemplar-mark is-candidate ${mark.isSelected ? "is-selected" : ""}`}
        disabled={mark.disabled}
        key={`mark-${index}`}
        onClick={mark.onPick}
        type="button"
      >
        {mark.quote}
      </button>
    ) : <mark className="exemplar-mark is-focus" key={`mark-${index}`}>{mark.quote}</mark>);
    cursor = start + mark.quote.length;
  });
  if (cursor < text.length) content.push(<span className="exemplar-plain" key="rest">{text.slice(cursor)}</span>);

  return (
    <section className="compared-example">
      <h2>{label}</h2>
      <p>{content}</p>
    </section>
  );
}
