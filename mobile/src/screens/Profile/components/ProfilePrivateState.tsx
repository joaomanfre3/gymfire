import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function ProfilePrivateState() {
  return (
    <View style={styles.container}>
      <Feather name="lock" size={48} color="#a8a8a8" />
      <Text style={styles.title}>Este perfil é privado</Text>
      <Text style={styles.subtitle}>Siga para ver as publicações</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', paddingVertical: 48, paddingHorizontal: 24 },
  title: { fontSize: 16, fontWeight: '600', color: '#fff', marginTop: 16 },
  subtitle: { fontSize: 13, color: '#a8a8a8', marginTop: 4 },
});
