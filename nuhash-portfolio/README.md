# Nuhash Jobayed — Portfolio (homepage v1)

Next.js 15 · React 19 · React Three Fiber 9 · three.js · GLSL · GSAP ScrollTrigger · Lenis

```bash
npm install
npm run dev     # http://localhost:3000
npm run build && npm start
```

## The scroll story

| # | Section | File | What happens |
|---|---|---|---|
| 00 | Loader | `components/chrome/Loader.tsx` | Grain, signature writes itself, slot-machine counter shows **real** progress (fonts, page, scene compile, environment), then the garage shutter rolls up. |
| 01 | Hero | `components/journey/*` | Red/orange northern lights, paint-on-water cursor, diamond rock with glitter. Name slides apart, rock grows and explodes into a sphere of shards. |
| 02 | Intro | `Journey.tsx` | Aurora burns away bottom → top; photo + story, words un-blur as you scroll. |
| 03 | Into the dark | `JourneyScene.tsx` | Black river, cursor becomes a warm light, camera flies to the glowing door; 3 mystery lines, each with an audio cue. Door floods the screen white. |
| 04 | Selected Work | `components/work/*` | White world. 7 cards on a 3D spiral staircase that rises with scroll. Raster Lines effect clears on hover. Click → card steps forward, panel shows services + case study link. |
| 05 | Skills | `components/Skills.tsx` | Statement + accordion. |
| 06 | Words | `components/Testimonials.tsx` | Background goes white → black, map hotspots pop, arcs draw from Dhaka, reviews fade in near their country. |
| 07 | Contact | `components/Contact.tsx` | Red circle grows to fill the screen, "Contact" slides in, two parallax images. |
| 08 | Footer | `components/footer/*` | Rock close-up made of plates. Hover pushes plates off (zero gravity), leaving pulls them home. ASCII render around the cursor. Name rises word by word. |

All scroll timings for 01–03 live in **`lib/timeline.ts`** — tune the feel there.
All copy, projects, skills and reviews live in **`lib/content.ts`**.

## Replace the placeholders

Search the project for `TODO` — every placeholder is marked.

| Placeholder | Where | How |
|---|---|---|
| Signature | `components/chrome/Loader.tsx` → `SIGNATURE` | Trace your signature in Illustrator/Figma as a single stroke path (no fills), viewBox `0 0 360 160`, paste the `d` strings. |
| Hero portrait | `Journey.tsx` → `.hero__portrait` | `<Image src="/images/portrait.jpg" fill alt="Nuhash Jobayed" />` |
| Intro photo | `Journey.tsx` → `.intro__photo` | same, `/images/photo.jpg` |
| Rock model | `JourneyScene.tsx` → `Rock` (`rockGeo`, `shardGeo`) and `footer/FooterRock.tsx` | Load your Blender glb with `GLTFLoader` (`three/examples/jsm/loaders/GLTFLoader.js`) and swap the geometries. Cell-fracture the rock in Blender and use those pieces for the shards. |
| Ambient audio | `public/audio/ambient.mp3` | Drop the file in; it's picked up automatically. Without it a generated drone plays. |
| Projects (7) | `lib/content.ts` → `projects` | Add `image: '/work/<slug>.jpg'`. Fill `year`, `country`. Keep exactly 7. |
| Reviews | `lib/content.ts` → `reviews` | Real Fiverr review lines only, one country each. |
| Contact images | `Contact.tsx` → `.contact__img` | Two renders of the rock fragments in brand colours. |
| Fonts | `app/layout.tsx` | "Jobayed" uses Instrument Serif italic as a stand-in for the 90s italic. Swap via `next/font/local`. |
| Domain, email, socials | `lib/content.ts` → `site` | |
| OG image | `public/og.jpg` (1200×630) | |
| Camera path | `JourneyScene.tsx` → `CAMERA_PATH` | Paste points exported from your camera path editor. |

## Performance

- One heavy effect per act. The rock's refraction ends when it explodes; the water cursor switches off when the dark arrives.
- The journey canvas stops rendering (`frameloop="never"`) and hides once you scroll past it. Work and footer canvases only run while on screen.
- Phones and weak machines (`lib/device.ts`) get fewer shards, a smaller fluid sim, lower DPR and a shorter journey.
- No WebGL2 or `prefers-reduced-motion` → static gradient hero, flat project grid, all text still readable.
- "Skip to work" in the nav jumps straight past the journey.

## SEO

- Every heading and paragraph is server-rendered HTML; canvases are decorative (`aria-hidden`).
- One `<h1>` (name + "Full-stack creative developer & 3D specialist"), keyword `<h2>` per section.
- Metadata, Open Graph, Twitter card, canonical, `sitemap.xml`, `robots.txt`, JSON-LD (Person, ProfessionalService, ItemList of work).
- A hidden crawlable list of the 7 projects and the reviews.

## Not done yet / next steps

- **WebGPU / TSL.** Shaders are GLSL (WebGL2) in `lib/shaders.ts`, each isolated so they port one by one to TSL. Then switch to `WebGPURenderer` (it falls back to WebGL2 by itself).
- Case study pages (`app/work/[slug]`) are stubs; their design is the next page to plan.
- This v1 was written without being able to run `npm install` (registry blocked in the build environment). The shaders were compiled and rendered in headless Chromium, and the TypeScript was syntax/type checked, but the full app has not been run yet — expect a round of tuning on first `npm run dev`.
