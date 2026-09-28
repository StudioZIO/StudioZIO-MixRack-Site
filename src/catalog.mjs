/* The one product this site is about, plus the addresses of the rest of the
   StudioZIO estate.

   Every fact here is copied from the hub's src/catalog.mjs entry for MixRack
   (StudioZIO/StudioZIO-Web). Nothing is added: the hub states no price for
   MixRack, so this file states none either, and the download address is not
   here at all -- it lives in the Vercel environment and reaches the page
   through /api/release/, which is what keeps it out of View Source.
   When the hub entry changes, this one changes with it. */

export const HUB_WEBSITE = 'https://www.studiozio.tech';
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
  version: '1.0.0',
  platform: 'macOS',
  /* Read from the mixrack-v1.0.0 release notes, the same way the hub states
     it: the installer is Universal, and "macOS" alone leaves an Intel owner
     guessing. */
  architecture: 'Universal — Apple Silicon and Intel',
  minimumOs: 'macOS 11.0 or later',
  formats: Object.freeze(['Audio Unit (AU)', 'VST3', 'AAX', 'Standalone']),
  compactFormats: 'AU / VST3 / AAX / Standalone',
  availability: 'Available now',
  description:
    'A modular mixing environment that brings essential processing into one focused rack.'
});
