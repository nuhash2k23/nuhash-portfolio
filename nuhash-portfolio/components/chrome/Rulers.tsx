'use client';
import { useEffect, useRef } from 'react';
import { live } from '@/lib/state';
import { site } from '@/lib/content';

const pad = (n: number, l = 4) => String(Math.max(0, Math.round(n))).padStart(l, '0');

/**
 * Blueprint rulers on the top, left and right edges with live readouts:
 * Dhaka time and date, cursor X/Y, scroll %, and the current section.
 * Updated in a rAF loop (no React re-renders).
 */
export default function Rulers() {
  const topRef = useRef<HTMLDivElement>(null);
  const leftMarker = useRef<HTMLSpanElement>(null);
  const topMarker = useRef<HTMLSpanElement>(null);
  const rightMarker = useRef<HTMLSpanElement>(null);
  const coords = useRef<HTMLSpanElement>(null);
  const clock = useRef<HTMLSpanElement>(null);
  const leftNums = useRef<HTMLDivElement>(null);
  const topNums = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // numbers every 100px
    const build = () => {
      if (leftNums.current) {
        leftNums.current.innerHTML = '';
        for (let y = 100; y < window.innerHeight; y += 100) {
          const s = document.createElement('span');
          s.textContent = String(y);
          s.style.top = `${y}px`;
          leftNums.current.appendChild(s);
        }
      }
      if (topNums.current) {
        topNums.current.innerHTML = '';
        for (let x = 100; x < window.innerWidth; x += 100) {
          const s = document.createElement('span');
          s.textContent = String(x);
          s.style.left = `${x}px`;
          topNums.current.appendChild(s);
        }
      }
    };
    build();
    window.addEventListener('resize', build);

    const timeFmt = new Intl.DateTimeFormat('en-GB', {
      timeZone: site.timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const dateFmt = new Intl.DateTimeFormat('en-GB', { timeZone: site.timezone, day: '2-digit', month: '2-digit', year: 'numeric' });

    let raf = 0;
    let lastClock = 0;
    const sections = () => Array.from(document.querySelectorAll<HTMLElement>('[data-section]'));
    let list = sections();
    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      const { x, y } = live.px;
      if (leftMarker.current) leftMarker.current.style.transform = `translateY(${y}px)`;
      if (topMarker.current) topMarker.current.style.transform = `translateX(${x}px)`;
      if (rightMarker.current) rightMarker.current.style.transform = `translateY(${live.scroll * (window.innerHeight - 24)}px)`;

      let current = 'HERO';
      const mid = window.innerHeight * 0.5;
      for (const el of list) {
        const r = el.getBoundingClientRect();
        if (r.top <= mid && r.bottom >= mid) current = (el.dataset.section || '').toUpperCase();
      }
      if (coords.current)
        coords.current.textContent = `X:${pad(x)}  Y:${pad(y)}  P:${pad(live.scroll * 100, 3)}%  S:${current}`;
      if (clock.current && t - lastClock > 500) {
        lastClock = t;
        const now = new Date();
        clock.current.textContent = `${site.city.toUpperCase()} ${timeFmt.format(now)} — ${dateFmt.format(now).replace(/\//g, '.')}`;
        list = sections();
      }
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', build);
    };
  }, []);

  return (
    <div className="rulers" aria-hidden>
      <div className="ruler ruler--top" ref={topRef}>
        <div className="ruler__nums ruler__nums--top" ref={topNums} />
        <span className="ruler__marker ruler__marker--top" ref={topMarker} />
      </div>
      <div className="ruler ruler--left">
        <div className="ruler__nums" ref={leftNums} />
        <span className="ruler__marker" ref={leftMarker} />
      </div>
      <div className="ruler ruler--right">
        <span className="ruler__marker ruler__marker--right" ref={rightMarker} />
        <span className="ruler__readout" ref={coords} />
      </div>
      <span className="ruler__clock" ref={clock} />
      <span className="ruler__cross ruler__cross--tl">+</span>
      <span className="ruler__cross ruler__cross--bl">+</span>
      <span className="ruler__cross ruler__cross--tr">+</span>
      <span className="ruler__cross ruler__cross--br">+</span>
    </div>
  );
}
