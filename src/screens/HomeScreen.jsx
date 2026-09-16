// src/screens/HomeScreen.jsx — Redesign v3 (glow logo)
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAudioPlayer } from 'expo-audio';
import { useStore } from '../store/useStore';
import { api, API_BASE } from '../services/api';
import BotCharacter from '../components/BotCharacter';

const C = {
  bg:      '#0A0A12',
  surface: '#13131F',
  card:    '#1A1A2E',
  cyan:    '#00F0FF',
  magenta: '#FF2EC4',
  lime:    '#B6FF00',
  gold:    '#FFD700',
  text:    '#FFFFFF',
  muted:   '#888899',
  border:  '#2A2A3F',
};

const ACCESS_BADGE = {
  premium:         { label: '✨ Premium',     color: C.gold },
  basic:           { label: '📘 Basic',       color: C.cyan },
  trial:           { label: '🔓 Trial',       color: C.muted },
  trial_exhausted: { label: '🔒 Trial Habis', color: C.magenta },
  locked:          { label: '🔒 Terkunci',    color: C.magenta },
};

function CadasLogo() {
  return (
    <View style={logo.wrap}>
      <View style={logo.wordRow}>
        <Text style={logo.letterCyan}>C</Text>
        <Text style={logo.letterWhite}>A</Text>
        <Text style={logo.letterWhite}>D</Text>
        <Text style={logo.letterWhite}>A</Text>
        <Text style={logo.letterCyan}>S</Text>
      </View>
      <Text style={logo.sub}>M A T E M A T I K A</Text>
    </View>
  );
}

const logo = StyleSheet.create({
  wrap:    { alignItems: 'center' },
  wordRow: { flexDirection: 'row', alignItems: 'center' },
  letterCyan: {
    color: '#00F0FF',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 2,
    lineHeight: 48,
    textShadowColor: '#00F0FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },
  letterWhite: {
    color: '#FFFFFF',
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: 2,
    lineHeight: 48,
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  sub: {
    color: C.muted,
    fontSize: 10,
    letterSpacing: 5,
    marginTop: 4,
    fontWeight: '600',
  },
});

function StatPill({ icon, value, label, color }) {
  return (
    <View style={stat.pill}>
      <Text style={stat.icon}>{icon}</Text>
      <Text style={[stat.value, { color: color || C.cyan }]}>{value}</Text>
      <Text style={stat.label}>{label}</Text>
    </View>
  );
}

const stat = StyleSheet.create({
  pill:  { flex: 1, alignItems: 'center', paddingVertical: 14, backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border },
  icon:  { fontSize: 18, marginBottom: 4 },
  value: { fontSize: 18, fontWeight: '800', marginBottom: 2 },
  label: { color: C.muted, fontSize: 11, fontWeight: '500' },
});

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    student: storeStudent,
    currentLevel,
    streak, xp,
    getConfidenceScore,
    levelAccess,
    setLevelAccess,
    startSpeaking,
    stopSpeaking,
    visemeData,
    setBotState,
  } = useStore();

  const confidence     = getConfidenceScore();
  const fastTrackReady = confidence > 0.85;
  const pct            = Math.round(confidence * 100);
  const isLocked       = levelAccess === 'locked' || levelAccess === 'trial_exhausted';
  const accessBadge    = ACCESS_BADGE[levelAccess] || ACCESS_BADGE.trial;
  const displayName    = storeStudent?.display_name || storeStudent?.name || 'Cadas';

  React.useEffect(() => {
    if (!currentLevel) return;
    const url = storeStudent?.id
      ? `${API_BASE}/api/exercises/level-info/${currentLevel}?student_id=${storeStudent.id}`
      : `${API_BASE}/api/exercises/level-info/${currentLevel}`;
    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (!d) return;
        if (d.name) setLevelName(d.name);
        if (d.level_access) setLevelAccess(d.level_access);
      })
      .catch(() => {});
  }, [currentLevel, storeStudent?.id]);

  const accessBadge = ACCESS_BADGE[levelAccess] || ACCESS_BADGE.trial;
  const isLocked    = levelAccess === 'locked' || levelAccess === 'trial_exhausted';
  const pct         = Math.round(confidence * 100);
  const displayName = storeStudent?.display_name || storeStudent?.name || 'Cadas';

  // ── Pulse animasi tombol start ─────────────────────────────────────────────
  useEffect(() => {
    if (isLocked) return;
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.03, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1.0,  duration: 1200, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [isLocked]);

  // ── Bot welcome audio + viseme ─────────────────────────────────────────────
  const playWelcome = useCallback(async () => {
    if (welcomed) return;
    setWelcomed(true);
    try {
      const id  = welcomeAudioId(currentLevel, false);
      const url = api.botAudioUrl(id);
      // Fetch viseme
      let vData = null;
      try {
        const vRes = await fetch(api.botVisemeUrl(id));
        if (vRes.ok) vData = await vRes.json();
      } catch (_) {}
      setBotState('welcome_back');
      startSpeaking(vData, false);
      welcomePlayer.replace({ uri: url });
      await welcomePlayer.play();
    } catch (err) {
      console.warn('[HomeScreen:playWelcome]', err?.message);
      stopSpeaking();
      setBotState('idle');
    }
  }, [welcomed, currentLevel]);

  useEffect(() => {
    // Delay sedikit agar screen render dulu
    const sub = welcomePlayer.addListener((st) => {
      if (st?.didJustFinish || st?.error) {
        stopSpeaking();
        setBotState('idle');
      }
    });
    const t = setTimeout(playWelcome, 800);
    return () => {
      clearTimeout(t);
      try { welcomePlayer.pause(); } catch (_){}
      sub.remove();
      stopSpeaking();
    };
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}>

      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <CadasLogo />
        </View>
        <TouchableOpacity onPress={() => navigation.navigate('Setelan')}>
          <BotCharacter size={56} />
        </TouchableOpacity>
      </View>

      {/* Salam */}
      <View style={s.greetWrap}>
        <Text style={s.greeting}>Hai, {displayName}! 👋</Text>
        <Text style={s.greetingSub}>Siap latihan hari ini?</Text>
      </View>

      {/* Stat pills */}
      <View style={s.statRow}>
        <StatPill icon="🔥" value={streak} label="Hari Streak" color={C.magenta} />
        <View style={{ width: 10 }} />
        <StatPill icon="⚡" value={`${xp} XP`} label="XP Hari Ini" color={C.lime} />
        <View style={{ width: 10 }} />
        <StatPill icon="📊" value={`${pct}%`} label="Confidence" color={C.cyan} />
      </View>

      {/* ── LOGO ─────────────────────────────────────────────────────────── */}
      <CadasLogo />

      {/* ── HERO: Bot + Greeting ─────────────────────────────────────────── */}
      <LinearGradient
        colors={['#00F0FF18', '#FF2EC410', '#0A0A12']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={s.levelCard}>

        <View style={[s.badge, { borderColor: accessBadge.color + '88' }]}>
          <Text style={[s.badgeText, { color: accessBadge.color }]}>
            {accessBadge.label}
          </Text>
        </View>

        <Text style={s.levelNum}>Level {currentLevel}</Text>
        <Text style={s.levelName}>{levelName || 'Memuat...'}</Text>

        <View style={s.progressTrack}>
          <View style={[s.progressFill, {
            width: `${pct}%`,
            backgroundColor: pct >= 85 ? C.lime : C.cyan,
          }]} />
        </View>
        <Text style={s.progressLabel}>
          Confidence {pct}%{pct >= 85 ? ' — Fast Track siap! ⚡' : ''}
        </Text>
      </LinearGradient>

      {/* Banner upgrade */}
      {isLocked && (
        <TouchableOpacity
          style={s.upgradeBanner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('UpgradePaywall', { level: currentLevel })}>
          <Text style={s.upgradeTitle}>🔒 Trial Habis</Text>
          <Text style={s.upgradeDesc}>
            Upgrade untuk lanjut latihan di Level {currentLevel}
          </Text>
          <View style={s.upgradeBtn}>
            <Text style={s.upgradeBtnText}>Lihat Paket →</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Banner fast track */}
      {fastTrackReady && !isLocked && (
        <TouchableOpacity
          style={s.fastTrackBanner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('FastTrack', { level: currentLevel })}>
          <Text style={s.fastTrackTitle}>⚡ Fast Track Tersedia!</Text>
          <Text style={s.fastTrackDesc}>Kamu siap naik ke Level {currentLevel + 1}</Text>
        </TouchableOpacity>
      )}

      {/* Tombol mulai */}
      <TouchableOpacity
        style={[s.startBtn, isLocked && s.startBtnLocked]}
        activeOpacity={0.88}
        onPress={() => {
          if (isLocked) {
            navigation.navigate('UpgradePaywall', { level: currentLevel });
          } else {
            navigation.navigate('Practice');
          }
        }}>
        <Text style={[s.startBtnText, isLocked && { color: C.muted }]}>
          {isLocked ? '🔒 UPGRADE UNTUK LANJUT' : 'MULAI LATIHAN 🚀'}
        </Text>
      </TouchableOpacity>

      {/* Shortcut Ask Kakak */}
      {levelAccess === 'premium' && (
        <TouchableOpacity
          style={s.askKakBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('TanyaKak')}>
          <Text style={s.askKakText}>💬 Tanya Kak — AI Tutor</Text>
        </TouchableOpacity>
      )}

      {/* ── BANNER UPGRADE ───────────────────────────────────────────────── */}
      {isLocked && (
        <TouchableOpacity
          style={s.upgradeBanner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('UpgradePaywall', { level: currentLevel })}>
          <LinearGradient
            colors={['#FF2EC422', '#FF8C0011']}
            style={s.upgradeBannerInner}>
            <Text style={s.upgradeTitle}>🔒 Akses Trial Habis</Text>
            <Text style={s.upgradeDesc}>
              Upgrade untuk lanjut latihan Level {currentLevel}
            </Text>
            <View style={s.upgradeBtn}>
              <Text style={s.upgradeBtnText}>Lihat Paket →</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      )}

      {/* ── BANNER FAST TRACK ────────────────────────────────────────────── */}
      {fastTrackReady && !isLocked && (
        <TouchableOpacity
          style={s.ftBanner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('FastTrack', { level: currentLevel })}>
          <View style={s.ftLeft}>
            <Text style={s.ftTitle}>⚡ Fast Track!</Text>
            <Text style={s.ftDesc}>Siap naik ke Level {currentLevel + 1}?</Text>
          </View>
          <Text style={s.ftArrow}>→</Text>
        </TouchableOpacity>
      )}

      {/* ── TOMBOL MULAI ─────────────────────────────────────────────────── */}
      <Animated.View style={{ transform: [{ scale: isLocked ? 1 : pulseAnim }] }}>
        <TouchableOpacity
          style={[s.startBtn, isLocked && s.startBtnLocked]}
          activeOpacity={0.88}
          onPress={() => {
            if (isLocked) navigation.navigate('UpgradePaywall', { level: currentLevel });
            else navigation.navigate('Practice');
          }}>
          {isLocked ? (
            <Text style={[s.startBtnText, { color: C.muted }]}>
              🔒 UPGRADE UNTUK LANJUT
            </Text>
          ) : (
            <LinearGradient
              colors={[C.cyan, '#0090FF']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.startBtnGradient}>
              <Text style={s.startBtnText}>MULAI LATIHAN 🚀</Text>
            </LinearGradient>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* ── SHORTCUT TANYA KAK ───────────────────────────────────────────── */}
      {levelAccess === 'premium' && (
        <TouchableOpacity
          style={s.askBtn}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('TanyaKak')}>
          <Text style={s.askText}>💬  Tanya Kak Cadas — AI Tutor</Text>
        </TouchableOpacity>
      )}

    </Animated.ScrollView>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg, paddingHorizontal: 20 },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  greetWrap:       { marginBottom: 20 },
  greeting:        { color: C.text, fontSize: 20, fontWeight: '800' },
  greetingSub:     { color: C.muted, fontSize: 13, marginTop: 2 },
  statRow:         { flexDirection: 'row', marginBottom: 20 },
  levelCard:       { borderRadius: 24, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: C.cyan + '33' },
  badge:           { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4, marginBottom: 16 },
  badgeText:       { fontSize: 12, fontWeight: '700' },
  levelNum:        { color: C.cyan, fontSize: 36, fontWeight: '900', lineHeight: 40 },
  levelName:       { color: C.muted, fontSize: 14, marginTop: 4, marginBottom: 20 },
  progressTrack:   { height: 8, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden', marginBottom: 8 },
  progressFill:    { height: '100%', borderRadius: 4 },
  progressLabel:   { color: C.muted, fontSize: 12 },
  upgradeBanner:   { backgroundColor: '#FF2EC412', borderWidth: 1.5, borderColor: C.magenta + '66', borderRadius: 20, padding: 20, marginBottom: 16 },
  upgradeTitle:    { color: C.magenta, fontWeight: '800', fontSize: 15, marginBottom: 4 },
  upgradeDesc:     { color: C.muted, fontSize: 13, marginBottom: 14 },
  upgradeBtn:      { backgroundColor: C.magenta, borderRadius: 12, paddingVertical: 10, alignItems: 'center' },
  upgradeBtnText:  { color: C.bg, fontWeight: '800', fontSize: 13 },
  fastTrackBanner: { backgroundColor: C.lime + '15', borderWidth: 1.5, borderColor: C.lime + '66', borderRadius: 20, padding: 18, marginBottom: 16 },
  fastTrackTitle:  { color: C.lime, fontWeight: '800', fontSize: 14 },
  fastTrackDesc:   { color: C.muted, fontSize: 12, marginTop: 2 },
  startBtn:        { backgroundColor: C.cyan, borderRadius: 20, paddingVertical: 20, alignItems: 'center', marginBottom: 12 },
  startBtnLocked:  { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  startBtnText:    { color: C.bg, fontSize: 17, fontWeight: '900', letterSpacing: 1 },
  askKakBtn:       { backgroundColor: C.surface, borderRadius: 16, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: C.cyan + '44' },
  askKakText:      { color: C.cyan, fontSize: 14, fontWeight: '600' },
});
