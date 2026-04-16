import React, { useEffect } from 'react';

const SyncModal = ({ open }) => {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const preventEscapeClose = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', preventEscapeClose, true);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', preventEscapeClose, true);
    };
  }, [open]);

  if (!open) {
    return null;
  }

  return (
    <div
      aria-live="assertive"
      aria-modal="true"
      role="dialog"
      data-testid="sync-modal"
      className="fixed inset-0 z-[9999] flex items-center justify-center backdrop-blur-xl bg-black/30"
    >
      <div className="mx-4 flex w-full max-w-md flex-col items-center rounded-2xl bg-white/90 px-8 py-10 text-center shadow-2xl">
        <div
          data-testid="sync-loader"
          aria-hidden="true"
          className="h-14 w-14 animate-spin rounded-full border-4 border-orange-200 border-t-orange-600"
        />
        <div
          data-testid="sync-status-text"
          className="mt-6 space-y-2 text-center"
        >
          <p className="text-xl font-semibold text-gray-900">Syncing your POS data...</p>
          <p className="text-sm text-gray-600">
            Please wait, this may take up to a minute.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SyncModal;
