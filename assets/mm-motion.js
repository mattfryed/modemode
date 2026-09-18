/* A live OS preference shared by the logo, canvas scenes, and project media. */
(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  const listeners = new Set();
  window.MMMotion = {
    get reduced() { return preference.matches; },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    visible(el) {
      if (document.hidden || !el?.isConnected) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
    }
  };
  const images = new Map();
  const placeholder = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="#f3f3f0"/><text x="400" y="300" text-anchor="middle" font-family="sans-serif" font-size="24">Animation paused</text></svg>');
  function syncImages(reset = false) {
    // Disconnect while assigning src so our own changes cannot trigger a loop.
    observer.disconnect();
    document.querySelectorAll('img[src]').forEach(im => {
      let record = images.get(im);
      const src = im.getAttribute('src');
      if (record && src !== record.original && src !== record.displayed) {
        record.button?.remove(); images.delete(im); record = null;
      }
      if (/\.gif(?:[?#]|$)/i.test(src) && (!record || src !== record.original)) {
        record?.button?.remove();
        record = {original:src, playing:false}; images.set(im, record);
      }
      if (!record) return;
      if (reset) record.playing = false;
      const paused = preference.matches && !record.playing;
      const dest = paused ? (window.MMStills?.[record.original] || placeholder) : record.original;
      if (src !== dest) im.setAttribute('src', dest);
      record.displayed = dest;
      if (preference.matches) {
        if (!record.button) {
          const button = document.createElement('button'); button.type = 'button'; button.className = 'mm-animation-toggle';
          button.addEventListener('click', () => { record.playing = !record.playing; syncImages(); });
          if (getComputedStyle(im.parentElement).position === 'static') im.parentElement.style.position = 'relative';
          im.parentElement.appendChild(button); record.button = button;
        }
        record.button.textContent = paused ? 'Play animation' : 'Pause animation';
        record.button.setAttribute('aria-label', (paused ? 'Play' : 'Pause') + ' animation' + (im.alt ? ': ' + im.alt : ''));
      } else { record.button?.remove(); record.button = null; }
    });
    for (const [im, record] of images) if (!im.isConnected) { record.button?.remove(); images.delete(im); }
    observer.observe(document.body, {childList:true, subtree:true, attributes:true, attributeFilter:['src']});
  }
  function pauseVideos() {
    if (!preference.matches) return;
    document.querySelectorAll('video[autoplay],video[data-mm-autoplay]').forEach(v => {
      v.dataset.mmAutoplay = 'true'; v.autoplay = false; v.pause(); v.controls = true;
    });
  }
  const hasMedia = node => node.nodeType === 1 && (node.matches('img,video') || node.querySelector('img,video'));
  const observer = new MutationObserver(changes => {
    if (!changes.some(c => c.type === 'attributes' ? c.target.matches('img,video') : [...c.addedNodes, ...c.removedNodes].some(hasMedia))) return;
    syncImages(); pauseVideos();
  });
  preference.addEventListener('change', () => {
    listeners.forEach(fn => fn(preference.matches));
    if (document.body) { syncImages(true); pauseVideos(); }
  });
  document.addEventListener('DOMContentLoaded', () => { syncImages(); pauseVideos(); }, {once:true});
})();
