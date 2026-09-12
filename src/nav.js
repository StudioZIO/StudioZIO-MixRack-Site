/* Escape closes the compact menu.

   The menu is a native <details>, which is why it works with JavaScript off
   and why it needs no ARIA of its own: the element already exposes its open
   state. What <details> does not give you is Escape. A disclosure is not a
   modal, so nothing in WCAG demands it, but a panel that covers the page and
   swallows the next tap reads as a dialog to the person using it, and the key
   they reach for is Escape.

   Focus goes back to the summary on the way out. Closing the panel while the
   caret sits on a link inside it would otherwise drop focus onto <body>, and
   the next Tab would start again from the top of the page. */
(function () {
  var menu = document.querySelector('details.nav-compact');
  if (!menu) return;

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || !menu.open) return;
    /* Let a field inside the panel keep Escape for itself: in a search box the
       first Escape clears what was typed, and taking that away to close the
       menu would lose the query the visitor is still editing. */
    var active = document.activeElement;
    if (active && active !== menu && menu.contains(active)
        && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
        && active.value !== '') return;

    menu.open = false;
    var summary = menu.querySelector('summary');
    if (summary) summary.focus();
  });
})();
