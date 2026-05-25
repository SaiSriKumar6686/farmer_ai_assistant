/**
 * services/api/gateway.js
 *
 * UNIFIED API GATEWAY — Single Integration Unit for All Network Calls
 *
 * Architecture:
 *   TIER 1: Render.com Cloud Flask backend (always online, never on your PC)
 *   TIER 2: Direct cloud API calls (Gemini, OpenWeatherMap, data.gov.in)
 *   TIER 3: Firebase Firestore cache (offline-first)
 *   TIER 4: Hardcoded fallback data (absolute last resort — never fails)
 *
 * Usage: Import specific methods from here instead of calling services directly.
 */

import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// ── Resolve the backend URL ────────────────────────────────────────────────
const resolveBackendUrl = () => {
    // 1. Explicit env override (production Render URL)
    if (process.env.EXPO_PUBLIC_API_URL) {
        return process.env.EXPO_PUBLIC_API_URL.trim();
    }

    // 2. Expo dev mode: auto-detect host IP
    try {
        const host =
            Constants?.expoConfig?.hostUri ||
            Constants?.manifest?.debuggerHost ||
            Constants?.manifest2?.extra?.expoGo?.debuggerHost;
        if (host) {
            const ip = host.split(':')[0];
            return `http://${ip}:5000`;
        }
    } catch (_) {}

    // 3. Platform-aware localhost fallback
    const fallback = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
    return `http://${fallback}:5000`;
};

export const BACKEND_URL = resolveBackendUrl();
console.log('[Gateway] Backend URL:', BACKEND_URL);

// ── Axios instance with production-grade config ────────────────────────────
const apiClient = axios.create({
    baseURL: BACKEND_URL,
    timeout: 30000,
    headers: { 'Content-Type': 'application/json' },
});

// Response interceptor: normalize errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const msg = error?.response?.data?.error || error?.message || 'Network error';
        console.warn('[Gateway] API Error:', msg);
        return Promise.reject(error);
    }
);

// ── Backend health check (cached for 60s) ─────────────────────────────────
let _backendHealthy = null;
let _lastHealthCheck = 0;
const HEALTH_CACHE_MS = 60_000; // 60 seconds

export const isBackendHealthy = async () => {
    const now = Date.now();
    if (_backendHealthy !== null && (now - _lastHealthCheck) < HEALTH_CACHE_MS) {
        return _backendHealthy;
    }
    try {
        const res = await axios.get(`${BACKEND_URL}/health`, { timeout: 8000 });
        _backendHealthy = res.status === 200 && res.data?.status === 'ok';
    } catch (_) {
        _backendHealthy = false;
    }
    _lastHealthCheck = Date.now();
    console.log(`[Gateway] Backend health: ${_backendHealthy ? '✅ Online' : '❌ Offline'}`);
    return _backendHealthy;
};

// Force-reset health cache (call after network errors)
export const resetHealthCache = () => {
    _backendHealthy = null;
    _lastHealthCheck = 0;
};

// ── Direct Weather API (bypasses Flask entirely) ───────────────────────────
export const fetchWeatherDirect = async (lat, lon) => {
    const key = process.env.EXPO_PUBLIC_WEATHER_KEY;
    if (!key) return null;
    try {
        const [currentRes, forecastRes] = await Promise.all([
            axios.get(
                `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric`,
                { timeout: 10000 }
            ),
            axios.get(
                `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${key}&units=metric`,
                { timeout: 10000 }
            ),
        ]);
        if (currentRes.data?.cod === 200 || currentRes.data?.cod === '200') {
            return { current: currentRes.data, forecast: forecastRes.data };
        }
        return null;
    } catch (e) {
        console.warn('[Gateway] Direct weather fetch failed:', e.message);
        return null;
    }
};

// ── Direct Gemini chat (bypasses Flask entirely) ───────────────────────────
export const chatWithGeminiDirect = async (prompt, language = 'en') => {
    const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!key) return null;
    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction:
                'You are an expert Indian Agronomist AI. Provide actionable, concise, and accurate farming advice.',
        });
        const result = await model.generateContent(prompt);
        const text = result?.response?.text?.();
        if (text) return text.replace(/\*/g, '').trim();
        return null;
    } catch (e) {
        console.warn('[Gateway] Direct Gemini chat failed:', e.message);
        return null;
    }
};

// ── Direct Gemini Vision (crop disease scan, bypasses Flask entirely) ───────
export const scanDiseaseWithGeminiDirect = async (imageUri) => {
    const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!key) return null;
    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

        // Convert image URI to base64
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });

        const result = await model.generateContent([
            {
                inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64,
                },
            },
            {
                text: (
                    'You are a plant pathologist AI. Analyze this crop leaf image. '
                    + 'Identify the specific disease or state Healthy if no disease is visible. '
                    + 'Respond ONLY with valid JSON: '
                    + '{"diagnosis":"string","confidence":0.0,"severity":"Low|Moderate|High","recommendation":"string"} '
                    + 'No markdown, no explanation.'
                ),
            },
        ]);

        const raw = result?.response?.text?.()?.trim();
        if (!raw) return null;

        const match = raw.match(/\{[\s\S]*\}/);
        if (!match) return null;

        const parsed = JSON.parse(match[0]);
        return {
            success: true,
            diagnosis: parsed.diagnosis || 'Unknown',
            confidence: parseFloat(parsed.confidence ?? 0.7),
            severity: parsed.severity || 'Moderate',
            recommendation: parsed.recommendation || 'Please consult a local agriculture expert.',
        };
    } catch (e) {
        console.warn('[Gateway] Direct Gemini vision failed:', e.message);
        return null;
    }
};

export default apiClient;
