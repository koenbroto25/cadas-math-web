// src/screens/PlacementResultScreen.jsx
// Shows placement result, then funnels to parent registration per [ADD] §6.2
// FIX v2: ganti expo-av -> expo-audio (API berbeda: useAudioPlayer hook)
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePracticePlayer } from '../utils/createPlayer';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import BotCharacter from '../components/BotCharacter';
import { useGameAudio } from '../hooks/useGameAudio';
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
    levelBreakdown = [], earlyStopped = false, earlyStopReason = null, stats = null,
  } = route?.params ?? {};

  const setPlacementDone = useStore((st) => st.setPlacementDone);
  const setBotState = useStore((st) => st.setBotState);
  const startSpeaking = useStore((st) => st.startSpeaking);
  const stopSpeaking = useStore((st) => st.stopSpeaking);
  const visemeData = useStore((st) => st.visemeData);
  const [modalVisible, setModalVisible] = useState(true);
  // A1 / OQ-3: kartu ID wajib dibagikan sebelum latihan (sumber: backend
  // students.card_shared). Tidak ada lagi tombol "lewati".
  const [cardShared, setCardShared] = useState(student?.card_shared === true);
  const insets    = useSafeAreaInsets();
  const accuracy  = totalAnswers > 0
    ? Math.round((correctAnswers / totalAnswers) * 100)
    : (stats && stats.answered > 0 ? Math.round((stats.correct / stats.answered) * 100) : null);
  const levelName = LEVEL_NAMES[placedLevel] ?? `Level ${placedLevel}`;
  const hasBreakdown = Array.isArray(levelBreakdown) && levelBreakdown.length > 0;

  // Catatan early stop untuk konteks hasil
  const earlyStopNote = earlyStopped && earlyStopReason === 'early_stop_3_consecutive_fails'
    ? `Tes dihentikan lebih awal (3 soal tidak berhasil berturut-turut)${stats?.stoppedAtQuestion ? ` — berhenti di soal ke-${stats.stoppedAtQuestion}` : ''}. Hasil ini sudah cukup untuk menentukan level yang tepat.`
    : null;

  // usePracticePlayer: satu player, ganti source saat perlu
  const player       = usePracticePlayer();
  const cancelledRef = useRef(false);

  const finishRef = useRef(null);
  finishRef.current = () => { stopSpeaking(); };
  const { botSpeaking } = useGameAudio();
  const botSpeakingRef = useRef(botSpeaking);
  botSpeakingRef.current = botSpeaking;

  useEffect(() => {
    if (!player?.addListener) return undefined;
    const sub = player.addListener((st) => {
      if (st?.didJustFinish || st?.error) {
        finishRef.current?.();
        botSpeakingRef.current?.(false);
      }
    });
    return () => { try { sub.remove(); } catch (_) {} };
  }, [player]);

  function validViseme(v) {
    if (!v || typeof v !== 'object') return null;
    const cues = v.mouthCues || v.cues;
    if (!Array.isArray(cues) || !cues.length) return null;
    return { mouthCues: cues.filter((c) => c && typeof c.start === 'number' && typeof c.end === 'number') };
  }

  const playBotAudio = useCallback(async (id, hype = false) => {
    try {
      let vData = null;
      try {
        const vRes = await fetch(api.botVisemeUrl(id));
        if (vRes.ok) vData = validViseme(await vRes.json());
      } catch (_) {}

      startSpeaking(vData, hype);
      botSpeakingRef.current?.(true);

      player.replace({ uri: api.botAudioUrl(id) });
      player.play();
    } catch (err) {
      console.warn('[PlacementResult:playBotAudio]', id, err?.message);
      stopSpeaking();
      botSpeakingRef.current?.(false);
    }
  }, [player, startSpeaking, stopSpeaking]);

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
      try { botSpeakingRef.current?.(false); } catch (_) {}
      stopSpeaking();
    };
  }, []);

  function goParentAuth() {
    navigation.navigate('ParentAuth', { student, placedLevel });
  }

  function skipParent() {
    setPlacementDone(true);
  }

  // A1 / OQ-3: status kartu dibaca ulang dari backend (bukan hanya params),
  // supaya tombol "Mulai belajar" hanya muncul setelah card_shared = true.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = useStore.getState().authToken;
        if (!token) return;
        const card = await api.getStudentCard(token);
        if (!cancelled && card) setCardShared(card.card_shared === true);
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleCardModalDone() {
    setModalVisible(false);
    try {
      const token = useStore.getState().authToken;
      if (token) {
        const card = await api.getStudentCard(token);
        setCardShared(card?.card_shared === true);
      }
    } catch (_) {}
  }

  return (
    <>
      <PlacementCardModal
        visible={modalVisible}
        student={student}
        placedLevel={placedLevel}
        onDone={handleCardModalDone}
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

      {earlyStopNote && (
        <View style={s.noteBox}>
          <Text style={s.noteText}>{earlyStopNote}</Text>
        </View>
      )}

      {hasBreakdown && (
        <View style={s.breakdownBox}>
          <Text style={s.breakdownTitle}>Rincian per Level</Text>
          {levelBreakdown.map((lb) => (
            <View key={lb.level} style={s.breakdownRow}>
              <Text style={s.breakdownLevel}>Lv {lb.level}</Text>
              <Text style={[s.breakdownStat, lb.passed && s.breakdownPass]}>
                {lb.reason === 'not_tested'
                  ? '— tidak diuji'
                  : `${lb.correct}/${lb.questions_given} benar · ${lb.accuracy != null ? Math.round(lb.accuracy * 100) : 0}% · ${(lb.avg_time_ms / 1000).toFixed(1)}s`}
              </Text>
              <Text style={[s.breakdownMark, lb.passed ? s.breakdownPass : s.breakdownFail]}>
                {lb.reason === 'not_tested' ? '' : lb.passed ? '✓' : '✗'}
              </Text>
            </View>
          ))}
        </View>
      )}

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

      {/* A2: Pintu 2 — ajak ortu via QR/link web (setelah kartu ID, agar gate A1 tetap tertib).
          InviteParent butuh student di store — tersedia setelah placement. */}
      <TouchableOpacity style={s.btnGhost} onPress={() => navigation.navigate('InviteParent')}>
        <Text style={s.btnGhostText}>📤 Ajak Ortu via QR / Link</Text>
      </TouchableOpacity>

      {/* A1 / OQ-3: kartu ID wajib sebelum latihan — tombol "lewati" dihapus.
          Jika belum ada aksi share/download, tombol membuka kembali modal
          kartu; "Mulai belajar" hanya muncul setelah card_shared = true. */}
      {!cardShared ? (
        <TouchableOpacity style={s.btnGhost} onPress={() => setModalVisible(true)}>
          <Text style={s.btnGhostText}>📇 Bagikan Kartu ID — wajib sebelum latihan</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={s.btnGhost} onPress={skipParent}>
          <Text style={s.btnGhostText}>Mulai belajar →</Text>
        </TouchableOpacity>
      )}
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
  breakdownBox:   { backgroundColor: C.surface, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#00F0FF22' },
  breakdownTitle: { color: C.cyan, fontSize: 14, fontWeight: 'bold', marginBottom: 10 },
  breakdownRow:   { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  breakdownLevel: { color: C.text, fontSize: 13, fontWeight: 'bold', width: 52 },
  breakdownStat:  { color: C.muted, fontSize: 13, flex: 1 },
  breakdownMark:  { fontSize: 14, fontWeight: 'bold', width: 20, textAlign: 'right' },
  breakdownPass:  { color: '#4ADE80' },
  breakdownFail:  { color: '#FF5252' },
  ctaLabel:       { color: C.muted, fontSize: 13, textAlign: 'center', marginTop: 24, marginBottom: 12 },
  btnPrimary:     { backgroundColor: C.cyan, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 12 },
  btnPrimaryText: { color: C.bg, fontSize: 16, fontWeight: 'bold' },
  btnGhost:       { paddingVertical: 14, alignItems: 'center' },
  btnGhostText:   { color: C.muted, fontSize: 14 },
});