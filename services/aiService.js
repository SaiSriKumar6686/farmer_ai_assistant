/**
 * services/aiService.js
 *
 * AI Advisory Service — Tier Fallback Chain:
 *   1. Flask on Render.com cloud backend (full RAG + translation)
 *   2. Gemini Direct SDK (works without Flask)
 *   3. Static offline message (never crashes the app)
 */
import axios from 'axios';
import { BASE_URL } from './apiConfig';
import { isBackendHealthy, chatWithGeminiDirect, resetHealthCache } from './api/gateway';

// ── Text Chat ─────────────────────────────────────────────────────────────
export const getAIResponse = async (prompt, language = 'en', lat = null, lon = null) => {
    // Tier 1: Flask cloud backend
    try {
        const healthy = await isBackendHealthy();
        if (healthy) {
            const response = await axios.post(
                `${BASE_URL}/chat`,
                { text: prompt, language, lat, lon },
                { timeout: 45000 }
            );
            if (response.data?.success) {
                return response.data.response;
            }
        }
    } catch (error) {
        console.warn('[aiService] Flask chat failed:', error.message);
        resetHealthCache();
    }

    // Tier 2: Direct Gemini SDK (no Flask required)
    try {
        const systemPrompt =
            language !== 'en'
                ? `Answer in the user's language (${language}). Farmer asks: ${prompt}`
                : `Farmer asks: ${prompt}`;
        const geminiResponse = await chatWithGeminiDirect(systemPrompt, language);
        if (geminiResponse) {
            return geminiResponse;
        }
    } catch (error) {
        console.warn('[aiService] Gemini direct failed:', error.message);
    }

    // Tier 3: Offline message
    return (
        'AI advisor is temporarily unavailable. ' +
        'Please check your internet connection and try again in a moment.'
    );
};

// ── Voice Chat ─────────────────────────────────────────────────────────────
export const sendVoiceQuery = async (audioUri, language = 'en', lat = null, lon = null) => {
    // Flask backend only (voice transcription requires server-side processing)
    try {
        const healthy = await isBackendHealthy();
        if (!healthy) {
            return { error: 'Voice AI is temporarily offline. Please type your question instead.' };
        }

        const formData = new FormData();
        formData.append('audio', {
            uri: audioUri,
            type: 'audio/wav',
            name: 'voice_query.wav',
        });
        formData.append('language', language);
        if (lat) formData.append('lat', String(lat));
        if (lon) formData.append('lon', String(lon));

        const response = await axios.post(`${BASE_URL}/voice-chat`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 60000,
        });

        if (response.data?.success) {
            return {
                text: response.data.transcribed_query,
                response: response.data.response,
            };
        }
        return { error: 'Voice processing failed. Please try typing instead.' };
    } catch (error) {
        console.warn('[aiService] Voice chat failed:', error.message);
        resetHealthCache();
        return { error: 'Voice AI is temporarily offline. Please type your question instead.' };
    }
};

// ── Chat History Translation ───────────────────────────────────────────────
export const translateChat = async (texts, language) => {
    if (!texts?.length || language === 'en') return texts;

    // Tier 1: Flask translation backend
    try {
        const healthy = await isBackendHealthy();
        if (healthy) {
            const response = await axios.post(
                `${BASE_URL}/translate`,
                { texts, language },
                { timeout: 20000 }
            );
            if (response.data?.success) {
                // Handle both response shapes from the backend
                return response.data.translated_texts || response.data.translations || null;
            }
        }
    } catch (error) {
        console.warn('[aiService] Translation failed:', error.message);
        resetHealthCache();
    }

    // Tier 2: Return original texts (pass-through — better than crashing)
    return null;
};

// ── JSON Translation (for market prices / schemes data) ───────────────────
export const translateJson = async (payload, language) => {
    if (language === 'en') return payload;

    try {
        const healthy = await isBackendHealthy();
        if (healthy) {
            const response = await axios.post(
                `${BASE_URL}/translate-json`,
                { payload, language },
                { timeout: 60000 }
            );
            if (response.data?.success) {
                return response.data.translated;
            }
        }
    } catch (error) {
        console.warn('[aiService] JSON translation failed:', error.message);
    }

    return payload; // Graceful degradation: stay in English
};