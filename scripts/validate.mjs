/* The gate every build runs through, in the hub's spirit: the checks are the
   claims this site is not allowed to break.

   Three of them are specific to a page that moved house:
   - no relative link may survive that only resolved on the hub (a bare
     /notes/ here is a 404, not a note);
   - the canonical, og:url and sitemap must name this domain, not the hub's
     /products/mixrack/ URL the page came from;
   - MixRack is unreleased, so no price, no "free", no buy, no pre-order.

   Run with `npm run lint`; scripts/build.mjs calls it before writing dist/. */

import { readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mixrack, HUB_WEBSITE, MASTERING_SUITE_WEBSITE, TEMPO_DELAY_WEBSITE, ZIO_WEBSITE } from '../src/catalog.mjs';
import { MEASUREMENT_ID, SITE_ORIGIN, STYLESHEET_FILE, renderMixRack, renderNotFound } from '../src/site.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(resolve(projectRoot, relative), 'utf8');
const bytes = (relative) => readFileSync(resolve(projectRoot, relative));

/* Hosts this site is allowed to link to. Anything else — including a
   preview deployment or a path that only exists on the hub — is a failure. */
const ALLOWED_HOSTS = new Set([
  'studiozio.vercel.app',
  'studioziomasteringsuite.vercel.app',
  'www.tempodelay.tech',
  'zio-audio.vercel.app',
  'studioziomixrack.vercel.app',
  'www.instagram.com',
  'www.youtube.com',
  'www.kvraudio.com'
]);

const FORBIDDEN = [
  [/localhost/i, 'a localhost URL'],
  [/\/Users\/[a-z]+\//i, 'a path from somebody\'s machine'],
  [/-git-[a-z0-9-]*\.vercel\.app/i, 'a preview deployment URL'],
  [/[a-z0-9-]+-studiozios-projects\.vercel\.app/i, 'an internal Vercel alias'],
  [/\bWindows\b/, 'a Windows claim (these plug-ins are macOS only)'],
  [/\btestimonial\b/i, 'a testimonial'],
  [/\baward-winning\b/i, 'an award claim'],
  [/\bbenchmark\b/i, 'a benchmark claim'],
  [/\bfree\b/i, 'a price claim (MixRack is unreleased)'],
  [/\$\s?\d/, 'a price'],
  [/\bpre-?order\b/i, 'a pre-order claim'],
  [/\bdownload\b/i, 'a download (MixRack has no build to download)']
];

const REQUIRED_FACTS = [
  'StudioZIO MixRack',
  'Audio Unit (AU)',
  'VST3',
  'AAX',
  'Standalone',
  'Coming Soon',
  'macOS'
];

function mainContent(page) {
  return page.split('<main id="main-content">')[1].split('</main>')[0];
}

function attribute(page, pattern) {
  const match = page.match(pattern);
  return match ? match[1] : null;
}

function checkDocument(name, page, { canonical = null } = {}) {
  const title = attribute(page, /<title>([^<]*)<\/title>/);
  if (!title) throw new Error(`${name}: no <title>`);
  if (title.length < 20 || title.length > 65) {
    throw new Error(`${name}: title is ${title.length} characters, wanted 20-65`);
  }

  const description = attribute(page, /<meta name="description" content="([^"]*)"/);
  if (!description) throw new Error(`${name}: no meta description`);
  if (description.length < 70 || description.length > 165) {
    throw new Error(`${name}: description is ${description.length} characters, wanted 70-165`);
  }

  const ogTitle = attribute(page, /<meta property="og:title" content="([^"]*)"/);
  if (ogTitle !== title) throw new Error(`${name}: og:title does not match <title>`);

  const canonicalHref = attribute(page, /<link rel="canonical" href="([^"]*)"/);
  const ogUrl = attribute(page, /<meta property="og:url" content="([^"]*)"/);
  if (canonical) {
    if (canonicalHref !== canonical) throw new Error(`${name}: canonical is ${canonicalHref}, wanted ${canonical}`);
    if (ogUrl !== canonicalHref) throw new Error(`${name}: og:url and canonical disagree`);
    if (!canonicalHref.startsWith(SITE_ORIGIN)) {
      throw new Error(`${name}: canonical points off this domain (${canonicalHref})`);
    }
  } else if (canonicalHref) {
    throw new Error(`${name}: this page must not declare a canonical`);
  }

  const headings = page.match(/<h1[\s>]/g) || [];
  if (headings.length !== 1) throw new Error(`${name}: found ${headings.length} <h1> elements, wanted exactly one`);

  if (/\sstyle="/.test(page)) throw new Error(`${name}: inline style attribute (the CSP forbids it)`);
  if (/<form[^>]*\saction=/i.test(page)) {
    throw new Error(`${name}: a form carries an action, but the CSP sets form-action 'none'`);
  }

  for (const [pattern, what] of FORBIDDEN) {
    if (pattern.test(page)) throw new Error(`${name}: contains ${what}`);
  }

  if (!page.includes(`/assets/${STYLESHEET_FILE}`)) throw new Error(`${name}: stylesheet is not fingerprinted`);
  if (!page.includes(MEASUREMENT_ID) && !page.includes('/assets/gtag.js')) {
    throw new Error(`${name}: the Google tag is missing`);
  }
  if (!page.includes('/assets/og/og-mixrack.png')) throw new Error(`${name}: no social image`);

  return { title, description, canonicalHref };
}

/* Every href, classified. Local means this site; anything else has to be one
   of the estate's real public addresses. */
function checkLinks(name, page, homeIds) {
  const hrefs = [...page.matchAll(/href="([^"]+)"/g)].map((match) => match[1]);
  const ids = new Set([...page.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  let local = 0;
  let external = 0;
  for (const href of hrefs) {
    if (href.startsWith('#')) {
      if (!ids.has(href.slice(1))) throw new Error(`${name}: in-page link ${href} has no target`);
      local += 1;
      continue;
    }
    /* A deep link into a section, if one is ever added, still has to point at
       a section that exists. */
    if (href.startsWith('/#')) {
      if (!homeIds.has(href.slice(2))) throw new Error(`${name}: section link ${href} has no target on the home page`);
      local += 1;
      continue;
    }
    if (href === '/' || href.startsWith('/assets/')) {
      local += 1;
      continue;
    }
    if (href.startsWith('/')) {
      throw new Error(`${name}: ${href} is a hub path that does not exist on this domain`);
    }
    if (!href.startsWith('https://')) throw new Error(`${name}: ${href} is not https`);
    const { host } = new URL(href);
    if (!ALLOWED_HOSTS.has(host)) throw new Error(`${name}: ${href} points at an unknown host`);
    external += 1;
  }
  if (local < 3) throw new Error(`${name}: the page's own links are missing`);
  if (external < 10) throw new Error(`${name}: estate links are missing from the header or footer`);
  return { total: hrefs.length, local, external };
}

export function validateSource() {
  if (mixrack.availability !== 'Coming soon') throw new Error('MixRack availability drift');
  if (mixrack.formats.join(' / ') !== 'Audio Unit (AU) / VST3 / AAX / Standalone') {
    throw new Error('MixRack planned formats drift — the hub lists AU, VST3, AAX and Standalone');
  }
  if (mixrack.compactFormats !== 'AU / VST3 / AAX / Standalone') throw new Error('Compact format list drift');

  const home = renderMixRack();
  const notFound = renderNotFound();

  checkDocument('index.html', home, { canonical: `${SITE_ORIGIN}/` });
  checkDocument('404.html', notFound);

  const body = mainContent(home);
  for (const fact of REQUIRED_FACTS) {
    if (!body.includes(fact)) throw new Error(`index.html: the page no longer states "${fact}"`);
  }

  /* The preview must stay click-to-load: no <video> element may exist until
     the visitor asks for one, or the page carries eight megabytes on sight. */
  const outsideNoscript = body.replace(/<noscript>[\s\S]*?<\/noscript>/g, '');
  if (/<video[\s>]/.test(outsideNoscript)) {
    throw new Error('index.html: a <video> element renders outside <noscript>');
  }
  if (!body.includes('data-video-src="/assets/media/mixrack-intro.mp4"')) {
    throw new Error('index.html: the click-to-load facade is missing');
  }
  if (!body.includes('preload="none"')) throw new Error('index.html: the <noscript> fallback must not preload');

  for (const script of ['notify.js', 'tester.js', 'video.js']) {
    if (!home.includes(`/assets/${script}`)) throw new Error(`index.html: ${script} is not loaded`);
    statSync(resolve(projectRoot, 'src', script));
  }

  const homeIds = new Set([...home.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  checkLinks('index.html', home, homeIds);
  checkLinks('404.html', notFound, homeIds);

  /* Each estate destination appears at least once, so no property becomes
     unreachable from this one. */
  for (const url of [`${HUB_WEBSITE}/`, `${HUB_WEBSITE}/products/`, `${HUB_WEBSITE}/notes/`, `${HUB_WEBSITE}/contact/`, `${HUB_WEBSITE}/press/`, MASTERING_SUITE_WEBSITE, TEMPO_DELAY_WEBSITE, ZIO_WEBSITE]) {
    if (!home.includes(`href="${url}"`)) throw new Error(`index.html: no link to ${url}`);
  }
  /* The estate's shared rule, owner-approved and applied on every site: the
     two product sites live in the header, and the footer carries no product
     links at all. */
  const header = home.split('</header>')[0];
  const footer = home.split('<footer class="site-footer">')[1];
  for (const url of [MASTERING_SUITE_WEBSITE, TEMPO_DELAY_WEBSITE]) {
    if (!header.includes(`<li><a href="${url}"`)) throw new Error(`index.html: ${url} is missing from the header`);
    if (footer.includes(`<li><a href="${url}"`)) throw new Error(`index.html: ${url} is back in the footer list`);
  }
  if (!header.includes('<li><a href="/" aria-current="page">MixRack</a></li>')) {
    throw new Error('index.html: MixRack is not the current entry in the header');
  }
  const footerEntries = (footer.match(/<li><a href=/g) || []).length;
  if (footerEntries !== 6) throw new Error(`index.html: the footer lists ${footerEntries} links, wanted 6`);

  /* The film and its poster are real files of a sane size: a poster that is
     secretly a placeholder, or an .mp4 that is an HTML error page, both
     deploy happily and both break the page. */
  const film = bytes('src/media/mixrack-intro.mp4');
  if (film.subarray(4, 8).toString('latin1') !== 'ftyp') throw new Error('mixrack-intro.mp4 is not an MP4');
  if (film.length < 1_000_000 || film.length > 12_000_000) {
    throw new Error(`mixrack-intro.mp4 is ${film.length} bytes, wanted 1-12 MB`);
  }
  const poster = bytes('src/media/mixrack-intro-poster.webp');
  if (poster.subarray(0, 4).toString('latin1') !== 'RIFF' || poster.subarray(8, 12).toString('latin1') !== 'WEBP') {
    throw new Error('mixrack-intro-poster.webp is not a WebP');
  }
  const social = bytes('src/og/og-mixrack.png');
  if (social.subarray(1, 4).toString('latin1') !== 'PNG') throw new Error('og-mixrack.png is not a PNG');
  if (social.readUInt32BE(16) !== 1200 || social.readUInt32BE(20) !== 630) {
    throw new Error('og-mixrack.png is not 1200x630');
  }

  /* Deployment configuration, checked here so a CSP edit cannot quietly
     switch the forms or the tag off. */
  const vercel = JSON.parse(read('vercel.json'));
  const csp = vercel.headers[0].headers.find((header) => header.key === 'Content-Security-Policy').value;
  for (const directive of ["default-src 'self'", 'https://formspree.io', 'https://www.googletagmanager.com', "form-action 'none'", "frame-ancestors 'none'"]) {
    if (!csp.includes(directive)) throw new Error(`vercel.json: the CSP no longer carries ${directive}`);
  }
  const legacy = (vercel.redirects || []).filter((redirect) => redirect.source.startsWith('/products/mixrack'));
  if (legacy.length !== 2 || legacy.some((redirect) => redirect.destination !== '/')) {
    throw new Error('vercel.json: the legacy /products/mixrack redirects are missing');
  }

  console.log('validate: ok');
}

if (import.meta.url === `file://${process.argv[1]}`) validateSource();
