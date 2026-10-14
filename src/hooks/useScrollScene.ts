import { useEffect, useRef, useState, type RefObject } from 'react';
import { activeSectionIndex } from '../lib/scroll';

interface ScrollScene {
  /** Wrapper around the galaxy canvas — dimmed slightly as you scroll in. */
  galaxyLayerRef: RefObject<HTMLDivElement>;
  /** Thin progress bar under the nav. */
  scrollBarRef: RefObject<HTMLDivElement>;
  /** Index of the active section (drives nav + dot rail highlight). */
  activeIndex: number;
}

/**
 * Drives the scroll-reactive backdrop: the galaxy dims slightly while its own 3D
 * camera flies in (see useGalaxy). DOM is mutated directly via
 * refs (rather than React state) so scrolling stays at 60fps; only the active
 * section index — which changes rarely — flows through state.
 */
export function useScrollScene(): ScrollScene {
  const galaxyLayerRef = useRef<HTMLDivElement>(null);
  const scrollBarRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const p = Math.min(1, Math.max(0, window.scrollY / max));

      if (scrollBarRef.current) {
        scrollBarRef.current.style.width = (p * 100).toFixed(2) + '%';
      }

      // The 3D galaxy flies its own camera in as you scroll (see useGalaxy), so the
      // layer is no longer scaled; it only dims a little to keep the copy readable.
      const g = Math.min(1, p / 0.34);
      if (galaxyLayerRef.current) {
        galaxyLayerRef.current.style.opacity = (1 - g * 0.3).toFixed(3);
      }

      setActiveIndex((prev) => {
        const next = activeSectionIndex();
        return next === prev ? prev : next;
      });
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, []);

  return { galaxyLayerRef, scrollBarRef, activeIndex };
}
