import { useMemo, useRef, useState } from "react";
import {
  exemplarFocus,
  exemplarLabels,
  exemplarTexts,
  markExemplar,
  type ExemplarId,
} from "../data/exemplars";
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
  /** After the walk-through: all marks with numbered explanations, and the comparison text. */
  | "recap";

type Props = {
  skillId: SkillId;
  mode: ExemplarMode;
  /** Which of the lesson's highlights is in focus (mode "focus"). */
  focusIndex?: number | null;
  /** State of the check in mode "pick". */
  pick?: { selected: number | null; solved: boolean; disabled: boolean };
  onPick?: (index: number) => void;
};

const fittedLayout = "(min-width: 901px) and (min-height: 480px)";

export default function ExemplarPanel({ skillId, mode, focusIndex = null, pick, onPick }: Props) {
  const [chosen, setChosen] = useState<ExemplarId>("strong");
  const stageRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLElement>(null);

  const isRecap = mode === "recap";
  const isPick = mode === "pick";
  const exemplarId = isRecap ? chosen : "strong";
  const text = exemplarTexts[exemplarId];
  const lessonHighlights = exemplarFocus[skillId].highlights[exemplarId];
  const focused = mode === "focus" && focusIndex !== null ? lessonHighlights[focusIndex] ?? null : null;
  const marked = useMemo(
    () => markExemplar(text, isRecap || isPick ? lessonHighlights : focused ? [focused] : []),
    [text, isRecap, isPick, lessonHighlights, focused],
  );

  // Outside the recap the whole text stays visible without scrolling.
  useFitToHeight(stageRef, textRef, isRecap ? "not all" : fittedLayout, 0.45);

  return (
    <div className={`exemplar-panel is-${mode}`}>
      {isRecap && (
        <div className="exemplar-toolbar">
          <div className="exemplar-choice" role="group" aria-label="Välj exempeltext">
            {(Object.keys(exemplarLabels) as ExemplarId[]).map((id) => (
              <button
                aria-pressed={exemplarId === id}
                className="exemplar-choice-option"
                key={id}
                onClick={() => setChosen(id)}
                type="button"
              >
                {exemplarLabels[id]}
              </button>
            ))}
          </div>
        </div>
      )}

      {isRecap && marked.legend.length > 0 && (
        <div className="exemplar-legend">
          <strong>Det gulmarkerade visar</strong>
          <ol>
            {marked.legend.map((item) => <li key={item.number}>{item.label}</li>)}
          </ol>
        </div>
      )}

      <div className="exemplar-stage" ref={stageRef}>
        <article
          aria-label={`${exemplarLabels[exemplarId]}: ${text.title}`}
          className={`exemplar-text ${focused ? "is-focusing" : ""}`}
          ref={textRef}
        >
          {marked.blocks.map((block, blockIndex) => {
            const content = block.segments.map((segment, index) => {
              if (segment.kind !== "mark") return <span className="exemplar-plain" key={index}>{segment.text}</span>;

              if (isPick) {
                const isSelected = pick?.selected === segment.index;
                return (
                  <button
                    aria-pressed={isSelected}
                    className={`exemplar-mark is-candidate ${isSelected ? (pick?.solved ? "is-solved" : "is-selected") : ""}`}
                    disabled={pick?.disabled ?? true}
                    key={index}
                    onClick={() => onPick?.(segment.index)}
                    type="button"
                  >
                    {segment.text}
                  </button>
                );
              }

              return (
                <mark className={`exemplar-mark ${focused ? "is-focus" : ""}`} key={index}>
                  {segment.text}
                  {isRecap ? (
                    <sup className="exemplar-mark-number">
                      <span className="exemplar-mark-label"> (markering {segment.number}: {segment.label}) </span>
                      <span aria-hidden="true">{segment.number}</span>
                    </sup>
                  ) : <span className="exemplar-mark-label"> ({segment.label}) </span>}
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
