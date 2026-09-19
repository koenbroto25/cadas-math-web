// src/screens/AdminLoginScreen.jsx
// Login ADMIN (owner/developer) — bukan demo, bukan passcode.
// Token dari /api/auth/admin/login (role admin, TTL 8 jam) memberi full access
// semua level 1-15 + fitur premium untuk keperluan QA.
/* global window */
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet,
         ActivityIndicator, ScrollView, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { api } from '../services/api';

const C = { bg:'#0A0A12', surface:'#13131F', cyan:'#00F0FF',
            text:'#FFFFFF', muted:'#888899', danger:'#FF4477' };

function notify(title, msg) {
  if (Platform.OS === 'web') { window.alert(msg ? `${title}\n\n${msg}` : title); return; }
  Alert.alert(title, msg);
}

export default function AdminLoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { setAdminAuth } = useStore();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleLogin() {
    setError('');
    if (!email.trim().includes('@')) { setError('Masukkan email admin yang valid.'); return; }
    if (password.length < 6)         { setError('Password minimal 6 karakter.'); return; }
    setLoading(true);
    try {
      const data = await api.adminLogin(email.trim(), password);
      await AsyncStorage.setItem('adminToken',   data.admin_token);
      await AsyncStorage.setItem('adminProfile', JSON.stringify(data.profile));
      setAdminAuth(data.admin_token, data.profile);
      navigation.replace('AdminDashboard');
    } catch (e) {
      const msg = e?.message || 'Tidak bisa terhubung ke server.';
      setError(msg);
      notify('Login admin gagal', msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={[s.inner, { paddingTop: insets.top + 32 }]}>
      <Text style={s.badge}>ADMIN</Text>
      <Text style={s.title}>Portal Admin</Text>
      <Text style={s.sub}>
        Full access semua level (1-15) + fitur premium untuk QA.
        Sesi berlaku 8 jam, bukan mode demo.
      </Text>

      <Text style={s.label}>Email admin</Text>
      <TextInput
        style={s.input}
        value={email}
        onChangeText={setEmail}
        placeholder="admin@cadasmatematika.web.id"
        placeholderTextColor={C.muted}
        autoCapitalize="none"
        keyboardType="email-address"
        onSubmitEditing={handleLogin}
      />

      <Text style={s.label}>Password</Text>
      <TextInput
        style={s.input}
        value={password}
        onChangeText={setPassword}
        placeholder="password admin"
        placeholderTextColor={C.muted}
        secureTextEntry
        autoCapitalize="none"
        onSubmitEditing={handleLogin}
      />

      {error ? <Text style={s.error}>{error}</Text> : null}

      <TouchableOpacity style={[s.btn, loading && s.btnDisabled]}
                        onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color={C.bg} />
                 : <Text style={s.btnText}>Masuk Dashboard Admin</Text>}
      </TouchableOpacity>

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
  error:      { color: C.danger, fontSize: 13, marginBottom: 12 },
  btn:        { backgroundColor: C.cyan, borderRadius: 12, paddingVertical: 15,
                alignItems: 'center', marginTop: 4 },
  btnDisabled:{ opacity: 0.6 },
  btnText:    { color: C.bg, fontSize: 15, fontWeight: '900' },
  back:       { alignItems: 'center', marginTop: 22 },
  backText:   { color: C.muted, fontSize: 14 },
});