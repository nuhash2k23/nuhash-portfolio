'use client';

export function supportsWebGL2() {
  if (typeof document === 'undefined') return true;
  try {
    const c = document.createElement('canvas');
    return !!c.getContext('webgl2');
  } catch {
    return false;
  }
}

export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Phones, tablets and weak machines get the lighter version. */
export function isLowPower() {
  if (typeof window === 'undefined') return false;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = window.innerWidth < 820;
  const cores = navigator.hardwareConcurrency || 8;
  return coarse || small || cores <= 4;
}

export function hasFinePointer() {
  if (typeof window === 'undefined') return true;
  return window.matchMedia('(pointer: fine)').matches;
}
