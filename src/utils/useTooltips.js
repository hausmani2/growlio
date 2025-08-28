import { useEffect, useState } from 'react';
import { apiGet } from './axiosInterceptors';

const cache = new Map();

export default function useTooltips(page) {
  const [tooltips, setTooltips] = useState(() => cache.get(page) || {});

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!page) return;
      if (cache.has(page)) {
        setTooltips(cache.get(page));
        return;
      }
      try {
        const res = await apiGet(`/restaurant/tooltips/lookup/?page=${encodeURIComponent(page)}`);
        if (isMounted) {
          cache.set(page, res.data || {});
          setTooltips(res.data || {});
        }
      } catch (e) {
        // swallow
      }
    }
    load();
    return () => { isMounted = false; };
  }, [page]);

  return tooltips;
}


