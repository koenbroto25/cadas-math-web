// src/components/HintPanel.jsx
// Panel hint yang muncul di bawah soal saat siswa salah

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const COLORS = {
  bg:      '#13131F',
  surface: '#1E1E30',
  cyan:    '#00F0FF',
  magenta: '#FF2EC4',
  text:    '#FFFFFF',
  muted:   '#888899',
};

export default function HintPanel({ exercise, hintLevel, onClose, onPlayAudio, apiTtsUrl }) {
  return (
    <View style={styles.panel}>
      <View style={styles.row}>
        <Text style={styles.title}>
          {hintLevel === 0 ? '💡 Petunjuk' :
           hintLevel === 1 ? '🔊 Kak Cadas bilang...' :
                             '📖 Penjelasan Lengkap'}
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.close}>✕</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {hintLevel === 0 && (
          <Text style={styles.hintText}>{exercise.hint}</Text>
        )}
        {hintLevel === 1 && (
          <>
            <Text style={styles.hintText}>{exercise.hint}</Text>
            <TouchableOpacity
              style={styles.audioBtn}
              onPress={() => onPlayAudio(apiTtsUrl(exercise.id, 'hint'))}>
              <Text style={styles.audioBtnText}>▶ Putar suara Kak Cadas</Text>
            </TouchableOpacity>
          </>
        )}
        {hintLevel === 2 && (
          <>
            <Text style={styles.hintText}>{exercise.quick_trick}</Text>
            <TouchableOpacity
              style={[styles.audioBtn, { backgroundColor: COLORS.magenta + '33' }]}
              onPress={() => onPlayAudio(apiTtsUrl(exercise.id, 'trick'))}>
              <Text style={styles.audioBtnText}>▶ Dengarkan penjelasan lengkap</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24,
    maxHeight: 260,
    borderTopWidth: 2, borderTopColor: COLORS.cyan,
  },
  row:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  title:    { color: COLORS.cyan, fontSize: 15, fontWeight: 'bold' },
  close:    { color: COLORS.muted, fontSize: 18 },
  scroll:   { flex: 1 },
  hintText: { color: COLORS.text, fontSize: 15, lineHeight: 22 },
  audioBtn: {
    marginTop: 12, backgroundColor: COLORS.cyan + '22',
    padding: 12, borderRadius: 12, alignItems: 'center',
    borderWidth: 1, borderColor: COLORS.cyan,
  },
  audioBtnText: { color: COLORS.cyan, fontWeight: '600', fontSize: 14 },
});
