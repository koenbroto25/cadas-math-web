// src/screens/ChildSessionsScreen.jsx - Sprint E.6
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet,
         ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../services/api';

const C = { bg:'#0A0A12', surface:'#13131F', cyan:'#00F0FF', text:'#FFFFFF',
            muted:'#888899', green:'#00FF9D', yellow:'#FFD700', red:'#FF6B6B' };

export default function ChildSessionsScreen({ navigation, route }) {
  const insets  = useSafeAreaInsets();
  const student = route?.params?.student;
  const [sessions,  setSessions]  = useState([]);
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [loadMore,  setLoadMore]  = useState(false);

  async function load(p = 1, append = false) {
    p === 1 ? setLoading(true) : setLoadMore(true);
    try {
      const token = await AsyncStorage.getItem('parentToken');
      const res   = await fetch(
        `${API_BASE}/api/parent/child/${student.id}/sessions?page=${p}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTotal(data.total || 0);
      setSessions(prev => append ? [...prev, ...data.sessions] : data.sessions);
    } catch (err) { Alert.alert('Error', err.message || 'Gagal memuat sesi.'); }
    finally      { p === 1 ? setLoading(false) : setLoadMore(false); }
  }

  useEffect(() => { load(1); }, []);

  function handleLoadMore() {
    const next = page + 1;
    if (sessions.length < total && !loadMore) { setPage(next); load(next, true); }
  }

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('id-ID', { weekday:'short', day:'numeric', month:'short' })
    : '-';

  const akurasi = (item) => item.total_questions
    ? Math.round((item.correct_count / item.total_questions) * 100)
    : 0;

  const akurasiColor = (pct) =>
    pct >= 80 ? C.green : pct >= 60 ? C.yellow : C.red;

  function renderItem({ item }) {
    const pct = akurasi(item);
    return (
      <View style={s.card}>
        <View style={s.cardTop}>
          <View style={s.levelPill}>
            <Text style={s.levelPillText}>Level {item.level}</Text>
          </View>
          <Text style={s.date}>{fmtDate(item.created_at)}</Text>
          <Text style={[s.pct, { color: akurasiColor(pct) }]}>{pct}%</Text>
        </View>
        <View style={s.cardBottom}>
          <Text style={s.stat}>{item.correct_count}/{item.total_questions} benar</Text>
          <Text style={s.stat}>{item.rata_detik ?? '-'}s rata-rata</Text>
        </View>
        {/* Mini progress bar */}
        <View style={s.barBg}>
          <View style={[s.barFill, { width:`${pct}%`, backgroundColor: akurasiColor(pct) }]} />
        </View>
      </View>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={s.title}>Sesi {student?.display_name}</Text>
        <Text style={s.totalBadge}>{total} sesi</Text>
      </View>

      {loading
        ? <ActivityIndicator color={C.cyan} size="large" style={{ marginTop:60 }} />
        : <FlatList
            data={sessions}
            keyExtractor={i => i.id}
            renderItem={renderItem}
            contentContainerStyle={{ padding:16, paddingBottom:48 }}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.3}
            ListEmptyComponent={<Text style={s.empty}>Belum ada sesi latihan.</Text>}
            ListFooterComponent={loadMore
              ? <ActivityIndicator color={C.cyan} style={{ marginTop:16 }} />
              : null}
          />
      }
    </View>
  );
}

const s = StyleSheet.create({
  container:     { flex:1, backgroundColor:C.bg },
  header:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
                   paddingHorizontal:16, paddingVertical:14,
                   borderBottomWidth:1, borderBottomColor:'#ffffff11' },
  back:          { color:C.muted, fontSize:15 },
  title:         { color:C.text, fontSize:16, fontWeight:'bold' },
  totalBadge:    { color:C.cyan, fontSize:13 },
  card:          { backgroundColor:C.surface, borderRadius:14, padding:16, marginBottom:10 },
  cardTop:       { flexDirection:'row', alignItems:'center', marginBottom:10 },
  levelPill:     { backgroundColor:'#ffffff15', borderRadius:8, paddingHorizontal:10,
                   paddingVertical:4, marginRight:10 },
  levelPillText: { color:C.text, fontSize:13, fontWeight:'600' },
  date:          { color:C.muted, fontSize:13, flex:1 },
  pct:           { fontSize:18, fontWeight:'bold' },
  cardBottom:    { flexDirection:'row', justifyContent:'space-between', marginBottom:10 },
  stat:          { color:C.muted, fontSize:13 },
  barBg:         { height:4, backgroundColor:'#ffffff15', borderRadius:2 },
  barFill:       { height:4, borderRadius:2 },
  empty:         { color:C.muted, textAlign:'center', marginTop:60, fontSize:15 },
});
