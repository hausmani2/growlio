import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const MEASUREMENT_ID = 'G-DWYBTEG0H0';

// The gtag snippet disables the automatic page view. This component sends one
// page_view per route, including the first load. The last URL is remembered so
// React StrictMode's extra mount in development does not send a second hit.
let lastTrackedUrl = '';

export default function GoogleAnalytics() {
  const location = useLocation();

  useEffect(() => {
    if (typeof window.gtag !== 'function') return;

    const pagePath = `${location.pathname}${location.search}`;
    const pageLocation = `${window.location.origin}${pagePath}`;

    if (lastTrackedUrl === pageLocation) return;
    lastTrackedUrl = pageLocation;

    window.gtag('event', 'page_view', {
      send_to: MEASUREMENT_ID,
      page_path: pagePath,
      page_location: pageLocation,
      page_title: document.title,
    });
  }, [location.pathname, location.search]);

  return null;
}
