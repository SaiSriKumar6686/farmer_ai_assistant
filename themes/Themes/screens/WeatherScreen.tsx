import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';
// Assuming these services exist or will be created by Member backend
// import { fetchWeatherData, fetchWeatherForecast } from '../services/weatherService';

interface Props {
  navigation: { navigate: (route: string) => void };
}

export default function WeatherScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [today, setToday] = useState<any>({
    temp: '28°C', city: 'Yellandu', description: 'Partly Cloudy',
    humidity: '72%', windSpeed: '12 km/h', rain: 30
  });
  
  const [forecast, setForecast] = useState<any[]>([
    { date: 'Today', tempMax: '28°C', rain: 30, irrigationAdvice: 'Safe to water' },
    { date: 'Tomorrow', tempMax: '26°C', rain: 80, irrigationAdvice: 'Delay watering' },
    { date: 'Friday', tempMax: '29°C', rain: 10, irrigationAdvice: 'Water crops' },
    { date: 'Saturday', tempMax: '30°C', rain: 0, irrigationAdvice: 'Heavy watering needed' },
    { date: 'Sunday', tempMax: '28°C', rain: 20, irrigationAdvice: 'Normal watering' },
  ]);

  useEffect(() => {
    // On Mount: Call fetchWeatherData & fetchWeatherForecast
    async function loadData() {
      try {
        // const weather = await fetchWeatherData(lat, lon, 'Yellandu');
        // const fc = await fetchWeatherForecast(lat, lon, 'Yellandu');
        // setToday(weather);
        // setForecast(fc.forecast);
      } catch (error) {
        console.error("Error fetching weather:", error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.green800} />
      </SafeAreaView>
    );
  }

  const isRainWarning = today.rain > 50;

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header Pill */}
      <View style={styles.header}>
        <Text style={shared.pageTitle}>Weather</Text>
        <Text style={shared.pageSub}>{today.city}</Text>
      </View>

      <ScrollView style={shared.content} showsVerticalScrollIndicator={false}>
        {/* Main Card */}
        <View style={styles.mainCard}>
          <Text style={{ fontSize: 64, textAlign: 'center' }}>⛅</Text>
          <Text style={styles.mainTemp}>{today.temp}</Text>
          <Text style={styles.mainDesc}>{today.description}</Text>
          
          {/* Humidity & Wind Row */}
          <View style={styles.row}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Humidity</Text>
              <Text style={styles.statVal}>{today.humidity}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>Wind</Text>
              <Text style={styles.statVal}>{today.windSpeed}</Text>
            </View>
          </View>
        </View>

        {/* Irrigation Alert */}
        <Text style={shared.sectionTitle}>Irrigation Alert</Text>
        <View style={[styles.alertCard, { borderColor: isRainWarning ? COLORS.red : COLORS.green800 }]}>
          <Text style={[styles.alertText, { color: isRainWarning ? COLORS.red : COLORS.green800 }]}>
            {isRainWarning ? 'RED WARNING: Heavy rain expected. Do not irrigate today.' : 'GREEN SAFE: Normal irrigation schedule.'}
          </Text>
        </View>

        {/* Forecast Cards */}
        <Text style={[shared.sectionTitle, { marginTop: 16 }]}>5-Day Forecast</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 30 }}>
          {forecast.map((fc, i) => (
            <View key={i} style={styles.forecastCard}>
              <Text style={styles.fcDate}>{fc.date}</Text>
              <Text style={styles.fcTemp}>{fc.tempMax}</Text>
              <View style={styles.fcRainBox}>
                <Text style={{ fontSize: 10 }}>💧</Text>
                <Text style={styles.fcRain}>{fc.rain}%</Text>
              </View>
              <Text style={styles.fcAdvice} numberOfLines={2}>{fc.irrigationAdvice}</Text>
            </View>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1, backgroundColor: COLORS.green50,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    backgroundColor: COLORS.green900,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24,
    borderBottomLeftRadius: RADIUS.xl, borderBottomRightRadius: RADIUS.xl,
  },
  mainCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 24, marginBottom: 24, ...SHADOW.card,
  },
  mainTemp: { fontFamily: FONTS.sansExtra, fontSize: 42, color: COLORS.gray800, textAlign: 'center', marginVertical: 8 },
  mainDesc: { fontFamily: FONTS.sans, fontSize: 16, color: COLORS.gray600, textAlign: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 24, borderTopWidth: 1, borderColor: COLORS.gray100, paddingTop: 16 },
  statBox: { alignItems: 'center' },
  statLabel: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.gray600, marginBottom: 4 },
  statVal: { fontFamily: FONTS.sansBold, fontSize: 16, color: COLORS.gray800 },
  alertCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 16, marginBottom: 20, borderWidth: 2, ...SHADOW.card
  },
  alertText: { fontFamily: FONTS.sansBold, fontSize: 14, textAlign: 'center' },
  forecastCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg,
    padding: 16, marginRight: 12, width: 120, alignItems: 'center',
    ...SHADOW.card
  },
  fcDate: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.gray800, marginBottom: 8 },
  fcTemp: { fontFamily: FONTS.sansExtra, fontSize: 20, color: COLORS.gray800, marginBottom: 4 },
  fcRainBox: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  fcRain: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.blue, marginLeft: 4 },
  fcAdvice: { fontFamily: FONTS.sans, fontSize: 10, color: COLORS.gray600, textAlign: 'center' }
});
