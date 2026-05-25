import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, StatusBar, Alert, Linking,
} from 'react-native';

const FILTERS = ['All', 'Income', 'Insurance', 'Subsidy', 'Credit'];

const SCHEMES = [
  {
    icon: '💰', bg: '#E8F5E9', accent: '#2E7D32',
    name: 'PM-KISAN Samman Nidhi',
    amount: '₹6,000 / year',
    ministry: 'Ministry of Agriculture',
    tags: ['Income', 'Direct Bank Transfer'],
    tagFilter: 'Income',
    desc: 'Confirmed for 2026: Get ₹2,000 every 4 months directly to your bank account. Over ₹63,500 crore allocated in the 2026-27 budget.',
    steps: ['Register on pmkisan.gov.in', 'Submit Aadhaar + land records', 'Money comes in 3 instalments'],
    url: 'https://pmkisan.gov.in',
  },
  {
    icon: '🛡', bg: '#E3F2FD', accent: '#1565C0',
    name: 'PM Fasal Bima Yojana (PMFBY)',
    amount: 'Full coverage guaranteed',
    ministry: 'Ministry of Agriculture',
    tags: ['Insurance', 'Natural Disaster'],
    tagFilter: 'Insurance',
    desc: 'Now expanded in 2026 to include wild animal attacks and paddy inundation. Pay minimal premium (2% for Kharif).',
    steps: ['Apply before sowing season', 'Pay small premium (2% Kharif)', 'Claim if crop is damaged'],
    url: 'https://pmfby.gov.in',
  },
  {
    icon: '🚁', bg: '#FCE4EC', accent: '#C2185B',
    name: 'Namo Drone Didi Scheme',
    amount: '80% subsidy on drone',
    ministry: 'Ministry of Agriculture',
    tags: ['Subsidy', 'Technology'],
    tagFilter: 'Subsidy',
    desc: 'Empowering women SHGs with agricultural drones. ₹677 crore allocated in 2026-27 to deeply subsidize drone costs (up to 80%).',
    steps: ['Apply via local Women Self Help Group', 'Complete 15-day pilot training', 'Receive subsidized agricultural drone'],
    url: 'https://agricoop.nic.in',
  },
  {
    icon: '🏦', bg: '#F3E5F5', accent: '#6A1B9A',
    name: 'Kisan Credit Card (KCC)',
    amount: 'Up to ₹5 lakh at 4%',
    ministry: 'NABARD / Local Banks',
    tags: ['Credit', 'Low Interest'],
    tagFilter: 'Credit',
    desc: 'Extended to ₹5 lakh in 2026. Get farm credit for seeds, fertilizers, or Fisheries/Animal Husbandry at just 4% interest.',
    steps: ['Visit your nearest bank', 'Apply for KCC — simplified process', 'Withdraw money as needed'],
    url: 'https://agricoop.nic.in/kcc',
  },
  {
    icon: '🏗', bg: '#EFEBE9', accent: '#5D4037',
    name: 'Agriculture Infrastructure Fund (AIF)',
    amount: 'Subsidized loans up to ₹2 Crore',
    ministry: 'Ministry of Agriculture',
    tags: ['Credit', 'Infrastructure'],
    tagFilter: 'Credit',
    desc: 'Build post-harvest infrastructure like cold storage or warehouses. Includes interest subvention and CGTMSE credit guarantee support.',
    steps: ['Prepare DPR for storage facility', 'Apply online on AIF portal', 'Get bank approval with subvention'],
    url: 'https://agriinfra.dac.gov.in',
  },
  {
    icon: '⚡', bg: '#FFF8E1', accent: '#E65100',
    name: 'PM Kusum Yojana',
    amount: '90% subsidy on solar pump',
    ministry: 'Ministry of Renewable Energy',
    tags: ['Subsidy', 'Solar'],
    tagFilter: 'Subsidy',
    desc: 'Get solar water pump at just 10% cost. Stop spending on diesel. Over 49 lakh pumps solarized by 2026.',
    steps: ['Apply at State Agriculture Dept', 'Pay 10% of pump cost', 'Get pump installed'],
    url: 'https://mnre.gov.in/solar/schemes',
  },
];

export default function SchemesScreen() {
  const [filter, setFilter]     = useState('All');
  const [expanded, setExpanded] = useState<number | null>(null);

  const visible = filter === 'All' ? SCHEMES : SCHEMES.filter(s => s.tags.includes(filter));

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#4A148C" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>🏛 Govt Schemes</Text>
          <Text style={s.sub}>Benefits you are eligible for · Tap any card to know how to apply</Text>
          <View style={s.eligPill}>
            <Text style={s.eligText}>✅  {SCHEMES.length} schemes available for farmers</Text>
          </View>
        </View>

        {/* FILTER CHIPS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll}>
          {FILTERS.map((f, i) => (
            <TouchableOpacity
              key={i}
              style={[s.chip, filter === f && s.chipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[s.chipText, filter === f && s.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* SCHEME CARDS */}
        {visible.map((scheme, i) => {
          const open = expanded === i;
          return (
            <TouchableOpacity
              key={i}
              style={s.card}
              activeOpacity={0.92}
              onPress={() => setExpanded(open ? null : i)}
            >
              {/* Card Top */}
              <View style={s.cardTop}>
                <View style={[s.iconBox, { backgroundColor: scheme.bg }]}>
                  <Text style={{ fontSize: 26 }}>{scheme.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.cardName}>{scheme.name}</Text>
                  <Text style={[s.cardAmount, { color: scheme.accent }]}>{scheme.amount}</Text>
                  <Text style={s.cardMinistry}>{scheme.ministry}</Text>
                </View>
                <Text style={[s.chevron, { color: scheme.accent }]}>{open ? '▲' : '▼'}</Text>
              </View>

              {/* Tags */}
              <View style={s.tags}>
                {scheme.tags.map((t, j) => (
                  <View key={j} style={[s.tag, { backgroundColor: scheme.bg }]}>
                    <Text style={[s.tagText, { color: scheme.accent }]}>{t}</Text>
                  </View>
                ))}
              </View>

              {/* Expanded content */}
              {open && (
                <View style={s.expanded}>
                  <View style={s.divider} />
                  <Text style={s.expandDesc}>{scheme.desc}</Text>

                  <Text style={s.stepsTitle}>📋 How to Apply</Text>
                  {scheme.steps.map((step, j) => (
                    <View key={j} style={s.stepRow}>
                      <View style={[s.stepNum, { backgroundColor: scheme.bg }]}>
                        <Text style={[s.stepNumText, { color: scheme.accent }]}>{j + 1}</Text>
                      </View>
                      <Text style={s.stepText}>{step}</Text>
                    </View>
                  ))}

                  <TouchableOpacity
                    style={[s.applyBtn, { backgroundColor: scheme.accent }]}
                    onPress={() => Linking.openURL(scheme.url)}
                    activeOpacity={0.85}
                  >
                    <Text style={s.applyText}>Apply Now on Official Website →</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          );
        })}

        {visible.length === 0 && (
          <View style={s.empty}>
            <Text style={{ fontSize: 36 }}>🔍</Text>
            <Text style={s.emptyText}>No schemes in this category</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: '#F1F8E9' },
  header: {
    backgroundColor: '#4A148C',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 22,
  },
  title:    { color: '#fff', fontSize: 22, fontWeight: '800' },
  sub:      { color: 'rgba(255,255,255,0.72)', fontSize: 11, fontWeight: '500', marginTop: 4, lineHeight: 16 },
  eligPill: {
    marginTop: 12, backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7,
    alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  eligText: { color: '#fff', fontSize: 12, fontWeight: '700' },

  filterScroll: { paddingLeft: 16, marginTop: 14, marginBottom: 6 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 22, backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#ECEFF1', marginRight: 8,
  },
  chipActive:    { backgroundColor: '#4A148C', borderColor: '#4A148C' },
  chipText:      { fontSize: 12, fontWeight: '600', color: '#546E7A' },
  chipTextActive:{ color: '#fff', fontWeight: '700' },

  card: {
    marginHorizontal: 16, marginTop: 10,
    backgroundColor: '#fff', borderRadius: 20,
    padding: 16, borderWidth: 1.5, borderColor: '#ECEFF1',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07, shadowRadius: 8, elevation: 3,
  },
  cardTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 10 },
  iconBox:    { width: 52, height: 52, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardName:   { fontSize: 13, fontWeight: '800', color: '#263238', lineHeight: 18 },
  cardAmount: { fontSize: 12, fontWeight: '800', marginTop: 2 },
  cardMinistry:{ fontSize: 10, color: '#90A4AE', marginTop: 2, fontWeight: '500' },
  chevron:    { fontSize: 14, fontWeight: '700', marginTop: 4 },

  tags:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 10, fontWeight: '700' },

  expanded:    { marginTop: 12 },
  divider:     { height: 1.5, backgroundColor: '#F1F8E9', marginBottom: 12 },
  expandDesc:  { fontSize: 13, color: '#546E7A', lineHeight: 20, marginBottom: 14, fontWeight: '500' },
  stepsTitle:  { fontSize: 13, fontWeight: '800', color: '#263238', marginBottom: 10 },
  stepRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 8 },
  stepNum:     { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  stepNumText: { fontSize: 12, fontWeight: '900' },
  stepText:    { fontSize: 13, color: '#546E7A', flex: 1, lineHeight: 18, fontWeight: '500', paddingTop: 3 },

  applyBtn:    { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  applyText:   { color: '#fff', fontSize: 14, fontWeight: '800' },

  empty:     { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, color: '#90A4AE', fontWeight: '500' },
});
