'use client';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { projectCategories, type Project } from '@/lib/content';

/** Map a project's free-text category to one of the filter tabs. */
function groupOf(p: Project): (typeof projectCategories)[number] {
  const c = `${p.category} ${p.services.join(' ')}`.toLowerCase();
  if (/shopify/.test(c)) return 'Shopify';
  if (/walkthrough|campus|tour/.test(c)) return 'Walkthroughs';
  if (/configurator/.test(c)) return 'Configurators';
  if (/personal|showcase|experience|green lantern/.test(c)) return 'Personal';
  if (/webgl|website|interactive|scroll|shader/.test(c)) return 'WebGL websites';
  return 'Configurators';
}

export default function WorkList({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<(typeof projectCategories)[number]>('All');

  // tag every project once, then count per category so empty tabs can be hidden
  const tagged = useMemo(() => projects.map((p) => ({ p, group: groupOf(p) })), [projects]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    tagged.forEach(({ group }) => m.set(group, (m.get(group) ?? 0) + 1));
    return m;
  }, [tagged]);

  const shown = filter === 'All' ? tagged : tagged.filter((t) => t.group === filter);

  return (
    <>
      <div className="workfilter" role="tablist" aria-label="Filter work by type">
        {projectCategories.map((cat) => {
          const count = cat === 'All' ? projects.length : counts.get(cat) ?? 0;
          if (count === 0) return null;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={filter === cat}
              className={`workfilter__tab ${filter === cat ? 'is-active' : ''}`}
              onClick={() => setFilter(cat)}
              data-cursor
            >
              {cat}
              <sup>{count}</sup>
            </button>
          );
        })}
      </div>

      <ol className="worklist">
        {shown.map(({ p }, i) => (
          <li key={p.slug}>
            <Link href={`/work/${p.slug}`} className="worklist__row" data-cursor>
              <span className="worklist__index">{String(i + 1).padStart(2, '0')}</span>
              <span className="worklist__title disperse">{p.title}</span>
              <span className="worklist__tags">
                <span>{p.category}</span>
                <span>{p.stack.slice(0, 2).join(' · ')}</span>
              </span>
              <span className="worklist__year">{p.year}</span>
              <span
                className="worklist__thumb"
                aria-hidden
                style={{ background: p.image ? `url(${p.image}) center/cover` : `linear-gradient(135deg, ${p.palette[0]}, ${p.palette[1]})` }}
              />
              <span className="worklist__arrow" aria-hidden>
                →
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}
