// src/screens/AdminLoginScreen.jsx
// Portal Admin (owner) — P2 / A7 (marketing.md bagian 5).
// Dua jalur masuk, keduanya menghasilkan JWT role 'admin' TTL 24 jam (A6):
//   1. Mode PIN      — dibuka dari link khusus owner (`?via=link`):
//                      PIN 4 digit -> POST /api/auth/admin/pin-login
//   2. Mode password — jalur kedua (email + password):
//                      POST /api/auth/admin/login
// Layar ini tidak punya tombol di UI publik (A1): hanya link privat owner,
// lewat parameter `?via=link` (web) atau route param `via: 'link'`.

import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet,
         ActivityIndicator, ScrollView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { api } from '../services/api';

const C = { bg: '#0A0A12', surface: '#13131F', cyan: '#00F0FF',
            text: '#FFFFFF', muted: '#888899', danger: '#FF4477' };

// Alert lintas platform (di web Alert.alert tidak memblokir / tidak tampil)
function notify(title, msg) {
  if (Platform.OS === 'web') { window.alert(msg ? `${title}\n\n${msg}` : title); return; }
  Alert.alert(title, msg);
}

// Deteksi link khusus owner: `...?via=link` (web). Native selalu false.
function readViaLink() {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  try { return window.location.search.indexOf('via=link') !== -1; } catch (_) { return false; }
}

export default function AdminLoginScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const setAdminAuth = useStore((s) => s.setAdminAuth);

  const [mode, setMode]                 = useState('password'); // 'pin' | 'password'
  const [viaLink, setViaLink]           = useState(false);      // dibuka dari link owner
  const [email, setEmail]               = useState('admin@cadasmatematika.web.id');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [pin, setPin]                   = useState('');
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');
  const pinRef = useRef(null);

  // Link owner -> mode PIN + fokus otomatis ke kolom PIN (marketing.md bagian 5).
  // Tanpa link: jalur password (default aman, PIN tidak terpampang).
  useEffect(() => {
    const fromRoute = route?.params?.via === 'link';
    const fromUrl   = readViaLink();
    if (!fromRoute && !fromUrl) return undefined;
    setViaLink(true);
    setMode('pin');
    const t = setTimeout(() => { try { pinRef.current?.focus(); } catch (_) {} }, 400);
    return () => clearTimeout(t);
  }, [route?.params?.via]);

  // Simpan sesi admin: token (24 jam) + profil ringan, lalu masuk dashboard.
  async function finishLogin(data) {
    if (!data || !data.admin_token) throw new Error('Respons login admin tidak valid.');
    await AsyncStorage.setItem('adminToken', data.admin_token);
    await AsyncStorage.setItem('adminProfile', JSON.stringify(data.profile || null));
    setAdminAuth(data.admin_token, data.profile || null);
    navigation.replace('AdminDashboard');
  }

  async function handlePinLogin(pinStr) {
    const value = String(pinStr == null ? pin : pinStr).trim();
    setError('');
    if (value.length !== 4 || Array.from(value).some((ch) => ch < '0' || ch > '9')) {
      setError('PIN harus 4 angka.');
      return;
    }
    setLoading(true);
    try {
      const data = await api.adminPinLogin(value);
      await finishLogin(data);
    } catch (e) {
      const msg = (e && e.message) || 'Tidak bisa terhubung ke server.';
      setError(msg);
      setPin('');
      notify('Login admin gagal', msg);
    } finally {
      setLoading(false);
    }
  }

  async function handlePasswordLogin() {
    setError('');
    if (!email.trim().includes('@')) { setError('Masukkan email admin yang valid.'); return; }
    if (password.length < 6)         { setError('Password minimal 6 karakter.'); return; }
    setLoading(true);
    try {
      const data = await api.adminLogin(email.trim(), password);
      await finishLogin(data);
    } catch (e) {
      const msg = (e && e.message) || 'Tidak bisa terhubung ke server.';
      setError(msg);
      notify('Login admin gagal', msg);
    } finally {
      setLoading(false);
    }
  }

  // PIN 4 digit: filter non-digit, dan auto-submit saat genap 4 angka.
  function onPinChange(text) {
    const digits = String(text || '').split('')
      .filter((ch) => ch >= '0' && ch <= '9').join('').slice(0, 4);
    setPin(digits);
    if (digits.length === 4 && !loading) handlePinLogin(digits);
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={[s.inner, { paddingTop: insets.top + 32 }]}>
      <Text style={s.badge}>ADMIN</Text>
      <Text style={s.title}>Portal Admin</Text>
      <Text style={s.sub}>
        Full access semua level (1-15) + fitur premium untuk QA.
        Sesi berlaku 24 jam, bukan mode demo.
      </Text>

      {mode === 'pin' ? (
        <>
          <Text style={s.label}>PIN 4 digit</Text>
          <TextInput
            ref={pinRef}
            style={[s.input, s.pinInput, error ? s.inputError : null]}
            value={pin}
            onChangeText={onPinChange}
            placeholder="••••"
            placeholderTextColor={C.muted}
            secureTextEntry
            keyboardType={Platform.OS === 'web' ? 'default' : 'number-pad'}
            maxLength={4}
            autoFocus={viaLink}
            onSubmitEditing={() => handlePinLogin()}
          />
          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]}
                            onPress={() => handlePinLogin()} disabled={loading}>
            {loading ? <ActivityIndicator color={C.bg} />
                     : <Text style={s.btnText}>Masuk Dashboard Admin</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={s.switchBtn} onPress={() => { setMode('password'); setError(''); }}>
            <Text style={s.switchText}>Masuk dengan email + password</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={s.label}>Email admin</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="admin@cadasmatematika.web.id"
            placeholderTextColor={C.muted}
            autoCapitalize="none"
            keyboardType="email-address"
            onSubmitEditing={handlePasswordLogin}
          />

          <Text style={s.label}>Password</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TextInput style={[s.input, { flex: 1 }]} value={password} onChangeText={setPassword}
              placeholder="password admin" placeholderTextColor={C.muted}
              secureTextEntry={!showPassword} autoCapitalize="none"
              onSubmitEditing={handlePasswordLogin} />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}
                              style={{ marginLeft: 8, padding: 8 }}>
              <Text style={{ color: C.cyan, fontSize: 16 }}>{showPassword ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={s.error}>{error}</Text> : null}

          <TouchableOpacity style={[s.btn, loading && s.btnDisabled]}
                            onPress={handlePasswordLogin} disabled={loading}>
            {loading ? <ActivityIndicator color={C.bg} />
                     : <Text style={s.btnText}>Masuk Dashboard Admin</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={s.switchBtn}
                            onPress={() => { setMode('pin'); setError(''); setPin(''); }}>
            <Text style={s.switchText}>Masuk dengan PIN 4 digit</Text>
          </TouchableOpacity>
        </>
      )}

      <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}>
        <Text style={s.backText}>Kembali</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:     { flex: 1, backgroundColor: C.bg },
  inner:      { padding: 24, paddingBottom: 48 },
  badge:      { color: C.danger, fontSize: 12, fontWeight: '900', letterSpacing: 3,
                marginBottom: 6 },
  title:      { color: C.text, fontSize: 26, fontWeight: '900', marginBottom: 8 },
  sub:        { color: C.muted, fontSize: 13, lineHeight: 19, marginBottom: 26 },
  label:      { color: C.muted, fontSize: 12, marginBottom: 6, letterSpacing: 0.5 },
  input:      { backgroundColor: C.surface, color: C.text, borderRadius: 12,
                paddingHorizontal: 14, paddingVertical: 13, fontSize: 15,
                marginBottom: 16, borderWidth: 1, borderColor: '#23233A' },
  pinInput:   { fontSize: 26, letterSpacing: 14, textAlign: 'center', paddingVertical: 16 },
  inputError: { borderColor: C.danger },
  error:      { color: C.danger, fontSize: 13, marginBottom: 12 },
  btn:        { backgroundColor: C.cyan, borderRadius: 12, paddingVertical: 15,
                alignItems: 'center', marginTop: 4 },
  btnDisabled:{ opacity: 0.6 },
  btnText:    { color: C.bg, fontSize: 15, fontWeight: '900' },
  switchBtn:  { alignItems: 'center', marginTop: 16 },
  switchText: { color: C.cyan, fontSize: 13 },
  back:       { alignItems: 'center', marginTop: 22 },
  backText:   { color: C.muted, fontSize: 14 },
});
