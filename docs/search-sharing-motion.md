# Search, sharing, and motion

The eight public pages have static titles, short descriptions, canonical URLs, Open Graph metadata, and large-image social cards. The homepage and About use the original wordmark on the site's dotted ground; project cards use the existing hero photographs, contained without cropping. All cards are 1200 × 630 JPEGs under 210 KB. Crawlers can read these tags without executing JavaScript or accessing Supabase.

`data/site-meta.json` is the source for these descriptions and card selections. It contains a small snapshot of the current public About copy for initial HTML. The normal live CMS loader still controls displayed content after load. Project routes also contain a basic title, description, contact link, and index for visitors without JavaScript. Home index entries are real links.

## Updating metadata

1. Edit the corresponding entry in `data/site-meta.json`. Keep descriptions to one brief sentence. Change `sourceImage` and `imageAlt` when replacing a hero selected for sharing.
2. If changing share artwork, run `node scripts/build-share-images.cjs` with Sharp available. Otherwise retain the committed JPEGs.
3. Run `node scripts/build-routes.mjs`, followed by `node scripts/build-routes.mjs --check`.
4. Commit the metadata and generated routes together, and publish through the normal pull request/merge workflow.

CMS edits take effect on the live pages immediately. **Search/share metadata is published with site code, not automatically on CMS Save.** A future CMS publishing integration must rebuild static HTML; changing browser metadata alone would not update most link-preview crawlers. Platforms may cache old previews after publishing.

`sitemap.xml` lists only the eight canonical public URLs. `robots.txt` advertises the sitemap. The CMS, Studio, and legacy project template are marked `noindex`; generated project routes are indexable. These files aid discovery but do not guarantee indexing or a particular search snippet. See [Google's JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

## Reduced motion

The current system preference is shared through `assets/mm-motion.js`. It suppresses logo/spawn introductions, ambient field motion, cursor magnetism, smooth section scrolling, and automatic shell changes. The canvas scenes draw on changes instead of continuously under reduced motion. Manual navigation, minimap hover, shell selection/dragging, and resizing remain available. Hidden or offscreen scenes skip rendering.

Videos that would autoplay start paused with controls. Existing animated GIFs use a local first frame with an explicit Play/Pause button; changing the preference updates these in place. GIFs added later without a still show an “Animation paused” placeholder until opted into. Add a URL-to-file entry to `assets/mm-stills.js`, then run `node scripts/build-share-images.cjs --stills` to generate a real first frame. This does not replace or compress the original CMS media.

## Checks

With Playwright, Chrome, and Sharp available:

```
node scripts/build-routes.mjs --check
node tests/seo-motion-browser.cjs
node tests/analytics-browser.cjs
node tests/motion.cjs
```

`tests/site-browser.cjs` also verifies the existing layout and entrance flow against a local static server. Browser checks block production Analytics and CMS requests.
