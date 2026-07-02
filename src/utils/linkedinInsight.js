const DEFAULT_LINKEDIN_PARTNER_ID = '9549228';

function getPartnerId() {
  return String(
    import.meta?.env?.VITE_LINKEDIN_PARTNER_ID || DEFAULT_LINKEDIN_PARTNER_ID,
  );
}

function ensureLintrkQueue() {
  if (typeof window === 'undefined') return;
  if (window.lintrk && typeof window.lintrk === 'function') return;

  window.lintrk = function lintrkProxy(a, b) {
    window.lintrk.q.push([a, b]);
  };
  window.lintrk.q = window.lintrk.q || [];
}

function ensureInsightScript() {
  if (typeof document === 'undefined') return;
  if (document.querySelector('script[data-growlio-linkedin-insight="true"]')) return;

  const firstScript = document.getElementsByTagName('script')[0];
  const script = document.createElement('script');
  script.type = 'text/javascript';
  script.async = true;
  script.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';
  script.setAttribute('data-growlio-linkedin-insight', 'true');
  firstScript?.parentNode?.insertBefore(script, firstScript);
}

export function initLinkedInInsightTag() {
  if (typeof window === 'undefined') return;

  const partnerId = getPartnerId();
  // Avoid re-initializing if already set (e.g. HMR / re-mounts)
  if (window._linkedin_partner_id === partnerId) return;

  window._linkedin_partner_id = partnerId;
  window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
  if (!window._linkedin_data_partner_ids.includes(partnerId)) {
    window._linkedin_data_partner_ids.push(partnerId);
  }

  ensureLintrkQueue();
  ensureInsightScript();
}

export function trackLinkedInSignupConversion() {
  if (typeof window === 'undefined') return;

  initLinkedInInsightTag();

  const conversionId = import.meta?.env?.VITE_LINKEDIN_CONVERSION_ID;
  if (!conversionId) return;

  try {
    if (typeof window.lintrk === 'function') {
      window.lintrk('track', { conversion_id: conversionId });
    }
  } catch (e) {
    // Ignore tracking failures (ad blockers, CSP, etc.)
  }
}

