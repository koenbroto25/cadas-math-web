// src/screens/ReferrerEarningsScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator,
         TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { API_BASE } from '../services/api';

const C = { bg:'#0A0A12', surface:'#13131F', cyan:'#00F0FF', text:'#FFFFFF',
            muted:'#888899', green:'#00FF9D', yellow:'#FFD700' };

const STATUS_COLOR = { pending:'#FFD700', transferred:'#00FF9D', cancelled:'#FF6B6B' };
const STATUS_LABEL = { pending:'Menunggu Transfer', transferred:'Sudah Ditransfer', cancelled:'Dibatalkan' };

export default function ReferrerEarningsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { referrerToken } = useStore();
  const [earnings, setEarnings] = useState([]);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [loadMore, setLoadMore] = useState(false);

  async function load(p = 1, append = false) {
    p === 1 ? setLoading(true) : setLoadMore(true);
    try {
      const token = referrerToken || await AsyncStorage.getItem('referrerToken');
      const res   = await fetch(`${API_BASE}/api/referrer/earnings?page=${p}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data  = await res.json();
      setTotal(data.total || 0);
      setEarnings(prev => append ? [...prev, ...data.earnings] : data.earnings);
    } catch { Alert.alert('Error', 'Gagal memuat data.'); }
    finally  { p === 1 ? setLoading(false) : setLoadMore(false); }
  }

  useEffect(() => { load(1); }, []);

  function handleLoadMore() {
    const nextPage = page + 1;
    if (earnings.length < total && !loadMore) {
      setPage(nextPage);
      load(nextPage, true);
    }
  }

  const fmt    = (n) => `Rp ${Number(n||0).toLocaleString('id-ID')}`;
  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }) : '-';

  function renderItem({ item }) {
    return (
      <View style={s.card}>
        <View style={s.cardRow}>
          <Text style={s.studentName}>{item.student_name || 'Siswa'}</Text>
          <Text style={[s.status, { color: STATUS_COLOR[item.status] || C.muted }]}>
            {STATUS_LABEL[item.status] || item.status}
          </Text>
        </View>
        <View style={s.cardRow}>
          <Text style={s.amount}>{fmt(item.commission_idr)}</Text>
          <Text style={s.rate}>{item.commission_rate}% dari {fmt(item.amount_idr)}</Text>
        </View>
        <Text style={s.date}>{fmtDate(item.created_at)}</Text>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>? Kembali</Text>
        </TouchableOpacity>
        <Text style={s.title}>Riwayat Komisi</Text>
        <Text style={s.totalBadge}>{total} transaksi</Text>
      </View>

      {loading
        ? <ActivityIndicator color={C.cyan} size="large" style={{ marginTop:40 }} />
        : <FlatList
            data={earnings}
            keyExtractor={i => i.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding:16, paddingBottom:40 }}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={<Text style={s.empty}>Belum ada komisi.</Text>}
            ListFooterComponent={loadMore ? <ActivityIndicator color={C.cyan} style={{ marginTop:16 }} /> : null}
          />
      }
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex:1, backgroundColor:C.bg },
  header:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between',
                 paddingHorizontal:16, paddingVertical:16, borderBottomWidth:1, borderBottomColor:'#ffffff11' },
  back:        { color:C.muted, fontSize:15 },
  title:       { color:C.text, fontSize:17, fontWeight:'bold' },
  totalBadge:  { color:C.cyan, fontSize:13 },
  card:        { backgroundColor:C.surface, borderRadius:14, padding:16, marginBottom:10 },
  cardRow:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:4 },
  studentName: { color:C.text, fontSize:15, fontWeight:'600' },
  status:      { fontSize:12, fontWeight:'600' },
  amount:      { color:C.cyan, fontSize:18, fontWeight:'bold' },
  rate:        { color:C.muted, fontSize:12 },
  date:        { color:C.muted, fontSize:12, marginTop:4 },
  empty:       { color:C.muted, textAlign:'center', marginTop:60, fontSize:15 },
});
