// Debug script to test token validation
// Run this in browser console to test token functionality

// Test token validation function
const isValidToken = (token) => {
  if (!token || typeof token !== 'string') {
    return false;
  }
  
  // Basic JWT token validation (should have 3 parts separated by dots)
  const parts = token.split('.');
  if (parts.length !== 3) {
    return false;
  }
  
  // Check if parts are not empty
  if (!parts[0] || !parts[1] || !parts[2]) {
    return false;
  }
  
  return true;
};

// Test current localStorage token
console.log('=== Token Debug ===');
const currentToken = localStorage.getItem('token');
console.log('Current token from localStorage:', currentToken);
console.log('Token type:', typeof currentToken);
console.log('Token length:', currentToken ? currentToken.length : 0);
console.log('Is valid token:', isValidToken(currentToken));

// Test various token scenarios
console.log('\n=== Token Validation Tests ===');
console.log('null token:', isValidToken(null));
console.log('undefined token:', isValidToken(undefined));
console.log('empty string:', isValidToken(''));
console.log('invalid format:', isValidToken('invalid.token'));
console.log('missing parts:', isValidToken('part1.part2'));
console.log('empty parts:', isValidToken('..'));

// Check Zustand store state (if available)
if (window.__ZUSTAND_DEVTOOLS__) {
  console.log('\n=== Zustand Store State ===');
  console.log('Store state:', window.__ZUSTAND_DEVTOOLS__.getState());
} 