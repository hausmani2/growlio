/**
 * Example usage of PlaceSearchInput component
 * 
 * This file demonstrates how to use the PlaceSearchInput component
 * in your React application.
 */

import { useState } from 'react';
import PlaceSearchInput from './PlaceSearchInput';

const ExampleUsage = () => {
    const [address, setAddress] = useState('');
    const [coordinates, setCoordinates] = useState(null);

    // Get Google Maps API key from environment variables
    const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    // Handle address selection
    const handleAddressSelect = (formattedAddress, latitude, longitude, details) => {
        
        setAddress(formattedAddress);
        setCoordinates({ latitude, longitude });
    };

    // Handle input change
    const handleInputChange = (value) => {
        setAddress(value);
    };

    return (
        <div className="p-6 max-w-md mx-auto">
            <h2 className="text-2xl font-bold mb-4">Address Search Example</h2>
            
            <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Address <span className="text-red-500">*</span>
                </label>
                <PlaceSearchInput
                    apiKey={GOOGLE_MAPS_API_KEY}
                    placeholder="Search for an address..."
                    value={address}
                    onChange={handleInputChange}
                    onSelect={handleAddressSelect}
                    // Optional: Restrict to specific country
                    // countryRestriction="us" // or "ca"
                />
            </div>

            {address && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                        <strong>Address:</strong> {address}
                    </p>
                    {coordinates && (
                        <p className="text-sm text-gray-600 mt-2">
                            <strong>Coordinates:</strong> {coordinates.latitude}, {coordinates.longitude}
                        </p>
                    )}
                </div>
            )}

            {!GOOGLE_MAPS_API_KEY && (
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> Add VITE_GOOGLE_MAPS_API_KEY to your .env file to enable address autocomplete.
                    </p>
                </div>
            )}
        </div>
    );
};

export default ExampleUsage;

