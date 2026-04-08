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

    // Most dashboard screens scroll inside the layout container (not the window).
    // Reset that container too so every route starts at the top.
    try {
      const container = document.querySelector('[data-app-scroll-container="true"]');
      if (container && typeof container.scrollTo === 'function') {
        container.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      } else if (container) {
        container.scrollTop = 0;
        container.scrollLeft = 0;
      }
    } catch (_) {
      // no-op
    }
  }, [location.pathname]);

  return null;
}

