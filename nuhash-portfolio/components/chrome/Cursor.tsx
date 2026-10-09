'use client';
import { useEffect, useRef } from 'react';
import { live, ui, useStore } from '@/lib/state';
import { hasFinePointer } from '@/lib/device';
import { audio } from '@/lib/audio';

/**
 * Tracks the pointer for everything (WebGL reads `live.mouse`),
 * and draws a dot + ring cursor that turns into a light bulb in the dark scene.
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLDivElement>(null);
  const inDark = useStore(ui, (s) => s.inDark);

  useEffect(() => {
    const fine = hasFinePointer();
    if (fine) document.documentElement.classList.add('has-cursor');

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ringPos = { ...target };
    live.px.x = target.x;
    live.px.y = target.y;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      live.px.x = e.clientX;
      live.px.y = e.clientY;
      live.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      live.mouse.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    const onOver = (e: PointerEvent) => {
      const el = (e.target as HTMLElement).closest('a, button, [data-cursor]');
      ring.current?.classList.toggle('is-hover', !!el);
      if (el && el !== lastHover) audio.tick();
      lastHover = el;
    };
    let lastHover: Element | null = null;
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerover', onOver, { passive: true });

    let raf = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      ringPos.x += (target.x - ringPos.x) * 0.16;
      ringPos.y += (target.y - ringPos.y) * 0.16;
      if (dot.current) dot.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      if (ring.current) ring.current.style.transform = `translate3d(${ringPos.x}px, ${ringPos.y}px, 0)`;
    };
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerover', onOver);
      document.documentElement.classList.remove('has-cursor');
    };
  }, []);

  return (
    <div className={`cursor ${inDark ? 'cursor--bulb' : ''}`} aria-hidden>
      <div className="cursor__ring" ref={ring}>
        <span className="cursor__glow" />
      </div>
      <div className="cursor__dot" ref={dot} />
    </div>
  );
}
