const DEFAULT_POS_SYNC_PATH = '/ws/pos-sync/';

const getWebSocketBaseUrl = () => {
  const explicitWebSocketUrl = import.meta.env.VITE_POS_SYNC_WS_URL;
  if (explicitWebSocketUrl) {
    return explicitWebSocketUrl;
  }

  const apiBaseUrl = import.meta.env.VITE_ROOT_URL;
  if (!apiBaseUrl) {
    return null;
  }

  const parsedApiUrl = new URL(apiBaseUrl);
  parsedApiUrl.protocol = parsedApiUrl.protocol === 'https:' ? 'wss:' : 'ws:';
  parsedApiUrl.pathname = import.meta.env.VITE_POS_SYNC_WS_PATH || DEFAULT_POS_SYNC_PATH;
  parsedApiUrl.search = '';

  return parsedApiUrl.toString();
};

export const buildPosSyncWebSocketUrl = (restaurantId) => {
  const baseUrl = getWebSocketBaseUrl();
  if (!baseUrl) {
    return null;
  }

  const socketUrl = new URL(baseUrl);
  socketUrl.searchParams.set('restaurant_id', String(restaurantId));
  return socketUrl.toString();
};

export const createPosSyncWebSocket = ({
  restaurantId,
  onCompleted,
  onMessage,
  onError,
  onOpen,
  onClose,
}) => {
  const url = buildPosSyncWebSocketUrl(restaurantId);
  if (!url || typeof window === 'undefined' || typeof window.WebSocket === 'undefined') {
    return null;
  }

  let socket;

  try {
    socket = new window.WebSocket(url);
  } catch (error) {
    onError?.(error);
    return null;
  }

  socket.onopen = () => {
    onOpen?.();
  };

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      onMessage?.(payload);

      const isMatchingCompletionEvent =
        payload?.type === 'POS_SYNC_COMPLETED' &&
        String(payload?.restaurant_id) === String(restaurantId);

      if (isMatchingCompletionEvent) {
        onCompleted?.(payload);
      }
    } catch (error) {
      onError?.(error);
    }
  };

  socket.onerror = (event) => {
    onError?.(event);
  };

  socket.onclose = (event) => {
    onClose?.(event);
  };

  return {
    socket,
    disconnect: () => {
      if (
        socket.readyState === window.WebSocket.OPEN ||
        socket.readyState === window.WebSocket.CONNECTING
      ) {
        socket.close();
      }
    },
  };
};
