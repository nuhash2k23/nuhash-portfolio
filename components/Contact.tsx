import type { Metadata } from 'next';
import { contact, quote, site } from '@/lib/content';
import PageHead from '@/components/PageHead';
import QuoteForm from '@/components/QuoteForm';
import Footer from '@/components/footer/Footer';

export const metadata: Metadata = {
  title: 'Contact — get a quote',
  description:
    'Tell me what you want to build. Freelance, contract or full-time — agencies and NDA-first conversations welcome. 3D product configurators, WebGL websites and full-stack builds. I reply in hours, not weeks.',
  alternates: { canonical: '/contact' },
};

export default function ContactPage() {
  return (
    <>
      <main className="page page--paper">
        <PageHead label={quote.label} title={quote.title} italic={quote.italic} intro={quote.intro} />

        <section className="contact-page">
          <QuoteForm />

          <aside className="contact-page__side">
            <p className="label">Direct</p>
            <a className="contact-page__mail" href={`mailto:${site.email}`} data-cursor>
              {site.email}
            </a>
            <p className="contact-page__weight">{contact.availabilityNote}</p>
            <ul className="contact-page__links">
              {site.socials.map((s) => (
                <li key={s.label}>
                  <a href={s.href} target="_blank" rel="noreferrer" className="disperse" data-cursor>
                    {s.label} ↗
                  </a>
                </li>
              ))}
            </ul>
            <p className="contact-page__loc">
              {site.city}, {site.country} · {site.availability}
            </p>
          </aside>
        </section>
      </main>
      
    </>
  );
}