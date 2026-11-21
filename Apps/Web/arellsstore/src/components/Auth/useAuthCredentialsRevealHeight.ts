'use client';

import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';

/**
 * Measured max-height for credentials height-down.
 * Uses the last field’s bounding box (not scrollHeight alone) so confirm password isn’t under-cut.
 */
export function useAuthCredentialsRevealHeight(open: boolean) {
  const innerRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState(0);

  useLayoutEffect(() => {
    if (!open) {
      setMaxHeight(0);
      return;
    }
    const node = innerRef.current;
    if (!node) return;

    const measure = () => {
      const parent = node.parentElement;
      const prevMax = parent?.style.maxHeight;
      const prevOverflow = parent?.style.overflow;
      if (parent) {
        parent.style.maxHeight = 'none';
        parent.style.overflow = 'visible';
      }
      const top = node.getBoundingClientRect().top;
      let bottom = node.getBoundingClientRect().bottom;
      for (const child of Array.from(node.children)) {
        const r = child.getBoundingClientRect();
        if (r.bottom > bottom) bottom = r.bottom;
      }
      const h = Math.ceil(bottom - top) + 12;
      if (parent) {
        parent.style.maxHeight = prevMax ?? '';
        parent.style.overflow = prevOverflow ?? '';
      }
      setMaxHeight(h > 12 ? h : 0);
    };

    measure();
    const raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [open]);

  return {
    innerRef,
    style: {
      maxHeight: open ? maxHeight : 0,
    } as CSSProperties,
  };
}
