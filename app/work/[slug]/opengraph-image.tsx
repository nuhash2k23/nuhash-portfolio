import { ImageResponse } from 'next/og';
import { projects, site } from '@/lib/content';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export const alt = 'Project case study';

// Pre-build one card per project at build time.
export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

/** Per-project share card — background from the project's own palette. */
export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = projects.find((x) => x.slug === slug);

  // fall back to the brand card if the slug is unknown
  const a = p?.palette?.[0] ?? '#e0241b';
  const b = p?.palette?.[1] ?? '#0a0605';
  const title = p?.title ?? site.name;
  const category = p?.category ?? site.role;
  const stack = p?.stack ?? [];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px 80px',
          background: `linear-gradient(135deg, ${a} 0%, ${b} 78%)`,
          color: '#fff',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ fontSize: 24, letterSpacing: 3, textTransform: 'uppercase', color: 'rgba(255,255,255,0.75)' }}>
            {category}
          </div>
          <div style={{ fontSize: 22, letterSpacing: 4, color: 'rgba(255,255,255,0.65)', textTransform: 'uppercase' }}>
            {site.name}
          </div>
        </div>

        <div style={{ fontSize: 104, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2, maxWidth: 1000 }}>
          {title}
        </div>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {stack.slice(0, 5).map((s) => (
            <div
              key={s}
              style={{
                fontSize: 22,
                padding: '8px 18px',
                borderRadius: 999,
                background: 'rgba(0,0,0,0.28)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: 'rgba(255,255,255,0.9)',
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}