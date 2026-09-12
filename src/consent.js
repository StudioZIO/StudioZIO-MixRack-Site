/* Consent banner for the Google tag.

   gtag.js has already set the Consent Mode v2 defaults (denied in the opt-in
   regions listed there) and replayed any stored choice. This file only draws
   the UI for visitors who have not chosen yet, and installs a footer control
   so a choice can be withdrawn later — consent has to be as easy to take back
   as it is to give.

   The banner is built in JS rather than shipped in every page's HTML so the
   generated pages stay identical, and because a visitor with JS disabled is
   not being measured in the first place. No inline styles: the site is served
   under `style-src 'self'`, so all of the styling lives in styles.css. */
(function () {
  "use strict";

  var KEY = window.STUDIOZIO_CONSENT_KEY || 'studiozio-consent';

  var COPY = {
    label: 'Cookie preference',
    text: 'This site uses Google Analytics to count visits and to measure which ads bring people here. You are not added to an advertising audience, and no profile is built about you.',
    accept: 'Accept',
    decline: 'Decline',
    reopen: 'Cookies'
  };

  function read() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function decide(value) {
    try { window.localStorage.setItem(KEY, value); } catch (e) { /* private mode */ }
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        ad_storage: value,
        ad_user_data: value,
        ad_personalization: value,
        analytics_storage: value
      });
    }
  }

  function button(text, className, onClick) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = className;
    b.textContent = text;
    b.addEventListener('click', onClick);
    return b;
  }

  var banner = null;

  function close(restoreFocusTo) {
    if (!banner) return;
    banner.remove();
    banner = null;
    if (restoreFocusTo && document.contains(restoreFocusTo)) restoreFocusTo.focus();
  }

  function show(restoreFocusTo) {
    if (banner) return;
    banner = document.createElement('div');
    banner.className = 'consent-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', COPY.label);

    var inner = document.createElement('div');
    inner.className = 'consent-inner';

    var p = document.createElement('p');
    p.className = 'consent-text';
    p.textContent = COPY.text;

    var actions = document.createElement('div');
    actions.className = 'consent-actions';
    actions.appendChild(button(COPY.decline, 'btn consent-btn', function () {
      decide('denied'); close(restoreFocusTo);
    }));
    actions.appendChild(button(COPY.accept, 'btn btn-primary consent-btn', function () {
      decide('granted'); close(restoreFocusTo);
    }));

    inner.appendChild(p);
    inner.appendChild(actions);
    banner.appendChild(inner);
    document.body.appendChild(banner);

    /* Move focus in only when the visitor asked for the banner. On first
       load it must not steal focus from the page they came to read. */
    if (restoreFocusTo) actions.firstChild.focus();
  }

  /* A control to reopen the choice, so consent can be withdrawn as easily as
     it was given. It is a <button>, not a link: it performs an action rather
     than navigating. It joins the shared footer navigation, which every page
     renders. */
  var reopen = button(COPY.reopen, 'consent-reopen', function () {
    if (banner) { close(reopen); } else { show(reopen); }
  });

  var footerList = document.querySelector('.site-footer nav ul');
  if (footerList) {
    var item = document.createElement('li');
    item.appendChild(reopen);
    footerList.appendChild(item);
  }

  if (read() !== 'granted' && read() !== 'denied') show(null);
})();
