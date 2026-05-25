/**
 * firebase/config.js
 * Firebase initialization for Kisan AI Shield (Saagu360 project)
 *
 * Platform-aware auth persistence:
 *   - React Native (iOS/Android): AsyncStorage persistence (survives app restarts)
 *   - Web: browserLocalPersistence (survives page refreshes)
 */
import { Platform } from 'react-native';
import { initializeApp } from 'firebase/app';
import { initializeFirestore, memoryLocalCache, getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);

// ── Firestore ──────────────────────────────────────────────────────────────
let db;
try {
    db = initializeFirestore(app, {
        localCache: memoryLocalCache(),
    });
    console.log('[Firebase] Firestore initialized with memory cache.');
} catch (e) {
    console.warn('[Firebase] Primary Firestore init failed, falling back:', e.message);
    db = getFirestore(app);
}

// ── Auth — platform-aware persistence ─────────────────────────────────────
let auth;
const initAuth = async () => {
    try {
        const { initializeAuth } = await import('firebase/auth');

        if (Platform.OS === 'web') {
            const { getAuth, browserLocalPersistence, setPersistence } = await import('firebase/auth');
            const webAuth = getAuth(app);
            await setPersistence(webAuth, browserLocalPersistence);
            auth = webAuth;
        } else {
            const { getReactNativePersistence } = await import('firebase/auth');
            const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
            auth = initializeAuth(app, {
                persistence: getReactNativePersistence(AsyncStorage),
            });
        }
        console.log(`[Firebase] Auth initialized (${Platform.OS} persistence).`);
    } catch (e) {
        console.warn('[Firebase] Auth init failed:', e.message);
        // Fallback: use default auth without custom persistence
        const { getAuth } = await import('firebase/auth');
        auth = getAuth(app);
    }
};

// Initialize auth on module load (non-blocking)
initAuth();

export { db, auth };
export default app;
