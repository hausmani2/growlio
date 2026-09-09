/** Parse Growlio restaurant/location ids from Square OAuth state (e.g. "279:394"). */
export const parseOAuthState = (raw) => {
  if (!raw) return { restaurantId: null, locationId: null };
  const str = String(raw);
  if (str.includes(':')) {
    const [restPart, locPart] = str.split(':', 2);
    const restaurantId = Number.parseInt(restPart, 10);
    const locationId = Number.parseInt(locPart, 10);
    return {
      restaurantId: Number.isFinite(restaurantId) ? restaurantId : null,
      locationId: Number.isFinite(locationId) ? locationId : null,
    };
  }
  const restaurantId = Number.parseInt(str, 10);
  return {
    restaurantId: Number.isFinite(restaurantId) ? restaurantId : null,
    locationId: null,
  };
};

export const ONBOARDING_SCORE_SQUARE_KEY = 'square_from_onboarding_score';

export const markSquareConnectFromOnboardingScore = () => {
  try {
    sessionStorage.setItem(ONBOARDING_SCORE_SQUARE_KEY, 'true');
  } catch {
    // ignore storage errors
  }
};

export const isSquareConnectFromOnboardingScore = () => {
  try {
    return sessionStorage.getItem(ONBOARDING_SCORE_SQUARE_KEY) === 'true';
  } catch {
    return false;
  }
};

export const clearSquareConnectFromOnboardingScore = () => {
  try {
    sessionStorage.removeItem(ONBOARDING_SCORE_SQUARE_KEY);
  } catch {
    // ignore storage errors
  }
};
