import { useEffect, useState, useRef } from 'react';
import { apiGet } from './axiosInterceptors';

const cache = new Map();
const pendingRequests = new Map(); // Track pending requests to prevent duplicate calls

export default function useTooltips(page) {
  const [tooltips, setTooltips] = useState(() => cache.get(page) || {});
  const hasRequestedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!page) return;
      
      // If we already have cached data, use it immediately
      if (cache.has(page)) {
        setTooltips(cache.get(page));
        return;
      }
      
      // If there's already a pending request for this page, wait for it
      if (pendingRequests.has(page)) {
        try {
          const cachedData = await pendingRequests.get(page);
          if (isMounted && cachedData) {
            setTooltips(cachedData);
          }
        } catch (e) {
          // If pending request fails, we'll try again below
        }
        return;
      }
      
      // Prevent duplicate calls from the same component instance
      if (hasRequestedRef.current) {
        return;
      }
      
      // Create a promise for this request and store it
      const requestPromise = (async () => {
        try {
          const res = await apiGet(`/restaurant/tooltips/lookup/?page=${encodeURIComponent(page)}`);
          const data = res.data || {};
          cache.set(page, data);
          pendingRequests.delete(page); // Remove from pending once complete
          return data;
        } catch (e) {
          pendingRequests.delete(page); // Remove from pending on error
          throw e;
        }
      })();
      
      pendingRequests.set(page, requestPromise);
      hasRequestedRef.current = true;
      
      try {
        const data = await requestPromise;
        if (isMounted) {
          setTooltips(data);
        }
      } catch (e) {
        // swallow error
      }
    }
    
    load();
    return () => { 
      isMounted = false;
      // Reset ref when page changes
      if (page) {
        hasRequestedRef.current = false;
      }
    };
  }, [page]);

  return tooltips;
}


