import React, { useState, useEffect, useContext } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { LanguageContext } from '../context/LanguageContext';
import { fetchWeather } from '../services/weatherService';
import { getMarketPrices, getCropEmoji } from '../services/mandiService';
import LanguageSelector from '../components/LanguageSelector';

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useContext(LanguageContext);
  const [weatherData, setWeatherData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mandiData, setMandiData] = useState([]);
  const [mandiLoading, setMandiLoading] = useState(true);

  // Load weather
  const loadWeather = async () => {
    setIsRefreshing(true);
    const data = await fetchWeather();
    if (data) setWeatherData(data.current);
    setIsRefreshing(false);
  };

  // Load live mandi prices (show top 3)
  const loadMandi = async () => {
    setMandiLoading(true);
    try {
      const res = await getMarketPrices(30, false);
      if (res?.data?.length > 0) {
        // Sort by highest price change and take top 3
        const sorted = [...res.data].sort((a, b) =>
          Math.abs(parseFloat(b.changePercent || '0')) - Math.abs(parseFloat(a.changePercent || '0'))
        ).slice(0, 3);
        setMandiData(sorted);
      }
    } catch (_) {}
    setMandiLoading(false);
  };

  useEffect(() => {
    loadWeather();
    loadMandi();
  }, []);

  // ── Weather parsing ────────────────────────────────────────────────────
  const temp = weatherData ? `${Math.round(weatherData.main.temp)}°C` : '...'
  const condition = weatherData ? weatherData.weather[0].main : 'Loading...';
  const location = weatherData ? weatherData.name : t('locating') || 'Locating...';
  const humidity = weatherData ? weatherData.main.humidity : 0;
  const isRainy = condition.includes('Rain') || condition.includes('Drizzle') || condition.includes('Thunderstorm');
  const rainChance = isRainy ? 80 : (humidity > 70 ? 30 : 5);
  const rainLabel =
    rainChance < 20
      ? '✅  ' + (t('safeToIrrigate') || 'Safe to Irrigate')
      : '⚠️  ' + (t('delayIrrigation') || 'Delay Irrigation — Rain likely');
  const weatherEmoji = isRainy ? '🌧' : condition === 'Clear' ? '☀️' : '⛅';

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* ── HEADER ── */}
        <View style={s.header}>
          <View style={s.headerGlow} />
          <View style={s.headerRow}>
            <View>
              <Text style={s.greet}>🙏 {t('goodMorning') || 'Welcome back'}</Text>
              <Text style={s.farmName}>{t('farmName') || "Kisan's Farm"}</Text>
              <Text style={s.location}>📍 {location}</Text>
            </View>
            <View style={s.avatar}>
              <Text style={{ fontSize: 32 }}>👨‍🌾</Text>
            </View>
          </View>
          {/* Rain alert */}
          <View style={[s.rainPill, {
            backgroundColor: rainChance < 20 ? 'rgba(165,214,167,0.25)' : 'rgba(255,152,0,0.25)',
            borderColor: rainChance < 20 ? 'rgba(165,214,167,0.5)' : 'rgba(255,152,0,0.5)',
          }]}>
            <Text style={[s.rainText, { color: rainChance < 20 ? '#A5D6A7' : '#FFB74D' }]}>
              {rainLabel}
            </Text>
          </View>
        </View>

        {/* ── WEATHER QUICK CARD ── */}
        <TouchableOpacity
          style={s.weatherCard}
          onPress={() => router.push('/weather-irrigation')}
          activeOpacity={0.88}
        >
          <View style={s.weatherLeft}>
            <Text style={s.weatherIcon}>{weatherEmoji}</Text>
            <View>
              <Text style={s.weatherTemp}>{temp}</Text>
              <Text style={s.weatherCond}>{condition}</Text>
              <Text style={[s.weatherRain, { color: rainChance < 20 ? '#2E7D32' : '#E65100' }]}>
                🌧 {t('rainChance') || 'Rain'}: {rainChance}%
              </Text>
            </View>
          </View>
          <View style={s.weatherRight}>
            <Text style={s.weatherAdvice}>
              {rainChance < 20 ? '💧 Safe to\nIrrigate' : '⚠️ Delay\nIrrigation'}
            </Text>
            <Text style={s.weatherTap}>{t('tapForForecast') || 'Tap for full forecast →'}</Text>
          </View>
        </TouchableOpacity>

        {/* ── QUICK ACTIONS ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>⚡ {t('quickActions') || 'Quick Actions'}</Text>
        </View>

        <View style={s.grid}>
          {/* Disease Scan — BIG card */}
          <TouchableOpacity
            style={[s.bigCard, { backgroundColor: '#1B5E20' }]}
            onPress={() => router.push('/disease-scan')}
            activeOpacity={0.85}
          >
            <Text style={s.bigCardEmoji}>🔬</Text>
            <Text style={s.bigCardTitle}>{t('scanDisease') || 'Scan Crop Disease'}</Text>
            <Text style={s.bigCardSub}>
              {t('pointCamera') || 'Point camera at any leaf → get instant AI diagnosis'}
            </Text>
            <View style={s.bigCardBtn}>
              <Text style={s.bigCardBtnText}>{t('openCameraBtn') || 'Open Camera →'}</Text>
            </View>
          </TouchableOpacity>

          {/* Two smaller cards */}
          <View style={s.smallRow}>
            <TouchableOpacity
              style={[s.smallCard, { backgroundColor: '#0D47A1' }]}
              onPress={() => router.push('/weather-irrigation')}
              activeOpacity={0.85}
            >
              <Text style={s.smallEmoji}>🌦</Text>
              <Text style={s.smallTitle}>{t('weather') || 'Weather'}{'\n'}{t('irrigation') || 'Irrigation'}</Text>
              <Text style={s.smallSub}>7-day forecast</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.smallCard, { backgroundColor: '#E65100' }]}
              onPress={() => router.push('/market-prices')}
              activeOpacity={0.85}
            >
              <Text style={s.smallEmoji}>📊</Text>
              <Text style={s.smallTitle}>{t('mandiPrices') || 'Mandi\nPrices'}</Text>
              <Text style={s.smallSub}>{t('todaysRates') || 'Live rates'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.wideCard, { backgroundColor: '#4A148C' }]}
            onPress={() => router.push('/schemes')}
            activeOpacity={0.85}
          >
            <Text style={s.wideEmoji}>🏛</Text>
            <View>
              <Text style={s.wideTitle}>{t('schemes') || 'Government Schemes'}</Text>
              <Text style={s.wideSub}>{t('schemesSub') || 'PM-KISAN · PMFBY · PM Kusum'}</Text>
            </View>
            <Text style={s.wideArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.wideCard, { backgroundColor: '#00695C' }]}
            onPress={() => router.push('/ask-ai')}
            activeOpacity={0.85}
          >
            <Text style={s.wideEmoji}>🤖</Text>
            <View>
              <Text style={s.wideTitle}>{t('askAiTitle') || 'Ask AI Advisor'}</Text>
              <Text style={s.wideSub}>Chat · Voice · Multilingual</Text>
            </View>
            <Text style={s.wideArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── LIVE MANDI SNAPSHOT ── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>📈 {t('todaysRates') || "Today's Mandi Rates"}</Text>
          <TouchableOpacity onPress={() => router.push('/market-prices')}>
            <Text style={s.sectionLink}>{t('seeAll') || 'See all'}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.mandiCard}>
          {mandiLoading ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ActivityIndicator size="small" color="#1B5E20" />
              <Text style={{ color: '#90A4AE', fontSize: 12, marginTop: 6 }}>Loading live prices...</Text>
            </View>
          ) : mandiData.length > 0 ? (
            mandiData.map((item, i) => {
              const isUp = item.trend === 'Up';
              const isDown = item.trend === 'Down';
              return (
                <View key={i} style={[s.mandiRow, i < mandiData.length - 1 && s.mandiRowBorder]}>
                  <Text style={{ fontSize: 20, marginRight: 8 }}>{getCropEmoji(item.displayName)}</Text>
                  <Text style={s.mandiCrop}>{item.displayName}</Text>
                  <Text style={s.mandiPrice}>
                    ₹{parseFloat(item.modalPricePerQuintal || 0).toLocaleString('en-IN')}
                    <Text style={s.mandiUnit}> /Qtl</Text>
                  </Text>
                  <View style={[s.changePill, isUp ? s.pillUp : isDown ? s.pillDown : { backgroundColor: '#ECEFF1' }]}>
                    <Text style={[s.changeText, { color: isUp ? '#2E7D32' : isDown ? '#C62828' : '#546E7A' }]}>
                      {isUp ? '▲' : isDown ? '▼' : '●'} {item.changePercent || '0%'}
                    </Text>
                  </View>
                </View>
              );
            })
          ) : (
            // Static fallback if live data unavailable
            [
              { name: 'Rice',  price: '₹2,134', change: -2.98, up: false },
              { name: 'Wheat', price: '₹2,081', change: -0.89, up: false },
              { name: 'Maize', price: '₹1,761', change: +1.20, up: true  },
            ].map((item, i, arr) => (
              <View key={i} style={[s.mandiRow, i < arr.length - 1 && s.mandiRowBorder]}>
                <Text style={{ fontSize: 20, marginRight: 8 }}>{getCropEmoji(item.name)}</Text>
                <Text style={s.mandiCrop}>{item.name}</Text>
                <Text style={s.mandiPrice}>{item.price}<Text style={s.mandiUnit}> /Qtl</Text></Text>
                <View style={[s.changePill, item.up ? s.pillUp : s.pillDown]}>
                  <Text style={[s.changeText, { color: item.up ? '#2E7D32' : '#C62828' }]}>
                    {item.up ? '▲' : '▼'} {Math.abs(item.change)}%
                  </Text>
                </View>
              </View>
            ))
          )}
          <Text style={s.mandiSource}>Source: APMC Agmarknet · Live data.gov.in</Text>
        </View>

      </ScrollView>
      <LanguageSelector />
    </SafeAreaView>
  );
}

const CARD_GAP = 12;

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F8E9' },
  header: {
    backgroundColor: '#1B5E20',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute', top: -40, right: -40,
    width: 200, height: 200, borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 },
  greet:    { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500' },
  farmName: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginTop: 2 },
  location: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#2E7D32',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  rainPill: {
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    alignSelf: 'flex-start', borderWidth: 1,
  },
  rainText: { fontSize: 13, fontWeight: '700' },

  weatherCard: {
    marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    backgroundColor: '#FFFFFF', borderRadius: 18, padding: 16,
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
  weatherAdvice:{ fontSize: 11, fontWeight: '800', color: '#2E7D32', textAlign: 'right', maxWidth: 90 },
  weatherTap:   { fontSize: 10, color: '#90A4AE', textAlign: 'right' },

  section:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginTop: 18, marginBottom: 10 },
  sectionLabel: { fontSize: 14, fontWeight: '800', color: '#263238' },
  sectionLink:  { fontSize: 12, fontWeight: '700', color: '#2E7D32' },

  grid:     { paddingHorizontal: 16, gap: CARD_GAP },
  bigCard:  { borderRadius: 20, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.18, shadowRadius: 12, elevation: 6 },
  bigCardEmoji:   { fontSize: 40, marginBottom: 8 },
  bigCardTitle:   { color: '#FFFFFF', fontSize: 20, fontWeight: '800', marginBottom: 4 },
  bigCardSub:     { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '500', lineHeight: 18, marginBottom: 14 },
  bigCardBtn:     { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 12, paddingVertical: 10, alignItems: 'center', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)' },
  bigCardBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  smallRow: { flexDirection: 'row', gap: CARD_GAP },
  smallCard: { flex: 1, borderRadius: 18, padding: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5, minHeight: 130 },
  smallEmoji: { fontSize: 30, marginBottom: 8 },
  smallTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '800', lineHeight: 20 },
  smallSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 10, fontWeight: '500', marginTop: 4 },

  wideCard:  { borderRadius: 18, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
  wideEmoji: { fontSize: 30 },
  wideTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', marginBottom: 3 },
  wideSub:   { color: 'rgba(255,255,255,0.72)', fontSize: 10, fontWeight: '500', lineHeight: 15 },
  wideArrow: { color: '#FFFFFF', fontSize: 28, fontWeight: '300', marginLeft: 'auto' },

  mandiCard: {
    marginHorizontal: 16, backgroundColor: '#FFFFFF', borderRadius: 18, overflow: 'hidden',
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
    borderWidth: 1.5, borderColor: '#C8E6C9',
  },
  mandiRow:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13 },
  mandiRowBorder: { borderBottomWidth: 1, borderBottomColor: '#E8F5E9' },
  mandiCrop:      { flex: 1, fontSize: 13, fontWeight: '700', color: '#263238' },
  mandiPrice:     { fontSize: 13, fontWeight: '900', color: '#263238', marginRight: 8 },
  mandiUnit:      { fontSize: 10, fontWeight: '500', color: '#78909C' },
  changePill:     { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  pillUp:         { backgroundColor: '#E8F5E9' },
  pillDown:       { backgroundColor: '#FFEBEE' },
  changeText:     { fontSize: 11, fontWeight: '800' },
  mandiSource:    { fontSize: 9.5, color: '#90A4AE', paddingHorizontal: 16, paddingBottom: 10, paddingTop: 4, fontStyle: 'italic' },
});
