// src/screens/DemoHomeScreen.jsx
// Screen utama Demo Mode: level picker 1-15, banner, timer (client), tombol mulai
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { api } from '../services/api';
import { API_BASE } from '../services/api';
import { usePracticePlayer } from '../utils/createPlayer';
// api import tidak dipakai di DemoHomeScreen — akses via useStore
import BotCharacter from '../components/BotCharacter';

const C = {
  bg: '#0A0A12', surface: '#13131F',
  cyan: '#00F0FF', magenta: '#FF2EC4', lime: '#B6FF00',
  text: '#FFFFFF', muted: '#888899',
  demo: '#FFD700',  // warna khusus demo = emas
};

// Nama level (sama dengan backend)
const LEVEL_NAMES = {
  1:  'Penjumlahan Dasar',   2: 'Pengurangan Dasar',
  3:  'Perkalian Dasar',     4: 'Pembagian Dasar',
  5:  'Campuran ×÷',        6: 'Pecahan',
  7:  'Desimal',             8: 'Persen',
  9:  'Pangkat & Akar',     10: 'Persamaan Linear',
  11: 'FPB & KPK',          12: 'Rasio & Proporsi',
  13: 'Aljabar Dasar',      14: 'Geometri Dasar',
  15: 'Statistik Dasar',
};

function formatTimeLeft(expiresAt) {
  if (!expiresAt) return null;
  const diff = Math.max(0, new Date(expiresAt) - Date.now());
  const h    = Math.floor(diff / 3600000);
  const m    = Math.floor((diff % 3600000) / 60000);
  const s    = Math.floor((diff % 60000) / 1000);
  if (diff === 0) return 'EXPIRED';
  if (h > 0) return `${h}j ${m}m`;
  return `${m}m ${s}s`;
}

export default function DemoHomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    demoKind, demoLabel, demoExpiresAt,
    demoLevel, setDemoLevel,
    startSpeaking, stopSpeaking,
    clearDemoMode, clearReferrerAuth, clearAuth,
  } = useStore();

  const [timeLeft,   setTimeLeft]   = useState('');
  const [genLoading, setGenLoading] = useState(false);
  const [genResult,  setGenResult]  = useState(null);  // { code, label, expires_at }
  const [genError,   setGenError]   = useState(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteUrl,  setInviteUrl]  = useState(null);
  const levelNames = LEVEL_NAMES;  // static — tidak perlu state

  // ── Welcome audio bot + lip-sync (paritas dengan HomeScreen) ─────────────
  const player = usePracticePlayer();

  const welcomeKey = useMemo(() => {
    const lvl = demoLevel || 1;
    if (lvl <= 3)  return 'bot_welcome_l1_l3';
    if (lvl <= 7)  return 'bot_welcome_l4_l7';
    if (lvl <= 12) return 'bot_welcome_l8_l12';
    return 'bot_welcome_l13_l15';
  }, [demoLevel]);

  const [welcomeUrl, setWelcomeUrl]   = useState(null);
  const [visemeData, setVisemeData]   = useState(null);
  const [visemeReady, setVisemeReady] = useState(false);
  const didPlayRef = useRef(false);
  const playedRef  = useRef(false);

  // Fetch URL audio + viseme JSON (sekali per mount)
  useEffect(() => {
    if (!welcomeKey || didPlayRef.current) return;
    didPlayRef.current = true;

    fetch(`${API_BASE}/api/bot-audio/${welcomeKey}`, { redirect: 'follow' })
      .then(r => { if (r.ok || r.redirected) setWelcomeUrl(r.url); })
      .catch(err => console.warn('[DemoHomeAudio] url error:', err));

    fetch(`${API_BASE}/api/bot-viseme/${welcomeKey}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const cues = data?.mouthCues || data?.cues;
        if (Array.isArray(cues) && cues.length) setVisemeData({ mouthCues: cues.filter((c) => c && typeof c.start === "number" && typeof c.end === "number") });
        else { setVisemeData(null); }
      })
      .catch(err => console.warn('[DemoHomeViseme] fetch error:', err))
      .finally(() => setVisemeReady(true));
  }, [welcomeKey]);

  // Play sekali — gate visemeReady agar tidak restart audio
  useEffect(() => {
    if (!welcomeUrl || !visemeReady || playedRef.current || !player) return;
    playedRef.current = true;

    player.replace({ uri: welcomeUrl });
    player.play();
    startSpeaking(visemeData);

    const sub = player.addListener((status) => {
      if (status?.didJustFinish || status?.error) {
        stopSpeaking();
        sub.remove();
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [welcomeUrl, visemeReady, player]);

  // Cleanup saat unmount / keluar demo
  useEffect(() => {
    return () => {
      player?.pause();
      stopSpeaking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player]);

  // ── Timer countdown (hanya untuk client passcode) ─────────────────────
  useEffect(() => {
    if (!demoExpiresAt) return;
    const tick = () => {
      const t = formatTimeLeft(demoExpiresAt);
      setTimeLeft(t);
      if (t === 'EXPIRED') doExit(); // auto-exit TANPA dialog (expiry bukan keputusan user)
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [demoExpiresAt]);

  async function handleGenPasscode(schoolLabel = '') {
    setGenLoading(true);
    setGenResult(null);
    setGenError(null);
    try {
      const token = await (await import('@react-native-async-storage/async-storage')).default.getItem('referrerToken');
      const data  = await api.demoPasscodeCreate(
        schoolLabel || demoLabel + ' — Client', 0.5, token
      );
      setGenResult(data.passcode);
    } catch (e) {
      setGenError(e?.message || 'Gagal generate passcode');
    } finally {
      setGenLoading(false);
    }
  }

  async function handleCreateInvite(targetType) {
    setInviteBusy(true);
    try {
      const token = await AsyncStorage.getItem('referrerToken');
      const data = await api.partnerInvitesCreate({ target_type: targetType, expires_hours: 72 }, token);
      setInviteUrl(data.invite_url);
      if (Platform.OS === 'web') window.navigator.clipboard?.writeText(data.invite_url);
    } catch (e) {
      setGenError(e?.message || 'Gagal membuat invite partner');
    } finally { setInviteBusy(false); }
  }


  function doExit() {
    clearDemoMode();
    clearReferrerAuth();
    clearAuth();
    AsyncStorage.multiRemove([
      'referrerToken', 'referrerProfile', 'referrerDemoExpiresAt',
      'authToken', 'authRole', 'student',
    ]).catch(() => {});
    // Kembali ke RoleSelect — App.jsx akan re-route otomatis
  }

  // Konfirmasi manual keluar.
  // FIX: Alert.alert tidak diimplementasikan react-native-web (no-op di browser),
  // sehingga tombol Keluar & auto-exit sebelumnya tidak pernah tereksekusi di WPA.
  function handleExit() {
    if (Platform.OS === 'web') {
      if (window.confirm('Keluar dari Mode Demo?')) doExit();
      return;
    }
    Alert.alert(
      'Keluar Demo',
      'Yakin ingin keluar dari Mode Demo?',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Keluar', style: 'destructive', onPress: doExit },
      ]
    );
  }

  function handleStart() {
    // Set currentLevel ke demoLevel, lalu navigate ke Practice
    // PracticeScreen akan skip saveSession karena demoMode = true
    useStore.getState().setLevel(demoLevel);
    useStore.getState().setLevelAccess('premium');
    navigation.navigate('DemoPractice');
  }

  const kindBadge = {
    admin:     '👑 Admin',
    marketing: '🎯 Marketing',
    client:    '🎭 Demo',
  }[demoKind] || '🎭 Demo';

  return (
    <ScrollView
      style={st.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: 40 }}>

      {/* Banner demo */}
      <View style={st.banner}>
        <Text style={st.bannerText}>⚡ MODE DEMO AKTIF</Text>
        <Text style={st.bannerSub}>{kindBadge} · {demoLabel}</Text>
        {demoExpiresAt && timeLeft ? (
          <Text style={[st.bannerSub, { color: timeLeft === 'EXPIRED' ? C.magenta : C.demo }]}>
            ⏱ {timeLeft} tersisa
          </Text>
        ) : null}
      </View>

      {/* Header */}
      <View style={st.header}>
        <View style={{ flex: 1 }}>
          <Text style={st.greeting}>Halo, {demoLabel}! 👋</Text>
          <Text style={st.sub}>Pilih level untuk demo presentasi</Text>
        </View>
        <BotCharacter size={60} visemeData={visemeData} />
      </View>

      {/* Level picker — grid 5x3 */}
      <Text style={st.sectionTitle}>Pilih Level</Text>
      <View style={st.grid}>
        {Array.from({ length: 15 }, (_, i) => i + 1).map((lvl) => {
          const selected = lvl === demoLevel;
          return (
            <TouchableOpacity
              key={lvl}
              style={[st.levelBtn, selected && st.levelBtnActive]}
              onPress={() => setDemoLevel(lvl)}>
              <Text style={[st.levelNum, selected && st.levelNumActive]}>{lvl}</Text>
              <Text style={[st.levelName, selected && st.levelNameActive]} numberOfLines={2}>
                {levelNames[lvl] || ''}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected level card */}
      <LinearGradient colors={['#FFD70022', '#00F0FF11']} style={st.selectedCard}>
        <Text style={st.selectedLevel}>Level {demoLevel}</Text>
        <Text style={st.selectedName}>{levelNames[demoLevel]}</Text>
        <View style={st.accessRow}>
          <View style={[st.badge, { borderColor: C.demo }]}>
            <Text style={[st.badgeText, { color: C.demo }]}>✨ Premium</Text>
          </View>
          <Text style={st.accessNote}>Semua fitur aktif</Text>
        </View>
      </LinearGradient>

      {/* CTA */}
      <TouchableOpacity style={st.startBtn} onPress={handleStart}>
        <Text style={st.startBtnText}>MULAI DEMO LEVEL {demoLevel} 🚀</Text>
      </TouchableOpacity>

       {/* Generate Passcode Client — hanya tampil untuk marketing */}
       {demoKind === 'marketing' && (
        <View style={st.passcodeSection}>
          <Text style={st.passcodeSectionTitle}>🎭 Passcode untuk Client</Text>
          <Text style={st.passcodeSectionSub}>Generate passcode 4 digit untuk client sekolah (berlaku 2 jam)</Text>

          <TouchableOpacity
            style={[st.genBtn, genLoading && { opacity: 0.6 }]}
            onPress={() => handleGenPasscode()}
            disabled={genLoading}>
            {genLoading
              ? <ActivityIndicator color={'#0A0A12'} />
              : <Text style={st.genBtnText}>⚡ Generate Passcode Baru</Text>
            }
          </TouchableOpacity>

          {genError ? (
            <Text style={st.genError}>{genError}</Text>
          ) : null}

          {genResult ? (
            <View style={st.genResultCard}>
              <Text style={st.genResultLabel}>{genResult.label || 'Demo Client'}</Text>
              <Text style={st.genResultCode}>{genResult.code}</Text>
              <Text style={st.genResultExp}>
                Berlaku hingga: {new Date(genResult.expires_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </Text>
              <Text style={st.genResultHint}>Kirim 4 digit ini ke client. Masuk via logo ⚡ (ketuk 7x)</Text>
            </View>
          ) : null}
        </View>
      )}

      {demoKind === 'marketing' && (
        <View style={st.passcodeSection}>
          <Text style={st.passcodeSectionTitle}>👥 Invite Partner</Text>
          <Text style={st.passcodeSectionSub}>Link privat untuk membuat akun guru atau referrer.</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TouchableOpacity style={[st.genBtn, inviteBusy && { opacity: 0.6 }]} onPress={() => handleCreateInvite('school')} disabled={inviteBusy}>
              <Text style={st.genBtnText}>Invite Guru</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[st.genBtn, inviteBusy && { opacity: 0.6 }]} onPress={() => handleCreateInvite('sales')} disabled={inviteBusy}>
              <Text style={st.genBtnText}>Invite Referrer</Text>
            </TouchableOpacity>
          </View>
          {inviteUrl && <Text selectable style={st.genResultHint}>{inviteUrl}</Text>}
        </View>
      )}
      {/* Keluar */}
      <TouchableOpacity style={st.exitBtn} onPress={handleExit}>
        <Text style={st.exitBtnText}>Keluar Mode Demo</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const st = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg, paddingHorizontal: 20 },
  banner:          { backgroundColor: C.demo + '22', borderWidth: 1.5, borderColor: C.demo, borderRadius: 16, padding: 14, marginBottom: 20, alignItems: 'center' },
  bannerText:      { color: C.demo, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 },
  bannerSub:       { color: C.demo + 'CC', fontSize: 13, marginTop: 4 },
  header:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  greeting:        { color: C.text, fontSize: 22, fontWeight: 'bold' },
  sub:             { color: C.muted, fontSize: 14, marginTop: 4 },
  sectionTitle:    { color: C.muted, fontSize: 13, fontWeight: '600', letterSpacing: 1, marginBottom: 12, textTransform: 'uppercase' },
  grid:            { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 24 },
  levelBtn:        { width: '18%', aspectRatio: 0.85, backgroundColor: C.surface, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#ffffff11', padding: 4 },
  levelBtnActive:  { backgroundColor: C.demo + '33', borderColor: C.demo, borderWidth: 2 },
  levelNum:        { color: C.muted, fontSize: 18, fontWeight: 'bold' },
  levelNumActive:  { color: C.demo },
  levelName:       { color: C.muted + '99', fontSize: 8, textAlign: 'center', marginTop: 2 },
  levelNameActive: { color: C.demo + 'CC' },
  selectedCard:    { borderRadius: 20, padding: 24, marginBottom: 20, borderWidth: 1, borderColor: C.demo + '44' },
  selectedLevel:   { color: C.demo, fontSize: 28, fontWeight: 'bold' },
  selectedName:    { color: C.text, fontSize: 16, marginTop: 4, marginBottom: 16 },
  accessRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge:           { borderWidth: 1, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText:       { fontSize: 12, fontWeight: '600' },
  accessNote:      { color: C.muted, fontSize: 13 },
  startBtn:        { backgroundColor: C.demo, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 16 },
  startBtnText:    { color: C.bg, fontSize: 16, fontWeight: 'bold', letterSpacing: 0.5 },
  exitBtn:         { paddingVertical: 14, alignItems: 'center' },
  exitBtnText:     { color: C.muted, fontSize: 14 },
});
