/* Conversion measurement for the StudioZIO network.

   One delegated listener, no inline handlers: every site here is served under
   script-src 'self' (plus the tag host), so a handler attribute in the markup
   would be refused and the event would silently never fire.

   Two rules, both declarative — the markup says what an interaction means and
   this file only reports it:

   1. Anything carrying data-event fires that event, with each data-ev-*
      attribute on the element as a parameter (data-ev-product -> product).
      Adding a measured control is a markup change.

      The data-ev- prefix is deliberate. These controls already carry data-role
      and data-value for the behaviour scripts, and a rule that swept up every
      data-* attribute sent those to GA4 too: unregistered parameters, named
      after implementation details, on every interaction. Measurement and
      behaviour get separate namespaces so neither can quietly capture the
      other.
   2. A link to a known listening platform fires listen_click, with the platform
      read from the hostname and the release read from the nearest labelled
      context. The artist site has 149 of these; annotating each by hand would
      be 149 chances to forget one.

   Nothing here calls preventDefault or delays navigation. GA4 sends over
   sendBeacon, which survives the page going away, so holding the click back to
   "make sure the hit lands" would cost every visitor latency for nothing.

   Consent is not checked here either: gtag.js sets Consent Mode defaults before
   this file can run, so a denied visitor's events are withheld by the tag
   itself rather than by a second, drifting copy of the rule. */
(function () {
  'use strict';

  var PLATFORMS = {
    'open.spotify.com': 'spotify',
    'music.apple.com': 'apple-music',
    'www.youtube.com': 'youtube',
    'youtu.be': 'youtube',
    'www.youtube-nocookie.com': 'youtube',
    'soundcloud.com': 'soundcloud',
    'www.discogs.com': 'discogs'
  };

  function send(name, params) {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', name, params);
  }

  /* data-ev-product -> product, data-ev-track-title -> track_title. */
  function parameters(el) {
    var params = {};
    for (var i = 0; i < el.attributes.length; i += 1) {
      var attr = el.attributes[i];
      if (attr.name.indexOf('data-ev-') !== 0) continue;
      params[attr.name.slice(8).replace(/-/g, '_')] = attr.value;
    }
    return params;
  }

  /* The release a listening link belongs to, or nothing.

     Release cards carry it as data-title, and a release detail page states it
     as the h1. Everything else — the platform profile links in a Listen
     section, a footer, the links page — belongs to no release, and an earlier
     version reported the nearest heading for those, which filled the report
     with "Discography" as though it were an album. A missing parameter is
     honest; a plausible wrong one is not, and is far harder to notice. */
  function release(link) {
    var labelled = link.closest('[data-title]');
    if (labelled) return labelled.getAttribute('data-title');

    var card = link.closest('article, li');
    var heading = card && card.querySelector('h1, h2, h3');
    if (heading && heading.textContent.trim()) return heading.textContent.trim();

    /* A release detail page is one release from top to bottom, so its h1 is the
       answer -- but only there. The canonical says which pages those are. */
    var canonical = document.querySelector('link[rel="canonical"]');
    var isDetailPage = canonical && /\/releases\/[^/]+\/$/.test(canonical.getAttribute('href') || '');
    var h1 = document.querySelector('h1');
    if (isDetailPage && h1) return h1.textContent.trim();

    return null;
  }

  document.addEventListener('click', function (event) {
    if (!event.target || !event.target.closest) return;

    var declared = event.target.closest('[data-event]');
    if (declared) {
      send(declared.getAttribute('data-event'), parameters(declared));
      return;
    }

    var link = event.target.closest('a[href]');
    if (!link) return;
    var platform = PLATFORMS[link.hostname];
    if (!platform) return;
    var params = { platform: platform };
    var title = release(link);
    if (title) params.release = title;
    send('listen_click', params);
  });
}());
