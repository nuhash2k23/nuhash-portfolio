import Loader from '@/components/chrome/Loader';
import SmoothScroll from '@/components/chrome/SmoothScroll';
import Cursor from '@/components/chrome/Cursor';
import Rulers from '@/components/chrome/Rulers';
import Nav from '@/components/chrome/Nav';
import SoundToggle from '@/components/chrome/SoundToggle';
import Journey from '@/components/journey/Journey';
import Work from '@/components/work/Work';
import Skills from '@/components/Skills';
import Testimonials from '@/components/Testimonials';
import Contact from '@/components/Contact';
import Footer from '@/components/footer/Footer';
import { projects, site, skills } from '@/lib/content';

function StructuredData() {
  const data = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Person',
        '@id': `${site.url}/#person`,
        name: site.name,
        jobTitle: 'Full-stack Creative Developer',
        url: site.url,
        email: `mailto:${site.email}`,
        address: { '@type': 'PostalAddress', addressLocality: site.city, addressCountry: 'BD' },
        knowsAbout: skills.groups.flatMap((g) => g.items),
        sameAs: site.socials.map((s) => s.href),
      },
      {
        '@type': 'ProfessionalService',
        '@id': `${site.url}/#service`,
        name: `${site.name} — Creative Development`,
        url: site.url,
        description: site.description,
        provider: { '@id': `${site.url}/#person` },
        areaServed: 'Worldwide',
        address: { '@type': 'PostalAddress', addressLocality: site.city, addressCountry: 'BD' },
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Services',
          itemListElement: [
            '3D product configurators',
            'WebGL & Three.js websites',
            '3D modeling (Blender)',
            'Full-stack web development',
            '3D walkthroughs and visualization',
          ].map((name) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name } })),
        },
      },
      {
        '@type': 'ItemList',
        name: 'Selected work',
        itemListElement: projects.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          url: `${site.url}/work/${p.slug}`,
          name: p.title,
        })),
      },
    ],
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}

export default function Home() {
  return (
    <>
      <StructuredData />
      <Loader />
      <SmoothScroll />
      <Cursor />
      <Rulers />
      <Nav />
      <SoundToggle />
      <main>
        <Journey />
        <Work />
        <Skills />
        <Testimonials />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
