import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { api } from '../services/api';

const C = { bg: '#0A0A12', surface: '#13131F', cyan: '#00F0FF', text: '#FFFFFF', muted: '#888899' };

export default function PartnerInviteScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const token = String(route?.params?.inviteToken || '').trim();
  const { setReferrerAuth } = useStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function register() {
    if (!token) return Alert.alert('Invite tidak valid', 'Buka link undangan yang diberikan admin/head marketing.');
    if (name.trim().length < 2 || !email.includes('@') || password.length < 8) {
      return Alert.alert('Data belum lengkap', 'Nama minimal 2 huruf, email valid, dan password minimal 8 karakter.');
    }
    setLoading(true);
    try {
      const data = await api.partnerInviteRegister({ invite_token: token, full_name: name.trim(), email: email.trim(), password });
      await AsyncStorage.setItem('referrerToken', data.token);
      await AsyncStorage.setItem('referrerProfile', JSON.stringify(data.referrer));
      setReferrerAuth(data.token, data.referrer);
      Alert.alert('Akun berhasil dibuat', 'Silakan masuk ke dashboard partner.', [
        { text: 'Buka Dashboard', onPress: () => navigation.replace('ReferrerDashboard') },
      ]);
    } catch (error) {
      Alert.alert('Invite ditolak', error.message || 'Kode sudah dipakai, kedaluwarsa, atau dicabut.');
    } finally { setLoading(false); }
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={[s.inner, { paddingTop: insets.top + 28 }]}>
      <Text style={s.title}>Daftar Partner Cadas</Text>
      <Text style={s.sub}>Akun ini dibuat melalui undangan resmi admin atau Head Marketing.</Text>
      <Text style={s.label}>Nama lengkap</Text>
      <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Nama Anda" placeholderTextColor={C.muted} autoCapitalize="words" />
      <Text style={s.label}>Email</Text>
      <TextInput style={s.input} value={email} onChangeText={setEmail} placeholder="email@contoh.com" placeholderTextColor={C.muted} keyboardType="email-address" autoCapitalize="none" />
      <Text style={s.label}>Password</Text>
      <TextInput style={s.input} value={password} onChangeText={setPassword} placeholder="Minimal 8 karakter" placeholderTextColor={C.muted} secureTextEntry />
      <TouchableOpacity style={s.btn} onPress={register} disabled={loading}>
        {loading ? <ActivityIndicator color={C.bg} /> : <Text style={s.btnText}>Buat Akun Partner</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={s.back} onPress={() => navigation.goBack()}><Text style={s.backText}>← Kembali</Text></TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: C.bg }, inner: { paddingHorizontal: 24, paddingBottom: 48 },
  title: { color: C.text, fontSize: 25, fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  sub: { color: C.muted, fontSize: 13, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  label: { color: C.muted, fontSize: 13, marginTop: 14, marginBottom: 6 },
  input: { backgroundColor: C.surface, borderRadius: 12, padding: 15, color: C.text, borderWidth: 1, borderColor: '#ffffff22' },
  btn: { backgroundColor: C.cyan, borderRadius: 14, paddingVertical: 17, alignItems: 'center', marginTop: 28 },
  btnText: { color: C.bg, fontSize: 16, fontWeight: 'bold' }, back: { alignItems: 'center', marginTop: 20 },
  backText: { color: C.muted, fontSize: 14 },
});
