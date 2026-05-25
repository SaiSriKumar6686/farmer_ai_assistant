import React, { useState, useContext, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  StyleSheet, SafeAreaView, ActivityIndicator, Alert, StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { predictDisease } from '../services/diseaseService';
import { LanguageContext } from '../context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveDiseaseLog } from '../firebase/helpers';
import LanguageSelector from '../components/LanguageSelector';

export default function DiseaseScreen() {
  const router = useRouter();
  const { t, language } = useContext(LanguageContext);
  const [imageUri, setImageUri] = useState(null);
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);

  useEffect(() => {
    AsyncStorage.getItem('kisan_scan_history').then(saved => {
      if (saved) {
        try { setScanHistory(JSON.parse(saved)); } catch(e) {}
      }
    });
  }, []);

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'Camera access is required to scan leaves.');
      return;
    }
    const pickerResult = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });
    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      const uri = pickerResult.assets[0].uri;
      setImageUri(uri);
      setResult(null);
      analyzeImage(uri);
    }
  };

  const openGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      Alert.alert('Permission Denied', 'Gallery access is required to pick photos.');
      return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 1,
    });
    if (!pickerResult.canceled && pickerResult.assets && pickerResult.assets.length > 0) {
      const uri = pickerResult.assets[0].uri;
      setImageUri(uri);
      setResult(null);
      analyzeImage(uri);
    }
  };

  const clearScan = () => {
    setImageUri(null);
    setResult(null);
  };

  const analyzeImage = async (uri) => {
    setIsLoading(true);
    try {
      const aiResult = await predictDisease(uri, language);
      setResult(aiResult);
      // Add to history and persist locally
      setScanHistory(prev => {
        const updated = [
          { result: aiResult, time: new Date().toLocaleTimeString(), uri: uri, timestamp: Date.now() },
          ...prev.slice(0, 4),
        ];
        AsyncStorage.setItem('kisan_scan_history', JSON.stringify(updated));
        return updated;
      });
      if (aiResult?.success) {
        saveDiseaseLog({
          diagnosis:      aiResult.diagnosis,
          confidence:     aiResult.confidence,
          severity:       aiResult.severity,
          recommendation: aiResult.recommendation,
          isHealthy:      aiResult.is_healthy || false,
          language,
        }).catch(() => {});
      }
    } catch (e) {
      setResult({ success: false, error: t('analysisFailed') });
    } finally {
      setIsLoading(false);
    }
  };

  // Parse result object for display
  const parsedDiagnosis   = result?.success ? result.diagnosis : (result?.error || null);
  const parsedConfidence  = result?.success && result.confidence != null
    ? `${(result.confidence * 100).toFixed(1)}%`
    : null;
  const parsedSeverity    = result?.success ? (result.severity || 'Moderate') : null;
  const parsedRecommend   = result?.success ? result.recommendation : null;

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#1B5E20" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 28 }}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>🔬 {t('diseaseTitle') || 'Crop Disease Scanner'}</Text>
          <Text style={s.subtitle}>AI-powered · Instant results</Text>
        </View>

        {/* BIG SCAN BUTTON */}
        <View style={s.scanSection}>
          {imageUri ? (
            <View style={s.previewWrap}>
              <Image source={{ uri: imageUri }} style={s.previewImage} />
              {isLoading && (
                <View style={s.previewOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                  <Text style={s.previewOverlayText}>{t('aiTyping') || 'Analyzing...'}</Text>
                </View>
              )}
            </View>
          ) : (
            <>
              <TouchableOpacity
                style={s.scanBtn}
                activeOpacity={0.85}
                onPress={openCamera}
              >
                <Text style={s.scanIcon}>📸</Text>
                <Text style={s.scanLabel}>{t('cameraRef') || 'Tap to Scan a Leaf'}</Text>
                <Text style={s.scanSub}>Works best in natural light</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={s.galleryBtn}
                onPress={openGallery}
              >
                <Text style={s.galleryText}>🖼  {t('galleryRef') || 'Choose from Gallery'}</Text>
              </TouchableOpacity>
            </>
          )}

          {imageUri && !isLoading && (
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
              <TouchableOpacity onPress={clearScan} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 14, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: '#C8E6C9' }}>
                <Text style={s.galleryText}>{t('refreshScanner') || 'Clear / Rescan'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* HOW IT WORKS */}
        {!imageUri && (
          <View style={s.howCard}>
            <Text style={s.howTitle}>📋 How to get best results</Text>
            {[
              ['1️⃣', 'Hold phone 20–30 cm from the leaf'],
              ['2️⃣', 'Make sure leaf fill the frame'],
              ['3️⃣', 'Scan in daylight, not shadow'],
              ['4️⃣', 'Scan both healthy AND sick leaves'],
            ].map(([num, tip], i) => (
              <View key={i} style={s.howRow}>
                <Text style={s.howNum}>{num}</Text>
                <Text style={s.howTip}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* LAST SCAN RESULT */}
        {result && (
          <View style={s.resultCard}>
            <View style={s.resultHeader}>
              <Text style={s.resultTitle}>📊 {t('aiResult') || 'Scan Result'}</Text>
              <TouchableOpacity onPress={() => setResult(null)}>
                <Text style={s.resultClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={s.resultBody}>
              <View style={s.resultIconBox}><Text style={{ fontSize: 32 }}>🌿</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.resultCrop}>{parsedDiagnosis || 'Analysis Complete'}</Text>
                <Text style={s.resultDisease}>{parsedSeverity !== 'Low' ? 'Action needed' : 'Looks Healthy'}</Text>
                <Text style={s.resultConf}>Confidence: {parsedConfidence || '---'}</Text>
              </View>
              <View style={[s.severityBadge, parsedSeverity === 'Low' && { backgroundColor: '#E8F5E9' }, parsedSeverity === 'Moderate' && { backgroundColor: '#FFF3E0' }]}>
                <Text style={[s.severityText, parsedSeverity === 'Low' && { color: '#2E7D32' }, parsedSeverity === 'Moderate' && { color: '#E65100' }]}>
                  {parsedSeverity ? parsedSeverity.toUpperCase() : 'UNKNOWN'}
                </Text>
              </View>
            </View>

            <View style={s.divider} />
            <Text style={s.remedyHead}>💊 {t('nextStep') || 'Treatment Steps'}</Text>
            
            <View style={s.remedyRow}>
              <View style={s.dot} />
              <Text style={s.remedyText}>{parsedRecommend || 'Ask the AI chatbot for detailed treatment advice based on this diagnosis.'}</Text>
            </View>

            <TouchableOpacity
              style={{ backgroundColor: '#2E7D32', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 16 }}
              onPress={() => router.push({ 
                pathname: '/ask-ai', 
                params: { query: `I scanned my crop and your vision model detected: ${parsedDiagnosis || 'a disease'}. Can you give me a detailed 3-step treatment and precaution plan for it?` } 
              })}
            >
              <Text style={{ color: '#fff', fontSize: 13, fontWeight: '700' }}>🤖 Ask AI About This</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SCAN HISTORY */}
        {scanHistory.length > 0 && (
          <View style={{ marginTop: 10 }}>
            <View style={s.histSection}>
              <Text style={s.histTitle}>🕐 {t('recentScans') || 'Recent Scans'}</Text>
            </View>

            {scanHistory.map((h, i) => (
              <View key={i} style={s.histCard}>
                <View style={[s.histIcon, { backgroundColor: h.result?.success ? '#E8F5E9' : '#FFEBEE' }]}>
                  <Text style={{ fontSize: 22 }}>{h.result?.success ? '🌿' : '⚠️'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.histCrop}>
                    {h.result?.diagnosis 
                      ? (h.result.diagnosis === 'Healthy' ? 'Healthy' : h.result.diagnosis) 
                      : (h.result?.error || 'Unknown')}
                  </Text>
                  <Text style={s.histDisease}>{h.time}</Text>
                </View>
                <View style={[s.sevBadge, h.result?.success ? s.sevGood : s.sevHigh]}>
                  <Text style={[s.sevText, { color: h.result?.success ? '#2E7D32' : '#C62828' }]}>
                    {h.result?.success ? '✓ Scanned' : 'Error'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

      </ScrollView>
      <LanguageSelector />
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
  previewWrap: { borderRadius: 18, overflow: 'hidden', position: 'relative' },
  previewImage: { width: '100%', height: 260, borderRadius: 18 },
  previewOverlay: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center', borderRadius: 18,
  },
  previewOverlayText: { color: '#fff', fontSize: 13, fontWeight: '600', marginTop: 8 },
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
  sevBadge:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  sevGood:     { backgroundColor: '#E8F5E9' },
  sevHigh:     { backgroundColor: '#FFEBEE' },
  sevText:     { fontSize: 10, fontWeight: '800' },
});
