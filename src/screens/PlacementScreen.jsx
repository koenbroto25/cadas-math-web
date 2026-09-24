// src/screens/PlacementScreen.jsx
// Placement Test v2 — speed-first
// API: POST /api/placement/start  -> { placementId, timeLimitMs, totalQuestions, exercises:[{probeId,level,probeType,skillArea,problemText,order}] }
// API: POST /api/placement/submit -> { placedLevel, levelBreakdown, earlyStopped, earlyStopReason, prerequisiteSignals, speedEmphasis, stats }
//
// Aturan (Placement_Test_System.md §5):
//   - 25 soal (L1-4 @2, L5-9 @3, L10-11 @1 ceiling probe), maksimal level = 9
//   - Timer 8 detik per soal (timeLimitMs dari backend): habis waktu → jawaban
//     dianggap timeout (GAGAL) dan soal langsung diganti (auto-skip)
//   - Early stop: 3 kegagalan berturut-turut (salah ATAU timeout) → tes selesai
//     (dideteksi lokal untuk UX; keputusan final tetap di backend)
//   - Level 9 = championship gate → boss battle wajib sebelum level 10+ (fase lain)

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  red:     '#FF5252',
  text:    '#FFFFFF',
  muted:   '#888899',
};

const EARLY_STOP_FAILS = 3; // mirror backend EARLY_STOP_FAILS
const FALLBACK_TIME_LIMIT_MS = 8000;

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
  const [timeLimitMs, setTimeLimitMs] = useState(FALLBACK_TIME_LIMIT_MS);
  const [idx,         setIdx]         = useState(0);
  const [answer,      setAnswer]      = useState('');
  const [answers,     setAnswers]     = useState([]);
  const [elapsed,     setElapsed]     = useState(0);   // detik berjalan (info)
  const [remainMs,    setRemainMs]    = useState(FALLBACK_TIME_LIMIT_MS); // countdown 8s
  const [timeoutFlash, setTimeoutFlash] = useState(false);

  const startRef      = useRef(null);
  const timerRef      = useRef(null);
  const countdownRef  = useRef(null);   // interval countdown 8 detik
  const deadlineRef   = useRef(null);   // timestamp deadline soal aktif
  const inputRef      = useRef(null);
  const isMountedRef  = useRef(true);
  const focusTimerRef = useRef(null);
  const cancelRef     = useRef(false);
  const answerLockRef = useRef(false);  // cegah double-submit satu soal
  const submitLockRef = useRef(false);  // cegah submit ganda
  const earlyStopRef  = useRef(false);  // early stop lokal

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
      clearInterval(countdownRef.current);
      clearTimeout(focusTimerRef.current);
      try { player.pause(); } catch (_) {}
      stopSpeaking();
      stopBgm();
    };
  }, []);

  // BGM lirih saat phase 'testing'
  useEffect(() => {
    if (phase !== 'testing') return;
    // Zone A BGM — placement selalu pakai chill (santai, tidak stres)
    startBgm(BGM.ZONE_A[0], { fadeIn: true });
    return () => stopBgm();
  }, [phase]);

  // Timer per soal: countdown 8 detik dengan auto-skip saat habis
  useEffect(() => {
    if (phase !== 'testing') return;
    if (earlyStopRef.current) return; // tes sudah selesai (early stop) — jangan mulai timer baru

    startRef.current    = Date.now();
    deadlineRef.current = startRef.current + timeLimitMs;
    setElapsed(0);
    setRemainMs(timeLimitMs);
    setAnswer('');
    setTimeoutFlash(false);
    answerLockRef.current = false; // buka lock untuk soal baru

    clearInterval(timerRef.current);
    clearInterval(countdownRef.current);

    timerRef.current = setInterval(
      () => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)),
      1000
    );
    countdownRef.current = setInterval(() => {
      const remain = deadlineRef.current - Date.now();
      if (remain <= 0) {
        setRemainMs(0);
        handleTimeout(); // hard cutoff 8 detik → auto-skip
      } else {
        setRemainMs(remain);
      }
    }, 100);

    focusTimerRef.current = setTimeout(() => inputRef.current?.focus(), 80);
    return () => {
      clearInterval(timerRef.current);
      clearInterval(countdownRef.current);
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
        // 409 = sudah pernah selesai → langsung ke hasil
        if (res.status === 409 && err.currentResult) {
          navigation.replace('PlacementResult', {
            student,
            placementId:  err.placementId,
            placedLevel:  err.currentResult.placedLevel,
            levelBreakdown: err.currentResult.levelBreakdown || [],
            earlyStopped: !!err.currentResult.earlyStopped,
            earlyStopReason: err.currentResult.earlyStopReason || null,
            prerequisiteSignals: err.currentResult.prerequisiteSignals || {},
            speedEmphasis: err.currentResult.speedEmphasis || 'low',
            stats: err.currentResult.stats || null,
            alreadyDone: true,
          });
          return;
        }
        Alert.alert('Error', err.error || 'Gagal memulai tes.');
        return;
      }

      const data = await res.json();
      if (!isMountedRef.current) return;

      setExercises(data.exercises || []);
      setPlacementId(data.placementId);
      if (data.timeLimitMs) setTimeLimitMs(data.timeLimitMs);
      setPhase('testing');

      // Bot welcome setelah soal siap
      setTimeout(() => playBotWelcome(), 300);

    } catch (e) {
      Alert.alert('Error', 'Koneksi gagal. Cek internet.');
    }
  }

  // Satu jawaban (benar/salah lambat) → kirim ke state; deteksi early stop lokal
  function recordAnswer(entry) {
    const newAns = [...answers, entry];
    setAnswers(newAns);

    let fails = 0;
    for (let i = newAns.length - 1; i >= 0; i--) {
      const a = newAns[i];
      const passed = a.correct === true && (a.timeout !== true) && (a.timeTakenMs <= timeLimitMs);
      if (passed) break;
      fails += 1;
    }
    if (fails >= EARLY_STOP_FAILS) {
      earlyStopRef.current = true;
      clearInterval(countdownRef.current);
      clearInterval(timerRef.current);
      setPhase('submitting');
      setBotState('thinking');
      submitAll(newAns);
      return true; // early stop terpicu
    }
    return false;
  }

  function advanceOrFinish(newAns) {
    if (idx < exercises.length - 1) {
      setIdx(idx + 1); // trigger timer effect untuk soal berikutnya
    } else {
      setPhase('submitting');
      setBotState('thinking');
      submitAll(newAns);
    }
  }

  function handleAnswer() {
    if (answerLockRef.current || earlyStopRef.current) return;
    if (!answer.trim() || !exercises[idx]) return;
    answerLockRef.current = true;
    Keyboard.dismiss();
    clearInterval(timerRef.current);
    clearInterval(countdownRef.current);

    const timeMs = Date.now() - startRef.current;
    const ex     = exercises[idx];
    const entry  = {
      probeId:     ex.probeId ?? ex.id,
      answer:      answer.trim(),
      timeTakenMs: Math.min(timeMs, timeLimitMs),
      timeout:     timeMs > timeLimitMs,
    };

    const stopped = recordAnswer(entry);
    if (!stopped) advanceOrFinish([...answers, entry]);
  }

  // Hard cutoff 8 detik: soal dianggap timeout dan langsung diganti
  function handleTimeout() {
    if (answerLockRef.current || earlyStopRef.current) return;
    answerLockRef.current = true;
    Keyboard.dismiss();
    clearInterval(timerRef.current);
    clearInterval(countdownRef.current);
    setTimeoutFlash(true); // tampilkan "Waktu habis!" sesaat di soal ini

    const ex    = exercises[idx];
    if (!ex) return;
    const entry = {
      probeId:     ex.probeId ?? ex.id,
      answer:      null,
      timeTakenMs: timeLimitMs,
      timeout:     true,
    };

    const stopped = recordAnswer(entry);
    if (!stopped) {
      // beri 600ms flash "Waktu habis" sebelum soal berikutnya
      setTimeout(() => {
        if (!isMountedRef.current || earlyStopRef.current) return;
        setTimeoutFlash(false);
        advanceOrFinish([...answers, entry]);
      }, 600);
    }
  }

  async function submitAll(finalAns) {
    if (submitLockRef.current) return;
    submitLockRef.current = true;
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

      const data = await res.json().catch(() => ({}));
      if (!isMountedRef.current) return;

      if (!res.ok) {
        submitLockRef.current = false; // izinkan retry
        Alert.alert('Error', data.error || 'Gagal submit.');
        setPhase('testing');
        return;
      }

      // Bot result audio
      try {
        const resultKey = data.speedEmphasis === 'high' ? 'bot_placement_speed'
                        : (data.prerequisiteSignals && Object.keys(data.prerequisiteSignals).length)
                          ? 'bot_placement_skill'
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
        placementId:         data.placementId,
        placedLevel:         data.placedLevel,
        levelBreakdown:      data.levelBreakdown || [],
        earlyStopped:        !!data.earlyStopped,
        earlyStopReason:     data.earlyStopReason || null,
        prerequisiteSignals: data.prerequisiteSignals || {},
        speedEmphasis:       data.speedEmphasis || 'low',
        stats:               data.stats || null,
      });

    } catch (e) {
      if (isMountedRef.current) {
        submitLockRef.current = false; // izinkan retry
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
  const problem = ex?.problemText || '...';
  const pct     = exercises.length ? Math.round((idx / exercises.length) * 100) : 0;
  const remainS = Math.ceil(remainMs / 1000);
  const hot     = remainMs <= 2000; // 2 detik terakhir → merah

  return (
    <View style={[s.container, { paddingTop: insets.top + 16 }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>Tes Level</Text>
        <Text style={hot ? s.timerHot : s.timer}>⏱ {remainS}s</Text>
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

      {timeoutFlash && <Text style={s.timeoutBadge}>⏰ Waktu habis! (batas {Math.round(timeLimitMs / 1000)} detik)</Text>}

      {/* Input */}
      <TextInput
        ref={inputRef}
        style={[s.input, hot && s.inputHot]}
        value={answer}
        onChangeText={setAnswer}
        keyboardType="numeric"
        placeholder="?"
        placeholderTextColor={C.muted}
        returnKeyType="done"
        editable={!timeoutFlash}
        onSubmitEditing={handleAnswer}
      />

      {/* Tombol jawab */}
      <TouchableOpacity
        style={[s.btn, (!answer.trim() || timeoutFlash) && s.btnDim]}
        onPress={handleAnswer}
        disabled={!answer.trim() || timeoutFlash}
      >
        <Text style={s.btnText}>
          {idx < exercises.length - 1 ? 'Jawab →' : 'Selesai ✓'}
        </Text>
      </TouchableOpacity>

      <Text style={s.hint}>Jawab cepat! Maksimal {Math.round(timeLimitMs / 1000)} detik per soal.</Text>
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
  timerHot:     { color: C.red, fontSize: 16, fontWeight: 'bold' },
  progressBg:   { height: 4, backgroundColor: '#ffffff22', borderRadius: 2, marginBottom: 8 },
  progressFill: { height: 4, backgroundColor: C.cyan, borderRadius: 2 },
  counter:      { color: C.muted, fontSize: 13, marginBottom: 8 },
  botRow:       { alignItems: 'center', marginBottom: 12 },
  qBox:         { backgroundColor: C.surface, borderRadius: 20, padding: 36, alignItems: 'center', marginBottom: 28 },
  qText:        { color: C.text, fontSize: 38, fontWeight: 'bold', textAlign: 'center' },
  timeoutBadge: { color: C.red, fontSize: 15, fontWeight: 'bold', marginBottom: 12 },
  input:        { backgroundColor: C.surface, borderRadius: 12, padding: 18, color: C.text, fontSize: 26, textAlign: 'center', borderWidth: 1, borderColor: '#ffffff22', marginBottom: 16 },
  inputHot:     { borderColor: C.red },
  btn:          { backgroundColor: C.cyan, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 16 },
  btnDim:       { backgroundColor: '#ffffff22' },
  btnText:      { color: C.bg, fontSize: 16, fontWeight: 'bold' },
  hint:         { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
