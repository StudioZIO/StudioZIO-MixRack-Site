# StudioZIO MixRack — dedicated site

The product page for **StudioZIO MixRack**, moved out of the hub
(`www.studiozio.tech/products/mixrack/`) onto its own domain:

    https://studioziomixrack.vercel.app/

It is the hub's page, not a rewrite of it. The shell — header, footer,
stylesheet, fonts, chips, panels, tokens — is the hub's shell, copied so the
two properties read as one estate. The copy, the facts and the two forms are
the hub's, unchanged. MixRack is unreleased, so this site states no version,
no date, no price and nothing to download, and `scripts/validate.mjs` fails
the build if any of those appear.

## Build

```
npm run check     # typecheck + validate + build
npm run build     # writes dist/
npm run dev       # builds, then serves dist/ on http://localhost:4173
```

No dependencies. Node 20+ and the standard library; `dist/` is static.

## Layout

| Path | What it is |
| --- | --- |
| `src/site.mjs` | the shell and the page |
| `src/catalog.mjs` | the MixRack facts and the estate's addresses |
| `src/styles.css` | the hub stylesheet, byte for byte |
| `src/fonts/` | Inter Tight, Space Grotesk, JetBrains Mono (OFL, licences included) |
| `src/media/` | the two-minute preview film and its poster |
| `src/og/og-mixrack.png` | 1200×630 share card, the estate’s own MixRack card |
| `src/*.js` | classic scripts: the Google tag, consent, conversion events, the two forms, the click-to-load video |
| `scripts/build.mjs` | writes `dist/`, the sitemap and robots.txt |
| `scripts/validate.mjs` | the gate — run by `npm run lint` and by the build |

## Link ownership

The header and the footer are the estate's own lists, identical to the ones
the other StudioZIO sites carry, with two owner-approved changes that apply
to every site: MixRack joins the header, and the footer carries no product
links. The validator enforces both, plus the rule that nothing on this site
is a hub path pretending to be a local one.

| Link | Kind | Destination |
| --- | --- | --- |
| MixRack (header) | LOCAL_MIXRACK | `/` |
| Hub, Products, Notes, Community, Contact, Press kit | STUDIOZIO_HUB | absolute `www.studiozio.tech/...` URLs |
| Mastering Suite (header) | EXTERNAL | studioziomasteringsuite.vercel.app |
| Tempo Delay (header) | EXTERNAL | www.tempodelay.tech |
| ZIO (footer) | EXTERNAL | zio-audio.vercel.app |
| Instagram, YouTube, KVR ×2 | EXTERNAL | opened in a new tab, `rel="noopener noreferrer"` |

Header: Hub · Products · Mastering Suite · Tempo Delay · MixRack · Notes ·
Community · Contact. Footer: Hub · Products · Notes · Contact · Press kit ·
ZIO.

## Deployment

Vercel project `studioziomixrack`, built with `npm run build` into `dist/`.
`vercel.json` carries the estate's CSP (`default-src 'self'`, no
`unsafe-inline`, `form-action 'none'`) and redirects the hub's old path,
`/products/mixrack`, to `/` so an old link still lands on the product.

The hub keeps its own `/products/mixrack/` page; this site declares the
canonical for the dedicated domain and nothing else.

## Measurement

Same Google tag as the rest of the estate (`G-VL8Z542XMP`), same
consent-first architecture: defaults are denied in Türkiye, the EEA, the UK
and Switzerland until the visitor accepts. The release-notice and
tester-interest forms post to the same Formspree endpoint the hub uses, and
identify themselves as `StudioZIO MixRack site` so their submissions can be
told apart from the hub's.

Follow-up for the owner: this domain is not yet in GA4's cross-domain list,
so a visitor moving between the hub and this site currently counts as two
sessions.
