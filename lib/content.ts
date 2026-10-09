/**
 * All homepage copy, project data, skills and reviews live here.
 * Swap placeholders (marked TODO) without touching components.
 */

export const site = {
  name: 'Nuhash Jobayed',
  firstName: 'Nuhash',
  lastName: 'Jobayed',
  role: 'Creative Developer',
  url: 'https://90snuhash.com', // TODO: real domain
  email: '90snuhash@gmail.com', // TODO: real email
  city: 'Dhaka',
  country: 'Bangladesh',
  timezone: 'Asia/Dhaka',
  availability: 'Booking projects for Q4 2026', // TODO
  socials: [
    { label: 'LinkedIn', href: 'https://www.linkedin.com/in/nuhashjobayed/' },
    { label: 'GitHub', href: 'https://github.com/nuhash2k23' },
    { label: 'Behance', href: 'https://www.behance.net/90snuhash' },
    { label: 'Fiverr', href: 'https://www.fiverr.com/s/P44mb7p' },
  ],
  title: 'Nuhash Jobayed — Creative Developer | WebGL, Three.js, 3D Configurators & AI Integration',
  description:
    'Full-stack creative developer in Dhaka building 3D product configurators, WebGL websites, interactive simulations and AI-integrated experiences with Three.js, React Three Fiber and Blender — one-stop, from modeling to deployment.',
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
    'AI integration',
    'AI agent developer',
    'freelance creative developer',
  ],
};

/** Minimal menu (top right). */
export const menu = [
  { href: '/', label: 'Home', note: 'The journey' },
  { href: '/work', label: 'All work', note: 'Configurators & WebGL' },
  { href: '/about', label: 'About', note: 'The story so far' },
  { href: '/playground', label: 'Playground', note: 'Shader experiments' },
  { href: '/blog', label: 'Blog', note: 'Notes from the workbench' },
  { href: '/contact', label: 'Contact', note: 'Get a quote' },
];

export const nav = [
  { id: 'intro', index: '01', label: 'Intro' },
  { id: 'work', index: '02', label: 'Work' },
  { id: 'skills', index: '03', label: 'Skills' },
  { id: 'words', index: '04', label: 'Words' },
  { id: 'contact', index: '05', label: 'Contact' },
];

export const hero = {



  tagline: 'Full-stack creative developer, 3D specialist & AI integrator',
 
  video: './video/showreel.mp4', // TODO: '/video/showreel.mp4'
  videoPoster: './images/showreel.jpg', // TODO: '/video/showreel.jpg'
  videoLabel: 'Behind the scene',
};

export const intro = {
  label: '01 — Intro',
  heading: 'A creative developer who builds in three dimensions, ships in code, and wires it to think.',
  // Revealed word by word (blur → sharp) while scrolling.
  body:
    "I'm Nuhash — a full-stack creative developer in Dhaka. I shape the form in Blender, give it light and motion in WebGL, wire intelligence into it with AI agents and automation, and carry it all the way to a live product: 3D product configurators you can turn in your palm, walkthroughs you can wander, interactive simulations that behave like the real thing, visuals that hum instead of sit still. Thirty-plus projects shipped for clients across twenty countries. One pair of hands, start to finish — nothing lost in translation.",
  facts: [
    { k: 'Based', v: 'Dhaka, Bangladesh' },
    { k: 'Shipped', v: '30+ projects' },
    { k: 'Clients in', v: '20+ countries' },
    { k: 'Stack', v: 'Three.js · R3F · Blender · Next.js · AI' },
  ],
};

/**
 * Poetic lines shown on the flight to the door.
 * Each fires an audio cue. `key` is shown in red;
 * when the line fades, the key word stays and joins the phrase at the bottom.
 */
export const poeticLines = [
  { text: 'It starts with doubt and a dark viewport.', key: 'doubt' },
  { text: 'I shape it, break it, wire it to think — then push it live before I overthink.', key: 'live' },
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
   recognition?: string[];
  summary: string;
  palette: [string, string]; // placeholder cover gradient
  featured?: boolean; // true = appears on homepage staircase (exactly 7)
  image?: string; // TODO: /work/<slug>.jpg
  video?: string; // TODO: /work/<slug>.mp4 (plays only when in front)
  liveUrl?: string; // public link, if shareable
};

/**
 * All projects. The homepage staircase shows `featured: true` (always 7).
 * The /work page shows everything, filterable by category.
 */
export const projects: Project[] = [
  // ─── Featured 7 (homepage staircase) ───────────────────────────
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
    featured: true,
  },
  {
    slug: 'ebb-institut',
    title: 'EBB Institut',
    category: 'Full-stack website + WebGL',
    year: '—', // TODO
    country: 'Germany',
    role: 'Design, development, SEO',
    stack: ['Next.js', 'React Three Fiber', 'GLSL', 'Node.js'],
    services: ['Web design', 'WebGL visualization', 'SEO', 'Admin panel'],
    summary: 'Next.js site with R3F visualization showing how time attacks concrete and how testing saves it — shaders, 3D models, SEO and a full admin panel.',
    palette: ['#1a3a5c', '#f2efe9'],
    featured: true,
  },
  {
    slug: 'jutech',
    title: 'JuTech Hero',
    category: 'Interactive 3D website',
    year: '—', // TODO
    country: '—', // TODO
    role: 'Development',
    stack: ['Three.js', 'GSAP'],
    services: ['WebGL website', 'Motion'],
    summary: 'A multi-state WebGL hero that changes shape as the story moves.',
    palette: ['#1a0a08', '#ff4d1c'],
    featured: true,
  },
  {
    slug: 'green-lantern',
    title: 'Green Lantern: Sector 2814',
    category: 'WebGL experience',
    year: '—', // TODO
    country: '—',
    role: 'Concept, modeling, development',
    stack: ['Three.js', 'Blender', 'GLSL'],
    services: ['WebGL experience', '3D modeling', 'Shaders'],
    summary: 'A personal WebGL project — built for the craft, not the brief.',
    palette: ['#0a3d0a', '#00ff41'],
    featured: true,
  },
  {
    slug: 'atis-campus',
    title: 'ATIS Virtual Campus',
    category: '3D walkthrough',
    year: '—', // TODO
    country: '—', // TODO
    role: 'Modeling, development',
    stack: ['React Three Fiber', 'Blender'],
    services: ['3D walkthrough', '3D modeling', 'Interactive campus'],
    summary: 'An agricultural-tech education institute you can walk through in your browser — modeled in Blender, built in React Three Fiber, realistic.',
    palette: ['#2d6a4f', '#d8f3dc'],
    featured: true,
  },
  {
    slug: 'kronberg-watchsafe',
    title: 'Kronberg WatchSafe',
    category: 'Shopify + 3D',
    year: '—', // TODO
    country: '—', // TODO
    role: 'Design, modeling, development, integration',
    stack: ['Shopify', 'Three.js', 'Blender', 'Liquid'],
    services: ['Shopify store', '3D modeling', 'Custom design'],
    summary: 'A luxury watch-safe store — Shopify, custom design, and 3D modeling end to end.',
    palette: ['#1a1a2e', '#c9a84c'],
    featured: true,
  },
  {
    slug: 'airlabone',
    title: 'AirlabOne',
    category: 'Interactive 3D product',
    year: '—', // TODO
    country: '—', // TODO
    role: 'Modeling, development',
    stack: ['React Three Fiber', 'Blender'],
    services: ['3D modeling', 'Interactive simulation', 'User-event data'],
    summary: 'Medical devices modeled and made interactive — turn the machine on, press its panel, hear the audio, watch it work exactly as the real thing does.',
    palette: ['#0d1b2a', '#48cae4'],
    featured: true,
  },

  // ─── All other projects (TODO: replace placeholders with real data) ──
  {
    slug: 'switch-configurator',
    title: 'Switch Configurator',
    category: 'Shopify 3D configurator',
    year: '—', // TODO
    country: '—', // TODO
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
    year: '—', // TODO
    country: '—', // TODO
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
    year: '—', // TODO
    country: '—', // TODO
    role: 'Concept, development',
    stack: ['WebGPU', 'TSL', 'Three.js'],
    services: ['Shaders', 'Product configurator'],
    summary: 'Metal, stone and light — a technical study in WebGPU and TSL.',
    palette: ['#f4f1ea', '#c1121f'],
  },
  {
    slug: 'speaker-showcase',
    title: 'Speaker Showcase',
    category: 'Scroll experience',
    year: '—', // TODO
    country: '—', // TODO
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
    year: '—', // TODO
    country: 'Netherlands', // TODO
    role: 'Development',
    stack: ['Three.js', 'Blender'],
    services: ['Configurator', 'Visualization'],
    summary: 'Sizes, roofs and finishes for the Dutch market, priced in real time.',
    palette: ['#c1121f', '#f4f1ea'],
  },
  {
    slug: 'project-13',
    title: 'Project 13',
    category: 'TODO',
    year: '—',
    country: '—',
    role: 'TODO',
    stack: ['TODO'],
    services: ['TODO'],
    summary: 'Placeholder — replace with real project.',
    palette: ['#2b2d42', '#edf2f4'],
  },
  {
    slug: 'project-14',
    title: 'Project 14',
    category: 'TODO',
    year: '—',
    country: '—',
    role: 'TODO',
    stack: ['TODO'],
    services: ['TODO'],
    summary: 'Placeholder — replace with real project.',
    palette: ['#3d405b', '#f4f1de'],
  },
  {
    slug: 'project-15',
    title: 'Project 15',
    category: 'TODO',
    year: '—',
    country: '—',
    role: 'TODO',
    stack: ['TODO'],
    services: ['TODO'],
    summary: 'Placeholder — replace with real project.',
    palette: ['#1b263b', '#778da9'],
  },
  {
    slug: 'project-16',
    title: 'Project 16',
    category: 'TODO',
    year: '—',
    country: '—',
    role: 'TODO',
    stack: ['TODO'],
    services: ['TODO'],
    summary: 'Placeholder — replace with real project.',
    palette: ['#2d6a4f', '#b7e4c7'],
  },
  {
    slug: 'project-17',
    title: 'Project 17',
    category: 'TODO',
    year: '—',
    country: '—',
    role: 'TODO',
    stack: ['TODO'],
    services: ['TODO'],
    summary: 'Placeholder — replace with real project.',
    palette: ['#6b2737', '#f2e9e4'],
  },
  {
    slug: 'project-18',
    title: 'Project 18',
    category: 'TODO',
    year: '—',
    country: '—',
    role: 'TODO',
    stack: ['TODO'],
    services: ['TODO'],
    summary: 'Placeholder — replace with real project.',
    palette: ['#0b132b', '#5bc0be'],
  },
  {
    slug: 'project-19',
    title: 'Project 19',
    category: 'TODO',
    year: '—',
    country: '—',
    role: 'TODO',
    stack: ['TODO'],
    services: ['TODO'],
    summary: 'Placeholder — replace with real project.',
    palette: ['#264653', '#e9c46a'],
  },
  {
    slug: 'project-20',
    title: 'Project 20',
    category: 'TODO',
    year: '—',
    country: '—',
    role: 'TODO',
    stack: ['TODO'],
    services: ['TODO'],
    summary: 'Placeholder — replace with real project.',
    palette: ['#023047', '#fb8500'],
  },
  {
    slug: 'project-21',
    title: 'Project 21',
    category: 'TODO',
    year: '—',
    country: '—',
    role: 'TODO',
    stack: ['TODO'],
    services: ['TODO'],
    summary: 'Placeholder — replace with real project.',
    palette: ['#283618', '#dda15e'],
  },
  {
    slug: 'project-22',
    title: 'Project 22',
    category: 'TODO',
    year: '—',
    country: '—',
    role: 'TODO',
    stack: ['TODO'],
    services: ['TODO'],
    summary: 'Placeholder — replace with real project.',
    palette: ['#003049', '#d62828'],
  },
  {
    slug: 'project-23',
    title: 'Project 23',
    category: 'TODO',
    year: '—',
    country: '—',
    role: 'TODO',
    stack: ['TODO'],
    services: ['TODO'],
    summary: 'Placeholder — replace with real project.',
    palette: ['#1d3557', '#e63946'],
  },
  {
    slug: 'project-24',
    title: 'Project 24',
    category: 'TODO',
    year: '—',
    country: '—',
    role: 'TODO',
    stack: ['TODO'],
    services: ['TODO'],
    summary: 'Placeholder — replace with real project.',
    palette: ['#2a2d34', '#ff6b6b'],
  },
  {
    slug: 'project-25',
    title: 'Project 25',
    category: 'TODO',
    year: '—',
    country: '—',
    role: 'TODO',
    stack: ['TODO'],
    services: ['TODO'],
    summary: 'Placeholder — replace with real project.',
    palette: ['#3a0ca3', '#f72585'],
  },
  {
    slug: 'project-26',
    title: 'Project 26',
    category: 'TODO',
    year: '—',
    country: '—',
    role: 'TODO',
    stack: ['TODO'],
    services: ['TODO'],
    summary: 'Placeholder — replace with real project.',
    palette: ['#10002b', '#c77dff'],
  },
  {
    slug: 'project-27',
    title: 'Project 27',
    category: 'TODO',
    year: '—',
    country: '—',
    role: 'TODO',
    stack: ['TODO'],
    services: ['TODO'],
    summary: 'Placeholder — replace with real project.',
    palette: ['#240046', '#ff6d00'],
  },
  {
    slug: 'project-28',
    title: 'Project 28',
    category: 'TODO',
    year: '—',
    country: '—',
    role: 'TODO',
    stack: ['TODO'],
    services: ['TODO'],
    summary: 'Placeholder — replace with real project.',
    palette: ['#03071e', '#ffba08'],
  },
  {
    slug: 'project-29',
    title: 'Project 29',
    category: 'TODO',
    year: '—',
    country: '—',
    role: 'TODO',
    stack: ['TODO'],
    services: ['TODO'],
    summary: 'Placeholder — replace with real project.',
    palette: ['#212529', '#f8f9fa'],
  },
  {
    slug: 'project-30',
    title: 'Project 30',
    category: 'TODO',
    year: '—',
    country: '—',
    role: 'TODO',
    stack: ['TODO'],
    services: ['TODO'],
    summary: 'Placeholder — replace with real project.',
    palette: ['#14213d', '#fca311'],
  },
];

/** Homepage staircase — always exactly 7. */
export const featuredProjects = projects.filter((p) => p.featured);

/** Filter categories for the /work page. */
export const projectCategories = [
  'All',
  'Configurators',
  'WebGL websites',
  'Walkthroughs',
  'Shopify',
  'Personal',
] as const;

export const skills = {
  label: '03 — Skills',
  count: '(06)',
  statement:
    'Full-stack creative developer in Dhaka — building 3D product configurators, WebGL experiences and AI-integrated tools, from the first polygon to the last deploy.',
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
      title: 'AI & Automation',
      items: ['AI agent integration', 'LLM workflows', 'Business automation', 'Data-driven 3D', 'Interactive simulations', 'Smart configurators'],
    },
    {
      title: 'Tools',
      items: ['Git', 'Vite', 'Figma', 'Vercel', 'Custom R3F tooling', 'Performance profiling'],
    },
  ],
};

/**
 * Testimonials — multiple reviews per country allowed.
 * Map-linked: clicking a country dot shows that country's reviews.
 * `projectType` helps visitors see the range of work.
 * TODO: replace every placeholder with a real Fiverr review.
 */
export type Review = { country: string; text: string; projectType?: string };
export const reviews: Review[] = [
  // Germany (4 clients)
  { country: 'Germany', text: 'Placeholder — paste real review.', projectType: 'Configurator' },
  { country: 'Germany', text: 'Placeholder — paste real review.', projectType: 'WebGL site' },
  { country: 'Germany', text: 'Placeholder — paste real review.', projectType: 'SEO' },
  { country: 'Germany', text: 'Placeholder — paste real review.', projectType: '3D modeling' },
  // France (2 clients)
  { country: 'France', text: 'Placeholder — paste real review.', projectType: 'Configurator' },
  { country: 'France', text: 'Placeholder — paste real review.', projectType: '3D modeling' },
  // Austria (2 clients)
  { country: 'Austria', text: 'Placeholder — paste real review.', projectType: 'Configurator' },
  { country: 'Austria', text: 'Placeholder — paste real review.', projectType: '3D modeling' },
  // Netherlands (3 clients)
  { country: 'Netherlands', text: 'Placeholder — paste real review.', projectType: 'Configurator' },
  { country: 'Netherlands', text: 'Placeholder — paste real review.', projectType: 'WebGL site' },
  { country: 'Netherlands', text: 'Placeholder — paste real review.', projectType: '3D modeling' },
  // Australia (3 clients)
  { country: 'Australia', text: 'Placeholder — paste real review.', projectType: 'Configurator' },
  { country: 'Australia', text: 'Placeholder — paste real review.', projectType: 'WebGL site' },
  { country: 'Australia', text: 'Placeholder — paste real review.', projectType: '3D modeling' },
  // United States (2 clients)
  { country: 'United States', text: 'Placeholder — paste real review.', projectType: 'Configurator' },
  { country: 'United States', text: 'Placeholder — paste real review.', projectType: 'WebGL site' },
  // United Kingdom (2 clients)
  { country: 'United Kingdom', text: 'Placeholder — paste real review.', projectType: 'Configurator' },
  { country: 'United Kingdom', text: 'Placeholder — paste real review.', projectType: '3D modeling' },
  // Switzerland (2 clients)
  { country: 'Switzerland', text: 'Placeholder — paste real review.', projectType: 'Configurator' },
  { country: 'Switzerland', text: 'Placeholder — paste real review.', projectType: 'WebGL site' },
  // Sweden (1 client)
  { country: 'Sweden', text: 'Placeholder — paste real review.', projectType: 'Configurator' },
  // Kuwait (1 client)
  { country: 'Kuwait', text: 'Placeholder — paste real review.', projectType: '3D modeling' },
  // Nigeria (1 client)
  { country: 'Nigeria', text: 'Placeholder — paste real review.', projectType: 'WebGL site' },
  // New Zealand (1 client)
  { country: 'New Zealand', text: 'Placeholder — paste real review.', projectType: 'Configurator' },
  // UAE (1 client)
  { country: 'UAE', text: 'Placeholder — paste real review.', projectType: '3D modeling' },
  // Singapore (1 client)
  { country: 'Singapore', text: 'Placeholder — paste real review.', projectType: 'Configurator' },
  // Saudi Arabia (1 client)
  { country: 'Saudi Arabia', text: 'Placeholder — paste real review.', projectType: 'WebGL site' },
  // Italy (1 client)
  { country: 'Italy', text: 'Placeholder — paste real review.', projectType: '3D modeling' },
  // Denmark (1 client)
  { country: 'Denmark', text: 'Placeholder — paste real review.', projectType: 'Configurator' },
  // Japan (1 client)
  { country: 'Japan', text: 'Placeholder — paste real review.', projectType: '3D modeling' },
  // Spain (1 client)
  { country: 'Spain', text: 'Placeholder — paste real review.', projectType: 'WebGL site' },
];

/**
 * Client locations with real coordinates.
 * `clients` = how many projects from that country (add more as you grow).
 */
export type Place = { name: string; lon: number; lat: number; clients: number; home?: boolean };
export const places: Place[] = [
  { name: 'Dhaka', lon: 90.41, lat: 23.81, clients: 0, home: true },
  { name: 'Germany', lon: 10.45, lat: 51.17, clients: 4 },
  { name: 'France', lon: 2.35, lat: 46.23, clients: 2 },
  { name: 'Austria', lon: 14.55, lat: 47.52, clients: 2 },
  { name: 'Sweden', lon: 18.07, lat: 59.33, clients: 1 },
  { name: 'United Kingdom', lon: -1.17, lat: 52.36, clients: 2 },
  { name: 'Kuwait', lon: 47.98, lat: 29.37, clients: 1 },
  { name: 'Australia', lon: 151.21, lat: -33.87, clients: 3 },
  { name: 'United States', lon: -98.58, lat: 39.83, clients: 2 },
  { name: 'Nigeria', lon: 3.38, lat: 6.52, clients: 1 },
  { name: 'New Zealand', lon: 174.76, lat: -41.29, clients: 1 },
  { name: 'UAE', lon: 55.27, lat: 25.20, clients: 1 },
  { name: 'Netherlands', lon: 5.29, lat: 52.13, clients: 3 },
  { name: 'Singapore', lon: 103.82, lat: 1.35, clients: 1 },
  { name: 'Saudi Arabia', lon: 46.68, lat: 24.71, clients: 1 },
  { name: 'Switzerland', lon: 8.23, lat: 46.82, clients: 2 },
  { name: 'Italy', lon: 12.50, lat: 41.90, clients: 1 },
  { name: 'Denmark', lon: 12.57, lat: 55.68, clients: 1 },
  { name: 'Japan', lon: 139.69, lat: 35.69, clients: 1 },
  { name: 'Spain', lon: -3.70, lat: 40.42, clients: 1 },
];

export const words = {
  label: '04 — Words',
  heading: 'What people say',
  sub: 'Freelance creative developer for clients worldwide — twenty countries, one quiet desk in Dhaka.',
};

export const contact = {
  label: '05 — Contact',
  big: 'Contact',
  headline: 'Got something that deserves to be felt, not just explained?',
  lines: [
    'Available worldwide for custom WebGL websites, 3D product configurators, AI-integrated tools and full-stack builds.',
    'Open to project work, contract and full-time. Agencies and NDA-first conversations welcome.',
    'Send a rough idea or a full spec. I reply in hours, not weeks.',
  ],
  cta: 'Get a quote',
  // understated availability note for the contact section + quote page
  availabilityNote: 'Freelance · contract · full-time — agencies and NDAs welcome.',
  /** Two images flanking the contact form / CTA. */
  images: {
    left: {
      src: './images/workspace.png', // TODO: real path
      alt: "Nuhash's workspace — screen with Blender open, ambient light",
    },
    right: {
      src: './images/dhaka-city.png', // TODO: real path
      alt: 'Dhaka skyline at golden hour',
    },
  },
};

/**
 * Profile image — sits at the top of the adjacent section,
 * flat top edge, bottom shaped like a tall half-capsule (long semicircle).
 * Three nested outline frames offset in different directions (red/orange).
 * Hover: Raster Lines ripple on borders, photo shifts to Stipple Duotone.
 */
export const profileImage = {
  src: './images/nuhash-jobayed.png', // TODO: real path
  alt: 'Nuhash Jobayed — creative developer',
  // Border offset config (in px) for the three nested capsule outlines.
  borders: [
    { offsetX: -4, offsetY: -6, color: 'var(--red)' },
    { offsetX: 6, offsetY: 4, color: 'var(--orange)' },
    { offsetX: 0, offsetY: 0, color: 'var(--red-dim)' },
  ],
};

/**
 * Quote / contact page — a short questionnaire with two modes:
 *   'standard'   — the quick ask (name, email, type, message)
 *   'engagement' — the full brief (company, budget, timeline, engagement, referral…)
 * Submits by mailto for now (no backend) — swap for an API route later.
 */
export const quote = {
  label: 'Contact',
  title: 'Tell me what you',
  italic: 'want to build.',
  intro:
    'A few questions so the first reply is useful, not a formality. Open to project work, contract and full-time — agencies and NDA-first talks welcome. I reply in hours, not weeks.',
  modes: [
    { id: 'standard', label: 'Quick note', note: 'Just the essentials' },
    { id: 'engagement', label: 'Full brief', note: 'Scope, budget, timeline' },
  ] as const,
  projectTypes: [
    '3D product configurator',
    'WebGL / interactive website',
    'Shopify + 3D',
    '3D modeling (Blender)',
    'AI-integrated tool',
    'Full-stack build',
    'Not sure yet',
  ],
  engagementTypes: ['One-off project', 'Ongoing contract', 'Full-time', 'NDA first — then talk'],
  budgets: ['< $1k', '$1k – $3k', '$3k – $8k', '$8k – $20k', '$20k +', 'Not sure yet'],
  timelines: ['ASAP', 'Within a month', '1 – 3 months', 'Flexible'],
  referrals: ['Fiverr', 'LinkedIn', 'Behance', 'A referral', 'Search', 'Somewhere else'],
};

export const footer = {
  line: 'Shaped in Dhaka. Built for every screen.',
};

export type Post = { slug: string; title: string; date: string; tag: string; excerpt: string; draft?: boolean };
// TODO: real posts. These are planned topics, marked as drafts.
export const posts: Post[] = [
  { slug: 'blender-to-browser', title: 'From Blender to browser without losing the look', date: '2026-10', tag: 'Pipeline', excerpt: 'Planned post — baking, glTF compression and the material settings that survive the trip.', draft: true },
  { slug: 'configurators-that-sell', title: 'What makes a 3D configurator actually sell', date: '2026-10', tag: 'Configurators', excerpt: 'Planned post — variant logic, load times and the small UI details that move conversion.', draft: true },
  { slug: 'webgpu-tsl-first-steps', title: 'Porting GLSL effects to WebGPU and TSL', date: '2026-11', tag: 'WebGPU', excerpt: "Planned post — notes from moving this site's shaders to TSL.", draft: true },
];

export type Experiment = { slug: string; title: string; tech: string; palette: [string, string] };
// TODO: link real demos / videos.
export const experiments: Experiment[] = [
  { slug: 'thermal-noise', title: 'Thermal Noise', tech: 'GLSL · post-processing', palette: ['#ff5a1f', '#2e0507'] },
  { slug: 'raster-lines', title: 'Raster Lines', tech: 'GLSL · luminance displacement', palette: ['#d01f1f', '#0a0706'] },
  { slug: 'stipple-duotone', title: 'Stipple Duotone', tech: 'GLSL · dithering', palette: ['#f6f4f0', '#8e0f14'] },
  { slug: 'glyph-grid', title: 'Glyph Grid', tech: 'GLSL · ASCII atlas', palette: ['#ff9a4d', '#120b09'] },
  { slug: 'teletext-pattern', title: 'Teletext Pattern', tech: 'GLSL · halftone', palette: ['#ff5a1f', '#f6f4f0'] },
  { slug: 'camera-path-editor', title: 'Camera Path Editor', tech: 'R3F · tooling', palette: ['#120b09', '#d01f1f'] },
];

/** About page — the ledger. TODO: correct the years. */
export const ledger = [
  { when: '2026 — Now', what: 'Independent creative developer', where: 'Dhaka · clients worldwide', note: 'Working directly with brands and agencies on 3D product configurators, WebGL websites, AI-integrated tools and full-stack builds.' },
  { when: '2025-26', what: 'AirlabOne — 3D Developer / Modelling', where: 'Remote', note: 'Modeled medical devices, built interactive R3F simulations — users could power on the machine, navigate its panel, and see exactly how it works.' },
  { when: '2024-25', what: 'Secomind AI — 3D Developer / Modelling', where: 'Remote', note: 'Blender first, then code — learning to make things you can turn in your hands, on a screen.' },
];