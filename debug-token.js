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
