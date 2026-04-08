import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Global scroll restoration for SPA route changes.
 * Ensures each navigation starts at the top of the page.
 */
export default function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    try {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    } catch (_) {
      // no-op
    }
  }, [location.pathname]);

  return null;
}

