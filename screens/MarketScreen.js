import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, StyleSheet, SafeAreaView, RefreshControl, StatusBar
} from 'react-native';
import { translateJson } from '../services/aiService';
import { LanguageContext } from '../context/LanguageContext';
import LanguageSelector from '../components/LanguageSelector';
import { getMarketPrices, searchCrops, getCropEmoji } from '../services/mandiService';

const SOURCE_LABELS = {
  api: { label: '● LIVE', color: '#A5D6A7' },
  cache: { label: '📦 CACHED', color: '#B0BEC5' },
  stale_cache: { label: '⚠ STALE', color: '#FFCC80' },
  ai_fallback: { label: '🤖 AI DATA', color: '#CE93D8' },
  fallback: { label: '📋 OFFLINE', color: '#B0BEC5' },
  error: { label: '❌ ERROR', color: '#EF9A9A' },
};

const MANDIS = ['APMC Hyderabad', 'Khammam', 'Warangal', 'Nalgonda', 'Bhadrachalam'];

export default function MarketPricesScreen() {
  const { t, language } = useContext(LanguageContext);
  const [allPrices, setAllPrices] = useState([]);
  const [displayPrices, setDisplayPrices] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [dataSource, setDataSource] = useState('');
  const [mandi, setMandi] = useState(0);

  const loadPrices = useCallback(async (isRefresh = false) => {
    try {
      const response = await getMarketPrices(50, isRefresh);
      const data = response.data;
      if (data && data.length > 0) {
        setAllPrices(data);
        setDataSource(response.source || 'api');
        setLastUpdated(new Date());
      } else {
        setAllPrices([]);
        setDataSource('error');
      }
    } catch (e) {
      setAllPrices([]);
      setDataSource('error');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadPrices();
    const interval = setInterval(() => loadPrices(true), 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadPrices]);

  useEffect(() => {
     if (allPrices.length === 0) return;
     if (language === 'en') {
       setDisplayPrices(search ? searchCrops(allPrices, search) : allPrices);
       return;
     }
     const translateAndSet = async () => {
         const payload = allPrices.map(c => ({
             id: c.id, displayName: c.displayName, state: c.state, topMarket: c.topMarket, trend: c.trend, arrivalDate: c.arrivalDate
         }));
         const txPayload = await translateJson(payload, language);
         const localized = allPrices.map(c => {
             const translatedItem = txPayload.find(t => t.id === c.id) || c;
             return { ...c, ...translatedItem };
         });
         setDisplayPrices(search ? searchCrops(localized, search) : localized);
     };
     translateAndSet();
  }, [allPrices, language, search]);

  const handleSearch = (text) => {
    setSearch(text);
    if (!text.trim()) setDisplayPrices(allPrices);
    else setDisplayPrices(searchCrops(allPrices, text));
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPrices(true);
  };

  const getTimeStr = () => lastUpdated ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
  const src = SOURCE_LABELS[dataSource] || SOURCE_LABELS.fallback;

  // Calculate top gainer
  const gainers = allPrices.filter(p => p.trend === 'Up').sort((a, b) => parseFloat(b.changePercent || '0') - parseFloat(a.changePercent || '0'));
  const topGainer = gainers.length > 0 ? gainers[0] : null;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#BF360C" />

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>📊 {t('mandiTitle') || 'Mandi Prices'}</Text>
          <Text style={s.sub}>{t('mandiSub') || 'Live rates'} · data.gov.in</Text>
          <View style={s.liveRow}>
            <View style={[s.liveDot, { backgroundColor: src.color }]} />
            <Text style={[s.liveText, { color: src.color }]}>{src.label} · {t('updated') || 'Updated'} {getTimeStr()}</Text>
          </View>
        </View>

        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 28 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#BF360C" />}
        >
        
        {/* SELL SIGNAL */}
        {topGainer && (
            <View style={s.sellCard}>
            <Text style={{ fontSize: 28 }}>🔥</Text>
            <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.sellLabel}>Best Sell Today</Text>
                <Text style={s.sellCrop}>{topGainer.displayName || topGainer.name} — ₹{parseFloat(topGainer.modalPricePerQuintal || 0).toLocaleString('en-IN')}/Qtl</Text>
                <Text style={s.sellChange}>▲ +{topGainer.changePercent}% this week · Good time to sell</Text>
            </View>
            </View>
        )}

        {/* MANDI SELECTOR */}
        <Text style={s.sectionTitle}>📍 Select Mandi</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingLeft: 16, marginBottom: 4 }}>
          {MANDIS.map((m, i) => (
            <TouchableOpacity
              key={i}
              style={[s.mandiChip, mandi === i && s.mandiChipActive]}
              onPress={() => setMandi(i)}
            >
              <Text style={[s.mandiChipText, mandi === i && s.mandiChipTextActive]}>
                {mandi === i ? '✓ ' : ''}{m}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* SEARCH */}
        <View style={s.searchBar}>
          <Text style={{ fontSize: 18 }}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder={t('searchPlaceholder') || "Search crop name..."}
            placeholderTextColor="#B0BEC5"
            value={search}
            onChangeText={handleSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <Text style={{ color: '#90A4AE', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* PRICE TABLE */}
        <Text style={s.sectionTitle}>💰 {MANDIS[mandi]} Rates</Text>
        <View style={s.table}>
          <View style={s.tableHead}>
            <Text style={[s.headText, { flex: 1.6 }]}>Crop</Text>
            <Text style={[s.headText, { flex: 1.2 }]}>Price (Qtl)</Text>
            <Text style={[s.headText, { flex: 1 }]}>Change</Text>
          </View>

          {isLoading && !refreshing ? (
             <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#1B5E20" />
             </View>
          ) : (
              displayPrices.map((p, i) => {
                  const isUp   = p.trend === 'Up';
                  const isDown = p.trend === 'Down';
                  const trendColor = isUp ? '#2E7D32' : isDown ? '#C62828' : '#546E7A';
                  return (
                    <View key={i} style={[s.row, i % 2 === 1 && s.rowAlt]}>
                    <View style={[s.cropCell, { flex: 1.6 }]}>
                        <Text style={{ fontSize: 20 }}>{getCropEmoji(p.displayName || p.name)}</Text>
                        <Text style={s.cropName}>{p.displayName || p.name}</Text>
                    </View>
                    <Text style={[s.priceText, { flex: 1.2 }]}>₹{parseFloat(p.modalPricePerQuintal || 0).toLocaleString('en-IN')}</Text>
                    <View style={{ flex: 1 }}>
                        <View style={[s.changePill, isUp ? s.pillUp : isDown ? s.pillDown : { backgroundColor: '#ECEFF1' }]}>
                        <Text style={[s.changeText, { color: trendColor }]}>
                            {isUp ? '▲' : isDown ? '▼' : '●'} {p.changePercent || '0%'}
                        </Text>
                        </View>
                    </View>
                    </View>
                  );
              })
          )}

          {!isLoading && displayPrices.length === 0 && (
            <View style={s.emptyRow}>
              <Text style={s.emptyText}>{search ? `No results for "${search}"` : 'No price data available.'}</Text>
            </View>
          )}
        </View>
        <Text style={s.sourceNote}>Source: Agmarknet / APMC · Prices in ₹ per quintal</Text>

      </ScrollView>
      <LanguageSelector />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F1F8E9' },
  header: {
    backgroundColor: '#BF360C',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 20,
  },
  title:   { color: '#fff', fontSize: 22, fontWeight: '800' },
  sub:     { color: 'rgba(255,255,255,0.75)', fontSize: 11, fontWeight: '500', marginTop: 3 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#A5D6A7' },
  liveText:{ color: '#A5D6A7', fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  sellCard: {
    margin: 16, backgroundColor: '#fff',
    borderRadius: 18, padding: 16,
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderColor: '#C8E6C9',
    shadowColor: '#2E7D32', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
  },
  sellLabel:  { fontSize: 11, fontWeight: '700', color: '#78909C', textTransform: 'uppercase', letterSpacing: 0.5 },
  sellCrop:   { fontSize: 16, fontWeight: '900', color: '#263238', marginTop: 2 },
  sellChange: { fontSize: 12, color: '#2E7D32', fontWeight: '700', marginTop: 2 },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#263238', marginHorizontal: 16, marginTop: 10, marginBottom: 10 },

  mandiChip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 22, backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#ECEFF1', marginRight: 8,
  },
  mandiChipActive:    { backgroundColor: '#BF360C', borderColor: '#BF360C' },
  mandiChipText:      { fontSize: 12, fontWeight: '600', color: '#546E7A' },
  mandiChipTextActive:{ color: '#fff', fontWeight: '700' },

  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginTop: 14, marginBottom: 4,
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    borderWidth: 1.5, borderColor: '#ECEFF1',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#263238', fontWeight: '500' },

  table: {
    marginHorizontal: 16, backgroundColor: '#fff',
    borderRadius: 18, overflow: 'hidden',
    borderWidth: 1.5, borderColor: '#ECEFF1',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
  },
  tableHead: {
    flexDirection: 'row', backgroundColor: '#1B5E20',
    paddingHorizontal: 16, paddingVertical: 11,
  },
  headText:   { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  row:        { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F8E9' },
  rowAlt:     { backgroundColor: '#F9FBF9' },
  cropCell:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cropName:   { fontSize: 13, fontWeight: '700', color: '#263238' },
  priceText:  { fontSize: 14, fontWeight: '900', color: '#263238' },
  changePill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, alignSelf: 'flex-start' },
  pillUp:     { backgroundColor: '#E8F5E9' },
  pillDown:   { backgroundColor: '#FFEBEE' },
  changeText: { fontSize: 11, fontWeight: '800' },
  emptyRow:   { padding: 24, alignItems: 'center' },
  emptyText:  { fontSize: 13, color: '#90A4AE', fontStyle: 'italic' },
  sourceNote: { marginHorizontal: 16, marginTop: 8, fontSize: 10, color: '#90A4AE', fontStyle: 'italic' },
});
