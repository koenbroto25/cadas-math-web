// src/screens/PracticeScreen.jsx
// Layar latihan utama â€” soal di WebView, bot overlay di atas
// Sprint H.6: bot reaction audio lengkap (52 file mapping)
// Sprint H.7: game mechanics â€” TIMEOUT, KEYPAD_HIT, BOSS_PHASE, BOSS_WIN, BOSS_LOSE

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Alert, ActivityIndicator,
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

const COLORS = {
  bg:      '#0A0A12',
  surface: '#13131F',
  cyan:    '#00F0FF',
  magenta: '#FF2EC4',
  lime:    '#B6FF00',
  text:    '#FFFFFF',
  muted:   '#888899',
};

// â”€â”€ Bot audio helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

export default function PracticeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    currentLevel, exercises, currentIndex,
    setExercises, nextExercise, recordAnswer,
    streak, botState, setBotState, botMode,
    getConfidenceScore, student, demoMode, adminQaMode,
  } = useStore();

  // -- Audio paket cadas-audio: BGM + micro-sound (cadas-sounds.md Bagian 4) --
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

  const webviewRef      = useRef(null);
  const soundRef        = useRef(null);   // exercise TTS
  const botSoundRef     = useRef(null);   // bot reaction audio
  const prevStreakRef   = useRef(0);      // untuk deteksi streak break
  const sessionCountRef = useRef(0);      // total benar di sesi ini
  const idleTimer       = useRef(null);
  const idleAudio30     = useRef(null);
  const idleAudio60     = useRef(null);
  const isMountedRef    = useRef(true);
  const nextTimerRef    = useRef(null);
  const stopSpeakingRef = useRef(null);

  // Boss battle state â€” reset setiap ganti soal
  const bossPhaseRef    = useRef(1);
  const bossAnsweredRef = useRef(false);  // guard: BOSS_WIN/LOSE hanya sekali per soal

  const visemeData    = useStore((s) => s.visemeData);
  const startSpeaking = useStore((s) => s.startSpeaking);
  const stopSpeaking  = useStore((s) => s.stopSpeaking);

  // Expo Audio (expo-audio v57): lifecycle-bound players, mirrored to legacy refs
  const ttsPlayer = usePracticePlayer();   // exercise TTS (web+native)
  const botPlayer = usePracticePlayer();   // bot reaction audio (web+native)
  soundRef.current    = ttsPlayer;
  botSoundRef.current = botPlayer;
  stopSpeakingRef.current = stopSpeaking;

  const exercise = exercises[currentIndex];

  // â”€â”€ Selection Rule (FASE 8.3b) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const [variantInfo,   setVariantInfo]   = useState(null);
  const [variantShown,  setVariantShown]  = useState(false);

  useEffect(() => {
    let cancelled = false;
    setVariantInfo(null);
    setVariantShown(false);
    // Reset boss state setiap ganti soal
    bossPhaseRef.current    = 1;
    bossAnsweredRef.current = false;
    if (!student?.id || !exercise) return;
    api.selectVariant(student.id, currentLevel, exercise.concept_id)
      .then((v) => { if (!cancelled) setVariantInfo(v); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [student?.id, currentLevel, exercise?.concept_id]);

  // â”€â”€ Load soal + welcome audio â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    loadExercises();
  }, [currentLevel]);

  // â—† Cleanup saat unmount: hentikan timer & audio yang masih tertunda â—†
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      clearTimeout(nextTimerRef.current);
      if (soundRef.current) {
        try { soundRef.current.pause(); } catch (_){}
      }
      if (botSoundRef.current) {
        try { botSoundRef.current.pause(); } catch (_){}
      }
      stopSpeaking();
    };
  }, []);

  // Expo Audio listener (v57): hentikan viseme/bot-speaking saat playback selesai
  useEffect(() => {
    const botSub = botPlayer.addListener((st) => {
      if (st?.didJustFinish || st?.error) {
        stopSpeakingRef.current?.();
        botSpeakingRef.current?.(false);   // BGM kembali ke volume normal (fade 1s)
      }
    });
    const ttsSub = ttsPlayer.addListener((st) => {
      if (st?.didJustFinish || st?.error) {
        stopSpeakingRef.current?.();
        botSpeakingRef.current?.(false);
      }
    });
    return () => { try { botSub.remove(); } catch (_){} try { ttsSub.remove(); } catch (_){} };
  }, [botPlayer, ttsPlayer]);

  // -- Backsound: mulai setelah soal siap, hentikan saat keluar layar --------
  // Track dipilih SEKALI per sesi (tidak berganti di tengah sesi) dan
  // disimpan di store agar SessionResult melanjutkan lagu yang sama.
  useEffect(() => {
    if (loading || !exercise) return;
    const track = bgmTrack || pickBgmTrack(currentLevel, levelSessionCounts[currentLevel] || 0);
    if (!bgmTrack) setBgmTrack(track);
    startBgm(track);
    return () => { stopBgm(); };
  }, [loading, currentLevel, exercise?.id]);

  // - sfx_session_start: sekali saat sesi pertama kali siap ------------------
  useEffect(() => {
    if (loading || !exercise || sessionStartSfxRef.current) return;
    sessionStartSfxRef.current = true;
    playSfx(SFX.SESSION_START);
  }, [loading, exercise?.id]);

  async function loadExercises() {
    try {
      setLoading(true);
      const data = await api.getExercises(currentLevel);
      setExercises(data.exercises);
      // Welcome audio setelah soal loaded
      const isBack = sessionCountRef.current > 0;
      setTimeout(() => playBotAudio(welcomeSound(currentLevel, isBack), false), 700);
    } catch {
      Alert.alert('Error', 'Gagal memuat soal. Cek koneksi internet.');
    } finally {
      setLoading(false);
      setStartTime(Date.now());
    }
  }

  // â”€â”€ Idle detection: 30s audio, 60s audio, 120s sleeping â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€ Pesan dari WebView (jawaban siswa + game mechanics) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleMessage = useCallback(async (event) => {
    resetIdleTimer();
    let msg;
    try { msg = JSON.parse(event.nativeEvent.data); } catch { return; }

    // â”€â”€ ANSWER: jawaban benar/salah dari semua template â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (msg.type === 'ANSWER') {
      const timeMs = Date.now() - startTime;
      recordAnswer(exercise.id, msg.correct, timeMs);
      if (msg.correct) {
        await handleCorrect(timeMs);
      } else {
        await handleWrong();
      }
    }

    // â”€â”€ TIMEOUT: meteor mendarat / speed bar habis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    // Dipicu oleh: meteorFall selesai (templates-common __meteorTimer)
    //              atau speed bar habis (spellFill)
    if (msg.type === 'TIMEOUT') {
      if (!isMountedRef.current) return;
      playSfx(SFX.METEOR_CRASH);
      playBotAudio('bot_timeout_01').catch(() => {});
      setBotState('disappointed_mild');
      // Catat sebagai salah tanpa menambah wrongCount (timer habis â‰  salah input)
      const timeMs = Date.now() - startTime;
      recordAnswer(exercise.id, false, timeMs);
      // Langsung lanjut soal berikutnya setelah jeda singkat
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

    // â”€â”€ KEYPAD_HIT: tiap digit ditekan di Spell & Fill / Boss Battle â”€â”€â”€â”€â”€â”€
    // SFX ringan, tidak mengganggu bot speaking
    if (msg.type === 'KEYPAD_HIT') {
      playSfx(SFX.DIGIT_LOCK);
    }

    // â”€â”€ BOSS_PHASE: boss L9 ganti fase (fase 2 atau 3) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (msg.type === 'BOSS_PHASE') {
      if (!isMountedRef.current) return;
      const phase = msg.phase ?? 2;
      bossPhaseRef.current = phase;
      playSfx(SFX.BOSS_PHASE);
      const phaseAudio = phase === 2 ? 'bot_boss_phase_01' : 'bot_boss_phase_02';
      playBotAudio(phaseAudio, true).catch(() => {});
      setBotState('speaking_hype');
    }

    // â”€â”€ BOSS_WIN: boss L9 kalah (semua 3 fase habis HP) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (msg.type === 'BOSS_WIN') {
      if (!isMountedRef.current || bossAnsweredRef.current) return;
      bossAnsweredRef.current = true;
      playSfx(SFX.LEVEL_UP);
      playBotAudio('bot_boss_win', true).catch(() => {});
      setBotState('celebrating');
      // Catat benar (boss win = soal selesai dengan benar)
      const timeMs = Date.now() - startTime;
      recordAnswer(exercise.id, true, timeMs);
      // Lanjut soal berikutnya setelah animasi selesai
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

    // â”€â”€ BOSS_LOSE: nyawa L9 habis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
    if (msg.type === 'BOSS_LOSE') {
      if (!isMountedRef.current || bossAnsweredRef.current) return;
      bossAnsweredRef.current = true;
      playSfx(SFX.GAME_OVER);
      playBotAudio('bot_boss_lose').catch(() => {});
      setBotState('disappointed_mild');
      // Catat salah
      const timeMs = Date.now() - startTime;
      recordAnswer(exercise.id, false, timeMs);
      // Ulangi soal yang sama setelah jeda (beri waktu siswa bernapas)
      clearTimeout(nextTimerRef.current);
      nextTimerRef.current = setTimeout(() => {
        if (!isMountedRef.current) return;
        bossAnsweredRef.current = false;
        bossPhaseRef.current    = 1;
        setBotState('idle');
        // Reload WebView soal yang sama (reset boss ke fase 1)
        webviewRef.current?.reload();
        setStartTime(Date.now());
        setWrongCount(0);
      }, 3500);
    }

  }, [exercise, startTime, wrongCount, botMode, streak, currentIndex]);

  // â”€â”€ handleCorrect â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

    // -- Micro-sound (cadas-sounds.md Bagian 2) ------------------------------
    // Satu sfxPlayer â†’ satu SFX per event; streak lebih meriah menang atas
    // feedback biasa. sfx_correct_fast hanya Zona B & C (Bagian 6 poin 3).
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

    // Pilih bot audio
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
      // Speed comment (acak, dicek independen per kategori waktu)
      const r = Math.random();
      if      (timeMs < 3000  && r < 0.05) botSound = 'bot_speed_kilat';
      else if (timeMs < 6000  && r < 0.08) botSound = 'bot_speed_cepat';
      else if (timeMs > 20000 && r < 0.06) botSound = 'bot_speed_pelan';
    }

    // Bot visual state
    if (newStreak >= 10) {
      setBotState('celebrating');
    } else if (newStreak >= 5) {
      setBotState('speaking_hype');
    } else {
      setBotState('idle');
    }

    await playBotAudio(botSound, newStreak >= 5);

    // Fast Track check
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

    // Soal berikutnya
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

  // â”€â”€ finishSession: ekstrak dari handleCorrect agar bisa dipanggil BOSS_WIN
  async function finishSession() {
    const sessionResults = useStore.getState().sessionResults;
    const totalMs = Date.now() - startTime;
    const correct = sessionResults.filter((r) => r.correct).length;
    const accuracy = sessionResults.length > 0 ? correct / sessionResults.length : 0;
    const drillSuggested = accuracy >= 0.8 && sessionResults.length >= 5;

    // Demo mode: skip saveSession dan level-up â€” tidak hit DB
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
    if (didLevelUp) useStore.getState().setLevel(newLevelVal);
    useStore.getState().setLevelSessionCount(currentLevel, sessionCount);
    if (didLevelUp) useStore.getState().setBgmTrack(null);   // zona baru = lagu baru

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
      avgTimeMs:      sessionResults.length > 0
        ? Math.round(
            sessionResults.filter(r => r.timeMs > 0)
              .reduce((a, r) => a + r.timeMs, 0) /
            sessionResults.filter(r => r.timeMs > 0).length
          )
        : 0,
      drillSuggested,
    });
  }

  // â”€â”€ handleWrong â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function handleWrong() {
    const newWrongCount   = wrongCount + 1;
    const prevStreak      = prevStreakRef.current;  // baca sebelum di-reset
    prevStreakRef.current  = 0;
    setWrongCount(newWrongCount);
    setBotState('disappointed_mild');

    // Streak break audio
    if (prevStreak >= 5) {
      playBotAudio('bot_streak_break_long').catch(() => {});
    } else if (prevStreak >= 3) {
      playBotAudio('bot_streak_break_short').catch(() => {});
    }

    // -- Micro-sound (cadas-sounds.md Bagian 2) ------------------------------
    playSfx(SFX.WRONG);
    if (prevStreak >= 5) {
      setTimeout(() => {
        if (isMountedRef.current) playSfx(SFX.STREAK_BREAK);
      }, 320);
    }

    // Adaptive Presence System
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

    // Weak student
    const confidence = getConfidenceScore();
    if (confidence > 0 && confidence < 0.3 && newWrongCount >= 2) {
      playBotAudio('bot_wrong_weak').catch(() => {});
    }
  }

  // â”€â”€ playBotAudio â€” bot reaction (no exercise viseme) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function playBotAudio(id, hype = false) {
    try {
      const url = api.botAudioUrl(id);
      if (botSoundRef.current) {
        try { botSoundRef.current.pause(); } catch (_){}
      }
      // Sprint H.7 â—† fetch viseme dari R2 via /api/bot-viseme/:id
      // Jika gagal (network/404), fallback ke SPEAKING_LOOP di BotCharacter (vData=null)
      let vData = null;
      try {
        const vRes = await fetch(api.botVisemeUrl(id));
        if (vRes.ok) vData = await vRes.json();
      } catch (_) {}
      // Aktifkan lip-sync di BotCharacter â€” hype=true â†’ speaking_hype (ekspresi semangat)
      startSpeaking(vData, hype);
      botSpeakingRef.current?.(true);   // ducking BGM ke 20% selama Kak Cadas bicara
      botSoundRef.current.replace({ uri: url });
      botSoundRef.current.play();
    } catch (err) {
      console.warn('[playBotAudio]', id, err?.message);
      stopSpeaking();               // pastikan tidak stuck di speaking state
    }
  }

  // â”€â”€ playSound â€” exercise TTS dengan viseme lip-sync â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  async function playSound(url, hype = false) {
    try {
      if (soundRef.current) {
        try { soundRef.current.pause(); } catch (_){}
      }
      let vData = null;
      try {
        const idMatch = url.match(/\/api\/tts\/([^?]+)/);
        if (idMatch) {
          const typeMatch = url.match(/type=(hint|trick)/);
          const vRes = await fetch(
            api.visemeUrl(idMatch[1], typeMatch ? typeMatch[1] : 'hint')
          );
          if (vRes.ok) vData = await vRes.json();
        }
      } catch (_) {}
      startSpeaking(vData, hype);
      botSpeakingRef.current?.(true);   // TTS = suara Kak Cadas â†’ BGM ducked
      soundRef.current.replace({ uri: url });
      soundRef.current.play();
    } catch (err) {
      console.warn('[playSound] error:', err);
      stopSpeaking();
    }
  }

  // â”€â”€ Inject script WebView â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  // CATATAN: template baru (bubblePop, spellFill, bossBattle) sudah
  // mengirim postMessage sendiri. INJECTED_JS ini hanya fallback untuk
  // template lama yang masih pakai window.checkAnswer + input#answer-input.
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

  const exerciseUrl = exercise
    ? `${BASE_URL}/exercises/${exercise.id}.html`
    : null;

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
          <Text style={styles.back}>{'â†'}</Text>
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
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center',
                backgroundColor: COLORS.bg },
  header:     { flexDirection: 'row', alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 20, paddingVertical: 12 },
  back:       { color: COLORS.cyan, fontSize: 24 },
  levelLabel: { color: COLORS.text, fontSize: 18, fontWeight: 'bold' },
  progress:   { color: COLORS.muted, fontSize: 14 },
  content:    { flex: 1, position: 'relative' },
  webview:    { flex: 1, backgroundColor: 'transparent' },
  botOverlay: { position: 'absolute', top: 8, right: 12, zIndex: 10, opacity: 0.92 },
  loadText:   { color: COLORS.muted, fontSize: 16 },
});

