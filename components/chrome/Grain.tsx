'use client';
import { useEffect, useRef } from 'react';

/**
 * Fine, rich film grain: soft gaussian noise rendered at device-pixel size,
 * cycled through a few pre-baked frames (cheap — no per-frame pixel work).
 */
function makeFrames(count = 6) {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const size = Math.round(256 * dpr);
  const frames: string[] = [];
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  for (let f = 0; f < count; f++) {
    const img = g.createImageData(size, size);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      // sum of uniforms ≈ gaussian → softer, filmic distribution
      const n = (Math.random() + Math.random() + Math.random() + Math.random()) / 4;
      const v = 128 + (n - 0.5) * 190;
      d[i] = v + 6; // a touch warm
      d[i + 1] = v;
      d[i + 2] = v - 4;
      d[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    frames.push(c.toDataURL('image/png'));
  }
  return frames;
}

export default function Grain({ className = '', opacity = 0.32, fps = 12 }: { className?: string; opacity?: number; fps?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const frames = makeFrames();
    let i = 0;
    let last = 0;
    let raf = 0;
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (t - last < 1000 / fps) return;
      last = t;
      i = (i + 1) % frames.length;
      el.style.backgroundImage = `url(${frames[i]})`;
      el.style.backgroundPosition = `${Math.floor(Math.random() * 256)}px ${Math.floor(Math.random() * 256)}px`;
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [fps]);
  return <div ref={ref} className={`grain ${className}`} style={{ opacity }} aria-hidden />;
}
