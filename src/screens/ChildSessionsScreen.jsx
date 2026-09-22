// src/screens/ChildSessionsScreen.jsx - Sprint E.6 + Sprint S-4 (focus_ratio)
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet,
         ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const C = { bg:'#0A0A12', surface:'#13131F', cyan:'#00F0FF', text:'#FFFFFF',
            muted:'#888899', green:'#00FF9D', yellow:'#FFD700', red:'#FF6B6B',
            magenta:'#FF2EC4', lime:'#B6FF00' };

function focusColor(ratio) {
  if (!ratio) return C.muted;
  if (ratio >= 85) return C.green;
  if (ratio >= 75) return C.yellow;
  return C.magenta;
}

function focusLabel(ratio) {
  if (!ratio) return '-';
  if (ratio >= 85) return 'Fokus';
  if (ratio >= 75) return 'Cukup';
  return 'Distraksi';
}

export default function ChildSessionsScreen({ navigation, route }) {
  const insets  = useSafeAreaInsets();
  const student = route?.params?.student;
  const [sessions,  setSessions]  = useState([]);
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [loadMore,  setLoadMore]  = useState(false);
  const [useNew,    setUseNew]    = useState(true); // pakai endpoint study-sessions baru

  async function load(p = 1, append = false) {
    p === 1 ? setLoading(true) : setLoadMore(true);
    try {
      const token = await AsyncStorage.getItem('parentToken');
      let data;

      if (useNew) {
        // Endpoint baru: study_sessions dengan focus_ratio
        data = await api.parentStudySessions(student.id, p, 20, token);
      } else {
        // Fallback ke endpoint lama
        data = await api.parentChildSessions(student.id, p, 20, token);
      }

      setTotal(data.total || 0);
      setSessions(prev => append ? [...prev, ...data.sessions] : data.sessions);
    } catch (err) {
      // Jika endpoint baru gagal, fallback ke endpoint lama
      if (useNew) {
        setUseNew(false);
        return load(p, append);
      }
      Alert.alert('Error', err.message || 'Gagal memuat sesi.');
    } finally {
      p === 1 ? setLoading(false) : setLoadMore(false);
    }
  }

  useEffect(() => { load(1); }, []);

  function handleLoadMore() {
    const next = page + 1;
    if (sessions.length < total && !loadMore) { setPage(next); load(next, true); }
  }

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('id-ID', { weekday:'short', day:'numeric', month:'short' })
    : '-';

  const fmtDurasi = (ms) => {
    if (!ms) return '-';
    const m = Math.floor(ms / 60000);
    const s = Math.floor((ms % 60000) / 1000);
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const akurasi = (item) => {
    // endpoint baru: total_count, endpoint lama: total_questions
    const total = item.total_count ?? item.total_questions ?? 0;
    const benar = item.correct_count ?? 0;
    return total > 0 ? Math.round((benar / total) * 100) : 0;
  };

  const akurasiColor = (pct) =>
    pct >= 80 ? C.green : pct >= 60 ? C.yellow : C.red;

  function renderItem({ item }) {
    const pct        = akurasi(item);
    const fokus      = parseFloat(item.focus_ratio || 0);
    const hasFokus   = item.focus_ratio != null;
    const exitCount  = item.exit_count ?? 0;
    const isDistraksi = hasFokus && fokus < 75 && exitCount >= 3;
    const durasi     = item.durasi_aktif_menit
      ? `${item.durasi_aktif_menit}m aktif`
      : fmtDurasi(item.duration_active_ms);

    return (
      <View style={[s.card, isDistraksi && s.cardDistraksi]}>
        {/* Baris atas: level, tanggal, akurasi */}
        <View style={s.cardTop}>
          <View style={s.levelPill}>
            <Text style={s.levelPillText}>Level {item.level}</Text>
          </View>
          <Text style={s.date}>{fmtDate(item.started_at || item.created_at)}</Text>
          <Text style={[s.pct, { color: akurasiColor(pct) }]}>{pct}%</Text>
        </View>

        {/* Baris tengah: stats */}
        <View style={s.cardBottom}>
          <Text style={s.stat}>
            {item.correct_count}/{item.total_count ?? item.total_questions ?? 0} benar
          </Text>
          {durasi !== '-' && <Text style={s.stat}>{durasi}</Text>}
          {item.rata_detik != null && <Text style={s.stat}>{item.rata_detik}s rata-rata</Text>}
          {item.level_up && <Text style={[s.stat, { color: C.cyan }]}>Naik level!</Text>}
        </View>

        {/* Fokus ratio — hanya tampil jika data tersedia */}
        {hasFokus && (
          <View style={s.focusRow}>
            <View style={s.focusBarBg}>
              <View style={[s.focusBarFill, {
                width: `${Math.round(fokus)}%`,
                backgroundColor: focusColor(fokus),
              }]} />
            </View>
            <View style={s.focusMeta}>
              <Text style={[s.focusLabel, { color: focusColor(fokus) }]}>
                {focusLabel(fokus)} {Math.round(fokus)}%
              </Text>
              {exitCount > 0 && (
                <Text style={s.exitCount}>{exitCount}x keluar app</Text>
              )}
            </View>
          </View>
        )}

        {/* Bar akurasi */}
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
          <Text style={s.back}>Kembali</Text>
        </TouchableOpacity>
        <Text style={s.title}>Sesi {student?.display_name}</Text>
        <Text style={s.totalBadge}>{total} sesi</Text>
      </View>

      {loading
        ? <ActivityIndicator color={C.cyan} size="large" style={{ marginTop:60 }} />
        : <FlatList
            data={sessions}
            keyExtractor={i => String(i.id)}
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
  card:          { backgroundColor:C.surface, borderRadius:14, padding:16, marginBottom:10,
                   borderWidth:1, borderColor:'transparent' },
  cardDistraksi: { borderColor:'#FF2EC444' },
  cardTop:       { flexDirection:'row', alignItems:'center', marginBottom:10 },
  levelPill:     { backgroundColor:'#ffffff15', borderRadius:8, paddingHorizontal:10,
                   paddingVertical:4, marginRight:10 },
  levelPillText: { color:C.text, fontSize:13, fontWeight:'600' },
  date:          { color:C.muted, fontSize:13, flex:1 },
  pct:           { fontSize:18, fontWeight:'bold' },
  cardBottom:    { flexDirection:'row', justifyContent:'space-between',
                   flexWrap:'wrap', gap:6, marginBottom:10 },
  stat:          { color:C.muted, fontSize:13 },
  focusRow:      { marginBottom:8 },
  focusBarBg:    { height:3, backgroundColor:'#ffffff15', borderRadius:2, marginBottom:4 },
  focusBarFill:  { height:3, borderRadius:2 },
  focusMeta:     { flexDirection:'row', justifyContent:'space-between' },
  focusLabel:    { fontSize:11, fontWeight:'600' },
  exitCount:     { fontSize:11, color:C.muted },
  barBg:         { height:4, backgroundColor:'#ffffff15', borderRadius:2 },
  barFill:       { height:4, borderRadius:2 },
  empty:         { color:C.muted, textAlign:'center', marginTop:60, fontSize:15 },
});