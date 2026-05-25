import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, Platform, StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/appTheme';

interface HomeScreenProps {
  navigation: { navigate: (route: string) => void };
}

const CROPS = [
  { emoji: '🌾', name: 'Wheat',  id: 0 },
  { emoji: '🌽', name: 'Maize',  id: 1 },
  { emoji: '🍅', name: 'Tomato', id: 2 },
  { emoji: '🧅', name: 'Onion',  id: 3 },
];

const ACTIVITY = [
  { icon: '🌿', title: 'Wheat scan completed', sub: '2 hours ago · Healthy', badge: 'OK' },
];

export default function HomeScreen({ navigation }: HomeScreenProps) {
  const [activeCrop, setActiveCrop] = useState(0);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.green900} />
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>

        {/* ── HEADER ── */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greet}>Good Morning 🌤</Text>
              <Text style={styles.name}>Ravi's Farm</Text>
            </View>
            <View style={styles.avatar}>
              <Text style={{ fontSize: 22 }}>👨‍🌾</Text>
            </View>
          </View>
          
          <View style={styles.weatherCard}>
            <Text style={{ fontSize: 32 }}>⛅</Text>
            <View style={{ marginLeft: 16, flex: 1 }}>
              <Text style={styles.weatherTemp}>28°C · Yellandu</Text>
              <Text style={styles.weatherDesc}>Partly Cloudy</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.weatherDetail}>💧 Hum: 72%</Text>
              <Text style={styles.weatherDetail}>💨 Wind: 12km/h</Text>
            </View>
          </View>
        </View>

        <View style={styles.content}>
          {/* ── ALERTS ── */}
          <View style={styles.alertCard}>
            <Text style={{ fontSize: 24, marginRight: 12 }}>⚠️</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>Heavy Rain Expected</Text>
              <Text style={styles.alertDesc}>Tomorrow 2–8 PM · Delay irrigation schedule.</Text>
            </View>
          </View>

          {/* ── MY CROPS ── */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>My Crops</Text>
            <TouchableOpacity><Text style={styles.seeAll}>+ Add</Text></TouchableOpacity>
          </View>
          
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
            {CROPS.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.cropChip, activeCrop === c.id && styles.cropChipActive]}
                onPress={() => setActiveCrop(c.id)}
              >
                <View style={styles.cropIconBox}>
                  <Text style={{ fontSize: 16 }}>{c.emoji}</Text>
                </View>
                <Text style={[styles.cropName, activeCrop === c.id && styles.cropNameActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── QUICK ACTIONS ── */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.grid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Disease')} activeOpacity={0.8}>
              <View style={[styles.iconWrapper, { backgroundColor: COLORS.green100 }]}><Text style={styles.actionIcon}>🔬</Text></View>
              <Text style={styles.actionTitle}>Scan Crop</Text>
              <Text style={styles.actionDesc}>Detect diseases</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Weather')} activeOpacity={0.8}>
              <View style={[styles.iconWrapper, { backgroundColor: COLORS.blueBg }]}><Text style={styles.actionIcon}>🌦</Text></View>
              <Text style={styles.actionTitle}>Weather</Text>
              <Text style={styles.actionDesc}>Live updates</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Market')} activeOpacity={0.8}>
              <View style={[styles.iconWrapper, { backgroundColor: COLORS.amberBg }]}><Text style={styles.actionIcon}>📈</Text></View>
              <Text style={styles.actionTitle}>Yield Rates</Text>
              <Text style={styles.actionDesc}>Mandi prices</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Schemes')} activeOpacity={0.8}>
              <View style={[styles.iconWrapper, { backgroundColor: COLORS.gray100 }]}><Text style={styles.actionIcon}>🏛</Text></View>
              <Text style={styles.actionTitle}>Gov Schemes</Text>
              <Text style={styles.actionDesc}>Check benefits</Text>
            </TouchableOpacity>
          </View>

          {/* ── RECENT ACTIVITY ── */}
          <View style={styles.sectionRow}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
          </View>
          {ACTIVITY.map((a, i) => (
            <View key={i} style={styles.activityCard}>
              <View style={styles.activityIconBox}><Text style={{ fontSize: 20 }}>{a.icon}</Text></View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.activityTitle}>{a.title}</Text>
                <Text style={styles.activitySub}>{a.sub}</Text>
              </View>
              <View style={styles.badgeOK}>
                <Text style={styles.badgeText}>{a.badge}</Text>
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.gray100, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  scroll: { flex: 1 },
  header: {
    backgroundColor: COLORS.green900,
    paddingHorizontal: 24, paddingTop: 24, paddingBottom: 60,
    borderBottomLeftRadius: 30, borderBottomRightRadius: 30,
  },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greet: { color: COLORS.green200, fontFamily: FONTS.sansBold, fontSize: 13 },
  name: { color: COLORS.white, fontFamily: FONTS.serif, fontSize: 26, marginTop: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.white, alignItems: 'center', justifyContent: 'center' },
  weatherCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 20,
    flexDirection: 'row', alignItems: 'center', position: 'absolute',
    bottom: -40, left: 24, right: 24, ...SHADOW.card,
  },
  weatherTemp: { fontFamily: FONTS.sansBold, fontSize: 16, color: COLORS.gray800 },
  weatherDesc: { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.gray600, marginTop: 4 },
  weatherDetail: { fontFamily: FONTS.sansBold, fontSize: 11, color: COLORS.gray800, marginBottom: 4 },
  content: { paddingHorizontal: 24, paddingTop: 60 },
  alertCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: COLORS.red, ...SHADOW.card
  },
  alertTitle: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.red },
  alertDesc: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.gray600, marginTop: 4 },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontFamily: FONTS.sansExtra, fontSize: 18, color: COLORS.gray800 },
  seeAll: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.green800 },
  cropChip: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: 30, paddingRight: 16, paddingLeft: 6, paddingVertical: 6,
    marginRight: 12, borderWidth: 1, borderColor: COLORS.gray300, ...SHADOW.card, elevation: 1
  },
  cropChipActive: { backgroundColor: COLORS.green800, borderColor: COLORS.green800 },
  cropIconBox: { backgroundColor: COLORS.gray100, borderRadius: 20, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  cropName: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.gray800, marginLeft: 8 },
  cropNameActive: { color: COLORS.white },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginBottom: 24 },
  actionCard: { width: '47%', backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 16, ...SHADOW.card },
  iconWrapper: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  actionIcon: { fontSize: 24 },
  actionTitle: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.gray800 },
  actionDesc: { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.gray600, marginTop: 4 },
  activityCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16, ...SHADOW.card },
  activityIconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.green50, alignItems: 'center', justifyContent: 'center' },
  activityTitle: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.gray800 },
  activitySub: { fontFamily: FONTS.sans, fontSize: 11, color: COLORS.gray600, marginTop: 4 },
  badgeOK: { backgroundColor: COLORS.green100, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontFamily: FONTS.sansBold, fontSize: 10, color: COLORS.green800 }
});
