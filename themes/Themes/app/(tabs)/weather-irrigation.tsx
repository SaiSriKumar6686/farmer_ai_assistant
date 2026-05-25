import React from 'react';
import {
  View, Text, ScrollView, StyleSheet,
  SafeAreaView, StatusBar,
} from 'react-native';

const FORECAST = [
  { day: 'Today', icon: '☀', high: '36°', low: '24°', rain: '5%',  today: true  },
  { day: 'Wed',   icon: '🌧', high: '29°', low: '21°', rain: '85%', today: false },
  { day: 'Thu',   icon: '🌦', high: '31°', low: '22°', rain: '40%', today: false },
  { day: 'Fri',   icon: '☀', high: '35°', low: '24°', rain: '8%',  today: false },
  { day: 'Sat',   icon: '☀', high: '37°', low: '25°', rain: '3%',  today: false },
  { day: 'Sun',   icon: '⛅', high: '33°', low: '23°', rain: '20%', today: false },
];

export default function WeatherIrrigationScreen() {
  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.location}>📍 Mudigonda, Telangana</Text>
          <View style={s.mainRow}>
            <View>
              <Text style={s.tempBig}>35.7°C</Text>
              <Text style={s.condition}>Clear Sky ☀</Text>
              <Text style={s.feelsLike}>Feels like 38° · Humid 62%</Text>
            </View>
            <Text style={{ fontSize: 72 }}>☀</Text>
          </View>
          <View style={s.statRow}>
            {[['💧', '62%', 'Humidity'], ['🌬', '14 km/h', 'Wind'], ['🌡', '1013 hPa', 'Pressure']].map(([icon, val, label], i) => (
              <View key={i} style={s.statBox}>
                <Text style={s.statIcon}>{icon}</Text>
                <Text style={s.statVal}>{val}</Text>
                <Text style={s.statLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* IRRIGATION DECISION — MOST IMPORTANT */}
        <View style={s.irrigBox}>
          <View style={s.irrigIconWrap}>
            <Text style={{ fontSize: 36 }}>✅</Text>
          </View>
          <Text style={s.irrigDecision}>Safe to Irrigate Today</Text>
          <Text style={s.irrigSub}>Rain probability is only 5% — low risk</Text>
          <View style={s.irrigTips}>
            {[
              '🕕  Best time: Early morning (5–7 AM)',
              '💧  Estimated water needed: 40 L/row',
              '⚠️  Tomorrow — heavy rain expected (85%)',
              '💡  Skip irrigation tomorrow to save water',
            ].map((tip, i) => (
              <Text key={i} style={s.irrigTip}>{tip}</Text>
            ))}
          </View>
        </View>

        {/* 7-DAY FORECAST */}
        <Text style={s.sectionTitle}>📅 7-Day Forecast</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.forecastScroll}>
          {FORECAST.map((f, i) => (
            <View key={i} style={[s.fcCard, f.today && s.fcCardToday]}>
              <Text style={[s.fcDay, f.today && s.fcDayActive]}>{f.day}</Text>
              <Text style={s.fcIcon}>{f.icon}</Text>
              <Text style={s.fcHigh}>{f.high}</Text>
              <Text style={s.fcLow}>{f.low}</Text>
              <View style={[s.fcRainPill, parseInt(f.rain) > 50 ? s.rainHigh : s.rainLow]}>
                <Text style={[s.fcRain, { color: parseInt(f.rain) > 50 ? '#1565C0' : '#2E7D32' }]}>
                  🌧{f.rain}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* RAINFALL BAR */}
        <Text style={s.sectionTitle}>🌧 Weekly Rainfall (mm)</Text>
        <View style={s.barCard}>
          {[
            { day: 'Mon', mm: 0 }, { day: 'Tue', mm: 3 }, { day: 'Wed', mm: 58 },
            { day: 'Thu', mm: 12 }, { day: 'Fri', mm: 0 }, { day: 'Sat', mm: 0 }, { day: 'Sun', mm: 2 },
          ].map((b, i) => (
            <View key={i} style={s.barCol}>
              <Text style={s.barMm}>{b.mm > 0 ? `${b.mm}` : ''}</Text>
              <View style={[s.bar, { height: Math.max(4, b.mm * 1.5), backgroundColor: b.mm > 30 ? '#1565C0' : '#66BB6A' }]} />
              <Text style={s.barDay}>{b.day}</Text>
            </View>
          ))}
        </View>

        {/* CROP ADVICE */}
        <Text style={s.sectionTitle}>🌾 Crop-wise Advice</Text>
        {[
          { crop: '🌾 Wheat',  advice: 'Irrigate today. Next rain Thursday — 1 round sufficient.' },
          { crop: '🍅 Tomato', advice: 'Reduce water — high humidity risk of fungal infection.' },
          { crop: '🌽 Maize',  advice: 'Hold irrigation — soil moisture 72%, sufficient for 2 days.' },
        ].map((item, i) => (
          <View key={i} style={s.adviceCard}>
            <Text style={s.adviceCrop}>{item.crop}</Text>
            <Text style={s.adviceText}>{item.advice}</Text>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F1F8E9' },
  header: {
    backgroundColor: '#0D47A1',
    paddingHorizontal: 20, paddingTop: 14, paddingBottom: 20,
  },
  location:  { color: 'rgba(255,255,255,0.75)', fontSize: 12, fontWeight: '600', marginBottom: 10 },
  mainRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  tempBig:   { color: '#fff', fontSize: 52, fontWeight: '900', lineHeight: 58 },
  condition: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 2 },
  feelsLike: { color: 'rgba(255,255,255,0.7)', fontSize: 11, marginTop: 4 },
  statRow:   { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 10 },
  statBox:   { alignItems: 'center', gap: 2 },
  statIcon:  { fontSize: 16 },
  statVal:   { color: '#fff', fontSize: 13, fontWeight: '800' },
  statLabel: { color: 'rgba(255,255,255,0.65)', fontSize: 9, fontWeight: '500' },

  irrigBox: {
    margin: 16, backgroundColor: '#fff',
    borderRadius: 20, padding: 18,
    borderWidth: 2.5, borderColor: '#A5D6A7',
    alignItems: 'center',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12, shadowRadius: 10, elevation: 5,
  },
  irrigIconWrap:  { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  irrigDecision:  { fontSize: 20, fontWeight: '900', color: '#1B5E20', textAlign: 'center' },
  irrigSub:       { fontSize: 12, color: '#78909C', marginTop: 4, marginBottom: 14, textAlign: 'center' },
  irrigTips:      { width: '100%', gap: 7 },
  irrigTip:       { fontSize: 13, color: '#546E7A', fontWeight: '600', lineHeight: 20 },

  sectionTitle:    { fontSize: 14, fontWeight: '800', color: '#263238', marginHorizontal: 16, marginTop: 18, marginBottom: 10 },
  forecastScroll:  { paddingLeft: 16, marginBottom: 4 },
  fcCard: {
    alignItems: 'center', backgroundColor: '#fff',
    borderRadius: 16, padding: 12, marginRight: 10,
    minWidth: 72, gap: 4,
    borderWidth: 1.5, borderColor: '#ECEFF1',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  fcCardToday: { backgroundColor: '#E3F2FD', borderColor: '#90CAF9', borderWidth: 2 },
  fcDay:       { fontSize: 10, fontWeight: '700', color: '#78909C' },
  fcDayActive: { color: '#1565C0', fontWeight: '900' },
  fcIcon:      { fontSize: 24 },
  fcHigh:      { fontSize: 14, fontWeight: '800', color: '#263238' },
  fcLow:       { fontSize: 11, color: '#90A4AE', fontWeight: '600' },
  fcRainPill:  { borderRadius: 20, paddingHorizontal: 6, paddingVertical: 2 },
  rainHigh:    { backgroundColor: '#E3F2FD' },
  rainLow:     { backgroundColor: '#E8F5E9' },
  fcRain:      { fontSize: 9.5, fontWeight: '700' },

  barCard: {
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around',
    backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 18,
    padding: 16, height: 120,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
    borderWidth: 1.5, borderColor: '#ECEFF1',
  },
  barCol:  { alignItems: 'center', flex: 1, justifyContent: 'flex-end', gap: 4 },
  barMm:   { fontSize: 8, color: '#1565C0', fontWeight: '700' },
  bar:     { width: 16, borderRadius: 5, minHeight: 4 },
  barDay:  { fontSize: 9, color: '#78909C', fontWeight: '600' },

  adviceCard: {
    marginHorizontal: 16, marginBottom: 8,
    backgroundColor: '#fff', borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderColor: '#C8E6C9',
  },
  adviceCrop: { fontSize: 14, fontWeight: '800', color: '#263238', marginBottom: 4 },
  adviceText: { fontSize: 12, color: '#546E7A', lineHeight: 18, fontWeight: '500' },
});
