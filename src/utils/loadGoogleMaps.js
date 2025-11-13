/**
 * Utility to load Google Maps JavaScript API script dynamically
 * 
 * @param {string} apiKey - Google Maps API key
 * @returns {Promise} - Resolves when Google Maps API is loaded
 */
let loadPromise = null;
let isLoaded = false;

const loadGoogleMaps = (apiKey) => {
    // Return existing promise if already loading
    if (loadPromise) {
        return loadPromise;
    }

    // Return resolved promise if already loaded
    if (isLoaded && window.google && window.google.maps && window.google.maps.places) {
        return Promise.resolve();
    }

    // Check if script already exists
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
        // Script exists, wait for it to load
        loadPromise = new Promise((resolve, reject) => {
            if (window.google && window.google.maps && window.google.maps.places) {
                isLoaded = true;
                resolve();
            } else {
                existingScript.addEventListener('load', () => {
                    isLoaded = true;
                    resolve();
                });
                existingScript.addEventListener('error', reject);
            }
        });
        return loadPromise;
    }

    // Create new script
    loadPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => {
            isLoaded = true;
            resolve();
        };
        
        script.onerror = () => {
            loadPromise = null;
            reject(new Error('Failed to load Google Maps API'));
        };
        
        document.head.appendChild(script);
    });

    return loadPromise;
};

export default loadGoogleMaps;

