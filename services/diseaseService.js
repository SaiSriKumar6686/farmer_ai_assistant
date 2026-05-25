/**
 * services/diseaseService.js
 *
 * Crop Disease Scan Service — Tier Fallback Chain:
 *   1. Flask cloud backend (local PyTorch model + cloud vision)
 *   2. Gemini Vision Direct SDK (works without Flask)
 *   3. Graceful error message (never crashes the app)
 */
import axios from 'axios';
import { BASE_URL } from './apiConfig';
import { isBackendHealthy, scanDiseaseWithGeminiDirect, resetHealthCache } from './api/gateway';

export const predictDisease = async (imageUri, language = 'en') => {
    // Tier 1: Flask cloud backend (most accurate — uses PyTorch model if available)
    try {
        const healthy = await isBackendHealthy();
        if (healthy) {
            const formData = new FormData();
            formData.append('image', {
                uri: imageUri,
                name: 'crop_scan.jpg',
                type: 'image/jpeg',
            });
            formData.append('language', language);

            const response = await axios.post(`${BASE_URL}/predict`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 35000,
            });

            if (response.data?.success) {
                return {
                    success: true,
                    diagnosis: response.data.diagnosis,
                    confidence: response.data.confidence_score,
                    severity: response.data.visual_severity,
                    recommendation: response.data.recommendation,
                };
            }
            // Backend responded but with error
            if (!response.data?.success && response.data?.error) {
                throw new Error(response.data.error);
            }
        }
    } catch (error) {
        console.warn('[diseaseService] Flask predict failed:', error.message);
        resetHealthCache();
    }

    // Tier 2: Gemini Vision Direct (no Flask required)
    try {
        console.log('[diseaseService] Falling back to Gemini Vision Direct...');
        const geminiResult = await scanDiseaseWithGeminiDirect(imageUri);
        if (geminiResult) {
            return geminiResult;
        }
    } catch (error) {
        console.warn('[diseaseService] Gemini vision failed:', error.message);
    }

    // Tier 3: Graceful failure message
    return {
        success: false,
        error:
            'Disease scanner is temporarily offline. ' +
            'Please ensure you have an internet connection and try again.',
    };
};