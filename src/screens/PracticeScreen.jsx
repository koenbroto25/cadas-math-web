// src/screens/PracticeScreen.jsx
// Layar latihan utama — soal di WebView, bot overlay di atas
// Sprint H.6: bot reaction audio lengkap (52 file mapping)
// Sprint H.7: game mechanics — TIMEOUT, KEYPAD_HIT, BOSS_PHASE, BOSS_WIN, BOSS_LOSE
// Sprint S-2: session tracking (AppState + heartbeat + sessionStart/End)

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator, AppState, Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePracticePlayer } from '../utils/createPlayer';
import { useStore } from '../store/useStore';
import { api, BASE_URL } from '../services/api';
import BotCharacter from '../components/BotCharacter';
import StreakBar from '../components/StreakBar';
import HintPanel from '../components/HintPanel';
import { useGameAudio } from '../hooks/useGameAudio';
import { SFX, pickBgmTrack } from '../audio/audioCatalog';
import { targetMsFor, allowsCorrectFastSfx } from '../constants/levelTargets';
import PlacementCardModal from './PlacementCardModal';

const COLORS = {
  bg:      '#0A0A12',
  surface: '#13131F',
  cyan:    '#00F0FF',
  magenta: '#FF2EC4',
  lime:    '#B6FF00',
  text:    '#FFFFFF',
  muted:   '#888899',
};

// -- Bot audio helpers -------------------------------------------------------
const CORRECT_SOUNDS = [
  'bot_correct_01','bot_correct_02','bot_correct_03',
  'bot_correct_04','bot_correct_05',
];
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function welcomeSound(level, isBack) {
  if (isBack)      return 'bot_welcome_back';
  if (level <= 3)  return 'bot_welcome_l1_l3';
  if (level <= 7)  return 'bot_welcome_l4_l7';
  if (level <= 12) return 'bot_welcome_l8_l12';
  return 'bot_welcome_l13_l15';
}

// -- Heartbeat interval (ms) -------------------------------------------------
const HEARTBEAT_MS = 30000;

export default function PracticeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    currentLevel, exercises, currentIndex,
    setExercises, nextExercise, recordAnswer,
    streak, botState, setBotState, botMode,
    getConfidenceScore, student, demoMode, adminQaMode,
    setLevelAccess,
  } = useStore();

  const {
    startBgm, stopBgm, botSpeaking, playSfx,
  } = useGameAudio();
  const botSpeakingRef   = useRef(botSpeaking);
  botSpeakingRef.current = botSpeaking;
  const levelSessionCounts = useStore((s) => s.levelSessionCounts);
  const bgmTrack           = useStore((s) => s.bgmTrack);
  const setBgmTrack        = useStore((s) => s.setBgmTrack);
  const sessionStartSfxRef = useRef(false);

  const [loading,    setLoading]    = useState(true);
  const [wrongCount, setWrongCount] = useState(0);
  const [showHint,   setShowHint]   = useState(false);
  const [hintLevel,  setHintLevel]  = useState(0);
  const [startTime,  setStartTime]  = useState(Date.now());
  const [fastTrack,  setFastTrack]  = useState(false);
  const [bossOffer,   setBossOffer]  = useState(false);

  // -- A1 / OQ-3: gate kartu ID ----------------------------------------------
  // cardGate true → layar latihan diganti modal kartu ID (tidak bisa skip).
  const [cardGate,      setCardGate]      = useState(false);
  const [cardStudent,   setCardStudent]   = useState(null);
  const [cardGateError, setCardGateError] = useState(false);

  const webviewRef      = useRef(null);
  const soundRef        = useRef(null);
  const botSoundRef     = useRef(null);
  const prevStreakRef   = useRef(0);
  const sessionCountRef = useRef(0);
  const idleTimer       = useRef(null);
  const idleAudio30     = useRef(null);
  const idleAudio60     = useRef(null);
  const isMountedRef    = useRef(true);
  const nextTimerRef    = useRef(null);
  const stopSpeakingRef = useRef(null);

  const bossPhaseRef    = useRef(1);
  const bossAnsweredRef = useRef(false);

  const visemeData    = useStore((s) => s.visemeData);
  const startSpeaking = useStore((s) => s.startSpeaking);
  const stopSpeaking  = useStore((s) => s.stopSpeaking);

  const ttsPlayer = usePracticePlayer();
  const botPlayer = usePracticePlayer();
  soundRef.current    = ttsPlayer;
  botSoundRef.current = botPlayer;
  stopSpeakingRef.current = stopSpeaking;

  // -- Sprint S-2: Session tracking refs -------------------------------------
  const studySessionId    = useRef(null);   // id dari /api/session/start
  const sessionStartedAt  = useRef(null);   // wall clock sesi mulai
  const bgStartRef        = useRef(null);   // kapan app ke background
  const totalBgMsRef      = useRef(0);      // total ms di background
  const exitCountRef      = useRef(0);      // berapa kali keluar app
  const heartbeatTimer    = useRef(null);   // interval heartbeat
  const sessionEndedRef   = useRef(false);  // guard: sessionEnd hanya sekali

  const exercise = exercises[currentIndex];

  // -- Paywall check setiap 5 soal -------------------------------------------
  // Sumber kebenaran akses: middleware/level-access.js, dibaca via
  //   GET /api/exercises/level-info/:level?student_id=...
  //     level_access: 'trial' | 'trial_exhausted' | 'basic' | 'premium' | 'locked'
  //     trial_remaining: sisa kuota 5 soal gratis (TRIAL_LIMIT di exercises.js)
  // Aturan: siswa basic/premium tidak pernah kena paywall. Siswa trial hanya
  // boleh 5 soal — saat kuota habis (atau level belum dibuka) tampilkan paywall.
  useEffect(() => {
    if (!student?.id || demoMode || adminQaMode) return;
    if (currentIndex <= 0 || currentIndex % 5 !== 0) return;
    let cancelled = false;
    (async () => {
      try {
        const info = await api.trialStatus(currentLevel, student.id);
        if (cancelled || !info) return;
        const access    = info.level_access;
        const remaining = info.trial_remaining ?? 0;
        const isPaid    = access === 'basic' || access === 'premium';
        if (isPaid) return;
        if (access === 'locked' || remaining <= 0) {
          setLevelAccess(access === 'locked' ? 'locked' : 'trial_exhausted');
          navigation.navigate('UpgradePaywall', {
            studentId: student.id,
            placedLevel: currentLevel,
          });
        }
      } catch (e) {
        console.warn('[paywall]', e?.message);
      }
    })();
    return () => { cancelled = true; };
  }, [currentIndex, currentLevel, student?.id]);

  // -- A1 / OQ-3: gate kartu ID ----------------------------------------------
  // Siswa baru wajib membagikan/mengunduh kartu ID sebelum latihan
  // (students.card_shared, di-set oleh PlacementCardModal / SettingsScreen).
  // Sumber info gate: level-info.card_gate (backend middleware/card-gate.js).
  // Demo & admin QA dikecualikan supaya presentasi/QA tidak terblokir.
  const openCardGate = useCallback(async () => {
    setCardGate(true);
    setCardGateError(false);
    try {
      const token = useStore.getState().authToken;
      if (!token) return;
      const card = await api.getStudentCard(token);
      if (isMountedRef.current) setCardStudent(card);
    } catch (e) {
      console.warn('[cardGate:open]', e?.message);
      if (isMountedRef.current) setCardGateError(true);
    }
  }, []);

  useEffect(() => {
    if (!student?.id || demoMode || adminQaMode) return;
    let cancelled = false;
    (async () => {
      try {
        const info = await api.trialStatus(currentLevel, student.id);
        if (!cancelled && info?.card_gate?.required) openCardGate();
      } catch (e) {
        console.warn('[cardGate:check]', e?.message);
      }
    })();
    return () => { cancelled = true; };
  }, [currentLevel, student?.id, demoMode, adminQaMode, openCardGate]);

  // Setelah aksi kartu selesai (modal sudah PATCH card-shared) → muat soal lagi
  function handleCardGateDone() {
    setCardGate(false);
    setCardGateError(false);
    loadExercises({ silent: true });
  }

  // -- Sprint S-2: mulai sesi di backend -------------------------------------
  async function startStudySession() {
    if (!student?.id || demoMode || adminQaMode) return;
    try {
      const token = useStore.getState().authToken;
      const resp  = await api.sessionStart({ level: currentLevel }, token);
      studySessionId.current   = resp.session_id;
      sessionStartedAt.current = Date.now();
      totalBgMsRef.current     = 0;
      exitCountRef.current     = 0;
      sessionEndedRef.current  = false;
    } catch (e) {
      // A1 / OQ-3: backend menolak karena kartu ID belum dibagikan
      if (e?.data?.error === 'CARD_NOT_SHARED') {
        openCardGate();
      } else {
        console.warn('[studySession/start]', e?.message);
      }
    }
  }

  // -- Sprint S-2: hitung durasi aktif (wall clock - background time) --------
  function getDurationActiveMs() {
    if (!sessionStartedAt.current) return 0;
    const totalMs = Date.now() - sessionStartedAt.current;
    return Math.max(0, totalMs - totalBgMsRef.current);
  }

  // -- Sprint S-2: kirim heartbeat setiap 30 detik ---------------------------
  function startHeartbeat() {
    stopHeartbeat();
    heartbeatTimer.current = setInterval(async () => {
      if (!studySessionId.current || !student?.id || demoMode || adminQaMode) return;
      try {
        const token = useStore.getState().authToken;
        await api.sessionHeartbeat({
          session_id:         studySessionId.current,
          duration_active_ms: getDurationActiveMs(),
        }, token);
      } catch (e) {
        console.warn('[heartbeat]', e?.message);
      }
    }, HEARTBEAT_MS);
  }

  function stopHeartbeat() {
    if (heartbeatTimer.current) {
      clearInterval(heartbeatTimer.current);
      heartbeatTimer.current = null;
    }
  }

  // -- Sprint S-2: tutup sesi di backend -------------------------------------
  async function endStudySession(sessionResults, accuracy, didLevelUp) {
    if (!studySessionId.current || sessionEndedRef.current) return;
    if (!student?.id || demoMode || adminQaMode) return;
    sessionEndedRef.current = true;
    stopHeartbeat();

    // Jika masih di background saat end, hitung bg time
    if (bgStartRef.current) {
      totalBgMsRef.current += Date.now() - bgStartRef.current;
      bgStartRef.current = null;
    }

    const correct   = sessionResults.filter((r) => r.correct).length;
    const total     = sessionResults.length;
    const activeMs  = getDurationActiveMs();

    try {
      const token = useStore.getState().authToken;
      await api.sessionEnd({
        session_id:         studySessionId.current,
        duration_active_ms: activeMs,
        exit_count:         exitCountRef.current,
        level:              currentLevel,
        correct_count:      correct,
        total_count:        total,
        accuracy:           total > 0 ? (correct / total) * 100 : 0,
        level_up:           didLevelUp,
      }, token);
    } catch (e) {
      console.warn('[studySession/end]', e?.message);
    }
  }

  // -- Sprint S-2: AppState listener (native) atau visibilitychange (web) ----
  useEffect(() => {
    if (Platform.OS === 'web') {
      // PWA: visibilitychange
      const handler = () => {
        if (document.hidden) {
          bgStartRef.current = Date.now();
          exitCountRef.current += 1;
        } else if (bgStartRef.current) {
          totalBgMsRef.current += Date.now() - bgStartRef.current;
          bgStartRef.current = null;
        }
      };
      document.addEventListener('visibilitychange', handler);
      return () => document.removeEventListener('visibilitychange', handler);
    } else {
      // Native: AppState
      const sub = AppState.addEventListener('change', (nextState) => {
        if (nextState === 'background' || nextState === 'inactive') {
          bgStartRef.current = Date.now();
          exitCountRef.current += 1;
        } else if (nextState === 'active' && bgStartRef.current) {
          totalBgMsRef.current += Date.now() - bgStartRef.current;
          bgStartRef.current = null;
        }
      });
      return () => sub.remove();
    }
  }, []);

  // -- Selection Rule (FASE 8.3b) --------------------------------------------
  const [variantInfo,  setVariantInfo]  = useState(null);
  const [variantShown, setVariantShown] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setVariantInfo(null);
    setVariantShown(false);
    bossPhaseRef.current    = 1;
    bossAnsweredRef.current = false;
    if (!student?.id || !exercise) return;
    api.selectVariant(student.id, currentLevel, exercise.concept_id)
      .then((v) => { if (!cancelled) setVariantInfo(v); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [student?.id, currentLevel, exercise?.concept_id]);

  // -- Load soal + welcome audio + mulai sesi --------------------------------
  useEffect(() => {
    loadExercises();
  }, [currentLevel]);

  // -- Cleanup saat unmount --------------------------------------------------
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimeout(nextTimerRef.current);
      stopHeartbeat();
      if (soundRef.current)    { try { soundRef.current.pause();    } catch (_){} }
      if (botSoundRef.current) { try { botSoundRef.current.pause(); } catch (_){} }
      stopSpeaking();
    };
  }, []);

  // -- Expo Audio listener ---------------------------------------------------
  useEffect(() => {
    const botSub = botPlayer.addListener((st) => {
      if (st?.didJustFinish || st?.error) {
        stopSpeakingRef.current?.();
        botSpeakingRef.current?.(false);
      }
    });
    const ttsSub = ttsPlayer.addListener((st) => {
      if (st?.didJustFinish || st?.error) {
        stopSpeakingRef.current?.();
        botSpeakingRef.current?.(false);
      }
    });
    return () => {
      try { botSub.remove(); } catch (_){}
      try { ttsSub.remove(); } catch (_){}
    };
  }, [botPlayer, ttsPlayer]);

  // -- BGM -------------------------------------------------------------------
  useEffect(() => {
    if (loading || !exercise) return;
    const track = bgmTrack || pickBgmTrack(currentLevel, levelSessionCounts[currentLevel] || 0);
    if (!bgmTrack) setBgmTrack(track);
    startBgm(track);
    return () => { stopBgm(); };
  }, [loading, currentLevel, exercise?.id]);

  // -- SFX session start -----------------------------------------------------
  useEffect(() => {
    if (loading || !exercise || sessionStartSfxRef.current) return;
    sessionStartSfxRef.current = true;
    playSfx(SFX.SESSION_START);
  }, [loading, exercise?.id]);

  async function loadExercises({ silent = false } = {}) {
    try {
      setLoading(true);
      const token = useStore.getState().authToken;
      const data  = await api.getExercises(currentLevel, token, student?.id);
      setExercises(data.exercises);
      if (!silent) {
        setTimeout(() => playBotAudio(welcomeSound(currentLevel, sessionCountRef.current > 0), false), 700);
      }
      // Mulai sesi tracking setelah soal loaded
      await startStudySession();
      startHeartbeat();
    } catch (err) {
      // A1 / OQ-3: kartu ID belum dibagikan → buka modal kartu, bukan alert error
      if (err?.data?.error === 'CARD_NOT_SHARED') {
        openCardGate();
      } else {
        Alert.alert('Error', 'Gagal memuat soal. Cek koneksi internet.');
      }
    } finally {
      setLoading(false);
      setStartTime(Date.now());
    }
  }

  // -- Idle detection --------------------------------------------------------
  function resetIdleTimer() {
    clearTimeout(idleTimer.current);
    clearTimeout(idleAudio30.current);
    clearTimeout(idleAudio60.current);
    if (botState === 'sleeping') setBotState('idle');

    idleAudio30.current = setTimeout(() => {
      playBotAudio('bot_idle_30s').catch(() => {});
    }, 30000);

    idleAudio60.current = setTimeout(() => {
      playBotAudio('bot_idle_60s').catch(() => {});
    }, 60000);

    idleTimer.current = setTimeout(() => setBotState('sleeping'), 120000);
  }

  useEffect(() => {
    resetIdleTimer();
    return () => {
      clearTimeout(idleTimer.current);
      clearTimeout(idleAudio30.current);
      clearTimeout(idleAudio60.current);
    };
  }, [currentIndex]);

  // -- Pesan dari WebView ----------------------------------------------------
  const handleMessage = useCallback(async (event) => {
    resetIdleTimer();
    let msg;
    try { msg = JSON.parse(event.nativeEvent.data); } catch { return; }

    if (msg.type === 'ANSWER') {
      const timeMs = Date.now() - startTime;
      recordAnswer(exercise.id, msg.correct, timeMs);
      if (msg.correct) {
        await handleCorrect(timeMs);
      } else {
        await handleWrong();
      }
    }

    if (msg.type === 'TIMEOUT') {
      if (!isMountedRef.current) return;
      playSfx(SFX.METEOR_CRASH);
      playBotAudio('bot_timeout_01').catch(() => {});
      setBotState('disappointed_mild');
      const timeMs = Date.now() - startTime;
      recordAnswer(exercise.id, false, timeMs);
      clearTimeout(nextTimerRef.current);
      nextTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        if (currentIndex < exercises.length - 1) {
          nextExercise();
          setStartTime(Date.now());
          setWrongCount(0);
          setBotState('idle');
        }
      }, 1800);
    }

    if (msg.type === 'KEYPAD_HIT') {
      playSfx(SFX.DIGIT_LOCK);
    }

    if (msg.type === 'BOSS_PHASE') {
      if (!isMountedRef.current) return;
      const phase = msg.phase ?? 2;
      bossPhaseRef.current = phase;
      playSfx(SFX.BOSS_PHASE);
      playBotAudio(phase === 2 ? 'bot_boss_phase_01' : 'bot_boss_phase_02', true).catch(() => {});
      setBotState('speaking_hype');
    }

    if (msg.type === 'BOSS_WIN') {
      if (!isMountedRef.current || bossAnsweredRef.current) return;
      bossAnsweredRef.current = true;
      playSfx(SFX.LEVEL_UP);
      playBotAudio('bot_boss_win', true).catch(() => {});
      setBotState('celebrating');
      const timeMs = Date.now() - startTime;
      recordAnswer(exercise.id, true, timeMs);
      clearTimeout(nextTimerRef.current);
      nextTimerRef.current = setTimeout(async () => {
        if (!isMountedRef.current) return;
        if (currentIndex < exercises.length - 1) {
          nextExercise();
          setStartTime(Date.now());
          setBotState('idle');
        } else {
          await finishSession();
        }
      }, 3000);
    }

    if (msg.type === 'BOSS_LOSE') {
      if (!isMountedRef.current || bossAnsweredRef.current) return;
      bossAnsweredRef.current = true;
      playSfx(SFX.GAME_OVER);
      playBotAudio('bot_boss_lose').catch(() => {});
      setBotState('disappointed_mild');
      const timeMs = Date.now() - startTime;
      recordAnswer(exercise.id, false, timeMs);
      clearTimeout(nextTimerRef.current);
      nextTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        bossAnsweredRef.current = false;
        bossPhaseRef.current    = 1;
        setBotState('idle');
        webviewRef.current?.reload();
        setStartTime(Date.now());
        setWrongCount(0);
      }, 3500);
    }

  }, [exercise, startTime, wrongCount, botMode, streak, currentIndex]);

  // -- handleCorrect ---------------------------------------------------------
  async function handleCorrect(timeMs) {
    if (variantShown && student?.id && exercise?.concept_id) {
      api.recordVariantHelpful({
        student_id: student.id,
        concept_id: exercise.concept_id,
        variant_id: variantInfo?.variantId || 'quick',
      }).catch(() => {});
    }

    const newStreak      = streak + 1;
    prevStreakRef.current = newStreak;
    sessionCountRef.current += 1;
    setWrongCount(0);
    setShowHint(false);
    setHintLevel(0);

    if (newStreak === 10) {
      playSfx(SFX.STREAK_10);
    } else if (newStreak === 5) {
      playSfx(SFX.STREAK_5);
    } else if (allowsCorrectFastSfx(currentLevel) && timeMs > 0
               && timeMs < targetMsFor(currentLevel)) {
      playSfx(SFX.CORRECT_FAST);
    } else {
      playSfx(SFX.CORRECT);
    }

    const isLastQuestion = currentIndex >= exercises.length - 1;
    const confidence     = getConfidenceScore();

    let botSound;
    if (isLastQuestion) {
      botSound = 'bot_correct_last';
    } else if (wrongCount > 0) {
      botSound = 'bot_correct_after_wrong';
    } else if (confidence > 0 && confidence < 0.4 && sessionCountRef.current > 5) {
      botSound = 'bot_correct_weak';
    } else if (newStreak >= 10) {
      botSound = 'bot_streak_10';
    } else if (newStreak >= 5) {
      botSound = 'bot_streak_5';
    } else if (newStreak === 3) {
      botSound = 'bot_streak_3';
    } else {
      botSound = pick(CORRECT_SOUNDS);
      const r = Math.random();
      if      (timeMs < 3000  && r < 0.05) botSound = 'bot_speed_kilat';
      else if (timeMs < 6000  && r < 0.08) botSound = 'bot_speed_cepat';
      else if (timeMs > 20000 && r < 0.06) botSound = 'bot_speed_pelan';
    }

    if (newStreak >= 10) {
      setBotState('celebrating');
    } else if (newStreak >= 5) {
      setBotState('speaking_hype');
    } else {
      setBotState('idle');
    }

    await playBotAudio(botSound, newStreak >= 5);

    if (confidence > 0.85 && !fastTrack && newStreak >= 9) {
      setFastTrack(true);
      Alert.alert(
        'Fast Track!',
        'Kayaknya kamu udah kuat banget di sini. Mau coba tes naik level sekarang?',
        [
          { text: 'Nanti aja', style: 'cancel' },
          { text: 'Coba sekarang!', onPress: () =>
              navigation.navigate('FastTrack', { level: currentLevel }) },
        ]
      );
    }

    // Boss battle offer — level 9 saja, sekali per mount, setelah streak kuat
    if (currentLevel === 9 && !bossOffer && newStreak >= 9) {
      setBossOffer(true);
      Alert.alert(
        '⚔️ Boss Battle!',
        'Level 9 adalah championship gate. Berani lawan Boss sekarang?',
        [
          { text: 'Nanti dulu', style: 'cancel' },
          { text: 'Lawan Boss!', onPress: () =>
              navigation.navigate('BossBattle', { level: 9 }) },
        ]
      );
    }

    nextTimerRef.current = setTimeout(async () => {
      if (!isMountedRef.current) return;
      if (currentIndex < exercises.length - 1) {
        nextExercise();
        setStartTime(Date.now());
        setBotState('idle');
      } else {
        await finishSession();
      }
    }, newStreak >= 5 ? 1500 : 800);
  }

  // -- finishSession ---------------------------------------------------------
  async function finishSession() {
    const sessionResults = useStore.getState().sessionResults;
    const totalMs  = Date.now() - startTime;
    const correct  = sessionResults.filter((r) => r.correct).length;
    const accuracy = sessionResults.length > 0 ? correct / sessionResults.length : 0;
    const drillSuggested = accuracy >= 0.8 && sessionResults.length >= 5;

    let sessionResp = null;
    if (student?.id && !demoMode && !adminQaMode) {
      try {
        sessionResp = await api.saveSession({
          student_id: student.id,
          level:      currentLevel,
          results:    sessionResults,
        }, useStore.getState().authToken);
      } catch (e) {
        console.warn('[saveSession]', e?.message);
      }
    }

    const didLevelUp   = sessionResp?.level_up     ?? false;
    const newLevelVal  = sessionResp?.new_level    ?? currentLevel;
    const sessionCount = sessionResp?.session_count ?? 0;
    // Trial habis (5 soal, TRIAL_LIMIT di exercises.js) — sinkronkan badge akses
    // di store supaya Home/SessionResult langsung menampilkan gate upgrade.
    const trialExhausted = sessionResp?.trial_exhausted ?? false;
    if (trialExhausted) useStore.getState().setLevelAccess('trial_exhausted');
    if (didLevelUp) useStore.getState().setLevel(newLevelVal);
    useStore.getState().setLevelSessionCount(currentLevel, sessionCount);
    if (didLevelUp) useStore.getState().setBgmTrack(null);

    // Sprint S-2: tutup study session (non-blocking, tidak menunda navigasi)
    endStudySession(sessionResults, accuracy, didLevelUp).catch((e) =>
      console.warn('[endStudySession]', e?.message)
    );

    if (!isMountedRef.current) return;
    navigation.navigate('SessionResult', {
      level:          currentLevel,
      results:        sessionResults,
      accuracy,
      totalQuestions: sessionResults.length,
      correctAnswers: correct,
      timeTotalMs:    totalMs,
      levelUp:        didLevelUp,
      newLevel:       newLevelVal,
      sessionCount,
      trialExhausted,
      avgTimeMs: sessionResults.length > 0
        ? Math.round(
            sessionResults.filter(r => r.timeMs > 0)
              .reduce((a, r) => a + r.timeMs, 0) /
            sessionResults.filter(r => r.timeMs > 0).length
          )
        : 0,
      drillSuggested,
    });
  }

  // -- handleWrong -----------------------------------------------------------
  async function handleWrong() {
    const newWrongCount   = wrongCount + 1;
    const prevStreak      = prevStreakRef.current;
    prevStreakRef.current  = 0;
    setWrongCount(newWrongCount);
    setBotState('disappointed_mild');

    if (prevStreak >= 5) {
      playBotAudio('bot_streak_break_long').catch(() => {});
    } else if (prevStreak >= 3) {
      playBotAudio('bot_streak_break_short').catch(() => {});
    }

    playSfx(SFX.WRONG);
    if (prevStreak >= 5) {
      setTimeout(() => {
        if (isMountedRef.current) playSfx(SFX.STREAK_BREAK);
      }, 320);
    }

    const shouldSpeak = botMode === 'intensif'
      || (botMode === 'terbimbing' && newWrongCount >= 1)
      || (botMode === 'mandiri'    && newWrongCount >= 3);

    if (!shouldSpeak) return;

    const variantOffer = variantInfo &&
      ['placement', 'performance'].includes(variantInfo.source) &&
      newWrongCount >= variantInfo.offerFromAttempt;

    if (variantOffer) {
      setShowHint(true);
      setHintLevel(2);
      setBotState('speaking_calm');
      setVariantShown(true);
      if (student?.id && exercise?.concept_id) {
        api.recordVariantShown({
          student_id: student.id,
          concept_id: exercise.concept_id,
          level:      currentLevel,
          variant_id: variantInfo.variantId,
        }).catch(() => {});
      }
      await playSound(api.ttsUrl(exercise.id, 'trick'));
      playBotAudio('bot_wrong_trick').catch(() => {});

    } else if (newWrongCount === 1 && botMode !== 'mandiri') {
      setShowHint(true);
      setHintLevel(0);
      await playBotAudio('bot_wrong_01');

    } else if (newWrongCount === 2) {
      setShowHint(true);
      setHintLevel(1);
      setBotState('speaking_calm');
      await playSound(api.ttsUrl(exercise.id, 'hint'));
      playBotAudio('bot_wrong_after_hint').catch(() => {});

    } else if (newWrongCount === 3) {
      setShowHint(true);
      setHintLevel(2);
      setBotState('speaking_calm');
      await playSound(api.ttsUrl(exercise.id, 'trick'));
      playBotAudio('bot_wrong_3row').catch(() => {});

    } else if (newWrongCount >= 5) {
      setShowHint(true);
      setHintLevel(2);
      setBotState('speaking_calm');
      playBotAudio('bot_wrong_many').catch(() => {});
    }

    const confidence = getConfidenceScore();
    if (confidence > 0 && confidence < 0.3 && newWrongCount >= 2) {
      playBotAudio('bot_wrong_weak').catch(() => {});
    }
  }

  // -- playBotAudio ----------------------------------------------------------
  async function playBotAudio(id, hype = false) {
    try {
      const url = api.botAudioUrl(id);
      if (botSoundRef.current) { try { botSoundRef.current.pause(); } catch (_){} }
      let vData = null;
      try {
        const vRes = await fetch(api.botVisemeUrl(id));
        if (vRes.ok) vData = await vRes.json();
      } catch (_) {}
      startSpeaking(vData, hype);
      botSpeakingRef.current?.(true);
      botSoundRef.current.replace({ uri: url });
      botSoundRef.current.play();
    } catch (err) {
      console.warn('[playBotAudio]', id, err?.message);
      stopSpeaking();
    }
  }

  // -- playSound -------------------------------------------------------------
  async function playSound(url, hype = false) {
    try {
      if (soundRef.current) { try { soundRef.current.pause(); } catch (_){} }
      let vData = null;
      try {
        const idMatch   = url.match(/\/api\/tts\/([^?]+)/);
        const typeMatch = url.match(/type=(hint|trick)/);
        if (idMatch) {
          const vRes = await fetch(api.visemeUrl(idMatch[1], typeMatch ? typeMatch[1] : 'hint'));
          if (vRes.ok) vData = await vRes.json();
        }
      } catch (_) {}
      startSpeaking(vData, hype);
      botSpeakingRef.current?.(true);
      soundRef.current.replace({ uri: url });
      soundRef.current.play();
    } catch (err) {
      console.warn('[playSound] error:', err);
      stopSpeaking();
    }
  }

  // -- Inject script WebView -------------------------------------------------
  const INJECTED_JS = `
    (function() {
      var orig = window.checkAnswer;
      window.checkAnswer = function() {
        var input = document.getElementById('answer-input');
        var correct = window.__correct;
        if (!input) return orig && orig();
        var val = parseFloat(input.value);
        var isCorrect = !isNaN(val) && Math.abs(val - correct) < 0.01;
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'ANSWER', correct: isCorrect, value: val, expected: correct,
        }));
        if (orig) orig();
      };
      document.querySelectorAll('.btn').forEach(function(btn) {
        if (btn.textContent.includes('Cek')) btn.onclick = window.checkAnswer;
      });
    })();
    true;
  `;

  const exerciseUrl = exercise ? `${BASE_URL}/exercises/${exercise.id}.html` : null;

  // A1 / OQ-3: kartu ID belum dibagikan → latihan diblokir dengan modal kartu.
  // Modal hanya bisa ditutup setelah 1 aksi (share WA / download PDF), jadi
  // gate ini tidak bisa di-skip dari sisi UI.
  if (cardGate) {
    const cardTarget = cardStudent || student;
    return (
      <View style={[styles.center, { backgroundColor: COLORS.bg }]}>
        <Text style={styles.loadText}>📇 Bagikan Kartu ID dulu ya…</Text>
        <Text style={[styles.loadText, {
          fontSize: 13, color: COLORS.muted, textAlign: 'center',
          paddingHorizontal: 28, marginTop: 10,
        }]}>
          Kartu ID dipakai orang tua untuk memantau progres dan mengaktifkan akun lengkapmu.
        </Text>
        {(!cardTarget?.display_id || cardGateError) && (
          <TouchableOpacity style={{ marginTop: 20 }} onPress={openCardGate}>
            <Text style={{ color: COLORS.cyan, fontWeight: 'bold' }}>Coba lagi</Text>
          </TouchableOpacity>
        )}
        {cardTarget?.display_id && (
          <PlacementCardModal
            visible
            student={cardTarget}
            placedLevel={currentLevel}
            onDone={handleCardGateDone}
          />
        )}
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: COLORS.bg }]}>
        <ActivityIndicator color={COLORS.cyan} size="large" />
        <Text style={[styles.loadText, { marginTop: 16 }]}>Memuat soal...</Text>
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={[styles.center, { backgroundColor: COLORS.bg }]}>
        <Text style={styles.loadText}>Tidak ada soal untuk level ini.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.back}>{'<-'}</Text>
        </TouchableOpacity>
        <Text style={styles.levelLabel}>Level {currentLevel}</Text>
        <Text style={styles.progress}>{currentIndex + 1}/{exercises.length}</Text>
      </View>

      <StreakBar streak={streak} />

      <View style={styles.content}>
        <View style={styles.botOverlay} pointerEvents="none">
          <BotCharacter size={80} visemeData={visemeData} />
        </View>

        <WebView
          ref={webviewRef}
          source={{ uri: exerciseUrl }}
          style={styles.webview}
          injectedJavaScript={INJECTED_JS}
          onMessage={handleMessage}
          onTouchStart={resetIdleTimer}
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
          backgroundColor={COLORS.bg}
        />

        {showHint && (
          <HintPanel
            exercise={exercise}
            hintLevel={hintLevel}
            onClose={() => { setShowHint(false); setHintLevel(0); }}
            onPlayAudio={playSound}
            apiTtsUrl={api.ttsUrl}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: COLORS.bg },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg },
  header:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  back:       { color: COLORS.cyan, fontSize: 24 },
  levelLabel: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  progress:   { color: COLORS.muted, fontSize: 14 },
  content:    { flex: 1, position: 'relative' },
  webview:    { flex: 1, backgroundColor: 'transparent' },
  botOverlay: { position: 'absolute', top: 8, right: 12, zIndex: 10, opacity: 0.92 },
  loadText:   { color: COLORS.muted, fontSize: 16 },
});