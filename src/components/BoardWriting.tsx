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

/**
 * Whiteboard writing: the board "writes" its text like a teacher with a pen and
 * reveals the content one part at a time.
 *
 * - <BoardSequence> shows its <BoardStep> children one at a time, like pages: the board is
 *   wiped for each new part so the whole whiteboard stays visible without scrolling.
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
  skipToken: number;
  continueToken: number;
  onSettled: () => void;
  onWaiting: (waiting: boolean) => void;
};

type StepContextValue = {
  statusOf: (id: string) => InkStatus;
  register: () => void;
  finish: (id: string) => void;
  settled: boolean;
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
  const [animate] = useState(canAnimateWriting);
  const [revealed, setRevealed] = useState(startInstant ? Number.POSITIVE_INFINITY : 1);
  const [settledCount, setSettledCount] = useState(startInstant ? Number.POSITIVE_INFINITY : 0);
  const [waitingInStep, setWaitingInStep] = useState(false);
  const [skipToken, setSkipToken] = useState(0);
  const [continueToken, setContinueToken] = useState(0);
  // null follows the newest part; a number means the student is looking back at an earlier part.
  const [page, setPage] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const refocusRef = useRef(false);
  const completedRef = useRef(startInstant);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const visibleCount = Math.min(revealed, steps.length);
  const currentSettled = settledCount >= visibleCount;
  const newestPage = Math.max(0, visibleCount - 1);
  const shownPage = Math.min(page ?? newestPage, newestPage);
  const isLookingBack = shownPage < newestPage;
  const control: "skip" | "continue" | null = isLookingBack
    ? "continue"
    : !currentSettled
      ? waitingInStep ? "continue" : animate ? "skip" : null
      : visibleCount < steps.length ? "continue" : null;
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
    if (control !== null || !refocusRef.current) return;
    refocusRef.current = false;
    const stepElements = containerRef.current?.querySelectorAll<HTMLElement>(":scope > [data-board-step]");
    Array.from(stepElements ?? []).find((element) => !element.hidden)?.focus({ preventScroll: true });
  }, [control]);

  function handleSettled(index: number, pause: boolean) {
    setSettledCount((current) => Math.max(current, index + 1));
    if (!pause) setRevealed((current) => Math.max(current, index + 2));
  }

  function handleControl() {
    if (control === "skip") {
      setSkipToken((token) => token + 1);
      return;
    }
    refocusRef.current = true;
    if (isLookingBack) {
      setPage(shownPage + 1 === newestPage ? null : shownPage + 1);
      return;
    }
    setPage(null);
    if (!currentSettled) {
      setContinueToken((token) => token + 1);
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
            skipToken,
            continueToken,
            onSettled: () => handleSettled(index, Boolean(step.props.pause)),
            onWaiting: setWaitingInStep,
          }}
        >
          {step}
        </SequenceItemContext.Provider>
      ))}
      {(control || shownPage > 0) && (
        <div className="board-continue-row">
          {shownPage > 0 && (
            <button className="quiet-button board-back" onClick={() => setPage(shownPage - 1)} type="button">
              Visa föregående del
            </button>
          )}
          {control && (
          <button
            className="quiet-button board-continue"
            onBlur={() => { refocusRef.current = false; }}
            onClick={handleControl}
            type="button"
          >
            {control === "skip" ? "Visa hela texten" : "Fortsätt"}
          </button>
          )}
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
  const skipSeen = useRef(item?.skipToken ?? 0);
  const continueSeen = useRef(item?.continueToken ?? 0);

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

  const skipToken = item?.skipToken ?? 0;
  useEffect(() => {
    if (skipToken === skipSeen.current) return;
    skipSeen.current = skipToken;
    if (!order) return;
    setDone((current) => {
      const next = new Set(current);
      for (const entry of order) {
        if (next.has(entry.id)) continue;
        if (entry.pause) break;
        next.add(entry.id);
      }
      return next;
    });
  }, [skipToken, order]);

  const continueToken = item?.continueToken ?? 0;
  useEffect(() => {
    if (continueToken === continueSeen.current) return;
    continueSeen.current = continueToken;
    if (active?.pause) finish(active.id);
  }, [continueToken, active, finish]);

  const value = useMemo<StepContextValue>(() => ({
    statusOf: (id) => instant || done.has(id) ? "done" : id === activeId ? "writing" : "pending",
    register,
    finish,
    settled,
  }), [instant, done, activeId, register, finish, settled]);

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

/** Text that the board writes by hand. Rendered as plain text outside a step. */
export function Written({ children }: { children: string }) {
  const step = useContext(StepContext);
  if (!step) return <>{children}</>;
  return <Ink key={children} step={step} text={children} />;
}

function Ink({ step, text }: { step: StepContextValue; text: string }) {
  const id = useId();
  const { register, finish } = step;
  const status = step.statusOf(id);
  const [animate] = useState(canAnimateWriting);
  const [count, setCount] = useState(1);

  useLayoutEffect(() => {
    register();
    return register;
  }, [register]);

  useEffect(() => {
    if (status !== "writing") return;
    if (!animate || count >= text.length) {
      finish(id);
      return;
    }
    const timer = window.setTimeout(() => setCount((current) => current + 1), delayAfter(text[count - 1]));
    return () => window.clearTimeout(timer);
  }, [status, animate, count, text, id, finish]);

  if (status === "pending") {
    return <span className="board-ink is-pending" data-board-ink={id}>{text}</span>;
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
