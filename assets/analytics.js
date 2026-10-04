(() => {
  'use strict';
  if (window.nubricAnalytics) return;
  const id = 'G-V1934SHMPZ';
  const key = 'nubric-analytics-choice-v1';
  const maxAge = 180 * 24 * 60 * 60 * 1000;
  const production = location.protocol === 'https:' && ['nubric.dev', 'www.nubric.dev'].includes(location.hostname);
  const privacySignal = () => navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  let loaded = false, panel, opener;
  const readChoice = () => {
    try {
      const value = JSON.parse(localStorage.getItem(key));
      return value && typeof value.allowed === 'boolean' && Number.isFinite(value.saved) && value.saved <= Date.now() && Date.now() - value.saved < maxAge ? value.allowed : null;
    } catch { return null; }
  };
  let choice = readChoice();
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window['ga-disable-' + id] = true;
  const denied = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
  window.gtag('consent', 'default', denied);
  function cleanUrl(value) {
    try { const url = new URL(value); return ['http:', 'https:'].includes(url.protocol) ? url.origin + url.pathname : ''; }
    catch { return ''; }
  }
  function enable() {
    if (!production || privacySignal()) return;
    window['ga-disable-' + id] = false;
    window.gtag('consent', 'update', { ...denied, analytics_storage: 'granted' });
    if (loaded) return;
    loaded = true;
    window.gtag('js', new Date());
    window.gtag('config', id, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      page_location: cleanUrl(location.href),
      page_referrer: cleanUrl(document.referrer)
    });
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    tag.dataset.nubricGoogleTag = id;
    document.head.append(tag);
  }
  function disable() {
    window['ga-disable-' + id] = true;
    if (loaded) window.gtag('consent', 'update', denied);
    // Remove this site's GA cookies when permission is withdrawn.
    for (const entry of (document.cookie || '').split(';')) {
      const name = entry.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) continue;
      for (const domain of ['', location.hostname, '.' + location.hostname]) {
        document.cookie = encodeURIComponent(name) + '=; Max-Age=0; path=/; SameSite=Lax; Secure' + (domain ? '; domain=' + domain : '');
      }
    }
  }
  function closePanel() {
    if (!panel) return;
    const focused = panel.contains(document.activeElement);
    panel.hidden = true;
    if (focused && opener) opener.focus({ preventScroll: true });
  }
  function choose(allowed) {
    choice = allowed && !privacySignal();
    try { localStorage.setItem(key, JSON.stringify({ allowed: choice, saved: Date.now() })); } catch { /* Honor this choice for the current page even if storage is blocked. */ }
    choice ? enable() : disable();
    closePanel();
  }
  function showPanel(event) {
    opener = event?.currentTarget || document.querySelector('[data-analytics-settings]');
    panel.hidden = false;
    panel.querySelector('[data-analytics-allow]').disabled = privacySignal();
    panel.querySelector('[data-analytics-signal]').hidden = !privacySignal();
    if (event) panel.querySelector(privacySignal() ? '[data-analytics-decline]' : '[data-analytics-allow]').focus({ preventScroll: true });
  }
  function ready() {
    const legal = document.querySelector('.footer-bottom nav[aria-label="Legal"]');
    if (legal && !legal.querySelector('[data-analytics-settings]')) {
      const settings = document.createElement('button');
      settings.type = 'button'; settings.className = 'analytics-settings';
      settings.dataset.analyticsSettings = ''; settings.textContent = 'Privacy choices'; legal.append(settings);
    }
    panel = document.createElement('section');
    panel.className = 'analytics-choice'; panel.hidden = true;
    panel.setAttribute('role', 'region'); panel.setAttribute('aria-labelledby', 'analytics-choice-title');
    panel.innerHTML = '<div><h2 id="analytics-choice-title">Help us improve Nubric?</h2><p>Optional Google Analytics cookies help us understand visits and improve the website. Your choice won’t affect using the site. <a href="/privacy">Privacy Policy</a></p><p data-analytics-signal hidden>Your browser privacy signal keeps analytics off.</p></div><div class="analytics-choice-actions"><button type="button" data-analytics-allow>Allow analytics</button><button type="button" data-analytics-decline>Decline analytics</button></div>';
    panel.querySelector('[data-analytics-allow]').addEventListener('click', () => choose(true));
    panel.querySelector('[data-analytics-decline]').addEventListener('click', () => choose(false));
    panel.addEventListener('keydown', event => { if (event.key === 'Escape') { closePanel(); } });
    document.body.append(panel);
    document.querySelectorAll('[data-analytics-settings]').forEach(button => button.addEventListener('click', showPanel));
    if (choice === null && !privacySignal()) showPanel();
  }
  window.nubricAnalytics = { open: showPanel };
  if (choice === true && !privacySignal()) enable();
  else if (privacySignal()) disable();
  window.addEventListener('storage', event => {
    if (event.key !== key) return;
    choice = readChoice();
    if (choice === true && !privacySignal()) enable(); else disable();
    if (panel) { if (choice === null && !privacySignal()) showPanel(); else closePanel(); }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', ready, { once: true }); else ready();
})();
