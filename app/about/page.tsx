import type { Metadata } from 'next';
import { intro, ledger, site, skills } from '@/lib/content';
import PageHead, { PageCta } from '@/components/PageHead';
import Footer from '@/components/footer/Footer';

export const metadata: Metadata = {
  title: 'About — full-stack creative developer in Dhaka',
  description:
    'Nuhash Jobayed is a full-stack creative developer and 3D specialist in Dhaka, Bangladesh — Blender modeling, WebGL, Three.js and React Three Fiber, from first polygon to deployment.',
  alternates: { canonical: '/about' },
};

export default function About() {
  return (
    <>
      <main className="page page--paper">
        <PageHead label="About" title={site.name} italic="— known whereabouts." />

        <section className="about">
          {/* TODO: your photo */}
          <figure className="about__photo" data-liquid>
            <div className="placeholder placeholder--photo">
              <span>Your photo</span>
            </div>
            <figcaption>
              {site.city}, {site.country}
            </figcaption>
          </figure>
          <div className="about__text">
            <h2 className="about__lead" data-liquid>
              {intro.heading}
            </h2>
            <p>{intro.body}</p>
            <dl className="intro__facts about__facts">
              {intro.facts.map((f) => (
                <div key={f.k}>
                  <dt>{f.k}</dt>
                  <dd>{f.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="ledger" aria-labelledby="ledger-title">
          <div className="ledger__head">
            <p className="label">Movements on record</p>
            <h2 id="ledger-title">The Career Ledger</h2>
          </div>
          <ol>
            {ledger.map((l) => (
              <li key={l.when + l.what} className="ledger__row">
                <span className="ledger__when">{l.when}</span>
                <span className="ledger__what">
                  <strong>{l.what}</strong>
                  <small>{l.where}</small>
                </span>
                <p className="ledger__note">{l.note}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="about-skills">
          <p className="label">What I work with</p>
          <div className="about-skills__grid">
            {skills.groups.map((g) => (
              <div key={g.title}>
                <h3>{g.title}</h3>
                <ul>
                  {g.items.map((i) => (
                    <li key={i}>{i}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <PageCta />
      </main>
      <Footer />
    </>
  );
}
