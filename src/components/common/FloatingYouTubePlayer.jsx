import React, { useEffect, useMemo, useState } from 'react';
import { Button } from 'antd';
import { CloseOutlined, ExpandOutlined } from '@ant-design/icons';

const EVENT_NAME = 'growlio:youtubePlayer';

const normalizeWatchUrl = (embedUrl) => {
  const raw = String(embedUrl || '');
  const match = raw.match(/youtube\.com\/embed\/([^?]+)/i);
  const id = match?.[1] || null;
  return id ? `https://www.youtube.com/watch?v=${id}` : raw;
};

/**
 * Floating mini YouTube player (bottom-right).
 *
 * Usage:
 * window.dispatchEvent(new CustomEvent('growlio:youtubePlayer', { detail: { action:'open', title, embedUrl } }))
 */
export default function FloatingYouTubePlayer() {
  const [state, setState] = useState({ open: false, title: '', embedUrl: '' });

  useEffect(() => {
    const handler = (e) => {
      const detail = e?.detail || {};
      const action = detail.action;

      if (action === 'close') {
        setState((prev) => ({ ...prev, open: false }));
        return;
      }

      if (action === 'open') {
        setState({
          open: true,
          title: String(detail.title || 'Tutorial'),
          embedUrl: String(detail.embedUrl || ''),
        });
      }
    };

    window.addEventListener(EVENT_NAME, handler);
    return () => window.removeEventListener(EVENT_NAME, handler);
  }, []);

  const iframeSrc = useMemo(() => {
    if (!state.embedUrl) return '';
    // Ensure autoplay when opening in the corner.
    const hasQuery = state.embedUrl.includes('?');
    const base = state.embedUrl;
    const src = `${base}${hasQuery ? '&' : '?'}autoplay=1&rel=0`;
    return src;
  }, [state.embedUrl]);

  if (!state.open) return null;

  return (
    <div
      className="fixed bottom-6 right-6 z-[11000] w-[500px] max-w-[calc(100vw-24px)] rounded-xl overflow-hidden border border-gray-200 bg-white shadow-2xl"
      role="dialog"
      aria-label="Tutorial player"
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2 bg-gray-900">
        <div className="text-xs font-semibold text-white truncate" title={state.title}>
          {state.title}
        </div>
        <div className="flex items-center gap-1">
          <Button
            size="small"
            type="text"
            className="!text-white hover:!text-white/90"
            icon={<ExpandOutlined />}
            onClick={() => {
              const watchUrl = normalizeWatchUrl(state.embedUrl);
              window.open(watchUrl, '_blank', 'noopener,noreferrer');
            }}
            aria-label="Open in new tab"
          />
          <Button
            size="small"
            type="text"
            className="!text-white hover:!text-white/90"
            icon={<CloseOutlined />}
            onClick={() => setState((prev) => ({ ...prev, open: false }))}
            aria-label="Close mini player"
          />
        </div>
      </div>
      <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
        <iframe
          className="absolute inset-0 w-full h-full"
          src={iframeSrc}
          title={state.title || 'Tutorial'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          style={{ border: 0 }}
        />
      </div>
    </div>
  );
}

