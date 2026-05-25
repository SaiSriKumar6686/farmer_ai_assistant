import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, ActivityIndicator, StatusBar
} from 'react-native';
import { LanguageContext } from '../context/LanguageContext';
import { fetchWeather } from '../services/weatherService';
import { useQuery } from '@tanstack/react-query';
import { getIrrigationAdvice, getIrrigationCardConfig, rainProbabilityFromCode } from '../services/irrigationService';
import { saveWeatherLog, saveIrrigationLog } from '../services/storageService';
import { translateChat } from '../services/aiService';
import LanguageSelector from '../components/LanguageSelector';

const getWeatherEmoji = (main) => {
    const map = {
        'Clear': '☀', 'Clouds': '⛅', 'Rain': '🌧', 'Drizzle': '🌦', 'Thunderstorm': '⛈', 'Snow': '❄'
    };
    return map[main] || '⛅';
};

export default function WeatherIrrigationScreen() {
  const { t, language } = useContext(LanguageContext);
  const [localizedAdvice, setLocalizedAdvice] = useState({ title: '', advice: 'Awaiting weather data...', reason: '' });
  
  const { data: weatherData, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['weather'],
    queryFn: async () => {
      const data = await fetchWeather();
      if (!data) return null;
      
      const daily = [];
      const seenDays = new Set();
      const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      
      data.forecast.list.forEach(item => {
          const date = new Date(item.dt * 1000);
          const dayStr = daysOfWeek[date.getDay()];
          if (date.getHours() >= 11 && date.getHours() <= 15 && !seenDays.has(dayStr)) {
              seenDays.add(dayStr);
              daily.push({
                  day: dayStr,
                  icon: getWeatherEmoji(item.weather[0].main),
                  temp: `${Math.round(item.main.temp)}°`,
                  today: daily.length === 0,
                  rain: rainProbabilityFromCode(item.weather[0].id) + '%'
              });
          }
      });
      return { current: data.current, forecastList: daily };
    },
    staleTime: 5 * 60 * 1000,
  });

  const currentWeather = weatherData?.current;
  const forecastList = weatherData?.forecastList || [];

  const rain = currentWeather ? rainProbabilityFromCode(currentWeather.weather[0].id) : 20;

  const irrigAdvice = currentWeather ? getIrrigationAdvice({
      rain, temp: currentWeather.main.temp, humidity: currentWeather.main.humidity, windSpeed: currentWeather.wind.speed,
  }) : { advice: 'Awaiting weather data...', urgency: 'low', reason: '' };

  const irrigCard = getIrrigationCardConfig(rain, currentWeather?.weather[0]?.main);

  useEffect(() => {
     if (!currentWeather) return;
     if (language === 'en') {
         setLocalizedAdvice({ title: irrigCard.title, advice: irrigAdvice.advice, reason: irrigAdvice.reason });
         return;
     }
     const translate = async () => {
         try {
             const texts = [irrigCard.title, irrigAdvice.advice, irrigAdvice.reason];
             const results = await translateChat(texts, language);
             if (results && results.length === 3) {
                 setLocalizedAdvice({ title: results[0], advice: results[1], reason: results[2] });
             } else {
                 setLocalizedAdvice({ title: irrigCard.title, advice: irrigAdvice.advice, reason: irrigAdvice.reason });
             }
         } catch(e) {
             setLocalizedAdvice({ title: irrigCard.title, advice: irrigAdvice.advice, reason: irrigAdvice.reason });
         }
     }
     translate();
  }, [language, currentWeather?.dt]);

  useEffect(() => {
    if (currentWeather) {
      saveWeatherLog({
        temp: currentWeather.main.temp, humidity: currentWeather.main.humidity,
        windSpeed: currentWeather.wind.speed, condition: currentWeather.weather[0].main,
        city: currentWeather.name, rain,
      }).catch(() => {});
      saveIrrigationLog({ ...irrigAdvice, city: currentWeather.name }).catch(() => {});
    }
  }, [currentWeather?.dt]);

  if (isLoading) {
    return (
      <SafeAreaView style={[s.safe, {justifyContent: 'center', alignItems: 'center'}]}>
        <ActivityIndicator size="large" color="#1565C0" />
        <Text style={{color: '#666', marginTop: 10}}>{t('locatingFarm') || 'Locating...'}</Text>
      </SafeAreaView>
    );
  }

  if (!currentWeather) {
    return (
      <SafeAreaView style={[s.safe, {justifyContent: 'center', alignItems: 'center', padding: 24}]}>
        <Text style={{fontSize: 36, marginBottom: 12}}>⛅</Text>
        <Text style={{fontSize: 15, fontWeight: '700', color: '#263238', marginBottom: 6}}>{t('weatherUnavailable') || 'Unavailable'}</Text>
        <TouchableOpacity onPress={() => refetch()} style={{backgroundColor: '#1565C0', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 22, marginTop: 10}}>
          <Text style={{color: '#fff', fontSize: 13, fontWeight: '700'}}>{t('retry') || 'Retry'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0D47A1" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.location}>📍 {currentWeather.name}</Text>
          <View style={s.mainRow}>
            <View>
              <Text style={s.tempBig}>{Math.round(currentWeather.main.temp)}°C</Text>
              <Text style={s.condition}>{currentWeather.weather[0].main} {getWeatherEmoji(currentWeather.weather[0].main)}</Text>
              <Text style={s.feelsLike}>{t('feelsLike') || 'Feels like'} {Math.round(currentWeather.main.feels_like)}° · {t('humidityLabel') || 'Humid'} {currentWeather.main.humidity}%</Text>
            </View>
            <Text style={{ fontSize: 72 }}>{getWeatherEmoji(currentWeather.weather[0].main)}</Text>
          </View>
          <View style={s.statRow}>
            {[['💧', `${currentWeather.main.humidity}%`, t('humidityLabel') || 'Humidity'], ['🌬', `${currentWeather.wind.speed} m/s`, t('windLabel') || 'Wind'], ['🌡', '1013 hPa', 'Pressure']].map(([icon, val, label], i) => (
              <View key={i} style={s.statBox}>
                <Text style={s.statIcon}>{icon}</Text>
                <Text style={s.statVal}>{val}</Text>
                <Text style={s.statLabel}>{label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* IRRIGATION DECISION */}
        <View style={s.irrigBox}>
          <View style={s.irrigIconWrap}>
            <Text style={{ fontSize: 36 }}>{irrigCard.icon}</Text>
          </View>
          <Text style={s.irrigDecision}>{localizedAdvice.title}</Text>
          <Text style={s.irrigSub}>{localizedAdvice.advice}</Text>
          <View style={s.irrigTips}>
            {[
              `💧 ${localizedAdvice.reason || 'Optimal conditions currently.'}`,
              `⚠️ Rain probability is ${rain}%`,
              t('irrigationToday') || 'Plan your scheduled routines accordingly.'
            ].map((tip, i) => (
              <Text key={i} style={s.irrigTip}>{tip}</Text>
            ))}
          </View>
        </View>

        {/* 7-DAY FORECAST */}
        <Text style={s.sectionTitle}>📅 {t('fiveDay') || '7-Day Forecast'}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.forecastScroll}>
          {forecastList.map((f, i) => (
            <View key={i} style={[s.fcCard, f.today && s.fcCardToday]}>
              <Text style={[s.fcDay, f.today && s.fcDayActive]}>{f.day}</Text>
              <Text style={s.fcIcon}>{f.icon}</Text>
              <Text style={s.fcHigh}>{f.temp}</Text>
              <Text style={s.fcLow}>{Math.round(parseInt(f.temp) - 5)}°</Text>
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
          {forecastList.slice(0, 7).map((b, i) => {
            const mm = Math.round((parseInt(b.rain) / 100) * 15);
            return (
              <View key={i} style={s.barCol}>
                <Text style={s.barMm}>{mm > 0 ? `${mm}` : ''}</Text>
                <View style={[s.bar, { height: Math.max(4, mm * 3), backgroundColor: mm > 10 ? '#1565C0' : '#66BB6A' }]} />
                <Text style={s.barDay}>{b.day}</Text>
              </View>
            );
          })}
        </View>

        {/* CROP ADVICE */}
        <Text style={s.sectionTitle}>🌾 Crop-wise Advice</Text>
        <View style={s.adviceCard}>
          <Text style={s.adviceCrop}>🌾 Base Advice</Text>
          <Text style={s.adviceText}>{irrigAdvice.advice}. {irrigAdvice.reason}</Text>
        </View>

      </ScrollView>
      <LanguageSelector />
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
  statRow:   { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 14, padding: 10 },
  statBox:   { alignItems: 'center', gap: 2, flex: 1 },
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
