// src/screens/AdminDashboardScreen.jsx
// Dashboard ADMIN (owner/developer):
//   1. Ringkasan data (siswa / referrer / pembayaran) via /api/admin/*
//   2. QA Mode  — full access semua level 1-15 + premium, tanpa timer demo
//   3. Kelola passcode demo (generate 30 menit / revoke)
//   4. Keluar (logout admin)
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView,
         ActivityIndicator, TextInput, Platform, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { api } from '../services/api';

const C = { bg:'#0A0A12', surface:'#13131F', cyan:'#00F0FF',
            text:'#FFFFFF', muted:'#888899', danger:'#FF4477', good:'#22DD88' };

const LEVELS = Array.from({ length: 15 }, (_, i) => i + 1);

function confirmWeb(title, msg) {
  if (Platform.OS === 'web') return window.confirm(msg ? `${title}\n\n${msg}` : title);
  return new Promise((resolve) => {
    Alert.alert(title, msg, [
      { text: 'Batal', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Lanjut', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}

export default function AdminDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const {
    adminToken, adminProfile, adminQaMode, setAdminQaMode,
    setLevel, setLevelAccess, clearAdminAuth,
  } = useStore();

  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [qaLevel,   setQaLevel]   = useState(1);
  const [passcodes, setPasscodes] = useState([]);
  const [pcLoading, setPcLoading] = useState(false);
  const [pcLabel,   setPcLabel]   = useState('');

  async function loadStats() {
    setLoading(true);
    try {
      const [students, referrers, payments] = await Promise.all([
        api.adminStudents(adminToken).catch(() => null),
        api.adminReferrers(adminToken).catch(() => null),
        api.adminPayments(adminToken).catch(() => null),
      ]);
      setStats({
        students:  students?.students?.length  ?? students?.total  ?? 0,
        referrers: referrers?.referrers?.length ?? referrers?.total ?? 0,
        payments:  payments?.payments?.length   ?? payments?.total  ?? 0,
      });
    } finally {
      setLoading(false);
    }
  }

  async function loadPasscodes() {
    setPcLoading(true);
    try {
      const d = await api.demoPasscodeList(adminToken);
      setPasscodes(d.passcodes || []);
    } catch (_) { setPasscodes([]); }
    finally { setPcLoading(false); }
  }

  useEffect(() => { loadStats(); loadPasscodes(); }, []);

  // QA Mode: full access semua level (premium, tanpa timer, tanpa simpan sesi)
  function startQa(level) {
    setLevel(level);
    setLevelAccess('premium');
    setAdminQaMode(true);
    navigation.navigate('AdminPractice');
  }

  async function handleLogout() {
    const ok = await confirmWeb('Keluar dari Portal Admin?', 'Sesi admin akan diakhiri.');
    if (!ok) return;
    await AsyncStorage.multiRemove(['adminToken', 'adminProfile']);
    clearAdminAuth();
    setAdminQaMode(false);
  }

  async function handleCreatePasscode() {
    setPcLoading(true);
    try {
      await api.demoPasscodeCreate(pcLabel.trim() || 'Demo 30 menit', 0.5, adminToken);
      setPcLabel('');
      await loadPasscodes();
    } catch (e) {
      Alert.alert('Gagal', e?.message || 'Tidak bisa membuat passcode.');
    } finally { setPcLoading(false); }
  }

  async function handleRevokePasscode(id) {
    const ok = await confirmWeb('Revoke passcode ini?', 'Passcode tidak bisa dipakai lagi.');
    if (!ok) return;
    setPcLoading(true);
    try {
      await api.demoPasscodeRevoke(id, adminToken);
      await loadPasscodes();
    } catch (e) {
      Alert.alert('Gagal', e?.message || 'Tidak bisa revoke passcode.');
    } finally { setPcLoading(false); }
  }

  const email = adminProfile?.email || 'admin';
  return (
    <ScrollView style={s.scroll}
                contentContainerStyle={[s.inner, { paddingTop: insets.top + 20 }]}>
      {/* Header */}
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={s.badge}>ADMIN</Text>
          <Text style={s.title}>Dashboard Admin</Text>
          <Text style={s.sub}>{email}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={s.logout}>Keluar</Text>
        </TouchableOpacity>
      </View>

      {/* Ringkasan */}
      <Text style={s.section}>Ringkasan</Text>
      {loading ? (
        <ActivityIndicator color={C.cyan} style={{ marginVertical: 16 }} />
      ) : (
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statValue}>{stats?.students ?? '-'}</Text>
            <Text style={s.statLabel}>Siswa</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{stats?.referrers ?? '-'}</Text>
            <Text style={s.statLabel}>Referrer</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statValue}>{stats?.payments ?? '-'}</Text>
            <Text style={s.statLabel}>Pembayaran</Text>
          </View>
        </View>
      )}

      {/* QA Mode */}
      <Text style={s.section}>QA Mode - Full Access</Text>
      <View style={s.card}>
        <Text style={s.cardNote}>
          Akses premium semua level 1-15 tanpa paywall dan tanpa timer demo.
          Sesi latihan QA tidak disimpan ke database (data produksi aman).
        </Text>
        <Text style={[s.cardNote, { color: adminQaMode ? C.good : C.muted }]}>
          {adminQaMode ? 'QA Mode AKTIF (premium)' : 'QA Mode nonaktif'}
        </Text>

        <View style={s.levelGrid}>
          {LEVELS.map((l) => (
            <TouchableOpacity
              key={l}
              style={[s.levelChip, qaLevel === l && s.levelChipActive]}
              onPress={() => setQaLevel(l)}>
              <Text style={[s.levelText, qaLevel === l && s.levelTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={s.btnPrimary} onPress={() => startQa(qaLevel)}>
          <Text style={s.btnPrimaryText}>Mulai Latihan Level {qaLevel} (Full Access)</Text>
        </TouchableOpacity>
      </View>

      {/* Passcode demo */}
      <Text style={s.section}>Passcode Demo (30 menit)</Text>
      <View style={s.card}>
        <TextInput
          style={s.input}
          value={pcLabel}
          onChangeText={setPcLabel}
          placeholder="Label sekolah / client (opsional)"
          placeholderTextColor={C.muted}
        />
        <TouchableOpacity style={s.btnPrimary} onPress={handleCreatePasscode}
                          disabled={pcLoading}>
          {pcLoading ? <ActivityIndicator color={C.bg} />
                     : <Text style={s.btnPrimaryText}>Generate Passcode 30 Menit</Text>}
        </TouchableOpacity>

        {passcodes.length === 0 ? (
          <Text style={[s.cardNote, { marginTop: 12 }]}>Belum ada passcode.</Text>
        ) : passcodes.map((p) => {
          const expired = new Date(p.expires_at).getTime() < Date.now();
          const dead    = !p.is_active || expired;
          return (
            <View key={p.id} style={s.pcRow}>
              <View style={{ flex: 1 }}>
                <Text style={[s.pcCode, dead && { color: C.muted }]}>{p.code}</Text>
                <Text style={s.pcMeta}>
                  {p.label || 'Demo'} - {new Date(p.expires_at).toLocaleString()}
                  {p.redeemed_at ? ' - sudah dipakai' : ''}
                </Text>
              </View>
              {!dead && (
                <TouchableOpacity onPress={() => handleRevokePasscode(p.id)}>
                  <Text style={s.pcRevoke}>Revoke</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })}
      </View>

      <TouchableOpacity style={s.btnGhost} onPress={() => navigation.goBack()}>
        <Text style={s.btnGhostText}>Kembali</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  scroll:      { flex: 1, backgroundColor: C.bg },
  inner:       { padding: 20, paddingBottom: 48 },
  header:      { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 18 },
  badge:       { color: C.danger, fontSize: 11, fontWeight: '900', letterSpacing: 3 },
  title:       { color: C.text, fontSize: 22, fontWeight: '900', marginTop: 2 },
  sub:         { color: C.muted, fontSize: 13, marginTop: 3 },
  logout:      { color: C.danger, fontSize: 14, paddingTop: 6 },
  section:     { color: C.cyan, fontSize: 12, fontWeight: '800',
                 letterSpacing: 1.5, marginTop: 18, marginBottom: 8 },
  statsRow:    { flexDirection: 'row', gap: 10 },
  statCard:    { flex: 1, backgroundColor: C.surface, borderRadius: 14,
                 paddingVertical: 14, alignItems: 'center' },
  statValue:   { color: C.text, fontSize: 20, fontWeight: '900' },
  statLabel:   { color: C.muted, fontSize: 11, marginTop: 3 },
  card:        { backgroundColor: C.surface, borderRadius: 16, padding: 16 },
  cardNote:    { color: C.muted, fontSize: 12, lineHeight: 18, marginBottom: 6 },
  levelGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 },
  levelChip:   { width: 40, height: 40, borderRadius: 10, alignItems: 'center',
                 justifyContent: 'center', backgroundColor: '#1B1B2B',
                 borderWidth: 1, borderColor: '#23233A' },
  levelChipActive: { backgroundColor: C.cyan, borderColor: C.cyan },
  levelText:   { color: C.muted, fontSize: 14, fontWeight: '700' },
  levelTextActive: { color: C.bg },
  btnPrimary:  { backgroundColor: C.cyan, borderRadius: 12, paddingVertical: 14,
                 alignItems: 'center', marginTop: 6 },
  btnPrimaryText: { color: C.bg, fontSize: 14, fontWeight: '900' },
  input:       { backgroundColor: '#0F0F1A', color: C.text, borderRadius: 10,
                 paddingHorizontal: 12, paddingVertical: 11, fontSize: 14,
                 borderWidth: 1, borderColor: '#23233A', marginBottom: 10 },
  pcRow:       { flexDirection: 'row', alignItems: 'center', marginTop: 12,
                 borderTopWidth: 1, borderTopColor: '#23233A', paddingTop: 12 },
  pcCode:      { color: C.text, fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  pcMeta:      { color: C.muted, fontSize: 11, marginTop: 2 },
  pcRevoke:    { color: C.danger, fontSize: 13 },
  btnGhost:    { alignItems: 'center', marginTop: 24 },
  btnGhostText:{ color: C.muted, fontSize: 14 },
});
