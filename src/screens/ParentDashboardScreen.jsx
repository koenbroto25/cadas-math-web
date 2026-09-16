// src/screens/ParentDashboardScreen.jsx - Sprint E.4 + Sprint I (payment notification)
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet,
         ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useStore } from '../store/useStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../services/api';

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
    await AsyncStorage.multiRemove(['parentToken','parent']);
    clearParentAuth();
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
        <TouchableOpacity onPress={handleLogout}>
          <Text style={s.logout}>Keluar</Text>
        </TouchableOpacity>
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
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyText}>Belum ada anak yang terhubung.</Text>
                <Text style={s.emptyHint}>Daftarkan anak melalui aplikasi anak.</Text>
              </View>
            }
          />
      }
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

  // Footer
  cardFooter:       { flexDirection:'row', justifyContent:'space-around',
                      borderTopWidth:1, borderTopColor:'#ffffff11', paddingTop:12 },
  linkText:         { color:C.cyan, fontSize:13, fontWeight:'600' },

  empty:            { alignItems:'center', marginTop:80 },
  emptyText:        { color:C.muted, fontSize:16, marginBottom:8 },
  emptyHint:        { color:C.muted + '88', fontSize:13 },
});
