// This script fixes all remaining loading state issues in onBoardingSlice.js
// Run this to update all loading: false to onboardingLoading: false
// and error: message to onboardingError: message

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/store/slices/onBoardingSlice.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace all remaining loading: false with onboardingLoading: false
content = content.replace(/loading: false/g, 'onboardingLoading: false');

// Replace all remaining error: message with onboardingError: message
content = content.replace(/error: errorMessage/g, 'onboardingError: errorMessage');
content = content.replace(/error: null/g, 'onboardingError: null');

// Write back to file
fs.writeFileSync(filePath, content);

