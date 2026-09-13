// src/screens/PlacementScreen.jsx
// Placement test — all probes fetched at start, answered one by one, submitted together
// API: POST /api/placement/start -> { placementId, exercises:[{id,problemText,num1,num2,operation}] }
// API: POST /api/placement/submit -> { placedLevel, prerequisiteSignals, speedEmphasis, totalAnswers, correctAnswers }
// FIX v2: hapus expo-av (deprecated), hapus playBotAudio (tidak dipakai di screen ini),
//         fix 400 Bad Request dengan fallback student dari store jika route.params kosong
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API_BASE } from '../services/api';
import { useStore } from '../store/useStore';

const C = { bg: '#0A0A12', surface: '#13131F', cyan: '#00F0FF', text: '#FFFFFF', muted: '#888899' };

export default function PlacementScreen({ navigation, route }) {
  // FIX: needPlacement stack di App.jsx tidak passing student via route.params,
  // ambil dari store sebagai fallback agar studentId tidak undefined → 400
  const storeStudent  = useStore((s) => s.student);
  const student       = route?.params?.student ?? storeStudent;
  const insets        = useSafeAreaInsets();
  const authToken     = useStore((s) => s.authToken);

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

  useEffect(() => {
    isMountedRef.current = true;
    startPlacement();
    return () => {
      isMountedRef.current = false;
      clearInterval(timerRef.current);
      clearTimeout(focusTimerRef.current);
    };
  }, []);

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


  // ── Bot pretest audio (Sprint H.7) ─────────────────────────────────────────
  async function playBotAudio(id, hype = false) {
    try {
      if (botSoundRef.current) { await botSoundRef.current.stopAsync(); botSoundRef.current = null; }
      const { sound } = await Audio.Sound.createAsync({ uri: api.botAudioUrl(id) }, { shouldPlay: true });
      botSoundRef.current = sound;
      const vRes = await fetch(api.botVisemeUrl(id)).catch(() => null);
      const vData = vRes?.ok ? await vRes.json() : null;
      setBotState(hype ? 'speaking_hype' : 'speaking_calm');
      if (vData) startSpeaking(vData, hype);
      sound.setOnPlaybackStatusUpdate((st) => {
        if (st.didJustFinish) { stopSpeaking(); setBotState('idle'); }
      });
    } catch (err) { console.warn('[Placement:playBotAudio]', id, err?.message); }
  }

  async function startPlacement() {
    // FIX: guard eksplisit sebelum hit API — cegah 400 karena studentId undefined
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
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ studentId }),
      });
      const data = await res.json();
      if (!isMountedRef.current) return;

      if (res.status === 409) {
        navigation.replace('PlacementResult', { placedLevel: data.placedLevel, student });
        return;
      }

      if (!res.ok || !data.exercises?.length) {
        Alert.alert(
          'Tes belum tersedia',
          data.error || 'Konten tes belum di-seed. Hubungi admin.',
          [{ text: 'Kembali', onPress: () => navigation.goBack() }]
        );
        return;
      }

      setExercises(data.exercises);
      setPlacementId(data.placementId);
      setPhase('testing');
    } catch {
      if (!isMountedRef.current) return;
      Alert.alert('Error', 'Tidak bisa terhubung ke server.', [
        { text: 'Kembali', onPress: () => navigation.goBack() },
      ]);
    }
  }

  async function handleAnswer() {
    if (!answer.trim()) return;
    Keyboard.dismiss();
    clearInterval(timerRef.current);
    const ms     = Date.now() - startRef.current;
    const newAns = [
      ...answers,
      { exerciseId: exercises[idx].id, answer: answer.trim(), timeTakenMs: ms },
    ];
    setAnswers(newAns);
    if (idx < exercises.length - 1) {
      setIdx(i => i + 1);
    } else {
      setPhase('submitting');
      await submitAll(newAns);
    }
  }

  async function submitAll(finalAns) {
    try {
      const res = await fetch(`${API_BASE}/api/placement/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          studentId:   student?.id,
          placementId,
          answers:     finalAns,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Submit gagal');
      if (!isMountedRef.current) return;
      navigation.replace('PlacementResult', {
        placedLevel:         data.placedLevel,
        prerequisiteSignals: data.prerequisiteSignals,
        speedEmphasis:       data.speedEmphasis,
        totalAnswers:        data.totalAnswers,
        correctAnswers:      data.correctAnswers,
        student,
      });
    } catch (e) {
      if (!isMountedRef.current) return;
      Alert.alert('Error', e.message, [
        { text: 'Coba lagi', onPress: () => setPhase('testing') },
      ]);
    }
  }

  if (phase === 'loading' || phase === 'submitting') return (
    <View style={s.center}>
      <ActivityIndicator color={C.cyan} size="large" />
      <Text style={s.loadingText}>
        {phase === 'loading' ? 'Menyiapkan tes...' : 'Menghitung level kamu...'}
      </Text>
    </View>
  );

  const ex      = exercises[idx];
  const opMap   = { multiply: '×', divide: '÷', subtract: '−', add: '+' };
  const problem = ex?.problemText || `${ex?.num1} ${opMap[ex?.operation] ?? '+'} ${ex?.num2} = ?`;
  const pct     = exercises.length ? Math.round((idx / exercises.length) * 100) : 0;

  return (
    <View style={[s.container, { paddingTop: insets.top + 16 }]}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Tes Level</Text>
        <Text style={s.timer}>{elapsed}s</Text>
      </View>
      <View style={s.progressBg}>
        <View style={[s.progressFill, { width: `${pct}%` }]} />
      </View>
      <Text style={s.counter}>Soal {idx + 1} dari {exercises.length}</Text>
      <View style={s.qBox}>
        <Text style={s.qText}>{problem}</Text>
      </View>
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
  counter:      { color: C.muted, fontSize: 13, marginBottom: 36 },
  qBox:         { backgroundColor: C.surface, borderRadius: 20, padding: 36, alignItems: 'center', marginBottom: 28 },
  qText:        { color: C.text, fontSize: 38, fontWeight: 'bold', textAlign: 'center' },
  input:        { backgroundColor: C.surface, borderRadius: 12, padding: 18, color: C.text, fontSize: 26, textAlign: 'center', borderWidth: 1, borderColor: '#ffffff22', marginBottom: 16 },
  btn:          { backgroundColor: C.cyan, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 16 },
  btnDim:       { backgroundColor: '#ffffff22' },
  btnText:      { color: C.bg, fontSize: 16, fontWeight: 'bold' },
  hint:         { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 8 },
});