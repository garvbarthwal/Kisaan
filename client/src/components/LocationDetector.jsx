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
                    timeout: 20000, // Increased timeout
                    maximumAge: 300000 // Cache position for 5 minutes
                });
            });

            const { latitude, longitude } = position.coords;
            setLocationStatus('Location found! Getting address details...');

            // Use our server-side endpoint to avoid CORS issues
            const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

            let response;
            try {
                response = await fetch(`${API_URL}/api/location/reverse-geocode`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        lat: latitude,
                        lng: longitude
                    })
                });
            } catch (fetchError) {
                throw new Error('Network error: Unable to connect to the server. Please check your internet connection.');
            }

            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch (jsonError) {
                    throw new Error(`Server error: ${response.status} ${response.statusText}`);
                }
                throw new Error(errorData.message || 'Failed to get address from coordinates');
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Failed to get address from coordinates');
            }

            const locationData = result.data;

            setLocationStatus('✓ Location detected successfully!');

            // Call the callback function with the detected location
            onLocationDetected(locationData);

            // Clear status immediately after success
            setTimeout(() => setLocationStatus(null), 500);
        } catch (err) {
            console.error('Error detecting location:', err);
            let errorMessage = 'Error detecting your location';

            if (err.code === 1) {
                errorMessage = 'Location access denied. Please allow location access in your browser and try again.';
            } else if (err.code === 2) {
                errorMessage = 'Location unavailable. Please check your GPS is enabled and you have internet connection.';
            } else if (err.code === 3) {
                errorMessage = 'Location request timed out. Please ensure GPS is enabled and try again.';
            } else if (err.message && err.message.includes('Failed to fetch')) {
                errorMessage = 'Network error. Please check your internet connection and try again.';
            } else if (err.message && err.message.includes('coordinates')) {
                errorMessage = 'Unable to get address for this location. Please enter your address manually.';
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

            {/* Status message - Centered on screen */}
            {(locationStatus || detectingLocation) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 border border-blue-200">
                        <div className="flex items-start gap-4">
                            {detectingLocation && (
                                <div className="animate-spin w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full mt-0.5 flex-shrink-0"></div>
                            )}
                            <div className="flex-1">
                                <p className="text-lg text-blue-800 font-semibold mb-2">
                                    {detectingLocation ? 'Detecting Location...' : 'Location Detection'}
                                </p>
                                <p className="text-sm text-blue-700 mb-3">
                                    {locationStatus || 'Getting your exact coordinates for accurate delivery...'}
                                </p>
                                {detectingLocation && (
                                    <p className="text-sm text-blue-600 italic">
                                        Please allow location access when prompted
                                    </p>
                                )}
                            </div>
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
