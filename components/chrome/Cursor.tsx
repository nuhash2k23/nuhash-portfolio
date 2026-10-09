'use client';
import { useEffect, useRef } from 'react';
import { live, ui, useStore } from '@/lib/state';
import { hasFinePointer } from '@/lib/device';
import { audio } from '@/lib/audio';

/** Relative luminance of the first opaque background under a point. */
function bgIsLight(el: Element | null): boolean {
  let n: Element | null = el;
  while (n && n !== document.documentElement) {
    const c = getComputedStyle(n).backgroundColor;
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (m) {
      const [r, g, b, a = '1'] = m[1].split(',').map((x) => x.trim());
      if (parseFloat(a) > 0.5) {
        const L = (0.2126 * +r + 0.7152 * +g + 0.0722 * +b) / 255;
        return L > 0.55;
      }
    }
    n = n.parentElement;
  }
  return false;
}

/**
 * Pointer tracking for everything (WebGL reads `live.mouse`), the cursor itself
 * (white on dark, red on light, a glowing orb in the dark scene),
 * and the liquid ripple on [data-liquid] text and images.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const turb = useRef<SVGFETurbulenceElement>(null);
  const disp = useRef<SVGFEDisplacementMapElement>(null);
  const inDark = useStore(ui, (s) => s.inDark);

  useEffect(() => {
    const fine = hasFinePointer();
    if (fine) document.documentElement.classList.add('has-cursor');

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...target };
    const last = { ...target };
    live.px.x = target.x;
    live.px.y = target.y;

    let liquidEl: HTMLElement | null = null;
    let fadingEl: HTMLElement | null = null;
    let strength = 0;
    let speed = 0;
    let hoverEl: Element | null = null;
    let themeCheck = 0;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      live.px.x = e.clientX;
      live.px.y = e.clientY;
      live.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      live.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    const onOver = (e: PointerEvent) => {
      const t = e.target as HTMLElement;
      const el = t.closest('a, button, [data-cursor]');
      ring.current?.classList.toggle('is-hover', !!el);
      if (el && el !== hoverEl) audio.tick();
      hoverEl = el;
      const liq = t.closest<HTMLElement>('[data-liquid]');
      if (liq !== liquidEl) {
        if (liquidEl) fadingEl = liquidEl;
        liquidEl = liq;
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });

    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      ringPos.x += (target.x - ringPos.x) * 0.16;
      ringPos.y += (target.y - ringPos.y) * 0.16;
      if (dot.current) dot.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;

      // light or dark under the pointer → cursor colour
      if (t - themeCheck > 120 && root.current) {
        themeCheck = t;
        const under = document.elementFromPoint(target.x, target.y);
        root.current.classList.toggle('cursor--on-light', bgIsLight(under));
      }

      // liquid ripple: stronger the faster you move
      const v = Math.hypot(target.x - last.x, target.y - last.y);
      last.x = target.x;
      last.y = target.y;
      speed += (v - speed) * 0.2;
      const want = liquidEl ? Math.min(28, speed * 1.4) : 0;
      strength += (want - strength) * 0.12;
      if (disp.current) disp.current.setAttribute('scale', strength.toFixed(2));
      if (turb.current) {
        const f = 0.008 + Math.sin(t * 0.0006) * 0.002;
        turb.current.setAttribute('baseFrequency', `${f.toFixed(4)} ${(f * 2.4).toFixed(4)}`);
      }
      const active = strength > 0.4;
      if (liquidEl) liquidEl.style.filter = active ? 'url(#liquid)' : '';
      if (fadingEl && fadingEl !== liquidEl) {
        fadingEl.style.filter = '';
        fadingEl = null;
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      document.documentElement.classList.remove('has-cursor');
      if (liquidEl) liquidEl.style.filter = '';
    };
  }, []);

  return (
    <>
      <svg className="liquid-defs" aria-hidden width="0" height="0">
        <filter id="liquid" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence ref={turb} type="fractalNoise" baseFrequency="0.008 0.02" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap ref={disp} in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div ref={root} className={`cursor ${inDark ? 'cursor--orb' : ''}`} aria-hidden>
        <div className="cursor__ring" ref={ring}>
          <span className="cursor__orb" />
        </div>
        <div className="cursor__dot" ref={dot} />
      </div>
    </>
  );
}
