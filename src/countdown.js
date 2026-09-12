/* The countdown, which is presentation and nothing else.

   It asks /api/release what the state is and renders the answer. It decides
   nothing: the instant and the URL both live on the server, and this file
   contains neither. Switching it on is adding the script tag and the markup
   below to the page; switching it off is removing them. Nothing here runs
   until an element with id="release-gate" exists, so the file is inert on a
   page that does not opt in.

   Expected markup, when the section is enabled:

     <div id="release-gate" data-state="waiting">
       <p class="countdown" data-countdown></p>
       <p class="release-link" data-release hidden></p>
     </div>

   The clock offset matters: a visitor whose device is a day slow would
   otherwise watch a countdown that disagrees with everyone else's. The server
   sends its own time, this takes the difference once, and every tick is drawn
   against the corrected clock. It is cosmetic -- a corrected clock cannot
   unlock anything, because unlocking is not done here. */
(function () {
  var gate = document.getElementById('release-gate');
  if (!gate) return;

  var clock = gate.querySelector('[data-countdown]');
  var note = gate.querySelector('[data-launch-note]');
  var link = gate.querySelector('[data-release-link]');
  var status = gate.querySelector('.launch-status');

  var offset = 0;          /* server clock minus this device's clock */
  var launchMs = null;
  var timer = null;
  var state = '';

  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }

  function say(text) { if (status && status.textContent !== text) status.textContent = text; }

  function draw() {
    var left = launchMs - (Date.now() + offset);
    if (left <= 0) { stop(); check(); return; }
    var d = Math.floor(left / 86400000);
    var h = Math.floor(left / 3600000) % 24;
    var m = Math.floor(left / 60000) % 60;
    var sec = Math.floor(left / 1000) % 60;
    clock.textContent = d > 0
      ? plural(d, 'day') + ' ' + plural(h, 'hour')
      : h > 0 ? plural(h, 'hour') + ' ' + plural(m, 'minute')
      : plural(m, 'minute') + ' ' + plural(sec, 'second');
  }

  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  function release(url) {
    stop();
    gate.setAttribute('data-state', 'released');
    if (clock) clock.textContent = '';
    if (note) note.textContent = 'StudioZIO MixRack 1.0.0 is out. macOS 11 or newer, Universal.';
    if (link) {
      link.href = url;
      link.removeAttribute('aria-disabled');
      /* The estate measures this the same way the other two product sites do,
         so one metric covers all three rather than three that must be added up. */
      link.setAttribute('data-event', 'download_click');
      link.setAttribute('data-ev-product', 'mixrack');
      link.setAttribute('data-ev-version', '1.0.0');
    }
    say('StudioZIO MixRack has been released. The link is now active.');
  }

  function waiting(launchAt) {
    gate.setAttribute('data-state', launchAt ? 'counting' : 'waiting');
    if (link) { link.removeAttribute('href'); link.setAttribute('aria-disabled', 'true'); }

    if (!launchAt) {
      if (clock) clock.textContent = '';
      if (note) note.textContent = 'Release date is being confirmed.';
      return;
    }
    launchMs = Date.parse(launchAt);
    if (!isFinite(launchMs)) { if (clock) clock.textContent = ''; return; }

    if (note) {
      note.textContent = 'Until ' + new Date(launchMs).toLocaleString(undefined, {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
      }) + ' in your time zone. The button turns on by itself.';
    }
    draw();
    stop();
    timer = setInterval(draw, 1000);
  }

  function apply(next) {
    /* A device whose clock is wrong would otherwise watch a countdown nobody
       else sees. The correction is cosmetic: it cannot unlock anything,
       because unlocking is not decided here. */
    offset = next.serverTime ? Date.parse(next.serverTime) - Date.now() : 0;
    var now = next.released && next.url ? 'released' : (next.launchAt ? 'counting' : 'waiting');
    if (now === state && now !== 'released') {
      if (now === 'counting') launchMs = Date.parse(next.launchAt);
      return;
    }
    state = now;
    if (now === 'released') release(next.url); else waiting(next.launchAt);
  }

  /* The trailing slash is deliberate: the site sets trailingSlash, so the bare
     path 308s and every poll would pay a redirect it does not need. */
  function check() {
    fetch('/api/release/', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (next) { if (next) apply(next); })
      /* A failed poll leaves what is on screen alone: the gate is the server's
         answer, and no answer is not a reason to light up a link. */
      .catch(function () {});
  }

  check();
  /* One re-ask a minute, so a page left open across the launch instant picks
     it up without a reload. The endpoint is not cached. */
  setInterval(check, 60000);
})();
