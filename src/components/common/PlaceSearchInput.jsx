import { useState, useRef, useEffect } from 'react';
import usePlaceSearch from '../../utils/usePlaceSearch';

/**
 * Professional Google Places Autocomplete Input Component
 * 
 * @param {Function} onSelect - Callback when address is selected: (address, lat, lng) => void
 * @param {string} apiKey - Google Maps API key
 * @param {string} placeholder - Input placeholder text
 * @param {string} value - Controlled input value
 * @param {Function} onChange - Callback for input changes: (value) => void
 * @param {string} countryRestriction - Optional country code restriction (e.g., 'us', 'ca')
 * @param {boolean} disabled - Whether input is disabled
 * @param {string} className - Additional CSS classes
 * @param {boolean} hasError - Whether to show error styling
 */
const PlaceSearchInput = ({
    onSelect,
    apiKey,
    placeholder = 'Search for an address...',
    value = '',
    onChange,
    countryRestriction = null,
    disabled = false,
    className = '',
    hasError = false,
}) => {
    const [inputValue, setInputValue] = useState(value || '');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [isFetchingDetails, setIsFetchingDetails] = useState(false);

    const inputRef = useRef(null);
    const suggestionsRef = useRef(null);
    const containerRef = useRef(null);

    const { suggestions, loading, error, searchPlaces, getPlaceDetails, clearSuggestions } = 
        usePlaceSearch(apiKey, 300, countryRestriction);

    // Sync with external value prop
    useEffect(() => {
        if (value !== undefined && value !== inputValue) {
            setInputValue(value);
        }
    }, [value]);

    // Handle input change
    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        setSelectedIndex(-1);
        
        if (onChange) {
            onChange(newValue);
        }

        if (newValue.trim().length > 0) {
            searchPlaces(newValue);
            setShowSuggestions(true);
        } else {
            clearSuggestions();
            setShowSuggestions(false);
        }
    };

    // Handle address selection
    const handleSelectAddress = async (prediction) => {
        setIsFetchingDetails(true);
        setShowSuggestions(false);
        setInputValue(prediction.description);
        
        if (onChange) {
            onChange(prediction.description);
        }

        try {
            const details = await getPlaceDetails(prediction.place_id);
            
            if (onSelect) {
                onSelect(
                    details.formatted_address,
                    details.latitude,
                    details.longitude,
                    details
                );
            }
        } catch (err) {
            console.error('Error fetching place details:', err);
            // Still update the input value even if details fetch fails
            if (onSelect) {
                onSelect(prediction.description, null, null, null);
            }
        } finally {
            setIsFetchingDetails(false);
            clearSuggestions();
        }
    };

    // Handle keyboard navigation
    const handleKeyDown = (e) => {
        if (!showSuggestions || suggestions.length === 0) {
            if (e.key === 'Enter') {
                e.preventDefault();
            }
            return;
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setSelectedIndex((prev) => 
                    prev < suggestions.length - 1 ? prev + 1 : prev
                );
                break;
            
            case 'ArrowUp':
                e.preventDefault();
                setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
                break;
            
            case 'Enter':
                e.preventDefault();
                if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
                    handleSelectAddress(suggestions[selectedIndex]);
                } else if (suggestions.length > 0) {
                    handleSelectAddress(suggestions[0]);
                }
                break;
            
            case 'Escape':
                e.preventDefault();
                setShowSuggestions(false);
                setSelectedIndex(-1);
                inputRef.current?.blur();
                break;
            
            default:
                break;
        }
    };

    // Handle input focus
    const handleFocus = () => {
        if (suggestions.length > 0) {
            setShowSuggestions(true);
        }
    };

    // Handle input blur (with delay to allow click events)
    const handleBlur = () => {
        // Delay hiding suggestions to allow click events on dropdown items
        setTimeout(() => {
            setShowSuggestions(false);
            setSelectedIndex(-1);
        }, 200);
    };

    // Scroll selected item into view
    useEffect(() => {
        if (selectedIndex >= 0 && suggestionsRef.current) {
            const selectedElement = suggestionsRef.current.children[selectedIndex];
            if (selectedElement) {
                selectedElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            }
        }
    }, [selectedIndex]);

    // Close suggestions when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setShowSuggestions(false);
                setSelectedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div ref={containerRef} className={`relative ${className}`}>
            {/* Input Field */}
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    disabled={disabled || isFetchingDetails}
                    className={`
                        w-full h-11 px-4 pr-10 rounded-lg text-sm
                        border transition-all duration-200
                        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-opacity-50
                        disabled:bg-gray-100 disabled:cursor-not-allowed
                        ${hasError 
                            ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                            : 'border-gray-300 focus:border-orange-500'
                        }
                        ${loading || isFetchingDetails ? 'pr-12' : ''}
                    `}
                />
                
                {/* Loading Spinner */}
                {(loading || isFetchingDetails) && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}

                {/* Search Icon (when not loading) */}
                {!loading && !isFetchingDetails && inputValue && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <svg 
                            className="w-5 h-5 text-gray-400" 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
                            />
                        </svg>
                    </div>
                )}
            </div>

            {/* Error Message */}
            {error && (
                <div className="mt-1 text-xs text-red-500">
                    {error}
                </div>
            )}

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div
                    ref={suggestionsRef}
                    className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                >
                    {suggestions.map((prediction, index) => (
                        <div
                            key={prediction.place_id}
                            onClick={() => handleSelectAddress(prediction)}
                            className={`
                                px-4 py-3 cursor-pointer transition-colors duration-150
                                border-b border-gray-100 last:border-b-0
                                ${index === selectedIndex 
                                    ? 'bg-orange-50 border-l-4 border-l-orange-500' 
                                    : 'hover:bg-gray-50'
                                }
                            `}
                        >
                            <div className="flex items-start gap-3">
                                {/* Location Icon */}
                                <div className="mt-0.5 flex-shrink-0">
                                    <svg 
                                        className={`w-5 h-5 ${
                                            index === selectedIndex ? 'text-orange-500' : 'text-gray-400'
                                        }`}
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" 
                                        />
                                        <path 
                                            strokeLinecap="round" 
                                            strokeLinejoin="round" 
                                            strokeWidth={2} 
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" 
                                        />
                                    </svg>
                                </div>
                                
                                {/* Address Text */}
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900">
                                        {prediction.structured_formatting?.main_text || prediction.description}
                                    </div>
                                    {prediction.structured_formatting?.secondary_text && (
                                        <div className="text-xs text-gray-500 mt-0.5">
                                            {prediction.structured_formatting.secondary_text}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* No Results Message */}
            {showSuggestions && suggestions.length === 0 && !loading && inputValue.trim().length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
                    <div className="text-sm text-gray-500 text-center">
                        No addresses found
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlaceSearchInput;

