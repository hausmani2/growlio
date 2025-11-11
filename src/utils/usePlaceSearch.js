import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for Google Places Autocomplete search
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
    const debounceTimerRef = useRef(null);
    const abortControllerRef = useRef(null);

    // Clear suggestions
    const clearSuggestions = useCallback(() => {
        setSuggestions([]);
        setError(null);
    }, []);

    // Search places using Google Places Autocomplete API
    const searchPlaces = useCallback(async (input) => {
        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Cancel previous request if any
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Clear suggestions if input is empty
        if (!input || input.trim().length === 0) {
            clearSuggestions();
            return;
        }

        // Debounce the API call
        debounceTimerRef.current = setTimeout(async () => {
            // Create new abort controller for this request
            abortControllerRef.current = new AbortController();
            
            setLoading(true);
            setError(null);

            try {
                // Build the API URL
                const baseUrl = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';
                const params = new URLSearchParams({
                    input: input.trim(),
                    key: apiKey,
                    types: 'address', // Restrict to addresses only
                });

                // Add country restriction if provided
                if (countryRestriction) {
                    params.append('components', `country:${countryRestriction}`);
                }

                const url = `${baseUrl}?${params.toString()}`;

                const response = await fetch(url, {
                    signal: abortControllerRef.current.signal,
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
                    setSuggestions(data.predictions || []);
                } else if (data.status === 'REQUEST_DENIED') {
                    throw new Error('Google Places API request denied. Please check your API key.');
                } else if (data.status === 'OVER_QUERY_LIMIT') {
                    throw new Error('Google Places API quota exceeded.');
                } else {
                    throw new Error(`API error: ${data.status}`);
                }
            } catch (err) {
                // Don't set error if request was aborted
                if (err.name !== 'AbortError') {
                    setError(err.message);
                    setSuggestions([]);
                }
            } finally {
                setLoading(false);
            }
        }, debounceMs);
    }, [apiKey, debounceMs, countryRestriction, clearSuggestions]);

    // Get place details and coordinates using Geocoding API
    const getPlaceDetails = useCallback(async (placeId) => {
        try {
            setLoading(true);
            setError(null);

            const baseUrl = 'https://maps.googleapis.com/maps/api/geocode/json';
            const params = new URLSearchParams({
                place_id: placeId,
                key: apiKey,
            });

            const url = `${baseUrl}?${params.toString()}`;
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'OK' && data.results && data.results.length > 0) {
                const result = data.results[0];
                const location = result.geometry.location;

                return {
                    formatted_address: result.formatted_address,
                    latitude: location.lat,
                    longitude: location.lng,
                    place_id: placeId,
                    address_components: result.address_components,
                };
            } else {
                throw new Error(`Geocoding error: ${data.status}`);
            }
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [apiKey]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
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

