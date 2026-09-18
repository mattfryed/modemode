/* MODE MODE — public portfolio analytics. Editor and development sessions stay local. */
(() => {
  if (window.MMAnalytics) return;
  const query = new URLSearchParams(location.search);
  const enabled = /^(www\.)?modemode\.studio$/.test(location.hostname) &&
    !query.has('edit') && !query.has('studio') && window.self === window.top;
  const clean = value => String(value || '').slice(0, 100);
  function track(name, details, done) {
    if (!enabled || typeof window.gtag !== 'function') { if (done) done(); return; }
    const params = {};
    for (const key of ['project_slug', 'section_name', 'navigation_source'])
      if (details && details[key]) params[key] = clean(details[key]);
    if (done) { params.event_callback = done; params.event_timeout = 150; }
    window.gtag('event', name, params);
  }
  function navigate(url, name, details) {
    let sent = false;
    const go = () => { if (!sent) { sent = true; location.assign(url); } };
    // Navigation still works if Google is blocked or never calls back.
    setTimeout(go, 180);
    track(name, details, go);
  }
  window.MMAnalytics = {
    track,
    openProject(slug, source) {
      navigate(MMRoutes.href(slug), 'project_open', {
        project_slug: slug, navigation_source: source
      });
    }
  };
  if (!enabled) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', 'G-39B1KGZ9N4');
  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=G-39B1KGZ9N4';
  document.head.appendChild(tag);
  document.addEventListener('click', event => {
    const link = event.target.closest('a[href]');
    if (!link || event.defaultPrevented) return;
    let name, details;
    if (link.dataset.mmProject) {
      name = 'project_open';
      details = { project_slug: link.dataset.mmProject, navigation_source: 'index' };
    } else if (link.getAttribute('href').startsWith('mailto:')) {
      name = 'contact_click';
      details = { project_slug: MMRoutes.slug, navigation_source: document.documentElement.dataset.mmPage || 'contact' };
    } else return;
    // Preserve modified/new-tab clicks and only briefly defer same-tab navigation.
    if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey &&
        !event.altKey && (!link.target || link.target === '_self')) {
      event.preventDefault();
      navigate(link.href, name, details);
    } else track(name, details);
  });
})();

