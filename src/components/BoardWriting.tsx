import {
  Children,
  createContext,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { isVoiceActive, speak, useSoundOn } from "../lib/eddaVoice";

/**
 * Whiteboard writing: the board "writes" its text like a teacher with a pen and
 * reveals the content one part at a time.
 *
 * - <BoardSequence> shows its <BoardStep> children one at a time, like pages: the board is
 *   wiped for each new part so the whole whiteboard stays visible without scrolling.
 *   The sequence only moves forward.
 * - <Written> text inside a step is written in document order.
 * - <BoardPause /> and <BoardStep pause> wait until the student chooses to continue.
 * - <AfterWriting> shows controls once the step's text has been written.
 *
 * Outside a sequence all of these render their content directly.
 */

type InkStatus = "pending" | "writing" | "done";

type SequenceItem = {
  index: number;
  hidden: boolean;
  instant: boolean;
  /** The step hands the sequence its controls, so that the buttons act on it directly. */
  register: (controls: StepControls | null) => void;
  onSettled: () => void;
  onWaiting: (waiting: boolean) => void;
};

type StepControls = {
  /** Continue past the pause the step is waiting at. */
  resume: () => void;
};

type StepContextValue = {
  statusOf: (id: string) => InkStatus;
  register: () => void;
  finish: (id: string) => void;
  settled: boolean;
  /** True while nothing on the step is waiting to be written or said. */
  written: boolean;
};

type InkEntry = { id: string; pause: boolean };

const SequenceItemContext = createContext<SequenceItem | null>(null);
const StepContext = createContext<StepContextValue | null>(null);

const charDelay = 60;

/** Writing is animated only when the browser allows motion. */
export function canAnimateWriting(): boolean {
  return typeof window !== "undefined"
    && typeof window.matchMedia === "function"
    && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function delayAfter(character: string): number {
  if (".!?:".includes(character)) return 520;
  if (",;–".includes(character)) return 270;
  if (character === "\n") return 420;
  return charDelay;
}

type SequenceProps = {
  children: ReactNode;
  /** Show everything at once, e.g. when the student returns to a step already seen. */
  instant?: boolean;
  onComplete?: () => void;
  /** Reports which part the board is showing, so that other surfaces can follow along. */
  onPageChange?: (page: number) => void;
};

export function BoardSequence({ children, instant = false, onComplete, onPageChange }: SequenceProps) {
  const steps = Children.toArray(children).filter(isValidElement<StepProps>);
  const [startInstant] = useState(instant);
  const [revealed, setRevealed] = useState(startInstant ? Number.POSITIVE_INFINITY : 1);
  const [settledCount, setSettledCount] = useState(startInstant ? Number.POSITIVE_INFINITY : 0);
  const [waitingInStep, setWaitingInStep] = useState(false);
  const stepControls = useRef(new Map<number, StepControls>());
  const containerRef = useRef<HTMLDivElement>(null);
  const refocusRef = useRef(false);
  const completedRef = useRef(startInstant);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const visibleCount = Math.min(revealed, steps.length);
  const currentSettled = settledCount >= visibleCount;
  // The board shows its newest part only. It writes at its own pace and moves forward only:
  // there is no way to skip ahead or to look back, only to continue at a stop.
  const shownPage = Math.max(0, visibleCount - 1);
  const canContinue = !currentSettled
    ? waitingInStep
    : visibleCount < steps.length && !steps[shownPage]?.props.locked;
  const isComplete = steps.length > 0 && settledCount >= steps.length;
  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;

  useEffect(() => {
    onPageChangeRef.current?.(shownPage);
  }, [shownPage]);

  useEffect(() => {
    if (!isComplete || completedRef.current) return;
    completedRef.current = true;
    onCompleteRef.current?.();
  }, [isComplete]);

  // Keep keyboard focus on the board when the continue button has done its job.
  useEffect(() => {
    if (canContinue || !refocusRef.current) return;
    refocusRef.current = false;
    const stepElements = containerRef.current?.querySelectorAll<HTMLElement>(":scope > [data-board-step]");
    Array.from(stepElements ?? []).find((element) => !element.hidden)?.focus({ preventScroll: true });
  }, [canContinue]);

  function handleSettled(index: number, pause: boolean) {
    setSettledCount((current) => Math.max(current, index + 1));
    if (!pause) setRevealed((current) => Math.max(current, index + 2));
  }

  function handleControl() {
    refocusRef.current = true;
    if (!currentSettled) {
      stepControls.current.get(shownPage)?.resume();
    } else {
      setRevealed((current) => current + 1);
    }
  }

  return (
    <div className="board-sequence" ref={containerRef}>
      {steps.slice(0, visibleCount).map((step, index) => (
        <SequenceItemContext.Provider
          key={step.key ?? index}
          value={{
            index,
            hidden: index !== shownPage,
            instant: startInstant,
            register: (controls) => {
              if (controls) stepControls.current.set(index, controls);
              else stepControls.current.delete(index);
            },
            onSettled: () => handleSettled(index, Boolean(step.props.pause)),
            onWaiting: setWaitingInStep,
          }}
        >
          {step}
        </SequenceItemContext.Provider>
      ))}
      {canContinue && (
        <div className="board-continue-row">
          <button
            className="primary-button board-continue"
            onBlur={() => { refocusRef.current = false; }}
            onClick={handleControl}
            type="button"
          >
            Fortsätt
          </button>
        </div>
      )}
    </div>
  );
}

type StepProps = {
  children: ReactNode;
  className?: string;
  /** Wait for the student before the next step is shown. */
  pause?: boolean;
  /** Keep the student on this step: "Fortsätt" is not offered until the step is unlocked. */
  locked?: boolean;
};

export function BoardStep({ children, className }: StepProps) {
  const item = useContext(SequenceItemContext);
  const itemRef = useRef(item);
  itemRef.current = item;
  const instant = item ? item.instant : true;
  const ref = useRef<HTMLDivElement>(null);
  const [version, setVersion] = useState(0);
  const [order, setOrder] = useState<InkEntry[] | null>(null);
  const [done, setDone] = useState<ReadonlySet<string>>(() => new Set());
  const [settled, setSettled] = useState(instant);

  const register = useCallback(() => setVersion((current) => current + 1), []);
  const finish = useCallback((id: string) => {
    setDone((current) => current.has(id) ? current : new Set(current).add(id));
  }, []);

  // The text is written in document order, so read the order from the DOM.
  useLayoutEffect(() => {
    if (instant || !ref.current) return;
    const next = Array.from(ref.current.querySelectorAll<HTMLElement>("[data-board-ink]"), (node) => ({
      id: node.dataset.boardInk ?? "",
      pause: node.dataset.boardPause !== undefined,
    }));
    setOrder((current) => current
      && current.length === next.length
      && current.every((entry, index) => entry.id === next[index].id)
      ? current
      : next);
  }, [version, instant]);

  const active = order?.find((entry) => !done.has(entry.id)) ?? null;
  const activeId = active?.id ?? null;
  const isWaiting = Boolean(active?.pause);
  const allWritten = order !== null && active === null;

  useEffect(() => {
    if (settled || !allWritten) return;
    setSettled(true);
    itemRef.current?.onSettled();
  }, [settled, allWritten]);

  useEffect(() => {
    if (instant) return;
    itemRef.current?.onWaiting(isWaiting);
  }, [instant, isWaiting]);

  // The sequence's buttons call these directly; they always see the step's latest state.
  const controlsRef = useRef<StepControls>({ resume: () => undefined });
  controlsRef.current = {
    resume: () => {
      if (active?.pause) finish(active.id);
    },
  };

  useEffect(() => {
    const current = itemRef.current;
    if (!current) return;
    current.register({ resume: () => controlsRef.current.resume() });
    return () => current.register(null);
  }, []);

  const value = useMemo<StepContextValue>(() => ({
    statusOf: (id) => instant || done.has(id) ? "done" : id === activeId ? "writing" : "pending",
    register,
    finish,
    settled,
    written: instant || allWritten,
  }), [instant, done, activeId, register, finish, settled, allWritten]);

  return (
    <div
      className={`board-step${instant ? "" : " is-appearing"}${className ? ` ${className}` : ""}`}
      data-board-step=""
      hidden={item?.hidden ?? false}
      ref={ref}
      tabIndex={-1}
    >
      <StepContext.Provider value={value}>{children}</StepContext.Provider>
    </div>
  );
}

/**
 * Text on the board that appears in order. With `byHand` it is written out letter by letter,
 * which is used for headings; other text is shown at once when its turn comes, so that the
 * student does not have to wait for long explanations. Rendered as plain text outside a step.
 */
export function Written({ children, byHand = false, spoken = false }: {
  children: string;
  byHand?: boolean;
  /** Edda says the text aloud first; it is shown when she has finished speaking. */
  spoken?: boolean;
}) {
  const step = useContext(StepContext);
  if (!step) return <>{children}</>;
  return <Ink byHand={byHand} key={children} spoken={spoken} step={step} text={children} />;
}

/** True while a written speech bubble from Edda is visible, so that she is never heard and read at once. */
function isEddaBubbleShown(): boolean {
  return Array.from(document.querySelectorAll(".edda-says")).some((bubble) => !bubble.closest("[hidden]"));
}

function Ink({ step, text, byHand, spoken }: { step: StepContextValue; text: string; byHand: boolean; spoken: boolean }) {
  const id = useId();
  const { register, finish } = step;
  const status = step.statusOf(id);
  const [animate] = useState(() => byHand && canAnimateWriting());
  const [count, setCount] = useState(1);
  const soundOn = useSoundOn();
  // Decided when Edda's turn comes: with sound she speaks, without it the text is shown at once.
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    if (status !== "writing" || !spoken || !isVoiceActive()) return;
    // Edda never talks while one of her written speech bubbles is on the board: then the text is shown at once.
    if (isEddaBubbleShown()) {
      finish(id);
      return;
    }
    setIsSpeaking(true);
    const speech = speak(text);
    let active = true;
    speech.done.then(() => {
      if (!active) return;
      setIsSpeaking(false);
      finish(id);
    });
    return () => {
      active = false;
      speech.cancel();
    };
    // Turning the sound off while she speaks ends the speech and shows the text.
  }, [status, spoken, text, id, finish, soundOn]);

  useLayoutEffect(() => {
    register();
    return register;
  }, [register]);

  useEffect(() => {
    if (status !== "writing") return;
    if (spoken && isVoiceActive() && !isEddaBubbleShown()) return;
    if (!animate || count >= text.length) {
      finish(id);
      return;
    }
    const timer = window.setTimeout(() => setCount((current) => current + 1), delayAfter(text[count - 1]));
    return () => window.clearTimeout(timer);
  }, [status, animate, count, text, id, finish, spoken, soundOn]);

  if (status === "pending") {
    return <span className="board-ink is-pending" data-board-ink={id}>{text}</span>;
  }

  if (status === "writing" && isSpeaking) {
    // While Edda speaks only her bubble is shown; the text stays available to assistive technology.
    return (
      <span className="board-ink is-speaking" data-board-ink={id}>
        <span className="board-ink-full">{text}</span>
        <span aria-hidden="true" className="edda-speaking">
          <span className="edda-face" />
          <span className="edda-bubble-wrap">
            <strong className="edda-name">Edda berättar</strong>
            <span className="edda-bubble edda-dots"><i /><i /><i /></span>
          </span>
        </span>
      </span>
    );
  }

  if (status === "done" || !animate || count >= text.length) {
    return <span className="board-ink" data-board-ink={id}>{text}</span>;
  }

  return (
    <span className="board-ink is-writing" data-board-ink={id}>
      <span className="board-ink-full">{text}</span>
      <span aria-hidden="true">
        {text.slice(0, count)}
        <span className="board-pen" />
        <span className="board-ink-rest">{text.slice(count)}</span>
      </span>
    </span>
  );
}

/** A stop inside a step: the board waits here until the student continues. */
export function BoardPause() {
  const step = useContext(StepContext);
  const id = useId();
  const register = step?.register;

  useLayoutEffect(() => {
    if (!register) return;
    register();
    return register;
  }, [register]);

  if (!step) return null;
  return <span data-board-ink={id} data-board-pause="" hidden />;
}

/** True once the surrounding step has written its text (always true outside a step). */
export function useBoardSettled(): boolean {
  const step = useContext(StepContext);
  return !step || step.settled;
}

/** Controls that should appear only after the step's text has been written. */
export function AfterWriting({ children }: { children: ReactNode }) {
  const step = useContext(StepContext);
  return !step || step.settled ? <>{children}</> : null;
}

/**
 * Content that waits for its turn every time the step gets new text, not only the first time.
 * Used for Edda's written speech bubble, which is shown when she has finished speaking.
 */
export function WhenWritten({ children }: { children: ReactNode }) {
  const step = useContext(StepContext);
  return !step || step.written ? <>{children}</> : null;
}
