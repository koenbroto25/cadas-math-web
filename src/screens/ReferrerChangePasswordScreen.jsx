// src/screens/ReferrerChangePasswordScreen.jsx
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet,
         Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { API_BASE } from '../services/api';

const C = { bg:'#0A0A12', surface:'#13131F', cyan:'#00F0FF', text:'#FFFFFF', muted:'#888899' };

export default function ReferrerChangePasswordScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { referrerToken } = useStore();
  const [oldPass,  setOldPass]  = useState('');
  const [newPass,  setNewPass]  = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSave() {
    if (!oldPass)          return Alert.alert('', 'Masukkan password lama.');
    if (newPass.length < 8) return Alert.alert('', 'Password baru minimal 8 karakter.');
    if (newPass !== confirm) return Alert.alert('', 'Konfirmasi password tidak cocok.');
    setLoading(true);
    try {
      const token = referrerToken || await AsyncStorage.getItem('referrerToken');
      const res   = await fetch(`${API_BASE}/api/referrer/password`, {
        method: 'PUT',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ old_password:oldPass, new_password:newPass }),
      });
      const data = await res.json();
      if (!res.ok) return Alert.alert('Gagal', data.error || 'Coba lagi.');
      Alert.alert('Berhasil', 'Password berhasil diperbarui.', [
        { text:'OK', onPress:() => navigation.goBack() }
      ]);
    } catch { Alert.alert('Error', 'Tidak bisa terhubung ke server.'); }
    finally  { setLoading(false); }
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={[s.inner, { paddingTop: insets.top + 16 }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
        <Text style={s.back}>? Kembali</Text>
      </TouchableOpacity>
      <Text style={s.title}>Ganti Password</Text>
      <Text style={s.sub}>Password minimal 8 karakter</Text>

      <Text style={s.label}>Password Lama</Text>
      <TextInput style={s.input} value={oldPass} onChangeText={setOldPass}
        placeholder="Password saat ini" placeholderTextColor={C.muted} secureTextEntry />

      <Text style={s.label}>Password Baru</Text>
      <TextInput style={s.input} value={newPass} onChangeText={setNewPass}
        placeholder="Min. 8 karakter" placeholderTextColor={C.muted} secureTextEntry />

      <Text style={s.label}>Konfirmasi Password Baru</Text>
      <TextInput style={s.input} value={confirm} onChangeText={setConfirm}
        placeholder="Ulangi password baru" placeholderTextColor={C.muted} secureTextEntry />

      <TouchableOpacity style={s.btn} onPress={handleSave} disabled={loading}>
        {loading
          ? <ActivityIndicator color={C.bg} />
          : <Text style={s.btnText}>Simpan Password Baru</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:  { flex:1, backgroundColor:C.bg },
  inner:   { paddingHorizontal:24, paddingBottom:48 },
  backBtn: { marginBottom:20 },
  back:    { color:C.muted, fontSize:15 },
  title:   { color:C.text, fontSize:22, fontWeight:'bold', marginBottom:6 },
  sub:     { color:C.muted, fontSize:14, marginBottom:32 },
  label:   { color:C.muted, fontSize:13, marginBottom:6, marginTop:20 },
  input:   { backgroundColor:C.surface, borderRadius:12, padding:16, color:C.text,
             fontSize:16, borderWidth:1, borderColor:'#ffffff22' },
  btn:     { backgroundColor:C.cyan, borderRadius:16, paddingVertical:18,
             alignItems:'center', marginTop:36 },
  btnText: { color:C.bg, fontSize:16, fontWeight:'bold' },
});
