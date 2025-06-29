import { useState } from 'react';
import { FaLocationArrow } from 'react-icons/fa';

/**
 * LocationDetector Component
 * 
 * This component provides a button to detect the user's current location
 * and autofill the address fields with exact coordinates stored in database.
 * Displays user-friendly address while storing precise coordinates.
 * 
 * @param {Function} onLocationDetected - Callback function that receives the location data
 * @param {Boolean} isLoading - Optional prop to show loading state
 * @param {String} variant - Display variant ('button' or 'compact')
 * @returns {JSX.Element} - A location detection button component
 */
const LocationDetector = ({ onLocationDetected, isLoading = false, variant = 'button' }) => {
    const [detectingLocation, setDetectingLocation] = useState(false);
    const [error, setError] = useState(null);
    const [locationStatus, setLocationStatus] = useState(null);

    const detectLocation = async () => {
        setError(null);
        setDetectingLocation(true);
        setLocationStatus('Requesting location permission...');

        try {
            // Check if geolocation is supported by the browser
            if (!navigator.geolocation) {
                throw new Error('Geolocation is not supported by your browser');
            }

            setLocationStatus('Waiting for location permission...');

            // Get current position with high accuracy
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                });
            });

            const { latitude, longitude } = position.coords;
            setLocationStatus('Location found! Getting address details...');

            // Use reverse geocoding to get address details
            // Using OpenStreetMap's Nominatim service (free, no API key required)
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`
            );

            if (!response.ok) {
                throw new Error('Failed to get address from coordinates');
            }

            const data = await response.json();
            const address = data.address;

            // Extract detailed address components
            const locationData = {
                street: address.house_number && address.road
                    ? `${address.house_number} ${address.road}`
                    : address.road || address.pedestrian || address.neighbourhood || '',
                city: address.city || address.town || address.village || address.municipality || address.county || '',
                state: address.state || address.province || address.region || '',
                zipCode: address.postcode || '',
                coordinates: {
                    lat: parseFloat(latitude),
                    lng: parseFloat(longitude)
                },
                locationDetected: true,
                fullAddress: data.display_name // Store full address for reference
            };

            setLocationStatus('✓ Location detected successfully!');

            // Call the callback function with the detected location
            onLocationDetected(locationData);

            // Clear status after success
            setTimeout(() => setLocationStatus(null), 3000);
        } catch (err) {
            console.error('Error detecting location:', err);
            let errorMessage = 'Error detecting your location';

            if (err.code === 1) {
                errorMessage = 'Location access denied. Please allow location access in your browser and try again.';
            } else if (err.code === 2) {
                errorMessage = 'Location unavailable. Please check your GPS is enabled and you have internet connection.';
            } else if (err.code === 3) {
                errorMessage = 'Location request timed out. Please ensure GPS is enabled and try again.';
            } else if (err.message) {
                errorMessage = err.message;
            }

            setError(errorMessage);
            setLocationStatus(null);
        } finally {
            setDetectingLocation(false);
        }
    };

    return (
        <div className="relative">
            <button
                type="button"
                onClick={detectLocation}
                disabled={detectingLocation || isLoading}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ${variant === 'compact' ? 'text-xs px-2 py-1' : ''
                    } ${detectingLocation || isLoading
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:shadow-sm active:bg-blue-200'
                    }`}
                title="Detect my current location with high accuracy"
            >
                <FaLocationArrow className={`${detectingLocation ? 'animate-pulse' : ''} ${variant === 'compact' ? 'text-xs' : ''
                    }`} />
                <span className="whitespace-nowrap">
                    {detectingLocation ? 'Detecting...' : 'Detect Location'}
                </span>
            </button>

            {/* Status message */}
            {(locationStatus || detectingLocation) && (
                <div className="absolute top-full left-0 mt-2 w-80 max-w-sm p-4 bg-blue-50 border border-blue-200 rounded-lg shadow-lg z-20">
                    <div className="flex items-start gap-3">
                        {detectingLocation && (
                            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full mt-0.5 flex-shrink-0"></div>
                        )}
                        <div className="flex-1">
                            <p className="text-sm text-blue-800 font-medium mb-1">
                                {detectingLocation ? 'Detecting Location...' : 'Location Detection'}
                            </p>
                            <p className="text-xs text-blue-700">
                                {locationStatus || 'Getting your exact coordinates for accurate delivery...'}
                            </p>
                            {detectingLocation && (
                                <p className="text-xs text-blue-600 mt-2 italic">
                                    Please allow location access when prompted
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Error message */}
            {error && (
                <div className="absolute top-full left-0 mt-2 w-80 max-w-sm p-4 bg-red-50 border border-red-200 rounded-lg shadow-lg z-20">
                    <div className="flex items-start gap-3">
                        <div className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0">⚠️</div>
                        <div className="flex-1">
                            <p className="text-sm text-red-800 font-medium mb-1">Location Detection Failed</p>
                            <p className="text-xs text-red-700 mb-2">{error}</p>
                            <button
                                onClick={() => setError(null)}
                                className="text-xs text-red-600 hover:text-red-800 underline font-medium"
                            >
                                Try again
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LocationDetector;
