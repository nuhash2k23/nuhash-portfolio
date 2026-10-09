'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { loading, registerTask, ui, useStore } from '@/lib/state';
import { prefersReducedMotion, supportsWebGL2 } from '@/lib/device';
import Grain from './Grain';

const MIN_TIME = 2600; // the signature needs this long to finish writing

/** Placeholder signature. Replace both paths with a trace of your real signature. */
const SIGNATURE = [
  'M20 112 C 34 46, 58 34, 62 108 C 66 64, 88 52, 95 104 C 99 80, 111 72, 118 100 C 122 116, 136 110, 141 80 L 141 106 C 150 82, 170 76, 175 100 C 178 116, 160 116, 165 100 C 172 86, 190 90, 195 106 C 200 90, 214 86, 212 102 C 209 116, 226 112, 233 70 C 237 40, 228 40, 228 72 L 231 112 C 240 86, 258 86, 260 108 C 263 122, 300 96, 344 66',
  'M58 138 C 150 122, 262 118, 336 128',
];

function Reel({ digit, max = 9 }: { digit: number; max?: number }) {
  return (
    <span className="reel">
      <span className="reel__strip" style={{ transform: `translateY(${-digit * 10}%)` }}>
        {Array.from({ length: 10 }, (_, i) => (
          <span key={i} className="reel__digit" aria-hidden={i > max}>
            {i}
          </span>
        ))}
      </span>
    </span>
  );
}

export default function Loader() {
  const root = useRef<HTMLDivElement>(null);
  const ready = useStore(loading, (s) => s.ready);
  const [shown, setShown] = useState(0);
  const [gone, setGone] = useState(() => ui.get().loaded); // skip on client-side returns to home
  const [minDone, setMinDone] = useState(false);

  // register the real work we wait for
  useEffect(() => {
    const fonts = registerTask('fonts');
    const page = registerTask('page');
    if (supportsWebGL2() && !prefersReducedMotion()) {
      registerTask('scene');
      registerTask('environment');
    }
    document.fonts?.ready.then(() => fonts(1));
    if (document.readyState === 'complete') page(1);
    else window.addEventListener('load', () => page(1), { once: true });
    const t = window.setTimeout(() => setMinDone(true), MIN_TIME);
    // safety net: never trap anyone behind the loader
    const fail = window.setTimeout(() => {
      fonts(1);
      page(1);
      registerTask('scene')(1);
      registerTask('environment')(1);
    }, 15000);
    return () => {
      window.clearTimeout(t);
      window.clearTimeout(fail);
    };
  }, []);

  // counter eases toward the real number, never past it
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      setShown((s) => {
        const target = loading.get().progress * 100;
        const next = s + (target - s) * 0.08;
        return target - next < 0.5 ? target : next;
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // ready → the shutter rolls up in one solid piece
  useEffect(() => {
    if (!ready || !minDone || shown < 99.5 || !root.current) return;
    const q = gsap.utils.selector(root.current);
    const tl = gsap.timeline({ onComplete: () => setGone(true) });
    tl.to(q('.loader__content'), { opacity: 0, y: -20, duration: 0.5, ease: 'power2.in' }, 0.15);
    tl.add(() => ui.set({ loaded: true }), 0.7);
    tl.to(q('.loader__door'), { yPercent: -100, duration: 1.35, ease: 'power4.inOut' }, 0.55);
    return () => {
      tl.kill();
    };
  }, [ready, minDone, shown]);

  if (gone) return null;
  const value = Math.min(100, Math.floor(shown));

  return (
    <div ref={root} className="loader" role="status" aria-live="polite" aria-label={`Loading ${value}%`}>
      <div className="loader__door">
        <div className="loader__glow" aria-hidden />
        <Grain className="loader__grain" opacity={0.9} />
        <div className="loader__content">
          <svg className="signature" viewBox="0 0 360 160" aria-hidden>
            {SIGNATURE.map((d, i) => (
              <path key={i} d={d} pathLength={1} className={`signature__path signature__path--${i}`} />
            ))}
          </svg>

          <div className="slot">
            <span className="slot__label">Loading</span>
            <span className="slot__reels">
              <Reel digit={Math.floor(value / 100)} max={1} />
              <Reel digit={Math.floor(value / 10) % 10} />
              <Reel digit={value % 10} />
            </span>
            <span className="slot__pct">%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
