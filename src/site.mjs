/* The dedicated StudioZIO MixRack site.

   This is the hub's /products/mixrack/ page, moved to its own domain. The
   shell (header, footer, typography, tokens, chips, panels) is the hub's
   shell — same markup, same stylesheet, same fonts — so the two properties
   read as one estate rather than two brands. Three things are deliberately
   different, and only three:

   1. The product page is the site root, not a route four levels down.
   2. Every hub-relative link is an absolute hub URL, because a relative
      /notes/ on this domain is a 404, not a note.
   3. The canonical, og:url and sitemap name this domain. The hub keeps its
      own page; this one is not a second copy claiming the same address.

   Nothing about the product itself is restated here that the hub did not
   already state: no version, no date, no price, no download. */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  HUB_WEBSITE,
  MASTERING_SUITE_WEBSITE,
  SITE_ORIGIN,
  TEMPO_DELAY_WEBSITE,
  ZIO_WEBSITE,
  mixrack
} from './catalog.mjs';

const here = dirname(fileURLToPath(import.meta.url));

/* Fingerprinted exactly as on the hub: the stylesheet is immutable-cached for
   a year, so its name has to change when its bytes do. */
export const STYLESHEET_FILE = `styles-${createHash('sha256')
  .update(readFileSync(resolve(here, 'styles.css')))
  .digest('hex')
  .slice(0, 10)}.css`;
const stylesheet = `/assets/${STYLESHEET_FILE}`;

export { SITE_ORIGIN };

const INSTAGRAM_URL = 'https://www.instagram.com/studio_zio_plugin/';
const YOUTUBE_URL = 'https://www.youtube.com/@StudioZIO-plugins';
const KVR_MASTERING_URL =
  'https://www.kvraudio.com/product/studiozio-mastering-suite-by-studiozio';
const KVR_TEMPO_URL =
  'https://www.kvraudio.com/product/studiozio-tempo-delay-by-studiozio';

/* Same tag, same files, same order as the rest of the estate. gtag.js runs
   first and synchronously, so the Consent Mode defaults are set before the
   loader that follows it can measure anything; the CSP has no 'unsafe-inline',
   which is why our half of Google's snippet is a file rather than a block.
   The loader line is Google's own and has to be in the head verbatim — this
   site shipped without it at first and measured precisely nothing, so the
   validator now asserts it. */
const MEASUREMENT_ID = 'G-VL8Z542XMP';
const analytics = `<script src="/assets/gtag.js"></script>
  <script async src="https://www.googletagmanager.com/gtag/js?id=${MEASUREMENT_ID}"></script>
  <script src="/assets/consent.js" defer></script>
  <script src="/assets/events.js" defer></script>
  <script src="/assets/header-search.js" defer></script>`;

export { MEASUREMENT_ID };

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatList(items) {
  const list = [...items];
  if (list.length <= 1) return escapeHtml(list.join(''));
  const last = list.pop();
  return `${escapeHtml(list.join(', '))} and ${escapeHtml(last)}`;
}

function logo({ href = '/', suffix = '', link = true } = {}) {
  const label = `StudioZIO${suffix ? ` ${suffix}` : ''}`;
  const open = link
    ? `<a class="logo" href="${escapeHtml(href)}" aria-label="${escapeHtml(label)}">`
    : '<span class="logo">';
  const close = link ? '</a>' : '</span>';
  return `${open}
      <span class="logo-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="M2 12h3l2.6-7.2L11 19l3-9 2.4 4.4H22" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </span>
      <span class="logo-word">Studio<b>ZIO</b></span>
      ${suffix ? ` <span class="logo-suffix">${escapeHtml(suffix)}</span>` : ''}
    ${close}`;
}

function instagramLink() {
  return `<a class="social-link" href="${INSTAGRAM_URL}" target="_blank" rel="noopener noreferrer" aria-label="Instagram — studio_zio_plugin">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.8"/>
          <circle cx="17.4" cy="6.7" r="1.1" fill="currentColor"/>
        </svg>
      </a>`;
}

function youtubeLink() {
  return `<a class="social-link" href="${YOUTUBE_URL}" target="_blank" rel="noopener noreferrer" aria-label="YouTube — @StudioZIO-plugins">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <rect x="2.5" y="5.5" width="19" height="13" rx="3.5" stroke="currentColor" stroke-width="1.8"/>
          <path d="M10.5 9.3v5.4l4.7-2.7-4.7-2.7z" fill="currentColor"/>
        </svg>
      </a>`;
}

function kvrLink(url, label) {
  return `<a class="kvr-link" href="${url}" target="_blank" rel="noopener noreferrer" aria-label="${label} — KVR Audio" title="${label} — KVR Audio">
        <svg viewBox="0 0 42 22" aria-hidden="true">
          <text x="1" y="16" fill="currentColor" font-family="monospace" font-size="13" font-weight="700" letter-spacing="1">KVR</text>
        </svg>
      </a>`;
}

/* The estate's navigation, unchanged. These are the hub's own header and
   footer lists, in the hub's own order, and the same two lists ship on every
   StudioZIO site. Two owner-approved edits apply everywhere, not just here:
   MixRack joins the header beside the other two products, and the footer
   carries no product links at all, so it has room to breathe.

   The only thing this site does differently is spelling: the entry for its
   own page is "/", and every other entry is written out as an absolute URL,
   because a relative /notes/ on this domain is a 404 rather than a note. */
/* The three product sites left this row. Eight destinations and the search
   box did not fit on one line, and the owner's call was that the products
   belong behind Products, where the catalogue describes them, rather than
   repeated in every header. Anyone who knows the product name types it in the
   box. The same five entries ship on all four StudioZIO sites. */
const HEADER_NAVIGATION = [
  ['Hub', `${HUB_WEBSITE}/`, 'hub'],
  ['Products', `${HUB_WEBSITE}/products/`, 'products'],
  ['Notes', `${HUB_WEBSITE}/notes/`, 'notes'],
  ['Community', `${HUB_WEBSITE}/community/`, 'community'],
  ['Contact', `${HUB_WEBSITE}/contact/`, 'contact']
];

const FOOTER_LINKS = [
  ['Hub', `${HUB_WEBSITE}/`, 'hub'],
  ['Products', `${HUB_WEBSITE}/products/`, 'products'],
  ['Notes', `${HUB_WEBSITE}/notes/`, 'notes'],
  ['Contact', `${HUB_WEBSITE}/contact/`, 'contact'],
  ['Press kit', `${HUB_WEBSITE}/press/`, 'press'],
  ['ZIO', ZIO_WEBSITE, 'zio']
];

/* The header carries the search box itself rather than a link to it. The
   index lives on the hub and covers all four properties, so the box here
   hands its query to www.studiozio.tech/search/ -- the same box, in the
   same place, on every StudioZIO site. Two copies ship: one in the row, one
   inside the compact menu, because the row is put away on a phone and the
   box should not be. Enter is handled by header-search.js; there is no
   <form> because form-action is 'none'. */
function headerSearch(variant) {
  return `<div class="header-search${variant ? ` header-search--${variant}` : ''}">
          <input class="field header-search-field" type="search" name="q" aria-label="Search StudioZIO" placeholder="Search" autocomplete="off" autocapitalize="off" spellcheck="false">
        </div>`;
}

function navList(current, entries) {
  return entries.map(
    ([label, href, id]) =>
      `<li><a href="${escapeHtml(href)}"${
        id && current === id ? ' aria-current="page"' : ''
      }>${escapeHtml(label)}</a></li>`
  ).join('');
}

function chip(label, tone = '') {
  return `<span class="chip${tone ? ` chip--${tone}` : ''}">${
    tone === 'flag' || tone === 'destructive' || tone === 'closed'
      ? '<span class="dot" aria-hidden="true"></span>'
      : ''
  }${escapeHtml(label)}</span>`;
}

const SOCIAL_IMAGE = '/assets/og/og-mixrack.png';
const SOCIAL_IMAGE_ALT = 'StudioZIO MixRack — coming soon';

/* Structured data ships as a data island, never as executable code: the CSP
   has no 'unsafe-inline' for scripts, and a ld+json block is not executed. */
function jsonLdBlock(graph) {
  const serialised = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);
  if (serialised.includes('</')) throw new Error('JSON-LD payload would break out of its script element');
  return `<script type="application/ld+json">\n${serialised}\n  </script>`;
}

/* The Organization is defined on the hub. This site references that same @id
   rather than declaring a second, competing definition of the same company. */
const ORGANIZATION_ID = `${HUB_WEBSITE}/#organization`;

const mixrackJsonLd = () =>
  jsonLdBlock([
    {
      '@type': 'Organization',
      '@id': ORGANIZATION_ID,
      name: 'StudioZIO',
      url: `${HUB_WEBSITE}/`,
      logo: `${HUB_WEBSITE}/assets/og/og-studiozio.png`
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_ORIGIN}/#website`,
      url: `${SITE_ORIGIN}/`,
      name: 'StudioZIO MixRack',
      inLanguage: 'en',
      publisher: { '@id': ORGANIZATION_ID }
    },
    {
      /* No offers, no price, no release date, no download: MixRack has none
         of those yet, and structured data that claims them is a claim the
         product cannot honour. */
      '@type': 'SoftwareApplication',
      '@id': `${SITE_ORIGIN}/#mixrack`,
      name: mixrack.name,
      url: `${SITE_ORIGIN}/`,
      description: `${mixrack.description} ${mixrack.availability}.`,
      operatingSystem: mixrack.platform,
      applicationCategory: 'MultimediaApplication',
      publisher: { '@id': ORGANIZATION_ID }
    }
  ]);

function shell({ title, description, canonical, current, content, scripts = '', jsonLd = '' }) {
  const image = `${SITE_ORIGIN}${SOCIAL_IMAGE}`;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="theme-color" content="#0b1013">
  <meta name="description" content="${escapeHtml(description)}">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="StudioZIO">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  ${canonical ? `<meta property="og:url" content="${escapeHtml(canonical)}">
  <link rel="canonical" href="${escapeHtml(canonical)}">` : ''}
  <meta property="og:image" content="${escapeHtml(image)}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${escapeHtml(SOCIAL_IMAGE_ALT)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${escapeHtml(image)}">
  <meta name="twitter:image:alt" content="${escapeHtml(SOCIAL_IMAGE_ALT)}">
  <title>${escapeHtml(title)}</title>
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="${stylesheet}">
  <link rel="preload" href="/assets/fonts/space-grotesk-700.woff2" as="font" type="font/woff2" crossorigin>
  ${analytics}
  ${jsonLd}
  ${scripts}
</head>
<body>
  <a class="skip-link" href="#main-content">Skip to content</a>
  <header class="site-header">
    <div class="shell bar">
      ${logo()}
      <nav class="nav-links" aria-label="Primary">
        <ul>${navList(current, HEADER_NAVIGATION)}</ul>
      </nav>
      ${headerSearch('bar')}
      <details class="nav-compact">
        <summary aria-label="Menu" aria-controls="compact-menu"><span class="open" aria-hidden="true">≡</span><span class="shut" aria-hidden="true">×</span></summary>
        <nav class="panel" id="compact-menu" aria-label="Primary">
          ${headerSearch('panel')}
          <ul>${navList(current, HEADER_NAVIGATION)}</ul>
        </nav>
      </details>
    </div>
  </header>
  <main id="main-content">${content}</main>
  <footer class="site-footer">
    <div class="shell inner">
      <div class="footer-brand">
        ${logo()}
        <div class="footer-tools">
          ${youtubeLink()}
          ${instagramLink()}
          ${kvrLink(KVR_MASTERING_URL, 'Mastering Suite')}
          ${kvrLink(KVR_TEMPO_URL, 'Tempo Delay')}
        </div>
      </div>
      <nav aria-label="Footer">
        <ul>${navList(current, FOOTER_LINKS)}</ul>
      </nav>
      <p class="copy">© 2026</p>
    </div>
  </footer>
</body>
</html>`;
}

/* The page. Section for section, this is the hub's renderMixRack: hero,
   preview film, planned formats, release notice, testing interest. The copy
   is the hub's copy. The only edits are the ones the move forces — the
   "All StudioZIO products" link is now an absolute hub URL, and each section
   carries the id its own header link points at. */
export function renderMixRack() {
  return shell({
    title: 'StudioZIO MixRack — Coming Soon',
    description:
      'StudioZIO MixRack is a modular mixing environment for macOS, coming soon from StudioZIO in AU, VST3, AAX and Standalone formats.',
    canonical: `${SITE_ORIGIN}/`,
    current: 'mixrack',
    jsonLd: mixrackJsonLd(),
    scripts: '<script src="/assets/notify.js" defer></script><script src="/assets/tester.js" defer></script><script src="/assets/video.js" defer></script>',
    content: `<section class="hero tech-grid">
      <div class="shell">
        <div class="rise">
          <p class="eyebrow">StudioZIO software · Coming Soon</p>
          <h1>StudioZIO MixRack</h1>
          <p><a href="${HUB_WEBSITE}/products/">All StudioZIO products</a></p>
          <p class="lede">${escapeHtml(mixrack.description)} Build a signal chain from StudioZIO processing modules and shape a mix from one unified interface.</p>
          <div class="chip-row mt-lg">
            ${chip(mixrack.manufacturer)}${chip(mixrack.platform)}${chip('Coming Soon', 'flag')}
          </div>
        </div>
      </div>
    </section>
    <!-- The film is the one measured thing on this page. video.js reports the
         player's own play event as demo_video_play — the name the Mastering
         Suite site already uses for its demo clip, so one metric covers the
         estate instead of two that have to be added up. -->
    <section class="section" id="preview" aria-labelledby="mixrack-video-title">
      <div class="shell">
        <div class="section-head">
          <p class="eyebrow">Preview</p>
          <h2 id="mixrack-video-title">A look inside the rack</h2>
          <p class="lede">Two minutes with the MixRack window as it stands in development: the eight modules, the module browser, reordering, factory presets, A/B and the output meters.</p>
        </div>
        <figure class="panel-float video-card">
          <button class="video-facade" type="button" data-video-src="/assets/media/mixrack-intro.mp4"
            data-video-label="StudioZIO MixRack introduction, two minutes, music only">
            <img class="video-poster" src="/assets/media/mixrack-intro-poster.webp" width="1920" height="1080"
              alt="StudioZIO MixRack, coming soon" loading="lazy" decoding="async">
            <span class="video-play"><span class="video-play-icon" aria-hidden="true"></span><span class="video-play-label">Play the preview · </span>1:58</span>
          </button>
          <noscript>
            <video class="video-player" controls preload="none" playsinline width="1920" height="1080"
              poster="/assets/media/mixrack-intro-poster.webp">
              <source src="/assets/media/mixrack-intro.mp4" type="video/mp4">
            </video>
          </noscript>
          <figcaption class="video-caption">The film loads only when you press play. Interface shown from the development build. Music: “Enigma”.</figcaption>
        </figure>
      </div>
    </section>
    <section class="section" id="formats" aria-labelledby="mixrack-spec-title">
      <div class="shell">
        <div class="section-head">
          <p class="eyebrow">Planned formats</p>
          <h2 id="mixrack-spec-title">Coming Soon</h2>
          <p class="lede">StudioZIO MixRack is in development. Release details will be published when they are available.</p>
        </div>
        <dl class="spec-grid">
          <div><dt>Manufacturer</dt><dd>${escapeHtml(mixrack.manufacturer)}</dd></div>
          <div><dt>Platform</dt><dd>${escapeHtml(mixrack.platform)}</dd></div>
          <div><dt>Status</dt><dd>Coming Soon</dd></div>
          <div><dt>Formats</dt><dd>${formatList(mixrack.formats)}</dd></div>
        </dl>
      </div>
    </section>
    <section class="section" id="release-notice" aria-labelledby="mixrack-notify-title">
      <div class="shell">
        <div class="section-head">
          <p class="eyebrow">Release notice</p>
          <h2 id="mixrack-notify-title">Hear about it once</h2>
          <p class="lede">StudioZIO MixRack has no release date yet. Leave an address and it gets used exactly once — on the day it ships.</p>
        </div>
        <form class="panel-float notify-form" novalidate="false">
          <div class="form-hp" aria-hidden="true">
            <label for="notify-company">Company</label>
            <input id="notify-company" name="company" type="text" tabindex="-1" autocomplete="off">
          </div>

          <div class="form-row">
            <label class="form-label" for="notify-email">Email <span class="req">required</span></label>
            <input id="notify-email" name="email" class="field" type="email" required autocomplete="email">
            <p class="form-hint">One message, when StudioZIO MixRack is released. Nothing else is sent to it, and it is not used for anything else.</p>
          </div>

          <p class="form-status" role="status" aria-live="polite"></p>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Notify me at release</button>
          </div>
        </form>

        <noscript>
          <p class="form-note">This form needs JavaScript to send. With it switched off nothing is submitted, so please enable it for this page rather than assuming an address was recorded.</p>
        </noscript>
      </div>
    </section>
    <section class="section" id="testing" aria-labelledby="mixrack-tester-title">
      <div class="shell">
        <div class="section-head">
          <p class="eyebrow">Testing interest</p>
          <h2 id="mixrack-tester-title">Interested in testing MixRack?</h2>
          <p class="lede">StudioZIO MixRack is still in active development and no test build is being distributed yet. A small tester pool is being assembled, and selected people may be contacted for a future beta or release-candidate build. Submitting interest does not guarantee selection, and the details below are used only to evaluate and contact potential testers.</p>
        </div>
        <form class="panel-float tester-form" novalidate="false">
          <div class="form-hp" aria-hidden="true">
            <label for="tester-company">Company</label>
            <input id="tester-company" name="company" type="text" tabindex="-1" autocomplete="off">
          </div>

          <div class="form-grid form-grid--2">
            <div class="form-row">
              <label class="form-label" for="tester-email">Email <span class="req">required</span></label>
              <input id="tester-email" name="email" class="field" type="email" required autocomplete="email">
            </div>
            <div class="form-row">
              <label class="form-label" for="tester-daw">Primary DAW <span class="req">required</span></label>
              <input id="tester-daw" name="daw" class="field field-mono" type="text" required placeholder="Logic Pro">
            </div>
          </div>

          <div class="form-grid form-grid--2">
            <div class="form-row">
              <label class="form-label" for="tester-macos">macOS version <span class="req">required</span></label>
              <input id="tester-macos" name="macos_version" class="field field-mono" type="text" required placeholder="macOS 14">
            </div>
            <div class="form-row">
              <label class="form-label" for="tester-architecture">Mac architecture <span class="req">required</span></label>
              <select id="tester-architecture" name="architecture" class="field" required>
                <option value="">Select…</option>
                <option value="Apple Silicon">Apple Silicon</option>
                <option value="Intel">Intel</option>
              </select>
            </div>
          </div>

          <div class="form-grid form-grid--3">
            <div class="form-row">
              <label class="form-label" for="tester-experience">Experience</label>
              <select id="tester-experience" name="experience" class="field">
                <option value="">Prefer not to say</option>
                <option value="Producer">Producer</option>
                <option value="Mixing engineer">Mixing engineer</option>
                <option value="Mastering engineer">Mastering engineer</option>
                <option value="Developer / technical user">Developer / technical user</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div class="form-row">
              <label class="form-label" for="tester-phase">Interested in</label>
              <select id="tester-phase" name="phase_interest" class="field">
                <option value="either">Either</option>
                <option value="beta">Beta</option>
                <option value="release-candidate">Release Candidate</option>
              </select>
            </div>
            <div class="form-row">
              <label class="form-label" for="tester-focus">Testing focus</label>
              <select id="tester-focus" name="testing_focus" class="field">
                <option value="">No preference</option>
                <option value="Workflow / usability">Workflow / usability</option>
                <option value="Stability / crashes">Stability / crashes</option>
                <option value="DAW compatibility">DAW compatibility</option>
                <option value="CPU / performance">CPU / performance</option>
                <option value="Automation / recall">Automation / recall</option>
                <option value="General use">General use</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div class="form-row">
            <label class="form-label" for="tester-note">What would you most want to test?</label>
            <textarea id="tester-note" name="optional_note" class="field field-area" rows="3"></textarea>
            <p class="form-hint">Optional — a sentence is plenty.</p>
          </div>

          <p class="form-status" role="status" aria-live="polite"></p>

          <div class="form-actions">
            <button type="submit" class="btn btn-primary">Register testing interest</button>
          </div>
        </form>

        <noscript>
          <p class="form-note">This form needs JavaScript to send. With it switched off nothing is submitted, so please enable it for this page rather than assuming your interest was recorded.</p>
        </noscript>
      </div>
    </section>`
  });
}

export function renderNotFound() {
  return shell({
    title: 'Page not found — StudioZIO MixRack',
    description:
      'That page does not exist on the StudioZIO MixRack site. The MixRack page itself is at the root of this domain, and the rest of StudioZIO is one link away.',
    canonical: '',
    current: '',
    content: `<section class="hero tech-grid">
      <div class="shell">
        <div class="rise">
          <p class="eyebrow">404</p>
          <h1>That page is not here</h1>
          <p class="lede">This site is one page: StudioZIO MixRack. Everything else lives on the StudioZIO hub.</p>
          <div class="hero-actions"><a class="btn btn-primary" href="/">StudioZIO MixRack</a></div>
          <p><a href="${HUB_WEBSITE}/">StudioZIO hub</a></p>
        </div>
      </div>
    </section>`
  });
}
