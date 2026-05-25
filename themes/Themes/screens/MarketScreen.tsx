import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';

// import { fetchMarketPrices } from '../services/marketService';

interface Props {
  navigation: { navigate: (route: string) => void };
}

export default function MarketScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [data, setData] = useState<any>({
    lastUpdated: '10 mins ago',
    source: 'LIVE',
    crops: [
      { name: 'Wheat', currentPrice: '2,125', unit: 'Quintal', changePercent: '+12%', trend: 'up' },
      { name: 'Maize', currentPrice: '1,962', unit: 'Quintal', changePercent: '-5%', trend: 'down' },
      { name: 'Tomato', currentPrice: '1,200', unit: 'Quintal', changePercent: '0%', trend: 'flat' },
    ]
  });

  useEffect(() => {
    async function loadData() {
      // const res = await fetchMarketPrices();
      // setData(res);
      setLoading(false);
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

  const isLive = data.source === 'LIVE';

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={shared.pageTitle}>Mandi Prices</Text>
        <Text style={shared.pageSub}>Live agricultural rates</Text>
      </View>
      <ScrollView style={shared.content} showsVerticalScrollIndicator={false}>
        <View style={styles.searchBox}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput 
            placeholder="Search crop or mandi..." 
            style={styles.input} 
            placeholderTextColor={COLORS.gray600}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.lastUpdated}>Last Updated: {data.lastUpdated}</Text>
          <View style={[styles.badge, { backgroundColor: isLive ? COLORS.orange : COLORS.gray300 }]}>
            <Text style={styles.badgeText}>{data.source}</Text>
          </View>
        </View>

        <Text style={[shared.sectionTitle, { marginTop: 12 }]}>Today's Market</Text>
        
        {data.crops
          .filter((p: any) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((p: any, i: number) => {
          let trendColor = COLORS.gray600;
          let trendIcon = '—';
          if (p.trend === 'up') { trendColor = COLORS.green800; trendIcon = '▲'; }
          else if (p.trend === 'down') { trendColor = COLORS.red; trendIcon = '▼'; }

          return (
            <View key={i} style={styles.priceCard}>
              <View>
                <Text style={styles.cropName}>{p.name}</Text>
                <Text style={styles.cropUnit}>per {p.unit}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.priceText}>₹{p.currentPrice}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                  <Text style={[styles.trendIcon, { color: trendColor }]}>{trendIcon}</Text>
                  <Text style={[styles.trendText, { color: trendColor }]}>{p.changePercent}</Text>
                </View>
              </View>
            </View>
          );
        })}
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
  searchBox: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.white,
    borderRadius: RADIUS.md, paddingHorizontal: 16, paddingVertical: 12,
    marginBottom: 20, ...SHADOW.card,
  },
  input: { flex: 1, fontFamily: FONTS.sans, fontSize: 14, color: COLORS.gray800 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  lastUpdated: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.gray600 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontFamily: FONTS.sansBold, fontSize: 10, color: COLORS.white },
  priceCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: COLORS.white, borderRadius: RADIUS.lg, padding: 16, marginBottom: 12, ...SHADOW.card
  },
  cropName: { fontFamily: FONTS.sansBold, fontSize: 16, color: COLORS.gray800 },
  cropUnit: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.gray600, marginTop: 2 },
  priceText: { fontFamily: FONTS.sansExtra, fontSize: 18, color: COLORS.gray800 },
  trendIcon: { fontSize: 10, marginRight: 4 },
  trendText: { fontFamily: FONTS.sansBold, fontSize: 12 },
});
