/**
 * services/weatherService.js
 *
 * Weather Service — Tier Fallback Chain:
 *   1. Flask cloud backend (proxied + cached)
 *   2. Direct OpenWeatherMap API call (works without Flask)
 *   3. Returns null (screens handle the empty state gracefully)
 */
import axios from 'axios';
import * as Location from 'expo-location';
import { BASE_URL } from './apiConfig';
import { isBackendHealthy, fetchWeatherDirect, resetHealthCache } from './api/gateway';

// Default location: Khammam, Telangana (agricultural heartland)
const DEFAULT_LAT = 17.2473;
const DEFAULT_LON = 80.1514;

// ── Fetch device GPS location (with timeout guard) ─────────────────────────
const getDeviceLocation = async () => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return { lat: DEFAULT_LAT, lon: DEFAULT_LON };

        const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeout: 5000,
        });
        return { lat: loc.coords.latitude, lon: loc.coords.longitude };
    } catch (_) {
        console.log('[weatherService] GPS timed out — using default location');
        return { lat: DEFAULT_LAT, lon: DEFAULT_LON };
    }
};

// ── Main export ────────────────────────────────────────────────────────────
export const fetchWeather = async () => {
    const { lat, lon } = await getDeviceLocation();

    // Tier 1: Flask cloud backend (proxied weather)
    try {
        const healthy = await isBackendHealthy();
        if (healthy) {
            const response = await axios.get(`${BASE_URL}/weather`, {
                params: { lat, lon },
                timeout: 12000,
            });
            if (response.data?.success) {
                return {
                    current: response.data.current,
                    forecast: response.data.forecast,
                };
            }
        }
    } catch (error) {
        console.warn('[weatherService] Flask weather failed:', error.message);
        resetHealthCache();
    }

    // Tier 2: Direct OpenWeatherMap API
    const directData = await fetchWeatherDirect(lat, lon);
    if (directData) {
        console.log('[weatherService] Serving via direct OpenWeatherMap API');
        return directData;
    }

    // Tier 3: Null — screens show retry button
    console.warn('[weatherService] All weather sources failed');
    return null;
};
