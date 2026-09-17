/* The red channel stores normalized distance from the logo's medial axis;
   alpha stores its exact silhouette. Finish on the original SVG for crispness. */
window.MMLogoIntro = {
  play({ delay = 240, duration = 1100 } = {}) {
    const html = document.documentElement, svg = document.querySelector('.wordmark .mm-logo');
    const finish = () => { html.classList.remove('logo-waiting'); canvas?.remove(); };
    let canvas;
    if (!svg || matchMedia('(prefers-reduced-motion: reduce)').matches) { finish(); return; }
    const image = new Image();
    const started = performance.now();
    // A failed/slow optional asset never leaves navigation invisible.
    const fallback = setTimeout(finish, 2200);
    image.onerror = () => { clearTimeout(fallback); finish(); };
    image.onload = () => {
      if (!html.classList.contains('logo-waiting')) return;
      try {
        canvas = document.createElement('canvas'); canvas.className = 'logo-growth';
        canvas.setAttribute('aria-hidden', 'true');
        const scale = Math.min(devicePixelRatio || 1, 3);
        canvas.width = Math.ceil(svg.getBoundingClientRect().width * scale);
        canvas.height = Math.ceil(canvas.width * 266.78 / 676.58);
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        const source = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const frame = ctx.createImageData(canvas.width, canvas.height);
        ctx.clearRect(0,0,canvas.width,canvas.height);
        svg.parentElement.appendChild(canvas);
        const t0 = Math.max(started + delay, performance.now());
        const tick = now => {
          if (!html.classList.contains('logo-waiting')) { canvas.remove(); return; }
          const p = Math.max(0, Math.min(1, (now - t0) / duration));
          if (p >= 1) { clearTimeout(fallback); finish(); return; }
          const growth = p * p * (3 - 2 * p);
          const color = getComputedStyle(svg).color.match(/[\d.]+/g) || [22, 22, 15];
          for (let i = 0; i < source.length; i += 4) {
            const edge = Math.max(0, Math.min(1, (growth - source[i] / 255) / .045));
            frame.data[i] = +color[0]; frame.data[i + 1] = +color[1]; frame.data[i + 2] = +color[2];
            frame.data[i + 3] = source[i + 3] * edge * edge * (3 - 2 * edge);
          }
          ctx.putImageData(frame, 0, 0);
          requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      } catch (_) { clearTimeout(fallback); finish(); }
    };
    image.src = new URL('assets/mode-mode-logo-growth.png', document.baseURI).href;
  }
};
