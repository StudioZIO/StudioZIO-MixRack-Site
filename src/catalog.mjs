/* The one product this site is about, plus the addresses of the rest of the
   StudioZIO estate.

   Every fact here is copied from the hub's src/catalog.mjs entry for MixRack
   (StudioZIO/StudioZIO-Web). Nothing is added: MixRack has no version, no
   release date, no price and no download, so this file states none of those.
   When the hub entry changes, this one changes with it. */

export const HUB_WEBSITE = 'https://studiozio.vercel.app';
export const MASTERING_SUITE_WEBSITE = 'https://studioziomasteringsuite.vercel.app/';
export const TEMPO_DELAY_WEBSITE = 'https://www.tempodelay.tech/';
export const ZIO_WEBSITE = 'https://zio-audio.vercel.app/';

/* This site's own origin. Canonicals, og:url and the sitemap are built from
   it, so the dedicated domain — not the hub's /products/mixrack/ — is what a
   crawler is told to index. */
export const SITE_ORIGIN = 'https://studioziomixrack.vercel.app';

export const mixrack = Object.freeze({
  slug: 'mixrack',
  name: 'StudioZIO MixRack',
  shortName: 'MixRack',
  manufacturer: 'StudioZIO',
  platform: 'macOS',
  formats: Object.freeze(['Audio Unit (AU)', 'VST3', 'AAX', 'Standalone']),
  compactFormats: 'AU / VST3 / AAX / Standalone',
  availability: 'Coming soon',
  description:
    'A modular mixing environment that brings essential processing into one focused rack.'
});
