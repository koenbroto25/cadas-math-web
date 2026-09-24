// src/screens/ParentAuthScreen.jsx
// Register/login orang tua + auto-link ke student setelah placement
// Flow: RoleSelect -> ParentAuth -> ParentDashboard (via isParent di App.jsx)
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet,
         Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { API_BASE, api } from '../services/api';
import { registerFcmToken } from '../utils/fcmToken';

const C = { bg:'#0A0A12', surface:'#13131F', cyan:'#00F0FF', text:'#FFFFFF', muted:'#888899' };

export default function ParentAuthScreen({ navigation, route }) {
  const student          = route?.params?.student;
  const refCode           = route?.params?.ref;   // deep-link ?ref=XXXX (ID anak lama)
  const inviteCodeParam   = route?.params?.inviteCode; // A2: ?code=CADAS-XXXX (invite baru)
  const { setParentAuth, parentToken, parentProfile } = useStore();
  // A2: redeem SESUDAH auth. Jika datang dengan kode tapi belum login,
  // kode disimpan di state; auto-redeem jalan setelah finalize() sukses.
  // ID anak dan kode invite berasal dari URL web /parent/join?code=...
  const [inviteCode, setInviteCode] = useState(inviteCodeParam || '');
  const [inviteLoading, setInviteLoading] = useState(false);
  const autoRedeemRef = useRef(false);
  const insets           = useSafeAreaInsets();
  const [mode,     setMode]     = useState('register');
  const [name,     setName]     = useState('');
  const [email,    setEmail]    = useState('');
  const [phone,    setPhone]    = useState('');
  const [password, setPassword] = useState('');
  const [childId,  setChildId]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [storedReferral, setStoredReferral] = useState('');

  useEffect(() => {
    AsyncStorage.getItem('referralCode').then(v => setStoredReferral(String(v || '').trim())).catch(() => {});
  }, []);

  // Jika datang dari deep-link ?ref=..., isi childId otomatis
  useEffect(() => {
    if (refCode && !childId) setChildId(refCode);
  }, [refCode]);

  async function handleRegister() {
    if (name.trim().length < 2)      return Alert.alert('', 'Nama minimal 2 huruf.');
    if (!email.trim().includes('@'))  return Alert.alert('', 'Email tidak valid.');
    if (!phone.trim())               return Alert.alert('', 'Nomor HP wajib diisi.');
    if (password.length < 6)         return Alert.alert('', 'Password minimal 6 karakter.');
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/auth/parent/register`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          name: name.trim(), email: email.trim(),
          phone: phone.trim(), password,
          child_id: childId.trim() || undefined,
          referral_code: storedReferral || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) return Alert.alert('Gagal', data.error || 'Coba lagi.');
      await finalize(data.token, data.parent ?? { id: data.parent_id, display_name: name.trim() }, data.linked_children);
    } catch { Alert.alert('Error', 'Tidak bisa terhubung ke server.'); }
    finally  { setLoading(false); }
  }

  // Auto-redeem ketika parent sudah login sebelumnya dan membuka link web.
  useEffect(() => {
    const code = String(inviteCodeParam || '').trim().toUpperCase();
    if (!code || !parentToken || !parentProfile?.id || autoRedeemRef.current) return;
    autoRedeemRef.current = true;
    api.inviteRedeem({ code }, parentToken)
      .then((rdata) => {
        const tr = rdata.transferred_levels > 0 ? ` + ${rdata.transferred_levels} level standby` : '';
        Alert.alert('Berhasil!', `Anak terhubung${tr}.`);
      })
      .catch((error) => Alert.alert('Kode gagal dipakai', inviteErrorText({ status: error.status, message: error.message })));
  }, [inviteCodeParam, parentToken, parentProfile?.id]);

  async function handleRedeemManual() {
    const code = String(inviteCode || '').trim().toUpperCase();
    if (code.length < 6) return Alert.alert('', 'Masukkan kode undangan dari anak.');
    if (!parentToken || !parentProfile?.id) {
      Alert.alert('', 'Daftar/masuk dulu sebagai orang tua, kode akan otomatis dipakai setelah masuk.');
      return;
    }
    setInviteLoading(true);
    try {
      const rdata = await api.inviteRedeem({ code }, parentToken);
      const tr = rdata.transferred_levels > 0 ? ` + ${rdata.transferred_levels} level standby` : '';
      Alert.alert('Berhasil!', `Anak terhubung${tr}.`, [
        { text: 'Lihat Dashboard', onPress: () => navigation.replace('ParentDashboard') },
      ]);
    } catch (error) {
      Alert.alert('Kode gagal dipakai', inviteErrorText({ status: error.status, message: error.message }));
    } finally { setInviteLoading(false); }
  }

  function inviteErrorText(e) {
    if (e?.status === 404) return 'Kode tidak ditemukan. Periksa kembali kode dari anak.';
    if (e?.status === 409) return 'Kode sudah dipakai. Minta anak buatkan kode baru.';
    if (e?.status === 410) return 'Kode kedaluwarsa/diganti. Minta anak buatkan kode baru.';
    return String(e?.message || 'Coba lagi.');
  }

  async function handleLogin() {
    if (!email.trim()) return Alert.alert('', 'Masukkan email.');
    if (!password)     return Alert.alert('', 'Masukkan password.');
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/auth/parent/login`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) return Alert.alert('Gagal', data.error || 'Email atau password salah.');
      await finalize(data.token, data.parent ?? { id: data.parent_id }, data.linked_children);
    } catch { Alert.alert('Error', 'Tidak bisa terhubung ke server.'); }
    finally  { setLoading(false); }
  }

  async function finalize(token, parent, linkedChildren = null) {
    // A2: redeem SESUDAH auth — auto-redeem kode invite bila ada.
    const pendingCode = String(inviteCodeParam || inviteCode || '').trim().toUpperCase();
    if (pendingCode && !autoRedeemRef.current && parent?.id) {
      autoRedeemRef.current = true;
      try {
        const rdata = await api.inviteRedeem({ code: pendingCode }, token);
        const tr = rdata.transferred_levels > 0 ? ` + ${rdata.transferred_levels} level standby` : '';
        Alert.alert('Berhasil!', `Anak terhubung${tr}.`);
      } catch (error) {
        Alert.alert('Kode gagal dipakai', inviteErrorText({ status: error.status, message: error.message }));
      }
    }
    // Persist ke AsyncStorage
    await AsyncStorage.setItem('parentToken', token);
    await AsyncStorage.setItem('parent', JSON.stringify(parent));
    if (linkedChildren) {
      await AsyncStorage.setItem('parentLinkedChildren', JSON.stringify(linkedChildren));
    }

    // Link child jika flow datang dari PlacementResult (non-fatal)
    if (student?.display_id && token) {
      try {
        const r = await fetch(`${API_BASE}/api/auth/parent/add-child`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body:    JSON.stringify({ child_id: student.display_id }),
        });
        if (r.ok) {
          const data = await r.json();
          if (data.linked_children) {
            await AsyncStorage.setItem('parentLinkedChildren', JSON.stringify(data.linked_children));
          }
        }
      } catch { /* non-fatal */ }
    }

    // Update Zustand state -> App.jsx deteksi isParent -> render Parent Stack
    setParentAuth(token, parent);

    // Daftarkan FCM device token ke backend (non-blocking)
    registerFcmToken(token).catch(() => {});
  }

  return (
    <ScrollView style={s.scroll} contentContainerStyle={[s.inner, { paddingTop: insets.top + 24 }]}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={s.back}>
        <Text style={s.backText}>← Kembali</Text>
      </TouchableOpacity>
      <Text style={s.title}>
        {mode === 'register' ? 'Daftar Akun Orang Tua' : 'Masuk Akun Orang Tua'}
      </Text>
      {student?.display_name
        ? <Text style={s.sub}>Untuk memantau progres {student.display_name}</Text>
        : <Text style={s.sub}>Pantau perkembangan belajar anak Anda</Text>
      }

      <View style={s.tabs}>
        {['register','login'].map(m => (
          <TouchableOpacity key={m} style={[s.tab, mode === m && s.tabActive]} onPress={() => setMode(m)}>
            <Text style={[s.tabText, mode === m && s.tabTextActive]}>
              {m === 'register' ? 'Daftar' : 'Masuk'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mode === 'register' && (
        <>
          <Text style={s.label}>Nama Lengkap</Text>
          <TextInput style={s.input} value={name} onChangeText={setName}
            placeholder="Nama orang tua" placeholderTextColor={C.muted} autoCapitalize="words" />
          <Text style={s.label}>Nomor HP (wajib)</Text>
          <TextInput style={s.input} value={phone} onChangeText={setPhone}
            placeholder="08xxxxxxxxxx" placeholderTextColor={C.muted} keyboardType="phone-pad" />
          <Text style={s.label}>ID Anak (opsional — isi jika ada)</Text>
          <TextInput style={[s.input, childId.length > 0 && s.inputFilled]}
            value={childId} onChangeText={setChildId}
            placeholder={refCode ? `Terisi dari tautan: ${refCode}` : 'Contoh: B7KM'}
            placeholderTextColor={C.muted} autoCapitalize="characters"
            editable={!refCode} />
          {refCode && (
            <Text style={s.hint}>ID anak terisi otomatis dari tautan. Ubah hanya jika perlu.</Text>
          )}
          {/* A2: redeem kode invite SESUDAH login — kolom selalu tampil agar ortu
              yang sudah login pun bisa menempel kode dari anak. */}
          <Text style={s.label}>Kode Undangan Anak (opsional)</Text>
          <TextInput style={[s.input, inviteCode.length > 0 && s.inputFilled]}
            value={inviteCode} onChangeText={(t) => setInviteCode(t.toUpperCase())}
            placeholder={inviteCodeParam ? `Terisi dari tautan: ${inviteCodeParam}` : 'Contoh: CADAS-AB12CD34'}
            placeholderTextColor={C.muted} autoCapitalize="characters" autoCorrect={false} />
          {parentProfile?.id ? (
            <TouchableOpacity style={[s.btn, s.redeemBtn, inviteLoading && { opacity: 0.6 }]}
              onPress={handleRedeemManual} disabled={inviteLoading}>
              {inviteLoading
                ? <ActivityIndicator color={C.bg} />
                : <Text style={s.btnText}>Pakai Kode Undangan</Text>}
            </TouchableOpacity>
          ) : inviteCodeParam ? (
            <Text style={s.hint}>Kode tersimpan — daftar/masuk dulu, kode otomatis dipakai setelah masuk.</Text>
          ) : null}
        </>
      )}

          {inviteCodeParam && (
            <TouchableOpacity
              style={[s.btn, s.redeemBtn]}
              onPress={() => navigation.replace('StudentRegister', { inviteCode: inviteCodeParam })}
            >
              <Text style={s.btnText}>Saya anak — daftar / masuk dengan kode ini →</Text>
            </TouchableOpacity>
          )}

      <Text style={s.label}>Email</Text>
      <TextInput style={s.input} value={email} onChangeText={setEmail}
        placeholder="email@contoh.com" placeholderTextColor={C.muted}
        keyboardType="email-address" autoCapitalize="none" />

      <Text style={s.label}>Password</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <TextInput style={[s.input, { flex: 1 }]} value={password} onChangeText={setPassword}
          placeholder={mode === 'register' ? 'Min. 6 karakter' : 'Password'}
          placeholderTextColor={C.muted} secureTextEntry={!showPassword}
          autoCapitalize='none' autoCorrect={false} />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ marginLeft: 8, padding: 8 }}>
          <Text style={{ color: C.cyan, fontSize: 16 }}>{showPassword ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.btn}
        onPress={mode === 'register' ? handleRegister : handleLogin}
        disabled={loading}>
        {loading
          ? <ActivityIndicator color={C.bg} />
          : <Text style={s.btnText}>
              {mode === 'register' ? 'Daftar & Mulai Pantau →' : 'Masuk →'}
            </Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:        { flex:1, backgroundColor:C.bg },
  inner:         { paddingHorizontal:24, paddingBottom:48 },
  back:          { marginBottom:24 },
  backText:      { color:C.muted, fontSize:15 },
  title:         { color:C.text, fontSize:24, fontWeight:'bold', marginBottom:6 },
  sub:           { color:C.muted, fontSize:14, marginBottom:24 },
  tabs:          { flexDirection:'row', backgroundColor:C.surface, borderRadius:12,
                   padding:4, marginBottom:24 },
  tab:           { flex:1, paddingVertical:10, alignItems:'center', borderRadius:10 },
  tabActive:     { backgroundColor:C.cyan },
  tabText:       { color:C.muted, fontSize:15, fontWeight:'600' },
  tabTextActive: { color:C.bg },
  label:         { color:C.muted, fontSize:13, marginBottom:6, marginTop:16 },
  input:         { backgroundColor:C.surface, borderRadius:12, padding:16,
                   color:C.text, fontSize:16, borderWidth:1, borderColor:'#ffffff22' },
  btn:           { backgroundColor:C.cyan, borderRadius:16, paddingVertical:18,
                   alignItems:'center', marginTop:32 },
  btnText:       { color:C.bg, fontSize:16, fontWeight:'bold' },
  redeemBtn:     { marginTop:12 },
});


