import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar, ActivityIndicator, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';

// import { detectDisease } from '../models/inferenceEngine';
// import { saveDiseaseScan, fetchLastScans } from '../services/diseaseService';

interface Props {
  navigation: { navigate: (route: string) => void };
}

export default function DiseaseScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [imageUri, setImageUri] = useState<string | null>(null);
  
  const [currentResult, setCurrentResult] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([
    { crop: 'Maize', disease: 'Common Smut', confidence: 0.88, healthy: false, remedy: 'Remove galls before they burst. Apply fungicide as preventative.' },
    { crop: 'Cotton', disease: 'Aphids', confidence: 0.92, healthy: false, remedy: 'Use neem oil.' },
    { crop: 'Paddy', disease: 'Healthy', confidence: 0.99, healthy: true, remedy: 'No action needed. Crop is perfectly healthy.' },
  ]);

  useEffect(() => {
    async function loadHistory() {
      // const scans = await fetchLastScans();
      // setHistory(scans.slice(0, 3));
      setLoading(false);
    }
    loadHistory();
  }, []);

  const handleScan = async () => {
    Alert.alert('Scan Crop', 'Choose a photo method', [
      { text: 'Camera', onPress: openCamera },
      { text: 'Gallery', onPress: openGallery },
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const openCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { alert('Camera permission is required.'); return; }
    
    const result = await ImagePicker.launchCameraAsync({
       mediaTypes: ImagePicker.MediaTypeOptions.Images,
       allowsEditing: true, quality: 1
    });
    if (!result.canceled) processImage(result.assets[0].uri);
  };

  const openGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { alert('Gallery permission is required.'); return; }

    const result = await ImagePicker.launchImageLibraryAsync({
       mediaTypes: ImagePicker.MediaTypeOptions.Images,
       allowsEditing: true, quality: 1
    });
    if (!result.canceled) processImage(result.assets[0].uri);
  };

  const processImage = (uri: string) => {
    setScanning(true);
    setImageUri(uri);
    
    setTimeout(() => {
      const newResult = {
        crop: 'Tomato', disease: 'Early Blight', confidence: 0.95, healthy: false, 
        remedy: 'Apply copper-based fungicide and remove infected lower leaves.'
      };
      setCurrentResult(newResult);
      setHistory(prev => [newResult, ...prev].slice(0, 3));
      setScanning(false);
    }, 2000);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={COLORS.green800} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={shared.pageTitle}>Scan Disease</Text>
        <Text style={shared.pageSub}>AI-powered leaf analysis</Text>
      </View>
      
      <ScrollView style={shared.content} showsVerticalScrollIndicator={false}>
        {/* Scanner Box */}
        <View style={styles.scannerBox}>
          {imageUri ? (
             <View style={styles.mockImageContainer}>
               <Image source={{ uri: imageUri }} style={{ width: '100%', height: 150, borderRadius: RADIUS.md }} resizeMode="cover" />
               <Text style={[styles.scanDesc, { marginTop: 8 }]}>Image Captured</Text>
             </View>
          ) : (
             <>
               <Text style={{ fontSize: 60, marginBottom: 16 }}>📷</Text>
               <Text style={styles.scanTitle}>Point camera at a leaf</Text>
               <Text style={styles.scanDesc}>Make sure the leaf is well-lit and in focus.</Text>
             </>
          )}

          <TouchableOpacity style={styles.scanBtn} onPress={handleScan} disabled={scanning}>
            {scanning ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.scanBtnText}>{imageUri ? 'Recapture' : 'Tap to Scan'}</Text>}
          </TouchableOpacity>
        </View>

        {/* Current Result */}
        {currentResult && (
          <View style={styles.resultContainer}>
            <Text style={shared.sectionTitle}>Analysis Result</Text>
            <View style={styles.resultCard}>
               <View style={styles.resHeader}>
                 <Text style={styles.resDisease}>{currentResult.disease}</Text>
                 {currentResult.healthy ? (
                    <Text style={{ fontSize: 20 }}>✅</Text>
                 ) : (
                    <Text style={{ fontSize: 20 }}>⚠️</Text>
                 )}
               </View>
               <Text style={styles.resCrop}>Crop: {currentResult.crop}</Text>
               <Text style={styles.resConf}>Confidence: {(currentResult.confidence * 100).toFixed(0)}%</Text>
               <View style={styles.remedyBox}>
                 <Text style={styles.remedyTitle}>Recommended Remedy</Text>
                 <Text style={styles.remedyText}>{currentResult.remedy}</Text>
               </View>
            </View>
          </View>
        )}

        {/* Previous Scans */}
        <Text style={[shared.sectionTitle, { marginTop: currentResult ? 16 : 0 }]}>Previous Scans (Last 3)</Text>
        {history.map((r, i) => (
          <View key={i} style={styles.historyCard}>
            <View style={styles.historyLeft}>
              <Text style={{ fontSize: 28 }}>{r.healthy ? '✅' : '🔬'}</Text>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.histCrop}>{r.crop} · <Text style={{ color: r.healthy ? COLORS.green800 : COLORS.orange }}>{r.disease}</Text></Text>
                <Text style={styles.histConf}>Confidence: {(r.confidence * 100).toFixed(0)}%</Text>
                <Text style={styles.histRemedy} numberOfLines={2}>{r.remedy}</Text>
              </View>
            </View>
          </View>
        ))}
        <View style={{ height: 40 }} />
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
  scannerBox: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 32, alignItems: 'center', marginBottom: 24,
    borderWidth: 2, borderColor: COLORS.green200, borderStyle: 'dashed',
    ...SHADOW.card,
  },
  mockImageContainer: { alignItems: 'center', marginBottom: 16, backgroundColor: COLORS.gray100, padding: 20, borderRadius: RADIUS.lg, width: '100%' },
  scanTitle: { fontFamily: FONTS.sansExtra, fontSize: 16, color: COLORS.gray800, marginBottom: 4 },
  scanDesc: { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.gray600, textAlign: 'center', marginBottom: 24 },
  scanBtn: { backgroundColor: COLORS.green800, paddingHorizontal: 32, paddingVertical: 14, borderRadius: RADIUS.lg, width: '100%', alignItems: 'center' },
  scanBtnText: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.white },
  resultContainer: { marginBottom: 24 },
  resultCard: { backgroundColor: COLORS.white, borderRadius: RADIUS.xl, padding: 20, ...SHADOW.card, borderWidth: 1, borderColor: COLORS.green200 },
  resHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  resDisease: { fontFamily: FONTS.sansExtra, fontSize: 22, color: COLORS.gray800 },
  resCrop: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.gray600, marginBottom: 4 },
  resConf: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.green800, marginBottom: 16 },
  remedyBox: { backgroundColor: COLORS.orange + '15', padding: 12, borderRadius: RADIUS.md },
  remedyTitle: { fontFamily: FONTS.sansBold, fontSize: 12, color: COLORS.orange, marginBottom: 4 },
  remedyText: { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.gray800, lineHeight: 20 },
  historyCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 16, marginBottom: 12, ...SHADOW.card
  },
  historyLeft: { flexDirection: 'row', alignItems: 'center' },
  histCrop: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.gray800, marginBottom: 2 },
  histConf: { fontFamily: FONTS.sansBold, fontSize: 11, color: COLORS.gray600, marginBottom: 4 },
  histRemedy: { fontFamily: FONTS.sans, fontSize: 12, color: COLORS.gray600, lineHeight: 18 },
});
