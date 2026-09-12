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

  var readout = gate.querySelector('[data-countdown]');
  var target = gate.querySelector('[data-release]');
  var offset = 0;
  var launchMs = null;
  var timer = null;

  function plural(n, word) { return n + ' ' + word + (n === 1 ? '' : 's'); }

  function draw() {
    var left = launchMs - (Date.now() + offset);
    if (left <= 0) { stop(); check(); return; }
    var d = Math.floor(left / 86400000);
    var h = Math.floor(left / 3600000) % 24;
    var m = Math.floor(left / 60000) % 60;
    var s = Math.floor(left / 1000) % 60;
    if (readout) {
      readout.textContent = d > 0
        ? plural(d, 'day') + ', ' + plural(h, 'hour')
        : h > 0 ? plural(h, 'hour') + ', ' + plural(m, 'minute')
        : plural(m, 'minute') + ', ' + plural(s, 'second');
    }
  }

  function stop() { if (timer) { clearInterval(timer); timer = null; } }

  function apply(state) {
    offset = state.serverTime ? Date.parse(state.serverTime) - Date.now() : 0;

    if (state.released && state.url) {
      stop();
      gate.setAttribute('data-state', 'released');
      if (target) {
        var a = target.querySelector('a') || document.createElement('a');
        a.href = state.url;
        if (!a.textContent) a.textContent = gate.getAttribute('data-release-label') || 'Get StudioZIO MixRack';
        if (!a.parentNode) target.appendChild(a);
        target.hidden = false;
      }
      if (readout) readout.hidden = true;
      return;
    }

    gate.setAttribute('data-state', state.launchAt ? 'counting' : 'waiting');
    if (!state.launchAt) { if (readout) readout.hidden = true; return; }

    launchMs = Date.parse(state.launchAt);
    if (!isFinite(launchMs)) { if (readout) readout.hidden = true; return; }
    if (readout) readout.hidden = false;
    draw();
    stop();
    timer = setInterval(draw, 1000);
  }

  function check() {
    fetch('/api/release', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (state) { if (state) apply(state); })
      /* A failed poll leaves whatever is on screen alone: the gate is the
         server's answer, and no answer is not a reason to show a link. */
      .catch(function () {});
  }

  check();
  /* One re-ask a minute so a page left open across the launch instant picks it
     up without a reload. Cheap, and the endpoint is not cached. */
  setInterval(check, 60000);
})();
