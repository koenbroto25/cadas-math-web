// src/screens/ChildWeeklySummaryScreen.jsx - Sprint S-5
// Ringkasan mingguan per anak: hari belajar, durasi, akurasi, fokus ratio
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet,
         ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { api } from '../services/api';

const C = {
  bg:'#0A0A12', surface:'#13131F', cyan:'#00F0FF', text:'#FFFFFF',
  muted:'#888899', green:'#00FF9D', yellow:'#FFD700', red:'#FF6B6B',
  magenta:'#FF2EC4', lime:'#B6FF00',
};

const HARI_LABEL = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];

function StatCard({ label, value, color, sub }) {
  return (
    <View style={s.statCard}>
      <Text style={[s.statVal, color && { color }]}>{value ?? '-'}</Text>
      <Text style={s.statLabel}>{label}</Text>
      {sub ? <Text style={s.statSub}>{sub}</Text> : null}
    </View>
  );
}

function FocusBar({ value, color }) {
  return (
    <View style={s.focusBg}>
      <View style={[s.focusFill, { width: `${Math.min(100, value || 0)}%`, backgroundColor: color }]} />
    </View>
  );
}

function focusColor(r) {
  if (!r) return C.muted;
  if (r >= 85) return C.green;
  if (r >= 75) return C.yellow;
  return C.magenta;
}

export default function ChildWeeklySummaryScreen({ navigation, route }) {
  const insets  = useSafeAreaInsets();
  const student = route?.params?.student;
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('parentToken');
      const resp  = await api.parentWeeklySummary(student.id, token);
      setData(resp);
    } catch (e) {
      Alert.alert('Error', e?.message || 'Gagal memuat ringkasan.');
    } finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const fmtTgl = (d) => d
    ? new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'short' })
    : '-';

  if (loading) {
    return (
      <View style={[s.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={C.cyan} size="large" />
      </View>
    );
  }

  const sum     = data?.summary || {};
  const daily   = data?.daily_detail || [];
  const targets = data?.targets || { daily_target_minutes: 30, weekly_target_days: 5 };

  const hariBelajar  = sum.hari_belajar  || 0;
  const targetHari   = targets.weekly_target_days || 5;
  const rataDurasi   = sum.rata_durasi_menit || 0;
  const rataAkurasi  = sum.rata_akurasi  || 0;
  const rataFokus    = parseFloat(sum.rata_fokus_ratio || 0);
  const tercapai     = hariBelajar >= targetHari;

  // Buat map tanggal -> data untuk 7 hari terakhir
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const dailyMap = {};
  daily.forEach((d) => { dailyMap[String(d.tanggal).slice(0, 10)] = d; });

  return (
    <ScrollView style={s.scroll} contentContainerStyle={[s.inner, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>Kembali</Text>
        </TouchableOpacity>
        <Text style={s.title}>Ringkasan Mingguan</Text>
        <View style={{ width: 60 }} />
      </View>

      <Text style={s.studentName}>{student?.display_name}</Text>
      <Text style={s.subtitle}>7 hari terakhir</Text>

      {/* Banner target */}
      <View style={[s.banner, tercapai ? s.bannerOk : s.bannerWarn]}>
        <Text style={[s.bannerText, { color: tercapai ? C.green : C.yellow }]}>
          {tercapai
            ? `Target mingguan tercapai! ${hariBelajar}/${targetHari} hari belajar`
            : `${hariBelajar} dari ${targetHari} hari target belajar minggu ini`}
        </Text>
      </View>

      {/* Stat cards */}
      <View style={s.statsRow}>
        <StatCard label="Hari Belajar" value={`${hariBelajar}/${targetHari}`}
          color={tercapai ? C.green : C.yellow} />
        <StatCard label="Rata Durasi" value={`${rataDurasi}m`} color={C.cyan} sub="per sesi" />
        <StatCard label="Rata Akurasi" value={`${rataAkurasi}%`}
          color={rataAkurasi >= 80 ? C.green : rataAkurasi >= 60 ? C.yellow : C.red} />
        <StatCard label="Rata Fokus" value={`${Math.round(rataFokus)}%`}
          color={focusColor(rataFokus)} />
      </View>

      {/* Kalender mini 7 hari */}
      <Text style={s.sectionTitle}>Aktivitas 7 Hari</Text>
      <View style={s.weekRow}>
        {weekDays.map((tgl) => {
          const d     = dailyMap[tgl];
          const hadir = !!d;
          const dur   = d ? parseFloat(d.durasi_menit || 0) : 0;
          const date  = new Date(tgl);
          const dow   = date.getDay();
          const tglFmt = date.getDate();
          return (
            <View key={tgl} style={s.dayCol}>
              <Text style={s.dowLabel}>{HARI_LABEL[dow]}</Text>
              <View style={[s.dayCircle, hadir ? s.dayCircleActive : s.dayCircleEmpty]}>
                <Text style={[s.dayNum, hadir && s.dayNumActive]}>{tglFmt}</Text>
              </View>
              <Text style={s.dayDur}>{hadir ? `${dur}m` : ''}</Text>
            </View>
          );
        })}
      </View>

      {/* Detail harian */}
      {daily.length > 0 && (
        <>
          <Text style={s.sectionTitle}>Detail Per Hari</Text>
          {daily.map((d, i) => {
            const fokus = parseFloat(d.fokus_ratio || 0);
            return (
              <View key={i} style={s.dayCard}>
                <View style={s.dayCardHeader}>
                  <Text style={s.dayCardDate}>{fmtTgl(d.tanggal)}</Text>
                  <Text style={s.dayCardSesi}>{d.jumlah_sesi} sesi</Text>
                </View>
                <View style={s.dayCardStats}>
                  <Text style={s.dayCardStat}>{d.durasi_menit}m aktif</Text>
                  <Text style={[s.dayCardStat, {
                    color: d.akurasi >= 80 ? C.green : d.akurasi >= 60 ? C.yellow : C.red
                  }]}>{d.akurasi}% akurasi</Text>
                </View>
                {d.fokus_ratio != null && (
                  <View style={{ marginTop: 6 }}>
                    <FocusBar value={fokus} color={focusColor(fokus)} />
                    <Text style={[s.focusText, { color: focusColor(fokus) }]}>
                      Fokus {Math.round(fokus)}%
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </>
      )}

      {daily.length === 0 && (
        <View style={s.empty}>
          <Text style={s.emptyText}>Belum ada aktivitas belajar minggu ini.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:           { flex:1, backgroundColor:C.bg },
  inner:            { paddingBottom:48 },
  center:           { flex:1, backgroundColor:C.bg, alignItems:'center', justifyContent:'center' },
  header:           { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
                      paddingHorizontal:16, paddingVertical:14,
                      borderBottomWidth:1, borderBottomColor:'#ffffff11' },
  back:             { color:C.muted, fontSize:15, width:60 },
  title:            { color:C.text, fontSize:16, fontWeight:'bold' },
  studentName:      { color:C.text, fontSize:22, fontWeight:'bold',
                      paddingHorizontal:20, marginTop:20, marginBottom:2 },
  subtitle:         { color:C.muted, fontSize:13, paddingHorizontal:20, marginBottom:16 },
  banner:           { marginHorizontal:16, borderRadius:12, padding:14, marginBottom:16,
                      borderWidth:1 },
  bannerOk:         { backgroundColor:'#00FF9D11', borderColor:'#00FF9D44' },
  bannerWarn:       { backgroundColor:'#FFD70011', borderColor:'#FFD70044' },
  bannerText:       { fontSize:14, fontWeight:'600', textAlign:'center' },
  statsRow:         { flexDirection:'row', paddingHorizontal:12, gap:8, marginBottom:20 },
  statCard:         { flex:1, backgroundColor:C.surface, borderRadius:12,
                      padding:12, alignItems:'center' },
  statVal:          { color:C.text, fontSize:16, fontWeight:'bold', marginBottom:2 },
  statLabel:        { color:C.muted, fontSize:10, textAlign:'center' },
  statSub:          { color:C.muted, fontSize:9, marginTop:1 },
  sectionTitle:     { color:C.muted, fontSize:12, fontWeight:'600', letterSpacing:1,
                      paddingHorizontal:20, marginBottom:12, textTransform:'uppercase' },
  weekRow:          { flexDirection:'row', justifyContent:'space-around',
                      paddingHorizontal:12, marginBottom:24 },
  dayCol:           { alignItems:'center', gap:4 },
  dowLabel:         { color:C.muted, fontSize:10 },
  dayCircle:        { width:34, height:34, borderRadius:17, alignItems:'center',
                      justifyContent:'center' },
  dayCircleActive:  { backgroundColor:C.cyan },
  dayCircleEmpty:   { backgroundColor:'#ffffff0D' },
  dayNum:           { color:C.muted, fontSize:13, fontWeight:'600' },
  dayNumActive:     { color:C.bg },
  dayDur:           { color:C.cyan, fontSize:9 },
  dayCard:          { backgroundColor:C.surface, borderRadius:12, padding:14,
                      marginHorizontal:16, marginBottom:8 },
  dayCardHeader:    { flexDirection:'row', justifyContent:'space-between', marginBottom:6 },
  dayCardDate:      { color:C.text, fontSize:14, fontWeight:'600' },
  dayCardSesi:      { color:C.muted, fontSize:13 },
  dayCardStats:     { flexDirection:'row', gap:16 },
  dayCardStat:      { color:C.muted, fontSize:13 },
  focusBg:          { height:3, backgroundColor:'#ffffff15', borderRadius:2, marginBottom:3 },
  focusFill:        { height:3, borderRadius:2 },
  focusText:        { fontSize:10 },
  empty:            { alignItems:'center', marginTop:60 },
  emptyText:        { color:C.muted, fontSize:15 },
});