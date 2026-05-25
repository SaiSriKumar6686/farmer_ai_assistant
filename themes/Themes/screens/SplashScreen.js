import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Text,
  Animated,
  StyleSheet,
  Dimensions,
  StatusBar,
} from 'react-native';

const { height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  // Logo slides up from below
  const logoSlide  = useRef(new Animated.Value(height * 0.35)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // "by SLaMM Minds" fades in after logo settles
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textSlide   = useRef(new Animated.Value(18)).current;

  // Whole screen fades out at the end
  const screenOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.sequence([
      // 1. Small delay before anything starts
      Animated.delay(200),

      // 2. Logo slides up + fades in
      Animated.parallel([
        Animated.spring(logoSlide, {
          toValue: 0,
          tension: 55,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
      ]),

      // 3. Short pause so the logo settles
      Animated.delay(300),

      // 4. "by SLaMM Minds" slides up + fades in
      Animated.parallel([
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 450,
          useNativeDriver: true,
        }),
        Animated.spring(textSlide, {
          toValue: 0,
          tension: 70,
          friction: 10,
          useNativeDriver: true,
        }),
      ]),

      // 5. Hold for a moment
      Animated.delay(900),

      // 6. Fade whole screen out
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onFinish && onFinish();
    });
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: screenOpacity }]}>
      <StatusBar barStyle="light-content" backgroundColor="#0A2E0A" />

      {/* Background subtle radial glow */}
      <View style={styles.glowCircle} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoWrapper,
          {
            transform: [{ translateY: logoSlide }],
            opacity: logoOpacity,
          },
        ]}
      >
        <Image
          source={require('../assets/images/saagu360-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* "by SLaMM Minds" tagline */}
      <Animated.View
        style={[
          styles.taglineWrapper,
          {
            opacity: textOpacity,
            transform: [{ translateY: textSlide }],
          },
        ]}
      >
        <Text style={styles.by}>by</Text>
        <Text style={styles.brand}>SLaMM Minds</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A2E0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: 340,
    height: 340,
    borderRadius: 170,
    backgroundColor: '#1B5E20',
    opacity: 0.22,
    // Soft bloom behind the logo
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 80,
    elevation: 0,
  },
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  logo: {
    width: 210,
    height: 210,
  },
  taglineWrapper: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 5,
  },
  by: {
    fontSize: 13,
    color: '#A5D6A7',
    letterSpacing: 1.2,
    fontWeight: '400',
  },
  brand: {
    fontSize: 14,
    color: '#E8F5E9',
    letterSpacing: 2.5,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
