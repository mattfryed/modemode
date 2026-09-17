# Public routes and page entrances

Public links now use `/`, `/about`, and a project slug such as `/eyeknow-manor`.
The route helper derives the deployment prefix from its own script URL, so the
same files work on a custom domain and at `jalulia.github.io/modemode/`.

Each slug has a real static `index.html`, so GitHub Pages can serve direct visits
and refreshes with a successful response. A static host may first redirect to
the directory's trailing slash; the page canonicalizes the displayed address
without the slash. Old `project.html?p=…`, `about.html`, and `index.html` links
continue to work and normalize on arrival. Editor URLs retain their parameters.

Edit the source templates `index.html`, `project.html`, and `about.html`. After
changing a project/About template or adding a bundled project JSON document:

```sh
node scripts/build-routes.mjs
node scripts/build-routes.mjs --check
node tests/motion.cjs
```

Commit the generated route directories with the source changes. No hosting
settings or deployment build change is required. New CMS project slugs must also
have a bundled `content/<slug>.json` and a generated route before linking to them.
If removing a project, remove its generated directory along with its fallback.

The homepage lays out and paints its ground/dots before awaiting the roster.
The public inspector starts hidden, axis labels start hidden until positioned,
and the logo starts hidden until sized. The optional logo entrance starts after
240ms and lasts 1100ms; the metaball entrance starts no earlier than 560ms and
lasts 1600ms, including a small radius overshoot. Each metaball grows at its own
authored center, with its existing drift, rather than moving out from the cluster
origin. The roster has a 1800ms timeout
before existing local/bundled fallback, so an unavailable service cannot stall
the page indefinitely. Reduced motion skips both entrances.

`assets/mode-mode-logo-growth.png` is a centerline distance-field asset derived
from the existing SVG. It stores a distance-to-medial-axis threshold normalized
by the distance to the outline, with the original alpha silhouette retained.
Only stroke thickness grows; the lockup is never scaled from a point. The final
frame hands off to the original SVG. To regenerate after a logo change, run
`node scripts/generate-logo-sdf.cjs` with `sharp` available. Sharp is only an
asset-authoring dependency; browsers and ordinary route generation do not use it.

About-page body motion is calculated once per frame in `mm-about-motion.js`.
Each body has a deterministic transition window, curved path, and per-state
local position. Existing drift, spread, size, palette, and shell response controls
remain independent. Shell deformation still follows the smooth cluster drivers.
Position and radius data reuse the existing 96 vec4 uniform slots, avoiding any
increase in fragment uniform requirements or per-pixel motion calculations.

## Browser validation

Serve the repository root over HTTP and run `node tests/site-browser.cjs URL`
with Playwright and Chrome available. The test deliberately makes the content
service unavailable and uses bundled documents, without writing live CMS data.
It covers slow startup, public/editor separation, all six direct project routes
and reloads, old links, home navigation, the 1440px cap, sticky-title spacing,
About shader compilation and a transition, reduced motion, and mobile overflow.

The project layout is capped at 1440px on wide displays.
The pinned title now has 24px above and below, measured from the actual logo
bottom and title height, including after fonts load.
