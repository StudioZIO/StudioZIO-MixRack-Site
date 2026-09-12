/* Builds dist/ — the whole site is two HTML files, one stylesheet, the fonts,
   the film and five classic scripts. Same shape as the hub's build, minus the
   parts a one-page site does not have.

   The route list below is the single source for what is written, what the
   sitemap advertises and what each page declares as canonical, for the same
   reason as on the hub: a sitemap maintained separately is a sitemap that
   eventually advertises a URL that does not exist. */

import { cp, mkdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_ORIGIN, STYLESHEET_FILE, renderMixRack, renderNotFound } from '../src/site.mjs';
import { validateSource } from './validate.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outputRoot = resolve(projectRoot, 'dist');

validateSource();
await rm(outputRoot, { recursive: true, force: true });

const routes = [
  { file: 'index.html', url: '/', render: renderMixRack, indexable: true },
  /* A real output, never a search result. */
  { file: '404.html', url: null, render: renderNotFound, indexable: false }
];

const outputs = new Map(routes.map((route) => [route.file, route.render()]));

for (const [relativePath, content] of outputs) {
  const destination = resolve(outputRoot, relativePath);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, content, 'utf8');
}

await mkdir(resolve(outputRoot, 'assets'), { recursive: true });
// Written under the fingerprinted name the pages ask for, so markup and
// stylesheet deploy as one unit.
await cp(resolve(projectRoot, 'src/styles.css'), resolve(outputRoot, 'assets', STYLESHEET_FILE));
await cp(resolve(projectRoot, 'src/fonts'), resolve(outputRoot, 'assets/fonts'), { recursive: true });
await cp(resolve(projectRoot, 'src/favicon.svg'), resolve(outputRoot, 'assets/favicon.svg'));
// 1200x630 share card, cut from the film's own end card.
await cp(resolve(projectRoot, 'src/og'), resolve(outputRoot, 'assets/og'), { recursive: true });
// The Google tag's two files, same-origin because the CSP has no
// 'unsafe-inline'; then the conversion listener the whole estate shares.
await cp(resolve(projectRoot, 'src/gtag.js'), resolve(outputRoot, 'assets/gtag.js'));
await cp(resolve(projectRoot, 'src/consent.js'), resolve(outputRoot, 'assets/consent.js'));
await cp(resolve(projectRoot, 'src/events.js'), resolve(outputRoot, 'assets/events.js'));
// The header's search box hands its query to the hub's search page and does
// nothing else. Same-origin for the same CSP reason as the rest.
await cp(resolve(projectRoot, 'src/header-search.js'), resolve(outputRoot, 'assets/header-search.js'));
await cp(resolve(projectRoot, 'src/nav.js'), resolve(outputRoot, 'assets/nav.js'));
// The release-notice and tester-interest forms: a fetch to the one endpoint
// `connect-src` allows, because `form-action 'none'` refuses a native POST.
await cp(resolve(projectRoot, 'src/notify.js'), resolve(outputRoot, 'assets/notify.js'));
await cp(resolve(projectRoot, 'src/tester.js'), resolve(outputRoot, 'assets/tester.js'));
// The preview: builds the <video> only on click, so the page itself carries
// nothing heavier than the poster image.
await cp(resolve(projectRoot, 'src/video.js'), resolve(outputRoot, 'assets/video.js'));
await cp(resolve(projectRoot, 'src/media'), resolve(outputRoot, 'assets/media'), { recursive: true });

const indexableUrls = routes.filter((route) => route.indexable).map((route) => `${SITE_ORIGIN}${route.url}`);

await writeFile(
  resolve(outputRoot, 'sitemap.xml'),
  `<?xml version="1.0" encoding="UTF-8"?>\n`
    + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
    + indexableUrls.map((url) => `  <url>\n    <loc>${url}</loc>\n  </url>\n`).join('')
    + `</urlset>\n`,
  'utf8'
);

await writeFile(
  resolve(outputRoot, 'robots.txt'),
  `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`,
  'utf8'
);

console.log(`Built ${outputs.size} HTML pages and a ${indexableUrls.length}-URL sitemap into dist/`);
