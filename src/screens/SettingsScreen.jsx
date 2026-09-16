// src/screens/SettingsScreen.jsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { API_BASE } from '../services/api';

const C = { bg: '#0A0A12', surface: '#13131F', cyan: '#00F0FF', text: '#FFFFFF', muted: '#888899', error: '#FF4466' };

export default function SettingsScreen() {
  const { student, clearAuth, authToken } = useStore();
  const insets = useSafeAreaInsets();
  const [teacherCode, setTeacherCode] = React.useState('');
  const [linking, setLinking] = React.useState(false);
  const [linkedTeacher, setLinkedTeacher] = React.useState(null);

  async function handleLinkTeacher() {
    const code = teacherCode.trim().toUpperCase();
    if (code.length !== 6) return Alert.alert('', 'Kode guru harus 6 karakter.');
    setLinking(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/student/link-teacher`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ teacher_code: code }),
      });
      const data = await res.json();
      if (!res.ok) return Alert.alert('Gagal', data.error || 'Coba lagi.');
      setLinkedTeacher(data.teacher);
      setTeacherCode('');
      Alert.alert('Berhasil!', `Kamu sekarang terhubung ke ${data.teacher?.display_name || 'guru'}.`);
    } catch { Alert.alert('Error', 'Tidak bisa terhubung ke server.'); }
    finally { setLinking(false); }
  }

  async function handleLogout() {
    Alert.alert('Keluar', 'Yakin ingin keluar dari akun ini?', [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Keluar', style: 'destructive', onPress: async () => {
          await AsyncStorage.multiRemove([
            'authToken', 'authRole', 'student', 'placementDone',
            'parentToken', 'parent',
            'teacherToken', 'teacher',
            'referrerToken', 'referrer',
          ]);
          clearAuth();
        }
      }
    ]);
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={[s.inner, { paddingTop: insets.top + 24 }]}>
      <Text style={s.title}>Pengaturan</Text>

      <View style={s.card}>
        <Text style={s.cardLabel}>Akun Siswa</Text>
        <Text style={s.cardValue}>{student?.name || '—'}</Text>
        <Text style={s.cardSub}>Kelas {student?.kelas || '—'} · ID: {student?.id?.slice(0, 8) || '—'}...</Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardLabel}>Level Saat Ini</Text>
        <Text style={s.cardValue}>Level {student?.current_level || student?.trial_level || 1}</Text>
      </View>

      <View style={s.card}>
        <Text style={s.cardLabel}>Hubungkan ke Guru</Text>
        {linkedTeacher ? (
          <Text style={s.cardValue}>Terhubung ke {linkedTeacher.display_name}</Text>
        ) : (
          <>
            <TextInput
              style={s.codeInput}
              value={teacherCode}
              onChangeText={setTeacherCode}
              placeholder="Kode guru (6 karakter)"
              placeholderTextColor={C.muted}
              autoCapitalize="characters"
              maxLength={6}
            />
            <TouchableOpacity
              style={[s.linkBtn, linking && { opacity: 0.6 }]}
              onPress={handleLinkTeacher}
              disabled={linking}
            >
              {linking
                ? <ActivityIndicator color={C.bg} />
                : <Text style={s.linkBtnText}>Hubungkan</Text>}
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={s.section}>
        <Text style={s.sectionTitle}>Informasi</Text>
        <Text style={s.infoText}>Cadas Matematika v1.0.0</Text>
        <Text style={s.infoText}>Untuk bantuan, hubungi admin via WhatsApp.</Text>
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>Keluar dari Akun</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:       { flex: 1, backgroundColor: C.bg },
  inner:        { paddingHorizontal: 24, paddingBottom: 48 },
  title:        { color: C.text, fontSize: 24, fontWeight: 'bold', marginBottom: 28 },
  card:         { backgroundColor: C.surface, borderRadius: 16, padding: 20, marginBottom: 14 },
  cardLabel:    { color: C.muted, fontSize: 12, marginBottom: 4 },
  cardValue:    { color: C.text, fontSize: 18, fontWeight: 'bold', marginBottom: 2 },
  codeInput:    { backgroundColor: C.bg, borderRadius: 10, padding: 12, color: C.text,
                  fontSize: 15, borderWidth: 1, borderColor: '#ffffff22', marginTop: 8 },
  linkBtn:      { backgroundColor: C.cyan, borderRadius: 10, paddingVertical: 12,
                  alignItems: 'center', marginTop: 10 },
  linkBtnText:  { color: C.bg, fontSize: 14, fontWeight: 'bold' },
  cardSub:      { color: C.muted, fontSize: 12 },
  section:      { marginTop: 16, marginBottom: 24 },
  sectionTitle: { color: C.muted, fontSize: 12, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  infoText:     { color: C.muted, fontSize: 14, marginBottom: 6 },
  logoutBtn:    { borderWidth: 1, borderColor: C.error, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  logoutText:   { color: C.error, fontSize: 15, fontWeight: '600' },
});
