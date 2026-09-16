// src/components/StreakBar.jsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const COLORS = { cyan: '#00F0FF', lime: '#B6FF00', bg: '#1A1A2E', text: '#FFF' };

export default function StreakBar({ streak }) {
  const icons = streak >= 10 ? '🔥🔥🔥🔥🔥' :
                streak >= 5  ? '🔥🔥🔥' :
                streak >= 3  ? '🔥🔥' :
                streak >= 1  ? '🔥' : '';

  const color = streak >= 10 ? COLORS.lime :
                streak >= 5  ? COLORS.cyan : COLORS.text;

  return (
    <View style={styles.bar}>
      <Text style={[styles.label, { color }]}>
        {streak > 0 ? `Streak ${streak} ${icons}` : 'Mulai streak kamu!'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar:   { paddingHorizontal: 20, paddingVertical: 6, alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '600' },
});
