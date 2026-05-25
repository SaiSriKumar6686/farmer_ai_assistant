import React, { useState } from 'react';
import {
  View, Text, ScrollView, TextInput,
  StyleSheet, SafeAreaView, StatusBar, TouchableOpacity,
} from 'react-native';

const PRICES = [
  { emoji: '🌾', name: 'Wheat',     price: 2350, unit: '₹/Qtl', change: +1.10, up: true  },
  { emoji: '🌾', name: 'Rice',      price: 3979, unit: '₹/Qtl', change: +21.5, up: true  },
  { emoji: '🌽', name: 'Maize',     price: 1758, unit: '₹/Qtl', change: -24.0, up: false },
  { emoji: '🍅', name: 'Tomato',    price: 1773, unit: '₹/Qtl', change: -40.0, up: false },
  { emoji: '🧅', name: 'Onion',     price: 1200, unit: '₹/Qtl', change: +26.9, up: true  },
  { emoji: '🫑', name: 'Chilli',    price: 9500, unit: '₹/Qtl', change: +3.20, up: true  },
  { emoji: '🌱', name: 'Soybean',   price: 4600, unit: '₹/Qtl', change: -1.50, up: false },
  { emoji: '🥜', name: 'Groundnut', price: 6100, unit: '₹/Qtl', change: +0.80, up: true  },
  { emoji: '🌿', name: 'Cotton',    price: 7277, unit: '₹/Qtl', change: -5.60, up: false },
];

const MANDIS = ['APMC Hyderabad', 'Khammam', 'Warangal', 'Nalgonda', 'Bhadrachalam'];

export default function MarketPricesScreen() {
  const [query, setQuery]     = useState('');
  const [mandi, setMandi]     = useState(0);

  const filtered = PRICES.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
  const topGainer = [...PRICES].filter(p => p.up).sort((a, b) => b.change - a.change)[0];

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#BF360C" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>📊 Mandi Prices</Text>
          <Text style={s.sub}>Live rates · Updated 15 min ago</Text>
          <View style={s.liveRow}>
            <View style={s.liveDot} />
            <Text style={s.liveText}>LIVE</Text>
          </View>
        </View>

        {/* SELL SIGNAL */}
        <View style={s.sellCard}>
          <Text style={{ fontSize: 28 }}>🔥</Text>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={s.sellLabel}>Best Sell Today</Text>
            <Text style={s.sellCrop}>{topGainer?.name} — ₹{topGainer?.price}/Qtl</Text>
            <Text style={s.sellChange}>▲ +{topGainer?.change}% this week · Good time to sell</Text>
          </View>
        </View>

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
            placeholder="Search crop name..."
            placeholderTextColor="#B0BEC5"
            value={query}
            onChangeText={setQuery}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Text style={{ color: '#90A4AE', fontSize: 16 }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* PRICE TABLE */}
        <Text style={s.sectionTitle}>💰 {MANDIS[mandi]} Rates</Text>
        <View style={s.table}>
          <View style={s.tableHead}>
            <Text style={[s.headText, { flex: 1.6 }]}>Crop</Text>
            <Text style={[s.headText, { flex: 1.2 }]}>Price</Text>
            <Text style={[s.headText, { flex: 1 }]}>Change</Text>
          </View>
          {filtered.map((p, i) => (
            <View key={i} style={[s.row, i % 2 === 1 && s.rowAlt]}>
              <View style={[s.cropCell, { flex: 1.6 }]}>
                <Text style={{ fontSize: 20 }}>{p.emoji}</Text>
                <Text style={s.cropName}>{p.name}</Text>
              </View>
              <Text style={[s.priceText, { flex: 1.2 }]}>₹{p.price.toLocaleString()}</Text>
              <View style={{ flex: 1 }}>
                <View style={[s.changePill, p.up ? s.pillUp : s.pillDown]}>
                  <Text style={[s.changeText, { color: p.up ? '#2E7D32' : '#C62828' }]}>
                    {p.up ? '▲' : '▼'} {Math.abs(p.change)}%
                  </Text>
                </View>
              </View>
            </View>
          ))}
          {filtered.length === 0 && (
            <View style={s.emptyRow}>
              <Text style={s.emptyText}>No results for "{query}"</Text>
            </View>
          )}
        </View>
        <Text style={s.sourceNote}>Source: Agmarknet / APMC · Prices in ₹ per quintal</Text>

      </ScrollView>
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
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
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
