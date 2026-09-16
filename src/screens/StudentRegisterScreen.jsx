// src/screens/StudentRegisterScreen.jsx — Redesign v2
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, StatusBar, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { API_BASE } from '../services/api';

const C = {
  bg:      '#0A0A12',
  surface: '#13131F',
  card:    '#1A1A2E',
  cyan:    '#00F0FF',
  magenta: '#FF2EC4',
  text:    '#FFFFFF',
  muted:   '#888899',
  border:  '#2A2A3F',
  error:   '#FF4466',
};

const KELAS_LIST = ['1','2','3','4','5','6','7','8','9'];

function CadasLogo({ small }) {
  return (
    <View style={{ alignItems: 'center', marginBottom: small ? 0 : 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Text style={{ color: C.cyan,  fontSize: small ? 22 : 32, fontWeight: '900' }}>C</Text>
        <Text style={{ color: C.text,  fontSize: small ? 22 : 32, fontWeight: '900' }}>ADA</Text>
        <Text style={{ color: C.cyan,  fontSize: small ? 22 : 32, fontWeight: '900' }}>S</Text>
      </View>
    </View>
  );
}

function InputField({ label, value, onChangeText, placeholder, keyboardType, maxLength, autoCapitalize }) {
  return (
    <View style={f.wrap}>
      <Text style={f.label}>{label}</Text>
      <TextInput
        style={f.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.muted}
        keyboardType={keyboardType || 'default'}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize || 'words'}
        autoCorrect={false}
      />
    </View>
  );
}

const f = StyleSheet.create({
  wrap:  { marginBottom: 18 },
  label: { color: C.muted, fontSize: 12, fontWeight: '600', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  input: { backgroundColor: C.surface, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, color: C.text, fontSize: 16, paddingHorizontal: 18, paddingVertical: 14 },
});

export default function StudentRegisterScreen({ navigation, route }) {
  const mode    = route?.params?.mode || 'register';
  const isLogin = mode === 'login';
  const { setAuth, setStudent, setPlacementDone } = useStore();
  const insets = useSafeAreaInsets();

  const [name,      setName]      = useState('');
  const [kelas,     setKelas]     = useState('');
  const [studentId, setStudentId] = useState('');
  const [loading,   setLoading]   = useState(false);

  async function handleRegister() {
    if (name.trim().length < 2) return Alert.alert('', 'Nama minimal 2 huruf.');
    const k = parseInt(kelas, 10);
    if (!k || k < 1 || k > 9) return Alert.alert('', 'Pilih kelas 1-9.');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/student/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), kelas }),
      });
      const data = await res.json();
      if (!res.ok) return Alert.alert('Gagal', data.error || 'Coba lagi.');
      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('authRole', 'student');
      await AsyncStorage.setItem('student', JSON.stringify(data.student));
      await AsyncStorage.setItem('placementDone', 'false');
      setAuth(data.token, 'student');
      setStudent(data.student);
      setPlacementDone(false);
      navigation.navigate('Placement', { student: data.student });
    } catch {
      Alert.alert('Error', 'Tidak bisa terhubung ke server.');
    } finally { setLoading(false); }
  }

  async function handleLogin() {
    if (!studentId.trim()) return Alert.alert('', 'Masukkan ID siswa.');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/auth/student/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_id: studentId.trim() }),
      });
      const data = await res.json();
      if (!res.ok) return Alert.alert('Gagal', data.error || 'ID tidak ditemukan.');
      const placementRes = await fetch(`${API_BASE}/api/placement/status/${data.student.id}`, {
        headers: { Authorization: `Bearer ${data.token}` },
      });
      const placementData = await placementRes.json();
      const done = placementData?.status === 'completed';
      await AsyncStorage.setItem('authToken', data.token);
      await AsyncStorage.setItem('authRole', 'student');
      await AsyncStorage.setItem('student', JSON.stringify(data.student));
      await AsyncStorage.setItem('placementDone', done ? 'true' : 'false');
      setAuth(data.token, 'student');
      setStudent(data.student);
      setPlacementDone(done);
    } catch {
      Alert.alert('Error', 'Tidak bisa terhubung ke server.');
    } finally { setLoading(false); }
  }

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 32 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}>

      <StatusBar barStyle="light-content" backgroundColor={C.bg} />

      {/* Back + Logo */}
      <View style={s.topRow}>
        <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Kembali</Text>
        </TouchableOpacity>
        <CadasLogo small />
        <View style={{ width: 80 }} />
      </View>

      {/* Judul */}
      <View style={s.titleWrap}>
        <Text style={s.title}>
          {isLogin ? 'Masuk ke Akunmu' : 'Buat Akun Baru'}
        </Text>
        <Text style={s.subtitle}>
          {isLogin
            ? 'Gunakan ID siswa yang sudah kamu punya'
            : 'Gratis — placement test otomatis setelah daftar'}
        </Text>
      </View>

      {/* Form */}
      <View style={s.formCard}>
        {isLogin ? (
          <>
            <InputField
              label="ID Siswa"
              value={studentId}
              onChangeText={setStudentId}
              placeholder="contoh: siswa_a1b2c3"
              autoCapitalize="none"
            />
            <Text style={s.hint}>
              💡 ID siswa diberikan saat pertama kali daftar. Minta ke orang tua atau cek layar profil.
            </Text>
          </>
        ) : (
          <>
            <InputField
              label="Nama Anak"
              value={name}
              onChangeText={setName}
              placeholder="Nama lengkap atau panggilan"
            />

            {/* Kelas picker */}
            <View style={f.wrap}>
              <Text style={f.label}>Kelas</Text>
              <View style={s.kelasGrid}>
                {KELAS_LIST.map((k) => (
                  <TouchableOpacity
                    key={k}
                    style={[s.kelasBtn, kelas === k && s.kelasBtnActive]}
                    onPress={() => setKelas(k)}
                    activeOpacity={0.75}>
                    <Text style={[s.kelasBtnText, kelas === k && s.kelasBtnTextActive]}>
                      {k}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, loading && { opacity: 0.7 }]}
          onPress={isLogin ? handleLogin : handleRegister}
          disabled={loading}
          activeOpacity={0.85}>
          {loading
            ? <ActivityIndicator color={C.bg} />
            : <Text style={s.submitText}>
                {isLogin ? 'Masuk →' : 'Daftar & Mulai Tes →'}
              </Text>}
        </TouchableOpacity>
      </View>

      {/* Switch mode */}
      <TouchableOpacity
        style={s.switchWrap}
        onPress={() => navigation.replace('StudentRegister', { mode: isLogin ? 'register' : 'login' })}>
        <Text style={s.switchText}>
          {isLogin
            ? 'Belum punya akun? Daftar gratis'
            : 'Sudah punya akun? Masuk di sini'}
        </Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:   { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24 },

  topRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 },
  backBtn:     { width: 80 },
  backText:    { color: C.muted, fontSize: 14, fontWeight: '500' },

  titleWrap:   { marginBottom: 28 },
  title:       { color: C.text, fontSize: 26, fontWeight: '900', marginBottom: 8 },
  subtitle:    { color: C.muted, fontSize: 14, lineHeight: 20 },

  formCard:    { backgroundColor: C.surface, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: C.border, marginBottom: 20 },

  hint:        { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: -8, marginBottom: 20 },

  kelasGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kelasBtn:    { width: 52, height: 52, borderRadius: 14, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  kelasBtnActive:     { backgroundColor: C.cyan, borderColor: C.cyan },
  kelasBtnText:       { color: C.muted, fontSize: 18, fontWeight: '700' },
  kelasBtnTextActive: { color: C.bg },

  submitBtn:   { backgroundColor: C.cyan, borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  submitText:  { color: C.bg, fontSize: 16, fontWeight: '900', letterSpacing: 0.5 },

  switchWrap:  { alignItems: 'center', paddingVertical: 8 },
  switchText:  { color: C.cyan, fontSize: 14, fontWeight: '500' },
});

