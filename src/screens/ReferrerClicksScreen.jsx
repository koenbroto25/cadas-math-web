// src/screens/ReferrerClicksScreen.jsx
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator,
         TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { API_BASE } from '../services/api';

const C = { bg:'#0A0A12', surface:'#13131F', cyan:'#00F0FF', text:'#FFFFFF', muted:'#888899' };

export default function ReferrerClicksScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { referrerToken } = useStore();
  const [clicks,   setClicks]   = useState([]);
  const [page,     setPage]     = useState(1);
  const [total,    setTotal]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [loadMore, setLoadMore] = useState(false);

  async function load(p = 1, append = false) {
    p === 1 ? setLoading(true) : setLoadMore(true);
    try {
      const token = referrerToken || await AsyncStorage.getItem('referrerToken');
      const res   = await fetch(`${API_BASE}/api/referrer/clicks?page=${p}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setTotal(data.total || 0);
      setClicks(prev => append ? [...prev, ...data.clicks] : data.clicks);
    } catch { Alert.alert('Error', 'Gagal memuat data.'); }
    finally  { p === 1 ? setLoading(false) : setLoadMore(false); }
  }

  useEffect(() => { load(1); }, []);

  function handleLoadMore() {
    const nextPage = page + 1;
    if (clicks.length < total && !loadMore) { setPage(nextPage); load(nextPage, true); }
  }

  const fmtDate = (d) => d
    ? new Date(d).toLocaleString('id-ID', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })
    : '-';

  function renderItem({ item, index }) {
    const ua = item.user_agent || '';
    const device = ua.includes('iPhone') || ua.includes('iPad') ? '?? iOS'
                 : ua.includes('Android') ? '?? Android' : '?? Lainnya';
    return (
      <View style={s.card}>
        <View style={s.cardRow}>
          <Text style={s.num}>#{total - ((page-1)*20) - index}</Text>
          <Text style={s.device}>{device}</Text>
          <Text style={s.date}>{fmtDate(item.clicked_at)}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>? Kembali</Text>
        </TouchableOpacity>
        <Text style={s.title}>Riwayat Klik</Text>
        <Text style={s.totalBadge}>{total} klik</Text>
      </View>

      {loading
        ? <ActivityIndicator color={C.cyan} size="large" style={{ marginTop:40 }} />
        : <FlatList
            data={clicks}
            keyExtractor={i => i.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding:16, paddingBottom:40 }}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={<Text style={s.empty}>Belum ada klik.</Text>}
            ListFooterComponent={loadMore ? <ActivityIndicator color={C.cyan} style={{ marginTop:16 }} /> : null}
          />
      }
    </View>
  );
}

const s = StyleSheet.create({
  container:  { flex:1, backgroundColor:C.bg },
  header:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between',
                paddingHorizontal:16, paddingVertical:16, borderBottomWidth:1, borderBottomColor:'#ffffff11' },
  back:       { color:C.muted, fontSize:15 },
  title:      { color:C.text, fontSize:17, fontWeight:'bold' },
  totalBadge: { color:C.cyan, fontSize:13 },
  card:       { backgroundColor:C.surface, borderRadius:12, padding:14, marginBottom:8 },
  cardRow:    { flexDirection:'row', alignItems:'center', gap:12 },
  num:        { color:C.muted, fontSize:13, width:36 },
  device:     { color:C.text, fontSize:14, flex:1 },
  date:       { color:C.muted, fontSize:12 },
  empty:      { color:C.muted, textAlign:'center', marginTop:60, fontSize:15 },
});
