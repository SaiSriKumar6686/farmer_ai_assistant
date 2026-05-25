import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, Modal, RefreshControl,
  SafeAreaView, ScrollView, StyleSheet, Text,
  TextInput, TouchableOpacity, View, StatusBar,
} from 'react-native';
import EligibilityModal from '../components/EligibilityModal';
import { LanguageContext } from '../context/LanguageContext';
import { translateJson } from '../services/aiService';
import { fetchSchemes, fetchEligibleSchemes } from '../services/schemeService';

import LanguageSelector from '../components/LanguageSelector';

const FILTER_TABS = ['All', 'Insurance', 'Subsidies', 'Loans', 'General'];
const STATES = ['Telangana', 'Andhra Pradesh', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Madhya Pradesh', 'Other'];
const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'Minority'];
const CROPS = ['Rice', 'Wheat', 'Cotton', 'Maize', 'Tomato', 'Chilli', 'Soybean', 'Sugarcane', 'Groundnut', 'Other'];

const CATEGORY_STYLE = {
  Insurance: { bg: '#E3F2FD', text: '#1565C0', icon: '🛡' },
  Subsidies: { bg: '#E8F5E9', text: '#2E7D32', icon: '💰' },
  Loans:     { bg: '#FFF3E0', text: '#E65100', icon: '🏦' },
  Training:  { bg: '#F3E5F5', text: '#6A1B9A', icon: '🎓' },
  General:   { bg: '#F5F5F5', text: '#424242', icon: '📋' },
};

export default function SchemesScreen() {
  const { t, language } = useContext(LanguageContext);

  const [allSchemes, setAllSchemes] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [loadingSchemes, setLoadingSchemes] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [dataSource, setDataSource] = useState('master');
  const [expanded, setExpanded] = useState(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eligibleSchemes, setEligibleSchemes] = useState([]);
  const [formError, setFormError] = useState(null);
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [landAcres, setLandAcres] = useState('');
  const [crop, setCrop] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('kisan_farmer_profile').then(saved => {
      if (saved) {
        try {
          const p = JSON.parse(saved);
          if (p.name) setName(p.name);
          if (p.state) setState(p.state);
          if (p.landAcres) setLandAcres(p.landAcres);
          if (p.crop) setCrop(p.crop);
          if (p.category) setCategory(p.category);
        } catch (e) { }
      }
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem('kisan_farmer_profile', JSON.stringify({ name, state, landAcres, crop, category }));
  }, [name, state, landAcres, crop, category]);

  const loadSchemes = useCallback(async (force = false) => {
    if (allSchemes.length === 0) setLoadingSchemes(true);
    const { data, source } = await fetchSchemes(30, force);
    setAllSchemes(data || []);
    setDataSource(source);
    setLoadingSchemes(false);
    setRefreshing(false);
  }, [allSchemes.length]);

  useEffect(() => { loadSchemes(); }, []);

  useEffect(() => {
    if (allSchemes.length === 0) return;
    if (language === 'en') {
      applyFilters(allSchemes, searchQuery, activeFilter);
      return;
    }

    const doTranslate = async () => {
      const payload = allSchemes.map(s => ({
        id: s.id, schemeName: s.schemeName, fullTitle: s.fullTitle,
        category: s.category, tagline: s.tagline, description: s.description,
        benefits: s.benefits, eligibilityCriteria: s.eligibilityCriteria,
        applicationProcess: s.applicationProcess, state: s.state
      }));

      const txPayload = await translateJson(payload, language);

      const localized = allSchemes.map(s => {
        const tx = txPayload.find(t => t.id === s.id) || s;
        return {
          ...s,
          schemeName: tx.schemeName || s.schemeName,
          fullTitle: tx.fullTitle || s.fullTitle,
          category: tx.category || s.category,
          tagline: tx.tagline || s.tagline,
          description: tx.description || s.description,
          benefits: tx.benefits || s.benefits,
          eligibilityCriteria: tx.eligibilityCriteria || s.eligibilityCriteria,
          applicationProcess: tx.applicationProcess || s.applicationProcess,
          state: tx.state || s.state
        };
      });

      applyFilters(localized, searchQuery, activeFilter);
    };
    doTranslate();
  }, [allSchemes, language, searchQuery, activeFilter]);

  const onRefresh = () => { setRefreshing(true); loadSchemes(true); };

  const applyFilters = (schemes, query, filter) => {
    let result = [...schemes];
    if (filter !== 'All') {
      result = result.filter(s => s.category === filter);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(s =>
        s.schemeName?.toLowerCase().includes(q) ||
        s.description?.toLowerCase().includes(q) ||
        s.ministry?.toLowerCase().includes(q) ||
        s.benefits?.toLowerCase().includes(q) ||
        s.state?.toLowerCase().includes(q)
      );
    }
    setFiltered(result);
  };

  const handleSearch = (text) => {
    setSearchQuery(text);
    applyFilters(allSchemes, text, activeFilter);
  };

  const handleFilter = (f) => {
    setActiveFilter(f);
    applyFilters(allSchemes, searchQuery, f);
  };

  const openEligibilityCheck = (scheme) => {
    setSelectedScheme(scheme);
    setModalVisible(true);
  };

  const handleBulkSubmit = async () => {
    if (!name.trim() || !state || !landAcres.trim() || !crop || !category) {
      Alert.alert('Missing Details', 'Please fill all required fields.');
      return;
    }
    setIsSubmitting(true);
    setFormError(null);
    const profile = { name: name.trim(), state, land_acres: landAcres, crop, category, language };
    const result = await fetchEligibleSchemes(profile);
    setIsSubmitting(false);
    if (result.success) {
      setEligibleSchemes(result.schemes);
      setShowForm(false);
    } else {
      setFormError(result.error);
    }
  };

  const ChipSelector = ({ label, options, selected, onSelect }) => (
    <View style={s.fieldBlock}>
      <Text style={s.fieldLabel}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {options.map((opt, i) => (
          <TouchableOpacity
            key={i}
            style={[s.formChip, selected === opt && s.formChipActive]}
            onPress={() => onSelect(opt)}
          >
            <Text style={[s.formChipText, selected === opt && s.formChipTextActive]}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#4A148C" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4A148C" />}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>🏛 {t('schemesTitle') || 'Govt Schemes'}</Text>
          <Text style={s.sub}>{t('schemesSub') || 'Agricultural Benefits & Subsidies'} · Tap any card to apply</Text>
          <View style={s.searchBar}>
            <Text style={{ fontSize: 18 }}>🔍</Text>
            <TextInput
                style={s.searchInput}
                placeholder="Search schemes, ministry, state..."
                placeholderTextColor="#B0BEC5"
                value={searchQuery}
                onChangeText={handleSearch}
            />
            {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => handleSearch('')}>
                <Text style={{ color: '#90A4AE', fontSize: 16 }}>✕</Text>
                </TouchableOpacity>
            )}
            </View>
        </View>

        {/* FILTER CHIPS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterScroll}>
          {FILTER_TABS.map((f, i) => (
            <TouchableOpacity
              key={i}
              style={[s.chip, activeFilter === f && s.chipActive]}
              onPress={() => handleFilter(f)}
            >
              <Text style={[s.chipText, activeFilter === f && s.chipTextActive]}>{f}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            style={[s.chip, { backgroundColor: '#E1BEE7', borderColor: '#CE93D8' }]}
            onPress={() => setShowForm(!showForm)}
          >
            <Text style={[s.chipText, { color: '#4A148C' }]}>🤖 bulk AI Check</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* SCHEME CARDS */}
        {loadingSchemes && !refreshing ? (
             <ActivityIndicator size="large" color="#4A148C" style={{ marginTop: 40 }} />
        ) : (
            filtered.map((scheme, i) => {
            const open = expanded === i;
            const cat = CATEGORY_STYLE[scheme.category] || CATEGORY_STYLE.General;
            return (
                <TouchableOpacity
                key={scheme.id || i}
                style={s.card}
                activeOpacity={0.92}
                onPress={() => setExpanded(open ? null : i)}
                >
                <View style={s.cardTop}>
                    <View style={[s.iconBox, { backgroundColor: cat.bg }]}>
                    <Text style={{ fontSize: 26 }}>{cat.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                    <Text style={s.cardName}>{scheme.schemeName}</Text>
                    <Text style={[s.cardAmount, { color: cat.text }]}>{scheme.tagline || 'Benefits Available'}</Text>
                    <Text style={s.cardMinistry}>🏛 {scheme.ministry || scheme.state}</Text>
                    </View>
                    <Text style={[s.chevron, { color: cat.text }]}>{open ? '▲' : '▼'}</Text>
                </View>

                <View style={s.tags}>
                    {scheme.category && (
                    <View style={[s.tag, { backgroundColor: cat.bg }]}>
                        <Text style={[s.tagText, { color: cat.text }]}>{scheme.category.toUpperCase()}</Text>
                    </View>
                    )}
                    {(scheme.state || scheme.badge) && (
                    <View style={[s.tag, { backgroundColor: '#ECEFF1' }]}>
                        <Text style={[s.tagText, { color: '#546E7A' }]}>
                        {scheme.badge || (scheme.state === 'Central' ? 'Central' : scheme.state)}
                        </Text>
                    </View>
                    )}
                </View>

                {open && (
                    <View style={s.expanded}>
                    <View style={s.divider} />
                    <Text style={s.expandDesc}>{scheme.description}</Text>

                    <Text style={s.stepsTitle}>🎁 Benefits</Text>
                    <Text style={s.stepText}>{scheme.benefits}</Text>

                    <Text style={[s.stepsTitle, { marginTop: 10 }]}>📋 Process</Text>
                    <Text style={s.stepText}>{scheme.applicationProcess || 'Check official portal for updates.'}</Text>

                    <TouchableOpacity
                        style={[s.applyBtn, { backgroundColor: cat.text }]}
                        onPress={() => openEligibilityCheck(scheme)}
                        activeOpacity={0.85}
                    >
                        <Text style={s.applyText}>🤖 Check AI Eligibility for this Scheme</Text>
                    </TouchableOpacity>
                    </View>
                )}
                </TouchableOpacity>
            );
            })
        )}

        {!loadingSchemes && filtered.length === 0 && (
          <View style={s.empty}>
            <Text style={{ fontSize: 36 }}>🔍</Text>
            <Text style={s.emptyText}>{t('noSchemesFound')}</Text>
            <TouchableOpacity onPress={() => { handleFilter('All'); handleSearch(''); }}>
                <Text style={{ color: '#4A148C', fontWeight: '800', marginTop: 12 }}>
                {t('clearFilters') || 'Clear Filters'}
                </Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* AI BULK FORM MODAL */}
      <Modal visible={showForm} animationType="slide" transparent={true} onRequestClose={() => setShowForm(false)}>
          <View style={s.modalOverlay}>
            <View style={s.modalContent}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <Text style={s.formTitle}>🤖 AI Bulk Eligibility</Text>
                <TouchableOpacity onPress={() => setShowForm(false)} style={{ padding: 4 }}>
                  <Text style={{ fontSize: 20, color: '#78909C' }}>✕</Text>
                </TouchableOpacity>
              </View>
              <Text style={s.formDesc}>Find ALL schemes you qualify for by providing basic context.</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={s.fieldBlock}>
                  <Text style={s.fieldLabel}>{t('fullName')}</Text>
                  <TextInput style={s.textInput} placeholder="e.g. Ravi Kumar"
                    placeholderTextColor="#B0BEC5" value={name} onChangeText={setName} />
                </View>

                <ChipSelector label={t('stateLabel') || 'Select State'} options={STATES} selected={state} onSelect={setState} />
                <View style={s.fieldBlock}>
                  <Text style={s.fieldLabel}>{t('landSize') || 'Land Size (Acres)'}</Text>
                  <TextInput style={s.textInput} placeholder={t('landSizePlaceholder') || 'E.g. 2.5'} keyboardType="numeric"
                    placeholderTextColor="#B0BEC5" value={landAcres} onChangeText={setLandAcres} />
                </View>
                <ChipSelector label={t('primaryCrop') || 'Primary Crop'} options={CROPS} selected={crop} onSelect={setCrop} />
                <ChipSelector label={t('category') || 'Category'} options={CATEGORIES} selected={category} onSelect={setCategory} />

                <TouchableOpacity style={s.submitBtn} onPress={handleBulkSubmit} disabled={isSubmitting}>
                  {isSubmitting
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={s.submitBtnText}>{t('findEligible') || 'Find Schemes'}</Text>
                  }
                </TouchableOpacity>
                {formError && <Text style={s.errorText}>{formError}</Text>}

                {/* AI Results */}
                {eligibleSchemes.length > 0 && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={s.aiResultTitle}>✅ {eligibleSchemes.length} {t('aiSchemesFound')}</Text>
                    {eligibleSchemes.map((scheme, i) => (
                      <View key={i} style={s.aiResultCard}>
                        <Text style={s.aiResultName}>{scheme.name || scheme.schemeName}</Text>
                        {(scheme.benefit || scheme.tagline) && <Text style={s.aiResultBenefit}>{scheme.benefit || scheme.tagline}</Text>}
                        {scheme.desc && <Text style={s.aiResultDesc}>{scheme.desc}</Text>}
                      </View>
                    ))}
                  </View>
                )}
                <View style={{ height: 40 }} />
              </ScrollView>
            </View>
          </View>
        </Modal>

      <EligibilityModal
        visible={modalVisible}
        scheme={selectedScheme}
        onClose={() => { setModalVisible(false); setSelectedScheme(null); }}
      />
      <LanguageSelector />
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
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 14, marginBottom: 4,
    backgroundColor: '#fff', borderRadius: 14, padding: 12,
    borderWidth: 1.5, borderColor: '#ECEFF1',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14, color: '#263238', fontWeight: '500' },

  filterScroll: { paddingLeft: 16, marginTop: 14, marginBottom: 6, maxHeight: 44, flexGrow: 0 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 9,
    borderRadius: 22, backgroundColor: '#fff',
    borderWidth: 1.5, borderColor: '#ECEFF1', marginRight: 8, alignSelf: 'center'
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
  cardName:   { fontSize: 14, fontWeight: '800', color: '#263238', lineHeight: 18 },
  cardAmount: { fontSize: 11, fontWeight: '800', marginTop: 3 },
  cardMinistry:{ fontSize: 10, color: '#90A4AE', marginTop: 2, fontWeight: '600' },
  chevron:    { fontSize: 14, fontWeight: '700', marginTop: 4 },

  tags:    { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  tagText: { fontSize: 10, fontWeight: '800' },

  expanded:    { marginTop: 12 },
  divider:     { height: 1.5, backgroundColor: '#F1F8E9', marginBottom: 12 },
  expandDesc:  { fontSize: 12, color: '#546E7A', lineHeight: 18, marginBottom: 14, fontWeight: '600' },
  stepsTitle:  { fontSize: 12, fontWeight: '800', color: '#263238', marginBottom: 10 },
  stepText:    { fontSize: 12, color: '#546E7A', flex: 1, lineHeight: 18, fontWeight: '500', paddingLeft: 4 },

  applyBtn:    { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  applyText:   { color: '#fff', fontSize: 12, fontWeight: '800' },

  empty:     { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, color: '#90A4AE', fontWeight: '500' },

  // AI FORM
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  formTitle: { fontSize: 18, fontWeight: '800', color: '#4A148C' },
  formDesc: { fontSize: 12, color: '#78909C', fontWeight: '500', marginBottom: 16 },
  fieldBlock: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#263238', marginBottom: 6 },
  textInput: { backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 13, color: '#263238', fontWeight: '500' },
  formChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#ECEFF1', marginRight: 8 },
  formChipActive: { backgroundColor: '#4A148C', borderColor: '#4A148C' },
  formChipText: { fontSize: 12, fontWeight: '600', color: '#546E7A' },
  formChipTextActive: { color: '#fff' },
  submitBtn: { backgroundColor: '#4A148C', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  submitBtnText: { color: '#fff', fontSize: 14, fontWeight: '800' },
  errorText: { fontSize: 12, color: '#E53935', marginTop: 8, fontWeight: '600', textAlign: 'center' },
  aiResultTitle: { fontWeight: '800', fontSize: 14, color: '#2E7D32', marginBottom: 10 },
  aiResultCard: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 12, marginBottom: 8, borderLeftWidth: 3, borderLeftColor: '#2E7D32' },
  aiResultName: { fontWeight: '800', fontSize: 13, color: '#263238', marginBottom: 2 },
  aiResultBenefit: { fontWeight: '700', fontSize: 11, color: '#2E7D32', marginBottom: 4 },
  aiResultDesc: { fontWeight: '500', fontSize: 11, color: '#546E7A', lineHeight: 16 },
});
