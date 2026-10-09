import { ImageResponse } from 'next/og';
import { site } from '@/lib/content';

// Next.js reads these three exports to wire the <meta> tags automatically.
export const alt = `${site.name} — ${site.role}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Default share card, drawn at request time (no static /og.jpg needed).
 * Used for the homepage and any route without its own opengraph-image.
 */
export default function OG() {
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
          background:
            'radial-gradient(900px 600px at 78% 18%, #3a0f08 0%, #140807 55%, #0a0605 100%)',
          color: '#fff',
          fontFamily: 'sans-serif',
        }}
      >
        {/* top row: mark + location */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div
            style={{
              width: 64,
              height: 64,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#e0241b',
              borderRadius: 14,
              fontSize: 40,
              fontWeight: 800,
              color: '#140807',
            }}
          >
            N
          </div>
          <div style={{ fontSize: 22, letterSpacing: 4, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase' }}>
            {site.city}, {site.country}
          </div>
        </div>

        {/* name + role */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1.0, letterSpacing: -2 }}>
            {site.name}
          </div>
          <div style={{ fontSize: 34, marginTop: 20, color: '#ff6a3d', letterSpacing: 1 }}>
            {site.role} · WebGL · Three.js · 3D Configurators
          </div>
        </div>

        {/* footer line */}
        <div style={{ fontSize: 24, color: 'rgba(255,255,255,0.6)', letterSpacing: 2 }}>
          {site.url.replace('https://', '')}
        </div>
      </div>
    ),
    { ...size },
  );
}