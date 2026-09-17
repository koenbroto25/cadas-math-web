// src/screens/FastTrackScreen.jsx
// Sprint H.7 overhaul:
// - Ganti AsyncStorage → useStore (student.id + authToken)
// - Fix studentId kosong saat submit
// - Tambah backspace di keypad
// - Bot ritual: pretest audio + halfway + last + result reaction
// - BotCharacter overlay
// FIX v2: ganti expo-av -> expo-audio (useAudioPlayer hook)

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity,
  Alert, StyleSheet, ScrollView,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAudioPlayer } from 'expo-audio';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { api, BASE_URL } from '../services/api';
import BotCharacter from '../components/BotCharacter';
import { SFX } from '../audio/audioCatalog';

const C = {
  bg: '#0A0A12', surface: '#13131F', cyan: '#00F0FF',
  magenta: '#FF2EC4', lime: '#B6FF00', text: '#FFF',
  muted: '#888899', red: '#FF4444', green: '#4CAF50',
};

export default function FastTrackScreen() {
  const route  = useRoute();
  const nav    = useNavigation();
  const insets = useSafeAreaInsets();
  const { level = 4 } = route.params || {};

  const student       = useStore((s) => s.student);
  const authToken     = useStore((s) => s.authToken);
  const setBotState   = useStore((s) => s.setBotState);
  const startSpeaking = useStore((s) => s.startSpeaking);
  const stopSpeaking  = useStore((s) => s.stopSpeaking);
  const visemeData    = useStore((s) => s.visemeData);
  const audioPrefs    = useStore((s) => s.audioPrefs);

  const [test,       setTest]       = useState(null);
  const [current,    setCurrent]    = useState(0);
  const [answers,    setAnswers]    = useState([]);
  const [timeLeft,   setTimeLeft]   = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [result,     setResult]     = useState(null);
  const [ritualDone, setRitualDone] = useState(false);

  const timerRef     = useRef(null);
  const timeLeftRef  = useRef(null);
  const testRef      = useRef(null);
  const navTimerRef  = useRef(null);
  const isMountedRef = useRef(true);
  const cancelledRef = useRef(false);

  // expo-audio: player terpisah per channel (cadas-sounds.md Bagian 3) —
  // channel bot dan channel SFX tidak boleh berebut satu player.
  const player     = useAudioPlayer(null);
  const sfxPlayer  = useAudioPlayer(null);
  const botBusyRef = useRef(false);   // true = Kak Cadas sedang bicara (SFX ditahan)

  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { testRef.current = test; },       [test]);

  // Cleanup saat unmount
  useEffect(() => {
    isMountedRef.current = true;
    cancelledRef.current = false;
    return () => {
      isMountedRef.current = false;
      cancelledRef.current = true;
      clearInterval(timerRef.current);
      clearTimeout(navTimerRef.current);
      try { player.pause(); } catch (_) {}
      try { sfxPlayer.pause(); } catch (_) {}
      botBusyRef.current = false;
      stopSpeaking();
    };
  }, []);

  // playBotAudio — pakai expo-audio
  const playBotAudio = useCallback(async (id, hype = false) => {
    try {
      const url = api.botAudioUrl(id);

      let vData = null;
      try {
        const vRes = await fetch(api.botVisemeUrl(id));
        if (vRes.ok) vData = await vRes.json();
      } catch (_) {}

      startSpeaking(vData, hype);

      // expo-audio: replace source dan play
      botBusyRef.current = true;   // tahan SFX keypad selama bot bicara (Bagian 3)
      player.replace({ uri: url });
      player.play();

      // Tunggu selesai dengan polling
      await new Promise((resolve) => {
        const check = setInterval(() => {
          if (cancelledRef.current || !player.playing) {
            clearInterval(check);
            resolve();
          }
        }, 200);
      });

      botBusyRef.current = false;
      if (!cancelledRef.current) stopSpeaking();
    } catch (err) {
      botBusyRef.current = false;
      console.warn('[FastTrack:playBotAudio]', id, err?.message);
      stopSpeaking();
    }
  }, [startSpeaking, stopSpeaking, player]);

  // Micro-sound keypad/tap (cadas-sounds.md Kelompok 5): one-shot pendek di
  // channel SFX terpisah. TIDAK diputar saat Kak Cadas sedang bicara
  // (Bagian 3: bot punya prioritas tertinggi; tanpa gate, SFX bisa terasa
  // menabrak suara bot).
  const playKeypadSfx = useCallback((id) => {
    if (!id || !audioPrefs?.sfxEnabled) return;
    if (botBusyRef.current) return;
    try {
      sfxPlayer.volume = audioPrefs.sfxVolume;
      sfxPlayer.replace({ uri: api.sfxUrl(id) });
      sfxPlayer.play();
    } catch (err) {
      console.warn('[FastTrack:playKeypadSfx]', id, err?.message);
    }
  }, [sfxPlayer, audioPrefs]);

  // Pre-test ritual: rule → brief → countdown
  async function runRitual() {
    setBotState('thinking');
    await playBotAudio('bot_pretest_rule', false);
    if (!isMountedRef.current) return;
    await new Promise((r) => setTimeout(r, 400));
    if (!isMountedRef.current) return;
    await playBotAudio('bot_pretest_brief', false);
    if (!isMountedRef.current) return;
    await new Promise((r) => setTimeout(r, 400));
    if (!isMountedRef.current) return;
    setBotState('speaking_hype');
    await playBotAudio('bot_pretest_countdown', true);
    if (!isMountedRef.current) return;
    setBotState('idle');
    setRitualDone(true);
  }

  // ── Store — pakai student + token dari store, bukan AsyncStorage ──────────
  const student       = useStore((s) => s.student);
  const authToken     = useStore((s) => s.authToken);
  const setBotState   = useStore((s) => s.setBotState);
  const startSpeaking = useStore((s) => s.startSpeaking);
  const stopSpeaking  = useStore((s) => s.stopSpeaking);
  const visemeData    = useStore((s) => s.visemeData);

  const [test,       setTest]       = useState(null);
  const [current,    setCurrent]    = useState(0);
  const [answers,    setAnswers]    = useState([]);
  const [timeLeft,   setTimeLeft]   = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [result,     setResult]     = useState(null);
  const [ritualDone, setRitualDone] = useState(false);

  const timerRef     = useRef(null);
  const timeLeftRef  = useRef(null);
  const testRef      = useRef(null);
  const navTimerRef  = useRef(null);
  const isMountedRef = useRef(true);
  const cancelledRef = useRef(false);

  // expo-audio: player terpisah per channel (cadas-sounds.md Bagian 3) —
  // channel bot dan channel SFX tidak boleh berebut satu player.
  const player     = useAudioPlayer(null);
  const sfxPlayer  = useAudioPlayer(null);
  const botBusyRef = useRef(false);   // true = Kak Cadas sedang bicara (SFX ditahan)

  useEffect(() => { timeLeftRef.current = timeLeft; }, [timeLeft]);
  useEffect(() => { testRef.current = test; },       [test]);

  // Cleanup saat unmount
  useEffect(() => {
    isMountedRef.current = true;
    cancelledRef.current = false;
    return () => {
      isMountedRef.current = false;
      cancelledRef.current = true;
      clearInterval(timerRef.current);
      clearTimeout(navTimerRef.current);
      try { player.pause(); } catch (_) {}
      try { sfxPlayer.pause(); } catch (_) {}
      botBusyRef.current = false;
      stopSpeaking();
    };
  }, []);

  // playBotAudio — pakai expo-audio
  const playBotAudio = useCallback(async (id, hype = false) => {
    try {
      const url = api.botAudioUrl(id);

      let vData = null;
      try {
        const vRes = await fetch(api.botVisemeUrl(id));
        if (vRes.ok) vData = await vRes.json();
      } catch (_) {}

      startSpeaking(vData, hype);

      // expo-audio: replace source dan play
      botBusyRef.current = true;   // tahan SFX keypad selama bot bicara (Bagian 3)
      player.replace({ uri: url });
      player.play();

      // Tunggu selesai dengan polling
      await new Promise((resolve) => {
        const check = setInterval(() => {
          if (cancelledRef.current || !player.playing) {
            clearInterval(check);
            resolve();
          }
        }, 200);
      });

      botBusyRef.current = false;
      if (!cancelledRef.current) stopSpeaking();
    } catch (err) {
      botBusyRef.current = false;
      console.warn('[FastTrack:playBotAudio]', id, err?.message);
      stopSpeaking();
    }
  }, [startSpeaking, stopSpeaking, player]);

  // Micro-sound keypad/tap (cadas-sounds.md Kelompok 5): one-shot pendek di
  // channel SFX terpisah. TIDAK diputar saat Kak Cadas sedang bicara
  // (Bagian 3: bot punya prioritas tertinggi; tanpa gate, SFX bisa terasa
  // menabrak suara bot).
  const playKeypadSfx = useCallback((id) => {
    if (!id || !audioPrefs?.sfxEnabled) return;
    if (botBusyRef.current) return;
    try {
      sfxPlayer.volume = audioPrefs.sfxVolume;
      sfxPlayer.replace({ uri: api.sfxUrl(id) });
      sfxPlayer.play();
    } catch (err) {
      console.warn('[FastTrack:playKeypadSfx]', id, err?.message);
    }
  }, [sfxPlayer, audioPrefs]);

  // Pre-test ritual: rule → brief → countdown
  async function runRitual() {
    setBotState('thinking');
    await playBotAudio('bot_pretest_rule', false);
    if (!isMountedRef.current) return;
    await new Promise((r) => setTimeout(r, 400));
    if (!isMountedRef.current) return;
    await playBotAudio('bot_pretest_brief', false);
    if (!isMountedRef.current) return;
    await new Promise((r) => setTimeout(r, 400));
    if (!isMountedRef.current) return;
    setBotState('speaking_hype');
    await playBotAudio('bot_pretest_countdown', true);
    if (!isMountedRef.current) return;
    setBotState('idle');
    setRitualDone(true);
  }

  useEffect(() => { fetchTest(); }, []);

  async function fetchTest() {
    try {
      const sid = student?.id;
      if (!sid) {
        Alert.alert('Error', 'Student tidak ditemukan. Coba login ulang.');
        return;
      }
      const res = await fetch(
        `${BASE_URL}/api/upgrade-test/${level}?studentId=${sid}`,
        { headers: authToken ? { Authorization: `Bearer ${authToken}` } : {} }
      );
      if (res.status === 403) { nav.navigate('UpgradePaywall', { level }); return; }
      const data = await res.json();
      if (data.error) { Alert.alert('Error', data.error); return; }
      setTest(data);
      setTimeLeft(data.timeLimitMs ? Math.floor(data.timeLimitMs / 1000) : null);

      await runRitual();
      if (!isMountedRef.current) return;

      if (data.timeLimitMs) {
        timerRef.current = setInterval(() => {
          setTimeLeft((t) => {
            const next = t - 1;
            const half = Math.floor(data.timeLimitMs / 2000);
            if (next === half) playBotAudio('bot_test_halfway', false).catch(() => {});
            if (next === 10)   playBotAudio('bot_test_last',    false).catch(() => {});
            if (next <= 0) {
              clearInterval(timerRef.current);
              submitWithId(data.testId, data.timeLimitMs);
              return 0;
            }
            return next;
          });
        }, 1000);
      }
    } catch (e) {
      Alert.alert('Error', 'Gagal memuat test. Cek koneksi.');
    }
  }

  function submitWithId(testId, timeLimitMs) {
    clearInterval(timerRef.current);
    const sid     = student?.id || '';
    const tLeft   = timeLeftRef.current ?? 0;
    const elapsed = timeLimitMs ? timeLimitMs - (tLeft * 1000) : 0;
    fetch(`${BASE_URL}/api/upgrade-test/${testId}/submit`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      body: JSON.stringify({ studentId: sid, answers, totalTimeMs: elapsed }),
    })
      .then((r)  => r.json())
      .then((r)  => handleResult(r, timeLimitMs, elapsed))
      .catch(()  => Alert.alert('Error', 'Gagal submit. Coba lagi.'));
  }

  function submit() {
    if (!test) return;
    submitWithId(test.testId, test.timeLimitMs);
  }

  async function handleResult(r, timeLimitMs, elapsedMs) {
    setResult(r);
    setShowResult(true);

    if (r.passed) {
      const ratio = timeLimitMs ? elapsedMs / timeLimitMs : 1;
      const audio = ratio < 0.7 ? 'bot_levelup_speed_good'
                  : ratio > 0.9 ? 'bot_levelup_speed_slow'
                  : 'bot_levelup_many';
      setBotState('celebrating');
      await playBotAudio(audio, true);
      if (!isMountedRef.current) return;
      navTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        nav.replace('SessionResult', {
          levelUp:        true,
          level:          test.level,
          newLevel:       test.levelTo,
          accuracy:       r.accuracy,
          totalQuestions: r.totalProblems,
          correctAnswers: r.correctCount,
          timeTotalMs:    elapsedMs,
        });
      }, 2500);
    } else {
      const audio = r.accuracy < 0.6 ? 'bot_levelup_skill_weak' : 'bot_levelup_few';
      setBotState('disappointed_mild');
      await playBotAudio(audio, false);
      if (!isMountedRef.current) return;
      navTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        nav.navigate('Practice', { level });
      }, 2500);
    }
  }

  function answerProblem(probIdx, input) {
    const newAns = [...answers];
    const prev   = newAns[probIdx]
      ? { ...newAns[probIdx] }
      : { exerciseId: test.problems[probIdx].exercise_id, answer: '' };
    if (input === 'DEL') {
      prev.answer = String(prev.answer).slice(0, -1);
    } else {
      if (prev.answer === '0') prev.answer = String(input);
      else prev.answer = (prev.answer || '') + String(input);
    }
    newAns[probIdx] = prev;
    setAnswers(newAns);
  }

  function getCurrentAnswer() {
    return answers[current]?.answer ?? '';
  }

  // Loading / Ritual screen
  if (!test || !ritualDone) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <BotCharacter size={100} visemeData={visemeData} />
        <Text style={[styles.muted, { marginTop: 20 }]}>
          {!test ? 'Memuat soal...' : 'Kak Cadas sedang menjelaskan aturan...'}
        </Text>
      </View>
    );
  }

  // Result screen
  if (showResult && result) {
    return (
      <View style={[styles.center, { paddingTop: insets.top }]}>
        <BotCharacter size={110} visemeData={visemeData} />
        <Text style={[result.passed ? styles.pass : styles.fail, { marginTop: 16 }]}>
          {result.passed ? '🚀 LULUS!' : '💪 COBA LAGI'}
        </Text>
        <Text style={styles.muted}>
          Akurasi: {(result.accuracy * 100).toFixed(0)}%
        </Text>
        <Text style={styles.muted}>
          {result.withinTime ? '⚡ Dalam waktu' : '⏰ Waktu habis'}
        </Text>
        {result.passed
          ? <Text style={styles.hint}>Naik ke Level {test.levelTo}! 🎉</Text>
          : test.level === 9
            ? <Text style={styles.warn}>Level 9 perlu lebih cepat lagi!</Text>
            : <Text style={styles.hint}>Latih terus, hampir berhasil!</Text>
        }
      </View>
    );
  }

  // Test screen
  const prob          = test.problems[current];
  const currentAnswer = getCurrentAnswer();
  const answered      = answers.filter((a) => a?.answer !== '' && a?.answer !== undefined).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Fast Track — L{test.level} → L{test.levelTo}</Text>
          <Text style={styles.sub}>{answered}/{test.numProblems} dijawab</Text>
        </View>
        {timeLeft !== null && (
          <Text style={timeLeft < 10 ? styles.timerLow : styles.timer}>{timeLeft}s</Text>
        )}
      </View>

      <View style={styles.botRow} pointerEvents="none">
        <BotCharacter size={64} visemeData={visemeData} />
        <Text style={styles.qCounter}>Soal {current + 1} dari {test.numProblems}</Text>
      </View>

      <View style={styles.problemBox}>
        <Text style={styles.problemText}>{prob.problem_text}</Text>
        <View style={styles.answerBox}>
          <Text style={styles.answerText}>
            {currentAnswer !== '' ? currentAnswer : '—'}
          </Text>
        </View>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.qNav}
        contentContainerStyle={styles.qNavContent}
      >
        {test.problems.map((_, index) => {
          const isAnswered = answers[index]?.answer !== undefined
                          && answers[index]?.answer !== '';
          return (
            <TouchableOpacity
              key={index}
              onPress={() => setCurrent(index)}
              style={[
                styles.qNumBtn,
                current === index && styles.qNumActive,
                isAnswered && !(current === index) && styles.qNumAnswered,
              ]}
            >
              <Text style={[styles.qNumText, current === index && { color: C.bg }]}>
                {index + 1}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.keypad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <TouchableOpacity
            key={d}
            onPress={() => { playKeypadSfx(SFX.KEYPAD); answerProblem(current, d); }}
            style={styles.key}
          >
            <Text style={styles.keyText}>{d}</Text>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          onPress={() => { playKeypadSfx(SFX.KEYPAD); answerProblem(current, 'DEL'); }}
          style={[styles.key, styles.keyDel]}
        >
          <Text style={styles.keyText}>⌫</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => { playKeypadSfx(SFX.KEYPAD); answerProblem(current, 0); }}
          style={styles.key}
        >
          <Text style={styles.keyText}>0</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            playKeypadSfx(SFX.TAP);
            if (current < test.problems.length - 1) setCurrent((c) => c + 1);
            else submit();
          }}
          style={[styles.key, styles.keyNext]}
        >
          <Text style={[styles.keyText, { color: C.bg }]}>
            {current < test.problems.length - 1 ? '→' : '✓'}
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        onPress={() => { playKeypadSfx(SFX.TAP); submit(); }}
        style={styles.submitBtn}
      >
        <Text style={styles.submitText}>
          Submit Semua ({answered}/{test.numProblems})
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: C.bg, padding: 16 },
  center:       { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  title:        { color: C.cyan,  fontSize: 18, fontWeight: 'bold' },
  sub:          { color: C.muted, fontSize: 13, marginTop: 2 },
  timer:        { color: C.cyan,  fontSize: 24, fontWeight: 'bold' },
  timerLow:     { color: C.red,   fontSize: 26, fontWeight: 'bold' },
  botRow:       { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 12 },
  qCounter:     { color: C.muted, fontSize: 14 },
  problemBox:   { backgroundColor: C.surface, borderRadius: 16, padding: 24, marginBottom: 12, alignItems: 'center' },
  problemText:  { color: C.text,  fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 16 },
  answerBox:    { borderBottomWidth: 2, borderBottomColor: C.cyan, minWidth: 80, alignItems: 'center', paddingVertical: 4 },
  answerText:   { color: C.cyan,  fontSize: 26, fontWeight: 'bold', minWidth: 40, textAlign: 'center' },
  qNav:         { maxHeight: 48, marginBottom: 12 },
  qNavContent:  { gap: 8, paddingHorizontal: 4 },
  qNumBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  qNumActive:   { backgroundColor: C.cyan },
  qNumAnswered: { borderWidth: 2, borderColor: C.lime },
  qNumText:     { color: C.text,  fontSize: 14, fontWeight: '600' },
  keypad:       { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 12, gap: 8 },
  key:          { width: 72, height: 72, borderRadius: 36, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
  keyDel:       { backgroundColor: '#2A1A2E' },
  keyNext:      { backgroundColor: C.cyan },
  keyText:      { color: C.text,  fontSize: 22, fontWeight: '600' },
  submitBtn:    { backgroundColor: C.magenta, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitText:   { color: C.text,  fontSize: 15, fontWeight: 'bold' },
  muted:        { color: C.muted, fontSize: 14, marginTop: 8, textAlign: 'center' },
  hint:         { color: C.cyan,  fontSize: 16, marginTop: 12, fontWeight: 'bold', textAlign: 'center' },
  warn:         { color: C.red,   fontSize: 16, marginTop: 12, fontWeight: 'bold', textAlign: 'center' },
  pass:         { color: C.green, fontSize: 32, fontWeight: 'bold' },
  fail:         { color: C.red,   fontSize: 32, fontWeight: 'bold' },
});
