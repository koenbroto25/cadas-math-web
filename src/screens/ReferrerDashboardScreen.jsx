// src/screens/ReferrerDashboardScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView,
         ActivityIndicator, Alert, Share, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { API_BASE, api } from '../services/api';

const C = { bg:'#0A0A12', surface:'#13131F', cyan:'#00F0FF', text:'#FFFFFF',
            muted:'#888899', green:'#00FF9D', yellow:'#FFD700' };

function StatCard({ label, value, sub, color }) {
  return (
    <View style={s.statCard}>
      <Text style={[s.statValue, color && { color }]}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
      {sub ? <Text style={s.statSub}>{sub}</Text> : null}
    </View>
  );
}

export default function ReferrerDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { referrerToken, referrer, clearReferrerAuth } = useStore();
  const [profile,      setProfile]      = useState(referrer);
  const [dashboard,   setDashboard]    = useState(null);
  const [pendingIdr,   setPendingIdr]   = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);
  const [inviteBusy,  setInviteBusy]   = useState(false);
  const [inviteUrl,   setInviteUrl]    = useState(null);
  const [testAccounts, setTestAccounts] = useState([]);
  const [testAccountBusy, setTestAccountBusy] = useState(false);
  const [testAccountCode, setTestAccountCode] = useState(null);

  async function load(isRefresh = false) {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const token = referrerToken || await AsyncStorage.getItem('referrerToken');
      const res = await fetch(`${API_BASE}/api/referrer/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat dashboard.');
      setDashboard(data);
      setProfile({ ...data.partner, pending_transfer_idr: data.earnings?.ready_idr || 0 });
      setPendingIdr(data.earnings?.ready_idr || 0);
    } catch (err) { Alert.alert('Error', err.message || 'Gagal memuat data.'); }
    finally  { isRefresh ? setRefreshing(false) : setLoading(false); }
  }

  async function loadTestAccounts() {
    if (dashboard?.tier?.type !== 'marketing') return;
    try { const d = await api.testAccountsList(referrerToken); setTestAccounts(d.test_accounts || []); }
    catch (_) { setTestAccounts([]); }
  }

  async function handleCreateTestAccount() {
    setTestAccountBusy(true);
    try { const d = await api.testAccountsCreate({}, referrerToken); setTestAccountCode(d); await loadTestAccounts(); }
    catch (err) { Alert.alert('Gagal', err.message || 'Tidak dapat membuat Test ID.'); }
    finally { setTestAccountBusy(false); }
  }

  async function handleRevokeTestAccount(id) {
    try { await api.testAccountRevoke(id, referrerToken); await loadTestAccounts(); }
    catch (err) { Alert.alert('Gagal', err.message || 'Tidak dapat mencabut Test ID.'); }
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { loadTestAccounts(); }, [dashboard?.tier?.type]);

  async function handleLogout() {
    await AsyncStorage.multiRemove(['referrerToken', 'referrerProfile', 'referrerDemoExpiresAt']);
    clearReferrerAuth();
    navigation.replace('ReferrerLogin');
  }

  async function handleShare() {
    if (!profile?.referral_token) return;
    const link = `https://cadas.app/d/${profile.referral_token}`;
    await Share.share({ message: `Download Cadas Matematika gratis!\n${link}`, url: link });
  }

  async function handleCreateInvite(targetType) {
    setInviteBusy(true);
    try {
      const result = await api.partnerInvitesCreate({ target_type: targetType, expires_hours: 72 }, referrerToken);
      setInviteUrl(result.invite_url);
      await Share.share({ message: `Link undangan ${targetType === 'school' ? 'guru' : 'referrer'} Cadas:\n${result.invite_url}` });
    } catch (err) { Alert.alert('Gagal', err.message || 'Tidak dapat membuat undangan.'); }
    finally { setInviteBusy(false); }
  }

  if (loading) return (
    <View style={s.center}>
      <ActivityIndicator color={C.cyan} size="large" />
    </View>
  );

  const fmt = (n) => `Rp ${Number(n||0).toLocaleString('id-ID')}`;

  return (
    <ScrollView style={s.scroll}
      contentContainerStyle={[s.inner, { paddingTop: insets.top + 16 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.cyan} />}>

      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>Halo, {profile?.full_name?.split(' ')[0] || 'Referrer'} ??</Text>
          <Text style={s.code}>Kode: <Text style={{ color:C.cyan }}>{profile?.referral_code}</Text></Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={s.logout}>Keluar</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <StatCard label="Total Klik"       value={dashboard?.clicks ?? profile?.total_clicks ?? 0} />
        <StatCard label="Konversi"         value={dashboard?.tier?.paid ?? profile?.total_conversions ?? 0} color={C.green} />
        <StatCard label="Komisi Ready"     value={fmt(pendingIdr)} color={C.yellow} />
      </View>
      <View style={s.statsRow}>
        <StatCard label="Total Komisi"     value={fmt(dashboard?.earnings?.total_idr ?? profile?.total_earnings_idr)} />
        <StatCard label="Sudah Ditransfer" value={fmt(dashboard?.earnings?.transferred_idr ?? profile?.total_transferred_idr)} color={C.cyan} />
      </View>
      <View style={s.tierCard}>
        <Text style={s.tierTitle}>Fee efektif saat ini</Text>
        <Text style={s.tierRate}>{dashboard?.tier?.rate ?? 0}%</Text>
        <Text style={s.tierMeta}>
          {dashboard?.tier?.type === 'school' ? 'Guru / Sekolah' : dashboard?.tier?.type === 'marketing' ? 'Head Marketing' : 'Referrer / Sales'}
          {dashboard?.tier?.next_target ? ` · ${dashboard.tier.paid}/${dashboard.tier.next_target} siswa` : ' · network'}
        </Text>
        {dashboard?.tier?.remaining != null && <Text style={s.tierMeta}>Sisa {dashboard.tier.remaining} siswa ke tier berikutnya</Text>}
        {dashboard?.tier?.window && <Text style={s.tierMeta}>Window aktif sampai {new Date(dashboard.tier.window.expires_at).toLocaleDateString('id-ID')}</Text>}
      </View>
      {dashboard?.tier?.type === 'marketing' && dashboard?.network && (
        <View style={s.tierCard}>
          <Text style={s.tierTitle}>Ringkasan jaringan</Text>
          <Text style={s.tierMeta}>Partner: {dashboard.network.partners?.length || 0}</Text>
          <Text style={s.tierMeta}>Siswa confirmed: {dashboard.network.paid_students || 0}</Text>
          <Text style={s.tierMeta}>Klik jaringan: {dashboard.network.clicks || 0}</Text>
        </View>
      )}

      {/* Share link */}
      <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
        <Text style={s.shareBtnText}>Bagikan Link Download</Text>
      </TouchableOpacity>

      {dashboard?.tier?.type === 'marketing' && (
        <View style={s.tierCard}>
          <Text style={s.tierTitle}>Undang Partner</Text>
          <Text style={s.tierMeta}>Link ini hanya untuk membuat akun guru atau referrer, bukan link share publik.</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
            <TouchableOpacity style={s.inviteBtn} onPress={() => handleCreateInvite('school')} disabled={inviteBusy}>
              <Text style={s.inviteBtnText}>Buat Invite Guru</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.inviteBtn} onPress={() => handleCreateInvite('sales')} disabled={inviteBusy}>
              <Text style={s.inviteBtnText}>Buat Invite Referrer</Text>
            </TouchableOpacity>
          </View>
          {inviteUrl && <Text selectable style={s.inviteUrl}>{inviteUrl}</Text>}
        </View>
      )}

      {dashboard?.tier?.type === 'marketing' && (
        <View style={s.tierCard}>
          <Text style={s.tierTitle}>Test ID Head Marketing (M7)</Text>
          <Text style={s.tierMeta}>Maksimal 5 ID aktif, one-time, berlaku 30 menit, tidak menyimpan data produksi.</Text>
          <TouchableOpacity style={s.inviteBtn} onPress={handleCreateTestAccount} disabled={testAccountBusy}>
            <Text style={s.inviteBtnText}>{testAccountBusy ? 'Membuat…' : 'Buat Test ID'}</Text>
          </TouchableOpacity>
          {testAccountCode && (
            <View style={{ marginTop: 10 }}>
              <Text selectable style={s.inviteUrl}>Kode: {testAccountCode.code}</Text>
              <Text selectable style={s.inviteUrl}>{testAccountCode.redeem_url}</Text>
            </View>
          )}
          {testAccounts.filter((x) => !x.used_at && !x.revoked_at && new Date(x.expires_at) > new Date()).map((x) => (
            <View key={x.id} style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: C.muted, fontSize: 11, flex: 1 }}>••••{x.code_hint} · {x.label || 'Preview'}</Text>
              <TouchableOpacity onPress={() => handleRevokeTestAccount(x.id)}><Text style={{ color: C.yellow }}>Cabut</Text></TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Menu */}
      {[
        { label:'?? Riwayat Komisi',  screen:'ReferrerEarnings' },
        { label:'?? Riwayat Klik',    screen:'ReferrerClicks'   },
        { label:'?? Info Bank',        screen:'ReferrerBank'     },
        { label:'?? Ganti Password',   screen:'ReferrerPassword' },
      ].map(item => (
        <TouchableOpacity key={item.screen} style={s.menuItem}
          onPress={() => navigation.navigate(item.screen)}>
          <Text style={s.menuText}>{item.label}</Text>
          <Text style={s.menuArrow}>›</Text>
        </TouchableOpacity>
      ))}

      <Text style={s.rate}>Komisi Anda: {profile?.commission_rate}% per transaksi</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:       { flex:1, backgroundColor:C.bg },
  inner:        { paddingHorizontal:20, paddingBottom:48 },
  center:       { flex:1, backgroundColor:C.bg, justifyContent:'center', alignItems:'center' },
  header:       { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 },
  greeting:     { color:C.text, fontSize:20, fontWeight:'bold' },
  code:         { color:C.muted, fontSize:13, marginTop:4 },
  logout:       { color:C.muted, fontSize:14, paddingTop:4 },
  statsRow:     { flexDirection:'row', gap:10, marginBottom:10 },
  statCard:     { flex:1, backgroundColor:C.surface, borderRadius:14, padding:16, alignItems:'center' },
  statValue:    { color:C.text, fontSize:20, fontWeight:'bold' },
  statLabel:    { color:C.muted, fontSize:11, marginTop:4, textAlign:'center' },
  statSub:      { color:C.muted, fontSize:10, marginTop:2 },
  shareBtn:     { backgroundColor:C.cyan, borderRadius:14, paddingVertical:16,
                  alignItems:'center', marginVertical:16 },
  shareBtnText: { color:C.bg, fontSize:15, fontWeight:'bold' },
  menuItem:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
                  backgroundColor:C.surface, borderRadius:14, padding:18, marginBottom:10 },
  menuText:     { color:C.text, fontSize:15 },
  menuArrow:    { color:C.muted, fontSize:22 },
  rate:         { color:C.muted, fontSize:12, textAlign:'center', marginTop:16 },
  tierCard:     { backgroundColor:C.surface, borderRadius:14, padding:16, marginVertical:8 },
  tierTitle:    { color:C.cyan, fontSize:12, fontWeight:'800', marginBottom:4 },
  tierRate:     { color:C.text, fontSize:28, fontWeight:'900', marginBottom:2 },
  tierMeta:     { color:C.muted, fontSize:12, lineHeight:18 },
  inviteBtn: { flex:1, backgroundColor:'#1A1A2E', borderRadius:10, padding:12, alignItems:'center' },
  inviteBtnText: { color:C.cyan, fontSize:12, fontWeight:'700', textAlign:'center' },
  inviteUrl: { color:C.muted, fontSize:10, marginTop:12 },
});
