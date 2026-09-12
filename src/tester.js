/* StudioZIO MixRack tester-interest submission.

   Same two constraints as src/notify.js, for the same reasons: the site is
   served under `form-action 'none'`, so a native POST is refused — a plain
   <form action="..."> would render, validate, submit, and silently go
   nowhere — and the only way out of the page is a fetch to the one endpoint
   `connect-src` allows. The markup therefore carries no action attribute at
   all, so there is no form that looks submittable but is not.

   Kept as its own file rather than folded into notify.js: the two forms
   collect different fields, post a different `intent`, and report a
   different GA4 event, and the build copies plain classic scripts with no
   bundler and no module graph — so sharing a helper would mean either
   shipping a module or making one form's script depend on the other's DOM.
   validate.mjs asserts both stay in step on the parts that matter, same as
   notify.js and contact.js.

   Progressive by construction: with JS off nothing submits, and the page
   says so instead of pretending interest was recorded. */
(function () {
  "use strict";

  var ENDPOINT = 'https://formspree.io/f/mrpzbbzp';

  var form = document.querySelector('.tester-form');
  if (!form) return;

  var status = form.querySelector('.form-status');
  var submit = form.querySelector('button[type="submit"]');
  var honeypot = form.querySelector('.form-hp input');

  function value(name) {
    var el = form.elements[name];
    return el ? String(el.value).trim() : '';
  }

  function say(kind, text) {
    status.className = 'form-status' + (kind ? ' form-status--' + kind : '');
    status.textContent = text;
  }

  /* Reported only once the endpoint has accepted it, so the count in GA4 is
     registrations rather than submit clicks. Guarded because a visitor who
     denied consent has no gtag. The only metadata sent is the product and
     which phase they said they would rather test — never the email or the
     free-text note, which are personal and belong only in the Formspree
     submission. */
  function report(phaseInterest) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'mixrack_testing_interest', {
      product: 'mixrack',
      phase_interest: phaseInterest
    });
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();

    if (!form.reportValidity()) return;

    /* Bots fill every field they can see; a person never reaches this one.
       Report the same success they would get, so the difference teaches a
       bot nothing, and send nothing — including nothing to GA4, which would
       otherwise count crawlers as prospective testers. */
    if (honeypot && honeypot.value.trim().length > 0) {
      form.hidden = true;
      say('sent', 'Thanks — your testing interest has been recorded. We may contact you when a suitable MixRack beta or release-candidate build is ready.');
      return;
    }

    var email = value('email');
    var phaseInterest = value('phase_interest');

    submit.disabled = true;
    say('', 'Sending…');

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        intent: 'mixrack-testing-interest',
        product: 'MixRack',
        site: 'StudioZIO MixRack site',
        phase_interest: phaseInterest,
        daw: value('daw'),
        macos_version: value('macos_version'),
        architecture: value('architecture'),
        experience: value('experience'),
        testing_focus: value('testing_focus'),
        email: email,
        optional_note: value('optional_note'),
        _subject: 'StudioZIO MixRack tester interest: ' + email
      })
    })
      .then(function (response) {
        /* A failure that reports success is worse than no form at all: the
           registration is never recorded and nobody knows to try again. */
        if (!response.ok) {
          submit.disabled = false;
          say('error', 'That could not be recorded (HTTP ' + response.status + '). Please try again in a moment.');
          return;
        }
        form.reset();
        submit.disabled = false;
        say('sent', 'Thanks — your testing interest has been recorded. We may contact you when a suitable MixRack beta or release-candidate build is ready. Submitting does not guarantee selection.');
        report(phaseInterest);
      })
      .catch(function () {
        submit.disabled = false;
        say('error', 'That could not be recorded — check your connection and try again.');
      });
  });
})();
