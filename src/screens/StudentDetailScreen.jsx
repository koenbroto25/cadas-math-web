// src/screens/StudentDetailScreen.jsx - Sprint F.6
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, StyleSheet,
         ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../services/api';

const C = { bg:'#0A0A12', surface:'#13131F', cyan:'#00F0FF', text:'#FFFFFF',
            muted:'#888899', green:'#00FF9D', yellow:'#FFD700', red:'#FF6B6B' };

function StatBox({ label, value, color }) {
  return (
    <View style={s.statBox}>
      <Text style={[s.statVal, color && { color }]}>{value ?? '-'}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

function AccuracyBar({ pct }) {
  const color = pct >= 80 ? C.green : pct >= 60 ? C.yellow : C.red;
  return (
    <View style={s.barBg}>
      <View style={[s.barFill, { width:`${Math.min(100, pct || 0)}%`, backgroundColor:color }]} />
    </View>
  );
}

export default function StudentDetailScreen({ navigation, route }) {
  const insets  = useSafeAreaInsets();
  const student = route?.params?.student;
  const [progress,   setProgress]   = useState(null);
  const [sessions,   setSessions]   = useState([]);
  const [total,      setTotal]      = useState(0);
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [loadMore,   setLoadMore]   = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [tab,        setTab]        = useState('progress'); // 'progress' | 'sessions'

  async function loadProgress(isRefresh = false) {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const token = await AsyncStorage.getItem('teacherToken');
      const res   = await fetch(
        `${API_BASE}/api/teacher/student/${student.id}/progress`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setProgress(d);
    } catch (err) { Alert.alert('Error', err.message || 'Gagal memuat progress.'); }
    finally      { isRefresh ? setRefreshing(false) : setLoading(false); }
  }

  async function loadSessions(p = 1, append = false) {
    p === 1 ? setLoading(true) : setLoadMore(true);
    try {
      const token = await AsyncStorage.getItem('teacherToken');
      const res   = await fetch(
        `${API_BASE}/api/teacher/student/${student.id}/sessions?page=${p}&limit=20`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setTotal(d.total || 0);
      setSessions(prev => append ? [...prev, ...d.sessions] : d.sessions);
    } catch (err) { Alert.alert('Error', err.message || 'Gagal memuat sesi.'); }
    finally      { p === 1 ? setLoading(false) : setLoadMore(false); }
  }

  useEffect(() => { loadProgress(); loadSessions(1); }, [student?.id]);

  function handleLoadMore() {
    const next = page + 1;
    if (sessions.length < total && !loadMore) { setPage(next); loadSessions(next, true); }
  }

  const fmt      = (v, sfx = '') => v != null ? `${v}${sfx}` : '-';
  const fmtDate  = (d) => d
    ? new Date(d).toLocaleDateString('id-ID', { weekday:'short', day:'numeric', month:'short' }) : '-';
  const pctColor = (p) => p >= 80 ? C.green : p >= 60 ? C.yellow : C.red;

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={s.title}>{student?.display_name}</Text>
        <Text style={s.levelBadge}>Lv {student?.current_level}</Text>
      </View>

      {/* Tab switcher */}
      <View style={s.tabs}>
        {['progress','sessions'].map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === 'progress' ? 'Progress' : 'Sesi'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading
        ? <ActivityIndicator color={C.cyan} size="large" style={{ marginTop:60 }} />
        : tab === 'progress'
          ? <ScrollView contentContainerStyle={s.scroll}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadProgress(true)} tintColor={C.cyan} />}>
              <Text style={s.section}>Ringkasan</Text>
              <View style={s.statsRow}>
                <StatBox label="Total Sesi"  value={progress?.stats?.total_sesi} />
                <StatBox label="Hari Aktif"  value={progress?.stats?.hari_aktif} color={C.green} />
                <StatBox label="Akurasi"     value={fmt(progress?.stats?.akurasi_pct, '%')}
                  color={pctColor(progress?.stats?.akurasi_pct)} />
              </View>
              <View style={s.statsRow}>
                <StatBox label="Total Soal"  value={progress?.stats?.total_soal} />
                <StatBox label="Benar"       value={progress?.stats?.total_benar} color={C.green} />
                <StatBox label="Level"       value={progress?.student?.current_level} color={C.cyan} />
              </View>

              <Text style={s.section}>Per Level</Text>
              {(progress?.per_level || []).length === 0
                ? <Text style={s.empty}>Belum ada data latihan.</Text>
                : (progress?.per_level || []).map(lv => (
                  <View key={lv.level} style={s.levelCard}>
                    <View style={s.levelHeader}>
                      <Text style={s.levelTitle}>Level {lv.level}</Text>
                      <Text style={[s.levelPct, { color: pctColor(lv.akurasi_pct) }]}>
                        {fmt(lv.akurasi_pct, '%')}
                      </Text>
                    </View>
                    <AccuracyBar pct={lv.akurasi_pct} />
                    <View style={s.levelStats}>
                      <Text style={s.levelStat}>{lv.total_sesi} sesi</Text>
                      <Text style={s.levelStat}>{lv.total_benar}/{lv.total_soal} benar</Text>
                      <Text style={s.levelStat}>{fmt(lv.rata_detik, 's')}</Text>
                    </View>
                  </View>
                ))
              }
            </ScrollView>

          : <FlatList
              data={sessions}
              keyExtractor={i => i.id}
              contentContainerStyle={s.scroll}
              onEndReached={handleLoadMore}
              onEndReachedThreshold={0.3}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setPage(1); loadSessions(1); }} tintColor={C.cyan} />}
              ListEmptyComponent={<Text style={s.empty}>Belum ada sesi.</Text>}
              ListFooterComponent={loadMore ? <ActivityIndicator color={C.cyan} style={{ marginTop:16 }} /> : null}
              renderItem={({ item }) => {
                const pct = item.total_questions
                  ? Math.round((item.correct_count / item.total_questions) * 100) : 0;
                return (
                  <View style={s.sessionCard}>
                    <View style={s.sessionTop}>
                      <View style={s.levelPill}>
                        <Text style={s.levelPillText}>Level {item.level}</Text>
                      </View>
                      <Text style={s.sessionDate}>{fmtDate(item.created_at)}</Text>
                      <Text style={[s.sessionPct, { color: pctColor(pct) }]}>{pct}%</Text>
                    </View>
                    <View style={s.sessionBot}>
                      <Text style={s.sessionStat}>{item.correct_count}/{item.total_questions} benar</Text>
                      <Text style={s.sessionStat}>{item.rata_detik ?? '-'}s rata-rata</Text>
                    </View>
                    <View style={s.barBg}>
                      <View style={[s.barFill, { width:`${pct}%`, backgroundColor: pctColor(pct) }]} />
                    </View>
                  </View>
                );
              }}
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
  levelBadge:    { color:C.cyan, fontSize:14, fontWeight:'700' },
  tabs:          { flexDirection:'row', backgroundColor:C.surface, margin:16,
                   borderRadius:12, padding:4 },
  tab:           { flex:1, paddingVertical:10, alignItems:'center', borderRadius:10 },
  tabActive:     { backgroundColor:C.cyan },
  tabText:       { color:C.muted, fontSize:15, fontWeight:'600' },
  tabTextActive: { color:C.bg },
  scroll:        { padding:16, paddingBottom:48 },
  section:       { color:C.muted, fontSize:11, fontWeight:'700', letterSpacing:1,
                   textTransform:'uppercase', marginBottom:10, marginTop:4 },
  statsRow:      { flexDirection:'row', gap:8, marginBottom:8 },
  statBox:       { flex:1, backgroundColor:C.surface, borderRadius:12, padding:14, alignItems:'center' },
  statVal:       { color:C.text, fontSize:18, fontWeight:'bold' },
  statLabel:     { color:C.muted, fontSize:10, marginTop:4, textAlign:'center' },
  levelCard:     { backgroundColor:C.surface, borderRadius:14, padding:16, marginBottom:10 },
  levelHeader:   { flexDirection:'row', justifyContent:'space-between', marginBottom:10 },
  levelTitle:    { color:C.text, fontSize:15, fontWeight:'bold' },
  levelPct:      { fontSize:15, fontWeight:'bold' },
  barBg:         { height:5, backgroundColor:'#ffffff15', borderRadius:3, marginBottom:8 },
  barFill:       { height:5, borderRadius:3 },
  levelStats:    { flexDirection:'row', justifyContent:'space-between' },
  levelStat:     { color:C.muted, fontSize:12 },
  sessionCard:   { backgroundColor:C.surface, borderRadius:14, padding:16, marginBottom:10 },
  sessionTop:    { flexDirection:'row', alignItems:'center', marginBottom:10 },
  levelPill:     { backgroundColor:'#ffffff15', borderRadius:8, paddingHorizontal:10,
                   paddingVertical:4, marginRight:10 },
  levelPillText: { color:C.text, fontSize:13, fontWeight:'600' },
  sessionDate:   { color:C.muted, fontSize:13, flex:1 },
  sessionPct:    { fontSize:18, fontWeight:'bold' },
  sessionBot:    { flexDirection:'row', justifyContent:'space-between', marginBottom:10 },
  sessionStat:   { color:C.muted, fontSize:13 },
  empty:         { color:C.muted, textAlign:'center', marginTop:40, fontSize:14 },
});
