import { useLayoutEffect, type RefObject } from "react";

const scaleProperty = "--fit-scale";
const measureProperty = "--fit-min-height";

/**
 * Sets the CSS variable `--fit-scale` on `content` so that it fits inside `container` without
 * scrolling. The stylesheet applies the scale (see the fitted whiteboard rules in styles.css).
 * Used by the whiteboard so that the whole board stays visible in the window.
 * Does nothing while `enabledQuery` does not match (e.g. stacked mobile layout).
 */
export function useFitToHeight(
  container: RefObject<HTMLElement | null>,
  content: RefObject<HTMLElement | null>,
  enabledQuery: string,
  minScale = 0.6,
) {
  useLayoutEffect(() => {
    const box = container.current;
    const inner = content.current;
    if (!box || !inner || typeof ResizeObserver === "undefined" || typeof window.matchMedia !== "function") return;

    const media = window.matchMedia(enabledQuery);
    let applied = 1;
    // Changing the scale resizes the observed elements; that echo must not start a new fit.
    let ignoreNextResize = false;

    function setScale(scale: number) {
      if (scale === 1) inner!.style.removeProperty(scaleProperty);
      else inner!.style.setProperty(scaleProperty, String(scale));
    }

    // The content's own height at the current scale, without the stretch that fills the container.
    function naturalHeight() {
      inner!.style.setProperty(measureProperty, "0px");
      const height = inner!.offsetHeight;
      inner!.style.removeProperty(measureProperty);
      return height;
    }

    function fitsAt(scale: number) {
      setScale(scale);
      return naturalHeight() * scale <= box!.clientHeight + 1;
    }

    function fit() {
      const before = applied;
      let scale = 1;
      setScale(1);
      if (media.matches && !fitsAt(1)) {
        // Smaller text wraps into fewer lines, so search for the largest scale that still fits.
        let fits = minScale;
        let tooBig = 1;
        for (let attempt = 0; attempt < 7 && tooBig - fits > 0.01; attempt += 1) {
          const middle = (fits + tooBig) / 2;
          if (fitsAt(middle)) fits = middle;
          else tooBig = middle;
        }
        scale = Math.floor(fits * 100) / 100;
        setScale(scale);
      }
      applied = scale;
      // When the scaled content fits, the container must not scroll over the unscaled layout box.
      if (scale < 1 && naturalHeight() * scale <= box!.clientHeight + 1) box!.setAttribute("data-fit", "scaled");
      else box!.removeAttribute("data-fit");
      ignoreNextResize = Math.abs(before - applied) > 0.001;
    }

    function observeAll() {
      observer.disconnect();
      observer.observe(box!);
      for (const child of Array.from(inner!.children)) observer.observe(child);
    }

    const observer = new ResizeObserver(() => {
      if (ignoreNextResize) {
        ignoreNextResize = false;
        return;
      }
      fit();
    });
    const mutations = new MutationObserver(() => {
      observeAll();
      fit();
    });

    fit();
    observeAll();
    mutations.observe(inner, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
    media.addEventListener?.("change", fit);

    return () => {
      observer.disconnect();
      mutations.disconnect();
      media.removeEventListener?.("change", fit);
      setScale(1);
      box.removeAttribute("data-fit");
    };
  }, [container, content, enabledQuery, minScale]);
}
