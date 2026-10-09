'use client';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { places, reviews, words } from '@/lib/content';

const W = 1000;
const H = 500;
const project = (lon: number, lat: number) => ({ x: ((lon + 180) / 360) * W, y: ((90 - lat) / 180) * H });

// label offsets so the European cluster stays readable
const LABEL: Record<string, [number, number, 'start' | 'end']> = {
  'United Kingdom': [-9, -9, 'end'],
  France: [-9, 16, 'end'],
  Germany: [7, -10, 'start'],
  Austria: [9, 15, 'start'],
  Sweden: [8, -9, 'start'],
};

type Bubble = { id: number; place: string; text: string; x: number; y: number };

export default function Testimonials() {
  const ref = useRef<HTMLElement>(null);
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [live, setLive] = useState(false);

  const home = places.find((p) => p.home)!;
  const hp = project(home.lon, home.lat);
  const others = places.filter((p) => !p.home);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      // white → black as you scroll in
      gsap.fromTo(
        el,
        { '--bg': '#f6f4f0', '--fg': '#0b0908' },
        {
          '--bg': '#0b0908',
          '--fg': '#f6f4f0',
          ease: 'none',
          scrollTrigger: { trigger: el, start: 'top 80%', end: 'top top', scrub: true },
        },
      );

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (self) => setLive(self.progress > 0.5),
        },
      });
      tl.fromTo('.map__grid', { opacity: 0 }, { opacity: 1, duration: 0.15 }, 0);
      tl.fromTo('.map__home', { scale: 0, transformOrigin: 'center' }, { scale: 1, duration: 0.08, ease: 'back.out(3)' }, 0.08);
      tl.fromTo(
        '.map__spot',
        { scale: 0, opacity: 0, transformOrigin: 'center' },
        { scale: 1, opacity: 1, duration: 0.06, stagger: 0.035, ease: 'back.out(3)' },
        0.14,
      );
      tl.fromTo('.map__arc', { strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.18, stagger: 0.03 }, 0.22);
      tl.fromTo('.map__label', { opacity: 0 }, { opacity: 1, duration: 0.05, stagger: 0.02 }, 0.4);
      tl.fromTo('.words__head > *', { y: 40, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.04, duration: 0.1 }, 0.02);
      tl.set({}, {}, 1);
    }, el);
    return () => ctx.revert();
  }, []);

  // reviews fade in and out near their country, at random
  useEffect(() => {
    if (!live) {
      setBubbles([]);
      return;
    }
    let id = 0;
    const spawn = () => {
      const r = reviews[Math.floor(Math.random() * reviews.length)];
      const place = places.find((p) => p.name === r.country) ?? others[0];
      const pt = project(place.lon, place.lat);
      const b: Bubble = { id: ++id, place: place.name, text: r.text, x: (pt.x / W) * 100, y: (pt.y / H) * 100 };
      setBubbles((prev) => [...prev.filter((p) => p.place !== b.place).slice(-1), b]);
      window.setTimeout(() => setBubbles((prev) => prev.filter((p) => p.id !== b.id)), 5200);
    };
    spawn();
    const iv = window.setInterval(spawn, 2600);
    return () => window.clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  return (
    <section ref={ref} id="words" className="words" aria-labelledby="words-title" data-section="words">
      <div className="words__sticky">
        <header className="words__head">
          <p className="label">{words.label}</p>
          <h2 id="words-title">{words.heading}</h2>
          <p className="words__sub">{words.sub}</p>
        </header>

        <div className="map">
          <svg viewBox={`0 0 ${W} ${H}`} className="map__svg" aria-hidden>
            <g className="map__grid">
              {Array.from({ length: 25 }, (_, i) => (
                <line key={`v${i}`} x1={(i * W) / 24} x2={(i * W) / 24} y1={0} y2={H} />
              ))}
              {Array.from({ length: 13 }, (_, i) => (
                <line key={`h${i}`} x1={0} x2={W} y1={(i * H) / 12} y2={(i * H) / 12} />
              ))}
              <line className="map__equator" x1={0} x2={W} y1={H / 2} y2={H / 2} />
            </g>
            {others.map((p) => {
              const q = project(p.lon, p.lat);
              const mx = (hp.x + q.x) / 2;
              const my = (hp.y + q.y) / 2 - Math.hypot(q.x - hp.x, q.y - hp.y) * 0.28;
              return <path key={`a${p.name}`} className="map__arc" d={`M${hp.x},${hp.y} Q${mx},${my} ${q.x},${q.y}`} pathLength={1} />;
            })}
            {others.map((p) => {
              const q = project(p.lon, p.lat);
              return (
                <g key={p.name} transform={`translate(${q.x} ${q.y})`}>
                  <g className="map__spot">
                    <circle r={10} className="map__pulse" />
                    <circle r={3.2} className="map__dot" />
                  </g>
                  <text
                    className="map__label"
                    x={(LABEL[p.name] ?? [8, -8])[0]}
                    y={(LABEL[p.name] ?? [8, -8])[1]}
                    textAnchor={(LABEL[p.name] ?? [0, 0, 'start'])[2]}
                  >
                    {p.name.toUpperCase()}
                  </text>
                </g>
              );
            })}
            <g transform={`translate(${hp.x} ${hp.y})`}>
              <g className="map__home">
                <circle r={16} className="map__pulse map__pulse--home" />
                <circle r={5} className="map__dot map__dot--home" />
              </g>
              <text className="map__label map__label--home" x={10} y={22}>
                DHAKA — HOME
              </text>
            </g>
          </svg>

          <div className="map__bubbles" aria-live="polite">
            {bubbles.map((b) => (
              <figure
                key={b.id}
                className={`bubble ${b.x > 60 ? 'bubble--left' : ''}`}
                style={{ left: `${b.x}%`, top: `${b.y}%` }}
              >
                <blockquote>“{b.text}”</blockquote>
                <figcaption>— Client, {b.place}</figcaption>
              </figure>
            ))}
          </div>
        </div>
      </div>

      <ul className="sr-only">
        {reviews.map((r, i) => (
          <li key={i}>
            “{r.text}” — client in {r.country}
          </li>
        ))}
      </ul>
    </section>
  );
}
