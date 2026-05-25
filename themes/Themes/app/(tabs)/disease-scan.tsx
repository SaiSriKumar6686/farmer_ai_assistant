import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, SafeAreaView, Alert, StatusBar,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const HISTORY = [
  { crop: 'Wheat',  disease: 'Leaf Rust',    date: 'Today, 8 AM',   severity: 'High',   ok: false, icon: '🌾' },
  { crop: 'Tomato', disease: 'Healthy ✅',    date: 'Yesterday',     severity: 'None',   ok: true,  icon: '🍅' },
  { crop: 'Maize',  disease: 'Smut Detected', date: 'Mar 22',        severity: 'Medium', ok: false, icon: '🌽' },
];

export default function DiseaseScanScreen() {
  const [showResult, setShowResult] = useState(true);

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'Camera access is required to scan leaves.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setShowResult(true);
    }
  };

  const openGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'Gallery access is required to pick photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setShowResult(true);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>🔬 Crop Disease Scanner</Text>
          <Text style={s.subtitle}>AI-powered · Instant results</Text>
        </View>

        {/* BIG SCAN BUTTON */}
        <View style={s.scanSection}>
          <TouchableOpacity
            style={s.scanBtn}
            activeOpacity={0.85}
            onPress={openCamera}
          >
            <Text style={s.scanIcon}>📸</Text>
            <Text style={s.scanLabel}>Tap to Scan a Leaf</Text>
            <Text style={s.scanSub}>Works best in natural light</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={s.galleryBtn}
            onPress={openGallery}
          >
            <Text style={s.galleryText}>🖼  Choose from Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* HOW IT WORKS */}
        <View style={s.howCard}>
          <Text style={s.howTitle}>📋 How to get best results</Text>
          {[
            ['1️⃣', 'Hold phone 20–30 cm from the leaf'],
            ['2️⃣', 'Make sure leaf fills the frame'],
            ['3️⃣', 'Scan in daylight, not shadow'],
            ['4️⃣', 'Scan both healthy AND sick leaves'],
          ].map(([num, tip], i) => (
            <View key={i} style={s.howRow}>
              <Text style={s.howNum}>{num}</Text>
              <Text style={s.howTip}>{tip}</Text>
            </View>
          ))}
        </View>

        {/* LAST SCAN RESULT */}
        {showResult && (
          <View style={s.resultCard}>
            <View style={s.resultHeader}>
              <Text style={s.resultTitle}>📊 Last Scan Result</Text>
              <TouchableOpacity onPress={() => setShowResult(false)}>
                <Text style={s.resultClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={s.resultBody}>
              <View style={s.resultIconBox}><Text style={{ fontSize: 32 }}>🌾</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.resultCrop}>Wheat — Field 2</Text>
                <Text style={s.resultDisease}>Leaf Rust Detected</Text>
                <Text style={s.resultConf}>Confidence: 94%</Text>
              </View>
              <View style={s.severityBadge}>
                <Text style={s.severityText}>HIGH</Text>
              </View>
            </View>

            <View style={s.divider} />
            <Text style={s.remedyHead}>💊 Treatment Steps</Text>
            {[
              'Spray Mancozeb 75WP — 2g per litre of water',
              'Remove and burn all infected leaves',
              'Spray again after 7 days if needed',
            ].map((r, i) => (
              <View key={i} style={s.remedyRow}>
                <View style={s.dot} />
                <Text style={s.remedyText}>{r}</Text>
              </View>
            ))}
          </View>
        )}

        {/* SCAN HISTORY */}
        <View style={s.histSection}>
          <Text style={s.histTitle}>🕐 Recent Scans</Text>
        </View>

        {HISTORY.map((h, i) => (
          <View key={i} style={s.histCard}>
            <View style={[s.histIcon, { backgroundColor: h.ok ? '#E8F5E9' : '#FFEBEE' }]}>
              <Text style={{ fontSize: 22 }}>{h.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.histCrop}>{h.crop}</Text>
              <Text style={s.histDisease}>{h.disease}</Text>
              <Text style={s.histDate}>{h.date}</Text>
            </View>
            <View style={[s.sevBadge, h.ok ? s.sevGood : h.severity === 'High' ? s.sevHigh : s.sevMed]}>
              <Text style={[s.sevText, { color: h.ok ? '#2E7D32' : h.severity === 'High' ? '#C62828' : '#E65100' }]}>
                {h.ok ? '✓ Good' : h.severity}
              </Text>
            </View>
          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#F1F8E9' },
  header:    { backgroundColor: '#1B5E20', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 22 },
  title:     { color: '#fff', fontSize: 22, fontWeight: '800' },
  subtitle:  { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500', marginTop: 3 },

  scanSection: { paddingHorizontal: 16, paddingTop: 16, gap: 10 },
  scanBtn: {
    backgroundColor: '#2E7D32', borderRadius: 22,
    paddingVertical: 32, alignItems: 'center', gap: 8,
    shadowColor: '#1B5E20', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 14, elevation: 8,
  },
  scanIcon:  { fontSize: 52 },
  scanLabel: { color: '#fff', fontSize: 20, fontWeight: '800' },
  scanSub:   { color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: '500' },
  galleryBtn: {
    backgroundColor: '#fff', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
    borderWidth: 2, borderColor: '#C8E6C9',
  },
  galleryText: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },

  howCard: {
    marginHorizontal: 16, marginTop: 14,
    backgroundColor: '#fff', borderRadius: 18,
    padding: 16, borderWidth: 1.5, borderColor: '#C8E6C9',
  },
  howTitle: { fontSize: 13, fontWeight: '800', color: '#263238', marginBottom: 10 },
  howRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  howNum:   { fontSize: 16 },
  howTip:   { fontSize: 13, color: '#546E7A', fontWeight: '500', flex: 1 },

  resultCard: {
    marginHorizontal: 16, marginTop: 14,
    backgroundColor: '#fff', borderRadius: 18,
    padding: 16, borderWidth: 2, borderColor: '#FFCDD2',
    shadowColor: '#E53935', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 4,
  },
  resultHeader:  { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  resultTitle:   { fontSize: 13, fontWeight: '800', color: '#263238' },
  resultClose:   { fontSize: 16, color: '#90A4AE', padding: 2 },
  resultBody:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  resultIconBox: { width: 54, height: 54, borderRadius: 14, backgroundColor: '#FFF9C4', alignItems: 'center', justifyContent: 'center' },
  resultCrop:    { fontSize: 13, fontWeight: '800', color: '#263238' },
  resultDisease: { fontSize: 12, color: '#E53935', fontWeight: '700', marginTop: 2 },
  resultConf:    { fontSize: 11, color: '#78909C', marginTop: 2 },
  severityBadge: { backgroundColor: '#FFEBEE', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  severityText:  { fontSize: 10, fontWeight: '900', color: '#C62828', letterSpacing: 0.5 },
  divider:       { height: 1, backgroundColor: '#ECEFF1', marginBottom: 10 },
  remedyHead:    { fontSize: 12, fontWeight: '800', color: '#263238', marginBottom: 8 },
  remedyRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 6 },
  dot:           { width: 6, height: 6, borderRadius: 3, backgroundColor: '#43A047', marginTop: 5 },
  remedyText:    { fontSize: 12, color: '#546E7A', flex: 1, lineHeight: 18, fontWeight: '500' },

  histSection: { paddingHorizontal: 16, marginTop: 18, marginBottom: 10 },
  histTitle:   { fontSize: 14, fontWeight: '800', color: '#263238' },
  histCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', marginHorizontal: 16,
    marginBottom: 8, borderRadius: 16, padding: 14,
    borderWidth: 1.5, borderColor: '#ECEFF1',
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06, shadowRadius: 4, elevation: 2,
  },
  histIcon:    { width: 46, height: 46, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  histCrop:    { fontSize: 13, fontWeight: '800', color: '#263238' },
  histDisease: { fontSize: 11, color: '#546E7A', fontWeight: '600', marginTop: 1 },
  histDate:    { fontSize: 10, color: '#90A4AE', marginTop: 2 },
  sevBadge:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  sevGood:     { backgroundColor: '#E8F5E9' },
  sevHigh:     { backgroundColor: '#FFEBEE' },
  sevMed:      { backgroundColor: '#FFF3E0' },
  sevText:     { fontSize: 10, fontWeight: '800' },
});
