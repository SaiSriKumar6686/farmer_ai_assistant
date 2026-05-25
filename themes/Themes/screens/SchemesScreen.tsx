import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Platform, StatusBar, TextInput, Switch, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, RADIUS, SHADOW } from '../constants/appTheme';
import { shared } from '../constants/sharedStyles';

// import { checkSchemeEligibility, fetchAllSchemes } from '../services/schemeService';

interface Props {
  navigation: { navigate: (route: string) => void };
}

export default function SchemesScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  
  // Form State
  const [land, setLand] = useState('2');
  const [income, setIncome] = useState('50000');
  const [category, setCategory] = useState('OBC');
  const [stateName, setStateName] = useState('Telangana');
  const [crops, setCrops] = useState('Cotton, Chilli');
  const [hasBank, setHasBank] = useState(true);
  const [hasAadhaar, setHasAadhaar] = useState(true);
  
  const [results, setResults] = useState<any[]>([]);

  useEffect(() => {
    async function init() {
      // await fetchAllSchemes();
      setLoading(false);
    }
    init();
  }, []);

  const handleCheck = async () => {
    setChecking(true);
    // Mock API call
    // const res = await checkSchemeEligibility({ land, income, category, stateName, crops, hasBank, hasAadhaar });
    setTimeout(() => {
      setResults([
        { scheme: 'PM KISAN', eligible: true, benefit: '₹6000/year', reason: 'Land holding < 5 acres and valid Aadhaar', source: 'Rule-based' },
        { scheme: 'Rythu Bandhu', eligible: true, benefit: '₹10,000/acre/year', reason: 'Registered farmer in Telangana', source: 'Powered by Gemini AI' },
        { scheme: 'Crop Insurance', eligible: false, reason: 'Requires premium payment registration first', source: 'Rule-based' }
      ]);
      setChecking(false);
    }, 1500);
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
        <Text style={shared.pageTitle}>Schemes</Text>
        <Text style={shared.pageSub}>Check your eligibility</Text>
      </View>
      
      <ScrollView style={shared.content} showsVerticalScrollIndicator={false}>
        {/* Form Section */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Farmer Profile</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Land Holding (Acres)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={land} onChangeText={setLand} placeholder="e.g. 2.5" />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Annual Income (₹)</Text>
            <TextInput style={styles.input} keyboardType="numeric" value={income} onChangeText={setIncome} placeholder="e.g. 50000" />
          </View>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>Category</Text>
              <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Gen/OBC/SC/ST" />
            </View>
            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>State</Text>
              <TextInput style={styles.input} value={stateName} onChangeText={setStateName} placeholder="e.g. TS" />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Crops Grown</Text>
            <TextInput style={styles.input} value={crops} onChangeText={setCrops} placeholder="e.g. Cotton, Paddy" />
          </View>
          
          <View style={styles.switchRow}>
            <Text style={styles.label}>Bank Account Linked</Text>
            <Switch value={hasBank} onValueChange={setHasBank} trackColor={{ true: COLORS.green800 }} />
          </View>
          
          <View style={styles.switchRow}>
            <Text style={styles.label}>Aadhaar Linked</Text>
            <Switch value={hasAadhaar} onValueChange={setHasAadhaar} trackColor={{ true: COLORS.green800 }} />
          </View>
          
          <TouchableOpacity style={styles.btn} onPress={handleCheck} disabled={checking}>
            {checking ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Check Eligibility</Text>}
          </TouchableOpacity>
        </View>

        {/* Results Section */}
        {results.length > 0 && (
          <View style={{ marginTop: 24, marginBottom: 40 }}>
            <Text style={shared.sectionTitle}>Results</Text>
            {results.map((r, i) => (
              <View key={i} style={[styles.resultCard, { borderColor: r.eligible ? COLORS.green400 : COLORS.gray300, backgroundColor: r.eligible ? COLORS.green50 : COLORS.white }]}>
                <View style={[styles.statusBadge, { backgroundColor: r.eligible ? COLORS.green800 : COLORS.gray600 }]}>
                  <Text style={styles.statusText}>{r.eligible ? 'ELIGIBLE' : 'INELIGIBLE'}</Text>
                </View>
                <Text style={styles.schemeName}>{r.scheme}</Text>
                {r.eligible && <Text style={styles.benefitText}>Benefit: {r.benefit}</Text>}
                <Text style={styles.reasonText}>Reason: {r.reason}</Text>
               <Text style={styles.sourceText}>Source: {r.source}</Text>
              </View>
            ))}
          </View>
        )}
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
  formCard: {
    backgroundColor: COLORS.white, borderRadius: RADIUS.xl,
    padding: 20, ...SHADOW.card, marginTop: 16
  },
  formTitle: { fontFamily: FONTS.sansBold, fontSize: 16, color: COLORS.gray800, marginBottom: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontFamily: FONTS.sansBold, fontSize: 13, color: COLORS.gray800, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: COLORS.gray300, borderRadius: RADIUS.md,
    paddingHorizontal: 12, paddingVertical: 10, fontFamily: FONTS.sans, fontSize: 14, color: COLORS.gray800
  },
  row: { flexDirection: 'row' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  btn: { backgroundColor: COLORS.green800, paddingVertical: 14, borderRadius: RADIUS.lg, alignItems: 'center', marginTop: 8 },
  btnText: { fontFamily: FONTS.sansBold, fontSize: 15, color: COLORS.white },
  resultCard: {
    borderWidth: 2, borderRadius: RADIUS.xl, padding: 16, marginBottom: 12, ...SHADOW.card
  },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, marginBottom: 8 },
  statusText: { fontFamily: FONTS.sansBold, fontSize: 10, color: COLORS.white },
  schemeName: { fontFamily: FONTS.sansExtra, fontSize: 16, color: COLORS.gray800, marginBottom: 4 },
  benefitText: { fontFamily: FONTS.sansBold, fontSize: 14, color: COLORS.green800, marginBottom: 4 },
  reasonText: { fontFamily: FONTS.sans, fontSize: 13, color: COLORS.gray600, marginBottom: 8 },
  sourceText: { fontFamily: FONTS.sansBold, fontSize: 10, color: COLORS.gray600, textAlign: 'right' }
});
