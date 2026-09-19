// src/screens/PlacementResultScreen.jsx
// Shows placement result, then funnels to parent registration per [ADD] §6.2
// FIX v2: ganti expo-av -> expo-audio (API berbeda: useAudioPlayer hook)
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePracticePlayer } from '../utils/createPlayer';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import BotCharacter from '../components/BotCharacter';
import PlacementCardModal from './PlacementCardModal';

const C = { bg: '#0A0A12', surface: '#13131F', cyan: '#00F0FF', text: '#FFFFFF', muted: '#888899' };

const LEVEL_NAMES = {
  1:  'Penjumlahan & Pengurangan Dasar',
  2:  'Perkalian Awal',
  3:  'Perkalian Dasar',
  4:  'Pembagian Awal',
  5:  'Pecahan Dasar',
  6:  'Desimal',
  7:  'Operasi Campuran',
  8:  'Kecepatan Hitung',
  9:  'Master Kecepatan',
  10: 'Pecahan Lanjut',
  11: 'Desimal & Persen',
  12: 'Rasio & Proporsi',
  13: 'Aljabar Dasar',
  14: 'Persamaan',
  15: 'Matematika Terapan',
};

export default function PlacementResultScreen({ navigation, route }) {
  const {
    placedLevel = 1, prerequisiteSignals, speedEmphasis,
    totalAnswers = 0, correctAnswers = 0, student,
  } = route?.params ?? {};

  const { setPlacementDone, setBotState, startSpeaking, stopSpeaking, visemeData } = useStore();
  const [modalVisible, setModalVisible] = useState(true);
  const insets    = useSafeAreaInsets();
  const accuracy  = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : null;
  const levelName = LEVEL_NAMES[placedLevel] ?? `Level ${placedLevel}`;

  // usePracticePlayer: satu player, ganti source saat perlu
  const player       = usePracticePlayer();
  const cancelledRef = useRef(false);

  async function playBotAudio(id, hype = false) {
    try {
      // ambil viseme dulu (non-blocking jika gagal)
      let vData = null;
      try {
        const vRes = await fetch(api.botVisemeUrl(id));
        if (vRes.ok) vData = await vRes.json();
      } catch (_) {}

      startSpeaking(vData, hype);

      // expo-audio: replace source dan play
      player.replace({ uri: api.botAudioUrl(id) });
      player.play();

      // tunggu selesai dengan polling status
      await new Promise((resolve) => {
        const check = setInterval(() => {
          if (cancelledRef.current || player.status?.didJustFinish || !player.playing) {
            clearInterval(check);
            resolve();
          }
        }, 200);
      });

      stopSpeaking();
    } catch (err) {
      console.warn('[PlacementResult:playBotAudio]', id, err?.message);
      stopSpeaking();
    }
  }

  useEffect(() => {
    cancelledRef.current = false;

    let audio;
    if (accuracy !== null && accuracy >= 100) {
      audio = 'bot_placement_perfect';
      setBotState('celebrating');
    } else if (placedLevel >= 13) {
      audio = 'bot_placement_l13_l15';
      setBotState('celebrating');
    } else if (placedLevel >= 8) {
      audio = 'bot_placement_l8_l12';
      setBotState('speaking_hype');
    } else if (placedLevel >= 4) {
      audio = 'bot_placement_l4_l7';
      setBotState('speaking_calm');
    } else {
      audio = 'bot_placement_l1_l3';
      setBotState('speaking_calm');
    }

    const timer1 = setTimeout(async () => {
      if (cancelledRef.current) return;
      await playBotAudio(audio, placedLevel >= 8);

      if (cancelledRef.current) return;
      if (speedEmphasis === 'high') {
        await new Promise((r) => setTimeout(r, 400));
        if (cancelledRef.current) return;
        await playBotAudio('bot_placement_speed', false);
      } else if (accuracy !== null && accuracy < 70) {
        await new Promise((r) => setTimeout(r, 400));
        if (cancelledRef.current) return;
        await playBotAudio('bot_placement_skill', false);
      }

      if (!cancelledRef.current) setBotState('idle');
    }, 600);

    return () => {
      cancelledRef.current = true;
      clearTimeout(timer1);
      try { player.pause(); } catch (_) {}
      stopSpeaking();
    };
  }, []);

  function goParentAuth() {
    navigation.navigate('ParentAuth', { student, placedLevel });
  }

  function skipParent() {
    setPlacementDone(true);
  }

  return (
    <>
      <PlacementCardModal
        visible={modalVisible}
        student={student}
        placedLevel={placedLevel}
        onDone={() => setModalVisible(false)}
      />
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.inner, { paddingTop: insets.top + 24 }]}
      >
      <View style={s.botCenter}>
        <BotCharacter size={100} visemeData={visemeData} />
      </View>

      <View style={s.resultCard}>
        <Text style={s.emoji}>🎯</Text>
        <Text style={s.levelLabel}>Level {placedLevel}</Text>
        <Text style={s.levelName}>{levelName}</Text>
        {accuracy !== null && (
          <Text style={s.accuracy}>Akurasi tes: {accuracy}%</Text>
        )}
      </View>

      <Text style={s.desc}>
        {student?.name ? `${student.name} cocok` : 'Cocok'} mulai dari Level {placedLevel}.{' '}
        Latihan dimulai dari soal yang pas — tidak terlalu mudah, tidak terlalu sulit.
      </Text>

      {speedEmphasis === 'high' && (
        <View style={s.noteBox}>
          <Text style={s.noteText}>
            ⚡ Akurasi bagus, tapi kecepatan masih perlu dilatih. Bot akan bantu.
          </Text>
        </View>
      )}

      {prerequisiteSignals && Object.keys(prerequisiteSignals).length > 0 && (
        <View style={s.noteBox}>
          <Text style={s.noteText}>
            💡 Ada konsep yang perlu diperkuat — bot akan sarankan penjelasan tepat saat berlatih.
          </Text>
        </View>
      )}

      <Text style={s.ctaLabel}>
        Daftarkan orang tua untuk pantau progres &amp; aktifkan akun
      </Text>

      <TouchableOpacity style={s.btnPrimary} onPress={goParentAuth}>
        <Text style={s.btnPrimaryText}>Daftar Akun Orang Tua →</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.btnGhost} onPress={skipParent}>
        <Text style={s.btnGhostText}>Lewati dulu — mulai belajar langsung</Text>
      </TouchableOpacity>
    </ScrollView>
    </>
  );
}

const s = StyleSheet.create({
  scroll:         { flex: 1, backgroundColor: C.bg },
  inner:          { paddingHorizontal: 24, paddingBottom: 48 },
  botCenter:      { alignItems: 'center', marginBottom: 16 },
  resultCard:     { backgroundColor: C.surface, borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#00F0FF44' },
  emoji:          { fontSize: 48, marginBottom: 8 },
  levelLabel:     { color: C.cyan, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  levelName:      { color: C.text, fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  accuracy:       { color: C.muted, fontSize: 14 },
  desc:           { color: C.text, fontSize: 16, lineHeight: 24, marginBottom: 16, textAlign: 'center' },
  noteBox:        { backgroundColor: C.surface, borderRadius: 12, padding: 16, marginBottom: 12 },
  noteText:       { color: C.muted, fontSize: 14, lineHeight: 20 },
  ctaLabel:       { color: C.muted, fontSize: 13, textAlign: 'center', marginTop: 24, marginBottom: 12 },
  btnPrimary:     { backgroundColor: C.cyan, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 12 },
  btnPrimaryText: { color: C.bg, fontSize: 16, fontWeight: 'bold' },
  btnGhost:       { paddingVertical: 14, alignItems: 'center' },
  btnGhostText:   { color: C.muted, fontSize: 14 },
});