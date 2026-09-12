/* StudioZIO MixRack "notify me" submission.

   Same two constraints as src/contact.js, for the same reasons: the site is
   served under `form-action 'none'`, so a native POST is refused — a plain
   <form action="..."> would render, validate, submit, and silently go
   nowhere — and the only way out of the page is a fetch to the one endpoint
   `connect-src` allows. The markup therefore carries no action attribute at
   all, so there is no form that looks submittable but is not.

   Kept as its own file rather than folded into contact.js: the build copies
   plain classic scripts (see build.mjs) with no bundler and no module graph,
   so sharing a helper would mean either shipping a module or making the
   support form depend on a file the MixRack page also loads. Two small
   self-contained files is the cheaper trade here; validate.mjs asserts both
   stay in step on the parts that matter.

   Progressive by construction: with JS off nothing submits, and the page says
   so instead of pretending a signup was recorded. */
(function () {
  "use strict";

  var ENDPOINT = 'https://formspree.io/f/mrpzbbzp';

  var form = document.querySelector('.notify-form');
  if (!form) return;

  var status = form.querySelector('.form-status');
  var submit = form.querySelector('button[type="submit"]');
  var honeypot = form.querySelector('.form-hp input');

  function say(kind, text) {
    status.className = 'form-status' + (kind ? ' form-status--' + kind : '');
    status.textContent = text;
  }

  /* Reported only once the endpoint has accepted it, so the count in GA4 is
     signups rather than submit clicks. Guarded because a visitor who denied
     consent has no gtag. */
  function report() {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'notify_signup', { product: 'mixrack' });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!form.reportValidity()) return;

    /* Bots fill every field they can see; a person never reaches this one.
       Report the same success they would get, so the difference teaches a bot
       nothing, and send nothing — including nothing to GA4, which would
       otherwise count crawlers as interested buyers. */
    if (honeypot && honeypot.value.trim().length > 0) {
      form.hidden = true;
      say('sent', 'Thanks — we will let you know when StudioZIO MixRack is out.');
      return;
    }

    var email = String(form.elements.email.value).trim();

    submit.disabled = true;
    say('', 'Adding you…');

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        email: email,
        intent: 'mixrack-notify',
        site: 'StudioZIO MixRack site',
        _subject: 'StudioZIO MixRack notify: ' + email
      })
    })
      .then(function (response) {
        /* A failure that reports success is worse than no form at all: the
           address is never recorded and nobody knows to send it again. */
        if (!response.ok) {
          submit.disabled = false;
          say('error', 'That could not be recorded (HTTP ' + response.status + '). Please try again in a moment.');
          return;
        }
        form.reset();
        submit.disabled = false;
        say('sent', 'Thanks — we will email you once, when StudioZIO MixRack is released.');
        report();
      })
      .catch(function () {
        submit.disabled = false;
        say('error', 'That could not be recorded — check your connection and try again.');
      });
  });
})();
