/**
 * All homepage copy, project data, skills and reviews live here.
 * Swap placeholders (marked TODO) without touching components.
 */

export const site = {
  name: 'Nuhash Jobayed',
  firstName: 'Nuhash',
  lastName: 'Jobayed',
  role: 'Creative Developer',
  url: 'https://nuhashjobayed.com', // TODO: real domain
  email: 'hello@nuhashjobayed.com', // TODO: real email
  city: 'Dhaka',
  country: 'Bangladesh',
  timezone: 'Asia/Dhaka',
  availability: 'Booking projects for Q4 2026', // TODO
  socials: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/' }, // TODO
    { label: 'GitHub', href: 'https://github.com/' }, // TODO
    { label: 'Behance', href: 'https://www.behance.net/' }, // TODO
    { label: 'Fiverr', href: 'https://www.fiverr.com/' }, // TODO
  ],
  title: 'Nuhash Jobayed — Creative Developer | WebGL, Three.js & 3D Configurators',
  description:
    'Full-stack creative developer in Dhaka building 3D product configurators, WebGL websites and interactive 3D experiences with Three.js, React Three Fiber and Blender — one-stop, from modeling to deployment.',
  keywords: [
    'creative developer',
    'full-stack developer',
    'WebGL developer',
    'Three.js developer',
    'React Three Fiber developer',
    '3D product configurator',
    'Shopify 3D configurator',
    'interactive 3D website',
    '3D modeling',
    'Blender to browser',
    'WebGPU',
    'freelance creative developer',
  ],
};

export const nav = [
  { id: 'intro', index: '01', label: 'Intro' },
  { id: 'work', index: '02', label: 'Work' },
  { id: 'skills', index: '03', label: 'Skills' },
  { id: 'words', index: '04', label: 'Words' },
  { id: 'contact', index: '05', label: 'Contact' },
];

export const hero = {
  eyebrow: 'Creative developer,',
  eyebrowItalic: 'shaping light',
  eyebrowRest: 'and form for the web — from Blender to browser.',
  tagline: 'Full-stack creative developer & 3D specialist',
  scrollHint: 'Scroll to break the stone',
};

export const intro = {
  label: '01 — Intro',
  heading: 'A creative developer who builds in three dimensions and ships in code.',
  // Revealed word by word (blur → sharp) while scrolling.
  body:
    'I’m Nuhash — a full-stack creative developer in Dhaka. I shape the form in Blender, give it light and motion in WebGL, and carry it all the way to a live product: 3D product configurators you can turn in your palm, walkthroughs you can wander, visuals that hum instead of sit still. Fifty-plus projects shipped for brands across seven countries. One pair of hands, start to finish — nothing lost in translation.',
  facts: [
    { k: 'Based', v: 'Dhaka, Bangladesh' },
    { k: 'Shipped', v: '50+ projects' },
    { k: 'Clients in', v: '7 countries' },
    { k: 'Stack', v: 'Three.js · R3F · Blender · Next.js' },
  ],
};

/** Mystery lines on the flight to the door. Each one fires an audio cue. */
export const mysteryLines = [
  'Every form begins in the dark.',
  'I model it in Blender, give it light in WebGL, ship it in code.',
  'One hand. Start to finish. Nothing lost in translation.',
];

export type Project = {
  slug: string;
  title: string; // shown split: first word left, rest right
  category: string;
  year: string;
  country: string;
  role: string;
  stack: string[];
  services: string[];
  summary: string;
  palette: [string, string]; // placeholder cover gradient
  image?: string; // TODO: /work/<slug>.jpg
  video?: string; // TODO: /work/<slug>.mp4 (plays only when in front)
};

// Always exactly 7 entries — the staircase is built for 7 steps.
export const projects: Project[] = [
  {
    slug: 'un4seen-ride',
    title: 'UN4SEEN Ride',
    category: '3D product configurator',
    year: '—', // TODO
    country: '—', // TODO
    role: 'Modeling, development',
    stack: ['Three.js', 'Blender', 'GLSL'],
    services: ['3D modeling', 'Product configurator', 'Real-time materials'],
    summary: 'Motocross gear configurator — riders build their kit and watch it change live.',
    palette: ['#ff4d1c', '#120706'],
  },
  {
    slug: 'switch-configurator',
    title: 'Switch Configurator',
    category: 'Shopify 3D configurator',
    year: '—',
    country: '—',
    role: 'Modeling, development, integration',
    stack: ['Three.js', 'Blender', 'Shopify'],
    services: ['3D modeling', 'Configurator', 'Shopify integration'],
    summary: 'Every build maps to a real variant and goes straight to checkout.',
    palette: ['#e8361c', '#f2efe9'],
  },
  {
    slug: 'coverseal-v10',
    title: 'CoverSeal V10',
    category: '3D product configurator',
    year: '—',
    country: '—',
    role: 'Development',
    stack: ['Three.js', 'Blender'],
    services: ['Product configurator', 'Visualization'],
    summary: 'A pool cover system specified in 3D before it is ever ordered.',
    palette: ['#ff7a1a', '#0b0b0b'],
  },
  {
    slug: 'ring-configurator',
    title: 'Ring Configurator',
    category: 'WebGPU showcase',
    year: '—',
    country: '—',
    role: 'Concept, development',
    stack: ['WebGPU', 'TSL', 'Three.js'],
    services: ['Shaders', 'Product configurator'],
    summary: 'Metal, stone and light — a technical study in WebGPU and TSL.',
    palette: ['#f4f1ea', '#c1121f'],
  },
  {
    slug: 'jutech',
    title: 'JuTech Hero',
    category: 'Interactive 3D website',
    year: '—',
    country: '—',
    role: 'Development',
    stack: ['Three.js', 'GSAP'],
    services: ['WebGL website', 'Motion'],
    summary: 'A multi-state WebGL hero that changes shape as the story moves.',
    palette: ['#1a0a08', '#ff4d1c'],
  },
  {
    slug: 'speaker-showcase',
    title: 'Speaker Showcase',
    category: 'Scroll experience',
    year: '—',
    country: '—',
    role: 'Modeling, development',
    stack: ['React Three Fiber', 'Blender'],
    services: ['3D modeling', 'Scroll animation'],
    summary: 'A portable speaker taken apart, piece by piece, as you scroll.',
    palette: ['#ff9f43', '#140a06'],
  },
  {
    slug: 'veranda-configurator',
    title: 'Veranda Configurator',
    category: '3D configurator',
    year: '—',
    country: '—',
    role: 'Development',
    stack: ['Three.js', 'Blender'],
    services: ['Configurator', 'Visualization'],
    summary: 'Sizes, roofs and finishes for the Dutch market, priced in real time.',
    palette: ['#c1121f', '#f4f1ea'],
  },
];

export const skills = {
  label: '03 — Skills',
  count: '(05)',
  statement:
    'Full-stack creative developer in Dhaka, building 3D product configurators and WebGL experiences — from the first polygon to the last deploy.',
  cta: 'Get a quote',
  groups: [
    {
      title: '3D & WebGL',
      items: ['Three.js', 'React Three Fiber', 'WebGPU & TSL', 'GLSL shaders', 'Post-processing', 'Real-time configurators'],
    },
    {
      title: 'Frontend',
      items: ['Next.js', 'React', 'TypeScript', 'GSAP', 'Scroll storytelling', 'Accessibility & SEO'],
    },
    {
      title: 'Backend',
      items: ['Node.js', 'REST APIs', 'Shopify & Liquid', 'Databases', 'Auth & payments', 'Deployment'],
    },
    {
      title: '3D Modeling',
      items: ['Blender', 'Hard-surface modeling', 'PBR texturing', 'Baking', 'glTF optimisation', 'Product renders'],
    },
    {
      title: 'Tools',
      items: ['Git', 'Vite', 'Figma', 'Vercel', 'Custom R3F tooling', 'Performance profiling'],
    },
  ],
};

/** Testimonials: real review lines only. Tied to a country, never a name. */
export type Review = { country: string; text: string };
export const reviews: Review[] = [
  // TODO: replace every line with a real Fiverr review.
  { country: 'Germany', text: 'Placeholder — paste a real review from a client in Germany.' },
  { country: 'France', text: 'Placeholder — paste a real review from a client in France.' },
  { country: 'Austria', text: 'Placeholder — paste a real review from a client in Austria.' },
  { country: 'Sweden', text: 'Placeholder — paste a real review from a client in Sweden.' },
  { country: 'United Kingdom', text: 'Placeholder — paste a real review from a client in the UK.' },
  { country: 'Kuwait', text: 'Placeholder — paste a real review from a client in Kuwait.' },
  { country: 'Australia', text: 'Placeholder — paste a real review from a client in Australia.' },
];

export const places: { name: string; lon: number; lat: number; home?: boolean }[] = [
  { name: 'Dhaka', lon: 90.41, lat: 23.81, home: true },
  { name: 'Germany', lon: 10.45, lat: 51.17 },
  { name: 'France', lon: 2.21, lat: 46.23 },
  { name: 'Austria', lon: 14.55, lat: 47.52 },
  { name: 'Sweden', lon: 18.64, lat: 60.13 },
  { name: 'United Kingdom', lon: -1.17, lat: 52.36 },
  { name: 'Kuwait', lon: 47.98, lat: 29.37 },
  { name: 'Australia', lon: 151.21, lat: -33.87 },
];

export const words = {
  label: '04 — Words',
  heading: 'What people say',
  sub: 'Freelance creative developer for clients worldwide — seven countries, one quiet desk in Dhaka.',
};

export const contact = {
  label: '05 — Contact',
  big: 'Contact',
  headline: 'Got something that deserves to be felt, not just explained?',
  lines: [
    'Available for freelance projects worldwide — custom WebGL websites, 3D product configurators and full-stack builds.',
    'Send a rough idea or a full spec. I reply with thoughts and a quote within two working days.', // TODO: confirm
  ],
  cta: 'Get a quote',
};

export const footer = {
  line: 'Shaped in Dhaka. Built for every screen.',
};
