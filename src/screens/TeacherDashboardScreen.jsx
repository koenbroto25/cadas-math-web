// src/screens/TeacherDashboardScreen.jsx - Sprint F.5
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet,
         ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { API_BASE } from '../services/api';

const C = { bg:'#0A0A12', surface:'#13131F', cyan:'#00F0FF', text:'#FFFFFF',
            muted:'#888899', green:'#00FF9D', yellow:'#FFD700' };

function Badge({ label, value, color }) {
  return (
    <View style={s.badge}>
      <Text style={[s.badgeVal, color && { color }]}>{value ?? '-'}</Text>
      <Text style={s.badgeLabel}>{label}</Text>
    </View>
  );
}

export default function TeacherDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { clearTeacherAuth } = useStore();
  const [teacher,    setTeacher]    = useState(null);
  const [marketing,  setMarketing]  = useState(null);
  const [students,   setStudents]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load(isRefresh = false) {
    isRefresh ? setRefreshing(true) : setLoading(true);
    try {
      const token = await AsyncStorage.getItem('teacherToken');
      const raw   = await AsyncStorage.getItem('teacher');
      if (raw) setTeacher(JSON.parse(raw));

      const [meRes, stuRes] = await Promise.all([
        fetch(`${API_BASE}/api/teacher/me`,       { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/api/teacher/students`,  { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (meRes.status === 401) { await handleLogout(); return; }
      const me  = await meRes.json();
      const stu = await stuRes.json();
      setTeacher(me.teacher);
      setMarketing(me.marketing || null);
      setStudents(stu.students || []);
    } catch { Alert.alert('Error', 'Gagal memuat data.'); }
    finally  { isRefresh ? setRefreshing(false) : setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleLogout() {
    await AsyncStorage.multiRemove(['teacherToken','teacher']);
    clearTeacherAuth();
  }

  const akurasi = (s) => s.total_soal
    ? Math.round((s.total_benar / s.total_soal) * 100) + '%' : '-';

  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'short' }) : 'Belum';

  function renderStudent({ item }) {
    return (
      <TouchableOpacity style={s.card}
        onPress={() => navigation.navigate('StudentDetail', { student: item })}>
        <View style={s.cardHeader}>
          <View>
            <Text style={s.name}>{item.display_name}</Text>
            <Text style={s.sub}>Kelas {item.grade_level || '?'} · @{item.username}</Text>
          </View>
          <Text style={s.arrow}>›</Text>
        </View>
        <View style={s.badgeRow}>
          <Badge label="Level"    value={item.current_level} color={C.cyan} />
          <Badge label="Sesi"     value={item.total_sessions} />
          <Badge label="Akurasi"  value={akurasi(item)} color={C.green} />
          <Badge label="Terakhir" value={fmtDate(item.last_session_at)} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <View>
          <Text style={s.greeting}>
            {teacher?.display_name?.split(' ')[0] || 'Guru'} 👋
          </Text>
          <Text style={s.headerSub}>
            {teacher?.teacher_type === 'school' ? 'Guru Sekolah' : 'Guru Privat'}
            {' · '}{(teacher?.total_students ?? students.length)} murid
          </Text>
          {marketing && (
            <Text style={s.feeLine}>
              Fee {marketing.tier?.rate ?? 0}% · {marketing.tier?.paid ?? 0} direct bayar
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={s.logout}>Keluar</Text>
        </TouchableOpacity>
      </View>

      {loading
        ? <ActivityIndicator color={C.cyan} size="large" style={{ marginTop:60 }} />
        : <FlatList
            data={students}
            keyExtractor={i => i.id}
            renderItem={renderStudent}
            contentContainerStyle={{ padding:16, paddingBottom:40 }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={C.cyan} />}
            ListEmptyComponent={
              <View style={s.empty}>
                <Text style={s.emptyText}>Belum ada murid terhubung.</Text>
                <Text style={s.emptyHint}>Minta murid login lalu hubungkan via kode guru.</Text>
              </View>
            }
          />
      }
    </View>
  );
}

const s = StyleSheet.create({
  container:   { flex:1, backgroundColor:C.bg },
  header:      { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start',
                 paddingHorizontal:20, paddingVertical:16,
                 borderBottomWidth:1, borderBottomColor:'#ffffff11' },
  greeting:    { color:C.text, fontSize:20, fontWeight:'bold' },
  headerSub:   { color:C.muted, fontSize:13, marginTop:2 },
  feeLine:     { color:C.cyan, fontSize:12, marginTop:5 },
  logout:      { color:C.muted, fontSize:14, paddingTop:4 },
  card:        { backgroundColor:C.surface, borderRadius:16, padding:18, marginBottom:14 },
  cardHeader:  { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 },
  name:        { color:C.text, fontSize:17, fontWeight:'bold' },
  sub:         { color:C.muted, fontSize:12, marginTop:3 },
  arrow:       { color:C.muted, fontSize:24 },
  badgeRow:    { flexDirection:'row', gap:8 },
  badge:       { flex:1, backgroundColor:'#ffffff0D', borderRadius:10, padding:10, alignItems:'center' },
  badgeVal:    { color:C.text, fontSize:16, fontWeight:'bold' },
  badgeLabel:  { color:C.muted, fontSize:10, marginTop:3, textAlign:'center' },
  empty:       { alignItems:'center', marginTop:80 },
  emptyText:   { color:C.muted, fontSize:16, marginBottom:8 },
  emptyHint:   { color:C.muted + '88', fontSize:13, textAlign:'center' },
});

