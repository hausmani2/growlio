import { useState, useEffect, useCallback, useRef } from 'react';
import loadGoogleMaps from './loadGoogleMaps';

/**
 * Custom hook for Google Places Autocomplete search using Google Maps JavaScript API
 * 
 * @param {string} apiKey - Google Maps API key
 * @param {number} debounceMs - Debounce delay in milliseconds (default: 300)
 * @param {string} countryRestriction - Optional country code restriction (e.g., 'us', 'ca')
 * @returns {Object} - { suggestions, loading, error, searchPlaces, clearSuggestions }
 */
const usePlaceSearch = (apiKey, debounceMs = 300, countryRestriction = null) => {
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
    const debounceTimerRef = useRef(null);
    const autocompleteServiceRef = useRef(null);
    const placesServiceRef = useRef(null);
    const mapRef = useRef(null);

    // Load Google Maps API on mount
    useEffect(() => {
        if (!apiKey) {
            setError('Google Maps API key is required');
            return;
        }

        loadGoogleMaps(apiKey)
            .then(() => {
                setIsGoogleMapsLoaded(true);
                // Initialize AutocompleteService
                autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
                
                // Create a dummy map element for PlacesService (required by API)
                const dummyDiv = document.createElement('div');
                mapRef.current = new window.google.maps.Map(dummyDiv);
                placesServiceRef.current = new window.google.maps.places.PlacesService(mapRef.current);
            })
            .catch((err) => {
                setError(`Failed to load Google Maps API: ${err.message}`);
            });
    }, [apiKey]);

    // Clear suggestions
    const clearSuggestions = useCallback(() => {
        setSuggestions([]);
        setError(null);
    }, []);

    // Search places using Google Places Autocomplete Service
    const searchPlaces = useCallback(async (input) => {
        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Clear suggestions if input is empty
        if (!input || input.trim().length === 0) {
            clearSuggestions();
            return;
        }

        // Wait for Google Maps to load
        if (!isGoogleMapsLoaded || !autocompleteServiceRef.current) {
            return;
        }

        // Debounce the API call
        debounceTimerRef.current = setTimeout(() => {
            setLoading(true);
            setError(null);

            try {
                const request = {
                    input: input.trim(),
                    types: ['address'], // Restrict to addresses only
                };

                // Add country restriction if provided
                if (countryRestriction) {
                    request.componentRestrictions = {
                        country: countryRestriction.toLowerCase(),
                    };
                }

                autocompleteServiceRef.current.getPlacePredictions(
                    request,
                    (predictions, status) => {
                        setLoading(false);
                        
                        if (status === window.google.maps.places.PlacesServiceStatus.OK) {
                            setSuggestions(predictions || []);
                        } else if (status === window.google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
                            setSuggestions([]);
                        } else if (status === window.google.maps.places.PlacesServiceStatus.REQUEST_DENIED) {
                            setError('Google Places API request denied. Please check your API key and ensure Places API is enabled.');
                            setSuggestions([]);
                        } else if (status === window.google.maps.places.PlacesServiceStatus.OVER_QUERY_LIMIT) {
                            setError('Google Places API quota exceeded.');
                            setSuggestions([]);
                        } else {
                            setError(`API error: ${status}`);
                            setSuggestions([]);
                        }
                    }
                );
            } catch (err) {
                setLoading(false);
                setError(err.message);
                setSuggestions([]);
            }
        }, debounceMs);
    }, [apiKey, debounceMs, countryRestriction, clearSuggestions, isGoogleMapsLoaded]);

    // Get place details using PlacesService
    const getPlaceDetails = useCallback(async (placeId) => {
        if (!isGoogleMapsLoaded || !placesServiceRef.current) {
            throw new Error('Google Maps API not loaded');
        }

        try {
            setLoading(true);
            setError(null);

            return new Promise((resolve, reject) => {
                const request = {
                    placeId: placeId,
                    fields: ['formatted_address', 'geometry', 'address_components', 'place_id'],
                };

                placesServiceRef.current.getDetails(request, (place, status) => {
                    setLoading(false);
                    
                    if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
                        const location = place.geometry.location;
                        
                        resolve({
                            formatted_address: place.formatted_address,
                            latitude: location.lat(),
                            longitude: location.lng(),
                            place_id: placeId,
                            address_components: place.address_components,
                        });
                    } else {
                        const errorMsg = `Failed to get place details: ${status}`;
                        setError(errorMsg);
                        reject(new Error(errorMsg));
                    }
                });
            });
        } catch (err) {
            setLoading(false);
            setError(err.message);
            throw err;
        }
    }, [isGoogleMapsLoaded]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    return {
        suggestions,
        loading,
        error,
        searchPlaces,
        getPlaceDetails,
        clearSuggestions,
    };
};

export default usePlaceSearch;

