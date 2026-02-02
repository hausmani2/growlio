# Regular vs Simulation Users - Implementation Summary

## Overview
This document describes the production-ready solution for handling regular vs simulation users in the React application, including onboarding state management and Training activation flow.

## Architecture

### 1. Decision Layer: `useOnboardingStatus` Hook
**Location:** `src/hooks/useOnboardingStatus.js`

A centralized hook that:
- Centralizes onboarding state from both regular and simulation APIs
- Exposes clear flags for user mode determination:
  - `isRegularUser` - User has regular restaurants
  - `isSimulationUser` - User has only simulation restaurants (no regular)
  - `hasSimulationAccess` - User can access simulation features
  - `hasCompletedRegularOnboarding` - Regular onboarding is complete
  - `hasCompletedSimulationOnboarding` - Simulation onboarding is complete
  - `canAccessTraining` - User can access Training feature
- Provides utility functions:
  - `refreshOnboardingStatus()` - Refresh both APIs in parallel
  - `activateSimulationMode()` - Activate simulation and refresh status

### 2. Login Flow
**Location:** `src/store/slices/authSlice.js`

**Changes:**
- Both APIs are now called **in parallel** using `Promise.allSettled()` for better performance
- APIs called:
  1. `GET /simulation/simulation-onboarding/`
  2. `GET /restaurant_v2/restaurants-onboarding/`
- Results are cached in the store to prevent duplicate calls
- Errors are handled gracefully (simulation API may fail for regular users)

### 3. Training Component
**Location:** `src/components/mainSceens/traning/Traning.jsx`

**Features:**
- **Tab-based UI**: Shows Regular Training and Simulation Training tabs when user has both
- **Modal for incomplete onboarding**: Shows modal when user tries to access Training without completing onboarding
- **Activation flow**: 
  - User clicks "Activate Simulation Training" in modal
  - POST to `/authentication/user/restaurant-simulation/` with `{ restaurant_simulation: true }`
  - Re-fetches both onboarding APIs
  - Redirects to Simulation Training tab
- **Content differentiation**: Different content for regular vs simulation training

### 4. Menu Gating
**Location:** `src/components/layout/Wrapper.jsx`

**Changes:**
- Training menu item is conditionally shown based on `canAccessTraining` flag
- Only users who have completed regular onboarding OR have simulation access can see Training menu

## User Mode Decision Logic

The system handles 4 scenarios:

1. **Only regular restaurant exists** → Normal flow (regular user)
2. **Only simulation restaurant exists** → Simulation-only UI
3. **Both exist** → Treat user as regular (regular user)
4. **Neither exists** → New user (keep existing behavior)

## API Endpoints

### Called on Login (Parallel)
- `GET /simulation/simulation-onboarding/` - Check simulation restaurants
- `GET /restaurant_v2/restaurants-onboarding/` - Check regular restaurants

### Called for Training Activation
- `POST /authentication/user/restaurant-simulation/` 
  - Payload: `{ restaurant_simulation: true }`
- Then re-fetch both onboarding APIs

## Testing Scenarios

### Scenario 1: Regular User (Only Regular Restaurant)
- ✅ User logs in → Both APIs called in parallel
- ✅ Only regular restaurants found → `isRegularUser = true`
- ✅ Training menu visible after onboarding complete
- ✅ Training shows Regular Training tab

### Scenario 2: Simulation User (Only Simulation Restaurant)
- ✅ User logs in → Both APIs called in parallel
- ✅ Only simulation restaurants found → `isSimulationUser = true`
- ✅ Training menu visible
- ✅ Training shows Simulation Training content

### Scenario 3: Both Regular and Simulation
- ✅ User logs in → Both APIs called in parallel
- ✅ Both types found → `isRegularUser = true` (treated as regular)
- ✅ Training shows tabs for both Regular and Simulation

### Scenario 4: New User (Neither)
- ✅ User logs in → Both APIs called in parallel
- ✅ No restaurants found → New user flow
- ✅ Training menu hidden until onboarding complete

### Scenario 5: Regular → Simulation Activation
- ✅ User with incomplete regular onboarding clicks Training
- ✅ Modal appears offering to activate Simulation Training
- ✅ User clicks "Activate Simulation Training"
- ✅ POST to `/authentication/user/restaurant-simulation/`
- ✅ Both APIs re-fetched
- ✅ Redirect to Simulation Training tab
- ✅ Regular UI hidden, simulation-only content shown

## Error Handling

- **API failures**: Handled gracefully with fallbacks
- **Simulation API 403/401**: Expected for regular users, returns empty result
- **Network errors**: User-friendly error messages
- **Loading states**: Proper loading indicators during activation

## Performance Optimizations

- **No duplicate API calls**: Results cached in store (5-minute cache)
- **Parallel API calls**: Both onboarding APIs called simultaneously
- **Memoized calculations**: `useOnboardingStatus` uses `useMemo` for decision logic
- **Global guards**: SessionStorage flags prevent concurrent duplicate calls

## Code Quality

- ✅ Clean separation of concerns
- ✅ Reusable hook pattern
- ✅ Proper TypeScript-ready structure
- ✅ Comprehensive error handling
- ✅ Loading states throughout
- ✅ Easy to extend for future onboarding types

## Files Modified/Created

### Created
- `src/hooks/useOnboardingStatus.js` - Decision layer hook

### Modified
- `src/store/slices/authSlice.js` - Parallel API calls on login
- `src/components/mainSceens/traning/Traning.jsx` - Complete rewrite with activation flow
- `src/components/layout/Wrapper.jsx` - Menu gating logic

## Future Enhancements

- Add more onboarding types (e.g., franchise onboarding)
- Add analytics tracking for Training activation
- Add unit tests for `useOnboardingStatus` hook
- Add integration tests for Training activation flow
