// src/screens/RoleSelectScreen.jsx — Redesign v3 (glow logo)
import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, ActivityIndicator, StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { API_BASE } from '../services/api';

const C = {
  bg:      '#0A0A12',
  surface: '#13131F',
  card:    '#1A1A2E',
  cyan:    '#00F0FF',
  magenta: '#FF2EC4',
  text:    '#FFFFFF',
  muted:   '#888899',
  border:  '#2A2A3F',
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
  wrap:    { alignItems: 'center', marginBottom: 8 },
  wordRow: { flexDirection: 'row', alignItems: 'center' },
  letterCyan: {
    color: '#00F0FF',
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 2,
    lineHeight: 60,
    textShadowColor: '#00F0FF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 18,
  },
  letterWhite: {
    color: '#FFFFFF',
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 2,
    lineHeight: 60,
    textShadowColor: '#FFFFFF',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  sub: {
    color: C.muted,
    fontSize: 11,
    letterSpacing: 6,
    marginTop: 6,
    fontWeight: '600',
  },
});

export default function RoleSelectScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { setDemoMode } = useStore();

  const tapCount = useRef(0);
  const tapTimer = useRef(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [passcode,     setPasscode]     = useState('');
  const [loading,      setLoading]      = useState(false);

  function handleLogoTap() {
    tapCount.current += 1;
    clearTimeout(tapTimer.current);
    tapTimer.current = setTimeout(() => { tapCount.current = 0; }, 2000);
    if (tapCount.current >= 7) {
      tapCount.current = 0;
      setModalVisible(true);
    }
  }

  async function handleRedeemPasscode() {
    const code = passcode.trim();
    if (code.length !== 4 || isNaN(Number(code)))
      return Alert.alert('', 'Passcode harus 4 angka.');
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/auth/demo/redeem`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) return Alert.alert('Gagal', data.error || 'Passcode tidak valid.');
      setModalVisible(false);
      setPasscode('');
      setDemoMode('client', data.label, data.expires_at);
      navigation.replace('DemoHome');
    } catch {
      Alert.alert('Error', 'Tidak bisa terhubung ke server.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[s.container, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Logo */}
      <TouchableOpacity onPress={handleLogoTap} activeOpacity={1} style={s.logoWrap}>
        <CadasLogo />
      </TouchableOpacity>

      {/* Tagline */}
      <Text style={s.tagline}>Latihan cepat, naik level nyata.</Text>

      <View style={s.spacer} />

      {/* CTA utama */}
      <View style={s.btnGroup}>
        <TouchableOpacity
          style={s.btnPrimary}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('StudentRegister')}>
          <Text style={s.btnPrimaryText}>Daftar Akun Anak Baru</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={s.btnSecondary}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('StudentRegister', { mode: 'login' })}>
          <Text style={s.btnSecondaryText}>Masuk — Anak Sudah Punya Akun</Text>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={s.dividerRow}>
        <View style={s.dividerLine} />
        <Text style={s.dividerLabel}>portal lainnya</Text>
        <View style={s.dividerLine} />
      </View>

      {/* Portal ghost buttons */}
      <View style={s.ghostGroup}>
        <TouchableOpacity style={s.ghostBtn} onPress={() => navigation.navigate('ParentAuth')}>
          <Text style={s.ghostIcon}>👨‍👩‍👧</Text>
          <Text style={s.ghostText}>Orang Tua</Text>
        </TouchableOpacity>
        <View style={s.ghostDivider} />
        <TouchableOpacity style={s.ghostBtn} onPress={() => navigation.navigate('ReferrerLogin')}>
          <Text style={s.ghostIcon}>🏫</Text>
          <Text style={s.ghostText}>Referrer</Text>
        </TouchableOpacity>
        <View style={s.ghostDivider} />
        <TouchableOpacity style={s.ghostBtn} onPress={() => navigation.navigate('TeacherAuth')}>
          <Text style={s.ghostIcon}>👨‍🏫</Text>
          <Text style={s.ghostText}>Guru</Text>
        </TouchableOpacity>
      </View>

      {/* Modal passcode */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={m.overlay}>
          <View style={m.card}>
            <Text style={m.title}>🎮 Mode Demo</Text>
            <Text style={m.sub}>Masukkan passcode 4 digit dari admin</Text>
            <TextInput
              style={m.input}
              value={passcode}
              onChangeText={(t) => setPasscode(t.replace(/[^0-9]/g, '').slice(0, 4))}
              placeholder="0000"
              placeholderTextColor={C.muted}
              keyboardType="number-pad"
              maxLength={4}
              textAlign="center"
            />
            <TouchableOpacity
              style={[m.btn, loading && { opacity: 0.6 }]}
              onPress={handleRedeemPasscode}
              disabled={loading}>
              {loading
                ? <ActivityIndicator color={C.bg} />
                : <Text style={m.btnText}>Aktifkan Demo</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setModalVisible(false); setPasscode(''); }}>
              <Text style={m.cancel}>Batal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24 },
  logoWrap:        { alignItems: 'center', marginTop: 24 },
  tagline:         { color: C.muted, fontSize: 14, textAlign: 'center', marginTop: 12, letterSpacing: 0.5 },
  spacer:          { flex: 1 },
  btnGroup:        { gap: 12, marginBottom: 32 },
  btnPrimary:      { backgroundColor: C.cyan, borderRadius: 18, paddingVertical: 20, alignItems: 'center' },
  btnPrimaryText:  { color: C.bg, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  btnSecondary:    { backgroundColor: C.surface, borderRadius: 18, paddingVertical: 20, alignItems: 'center', borderWidth: 1.5, borderColor: C.cyan + '55' },
  btnSecondaryText:{ color: C.cyan, fontSize: 16, fontWeight: '600' },
  dividerRow:      { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  dividerLine:     { flex: 1, height: 1, backgroundColor: C.border },
  dividerLabel:    { color: C.muted, fontSize: 11, marginHorizontal: 12, letterSpacing: 1 },
  ghostGroup:      { flexDirection: 'row', backgroundColor: C.surface, borderRadius: 16, borderWidth: 1, borderColor: C.border, marginBottom: 16, overflow: 'hidden' },
  ghostBtn:        { flex: 1, paddingVertical: 16, alignItems: 'center', gap: 6 },
  ghostIcon:       { fontSize: 20 },
  ghostText:       { color: C.muted, fontSize: 12, fontWeight: '500' },
  ghostDivider:    { width: 1, backgroundColor: C.border },
});

const m = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#000000CC', justifyContent: 'center', alignItems: 'center' },
  card:    { backgroundColor: C.card, borderRadius: 24, padding: 32, width: '82%', alignItems: 'center', borderWidth: 1, borderColor: C.cyan + '44' },
  title:   { color: C.text, fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  sub:     { color: C.muted, fontSize: 13, textAlign: 'center', marginBottom: 24 },
  input:   { backgroundColor: C.bg, borderRadius: 16, borderWidth: 2, borderColor: C.cyan, color: C.text, fontSize: 36, fontWeight: 'bold', letterSpacing: 12, width: 160, paddingVertical: 16, marginBottom: 24 },
  btn:     { backgroundColor: C.cyan, borderRadius: 14, paddingVertical: 14, paddingHorizontal: 32, marginBottom: 16 },
  btnText: { color: C.bg, fontSize: 16, fontWeight: 'bold' },
  cancel:  { color: C.muted, fontSize: 14, paddingVertical: 8 },
});

