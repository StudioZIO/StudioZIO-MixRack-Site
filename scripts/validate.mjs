/* The gate every build runs through, in the hub's spirit: the checks are the
   claims this site is not allowed to break.

   Three of them are specific to a page that moved house:
   - no relative link may survive that only resolved on the hub (a bare
     /notes/ here is a 404, not a note);
   - the canonical, og:url and sitemap must name this domain, not the hub's
     /products/mixrack/ URL the page came from;
   - MixRack is released but the hub names no price for it, so no price, no
     "free", no buy, no pre-order until the hub says one.

   Run with `npm run lint`; scripts/build.mjs calls it before writing dist/. */

import { readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mixrack, HUB_WEBSITE, MASTERING_SUITE_WEBSITE, TEMPO_DELAY_WEBSITE, ZIO_WEBSITE } from '../src/catalog.mjs';
import {
  EARLY_ACCESS_CONSENT_VERSION,
  EARLY_ACCESS_ENDPOINT,
  EARLY_ACCESS_SOURCE,
  MEASUREMENT_ID,
  SITE_ORIGIN,
  STYLESHEET_FILE,
  renderMixRack,
  renderNotFound
} from '../src/site.mjs';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const read = (relative) => readFileSync(resolve(projectRoot, relative), 'utf8');
const bytes = (relative) => readFileSync(resolve(projectRoot, relative));

/* Hosts this site is allowed to link to. Anything else — including a
   preview deployment or a path that only exists on the hub — is a failure. */
const ALLOWED_HOSTS = new Set([
  'www.studiozio.tech',
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
  [/\bfree\b/i, 'a price claim (the hub names no price for MixRack)'],
  [/\$\s?\d/, 'a price'],
  [/\bpre-?order\b/i, 'a pre-order claim'],
  /* The hub moved to its own domain; nothing rendered should still name the
     platform host it left behind. The measurement linker in gtag.js still
     lists it on purpose, which is why this checks pages and not assets. */
  [/studiozio\.vercel\.app/i, "the hub's old host (it is studiozio.tech now)"]
];

/* The release gate's two secrets -- the instant and the artefact URL -- live in
   the Vercel environment, never in anything shipped to a browser. This is the
   check that keeps it that way: the moment either one is pasted into a source
   file "just to test it", the build stops. */
/* A <script src> the build forgets to copy is a 404 that no local page reload
   reveals, because the page still renders. This catches it at build time. */
export function checkEveryScriptThePageLoadsExists() {
  const home = read('dist/index.html');
  const referenced = [...home.matchAll(/<script src="\/assets\/([^"]+)"/g)].map((m) => m[1]);
  for (const file of referenced) {
    try { read(`dist/assets/${file}`); }
    catch { throw new Error(`index.html loads /assets/${file}, which the build does not produce`); }
  }
  if (!referenced.includes('countdown.js')) {
    throw new Error('index.html no longer loads countdown.js, so the launch gate is inert');
  }
}

function checkReleaseGateHidesItsSecrets() {
  const files = [
    'api/release.js', 'src/countdown.js', 'src/site.mjs',
    'src/tester.js', 'src/video.js', 'src/early-access.js'
  ];
  for (const file of files) {
    let body;
    try { body = read(file); } catch { continue; }
    const leak = body.match(/https?:\/\/[^\s'"`]*\/(?:releases|download)\/[^\s'"`]*/i);
    if (leak) {
      throw new Error(`${file}: a release artefact URL is in client-reachable source (${leak[0]})`);
    }
    if (/StudioZIO-Mixrack-\d+\.\d+\.\d+\.pkg/i.test(body)) {
      throw new Error(`${file}: the package filename is in client-reachable source`);
    }
  }
}

const REQUIRED_FACTS = [
  'StudioZIO MixRack',
  'Audio Unit (AU)',
  'VST3',
  'AAX',
  'Standalone',
  /* The page's release state, asserted as text. It read "Coming Soon" until
     29 September 2026; the moment the gate opened, a page still saying that
     was the failure, so the required fact is now the true one. */
  'Available now',
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
  /* form-action names Buttondown and nothing else, so a native POST anywhere
     else is refused silently -- the form renders, validates, submits, and
     goes nowhere. The one form allowed an action is the Early Access box,
     posting to exactly Buttondown's embed endpoint; Buttondown accepts only a
     native POST there. Every other form posts by fetch and carries none. */
  for (const [, attrs] of page.matchAll(/<form([^>]*)>/gi)) {
    if (attrs.includes(`action="${EARLY_ACCESS_ENDPOINT}"`) && /\bmethod="post"/.test(attrs)) continue;
    if (/\saction=/i.test(attrs)) {
      throw new Error(`${name}: a form carries an action the CSP's form-action refuses: <form${attrs}>`);
    }
  }

  for (const [pattern, what] of FORBIDDEN) {
    if (pattern.test(page)) throw new Error(`${name}: contains ${what}`);
  }

  if (!page.includes(`/assets/${STYLESHEET_FILE}`)) throw new Error(`${name}: stylesheet is not fingerprinted`);
  /* Both halves of the Google tag: our consent-first initialiser and Google's
     own loader. The site launched with only the first and measured nothing —
     no page views, no events — because the loader is what fetches gtag.js. */
  for (const half of ['/assets/gtag.js', `https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}`]) {
    if (!page.includes(half)) throw new Error(`${name}: the Google tag is missing ${half}`);
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
  if (external < 4) throw new Error(`${name}: estate links are missing from the header or footer`);
  return { total: hrefs.length, local, external };
}

export function validateSource() {
  if (mixrack.availability !== 'Available now') throw new Error('MixRack availability drift');
  if (!/^\d+\.\d+\.\d+$/.test(mixrack.version)) throw new Error('MixRack version drift');
  if (mixrack.formats.join(' / ') !== 'Audio Unit (AU) / VST3 / AAX / Standalone') {
    throw new Error('MixRack format drift — the hub lists AU, VST3, AAX and Standalone');
  }
  if (mixrack.compactFormats !=='AU / VST3 / AAX / Standalone') throw new Error('Compact format list drift');

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
  /* The film is the page's one measured thing, and it reports under the name
     the Mastering Suite site already uses, so the estate has one video metric
     rather than two. The reporting lives in video.js, on the player's own play
     event — a click that never starts playing is not a view. */
  const player = read('src/video.js');
  for (const measured of ["'demo_video_play'", "product:", "clip:", "addEventListener('play'"]) {
    if (!player.includes(measured)) throw new Error(`video.js: the preview is not measured (${measured})`);
  }
  if (!home.includes('/assets/events.js')) throw new Error('index.html: the conversion listener is not loaded');

  /* The header's search box, twice on every page -- once in the row, once in
     the compact menu -- and the script that carries what is typed to the
     hub's search page. The estate's index lives there, not here, so a box
     that shipped without its destination would look like search and do
     nothing. */
  for (const page of [home, notFound]) {
    const boxes = (page.match(/class="field header-search-field"/g) ?? []).length;
    if (boxes !== 2) throw new Error(`the header search box should appear twice per page, found ${boxes}`);
    if (!page.includes('/assets/header-search.js')) {
      throw new Error('the header search box ships without header-search.js');
    }
  }
  const headerSearchScript = read('src/header-search.js');
  if (!headerSearchScript.includes(`${HUB_WEBSITE}/search/`)) {
    throw new Error('header-search.js does not point at the hub\'s search page');
  }
  if (!body.includes('preload="none"')) throw new Error('index.html: the <noscript> fallback must not preload');

  /* The Early Access box under the download: exactly one, after the download
     panel rather than in front of it (the download needs no email), tagged
     with this site as its source, consent required and never pre-ticked,
     the hub's privacy policy linked, its script loaded, and the same consent
     version the hub records. Not on the 404. */
  const eaOpen = '<form class="panel-float early-access-form';
  const eaForms = (body.match(new RegExp(eaOpen, 'g')) || []).length;
  if (eaForms !== 1) throw new Error(`index.html: ${eaForms} Early Access forms, wanted exactly one`);
  if (mainContent(notFound).includes(eaOpen)) throw new Error('404.html: the Early Access form belongs under the download');
  const gateAt = body.indexOf('id="release-gate"');
  const eaAt = body.indexOf(eaOpen);
  if (gateAt < 0 || body.lastIndexOf('data-release-link') > eaAt) {
    throw new Error('index.html: the Early Access box must sit under the download panel, not above it');
  }
  /* Directly under: nothing but the gate's own <noscript> note between them,
     so no section, heading or other form can end up in the way. */
  const between = body.slice(body.indexOf('</div>', body.lastIndexOf('launch-status')) + '</div>'.length, eaAt);
  if (between.replace(/<noscript>[\s\S]*?<\/noscript>/g, '').trim() !== '') {
    throw new Error('index.html: the Early Access box must follow the download panel directly');
  }
  const eaBox = body.slice(eaAt, body.indexOf('</form>', eaAt));
  if (!eaBox.includes(`action="${EARLY_ACCESS_ENDPOINT}" method="post"`)) {
    throw new Error('index.html: the Early Access box must post natively to Buttondown');
  }
  if (EARLY_ACCESS_SOURCE !== 'studioziomixrack.vercel.app/') throw new Error(`Early Access source drift: ${EARLY_ACCESS_SOURCE}`);
  if (!eaBox.includes(`name="metadata__source" value="${EARLY_ACCESS_SOURCE}"`)) {
    throw new Error('index.html: the Early Access box must record its source');
  }
  if (EARLY_ACCESS_CONSENT_VERSION !== '2026-09-21'
    || !eaBox.includes(`name="metadata__consent_version" value="${EARLY_ACCESS_CONSENT_VERSION}"`)) {
    throw new Error('index.html: the Early Access consent version must be the hub\'s, 2026-09-21');
  }
  if (!eaBox.includes('I want to receive StudioZIO Early Access emails about product updates, release news and testing opportunities. I can unsubscribe at any time.')) {
    throw new Error('index.html: the Early Access consent wording drifted from the hub\'s');
  }
  if (/<input[^>]*type="checkbox"[^>]*\bchecked\b/.test(eaBox)) throw new Error('index.html: Early Access consent must not be pre-ticked');
  if (!/<input[^>]*id="ea-consent"[^>]*\brequired\b/.test(eaBox)) throw new Error('index.html: Early Access consent must be required');
  if (!/<input[^>]*name="email"[^>]*\brequired\b/.test(eaBox)) throw new Error('index.html: the Early Access email must be required');
  if (!eaBox.includes(`href="${HUB_WEBSITE}/privacy/"`)) throw new Error('index.html: the Early Access box must link the privacy policy');
  if (!eaBox.includes('class="form-status"')) throw new Error('index.html: the Early Access box has no status line');
  if (!home.includes('src="/assets/early-access.js"')) throw new Error('index.html: the Early Access form ships without its script');
  if (!read('src/early-access.js').includes("'early_access_submit'")) throw new Error('early-access.js: the sign-up is not measured');
  for (const [file, text] of [['index.html', home], ['404.html', notFound], ['src/early-access.js', read('src/early-access.js')]]) {
    if (/sonavyr/i.test(text)) throw new Error(`${file}: names the unreleased product`);
  }

  for (const script of ['tester.js', 'video.js', 'early-access.js']) {
    if (!home.includes(`/assets/${script}`)) throw new Error(`index.html: ${script} is not loaded`);
    statSync(resolve(projectRoot, 'src', script));
  }

  const homeIds = new Set([...home.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]));
  checkLinks('index.html', home, homeIds);
  checkLinks('404.html', notFound, homeIds);

  /* Each estate destination appears at least once, so no property becomes
     unreachable from this one. The other two product sites left the header
     with this one's own entry: they are reached from the hub's catalogue now,
     which this page links, so they are not expected here. */
  for (const url of [`${HUB_WEBSITE}/`, `${HUB_WEBSITE}/products/`, `${HUB_WEBSITE}/notes/`, `${HUB_WEBSITE}/contact/`, `${HUB_WEBSITE}/press/`, ZIO_WEBSITE]) {
    if (!home.includes(`href="${url}"`)) throw new Error(`index.html: no link to ${url}`);
  }
  /* The estate's shared rule, owner-approved and applied on every site: no
     product link in the header or the footer. The three product sites are
     reached from the hub's catalogue, and the header's search box finds them
     by name; a header that repeated them could not also hold the box on one
     line. The five entries below are the same on all four sites. */
  const header = home.split('</header>')[0];
  const footer = home.split('<footer class="site-footer">')[1];
  for (const url of [MASTERING_SUITE_WEBSITE, TEMPO_DELAY_WEBSITE]) {
    if (header.includes(`<li><a href="${url}"`)) throw new Error(`index.html: ${url} is back in the header list`);
    if (footer.includes(`<li><a href="${url}"`)) throw new Error(`index.html: ${url} is back in the footer list`);
  }
  const headerEntries = (header.match(/<li><a href=/g) || []).length;
  if (headerEntries !== 10) throw new Error(`index.html: the header lists ${headerEntries} links across its two menus, wanted 10`);
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
  for (const directive of ["default-src 'self'", 'https://formspree.io', 'https://www.googletagmanager.com', "frame-ancestors 'none'"]) {
    if (!csp.includes(directive)) throw new Error(`vercel.json: the CSP no longer carries ${directive}`);
  }
  /* form-action is Buttondown and only Buttondown: the Early Access box is
     the one native POST on the site. Anything wider lets a stray form post
     somewhere nobody chose; 'none' would refuse the sign-up silently. */
  const formAction = (csp.split(';').map((part) => part.trim()).find((part) => part.startsWith('form-action ')) ?? '').slice('form-action '.length);
  if (formAction !== 'https://buttondown.com') {
    throw new Error(`vercel.json: CSP form-action must be https://buttondown.com, it is ${formAction || 'missing'}`);
  }
  if (!EARLY_ACCESS_ENDPOINT.startsWith('https://buttondown.com/api/emails/embed-subscribe/')) {
    throw new Error(`Early Access endpoint is not Buttondown's embed endpoint: ${EARLY_ACCESS_ENDPOINT}`);
  }
  const cspRules = vercel.headers.filter((entry) => entry.headers.some((header) => header.key === 'Content-Security-Policy'));
  if (cspRules.length !== 1) throw new Error('vercel.json: one Content-Security-Policy rule, or the two can disagree on form-action');
  const legacy = (vercel.redirects || []).filter((redirect) => redirect.source.startsWith('/products/mixrack'));
  if (legacy.length !== 2 || legacy.some((redirect) => redirect.destination !== '/')) {
    throw new Error('vercel.json: the legacy /products/mixrack redirects are missing');
  }

  checkReleaseGateHidesItsSecrets();

  console.log('validate: ok');
}

if (import.meta.url === `file://${process.argv[1]}`) validateSource();
