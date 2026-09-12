/* Click-to-load video for the MixRack preview.

   Until the visitor asks for it, the page carries only a 14 KB poster image
   inside a button: no <video> element exists, so no browser fetches a single
   byte of the film. The click builds the player, points it at the file and
   starts it. Same-origin, so media-src inherits default-src 'self'. */
(() => {
  for (const button of document.querySelectorAll('[data-video-src]')) {
    button.addEventListener('click', () => {
      const poster = button.querySelector('img');
      const video = document.createElement('video');
      video.className = 'video-player';
      video.controls = true;
      video.playsInline = true;
      video.preload = 'auto';
      video.width = 1920;
      video.height = 1080;
      if (poster) video.poster = poster.currentSrc || poster.src;
      video.setAttribute('aria-label', button.dataset.videoLabel || 'Video');
      const source = document.createElement('source');
      source.src = button.dataset.videoSrc;
      source.type = 'video/mp4';
      video.append(source);

      /* Reported when the player actually starts, not when the button is
         clicked: a blocked autoplay would otherwise count as a view. Same
         event name and parameters as the Mastering Suite site's demo clip, so
         GA4 has one video metric for the estate rather than one per site.
         Guarded because a visitor who declined measurement has no gtag. */
      video.addEventListener('play', () => {
        if (typeof window.gtag !== 'function') return;
        window.gtag('event', 'demo_video_play', {
          product: button.dataset.evProduct || 'mixrack',
          clip: button.dataset.evClip || 'mixrack-intro'
        });
      }, { once: true });

      button.replaceWith(video);
      video.focus();
      const started = video.play();
      if (started && typeof started.catch === 'function') started.catch(() => {});
    }, { once: true });
  }
})();
