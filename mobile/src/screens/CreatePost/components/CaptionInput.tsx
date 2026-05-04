import React, { useState } from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';

const MAX_LEN = 2200;

interface Props {
  value: string;
  onChange: (text: string) => void;
}

export default function CaptionInput({ value, onChange }: Props) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(t) => onChange(t.slice(0, MAX_LEN))}
        placeholder="Adicione uma legenda..."
        placeholderTextColor="#888"
        multiline
        maxLength={MAX_LEN}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
      {focused && (
        <Text style={styles.counter}>
          {value.length}/{MAX_LEN}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingVertical: 12 },
  input: {
    fontSize: 15,
    color: '#fff',
    minHeight: 80,
    maxHeight: 200,
    textAlignVertical: 'top',
  },
  counter: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
    marginTop: 4,
  },
});
