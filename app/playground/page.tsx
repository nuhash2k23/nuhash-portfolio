import type { Metadata } from 'next';
import { experiments } from '@/lib/content';
import PageHead from '@/components/PageHead';
import Footer from '@/components/footer/Footer';

export const metadata: Metadata = {
  title: 'Playground — shader and WebGL experiments',
  description: 'Shader experiments, effects and tools: Thermal Noise, Raster Lines, Stipple Duotone, Glyph Grid, Teletext Pattern and a scroll camera path editor.',
  alternates: { canonical: '/playground' },
};

export default function Playground() {
  return (
    <>
      <main className="page page--dark">
        <PageHead
          label="Playground"
          title="Experiments that"
          italic="didn’t need a brief."
          intro="Shader effects and small tools, built for the fun of it and reused in client work."
        />
        <ul className="lab">
          {experiments.map((e, i) => (
            <li key={e.slug} className="lab__tile" data-cursor data-liquid>
              {/* TODO: replace with a looping video or live demo of the effect */}
              <div className="lab__media" style={{ background: `linear-gradient(135deg, ${e.palette[0]}, ${e.palette[1]})` }}>
                <span className="lab__index">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h2 className="lab__title disperse">{e.title}</h2>
              <p className="lab__tech">{e.tech}</p>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}
