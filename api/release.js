/* The release gate.

   The launch has to flip at a moment, and the thing being unlocked is a URL
   that must not be findable before it. Neither of those can live in the page:
   a browser clock is whatever the visitor sets it to, and anything shipped to
   the browser is readable from View Source on day one. So both live here, and
   the page only ever asks.

   Two locks, deliberately independent:

     MIXRACK_LAUNCH_AT     ISO 8601 instant, e.g. 2026-09-29T09:00:00Z
     MIXRACK_DOWNLOAD_URL  the real artefact URL

   Before the instant, the URL is withheld even if the variable is already set,
   so it can be loaded into Vercel ahead of time without risk. Before the
   variable is set, nothing unlocks even if the instant has passed, so a wrong
   date cannot publish a link that does not exist yet. Setting one without the
   other is safe in both directions; the launch needs both.

   The response carries the server's own clock. The countdown in the page uses
   it to correct for a device whose clock is wrong, which is a presentation
   detail -- the gate itself never consults the browser at all.

   Until MIXRACK_DOWNLOAD_URL exists in the environment this endpoint answers
   "not yet" and nothing else, which is the state it ships in. */

export default function handler(request, response) {
  const launchAt = process.env.MIXRACK_LAUNCH_AT || null;
  const url = process.env.MIXRACK_DOWNLOAD_URL || null;
  const now = Date.now();

  const launchMs = launchAt ? Date.parse(launchAt) : NaN;
  const timeReached = Number.isFinite(launchMs) && now >= launchMs;
  const released = Boolean(url) && timeReached;

  /* A cached "not yet" outliving the launch would be the one failure this
     endpoint cannot recover from on its own, so nothing caches it anywhere. */
  response.setHeader('cache-control', 'no-store, max-age=0');
  response.setHeader('content-type', 'application/json; charset=utf-8');

  response.status(200).end(JSON.stringify(
    released
      ? { released: true, url, serverTime: new Date(now).toISOString() }
      : {
          released: false,
          /* Announced only once a date is actually set, so the page cannot
             start counting down to a date nobody has committed to. */
          launchAt: Number.isFinite(launchMs) ? new Date(launchMs).toISOString() : null,
          serverTime: new Date(now).toISOString()
        }
  ));
}
