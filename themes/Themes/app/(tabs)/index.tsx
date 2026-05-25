import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

// ─── Mock data (replace with real API calls) ───────────────────────
const WEATHER = {
  location: 'Mudigonda, Telangana',
  temp: '35.7°C',
  condition: 'Clear Sky ☀',
  rainChance: 5,
  advice: 'Safe to Irrigate Today',
};

const MANDI = [
  { name: 'Rice',  price: '₹2,134', change: -2.98, up: false },
  { name: 'Wheat', price: '₹2,081', change: -0.89, up: false },
  { name: 'Maize', price: '₹1,761', change: +1.20, up: true  },
];

export default function HomeScreen() {
  const router = useRouter();

  const rainColor = WEATHER.rainChance < 20 ? '#2E7D32' : '#E65100';
  const rainLabel = WEATHER.rainChance < 20
    ? '✅  Safe to Irrigate'
    : '⚠️  Delay Irrigation — Rain likely';

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>

        {/* ── HEADER BANNER ── */}
        <View style={s.header}>
          <View style={s.headerGlow} />
          <View style={s.headerRow}>
            <View>
              <Text style={s.greet}>ನಮಸ್ಕಾರ 🙏  Welcome back</Text>
              <Text style={s.farmName}>Kisan's Farm</Text>
              <Text style={s.location}>📍 {WEATHER.location}</Text>
            </View>
            <View style={s.avatar}>
              <Text style={{ fontSize: 32 }}>👨‍🌾</Text>
            </View>
          </View>

          {/* Rain alert pill */}
          <View style={[s.rainPill, { backgroundColor: WEATHER.rainChance < 20 ? 'rgba(165,214,167,0.25)' : 'rgba(255,152,0,0.25)' }]}>
            <Text style={[s.rainText, { color: WEATHER.rainChance < 20 ? '#A5D6A7' : '#FFB74D' }]}>
              {rainLabel}
            </Text>
          </View>
        </View>

        {/* ── WEATHER QUICK CARD ── */}
        <TouchableOpacity
          style={s.weatherCard}
          onPress={() => router.push('/(tabs)/weather-irrigation')}
          activeOpacity={0.88}
        >
          <View style={s.weatherLeft}>
            <Text style={s.weatherIcon}>⛅</Text>
            <View>
              <Text style={s.weatherTemp}>{WEATHER.temp}</Text>
              <Text style={s.weatherCond}>{WEATHER.condition}</Text>
              <Text style={[s.weatherRain, { color: rainColor }]}>
                🌧 Rain: {WEATHER.rainChance}%
              </Text>
            </View>
          </View>
          <View style={s.weatherRight}>
            <Text style={s.weatherAdvice}>{WEATHER.advice}</Text>
            <Text style={s.weatherTap}>Tap for full forecast →</Text>
          </View>
        </TouchableOpacity>

        {/* ── MAIN ACTION GRID ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>⚡ Quick Actions</Text>
        </View>

        <View style={s.grid}>
          {/* Disease Scan — BIGGEST, most important */}
          <TouchableOpacity
            style={[s.bigCard, { backgroundColor: '#1B5E20' }]}
            onPress={() => router.push('/(tabs)/disease-scan')}
            activeOpacity={0.85}
          >
            <Text style={s.bigCardEmoji}>🔬</Text>
            <Text style={s.bigCardTitle}>Scan Crop Disease</Text>
            <Text style={s.bigCardSub}>Point camera at any leaf → get instant AI diagnosis</Text>
            <View style={s.bigCardBtn}>
              <Text style={s.bigCardBtnText}>Open Camera →</Text>
            </View>
          </TouchableOpacity>

          {/* Two smaller cards */}
          <View style={s.smallRow}>
            <TouchableOpacity
              style={[s.smallCard, { backgroundColor: '#0D47A1' }]}
              onPress={() => router.push('/(tabs)/weather-irrigation')}
              activeOpacity={0.85}
            >
              <Text style={s.smallEmoji}>🌦</Text>
              <Text style={s.smallTitle}>Weather &{'\n'}Irrigation</Text>
              <Text style={s.smallSub}>7-day forecast</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.smallCard, { backgroundColor: '#E65100' }]}
              onPress={() => router.push('/(tabs)/market-prices')}
              activeOpacity={0.85}
            >
              <Text style={s.smallEmoji}>📊</Text>
              <Text style={s.smallTitle}>Mandi{'\n'}Prices</Text>
              <Text style={s.smallSub}>Live rates</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.wideCard, { backgroundColor: '#4A148C' }]}
            onPress={() => router.push('/(tabs)/schemes')}
            activeOpacity={0.85}
          >
            <Text style={s.wideEmoji}>🏛</Text>
            <View>
              <Text style={s.wideTitle}>Government Schemes</Text>
              <Text style={s.wideSub}>PM-KISAN · PMFBY · PM Kusum — check your eligibility</Text>
            </View>
            <Text style={s.wideArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── MANDI SNAPSHOT ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>📈 Today's Mandi Rates</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/market-prices')}>
            <Text style={s.sectionLink}>See all</Text>
          </TouchableOpacity>
        </View>

        <View style={s.mandiCard}>
          {MANDI.map((item, i) => (
            <View key={i} style={[s.mandiRow, i < MANDI.length - 1 && s.mandiRowBorder]}>
              <Text style={s.mandiCrop}>{item.name}</Text>
              <Text style={s.mandiPrice}>{item.price} <Text style={s.mandiUnit}>/ Qtl</Text></Text>
              <View style={[s.changePill, item.up ? s.pillUp : s.pillDown]}>
                <Text style={[s.changeText, { color: item.up ? '#2E7D32' : '#C62828' }]}>
                  {item.up ? '▲' : '▼'} {Math.abs(item.change)}%
                </Text>
              </View>
            </View>
          ))}
          <Text style={s.mandiSource}>Source: APMC Hyderabad · Updated 15 min ago</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const CARD_GAP = 12;
const SMALL_W  = (width - 32 - CARD_GAP) / 2;

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F8E9' },

  /* Header */
  header: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute', top: -40, right: -40,
    width: 180, height: 180, borderRadius: 90,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  headerRow:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  greet:      { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500' },
  farmName:   { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginTop: 2 },
  location:   { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#2E7D32',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  rainPill: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    alignSelf: 'flex-start',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  rainText: { fontSize: 13, fontWeight: '700' },

  /* Weather card */
  weatherCard: {
    marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 18, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 10, elevation: 5,
    borderWidth: 1.5, borderColor: '#C8E6C9',
  },
  weatherLeft:  { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  weatherIcon:  { fontSize: 38 },
  weatherTemp:  { fontSize: 22, fontWeight: '800', color: '#263238' },
  weatherCond:  { fontSize: 11, color: '#546E7A', fontWeight: '500', marginTop: 1 },
  weatherRain:  { fontSize: 12, fontWeight: '700', marginTop: 3 },
  weatherRight: { alignItems: 'flex-end', gap: 4 },
  weatherAdvice:{ fontSize: 11, fontWeight: '700', color: '#2E7D32', textAlign: 'right', maxWidth: 110 },
  weatherTap:   { fontSize: 10, color: '#90A4AE', textAlign: 'right' },

  /* Sections */
  section:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 18, marginBottom: 10 },
  sectionLabel:{ fontSize: 14, fontWeight: '800', color: '#263238' },
  sectionLink: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },

  /* Action grid */
  grid: { paddingHorizontal: 16, gap: CARD_GAP },

  bigCard: {
    borderRadius: 20, padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18, shadowRadius: 12, elevation: 6,
  },
  bigCardEmoji: { fontSize: 40, marginBottom: 8 },
  bigCardTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  bigCardSub:   { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500', lineHeight: 18, marginBottom: 14 },
  bigCardBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 12, paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)',
  },
  bigCardBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  smallRow:   { flexDirection: 'row', gap: CARD_GAP },
  smallCard: {
    flex: 1, borderRadius: 18, padding: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
    minHeight: 130,
  },
  smallEmoji: { fontSize: 30, marginBottom: 8 },
  smallTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', lineHeight: 20 },
  smallSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '500', marginTop: 4 },

  wideCard: {
    borderRadius: 18, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15, shadowRadius: 8, elevation: 5,
  },
  wideEmoji: { fontSize: 30 },
  wideTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginBottom: 3 },
  wideSub:   { color: 'rgba(255,255,255,0.72)', fontSize: 10, fontWeight: '500', lineHeight: 15 },
  wideArrow: { color: '#FFFFFF', fontSize: 28, fontWeight: '300', marginLeft: 'auto' },

  /* Mandi snapshot */
  mandiCard: {
    marginHorizontal: 16, backgroundColor: '#FFFFFF',
    borderRadius: 18, overflow: 'hidden',
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    borderWidth: 1.5, borderColor: '#C8E6C9',
  },
  mandiRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 13 },
  mandiRowBorder: { borderBottomWidth: 1, borderBottomColor: '#E8F5E9' },
  mandiCrop:      { flex: 1, fontSize: 14, fontWeight: '700', color: '#263238' },
  mandiPrice:     { fontSize: 14, fontWeight: '800', color: '#263238', marginRight: 10 },
  mandiUnit:      { fontSize: 10, fontWeight: '500', color: '#78909C' },
  changePill:     { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  pillUp:         { backgroundColor: '#E8F5E9' },
  pillDown:       { backgroundColor: '#FFEBEE' },
  changeText:     { fontSize: 11, fontWeight: '800' },
  mandiSource:    { fontSize: 9.5, color: '#90A4AE', paddingHorizontal: 16, paddingBottom: 10, fontStyle: 'italic' },
});
