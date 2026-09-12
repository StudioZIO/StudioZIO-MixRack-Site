/* The header's search box, on every page of every StudioZIO site.

   It does not search. It carries what was typed to the hub's search page,
   which is the only page that holds the index -- so the same box behaves the
   same way whether the visitor is standing on the hub, the Mastering Suite
   site, Tempo Delay or MixRack.

   The jump is made here rather than by a <form>, because every site sets
   form-action 'none' in its CSP: a form would look right, do nothing, and
   report nothing. Enter is the only trigger; nothing is sent while typing. */
(function () {
  'use strict';

  /* Rewritten per site when this file is copied: the hub points at its own path and
     navigates to its own page, the other three point at the hub's origin. */
  var SEARCH_PAGE = 'https://www.studiozio.tech/search/';

  /* On the search page itself there is nowhere to jump to: search.js is
     already listening to these same boxes and filtering as they are typed
     into. Leaving early is what stops Enter reloading a page that had already
     answered. */
  if (document.getElementById('search-results')) return;

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Enter' || event.defaultPrevented) return;

    var field = event.target;
    if (!field || !field.classList || !field.classList.contains('header-search-field')) return;

    event.preventDefault();
    var query = String(field.value || '').trim();
    window.location.href = query
      ? SEARCH_PAGE + '?q=' + encodeURIComponent(query)
      : SEARCH_PAGE;
  });
}());
