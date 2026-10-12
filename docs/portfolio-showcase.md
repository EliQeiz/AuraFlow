# Portfolio media and product links

The portfolio showcases recordings and design studies. It does not recreate the
products, bypass their authentication, or connect to their operational databases.

## Source assets

Approved source images and videos were supplied in `Clips/` and the current chat.
Optimised derivatives are in `public/media/portfolio/`. Recordings are H.264,
1440px wide, 24fps, silent, and fast-start enabled. Original recordings are not
included in the Vercel upload. Preserve them separately for future editing.

- Crestview: Screen Recording 2026-10-11 142754.mp4
- BuildProof: Screen Recording 2026-10-10 063521.mp4
- JollofVibes: Screen Recording 2026-10-09 170124.mp4
- EDMA: Screen Recording 2026-09-11 142816.mp4
- Minat: Screen Recording 2026-09-11 143120.mp4
- Akwaaba House and Everwell: the two supplied WhatsApp design images
- Industrial designs: the eight supplied mining, smelter and plant dashboard images
- Founder portrait: Data scientist in a modern home studio.png
- Flyers: the supplied development and research flyers, retained in full

Design studies are explicitly labelled as concepts; they are not live industrial
data or deployed hotel/pharmacy services. Recordings may show sample information;
review their visible content before publishing to a public audience.

## Product destinations

Owner-provided public URLs are defined in `src/lib/productLinks.ts`. Optional
deployment overrides (public URLs only, never secrets):

- VITE_CRESTVIEW_APP_URL
- VITE_BUILDPROOF_APP_URL
- VITE_EDMA_APP_URL
- VITE_MINAT_APP_URL
- VITE_JOLLOFVIBES_APP_URL

Crestview currently links to its public school website, not a guest demo.
BuildProof may require sign-in on its own platform. A JollofVibes public address
has not been supplied; its action opens an email walkthrough request instead.
Only HTTPS URLs without embedded credentials are rendered as product launches.

`/work` is the portfolio index. `/portfolio` redirects there. Legacy `/labs`
links remain compatible, while former mock demos are retired. AFC and the client
workspace remain accessible and their backends are unchanged.

## Motion and accessibility

The hero pauses when offscreen or the browser tab is hidden. Reduced-motion
preferences disable automatic slides. Media can be played, paused and expanded;
videos do not preload offscreen and all recordings remain silent until explicitly
controlled in the expanded player. Slideshow images are contained, not cropped.
