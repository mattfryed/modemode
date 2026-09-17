/* Public routes work at a custom-domain root and beneath a GitHub Pages prefix.
   Generated route pages are real documents; history only removes legacy spelling. */
(() => {
  const root = new URL('../', document.currentScript.src);
  let base = document.querySelector('base');
  if (!base) { base = document.createElement('base'); document.head.prepend(base); }
  base.href = root.href;
  const query = new URLSearchParams(location.search);
  const page = document.documentElement.dataset.mmPage;
  const valid = value => /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value || '');
  const fromPath = location.pathname.slice(root.pathname.length).replace(/\/$/, '');
  const slug = document.documentElement.dataset.mmSlug || query.get('p') ||
    (page === 'project' && valid(fromPath) ? fromPath : '');
  const href = name => new URL(name ? encodeURIComponent(name) : './', root).pathname;
  window.MMRoutes = { home: root.pathname, href, slug: valid(slug) ? slug : '' };
  // Editor iframe query strings remain intact, including old preview links.
  if (query.has('edit') || query.has('studio')) return;
  let path = page === 'home' ? root.pathname : page === 'about' ? href('about') :
    valid(slug) ? href(slug) : null;
  if (path) {
    if (page === 'project') query.delete('p');
    const search = query.size ? '?' + query.toString() : '';
    if (path + search !== location.pathname + location.search)
      history.replaceState(history.state, '', path + search + location.hash);
  }
})();
