// src/screens/SessionResultScreen.jsx
// Rewrite dari stub — session end (practice) dan Fast Track level_up
// Params: { accuracy, totalQuestions, correctAnswers, timeTotalMs, levelUp, level,
//           newLevel, sessionCount, avgTimeMs, drillSuggested, levelAccess }
// FIX v2: ganti expo-av -> expo-audio (useAudioPlayer hook)

import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usePracticePlayer } from '../utils/createPlayer';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import BotCharacter from '../components/BotCharacter';
import { useGameAudio } from '../hooks/useGameAudio';

// TARGET_MS dipindah ke src/constants/levelTargets.js (single source of truth)
import { targetMsFor } from '../constants/levelTargets';

const C = {
  bg: '#0A0A12', surface: '#13131F', cyan: '#00F0FF',
  magenta: '#FF2EC4', text: '#FFFFFF', muted: '#888899',
  lime: '#B6FF00', yellow: '#FFD700',
};

export default function SessionResultScreen({ navigation, route }) {
  const {
    accuracy       = 0,
    totalQuestions = 0,
    correctAnswers = 0,
    timeTotalMs    = 0,
    levelUp        = false,
    level          = 1,
    newLevel       = 1,
    sessionCount   = 0,
    avgTimeMs      = 0,
    drillSuggested = false,
    levelAccess    = 'trial',
  } = route?.params ?? {};

  const store   = useStore();
  const insets  = useSafeAreaInsets();
  const pct     = Math.round(accuracy * 100);
  const displayLevel = levelUp ? newLevel : level;
  const mins    = Math.floor(timeTotalMs / 60000);
  const secs    = Math.floor((timeTotalMs % 60000) / 1000);
  const timeStr = timeTotalMs > 0 ? `${mins}m ${secs}s` : '—';

  const newLevelNeedsPay = levelUp && (levelAccess === 'locked' || levelAccess === 'trial');

  const { setBotState, startSpeaking, stopSpeaking } = store;
  const cancelledRef = useRef(false);
  const finishRef = useRef(null);
  finishRef.current = () => { stopSpeaking(); };

  // usePracticePlayer: single player instance
  const player = usePracticePlayer();
  const { startBgm, stopBgm, botSpeaking } = useGameAudio();
  const botSpeakingRef = useRef(botSpeaking);
  botSpeakingRef.current = botSpeaking;
  const bgmTrack = useStore((s) => s.bgmTrack);

  // addListener('ended'): kembalikan BGM + stop lip-sync (paritas PracticeScreen)
  useEffect(() => {
    if (!player?.addListener) return undefined;
    const sub = player.addListener((st) => {
      if (st?.didJustFinish || st?.error) {
        finishRef.current?.();
        botSpeakingRef.current?.(false);
        if (!levelUp) setBotState('idle');
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

      // expo-audio/web: replace source dan play (completion via addListener di atas)
      player.replace({ uri: api.botAudioUrl(id) });
      player.play();
    } catch (err) {
      console.warn('[SessionResult:playBotAudio]', id, err?.message);
      stopSpeaking();
      botSpeakingRef.current?.(false);
    }
  }, [player, startSpeaking, stopSpeaking]);

  useEffect(() => {
    cancelledRef.current = false;
    // BGM continuity: Practice stopBgm saat unmount — lanjutkan track sesi di sini
    if (bgmTrack) startBgm(bgmTrack);
    let audioId;
    const isHype = levelUp || pct >= 75;

    if (levelUp) {
      store.setBotState('level_up');
      const target = targetMsFor(level);
      if (sessionCount <= 4)       audioId = 'bot_levelup_few';
      else if (sessionCount >= 9)  audioId = 'bot_levelup_many';
      else if (pct <= 87)          audioId = 'bot_levelup_skill_weak';
      else if (avgTimeMs > target) audioId = 'bot_levelup_speed_slow';
      else                         audioId = 'bot_levelup_speed_good';
    } else if (pct >= 95) {
      store.setBotState('celebrating');
      audioId = 'bot_result_perfect';
    } else if (pct >= 75) {
      store.setBotState('celebrating');
      audioId = 'bot_result_pass';
    } else if (pct >= 50) {
      store.setBotState('speaking_calm');
      audioId = 'bot_result_medium';
    } else if (pct >= 30) {
      store.setBotState('speaking_calm');
      audioId = 'bot_result_close';
    } else {
      store.setBotState('disappointed_mild');
      audioId = 'bot_result_far';
    }

    const timer=setTimeout(()=>{ if(cancelledRef.current||!audioId) return; playBotAudio(audioId, isHype).catch(()=>{}); },600);

    return () => {
      clearTimeout(timer);
      cancelledRef.current = true;
      try { player.pause(); } catch (_) {}
      try { botSpeakingRef.current && botSpeakingRef.current(false); } catch(_){}
      stopSpeaking();
      if(!levelUp) setBotState('idle');
      try { stopBgm(); } catch(_){}
    };
  }, []);

  const heroEmoji = levelUp ? '🚀' : pct >= 80 ? '⭐' : '📊';
  const heroMsg   = levelUp
    ? `Level ${level} selesai! Kamu naik ke Level ${newLevel}!`
    : pct >= 90 ? 'Luar biasa! Akurasi sempurna 🔥'
    : pct >= 75 ? 'Bagus! Terus pertahankan 💪'
    : pct >= 50 ? 'Lumayan! Masih ada ruang berkembang 📈'
    : 'Tetap semangat! Latihan terus ya 🌱';

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={[s.inner, { paddingTop: insets.top + 24 }]}
    >
      <View style={s.botCenter}>
        <BotCharacter size={90} visemeData={store.visemeData} />
      </View>

      <View style={[s.heroCard, levelUp && s.heroCardLevelUp]}>
        <Text style={s.heroEmoji}>{heroEmoji}</Text>
        <Text style={s.heroMsg}>{heroMsg}</Text>
        {levelUp && (
          <View style={s.levelUpBadge}>
            <Text style={s.levelUpBadgeText}>NAIK LEVEL 🎉</Text>
          </View>
        )}
      </View>

      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statNum}>{pct}%</Text>
          <Text style={s.statLabel}>Akurasi</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statNum}>{correctAnswers}/{totalQuestions}</Text>
          <Text style={s.statLabel}>Benar</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statNum}>{timeStr}</Text>
          <Text style={s.statLabel}>Waktu</Text>
        </View>
      </View>

      {newLevelNeedsPay && (
        <View style={s.payBox}>
          <Text style={s.payEmoji}>🔓</Text>
          <Text style={s.payTitle}>Selamat naik ke Level {newLevel}!</Text>
          <Text style={s.payDesc}>
            Kamu mendapat 5 soal preview gratis di Level {newLevel}.{'\n'}
            Untuk akses penuh, upgrade sekarang.
          </Text>
          <TouchableOpacity
            style={s.payBtn}
            onPress={() => navigation.navigate('UpgradePaywall', { level: newLevel })}
          >
            <Text style={s.payBtnText}>🚀 Upgrade Level {newLevel} — Rp40.000</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.payBtnGhost}
            onPress={() => navigation.navigate('Main')}
          >
            <Text style={s.payBtnGhostText}>Coba 5 soal preview dulu</Text>
          </TouchableOpacity>
        </View>
      )}

      {drillSuggested && !levelUp && (
        <View style={s.drillBox}>
          <Text style={s.drillTitle}>Mau latihan kecepatan?</Text>
          <Text style={s.drillDesc}>Akurasi sudah bagus — latih kecepatan dengan mode drill.</Text>
          <TouchableOpacity
            style={s.drillBtn}
            onPress={() => navigation.navigate('Practice', { mode: 'drill', level: displayLevel })}
          >
            <Text style={s.drillBtnText}>Mulai Drill ⚡</Text>
          </TouchableOpacity>
        </View>
      )}

      {!newLevelNeedsPay && (
        <>
          <TouchableOpacity style={s.btnPrimary} onPress={() => navigation.navigate('Main')}>
            <Text style={s.btnPrimaryText}>Kembali ke Beranda</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.btnGhost}
            onPress={() => navigation.navigate('Practice', { level: displayLevel })}
          >
            <Text style={s.btnGhostText}>Lanjut Latihan →</Text>
          </TouchableOpacity>
        </>
      )}

      {newLevelNeedsPay && (
        <TouchableOpacity style={s.btnGhost} onPress={() => navigation.navigate('Main')}>
          <Text style={s.btnGhostText}>Kembali ke Beranda</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:           { flex: 1, backgroundColor: C.bg },
  inner:            { paddingHorizontal: 24, paddingBottom: 48 },
  botCenter:        { alignItems: 'center', marginBottom: 12 },
  heroCard:         { backgroundColor: C.surface, borderRadius: 24, padding: 32, alignItems: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#ffffff22' },
  heroCardLevelUp:  { borderColor: C.cyan, borderWidth: 2 },
  heroEmoji:        { fontSize: 48, marginBottom: 12 },
  heroMsg:          { color: C.text, fontSize: 18, fontWeight: 'bold', textAlign: 'center', lineHeight: 26 },
  levelUpBadge:     { marginTop: 14, backgroundColor: C.cyan, borderRadius: 20, paddingHorizontal: 18, paddingVertical: 6 },
  levelUpBadgeText: { color: C.bg, fontWeight: 'bold', fontSize: 13 },
  statsRow:         { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox:          { flex: 1, backgroundColor: C.surface, borderRadius: 16, padding: 16, alignItems: 'center' },
  statNum:          { color: C.cyan, fontSize: 22, fontWeight: 'bold', marginBottom: 4 },
  statLabel:        { color: C.muted, fontSize: 12 },
  payBox:           { backgroundColor: '#B6FF0011', borderWidth: 1.5, borderColor: C.lime, borderRadius: 20, padding: 24, marginBottom: 20, alignItems: 'center' },
  payEmoji:         { fontSize: 36, marginBottom: 8 },
  payTitle:         { color: C.lime, fontSize: 18, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  payDesc:          { color: C.muted, fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  payBtn:           { backgroundColor: C.lime, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 24, width: '100%', alignItems: 'center', marginBottom: 10 },
  payBtnText:       { color: C.bg, fontSize: 15, fontWeight: 'bold' },
  payBtnGhost:      { paddingVertical: 10, alignItems: 'center', width: '100%' },
  payBtnGhostText:  { color: C.muted, fontSize: 14 },
  drillBox:         { backgroundColor: C.surface, borderRadius: 16, padding: 20, marginBottom: 20 },
  drillTitle:       { color: C.text, fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  drillDesc:        { color: C.muted, fontSize: 14, marginBottom: 12 },
  drillBtn:         { backgroundColor: C.magenta, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  drillBtnText:     { color: C.text, fontSize: 14, fontWeight: 'bold' },
  btnPrimary:       { backgroundColor: C.cyan, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 12 },
  btnPrimaryText:   { color: C.bg, fontSize: 16, fontWeight: 'bold' },
  btnGhost:         { paddingVertical: 14, alignItems: 'center' },
  btnGhostText:     { color: C.muted, fontSize: 15 },
});
