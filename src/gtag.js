/* Google tag (gtag.js) initialisation for measurement ID G-VL8Z542XMP.

This is the second half of Google's standard snippet. Google ships it as an
inline <script>, but the site is served under `default-src 'self'` with no
'unsafe-inline', so the same code lives here and is loaded from the site
origin. The loader itself stays in every page head as the literal
<script async src="https://www.googletagmanager.com/gtag/js?id=..."></script>
tag, which is what Google's own installation check looks for.

This file runs synchronously in <head>, before the async loader, so the
consent state is always established before the first measurement call. */
window.dataLayer = window.dataLayer || [];
function gtag() { dataLayer.push(arguments); }
gtag('js', new Date());

/* ---- Consent Mode v2 ---------------------------------------------------- */

/* Regions where storage is denied until the visitor opts in: the EU 27, the
   rest of the EEA (IS/LI/NO), the UK, Switzerland, and Türkiye — Türkiye is
   not in the EEA but KVKK is the operator's home jurisdiction, so it is
   treated the same way. To require opt-in everywhere instead, delete the
   CONSENT_OPT_IN_REGIONS list and the unscoped 'granted' default below,
   leaving only a single denied default. */
var CONSENT_OPT_IN_REGIONS = [
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT',
  'LV','LT','LU','MT','NL','PL','PT','RO','SK','SI','ES','SE',
  'IS','LI','NO','GB','CH','TR'
];

/* The unscoped default is declared FIRST and the region-scoped one SECOND on
   purpose. Google resolves consent defaults by region specificity, so the
   order does not matter there — but writing it this way is also correct if
   the calls were ever resolved last-wins, which the reverse order would not
   be. Either way the opt-in regions end up denied. */
gtag('consent', 'default', {
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
  analytics_storage: 'granted'
});
gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  region: CONSENT_OPT_IN_REGIONS,
  wait_for_update: 500
});

/* Replay a stored choice before config so returning visitors are measured
   under the decision they already made, with no banner and no 500ms wait. */
window.STUDIOZIO_CONSENT_KEY = 'studiozio-consent';
try {
  var stored = window.localStorage.getItem(window.STUDIOZIO_CONSENT_KEY);
  if (stored === 'granted' || stored === 'denied') {
    gtag('consent', 'update', {
      ad_storage: stored,
      ad_user_data: stored,
      ad_personalization: stored,
      analytics_storage: stored
    });
  }
} catch (e) {
  /* Storage can throw outright in private modes; treat it as "no choice". */
}

/* Cross-domain measurement. The four StudioZIO properties are one journey —
   read about a plug-in here, open its product site, download it — and without a
   linker each hop starts a new session with the previous host as its referrer,
   so the conversion is credited to nobody. gtag decorates outbound links to
   these domains with the client id so the session survives the hop, and accepts
   an incoming one on arrival.

   This list must also be entered in the GA4 console, under the data stream's
   configured domains: the console list is what drives referral exclusion, and
   a domain missing there still shows up as self-referral traffic. */
var STUDIOZIO_NETWORK_DOMAINS = [
  'studiozio.vercel.app',
  'studioziomasteringsuite.vercel.app',
  'www.tempodelay.tech',
  'zio-audio.vercel.app'
];

/* ---- DebugView opt-in ----------------------------------------------------

   GA4's DebugView shows only traffic that flags itself as a debug session, so
   without this it stays empty however many events arrive. That is exactly what
   happened the first time it was opened: the runbook said to append `?_dbg=1`,
   nothing appeared, and the obvious conclusion — that measurement was broken —
   was wrong. The events were reaching Realtime the whole time; only the debug
   screen was blind, because nothing here ever turned the flag on.

   Off by default, and never inferred from the hostname or a preview URL. GA4
   treats debug traffic differently in reporting, so switching it on for real
   visitors would quietly cost data. `?_dbg=1` turns it on for the rest of the
   browser session; `?_dbg=0` turns it off again.

   Stored rather than read from the query string alone, so it survives
   navigation inside one site. It deliberately does not cross to another
   property — sessionStorage is per-origin — so a tester following a
   cross-domain link appends `?_dbg=1` again on arrival. */
var STUDIOZIO_DEBUG_KEY = 'studiozio-debug';
var studioZioDebug = false;
try {
  var debugFlag = new URLSearchParams(window.location.search).get('_dbg');
  if (debugFlag === '1') window.sessionStorage.setItem(STUDIOZIO_DEBUG_KEY, '1');
  else if (debugFlag === '0') window.sessionStorage.removeItem(STUDIOZIO_DEBUG_KEY);
  studioZioDebug = window.sessionStorage.getItem(STUDIOZIO_DEBUG_KEY) === '1';
} catch (e) {
  /* Private modes can throw on storage. The query string alone still works; it
     just will not survive the next navigation. */
  studioZioDebug = window.location.search.indexOf('_dbg=1') !== -1;
}

var STUDIOZIO_MEASUREMENT_CONFIG = {
  linker: { domains: STUDIOZIO_NETWORK_DOMAINS, accept_incoming: true }
};
/* Added only when on. `debug_mode: false` behaves the same today, but a key
   that is simply absent cannot be misread by a future gtag build. */
if (studioZioDebug) STUDIOZIO_MEASUREMENT_CONFIG.debug_mode = true;

gtag('config', 'G-VL8Z542XMP', STUDIOZIO_MEASUREMENT_CONFIG);
