'use client';
import type Lenis from 'lenis';

let lenis: Lenis | null = null;

export function setLenis(l: Lenis | null) {
  lenis = l;
}
export function getLenis() {
  return lenis;
}

/** Smooth scroll to an element id or a pixel offset. */
export function scrollToTarget(target: string | number, immediate = false) {
  if (typeof window === 'undefined') return;
  const el = typeof target === 'string' ? document.getElementById(target) : null;
  const y = typeof target === 'number' ? target : el ? el.getBoundingClientRect().top + window.scrollY : 0;
  if (lenis) lenis.scrollTo(y, { immediate, duration: immediate ? 0 : 1.6 });
  else window.scrollTo({ top: y, behavior: immediate ? 'auto' : 'smooth' });
}
