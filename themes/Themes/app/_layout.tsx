import React, { useState, useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import {
  View,
  Image,
  Text,
  Animated,
  StyleSheet,
  Easing,
  StatusBar,
} from 'react-native';

// ─── PhonePe-style Splash ────────────────────────────────────────────────────
// 1. Screen snaps in (instant, already visible)
// 2. Logo scales from 0.72 → 1.0 + fades in  (smooth, ~700ms)
// 3. "by SLaMM Minds" fades in below          (~400ms, slight delay)
// 4. Brief hold                                (~800ms)
// 5. Whole screen fades out                    (~400ms)
// ─────────────────────────────────────────────────────────────────────────────

function SplashAnimation({ onFinish }: { onFinish: () => void }) {
  // Logo: scale + opacity
  const logoScale   = useRef(new Animated.Value(0.72)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // Tagline
  const textOpacity = useRef(new Animated.Value(0)).current;

  // Whole screen out
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // tiny breath before anything moves
      Animated.delay(150),

      // Logo scales up + fades in — the PhonePe feel
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 700,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),

      // "by SLaMM Minds" fades in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),

      // Hold — user sees the branding
      Animated.delay(800),

      // Fade entire screen out cleanly
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 420,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => onFinish());
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0D3B0D" />

      {/* Logo — scales from center, PhonePe style */}
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            opacity: logoOpacity,
            transform: [{ scale: logoScale }],
          },
        ]}
      >
        <Image
          source={require('../assets/images/saagu360-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* "by SLaMM Minds" — fades in below logo */}
      <Animated.View style={[styles.taglineWrapper, { opacity: textOpacity }]}>
        <Text style={styles.by}>by</Text>
        <Text style={styles.brand}>SLaMM Minds</Text>
      </Animated.View>
    </Animated.View>
  );
}

// ─── Root Layout ─────────────────────────────────────────────────────────────

export default function RootLayout() {
  const [splashDone, setSplashDone] = useState(false);

  if (!splashDone) {
    return <SplashAnimation onFinish={() => setSplashDone(true)} />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D3B0D',   // deep dark green — brand anchor
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  logo: {
    width: 200,
    height: 200,
  },
  taglineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  by: {
    fontSize: 13,
    color: '#81C784',            // muted green
    letterSpacing: 1.5,
    fontWeight: '400',
  },
  brand: {
    fontSize: 14,
    color: '#E8F5E9',            // near-white
    letterSpacing: 3,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
