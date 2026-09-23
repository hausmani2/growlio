import { Modal } from 'antd';
import useStore from '../store/store';

export const SQUARE_RECONNECT_MESSAGE =
  'Your Square connection has expired. Please reconnect Square to import sales again.';

/**
 * Show a non-technical prompt when Square OAuth is dead.
 * Primary action starts the existing Square connect OAuth flow.
 */
export const promptSquareReconnect = ({
  restaurantId,
  message: reconnectMessage = SQUARE_RECONNECT_MESSAGE,
} = {}) => {
  Modal.confirm({
    title: 'Square connection expired',
    content: reconnectMessage || SQUARE_RECONNECT_MESSAGE,
    okText: 'Reconnect Square',
    cancelText: 'Not now',
    closable: true,
    maskClosable: true,
    centered: true,
    onOk: async () => {
      const store = useStore.getState();
      const rid =
        restaurantId ||
        store.getRestaurantIdWithFallback?.() ||
        localStorage.getItem('restaurant_id');
      if (!rid) return;
      // Refresh status so UI shows disconnected, then start OAuth
      try {
        await store.checkSquareStatus?.(rid);
      } catch (_) {
        // ignore — reconnect still proceeds
      }
      await store.connectSquare?.(rid);
    },
  });
};

export const isSquareAuthErrorPayload = (payload) => {
  if (!payload || typeof payload !== 'object') return false;
  return Boolean(
    payload.needs_reconnect ||
      payload.code === 'square_auth_required' ||
      payload?.data?.needs_reconnect ||
      payload?.data?.code === 'square_auth_required'
  );
};

export const getSquareAuthErrorMessage = (errorOrPayload) => {
  const data = errorOrPayload?.response?.data || errorOrPayload;
  if (isSquareAuthErrorPayload(data)) {
    return data.message || data.error || SQUARE_RECONNECT_MESSAGE;
  }
  return null;
};
