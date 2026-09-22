// src/screens/ReferrerLoginScreen.jsx
// Patch: marketing type â†’ auto masuk demo mode setelah login
import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, StyleSheet, View,
         Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { API_BASE } from '../services/api';

const C = { bg:'#0A0A12', surface:'#13131F', cyan:'#00F0FF', text:'#FFFFFF', muted:'#888899' };

export default function ReferrerLoginScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { setReferrerAuth, setDemoMode } = useStore();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading,  setLoading]  = useState(false);

  async function handleLogin() {
    if (!email.trim().includes('@')) return Alert.alert('', 'Masukkan email yang valid.');
    if (password.length < 6)         return Alert.alert('', 'Password minimal 6 karakter.');
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/referrer/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) return Alert.alert('Gagal', data.error || 'Email atau password salah.');

      await AsyncStorage.setItem('referrerToken',   data.token);
      await AsyncStorage.setItem('referrerProfile', JSON.stringify(data.referrer));
      setReferrerAuth(data.token, data.referrer);

      // Marketing type â†’ aktifkan demo mode (auto-exit 30 menit)
      if (data.referrer?.type === 'marketing') {
        // Deadline demo DISIMPAN: timer tidak boleh reset saat refresh,
        // kalau tidak demo marketing tidak pernah berakhir (lihat App.jsx).
        const demoExpiresAt = Date.now() + 30 * 60 * 1000;
        await AsyncStorage.setItem('referrerDemoExpiresAt', String(demoExpiresAt));
        setDemoMode('marketing', data.referrer.full_name || 'Marketing Demo', demoExpiresAt);
        navigation.replace('DemoHome');
      } else {
        navigation.replace('ReferrerDashboard');
      }
    } catch { Alert.alert('Error', 'Tidak bisa terhubung ke server.'); }
    finally  { setLoading(false); }
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={[s.inner, { paddingTop: insets.top + 32 }]}>
      <View style={{ alignItems: 'center', marginBottom: 8 }}>
  <View style={{ flexDirection: 'row' }}>
    <Text style={{ color: '#00F0FF', fontSize: 36, fontWeight: '900', textShadowColor: '#00F0FF', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16 }}>C</Text>
    <Text style={{ color: '#FFFFFF', fontSize: 36, fontWeight: '900', textShadowColor: '#FFFFFF', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 }}>ADA</Text>
    <Text style={{ color: '#00F0FF', fontSize: 36, fontWeight: '900', textShadowColor: '#00F0FF', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 16 }}>S</Text>
  </View>
</View>
      <Text style={s.title}>Portal Referrer</Text>
      <Text style={s.sub}>Masuk untuk melihat statistik dan komisi Anda</Text>

      <Text style={s.label}>Email</Text>
      <TextInput style={s.input} value={email} onChangeText={setEmail}
        placeholder="email@contoh.com" placeholderTextColor={C.muted}
        keyboardType="email-address" autoCapitalize="none" />

      <Text style={s.label}>Password</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput style={[s.input, { flex: 1 }]} value={password} onChangeText={setPassword}
          placeholder="Password" placeholderTextColor={C.muted} secureTextEntry={!showPassword} />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ marginLeft: 8, padding: 8 }}>
          <Text style={{ color: C.cyan, fontSize: 16 }}>{showPassword ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
        {loading
          ? <ActivityIndicator color={C.bg} />
          : <Text style={s.btnText}>Masuk âš¡</Text>
        }
      </TouchableOpacity>

      <Text style={s.hint}>Belum punya akun? Hubungi admin Cadas.</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:  { flex:1, backgroundColor:C.bg },
  inner:   { paddingHorizontal:24, paddingBottom:48 },
  logo:    { fontSize:32, textAlign:'center', marginBottom:8 },
  title:   { color:C.text, fontSize:26, fontWeight:'bold', textAlign:'center', marginBottom:6 },
  sub:     { color:C.muted, fontSize:14, textAlign:'center', marginBottom:40 },
  label:   { color:C.muted, fontSize:13, marginBottom:6, marginTop:20 },
  input:   { backgroundColor:C.surface, borderRadius:12, padding:16, color:C.text,
             fontSize:16, borderWidth:1, borderColor:'#ffffff22' },
  btn:     { backgroundColor:C.cyan, borderRadius:16, paddingVertical:18,
             alignItems:'center', marginTop:36 },
  btnText: { color:C.bg, fontSize:16, fontWeight:'bold' },
  hint:    { color:C.muted, fontSize:13, textAlign:'center', marginTop:24 },
});
