// src/screens/ParentDashboardScreen.jsx - Sprint E.4 + Sprint I (payment notification)
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet,
         ActivityIndicator, Alert, RefreshControl, Modal,
         TextInput, ScrollView } from 'react-native';
import { useStore } from '../store/useStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE, api } from '../services/api';

const C = {
  bg:'#0A0A12', surface:'#13131F', cyan:'#00F0FF', text:'#FFFFFF',
  muted:'#888899', green:'#00FF9D', yellow:'#FFD700',
  magenta:'#FF2EC4', lime:'#B6FF00',
};

function LevelBadge({ label, value, color }) {
  return (
    <View style={s.badge}>
      <Text style={[s.badgeVal, color && { color }]}>{value ?? '-'}</Text>
      <Text style={s.badgeLabel}>{label}</Text>
    </View>
  );
}

// Cek apakah siswa perlu bayar level saat ini
// paid_basic_up_to_level < current_level = belum bayar level ini
function needsPayment(child) {
  const paid = child.paid_basic_up_to_level ?? 0;
  const level = child.current_level ?? 1;
  return paid < level;
}

export default function ParentDashboardScreen({ navigation }) {
  const { clearParentAuth } = useStore();
  const insets = useSafeAreaInsets();
  const [children,   setChildren]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [parentName, setParentName] = useState('');
  // ── Auth Baru: Tambah Anak + Merge Akun ────────────────────────────────────
  const [showAdd,     setShowAdd]     = useState(false);
  const [newChildId,  setNewChildId]  = useState('');
  const [showMerge,   setShowMerge]   = useState(false);
  const [mergeEmail,  setMergeEmail]  = useState('');
  const [mergePass,   setMergePass]   = useState('');
  const [busy,        setBusy]        = useState(false);

  // -- Jadwal belajar --------------------------------------------------------
  const [showJadwal,   setShowJadwal]   = useState(false);
  const [jadwalStudent, setJadwalStudent] = useState(null);
  const [jadwalDays,   setJadwalDays]   = useState([1,2,3,4,5]);
  const [jadwalStart,  setJadwalStart]  = useState('16:00');
  const [jadwalEnd,    setJadwalEnd]    = useState('17:00');
  const [jadwalBusy,   setJadwalBusy]   = useState(false);

  const HARI = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

  async function openJadwal(student) {
    setJadwalStudent(student);
    setJadwalDays([1,2,3,4,5]);
    setJadwalStart('16:00');
    setJadwalEnd('17:00');
    try {
      const token = await AsyncStorage.getItem('parentToken');
      const data  = await api.scheduleGet(student.id, token);
      if (data.schedule) {
        setJadwalDays(data.schedule.days || [1,2,3,4,5]);
        setJadwalStart(String(data.schedule.start_time).slice(0,5) || '16:00');
        setJadwalEnd(String(data.schedule.end_time).slice(0,5)   || '17:00');
      }
    } catch (_) {}
    setShowJadwal(true);
  }

  function toggleDay(d) {
    setJadwalDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d].sort()
    );
  }

  async function saveJadwal() {
    if (jadwalDays.length === 0) return Alert.alert('', 'Pilih minimal 1 hari.');
    if (!jadwalStart.match(/^\d{2}:\d{2}$/)) return Alert.alert('', 'Format jam: HH:MM');
    if (!jadwalEnd.match(/^\d{2}:\d{2}$/))   return Alert.alert('', 'Format jam: HH:MM');
    setJadwalBusy(true);
    try {
      const token = await AsyncStorage.getItem('parentToken');
      await api.scheduleSet({
        student_id: jadwalStudent.id,
        days:       jadwalDays,
        start_time: jadwalStart,
        end_time:   jadwalEnd,
        timezone:   'Asia/Jakarta',
        active:     true,
      }, token);
      setShowJadwal(false);
      Alert.alert('Berhasil', 'Jadwal belajar disimpan.');
    } catch (e) {
      Alert.alert('Gagal', e?.message || 'Coba lagi.');
    } finally { setJadwalBusy(false); }
  }

  async function load(isRefresh = false) {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const token = await AsyncStorage.getItem('parentToken');
      const raw   = await AsyncStorage.getItem('parent');
      if (raw) setParentName(JSON.parse(raw).display_name || '');

      const res  = await fetch(`${API_BASE}/api/parent/children`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) {
        await AsyncStorage.multiRemove(['parentToken','parent']);
        navigation.replace('RoleSelect');
        return;
      }
      const data = await res.json();
      setChildren(data.children || []);
    } catch { Alert.alert('Error', 'Gagal memuat data anak.'); }
    finally  { isRefresh ? setRefreshing(false) : setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleLogout() {
    await AsyncStorage.multiRemove(['parentToken','parent','parentLinkedChildren']);
    clearParentAuth();
  }

  // ── Tambah Anak (add-child via display_id) ────────────────────────────────
  async function handleAddChild() {
    const did = newChildId.trim().toUpperCase();
    if (did.length !== 4) return Alert.alert('', 'ID anak 4 karakter, contoh: B7KM.');
    setBusy(true);
    try {
      const token = await AsyncStorage.getItem('parentToken');
      const res  = await fetch(`${API_BASE}/api/auth/parent/add-child`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ child_id: did }),
      });
      const data = await res.json();
      if (!res.ok) return Alert.alert('Gagal', data.error || 'Coba lagi.');
      setShowAdd(false); setNewChildId('');
      await AsyncStorage.setItem('parentLinkedChildren', JSON.stringify(data.linked_children || []));
      await load(true);
      Alert.alert('Berhasil', 'Anak berhasil terhubung ke akun Anda.');
    } catch { Alert.alert('Error', 'Tidak bisa terhubung ke server.'); }
    finally { setBusy(false); }
  }

  // ── Gabung Akun Lama (merge-account, D3) ──────────────────────────────────
  async function handleMergeAccount() {
    if (!mergeEmail.trim().includes('@')) return Alert.alert('', 'Email akun lama tidak valid.');
    if (!mergePass)                       return Alert.alert('', 'Masukkan password akun lama.');
    setBusy(true);
    try {
      const token = await AsyncStorage.getItem('parentToken');
      const res  = await fetch(`${API_BASE}/api/auth/parent/merge-account`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body:    JSON.stringify({ source_email: mergeEmail.trim(), password: mergePass }),
      });
      const data = await res.json();
      if (!res.ok) return Alert.alert('Gagal', data.error || 'Coba lagi.');
      setShowMerge(false); setMergeEmail(''); setMergePass('');
      await AsyncStorage.setItem('parentLinkedChildren', JSON.stringify(data.linked_children || []));
      await load(true);
      Alert.alert('Berhasil', 'Semua anak dari akun lama sudah dipindah ke akun ini.');
    } catch { Alert.alert('Error', 'Tidak bisa terhubung ke server.'); }
    finally { setBusy(false); }
  }

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'short' })
    : 'Belum latihan';

  const akurasi = (c) => c.total_soal
    ? Math.round((c.total_benar / c.total_soal) * 100) + '%'
    : '-';

  // Hitung jumlah anak yang perlu pembayaran (untuk header summary)
  const paymentNeededCount = children.filter(needsPayment).length;

  function renderChild({ item }) {
    const perluBayar = needsPayment(item);

    return (
      <TouchableOpacity
        style={[s.card, perluBayar && s.cardNeedsPay]}
        onPress={() => navigation.navigate('ChildProgress', { student: item })}>

        {/* Header kartu */}
        <View style={s.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={s.childName}>{item.display_name}</Text>
            <Text style={s.childSub}>Kelas {item.grade_level || '?'} · @{item.username}</Text>
          </View>
          {/* Badge perlu bayar */}
          {perluBayar && (
            <View style={s.payBadge}>
              <Text style={s.payBadgeText}>🔓 Perlu Bayar</Text>
            </View>
          )}
          {!perluBayar && <Text style={s.arrow}>›</Text>}
        </View>

        {/* Stats badges */}
        <View style={s.badgeRow}>
          <LevelBadge label="Level" value={item.current_level} color={C.cyan} />
          <LevelBadge label="Sesi" value={item.total_sessions} />
          <LevelBadge label="Akurasi" value={akurasi(item)} color={C.green} />
          <LevelBadge label="Terakhir" value={fmtDate(item.last_session_at)} />
        </View>

        {/* Banner payment notification */}
        {perluBayar && (
          <View style={s.payBanner}>
            <Text style={s.payBannerTitle}>
              Level {item.current_level} belum dibayar
            </Text>
            <Text style={s.payBannerDesc}>
              {item.display_name.split(' ')[0]} sudah naik ke Level {item.current_level} 🎉{'\n'}
              Bayar sekarang agar bisa latihan penuh di level ini.
            </Text>
            <TouchableOpacity
              style={s.payBtn}
              onPress={() => navigation.navigate('ChildBilling', { student: item })}>
              <Text style={s.payBtnText}>Lihat Opsi Pembayaran →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer links */}
        <View style={s.cardFooter}>
          <TouchableOpacity onPress={() => navigation.navigate('ChildProgress', { student: item })}>
            <Text style={s.linkText}>Progress</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ChildSessions', { student: item })}>
            <Text style={s.linkText}>Riwayat</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ChildBilling', { student: item })}>
            <Text style={[s.linkText, perluBayar && { color: C.magenta }]}>
              {perluBayar ? '💳 Bayar Sekarang' : 'Billing'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openJadwal(item)}>
            <Text style={s.linkText}>Jadwal</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.navigate('ChildWeeklySummary', { student: item })}>
            <Text style={s.linkText}>Mingguan</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Halo, {parentName.split(' ')[0] || 'Orang Tua'} 👋</Text>
          <Text style={s.sub}>{children.length} anak terdaftar</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <TouchableOpacity style={s.addBtn} onPress={() => setShowAdd(true)}>
            <Text style={s.addBtnText}>+ Tambah Anak</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.inviteBtn} onPress={() => navigation.navigate('ParentInvite')}>
            <Text style={s.inviteBtnText}>Kirim Link ke Anak</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.inviteBtn} onPress={() => navigation.navigate('UpgradePaywall')}>
            <Text style={s.inviteBtnText}>Beli Paket QRIS</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={s.logout}>Keluar</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Banner summary jika ada anak yang perlu bayar */}
      {!loading && paymentNeededCount > 0 && (
        <View style={s.summaryBanner}>
          <Text style={s.summaryBannerText}>
            🔔 {paymentNeededCount} anak perlu pembayaran level baru
          </Text>
        </View>
      )}

      {loading
        ? <ActivityIndicator color={C.cyan} size="large" style={{ marginTop: 60 }} />
        : <FlatList
            data={children}
            keyExtractor={i => i.id}
            renderItem={renderChild}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => load(true)}
                tintColor={C.cyan}
              />
            }
            ListFooterComponent={
              children.length > 0 ? (
                <TouchableOpacity style={s.mergeLink} onPress={() => setShowMerge(true)}>
                  <Text style={s.mergeLinkText}>Punya akun lama? Gabungkan di sini</Text>
                </TouchableOpacity>
              ) : null
            }
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyText}>Belum ada anak yang terhubung.</Text>
                <TouchableOpacity style={s.emptyAddBtn} onPress={() => setShowAdd(true)}>
                  <Text style={s.addBtnText}>+ Hubungkan Anak Pertama</Text>
                </TouchableOpacity>
                <Text style={s.emptyHint}>Masukkan ID anak dari kartu identitasnya.</Text>
              </View>
            }
          />
      }

      {/* ── Modal Tambah Anak ──────────────────────────────────────────────── */}
      <Modal visible={showAdd} animationType="slide" transparent>
        <View style={s.overlay}>
          <ScrollView style={s.sheet} contentContainerStyle={{ padding: 24 }}>
            <Text style={s.sheetTitle}>Hubungkan Anak</Text>
            <Text style={s.sheetHint}>
              Masukkan ID 4 karakter dari kartu identitas anak (contoh: B7KM).
              ID-nya juga ada di PDF yang dibagikan setelah tes penempatan.
            </Text>
            <TextInput
              style={[s.input, { textAlign:'center', fontSize:22, letterSpacing:6 }]}
              value={newChildId}
              onChangeText={(v) => setNewChildId(v.toUpperCase())}
              placeholder="B7KM" placeholderTextColor={C.muted}
              maxLength={4} autoCapitalize="characters" />
            <TouchableOpacity style={[s.primaryBtn, busy && s.btnDisabled]}
              onPress={handleAddChild} disabled={busy}>
              <Text style={s.primaryBtnText}>{busy ? 'Menghubungkan…' : 'Hubungkan'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAdd(false)} style={s.cancelBtn}>
              <Text style={s.cancelText}>Batal</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── Modal Gabung Akun Lama (D3) ────────────────────────────────────── */}
      <Modal visible={showMerge} animationType="slide" transparent>
        <View style={s.overlay}>
          <ScrollView style={s.sheet} contentContainerStyle={{ padding: 24 }}>
            <Text style={s.sheetTitle}>Gabung Akun Lama</Text>
            <Text style={s.sheetHint}>
              Punya dua akun orang tua? Masukkan email &amp; password akun LAMA.
              Semua anak dari akun itu akan dipindah ke akun ini.
            </Text>
            <Text style={s.label}>Email akun lama</Text>
            <TextInput style={s.input} value={mergeEmail} onChangeText={setMergeEmail}
              placeholder="email@contoh.com" placeholderTextColor={C.muted}
              keyboardType="email-address" autoCapitalize="none" />
            <Text style={s.label}>Password akun lama</Text>
            <TextInput style={s.input} value={mergePass} onChangeText={setMergePass}
              placeholder="Password" placeholderTextColor={C.muted} secureTextEntry />
            <TouchableOpacity style={[s.primaryBtn, busy && s.btnDisabled]}
              onPress={handleMergeAccount} disabled={busy}>
              <Text style={s.primaryBtnText}>{busy ? 'Memproses…' : 'Gabungkan Akun'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowMerge(false)} style={s.cancelBtn}>
              <Text style={s.cancelText}>Batal</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container:        { flex:1, backgroundColor:C.bg },
  header:           { flexDirection:'row', justifyContent:'space-between',
                      alignItems:'flex-start', paddingHorizontal:20, paddingVertical:16,
                      borderBottomWidth:1, borderBottomColor:'#ffffff11' },
  greeting:         { color:C.text, fontSize:20, fontWeight:'bold' },
  sub:              { color:C.muted, fontSize:13, marginTop:2 },
  logout:           { color:C.muted, fontSize:14, paddingTop:4 },

  // Summary banner (top)
  summaryBanner:    { backgroundColor:'#FF2EC411', borderBottomWidth:1,
                      borderBottomColor:C.magenta + '44',
                      paddingHorizontal:20, paddingVertical:10 },
  summaryBannerText:{ color:C.magenta, fontSize:13, fontWeight:'600' },

  // Card
  card:             { backgroundColor:C.surface, borderRadius:16,
                      padding:18, marginBottom:14,
                      borderWidth:1, borderColor:'transparent' },
  cardNeedsPay:     { borderColor:C.magenta + '66' },
  cardHeader:       { flexDirection:'row', justifyContent:'space-between',
                      alignItems:'flex-start', marginBottom:16 },
  childName:        { color:C.text, fontSize:17, fontWeight:'bold' },
  childSub:         { color:C.muted, fontSize:12, marginTop:3 },
  arrow:            { color:C.muted, fontSize:24 },

  // Pay badge (pojok kanan header)
  payBadge:         { backgroundColor:C.magenta + '22', borderRadius:20,
                      borderWidth:1, borderColor:C.magenta,
                      paddingHorizontal:10, paddingVertical:4 },
  payBadgeText:     { color:C.magenta, fontSize:11, fontWeight:'bold' },

  // Stats badges
  badgeRow:         { flexDirection:'row', gap:8, marginBottom:16 },
  badge:            { flex:1, backgroundColor:'#ffffff0D', borderRadius:10,
                      padding:10, alignItems:'center' },
  badgeVal:         { color:C.text, fontSize:16, fontWeight:'bold' },
  badgeLabel:       { color:C.muted, fontSize:10, marginTop:3, textAlign:'center' },

  // Payment banner in card
  payBanner:        { backgroundColor:'#FF2EC408', borderRadius:12,
                      borderWidth:1, borderColor:C.magenta + '44',
                      padding:16, marginBottom:14 },
  payBannerTitle:   { color:C.magenta, fontSize:14, fontWeight:'bold', marginBottom:6 },
  payBannerDesc:    { color:C.muted, fontSize:13, lineHeight:20, marginBottom:12 },
  payBtn:           { backgroundColor:C.magenta, borderRadius:10,
                      paddingVertical:10, alignItems:'center' },
  payBtnText:       { color:C.text, fontSize:13, fontWeight:'bold' },

  // Jadwal day selector
  dayBtn:           { paddingHorizontal:12, paddingVertical:8, borderRadius:20,
                      backgroundColor:C.surface, borderWidth:1, borderColor:'#ffffff22' },
  dayBtnActive:     { backgroundColor:C.cyan, borderColor:C.cyan },
  dayBtnText:       { color:C.muted, fontSize:13, fontWeight:'600' },
  dayBtnTextActive: { color:C.bg },

  // Footer
  cardFooter:       { flexDirection:'row', justifyContent:'space-around',
                      borderTopWidth:1, borderTopColor:'#ffffff11', paddingTop:12 },
  linkText:         { color:C.cyan, fontSize:13, fontWeight:'600' },

  empty:            { alignItems:'center', marginTop:80 },
  emptyText:        { color:C.muted, fontSize:16, marginBottom:8 },
  emptyHint:        { color:C.muted + '88', fontSize:13 },

  // ── Auth Baru: Tambah Anak + Merge Akun ──────────────────────────────────
  addBtn:           { backgroundColor:C.cyan + '22', borderWidth:1, borderColor:C.cyan,
                      borderRadius:20, paddingHorizontal:12, paddingVertical:5,
                      marginBottom:6 },
  addBtnText:       { color:C.cyan, fontSize:12, fontWeight:'bold' },
  inviteBtn:         { backgroundColor:C.surface, borderWidth:1, borderColor:C.cyan,
                        borderRadius:20, paddingHorizontal:12, paddingVertical:5, marginBottom:6 },
  inviteBtnText:     { color:C.cyan, fontSize:12, fontWeight:'bold' },
  emptyAddBtn:      { backgroundColor:C.cyan + '22', borderWidth:1, borderColor:C.cyan,
                      borderRadius:12, paddingHorizontal:16, paddingVertical:10, marginBottom:10 },
  mergeLink:        { alignItems:'center', paddingVertical:14 },
  mergeLinkText:    { color:C.muted, fontSize:13, textDecorationLine:'underline' },
  overlay:          { flex:1, backgroundColor:'#000000AA', justifyContent:'flex-end' },
  sheet:            { backgroundColor:C.bg, borderTopLeftRadius:24,
                      borderTopRightRadius:24, maxHeight:'85%' },
  sheetTitle:       { color:C.text, fontSize:20, fontWeight:'bold', marginBottom:8 },
  sheetHint:        { color:C.muted, fontSize:13, lineHeight:19, marginBottom:16 },
  label:            { color:C.muted, fontSize:12, marginBottom:6, marginTop:10 },
  input:            { backgroundColor:C.surface, borderRadius:12, padding:14,
                      color:C.text, fontSize:16, borderWidth:1, borderColor:'#ffffff22' },
  primaryBtn:       { backgroundColor:C.cyan, borderRadius:14, paddingVertical:16,
                      alignItems:'center', marginTop:20 },
  primaryBtnText:   { color:C.bg, fontSize:15, fontWeight:'bold' },
  btnDisabled:      { opacity:0.5 },
  cancelBtn:        { alignItems:'center', paddingVertical:16 },
  cancelText:       { color:C.muted, fontSize:14 },
});
