// src/screens/TeacherAuthScreen.jsx - Sprint F.4
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet,
         Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { API_BASE } from '../services/api';

const C = { bg:'#0A0A12', surface:'#13131F', cyan:'#00F0FF', text:'#FFFFFF', muted:'#888899', green:'#00FF9D' };

export default function TeacherAuthScreen({ navigation }) {
  const { setTeacherAuth } = useStore();
  const insets = useSafeAreaInsets();
  const [mode,      setMode]      = useState('login');
  const [name,      setName]      = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [type,      setType]      = useState('school');
  const [loading,   setLoading]   = useState(false);

  async function handleRegister() {
    if (name.trim().length < 2)     return Alert.alert('', 'Nama minimal 2 huruf.');
    if (!email.includes('@'))       return Alert.alert('', 'Email tidak valid.');
    if (password.length < 6)        return Alert.alert('', 'Password minimal 6 karakter.');
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/auth/teacher/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password, teacher_type: type }),
      });
      const data = await res.json();
      if (!res.ok) return Alert.alert('Gagal', data.error || 'Coba lagi.');
      await finalize(data.token, data.teacher ?? { id: data.teacher_id, display_name: name.trim(), teacher_type: type });
    } catch { Alert.alert('Error', 'Tidak bisa terhubung ke server.'); }
    finally   { setLoading(false); }
  }

  async function handleLogin() {
    if (!email.trim()) return Alert.alert('', 'Masukkan email.');
    if (!password)     return Alert.alert('', 'Masukkan password.');
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/auth/teacher/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) return Alert.alert('Gagal', data.error || 'Email atau password salah.');
      await finalize(data.token, { id: data.teacher_id, display_name: data.teacher?.display_name || data.display_name || data.name, teacher_type: data.teacher_type });
    } catch { Alert.alert('Error', 'Tidak bisa terhubung ke server.'); }
    finally   { setLoading(false); }
  }

  async function finalize(token, teacher) {
    await AsyncStorage.setItem('teacherToken', token);
    await AsyncStorage.setItem('teacher', JSON.stringify(teacher));
    setTeacherAuth(token, teacher);
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={[s.inner, { paddingTop: insets.top + 24 }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
        <Text style={s.backText}>← Kembali</Text>
      </TouchableOpacity>
      <Text style={s.title}>{mode === 'login' ? 'Masuk Akun Guru' : 'Daftar Akun Guru'}</Text>
      <Text style={s.sub}>Dashboard pemantauan progress murid</Text>

      <View style={s.tabs}>
        {['login','register'].map(m => (
          <TouchableOpacity key={m} style={[s.tab, mode === m && s.tabActive]} onPress={() => setMode(m)}>
            <Text style={[s.tabText, mode === m && s.tabTextActive]}>
              {m === 'login' ? 'Masuk' : 'Daftar'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'register' && (
        <>
          <Text style={s.label}>Nama Lengkap</Text>
          <TextInput style={s.input} value={name} onChangeText={setName}
            placeholder="Nama guru" placeholderTextColor={C.muted} autoCapitalize="words" />
          <Text style={s.label}>Tipe Guru</Text>
          <View style={s.typeTabs}>
            {[['school','Guru Sekolah'],['private','Guru Privat']].map(([val, lbl]) => (
              <TouchableOpacity key={val} style={[s.typeTab, type === val && s.typeTabActive]}
                onPress={() => setType(val)}>
                <Text style={[s.typeTabText, type === val && s.typeTabTextActive]}>{lbl}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      <Text style={s.label}>Email</Text>
      <TextInput style={s.input} value={email} onChangeText={setEmail}
        placeholder="email@sekolah.com" placeholderTextColor={C.muted}
        keyboardType="email-address" autoCapitalize="none" />
      <Text style={s.label}>Password</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput style={[s.input, { flex: 1 }]} value={password} onChangeText={setPassword}
          placeholder={mode === 'register' ? 'Min. 6 karakter' : 'Password'}
          placeholderTextColor={C.muted} secureTextEntry={!showPassword} />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ marginLeft: 8, padding: 8 }}>
          <Text style={{ color: C.cyan, fontSize: 16 }}>{showPassword ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.btn}
        onPress={mode === 'login' ? handleLogin : handleRegister} disabled={loading}>
        {loading
          ? <ActivityIndicator color={C.bg} />
          : <Text style={s.btnText}>{mode === 'login' ? 'Masuk →' : 'Daftar →'}</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:           { flex:1, backgroundColor:C.bg },
  inner:            { paddingHorizontal:24, paddingBottom:48 },
  back:             { marginBottom:24 },
  backText:         { color:C.muted, fontSize:15 },
  title:            { color:C.text, fontSize:24, fontWeight:'bold', marginBottom:6 },
  sub:              { color:C.muted, fontSize:14, marginBottom:24 },
  tabs:             { flexDirection:'row', backgroundColor:C.surface, borderRadius:12, padding:4, marginBottom:24 },
  tab:              { flex:1, paddingVertical:10, alignItems:'center', borderRadius:10 },
  tabActive:        { backgroundColor:C.cyan },
  tabText:          { color:C.muted, fontSize:15, fontWeight:'600' },
  tabTextActive:    { color:C.bg },
  typeTabs:         { flexDirection:'row', gap:8, marginBottom:8 },
  typeTab:          { flex:1, backgroundColor:C.surface, borderRadius:10, paddingVertical:12,
                      alignItems:'center', borderWidth:1, borderColor:'#ffffff11' },
  typeTabActive:    { borderColor:C.green },
  typeTabText:      { color:C.muted, fontSize:13, fontWeight:'600' },
  typeTabTextActive:{ color:C.green },
  label:            { color:C.muted, fontSize:13, marginBottom:6, marginTop:16 },
  input:            { backgroundColor:C.surface, borderRadius:12, padding:16, color:C.text,
                      fontSize:16, borderWidth:1, borderColor:'#ffffff22' },
  btn:              { backgroundColor:C.cyan, borderRadius:16, paddingVertical:18,
                      alignItems:'center', marginTop:32 },
  btnText:          { color:C.bg, fontSize:16, fontWeight:'bold' },
});
