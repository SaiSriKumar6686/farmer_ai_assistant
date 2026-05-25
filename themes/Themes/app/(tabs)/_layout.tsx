import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarActiveTintColor: '#2E7D32',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" label="Home" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="disease-scan"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🔬" label="Scan" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="weather-irrigation"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🌦" label="Weather" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="market-prices"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="📊" label="Mandi" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="schemes"
        options={{
          tabBarIcon: ({ focused }) => <TabIcon emoji="🏛" label="Schemes" focused={focused} />,
        }}
      />

      {/* Hide duplicate/unused screens from tab bar */}
      <Tabs.Screen name="disease"           options={{ href: null }} />
      <Tabs.Screen name="market"            options={{ href: null }} />
      <Tabs.Screen name="weather"           options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    height: 70,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1.5,
    borderTopColor: '#C8E6C9',
    paddingBottom: 6,
    paddingTop: 4,
    elevation: 20,
    shadowColor: '#1B5E20',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 56,
    gap: 2,
  },
  tabItemActive: {
    backgroundColor: '#E8F5E9',
  },
  emoji:       { fontSize: 22 },
  label:       { fontSize: 10, fontWeight: '600', color: '#78909C' },
  labelActive: { color: '#2E7D32', fontWeight: '700' },
});
