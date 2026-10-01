/* StudioZIO Early Access sign-up.

   The form posts natively to Buttondown -- its embed endpoint must be a form
   action, not a fetch -- so this file never takes the submit over. It only
   reports the one fact worth measuring, and tells the visitor what happens
   next, once the browser has accepted the form as valid (a submit event does
   not fire for a form that fails its own validation, so a click on an empty
   form is not counted as a sign-up).

   With JavaScript off the form still posts; only the event and the status
   line are lost. gtag sends over sendBeacon, which survives the navigation to
   Buttondown's confirmation page. Consent is enforced by the tag itself.
   Copied from the hub's src/early-access.js; change it there first. */
(function () {
  'use strict';

  var form = document.querySelector('.early-access-form');
  if (!form) return;

  var status = form.querySelector('.form-status');
  var submit = form.querySelector('button[type="submit"]');

  /* The same form sits on the hub's /early-access/, under each of the hub's
     product downloads and under this site's; its hidden source field says
     which, so the event carries it too. */
  var source = form.querySelector('input[name="metadata__source"]');

  form.addEventListener('submit', function () {
    if (typeof window.gtag === 'function') {
      window.gtag('event', 'early_access_submit', {
        source: source ? source.value : '',
        transport_type: 'beacon'
      });
    }
    if (status) {
      status.className = 'form-status';
      status.textContent = 'Opening Buttondown to finish signing up. Check your inbox for the confirmation email.';
    }
    /* Guard against a double post from an impatient second click while the
       next page loads. The browser has already captured the form data. */
    if (submit) window.setTimeout(function () { submit.disabled = true; }, 0);
  });
})();
