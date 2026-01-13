# Square POS Integration

This module provides a complete integration with Square Point of Sale (POS) system, allowing restaurants to connect their Square account and sync sales data.

## Components

### SquareIntegration
Main component for Square POS integration management. Provides a complete interface for connecting and managing Square integration.

**Usage:**
```jsx
import { SquareIntegration } from './components/square';

<SquareIntegration restaurantId={72} />
```

### SquareConnectButton
Button component that initiates the Square OAuth connection flow.

**Usage:**
```jsx
import { SquareConnectButton } from './components/square';

<SquareConnectButton 
  restaurantId={72}
  onConnect={() => console.log('Connecting...')}
/>
```

### SquareCallbackHandler
Handles the OAuth callback from Square after user authorization. This component should be used as a route handler.

**Usage:**
```jsx
// In your router
<Route path="/square/callback" element={<SquareCallbackHandler />} />
```

### SquareStatusDisplay
Displays the current Square POS connection status with refresh capability.

**Usage:**
```jsx
import { SquareStatusDisplay } from './components/square';

<SquareStatusDisplay 
  restaurantId={72}
  showRefresh={true}
/>
```

## State Management

The Square integration uses Zustand for state management. Access the Square state using:

```jsx
import useStore from '../store/store';

// Get Square status
const squareStatus = useStore((state) => state.squareStatus);
const squareLoading = useStore((state) => state.squareLoading);
const squareError = useStore((state) => state.squareError);
const squareConnectionData = useStore((state) => state.squareConnectionData);

// Actions
const connectSquare = useStore((state) => state.connectSquare);
const checkSquareStatus = useStore((state) => state.checkSquareStatus);
const disconnectSquare = useStore((state) => state.disconnectSquare);
const handleSquareCallback = useStore((state) => state.handleSquareCallback);
```

## API Endpoints

The integration uses the following backend endpoints:

- `GET /square_pos/connect/?restaurant_id={id}` - Initiates Square OAuth connection
- `POST /square_pos/callback/` - Handles OAuth callback with authorization code
- `GET /square_pos/{restaurant_id}/status/` - Checks Square connection status
- `POST /square_pos/{restaurant_id}/disconnect/` - Disconnects Square integration

## OAuth Flow

1. User clicks "Connect Square POS" button
2. User is redirected to Square authorization page
3. User authorizes the application
4. Square redirects to `/square/callback` with authorization code
5. Backend exchanges code for access token
6. Integration status is updated and displayed

## Status Values

- `disconnected` - Square is not connected
- `connecting` - Connection in progress
- `connected` - Square is successfully connected
- `error` - Connection error occurred

## Features

- ✅ OAuth 2.0 authentication flow
- ✅ Connection status checking
- ✅ Error handling and user feedback
- ✅ Automatic status refresh
- ✅ Professional UI with Ant Design components
- ✅ TypeScript-ready structure
- ✅ Comprehensive error messages

## Environment Variables

Make sure your `.env` file includes:

```
VITE_ROOT_URL=http://127.0.0.1:8000
```

## Routes

The integration adds the following routes:

- `/square/callback` - Public route for OAuth callback
- `/dashboard/square` - Protected route for Square integration management

