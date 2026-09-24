/** M7: redeem a one-time Head Marketing preview ID. */
import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { api } from '../services/api';

const C = { bg: '#0A0A12', surface: '#13131F', cyan: '#00F0FF', text: '#FFFFFF', muted: '#888899', danger: '#FF6B6B' };

export default function TestAccountRedeemScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const setDemoMode = useStore((s) => s.setDemoMode);
  const [code, setCode] = useState(String(route?.params?.code || '').toUpperCase());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (route?.params?.code) redeem(route.params.code); }, [route?.params?.code]);

  async function redeem(value = code) {
    const clean = String(value || '').trim().toUpperCase();
    if (!/^TEST-[A-Z0-9]{6}$/.test(clean)) { setError('Format harus TEST-XXXXXX.'); return; }
    setBusy(true); setError('');
    try {
      const result = await api.testAccountRedeem(clean);
      setDemoMode('marketing_test', result.label || 'Preview Cadas', result.expires_at);
      navigation.replace('DemoHome');
    } catch (e) { setError(e.message || 'Test ID tidak dapat digunakan.'); }
    finally { setBusy(false); }
  }

  return (
    <ScrollView style={s.bg} contentContainerStyle={[s.inner, { paddingTop: insets.top + 36 }]}>
      <Text style={s.title}>Preview ID Head Marketing</Text>
      <Text style={s.sub}>Masukkan kode TEST-XXXXXX dari Head Marketing. Akses preview berlaku 30 menit dan tidak disimpan ke data siswa.</Text>
      <TextInput value={code} onChangeText={(v) => setCode(v.toUpperCase())} placeholder="TEST-XXXXXX" placeholderTextColor={C.muted} autoCapitalize="characters" style={s.input} maxLength={11} />
      {!!error && <Text style={s.error}>{error}</Text>}
      <TouchableOpacity style={[s.btn, busy && { opacity: 0.6 }]} onPress={() => redeem()} disabled={busy}>
        {busy ? <ActivityIndicator color={C.bg} /> : <Text style={s.btnText}>Aktifkan Preview</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>Kembali</Text></TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: C.bg }, inner: { padding: 24 }, title: { color: C.text, fontSize: 22, fontWeight: '900' }, sub: { color: C.muted, fontSize: 13, lineHeight: 20, marginTop: 10, marginBottom: 20 }, input: { backgroundColor: C.surface, color: C.text, borderRadius: 12, padding: 15, fontSize: 18, letterSpacing: 2, textAlign: 'center', borderWidth: 1, borderColor: '#2A2A3F' }, error: { color: C.danger, fontSize: 13, marginTop: 10 }, btn: { backgroundColor: C.cyan, borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 18 }, btnText: { color: C.bg, fontSize: 15, fontWeight: '900' }, back: { color: C.muted, textAlign: 'center', marginTop: 20 },
});
