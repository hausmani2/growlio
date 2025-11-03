# Super Admin Token Management System

## Overview

This document explains the token management system for super admin impersonation functionality in the Growlio application. The system ensures proper token isolation and restoration when switching between super admin and impersonated user contexts.

## Problem Statement

The original implementation had two critical issues:

1. **User Management Token Issue**: When accessing user management while impersonating, the system was using the impersonation token instead of the super admin token, causing permission errors.

2. **Stop Impersonation Issue**: The `stopImpersonation` function was clearing all tokens instead of just the impersonation tokens, causing the super admin to be logged out.

## Solution Architecture

### Token Types

The system manages three types of tokens:

1. **Super Admin Token**: The original super admin's authentication token
2. **Impersonation Token**: The token for the impersonated user
3. **Main Token**: The currently active token (switches between the above two)

### Key Components

#### 1. Token Manager (`src/utils/tokenManager.js`)

Centralized utility for managing all token operations:

- `isImpersonating()`: Check if currently impersonating
- `storeImpersonationData()`: Store impersonation tokens and data
- `storeOriginalSuperAdminData()`: Store original super admin data
- `clearImpersonationData()`: Clear only impersonation data
- `restoreSuperAdminToken()`: Restore super admin token and data
- `withSuperAdminToken()`: Execute API calls with super admin token

#### 2. Super Admin Slice (`src/store/slices/superAdminSlice.js`)

Updated to use the token manager for all operations:

- `fetchAllUsers()`: Uses super admin token for user management
- `fetchRecentUsers()`: Uses super admin token for user data
- `impersonateUser()`: Properly stores tokens and data
- `stopImpersonation()`: Only clears impersonation data, preserves super admin token

#### 3. Axios Interceptors (`src/utils/axiosInterceptors.js`)

Handles token switching for API requests:

- Automatically uses the main token for requests
- The token manager switches tokens as needed

## Token Flow

### 1. Super Admin Login

```
Super Admin Logs In → Main Token = Super Admin Token
```

### 2. Start Impersonation

```
1. Store original super admin data
2. Call impersonation API
3. Store impersonation data
4. Switch main token to impersonation token
5. Redirect to user dashboard
```

### 3. User Management (While Impersonating)

```
1. Check if impersonating
2. Temporarily switch to super admin token
3. Make API call
4. Restore impersonation token
```

### 4. Stop Impersonation

```
1. Clear impersonation data
2. Restore super admin token
3. Restore super admin user data
4. Clear temporary storage
5. Redirect to super admin dashboard
```

## Local Storage Keys

### Super Admin Keys
- `original_superadmin_token`: Original super admin access token
- `original_superadmin_refresh`: Original super admin refresh token
- `original_superadmin`: Original super admin user data
- `original_restaurant_id`: Original restaurant ID

### Impersonation Keys
- `impersonated_user`: Impersonated user email
- `impersonated_user_data`: Impersonated user data
- `impersonation_access_token`: Impersonation access token
- `impersonation_refresh_token`: Impersonation refresh token
- `impersonation_message`: Impersonation message

### Main Token
- `token`: Currently active token (switches between super admin and impersonation)

## API Endpoints

### User Management
- `/authentication/users/` - Uses super admin token
- `/admin_access/dashboard/` - Uses super admin token

### Impersonation
- `/admin_access/impersonate/` - Uses super admin token
- `/restaurant/restaurants-onboarding/` - Uses impersonation token

## Error Handling

### Token Restoration Failure
If token restoration fails during stop impersonation:
1. Clear all persisted state
2. Redirect to login page
3. Log error for debugging

### API Call Failures
If API calls fail due to token issues:
1. Check token type
2. Switch to appropriate token
3. Retry request
4. Log errors for debugging

## Debugging

### Token Debugger Component
Use `TokenDebugger` component to debug token state:

```jsx
import TokenDebugger from '../debug/TokenDebugger';

// Add to your component
<TokenDebugger />
```

### Debug Functions
```javascript
import { debugTokenState, getCurrentTokenType } from '../utils/tokenManager';

// Log current token state
debugTokenState();

// Get current token type
const tokenType = getCurrentTokenType();
```

## Testing

### Test Scenarios

1. **Super Admin Login**: Verify super admin token is stored
2. **Start Impersonation**: Verify impersonation data is stored and main token switches
3. **User Management**: Verify super admin token is used for user operations
4. **Stop Impersonation**: Verify only impersonation data is cleared, super admin token is restored
5. **Multiple Impersonations**: Verify proper token switching between different users

### Test Commands

```bash
# Check for linting errors
npm run lint

# Run tests (if available)
npm test
```

## Security Considerations

1. **Token Isolation**: Super admin and impersonation tokens are kept separate
2. **Automatic Cleanup**: Temporary tokens are cleared after use
3. **Error Recovery**: Failed operations don't leave the system in an inconsistent state
4. **Audit Trail**: All token operations are logged for debugging

## Migration Notes

### Breaking Changes
- Token management functions have been moved to a separate utility
- Local storage keys have been standardized
- API calls now automatically handle token switching

### Backward Compatibility
- Existing super admin functionality remains unchanged
- Only impersonation-related operations have been updated
- No changes to user-facing interfaces

## Troubleshooting

### Common Issues

1. **Permission Denied**: Check if using correct token type
2. **Token Not Found**: Verify token storage and restoration
3. **Infinite Redirects**: Check token switching logic
4. **Data Loss**: Verify original data is properly stored

### Debug Steps

1. Check browser console for errors
2. Use TokenDebugger component
3. Verify local storage contents
4. Test token switching manually
5. Check API response headers

## Future Enhancements

1. **Token Refresh**: Automatic token refresh for long sessions
2. **Session Management**: Better session handling across tabs
3. **Audit Logging**: Comprehensive audit trail for all operations
4. **Performance**: Optimize token switching for better performance
