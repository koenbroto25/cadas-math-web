// src/screens/PlacementScreen.jsx
// Placement test — all probes fetched at start, answered one by one, submitted together
// API: POST /api/placement/start -> { placementId, exercises:[{id,problemText,num1,num2,operation}] }
// API: POST /api/placement/submit -> { placedLevel, prerequisiteSignals, speedEmphasis, totalAnswers, correctAnswers }
// FIX v2: hapus expo-av, fix 400 Bad Request dengan fallback student dari store
// FIX v3: tambah BotCharacter + BGM lirih + bot welcome audio + viseme

import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE, api } from '../services/api';
import { useStore } from '../store/useStore';
import BotCharacter from '../components/BotCharacter';
import { usePracticePlayer } from '../utils/createPlayer';
import { useGameAudio } from '../hooks/useGameAudio';
import { BGM } from '../audio/audioCatalog';

const C = {
  bg:      '#0A0A12',
  surface: '#13131F',
  cyan:    '#00F0FF',
  text:    '#FFFFFF',
  muted:   '#888899',
};

// Pilih bot welcome audio sesuai level yang diprediksi (atau default l1_l3)
function placementWelcomeAudio(level) {
  if (!level || level <= 3)  return 'bot_placement_l1_l3';
  if (level <= 7)            return 'bot_placement_l4_l7';
  if (level <= 12)           return 'bot_placement_l8_l12';
  return 'bot_placement_l13_l15';
}

export default function PlacementScreen({ navigation, route }) {
  const storeStudent = useStore((s) => s.student);
  const student      = route?.params?.student ?? storeStudent;
  const insets       = useSafeAreaInsets();
  const authToken    = useStore((s) => s.authToken);
  const currentLevel = useStore((s) => s.currentLevel);
  const visemeData   = useStore((s) => s.visemeData);
  const setBotState  = useStore((s) => s.setBotState);
  const startSpeaking = useStore((s) => s.startSpeaking);
  const stopSpeaking  = useStore((s) => s.stopSpeaking);

  const [phase,       setPhase]       = useState('loading');
  const [exercises,   setExercises]   = useState([]);
  const [placementId, setPlacementId] = useState(null);
  const [idx,         setIdx]         = useState(0);
  const [answer,      setAnswer]      = useState('');
  const [answers,     setAnswers]     = useState([]);
  const [elapsed,     setElapsed]     = useState(0);

  const startRef      = useRef(null);
  const timerRef      = useRef(null);
  const inputRef      = useRef(null);
  const isMountedRef  = useRef(true);
  const focusTimerRef = useRef(null);
  const cancelRef     = useRef(false);

  // Audio players
  const player = usePracticePlayer();   // bot voice
  const { startBgm, stopBgm } = useGameAudio();

  // Cleanup saat unmount
  useEffect(() => {
    isMountedRef.current = true;
    cancelRef.current    = false;
    startPlacement();
    return () => {
      isMountedRef.current = false;
      cancelRef.current    = true;
      clearInterval(timerRef.current);
      clearTimeout(focusTimerRef.current);
      try { player.pause(); } catch (_) {}
      stopSpeaking();
      stopBgm();
    };
  }, []);

  // BGM lirih saat phase 'testing' dimulai
  useEffect(() => {
    if (phase !== 'testing') return;
    // Zone A BGM — placement selalu pakai chill (santai, tidak stres)
    startBgm(BGM.ZONE_A[0], { fadeIn: true });
    return () => stopBgm();
  }, [phase]);

  // Timer per soal
  useEffect(() => {
    if (phase !== 'testing') return;
    startRef.current = Date.now();
    setElapsed(0);
    setAnswer('');
    clearInterval(timerRef.current);
    timerRef.current = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)),
      1000
    );
    focusTimerRef.current = setTimeout(() => inputRef.current?.focus(), 80);
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(focusTimerRef.current);
    };
  }, [phase, idx]);

  // Play bot welcome audio saat placement dimulai
  async function playBotWelcome() {
    const audioKey = placementWelcomeAudio(currentLevel);
    try {
      let vData = null;
      try {
        const vRes = await fetch(api.botVisemeUrl(audioKey));
        if (vRes.ok) vData = await vRes.json();
      } catch (_) {}

      if (cancelRef.current) return;
      setBotState('speaking_calm');
      startSpeaking(vData, false);
      player.replace({ uri: api.botAudioUrl(audioKey) });
      player.play();

      // Reset bot setelah ~6 detik
      setTimeout(() => {
        if (!cancelRef.current) {
          stopSpeaking();
          setBotState('thinking');
        }
      }, 6000);
    } catch (err) {
      console.warn('[PlacementScreen:playBotWelcome]', err?.message);
      setBotState('thinking');
    }
  }

  async function startPlacement() {
    const studentId = student?.id;
    if (!studentId) {
      Alert.alert(
        'Sesi tidak valid',
        'Data siswa tidak ditemukan. Silakan login ulang.',
        [{ text: 'Kembali', onPress: () => navigation.goBack() }]
      );
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/placement/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ studentId }),
      });

      if (!isMountedRef.current) return;

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.error || 'Gagal memulai tes.');
        return;
      }

      const data = await res.json();
      if (!isMountedRef.current) return;

      setExercises(data.exercises || []);
      setPlacementId(data.placementId);
      setPhase('testing');

      // Bot welcome setelah soal siap
      setTimeout(() => playBotWelcome(), 300);

    } catch (e) {
      Alert.alert('Error', 'Koneksi gagal. Cek internet.');
    }
  }

  async function handleAnswer() {
    if (!answer.trim()) return;
    Keyboard.dismiss();
    clearInterval(timerRef.current);

    const timeMs  = Date.now() - startRef.current;
    const ex      = exercises[idx];
    const newAns  = [...answers, { exerciseId: ex.id, answer: answer.trim(), timeMs }];
    setAnswers(newAns);

    if (idx < exercises.length - 1) {
      setIdx(idx + 1);
    } else {
      setPhase('submitting');
      setBotState('thinking');
      await submitAll(newAns);
    }
  }

  async function submitAll(finalAns) {
    try {
      const res = await fetch(`${API_BASE}/api/placement/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ placementId, answers: finalAns, studentId: student?.id }),
      });

      if (!isMountedRef.current) return;

      const data = await res.json();
      if (!isMountedRef.current) return;

      if (!res.ok) {
        Alert.alert('Error', data.error || 'Gagal submit.');
        setPhase('testing');
        return;
      }

      // Bot result audio
      try {
        const resultKey = data.speedEmphasis ? 'bot_placement_speed'
                        : data.prerequisiteSignals ? 'bot_placement_skill'
                        : 'bot_placement_perfect';
        setBotState('celebrating');
        startSpeaking(null, true);
        player.replace({ uri: api.botAudioUrl(resultKey) });
        player.play();
        setTimeout(() => { if (!cancelRef.current) stopSpeaking(); }, 4000);
      } catch (_) {}

      stopBgm();

      navigation.replace('PlacementResult', {
        student,
        placedLevel:          data.placedLevel,
        prerequisiteSignals:  data.prerequisiteSignals,
        speedEmphasis:        data.speedEmphasis,
        totalAnswers:         data.totalAnswers,
        correctAnswers:       data.correctAnswers,
      });

    } catch (e) {
      if (isMountedRef.current) {
        Alert.alert('Error', 'Gagal submit. Coba lagi.');
        setPhase('testing');
      }
    }
  }

  // Loading / submitting
  if (phase === 'loading' || phase === 'submitting') {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <BotCharacter size={90} visemeData={visemeData} />
        <ActivityIndicator color={C.cyan} size="large" style={{ marginTop: 24 }} />
        <Text style={s.loadingText}>
          {phase === 'loading' ? 'Menyiapkan soal...' : 'Menghitung hasil...'}
        </Text>
      </View>
    );
  }

  const ex      = exercises[idx];
  const opMap   = { multiply: '×', divide: '÷', subtract: '−', add: '+' };
  const problem = ex?.problemText || `${ex?.num1} ${opMap[ex?.operation] ?? '+'} ${ex?.num2} = ?`;
  const pct     = exercises.length ? Math.round((idx / exercises.length) * 100) : 0;

  return (
    <View style={[s.container, { paddingTop: insets.top + 16 }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Tes Level</Text>
        <Text style={s.timer}>{elapsed}s</Text>
      </View>

      {/* Progress bar */}
      <View style={s.progressBg}>
        <View style={[s.progressFill, { width: `${pct}%` }]} />
      </View>
      <Text style={s.counter}>Soal {idx + 1} dari {exercises.length}</Text>

      {/* Bot overlay */}
      <View style={s.botRow}>
        <BotCharacter size={72} visemeData={visemeData} />
      </View>

      {/* Soal */}
      <View style={s.qBox}>
        <Text style={s.qText}>{problem}</Text>
      </View>

      {/* Input */}
      <TextInput
        ref={inputRef}
        style={s.input}
        value={answer}
        onChangeText={setAnswer}
        keyboardType="numeric"
        placeholder="?"
        placeholderTextColor={C.muted}
        returnKeyType="done"
        onSubmitEditing={handleAnswer}
      />

      {/* Tombol jawab */}
      <TouchableOpacity
        style={[s.btn, !answer.trim() && s.btnDim]}
        onPress={handleAnswer}
        disabled={!answer.trim()}
      >
        <Text style={s.btnText}>
          {idx < exercises.length - 1 ? 'Jawab →' : 'Selesai ✓'}
        </Text>
      </TouchableOpacity>

      <Text style={s.hint}>Kerjakan sesuai kemampuan terbaik kamu.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  center:       { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  loadingText:  { color: C.muted, marginTop: 16, fontSize: 15 },
  container:    { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  headerTitle:  { color: C.text, fontSize: 18, fontWeight: 'bold' },
  timer:        { color: C.muted, fontSize: 16 },
  progressBg:   { height: 4, backgroundColor: '#ffffff22', borderRadius: 2, marginBottom: 8 },
  progressFill: { height: 4, backgroundColor: C.cyan, borderRadius: 2 },
  counter:      { color: C.muted, fontSize: 13, marginBottom: 8 },
  botRow:       { alignItems: 'center', marginBottom: 12 },
  qBox:         { backgroundColor: C.surface, borderRadius: 20, padding: 36, alignItems: 'center', marginBottom: 28 },
  qText:        { color: C.text, fontSize: 38, fontWeight: 'bold', textAlign: 'center' },
  input:        { backgroundColor: C.surface, borderRadius: 12, padding: 18, color: C.text, fontSize: 26, textAlign: 'center', borderWidth: 1, borderColor: '#ffffff22', marginBottom: 16 },
  btn:          { backgroundColor: C.cyan, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 16 },
  btnDim:       { backgroundColor: '#ffffff22' },
  btnText:      { color: C.bg, fontSize: 16, fontWeight: 'bold' },
  hint:         { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
