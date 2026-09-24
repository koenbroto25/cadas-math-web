// src/screens/BossBattleScreen.jsx
// Championship Gate — Boss Battle Level 9
// API: POST /api/boss/start  -> { battle_id, boss_hp, boss_hp_max, phase, total_phases,
//                                 hits_landed, hits_needed, player_lives, hit_time_limit_ms, question }
//      POST /api/boss/hit    -> { hit_result:'hit'|'slow'|'miss', correct, boss_hp, phase,
//                                 hits_landed, hits_needed, player_lives, streak, outcome,
//                                 question, stats }
// Spec: 3 fase x 9 HP = 27 pukulan sah; pukulan sah = benar + <=6s;
//       benar-tapi-lambat = neutral (speed wall); salah/timeout = -1 nyawa; 3 nyawa habis = kalah.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Animated, Easing, Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { useStore } from '../store/useStore';
import BotCharacter from '../components/BotCharacter';
import { usePracticePlayer } from '../utils/createPlayer';
import { useGameAudio } from '../hooks/useGameAudio';
import { BGM } from '../audio/audioCatalog';

const C = {
  bg:      '#0A0A12',
  surface: '#13131F',
  cyan:    '#00F0FF',
  red:     '#FF4757',
  orange:  '#FFA502',
  green:   '#2ED573',
  text:    '#FFFFFF',
  muted:   '#888899',
};

const HIT_TIME_LIMIT_MS = 6000;

// ── Kartu boss per fase (3 fase x 9 HP) ─────────────────────────────────────
const BOSS_CARDS = [
  { name: 'PROF. PI-ANAK-ANAK', emoji: '🧮', color: '#FF6B6B' },
  { name: 'DR. KALI-KUT',        emoji: '👾', color: '#FFA502' },
  { name: 'THE MULTIPLIER',      emoji: '🐉', color: '#FF4757' },
];
function cardForPhase(phase) {
  return BOSS_CARDS[Math.min(BOSS_CARDS.length - 1, Math.max(0, phase - 1))];
}

export default function BossBattleScreen({ navigation, route }) {
  const storeStudent = useStore((s) => s.student);
  const student      = route?.params?.student ?? storeStudent;
  const insets       = useSafeAreaInsets();
  const authToken    = useStore((s) => s.authToken);
  const visemeData   = useStore((s) => s.visemeData);
  const setBotState  = useStore((s) => s.setBotState);
  const startSpeaking = useStore((s) => s.startSpeaking);
  const stopSpeaking  = useStore((s) => s.stopSpeaking);

  const [phase,        setPhase]        = useState('loading'); // loading|fight|submitting|result
  const [outcome,      setOutcome]      = useState(null);      // boss_win|boss_lose
  const [error,        setError]        = useState(null);
  const [battleId,     setBattleId]     = useState(null);
  const [boss,         setBoss]         = useState(null);      // {hp,max,phase,totalPhases,hitsLanded,hitsNeeded,lives}
  const [question,     setQuestion]     = useState(null);
  const [answer,       setAnswer]       = useState('');
  const [feedback,     setFeedback]     = useState(null);      // {type:'hit'|'slow'|'miss', text}
  const [streak,       setStreak]       = useState(0);
  const [lastStats,    setLastStats]    = useState(null);
  const [finalStats,   setFinalStats]   = useState(null);

  const startRef     = useRef(null);
  const timerRef     = useRef(null);
  const inputRef     = useRef(null);
  const isMountedRef = useRef(true);
  const busyRef      = useRef(false);
  const [elapsed,    setElapsed]      = useState(0);

  const player = usePracticePlayer();
  const { startBgm, stopBgm } = useGameAudio();

  const card = boss ? cardForPhase(boss.phase) : BOSS_CARDS[0];
  const timeLimit = boss?.hitTimeLimitMs ?? HIT_TIME_LIMIT_MS;

  const clearTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const startTimer = useCallback((limitMs) => {
    clearTimer();
    startRef.current = Date.now();
    setElapsed(0);
    timerRef.current = setInterval(() => {
      if (!isMountedRef.current) return;
      const ms = Date.now() - startRef.current;
      setElapsed(Math.floor(ms / 100) / 10); // 0.1s resolution
      if (ms >= limitMs) {
        clearTimer();
        submitAnswer({ timedOut: true });
      }
    }, 100);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    startBattle();
    return () => {
      isMountedRef.current = false;
      clearTimer();
      try { player.pause(); } catch (_) {}
      stopSpeaking();
      stopBgm();
    };
  }, []);

  useEffect(() => {
    if (phase !== 'fight') return;
    startBgm(BGM.BOSS?.[0] ?? BGM.ZONE_A[0], { fadeIn: true });
    return () => stopBgm();
  }, [phase]);

  async function startBattle() {
    try {
      setPhase('loading');
      setError(null);
      const res = await api.bossStart(
        { student_id: String(student?.id ?? student?.student_id ?? '') },
        authToken,
      );
      if (!isMountedRef.current) return;
      setBattleId(res.battle_id);
      setBoss({
        hp: res.boss_hp, max: res.boss_hp_max,
        phase: res.phase, totalPhases: res.total_phases,
        hitsLanded: res.hits_landed, hitsNeeded: res.hits_needed,
        lives: res.player_lives, maxLives: res.player_lives_max ?? 3,
        hitTimeLimitMs: res.hit_time_limit_ms,
      });
      setQuestion(res.question);
      setStreak(0);
      setPhase('fight');
      setTimeout(() => { if (isMountedRef.current) inputRef.current?.focus(); }, 300);
      startTimer(res.hit_time_limit_ms ?? HIT_TIME_LIMIT_MS);
    } catch (e) {
      if (!isMountedRef.current) return;
      setError(e.message || 'Gagal memulai boss battle');
      setPhase('result');
    }
  }

  async function submitAnswer({ timedOut = false } = {}) {
    if (busyRef.current || phase !== 'fight') return;
    const value = timedOut ? '' : answer.trim();
    if (!timedOut && !value) return;
    busyRef.current = true;
    clearTimer();
    Keyboard.dismiss();
    setPhase('submitting');
    setFeedback(null);

    const timeTakenMs = timedOut ? timeLimit : (Date.now() - startRef.current);
    try {
      const res = await api.bossHit(
        { battle_id: battleId, answer: timedOut ? null : value, time_taken_ms: timeTakenMs, timed_out: timedOut },
        authToken,
      );
      if (!isMountedRef.current) return;
      setAnswer('');
      setBoss((b) => b && ({
        ...b,
        hp: res.boss_hp, max: res.boss_hp_max ?? b.max,
        phase: res.phase, hitsLanded: res.hits_landed, hitsNeeded: res.hits_needed,
        lives: res.player_lives,
      }));
      setStreak(res.streak ?? 0);
      setLastStats(res.stats ?? null);

      // Feedback
      if (res.hit_result === 'hit') {
        setFeedback({ type: 'hit', text: res.correct ? 'PUKULAN TEPAT! 💥' : 'HIT!' });
      } else if (res.hit_result === 'slow') {
        setFeedback({ type: 'slow', text: 'BENAR tapi TERLALU LAMBAT (>6s) — kecepatan adalah segalanya! ⏱' });
      } else {
        setFeedback({ type: 'miss', text: res.timedOutHint ? 'Waktu habis! 💔' : 'MISS! 💔' });
      }

      if (res.outcome === 'boss_win' || res.outcome === 'boss_lose') {
        setOutcome(res.outcome);
        setFinalStats(res.stats ?? null);
        setPhase('result');
        return;
      }
      setQuestion(res.question);
      setPhase('fight');
      setTimeout(() => { if (isMountedRef.current) inputRef.current?.focus(); }, 200);
      startTimer(boss?.hitTimeLimitMs ?? HIT_TIME_LIMIT_MS);
    } catch (e) {
      if (!isMountedRef.current) return;
      setFeedback({ type: 'miss', text: e.message || 'Terjadi kesalahan' });
      setPhase('fight');
      startTimer(timeLimit);
    } finally {
      busyRef.current = false;
    }
  }

  function finish() {
    navigation.replace('Main', {});
    try { navigation.popToTop(); } catch (_) {}
  }

  if (phase === 'loading') {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <BotCharacter size={90} visemeData={visemeData} />
        <ActivityIndicator color={C.cyan} size="large" style={{ marginTop: 20 }} />
        <Text style={s.loadingText}>Boss sedang memasuki arena...</Text>
      </View>
    );
  }

  // ── Layar hasil ────────────────────────────────────────────────────────────
  if (phase === 'result') {
    const win = outcome === 'boss_win';
    return (
      <View style={[s.center, { paddingTop: insets.top, padding: 24 }]}>
        <Text style={[s.resultEmoji, { fontSize: 90 }]}>{win ? '🏆' : '💔'}</Text>
        <Text style={[s.resultTitle, { color: win ? C.green : C.red }]}>
          {win ? 'CHAMPION!' : 'BOSS MENANG'}
        </Text>
        {win ? (
          <Text style={s.resultSub}>
            Boss Level 9 telah dikalahkan!{'\n'}Gerbang Level 10+ TERBUKA.
          </Text>
        ) : (
          <Text style={s.resultSub}>
            {error ? error + '\n\n' : ''}Latihan lagi di Level 9, kuasai perkalian{'\n'}dengan cepat, lalu tantang boss lagi!
          </Text>
        )}
        {finalStats && (
          <View style={s.statsBox}>
            <Text style={s.statsLine}>Pukulan sah : {finalStats.hits ?? '?'}</Text>
            <Text style={s.statsLine}>Streak terbaik: {finalStats.best_streak ?? '?'}</Text>
            <Text style={s.statsLine}>
              Rata-rata waktu: {finalStats.avg_hit_time_ms ? (finalStats.avg_hit_time_ms / 1000).toFixed(1) + 's' : '—'}
            </Text>
            <Text style={s.statsLine}>
              Pukulan tercepat: {finalStats.best_hit_time_ms ? (finalStats.best_hit_time_ms / 1000).toFixed(1) + 's' : '—'}
            </Text>
          </View>
        )}
        <TouchableOpacity style={[s.btn, { marginTop: 24, minWidth: 220 }]} onPress={finish}>
          <Text style={s.btnText}>{win ? 'Lanjut Petualangan →' : 'Kembali ke Beranda'}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const q = question;
  const problem = q?.question_text
    || (q ? `${q.num1 ?? '?'} ${({ multiply:'×', divide:'÷', subtract:'−', add:'+' })[q.operation] ?? '+'} ${q.num2 ?? '?'} = ?` : '...');
  const hpPct = boss && boss.max ? Math.max(0, (boss.hp / boss.max) * 100) : 0;
  const timePct = Math.max(0, 100 - (elapsed * 1000 / timeLimit) * 100);

  return (
    <View style={[s.container, { paddingTop: insets.top + 12 }]}>
      {/* Header: fase + streak */}
      <View style={s.header}>
        <Text style={s.phaseTag}>FASE {boss?.phase ?? 1}/{boss?.totalPhases ?? 3}</Text>
        <Text style={s.streakTag}>🔥 STREAK {streak}</Text>
      </View>

      {/* Kartu boss */}
      <View style={[s.bossCard, { borderColor: card.color }]}>
        <Text style={{ fontSize: 46 }}>{card.emoji}</Text>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[s.bossName, { color: card.color }]}>{card.name}</Text>
          {/* HP bar */}
          <View style={s.hpBg}>
            <View style={[s.hpFill, { width: `${hpPct}%`, backgroundColor: card.color }]} />
          </View>
          <Text style={s.hpText}>HP {boss?.hp ?? 0}/{boss?.max ?? 27}</Text>
        </View>
        {/* Nyawa siswa */}
        <View style={s.lives}>
          {[0, 1, 2].map((i) => (
            <Text key={i} style={{ fontSize: 16, opacity: i < (boss?.lives ?? 3) ? 1 : 0.25 }}>❤️</Text>
          ))}
        </View>
      </View>

      {/* Timer bar */}
      <View style={s.timeBg}>
        <View style={[s.timeFill, { width: `${Math.max(0, timePct)}%`, backgroundColor: timePct < 30 ? C.red : C.cyan }]} />
      </View>
      <Text style={s.timeText}>{elapsed.toFixed(1)}s / {(timeLimit / 1000).toFixed(0)}s</Text>

      {/* Soal */}
      <View style={s.qBox}>
        <Text style={s.qText}>{problem}</Text>
      </View>

      {/* Feedback */}
      {feedback && (
        <Text style={[
          s.feedbackText,
          { color: feedback.type === 'hit' ? C.green : feedback.type === 'slow' ? C.orange : C.red },
        ]}>
          {feedback.text}
        </Text>
      )}

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
        onSubmitEditing={() => submitAnswer()}
      />
      <TouchableOpacity
        style={[s.btn, (!answer.trim() || phase === 'submitting') && s.btnDim]}
        onPress={() => submitAnswer()}
        disabled={!answer.trim() || phase === 'submitting'}
      >
        <Text style={s.btnText}>
          {phase === 'submitting' ? 'Memproses...' : 'PUKUL! 💥'}
        </Text>
      </TouchableOpacity>

      {/* Bot */}
      <View style={s.botRow}>
        <BotCharacter size={56} visemeData={visemeData} />
        <Text style={s.botHint}>
          Pukulan sah = jawaban BENAR dalam {Math.round(timeLimit / 1000)} detik.{'\n'}
          Benar tapi lambat tidak melukai boss. Salah/timeout = -1 nyawa.
        </Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  center:       { flex: 1, backgroundColor: C.bg, justifyContent: 'center', alignItems: 'center' },
  loadingText:  { color: C.muted, marginTop: 14, fontSize: 15 },
  container:    { flex: 1, backgroundColor: C.bg, paddingHorizontal: 20 },
  header:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  phaseTag:     { color: C.muted, fontSize: 13, fontWeight: 'bold', letterSpacing: 1 },
  streakTag:    { color: C.orange, fontSize: 13, fontWeight: 'bold' },
  bossCard:     { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface, borderRadius: 18, borderWidth: 2, padding: 14, marginBottom: 10 },
  bossName:     { fontSize: 15, fontWeight: 'bold', marginBottom: 6 },
  hpBg:         { height: 10, backgroundColor: '#ffffff18', borderRadius: 5 },
  hpFill:       { height: 10, borderRadius: 5 },
  hpText:       { color: C.muted, fontSize: 11, marginTop: 4 },
  lives:        { flexDirection: 'column', marginLeft: 8 },
  timeBg:       { height: 4, backgroundColor: '#ffffff18', borderRadius: 2 },
  timeFill:     { height: 4, borderRadius: 2 },
  timeText:     { color: C.muted, fontSize: 11, alignSelf: 'flex-end', marginTop: 2, marginBottom: 8 },
  qBox:         { backgroundColor: C.surface, borderRadius: 20, padding: 30, alignItems: 'center', marginBottom: 12 },
  qText:        { color: C.text, fontSize: 36, fontWeight: 'bold', textAlign: 'center' },
  feedbackText: { fontSize: 13, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  input:        { backgroundColor: C.surface, borderRadius: 12, padding: 16, color: C.text, fontSize: 24, textAlign: 'center', borderWidth: 1, borderColor: '#ffffff22', marginBottom: 12 },
  btn:          { backgroundColor: C.cyan, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  btnDim:       { backgroundColor: '#ffffff22' },
  btnText:      { color: C.bg, fontSize: 15, fontWeight: 'bold' },
  botRow:       { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  botHint:      { color: C.muted, fontSize: 11, marginLeft: 10, flex: 1 },
  resultEmoji:  { textAlign: 'center' },
  resultTitle:  { fontSize: 26, fontWeight: 'bold', marginTop: 8, textAlign: 'center' },
  resultSub:    { color: C.muted, fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  statsBox:     { backgroundColor: C.surface, borderRadius: 14, padding: 16, marginTop: 18, minWidth: 260 },
  statsLine:    { color: C.text, fontSize: 13, marginBottom: 4 },
});
