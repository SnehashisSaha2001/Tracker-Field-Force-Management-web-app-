import { useState, useRef, useCallback } from 'react';

interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  address: string;
}

interface GeolocationError {
  code: number;
  message: string;
}

const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`;
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'TrackerApp/1.0' }
    });
    if (!response.ok) throw new Error('Failed to fetch address');
    const data = await response.json();
    return data.display_name || 'Address not found';
  } catch (error) {
    console.error("Reverse geocoding error:", error);
    return 'Could not retrieve address';
  }
};

export const useGeolocation = () => {
  const [location, setLocation] = useState<GeolocationData | null>(null);
  const [error, setError] = useState<GeolocationError | null>(null);
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const watchIdRef = useRef<number | null>(null);

  const handleSuccess = useCallback(async (position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;

    // Accuracy Check: Filter out readings with poor accuracy (> 50 meters)
    if (accuracy > 50) {
      setError({
        code: -1, // Custom code for accuracy error
        message: `Accuracy is low (${accuracy.toFixed(0)}m). For a better signal, try moving to an open area with a clear view of the sky.`,
      });
      return; // Do not update location state with this poor reading
    }

    try {
      const address = await reverseGeocode(latitude, longitude);
      setLocation({ latitude, longitude, accuracy, address });
      setError(null); // Clear previous errors, including accuracy warnings
    } catch (e) {
       setError({ code: -1, message: 'Reverse geocoding failed' });
    }
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    setError({ code: err.code, message: err.message });
    setLocation(null);
  }, []);

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError({ code: -1, message: 'Geolocation is not supported by your browser.' });
      return;
    }

    if (watchIdRef.current !== null) return; // Already tracking

    setIsTracking(true);
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 3000,
    };
    watchIdRef.current = navigator.geolocation.watchPosition(handleSuccess, handleError, options);
  }, [handleSuccess, handleError]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
      setIsTracking(false);
      // setLocation(null); // Optionally clear location on stop
    }
  }, []);
  
  // FIX: Replaced getSingleLocation with a promise-based getFreshLocation to allow awaiting a new location.
  const getFreshLocation = useCallback((): Promise<GeolocationData> => {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            const err = { code: -1, message: 'Geolocation is not supported by your browser.' };
            setError(err);
            return reject(err);
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude, accuracy } = position.coords;

                if (accuracy > 50) {
                    const accError = {
                        code: -1, // Custom code for accuracy error
                        message: `Accuracy is low (${accuracy.toFixed(0)}m). For a better signal, try moving to an open area with a clear view of the sky.`,
                    };
                    setError(accError);
                    return reject(accError);
                }

                try {
                    const address = await reverseGeocode(latitude, longitude);
                    const freshLocation = { latitude, longitude, accuracy, address };
                    setLocation(freshLocation);
                    setError(null); // Clear previous errors
                    resolve(freshLocation);
                } catch (e) {
                    const geocodeError = { code: -1, message: 'Reverse geocoding failed' };
                    setError(geocodeError);
                    reject(geocodeError);
                }
            },
            (err) => {
                handleError(err);
                reject({ code: err.code, message: err.message });
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 } // Get a fresh reading
        );
    });
  }, [handleError]);

  return { location, error, isTracking, startTracking, stopTracking, getFreshLocation };
};