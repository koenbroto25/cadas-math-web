// src/screens/ChildProgressScreen.jsx - Sprint E.5
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet,
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
      <View style={[s.barFill, { width: `${Math.min(100, pct || 0)}%`, backgroundColor: color }]} />
    </View>
  );
}

export default function ChildProgressScreen({ navigation, route }) {
  const insets   = useSafeAreaInsets();
  const student  = route?.params?.student;
  const [data,       setData]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const token = await AsyncStorage.getItem('parentToken');
      const res   = await fetch(`${API_BASE}/api/parent/child/${student.id}/progress`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json();
      if (!res.ok) throw new Error(d.error);
      setData(d);
    } catch (err) { Alert.alert('Error', err.message || 'Gagal memuat progress.'); }
    finally      { isRefresh ? setRefreshing(false) : setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const fmt = (v, suffix = '') => v != null ? `${v}${suffix}` : '-';

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={s.title}>{student?.display_name}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('ChildSessions', { student })}>
          <Text style={s.headerLink}>Sesi →</Text>
        </TouchableOpacity>
      </View>

      {loading
        ? <ActivityIndicator color={C.cyan} size="large" style={{ marginTop:60 }} />
        : <ScrollView
            contentContainerStyle={s.scroll}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.cyan} />}>

            {/* Ringkasan */}
            <Text style={s.sectionTitle}>Ringkasan</Text>
            <View style={s.statsRow}>
              <StatBox label="Level Saat Ini" value={data?.student?.current_level} color={C.cyan} />
              <StatBox label="Total Sesi"     value={data?.stats?.total_sesi} />
              <StatBox label="Hari Aktif"     value={data?.stats?.hari_aktif} color={C.green} />
            </View>
            <View style={s.statsRow}>
              <StatBox label="Total Soal"  value={data?.stats?.total_soal} />
              <StatBox label="Benar"       value={data?.stats?.total_benar} color={C.green} />
              <StatBox label="Akurasi"     value={fmt(data?.stats?.akurasi_pct, '%')} color={
                (data?.stats?.akurasi_pct >= 80) ? C.green :
                (data?.stats?.akurasi_pct >= 60) ? C.yellow : C.red
              } />
            </View>

            {/* Progress per Level */}
            <Text style={s.sectionTitle}>Progress per Level</Text>
            {(data?.per_level || []).length === 0
              ? <Text style={s.emptyText}>Belum ada data latihan.</Text>
              : (data?.per_level || []).map(lv => (
                <View key={lv.level} style={s.levelCard}>
                  <View style={s.levelHeader}>
                    <Text style={s.levelTitle}>Level {lv.level}</Text>
                    <Text style={[s.levelAkurasi, {
                      color: lv.akurasi_pct >= 80 ? C.green : lv.akurasi_pct >= 60 ? C.yellow : C.red
                    }]}>{fmt(lv.akurasi_pct, '%')}</Text>
                  </View>
                  <AccuracyBar pct={lv.akurasi_pct} />
                  <View style={s.levelStats}>
                    <Text style={s.levelStat}>{lv.total_sesi} sesi</Text>
                    <Text style={s.levelStat}>{lv.total_benar}/{lv.total_soal} benar</Text>
                    <Text style={s.levelStat}>{fmt(lv.rata_detik, 's')} rata-rata</Text>
                  </View>
                </View>
              ))
            }

            {/* Billing shortcut */}
            <TouchableOpacity style={s.billingBtn}
              onPress={() => navigation.navigate('ChildBilling', { student })}>
              <Text style={s.billingBtnText}>Lihat Status Billing →</Text>
            </TouchableOpacity>
          </ScrollView>
      }
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:C.bg },
  header:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
                  paddingHorizontal:16, paddingVertical:14,
                  borderBottomWidth:1, borderBottomColor:'#ffffff11' },
  back:         { color:C.muted, fontSize:15 },
  title:        { color:C.text, fontSize:16, fontWeight:'bold' },
  headerLink:   { color:C.cyan, fontSize:14 },
  scroll:       { padding:16, paddingBottom:48 },
  sectionTitle: { color:C.muted, fontSize:12, fontWeight:'700', letterSpacing:1,
                  textTransform:'uppercase', marginBottom:10, marginTop:8 },
  statsRow:     { flexDirection:'row', gap:8, marginBottom:8 },
  statBox:      { flex:1, backgroundColor:C.surface, borderRadius:12, padding:14, alignItems:'center' },
  statVal:      { color:C.text, fontSize:18, fontWeight:'bold' },
  statLabel:    { color:C.muted, fontSize:10, marginTop:4, textAlign:'center' },
  levelCard:    { backgroundColor:C.surface, borderRadius:14, padding:16, marginBottom:10 },
  levelHeader:  { flexDirection:'row', justifyContent:'space-between', marginBottom:10 },
  levelTitle:   { color:C.text, fontSize:15, fontWeight:'bold' },
  levelAkurasi: { fontSize:15, fontWeight:'bold' },
  barBg:        { height:6, backgroundColor:'#ffffff15', borderRadius:3, marginBottom:10 },
  barFill:      { height:6, borderRadius:3 },
  levelStats:   { flexDirection:'row', justifyContent:'space-between' },
  levelStat:    { color:C.muted, fontSize:12 },
  emptyText:    { color:C.muted, textAlign:'center', marginTop:40, fontSize:14 },
  billingBtn:   { backgroundColor:C.surface, borderRadius:14, padding:16,
                  alignItems:'center', marginTop:16 },
  billingBtnText: { color:C.cyan, fontSize:14, fontWeight:'600' },
});
