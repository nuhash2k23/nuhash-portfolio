'use client';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { featuredProjects as projects } from '@/lib/content';
import { scrollToTarget } from '@/lib/scroll';
import { audio } from '@/lib/audio';
import { ui, useStore } from '@/lib/state';
import type { WorkLive } from './WorkScene';

const WorkScene = dynamic(() => import('./WorkScene'), { ssr: false });

export default function Work() {
  const sectionRef = useRef<HTMLElement>(null);
  const stateRef = useRef<WorkLive>({ progress: 0, hovered: -1, selected: -1 });
  const [front, setFront] = useState(0);
  const [selected, setSelected] = useState(-1);
  const [active, setActive] = useState(false);
  const pending = useRef(-1); // card we are scrolling toward after a click
  const webgl = useStore(ui, (s) => s.webgl);
  const n = projects.length;

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: el,
      start: 'top top',
      end: 'bottom bottom',
      onUpdate: (self) => {
        stateRef.current.progress = self.progress;
        const f = Math.round(self.progress * (n - 1));
        setFront((prev) => {
          if (prev !== f) audio.tick();
          return f;
        });
        if (pending.current === f) pending.current = -1;
        // scrolling away from a selected card closes it
        if (pending.current < 0 && stateRef.current.selected >= 0 && Math.abs(stateRef.current.selected - self.progress * (n - 1)) > 0.6) {
          stateRef.current.selected = -1;
          setSelected(-1);
        }
      },
    });
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting));
    io.observe(el);
    return () => {
      st.kill();
      io.disconnect();
    };
  }, [n]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') select(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /** Clicking a card brings it to the front; clicking the front card opens its details. */
  function select(i: number) {
    if (i < 0) {
      pending.current = -1;
      stateRef.current.selected = -1;
      setSelected(-1);
      return;
    }
    const el = sectionRef.current;
    if (el && i !== front) {
      const top = el.getBoundingClientRect().top + window.scrollY;
      const travel = el.offsetHeight - window.innerHeight;
      pending.current = i;
      scrollToTarget(top + (travel * i) / (n - 1));
    }
    stateRef.current.selected = i;
    setSelected(i);
  }

  const shown = selected >= 0 ? selected : front;
  const p = projects[shown];
  const [first, ...rest] = p.title.split(' ');

  return (
    <section ref={sectionRef} id="work" className="work" style={{ height: `${n * 75 + 100}vh` }} aria-labelledby="work-title" data-section="work">
      <div className="work__sticky">
        <header className="work__head">
          <p className="label">02 — Selected Work</p>
          <h2 id="work-title" className="work__title" data-liquid>
            3D product configurators &amp; WebGL experiences
          </h2>
          <p className="work__count">
            {String(shown + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
          </p>
        </header>

        <div className="work__canvas">
          {webgl ? (
            <WorkScene projects={projects} state={stateRef} active={active} onSelect={select} />
          ) : (
            <div className="work__fallback">
              {projects.map((pr, i) => (
                <button key={pr.slug} onClick={() => select(i)} style={{ background: `linear-gradient(135deg, ${pr.palette[0]}, ${pr.palette[1]})` }}>
                  {pr.title}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="work__split" aria-hidden>
          <span key={`a${shown}`} className="work__split-left">{first}</span>
          <span key={`b${shown}`} className="work__split-right">{rest.join(' ')}</span>
        </div>

        <div className="work__meta">
          <p>{p.category}</p>
          <p className="work__hint">{selected >= 0 ? 'Esc to close' : 'Click a project to bring it forward'}</p>
        </div>

        <Link href="/work" className="work__all disperse" data-cursor>
          <span>View all work</span>
          <i aria-hidden>→</i>
        </Link>

        <aside className={`work__panel ${selected >= 0 ? 'is-open' : ''}`} aria-hidden={selected < 0}>
          <button className="work__close" onClick={() => select(-1)} aria-label="Close project">
            ×
          </button>
          <p className="label">Project {String(shown + 1).padStart(2, '0')}</p>
          <h3>{p.title}</h3>
          <p className="work__summary">{p.summary}</p>
          <dl className="work__facts">
            <div>
              <dt>Services</dt>
              <dd>{p.services.join(' · ')}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{p.role}</dd>
            </div>
            <div>
              <dt>Stack</dt>
              <dd>{p.stack.join(' · ')}</dd>
            </div>
            <div>
              <dt>Year</dt>
              <dd>{p.year}</dd>
            </div>
          </dl>
          <Link href={`/work/${p.slug}`} className="btn btn--dark" data-cursor>
            Open case study →
          </Link>
        </aside>
      </div>

      {/* Crawlable list of the same projects */}
      <ol className="sr-only">
        {projects.map((pr) => (
          <li key={pr.slug}>
            <Link href={`/work/${pr.slug}`}>
              {pr.title} — {pr.category}: {pr.summary}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}