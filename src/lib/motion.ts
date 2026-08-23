/** True when the visitor has asked their OS to reduce motion. */
export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True for touch/pen input — used to keep the effect budget down on phones. */
export function isCoarsePointer(): boolean {
  return window.matchMedia('(pointer: coarse)').matches;
}

export interface Animation {
  /**
   * Request a frame. A no-op while the loop is running; in reduced-motion mode
   * it repaints the single still frame, so callers use it after a late-arriving
   * texture or a resize.
   */
  redraw(): void;
  stop(): void;
}

/**
 * Drives a canvas animation with the two behaviours a bare `requestAnimationFrame`
 * loop lacks: it renders one still frame when the visitor prefers reduced motion,
 * and it suspends completely while the tab is in the background instead of
 * burning CPU on frames nobody sees.
 */
export function runAnimation(frame: (now: number) => void): Animation {
  if (prefersReducedMotion()) {
    let pending = requestAnimationFrame(frame);
    return {
      redraw() {
        cancelAnimationFrame(pending);
        pending = requestAnimationFrame(frame);
      },
      stop() {
        cancelAnimationFrame(pending);
      },
    };
  }

  let raf = 0;
  const loop = (now: number) => {
    frame(now);
    raf = requestAnimationFrame(loop);
  };

  const onVisibilityChange = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (!raf) {
      raf = requestAnimationFrame(loop);
    }
  };

  raf = requestAnimationFrame(loop);
  document.addEventListener('visibilitychange', onVisibilityChange);

  return {
    redraw() {
      /* the loop is already painting every frame */
    },
    stop() {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    },
  };
}
