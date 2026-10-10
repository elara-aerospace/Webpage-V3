/* Cloudflare Web Analytics. This is a public beacon token, NEVER an API key. */
(() => {
  'use strict';
  const config = {
    enabled: false,
    token: '',
    hostnames: ['elara-aerospace.com', 'www.elara-aerospace.com'],
  };
  const consentKey = 'elara_cookie_consent';
  let started = false;
  function consent() {
    try { return JSON.parse(localStorage.getItem(consentKey) || 'null')?.telemetry === true; }
    catch { return false; }
  }
  function update() {
    if (!consent()) {
      // Removing the tag alone cannot stop listeners installed by a loaded beacon.
      if (started) window.location.reload();
      return;
    }
    if (started || !config.enabled || !/^[a-f0-9]{32}$/i.test(config.token)) return;
    if (location.protocol !== 'https:' || !config.hostnames.includes(location.hostname)) return;
    if (navigator.globalPrivacyControl === true || navigator.doNotTrack === '1') return;
    // Avoid collecting URLs that might contain submitted or account-specific data.
    if (location.search || location.hash) return;
    if (document.querySelector('script[data-cf-beacon]')) return;
    const script = document.createElement('script');
    script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    script.defer = true;
    script.dataset.cfBeacon = JSON.stringify({ token: config.token, spa: false });
    script.addEventListener('error', () => { script.remove(); started = false; });
    started = true;
    document.head.appendChild(script);
  }
  window.addEventListener('elara_cookie_consent_changed', update);
  window.addEventListener('storage', event => { if (event.key === consentKey || event.key === null) update(); });
  update();
})();
