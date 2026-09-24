// src/screens/InviteParentScreen.jsx (bagian 1/2)
// A2 — Layar "Ajak Ortu" sisi anak (Pintu 2).
// QR invite + kode teks + link web + countdown 72 jam.
// Web-based: ortu TIDAK perlu install app — buka link di browser.
// Payload: https://cadasmatematika.web.id/parent/join?code=XXXXXX
import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useStore } from '../store/useStore';
import { api, API_BASE } from '../services/api';

const C = { bg: '#0A0A12', surface: '#13131F', cyan: '#00F0FF', text: '#FFF', muted: '#888899' };
const WEB_BASE = 'https://cadasmatematika.web.id';

function fmtCountdown(expiresAt) {
  if (!expiresAt) return null;
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (Number.isNaN(ms)) return null;
  if (ms <= 0) return 'kedaluwarsa';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (h >= 24) { const d = Math.floor(h / 24); return `${d} hari ${h % 24} jam lagi`; }
  if (h > 0) return `${h} jam ${m} mnt lagi`;
  return `${m} mnt lagi`;
}

export default function InviteParentScreen({ navigation }) {
  const student = useStore((st) => st.student);
  const authToken = useStore((st) => st.authToken);
  const insets = useSafeAreaInsets();
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(false);

  const joinLink = invite ? `${WEB_BASE}/parent/join?code=${invite.code}` : null;

  const handleCreate = useCallback(async () => {
    if (!student?.id) { Alert.alert('', 'Data siswa belum tersedia.'); return; }
    setLoading(true);
    try {
      const res = await api.inviteCreate({ student_id: student.id }, authToken);
      setInvite({ code: res.code, expires_at: res.expires_at });
    } catch (e) {
      Alert.alert('Gagal', e.message || 'Tidak bisa membuat kode undangan.');
    } finally {
      setLoading(false);
    }
  }, [student, authToken]);

  async function handleCopyCode() {
    if (!invite?.code) return;
    await Clipboard.setStringAsync(invite.code);
    Alert.alert('Tersalin', 'Kode undangan sudah tersalin.');
  }

  async function handleCopyLink() {
    if (!joinLink) return;
    await Clipboard.setStringAsync(joinLink);
    Alert.alert('Tersalin', 'Link join sudah tersalin.');
  }

  async function handleShare() {
    if (!joinLink) return;
    try {
      await Share.share({
        message: `Ajak Orang Tua ke Cadas Matematika\nBuka link ini di browser (tidak perlu install app):\n${joinLink}\n\nKode: ${invite.code}`,
      });
    } catch { /* dibatalkan user */ }
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={[s.inner, { paddingTop: Math.max(insets.top, 16) }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
        <Text style={s.backText}>← Kembali</Text>
      </TouchableOpacity>
      <Text style={s.title}>Ajak Orang Tua</Text>
      <Text style={s.sub}>
        Minta orang tuamu buka link di bawah lewat browser HP mereka (tidak perlu install aplikasi),
        lalu login/daftar — kode otomatis terpakai setelah mereka masuk.
      </Text>

      {!invite ? (
        <TouchableOpacity style={s.btn} onPress={handleCreate} disabled={loading}>
          {loading ? <ActivityIndicator color={C.bg} /> : <Text style={s.btnText}>Buat Kode Undangan</Text>}
        </TouchableOpacity>
      ) : (
        <>
          <View style={s.card}>
            <View style={s.qrBox}>
              <QRCode value={joinLink} size={210} backgroundColor="#FFFFFF" color="#0A0A12" />
            </View>
            <Text style={s.codeLabel}>KODE UNDANGAN</Text>
            <Text style={s.code}>{invite.code}</Text>
            <Text style={s.expiry}>Berlaku sampai: {fmtCountdown(invite.expires_at)}</Text>
          </View>
          <View style={s.linkBox}>
            <Text style={s.linkLabel}>LINK WEB (browser, tanpa install):</Text>
            <Text style={s.link} selectable>{joinLink}</Text>
          </View>

          <TouchableOpacity style={s.btn} onPress={handleCopyLink}>
            <Text style={s.btnText}>📋 Salin Link</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={handleCopyCode}>
            <Text style={s.btnGhostText}>Salin Kode Saja</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.btnGhost]} onPress={handleShare}>
            <Text style={s.btnGhostText}>📤 Bagikan via WA / lainnya</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.btn, s.btnDanger]} onPress={handleCreate} disabled={loading}>
            <Text style={s.btnDangerText}>{loading ? 'Membuat…' : '🔄 Buat Kode Baru (kode lama mati)'}</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg },
  inner: { paddingHorizontal: 24, paddingBottom: 48 },
  back: { marginBottom: 16 },
  backText: { color: C.muted, fontSize: 15 },
  title: { color: C.text, fontSize: 24, fontWeight: 'bold', marginBottom: 6 },
  sub: { color: C.muted, fontSize: 14, lineHeight: 20, marginBottom: 24 },
  card: { backgroundColor: C.surface, borderRadius: 20, padding: 24, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#00F0FF44' },
  qrBox: { backgroundColor: '#FFF', borderRadius: 16, padding: 14, marginBottom: 16 },
  codeLabel: { color: C.muted, fontSize: 11, letterSpacing: 2, marginBottom: 4 },
  code: { color: C.cyan, fontSize: 26, fontWeight: 'bold', letterSpacing: 2, marginBottom: 6 },
  expiry: { color: C.muted, fontSize: 13 },
  linkBox: { backgroundColor: C.surface, borderRadius: 12, padding: 14, marginBottom: 16 },
  linkLabel: { color: C.muted, fontSize: 11, letterSpacing: 1, marginBottom: 6 },
  link: { color: C.text, fontSize: 13, lineHeight: 18 },
  btn: { backgroundColor: C.cyan, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  btnText: { color: C.bg, fontSize: 16, fontWeight: 'bold' },
  btnGhost: { backgroundColor: C.surface, borderWidth: 1, borderColor: '#ffffff22' },
  btnGhostText: { color: C.text, fontSize: 15, fontWeight: '600' },
  btnDanger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#FF446655' },
  btnDangerText: { color: '#FF8899', fontSize: 14 },
});

// dipakai juga oleh backend test / deep-link: normalisasi kode invite
export function normalizeInviteCode(raw) {
  return String(raw || '').trim().toUpperCase();
}
export { API_BASE };
