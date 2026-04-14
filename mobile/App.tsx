import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from './src/stores/authStore';
import AppNavigator from './src/navigation/AppNavigator';

const DarkTheme = {
  ...DefaultTheme,
  dark: true as const,
  colors: {
    ...DefaultTheme.colors,
    primary: '#FF6B35',
    background: '#0A0A0F',
    card: '#0A0A0F',
    text: '#FFFFFF',
    border: '#1A1A2E',
    notification: '#FF6B35',
  },
};

export default function App() {
  const [error, setError] = useState<string | null>(null);
  const loadSession = useAuthStore((s) => s.loadSession);

  useEffect(() => {
    loadSession().catch((err: any) => {
      console.error('loadSession error:', err);
      setError(String(err?.message || err));
    });
  }, [loadSession]);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Startup Error</Text>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={DarkTheme}>
        <StatusBar style="light" />
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: '#0A0A0F',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FF6B35',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
  },
});
