// src/screens/ReferrerDashboardScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView,
         ActivityIndicator, Alert, Share, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { API_BASE } from '../services/api';

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
  const [pendingIdr,   setPendingIdr]   = useState(0);
  const [loading,      setLoading]      = useState(true);
  const [refreshing,   setRefreshing]   = useState(false);

  async function load(isRefresh = false) {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const token = referrerToken || await AsyncStorage.getItem('referrerToken');
      const res   = await fetch(`${API_BASE}/api/referrer/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { handleLogout(); return; }
      const data = await res.json();
      setProfile(data.referrer);
      setPendingIdr(data.pending_transfer_idr || 0);
    } catch { Alert.alert('Error', 'Gagal memuat data.'); }
    finally  { isRefresh ? setRefreshing(false) : setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleLogout() {
    await AsyncStorage.multiRemove(['referrerToken', 'referrerProfile']);
    clearReferrerAuth();
    navigation.replace('ReferrerLogin');
  }

  async function handleShare() {
    if (!profile?.referral_token) return;
    const link = `https://cadas.app/d/${profile.referral_token}`;
    await Share.share({ message: `Download Cadas Matematika gratis!\n${link}`, url: link });
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
        <StatCard label="Total Klik"       value={profile?.total_clicks       || 0} />
        <StatCard label="Konversi"         value={profile?.total_conversions   || 0} color={C.green} />
        <StatCard label="Komisi Pending"   value={fmt(pendingIdr)}                   color={C.yellow} />
      </View>
      <View style={s.statsRow}>
        <StatCard label="Total Komisi"     value={fmt(profile?.total_earnings_idr)} />
        <StatCard label="Sudah Ditransfer" value={fmt(profile?.total_transferred_idr)} color={C.cyan} />
      </View>

      {/* Share link */}
      <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
        <Text style={s.shareBtnText}>?? Bagikan Link Download</Text>
      </TouchableOpacity>

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
});
