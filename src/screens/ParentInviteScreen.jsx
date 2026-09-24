// src/screens/ParentInviteScreen.jsx
// A2 — Parent-first: parent membuat link QR untuk anak.
import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView, Share } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { useStore } from '../store/useStore';
import { api } from '../services/api';

const C = { bg: '#0A0A12', surface: '#13131F', cyan: '#00F0FF', text: '#FFFFFF', muted: '#888899' };
const WEB_BASE = 'https://cadasmatematika.web.id';

function countdown(expiresAt) {
  if (!expiresAt) return 'berlaku 72 jam';
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (!Number.isFinite(ms)) return 'berlaku 72 jam';
  if (ms <= 0) return 'kode sudah kedaluwarsa';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h} jam ${m} menit lagi` : `${m} menit lagi`;
}

export default function ParentInviteScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const parentToken = useStore((s) => s.parentToken);
  const parentProfile = useStore((s) => s.parentProfile);
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(false);
  const joinLink = invite ? `${WEB_BASE}/parent/join?code=${invite.code}` : null;

  const createInvite = useCallback(async () => {
    if (!parentToken) {
      Alert.alert('Sesi orang tua tidak ditemukan', 'Silakan masuk kembali.');
      return;
    }
    setLoading(true);
    try {
      const result = await api.inviteCreate({}, parentToken);
      setInvite({ code: result.code, expires_at: result.expires_at });
    } catch (error) {
      Alert.alert('Gagal membuat link', error.message || 'Coba lagi.');
    } finally {
      setLoading(false);
    }
  }, [parentToken]);

  const copy = async (value, label) => {
    await Clipboard.setStringAsync(value);
    Alert.alert('Tersalin', `${label} sudah disalin.`);
  };

  const share = async () => {
    if (!joinLink) return;
    try {
      await Share.share({ message: `Buka link ini di browser untuk mendaftar anak:\n${joinLink}\n\nKode: ${invite.code}` });
    } catch (_) { /* dibatalkan */ }
  };

  return (
    <ScrollView style={s.scroll} contentContainerStyle={[s.inner, { paddingTop: Math.max(insets.top, 16) }]}>
      <TouchableOpacity onPress={() => navigation.goBack()}><Text style={s.back}>← Kembali</Text></TouchableOpacity>
      <Text style={s.title}>Kirim Link ke Anak</Text>
      <Text style={s.sub}>Anak membuka link lewat browser tanpa memasang aplikasi, lalu daftar atau masuk sebagai siswa dan kode tersambung otomatis.</Text>
      {!invite ? (
        <TouchableOpacity style={s.primary} onPress={createInvite} disabled={loading}>
          {loading ? <ActivityIndicator color={C.bg} /> : <Text style={s.primaryText}>Buat Link Anak</Text>}
        </TouchableOpacity>
      ) : (
        <>
          <View style={s.card}>
            <View style={s.qrBox}><QRCode value={joinLink} size={220} backgroundColor="#FFFFFF" color={C.bg} /></View>
            <Text style={s.codeLabel}>KODE</Text><Text style={s.code}>{invite.code}</Text>
            <Text style={s.expiry}>{countdown(invite.expires_at)}</Text>
          </View>
          <View style={s.linkBox}><Text style={s.linkLabel}>LINK WEB</Text><Text style={s.link} selectable>{joinLink}</Text></View>
          <TouchableOpacity style={s.primary} onPress={() => copy(joinLink, 'Link anak')}><Text style={s.primaryText}>Salin Link</Text></TouchableOpacity>
          <TouchableOpacity style={s.secondary} onPress={() => copy(invite.code, 'Kode')}><Text style={s.secondaryText}>Salin Kode</Text></TouchableOpacity>
          <TouchableOpacity style={s.secondary} onPress={share}><Text style={s.secondaryText}>Bagikan via WhatsApp / lainnya</Text></TouchableOpacity>
          <TouchableOpacity style={s.secondary} onPress={createInvite} disabled={loading}><Text style={s.secondaryText}>{loading ? 'Membuat…' : 'Buat link baru (link lama tidak berlaku)'}</Text></TouchableOpacity>
        </>
      )}
      {parentProfile?.display_name && <Text style={s.account}>Dibuat untuk akun: {parentProfile.display_name}</Text>}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg }, inner: { paddingHorizontal: 24, paddingBottom: 48 },
  back: { color: C.muted, fontSize: 15, marginBottom: 18 }, title: { color: C.text, fontSize: 25, fontWeight: '800', marginBottom: 8 },
  sub: { color: C.muted, fontSize: 14, lineHeight: 21, marginBottom: 24 },
  primary: { backgroundColor: C.cyan, borderRadius: 16, paddingVertical: 17, alignItems: 'center', marginBottom: 10 },
  primaryText: { color: C.bg, fontSize: 16, fontWeight: '800' },
  secondary: { backgroundColor: C.surface, borderWidth: 1, borderColor: '#ffffff22', borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  secondaryText: { color: C.text, fontSize: 15, fontWeight: '600' },
  card: { backgroundColor: C.surface, borderRadius: 20, padding: 22, alignItems: 'center', marginBottom: 14, borderWidth: 1, borderColor: '#00F0FF44' },
  qrBox: { backgroundColor: '#FFF', borderRadius: 14, padding: 12, marginBottom: 14 },
  codeLabel: { color: C.muted, fontSize: 11, letterSpacing: 2, marginBottom: 3 }, code: { color: C.cyan, fontSize: 25, fontWeight: '800', letterSpacing: 2, marginBottom: 4 }, expiry: { color: C.muted, fontSize: 13 },
  linkBox: { backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 14 }, linkLabel: { color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 5 }, link: { color: C.text, fontSize: 13, lineHeight: 18 }, account: { color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 8 },
});
