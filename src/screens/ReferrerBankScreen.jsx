// src/screens/ReferrerBankScreen.jsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet,
         Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { API_BASE } from '../services/api';

const C = { bg:'#0A0A12', surface:'#13131F', cyan:'#00F0FF', text:'#FFFFFF', muted:'#888899' };

const BANKS = ['BCA','BRI','BNI','Mandiri','BSI','CIMB Niaga','Danamon','Permata','BTN','Jenius','GoPay','OVO','Dana'];

export default function ReferrerBankScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { referrerToken, referrer } = useStore();
  const [bankName,   setBankName]   = useState(referrer?.bank_name           || '');
  const [accNumber,  setAccNumber]  = useState(referrer?.bank_account_number || '');
  const [accName,    setAccName]    = useState(referrer?.bank_account_name   || '');
  const [loading,    setLoading]    = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  async function handleSave() {
    if (!bankName)  return Alert.alert('', 'Pilih nama bank.');
    if (accNumber.length < 6) return Alert.alert('', 'Nomor rekening tidak valid.');
    if (accName.trim().length < 3) return Alert.alert('', 'Nama pemilik rekening tidak valid.');
    setLoading(true);
    try {
      const token = referrerToken || await AsyncStorage.getItem('referrerToken');
      const res   = await fetch(`${API_BASE}/api/referrer/bank`, {
        method: 'PUT',
        headers: { 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ bank_name:bankName, bank_account_number:accNumber, bank_account_name:accName }),
      });
      const data = await res.json();
      if (!res.ok) return Alert.alert('Gagal', data.error || 'Coba lagi.');
      Alert.alert('Berhasil', 'Info bank berhasil diperbarui.', [
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
      <Text style={s.title}>Info Rekening Bank</Text>
      <Text style={s.sub}>Digunakan untuk transfer komisi dari admin</Text>

      <Text style={s.label}>Bank</Text>
      <TouchableOpacity style={s.picker} onPress={() => setShowPicker(!showPicker)}>
        <Text style={bankName ? s.pickerValue : s.pickerPlaceholder}>
          {bankName || 'Pilih bank...'}
        </Text>
        <Text style={s.pickerArrow}>{showPicker ? '?' : '?'}</Text>
      </TouchableOpacity>
      {showPicker && (
        <View style={s.pickerList}>
          {BANKS.map(b => (
            <TouchableOpacity key={b} style={s.pickerItem}
              onPress={() => { setBankName(b); setShowPicker(false); }}>
              <Text style={[s.pickerItemText, bankName === b && { color:C.cyan }]}>{b}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={s.label}>Nomor Rekening</Text>
      <TextInput style={s.input} value={accNumber} onChangeText={setAccNumber}
        placeholder="Contoh: 1234567890" placeholderTextColor={C.muted}
        keyboardType="numeric" />

      <Text style={s.label}>Nama Pemilik Rekening</Text>
      <TextInput style={s.input} value={accName} onChangeText={setAccName}
        placeholder="Nama sesuai buku tabungan" placeholderTextColor={C.muted}
        autoCapitalize="words" />

      <View style={s.infoBox}>
        <Text style={s.infoText}>?? Pastikan data rekening benar. Admin akan transfer komisi ke rekening ini setelah verifikasi.</Text>
      </View>

      <TouchableOpacity style={s.btn} onPress={handleSave} disabled={loading}>
        {loading
          ? <ActivityIndicator color={C.bg} />
          : <Text style={s.btnText}>Simpan Info Bank</Text>
        }
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  scroll:              { flex:1, backgroundColor:C.bg },
  inner:               { paddingHorizontal:24, paddingBottom:48 },
  backBtn:             { marginBottom:20 },
  back:                { color:C.muted, fontSize:15 },
  title:               { color:C.text, fontSize:22, fontWeight:'bold', marginBottom:6 },
  sub:                 { color:C.muted, fontSize:14, marginBottom:32 },
  label:               { color:C.muted, fontSize:13, marginBottom:6, marginTop:20 },
  input:               { backgroundColor:C.surface, borderRadius:12, padding:16, color:C.text,
                         fontSize:16, borderWidth:1, borderColor:'#ffffff22' },
  picker:              { backgroundColor:C.surface, borderRadius:12, padding:16, flexDirection:'row',
                         justifyContent:'space-between', alignItems:'center', borderWidth:1, borderColor:'#ffffff22' },
  pickerValue:         { color:C.text, fontSize:16 },
  pickerPlaceholder:   { color:C.muted, fontSize:16 },
  pickerArrow:         { color:C.muted, fontSize:12 },
  pickerList:          { backgroundColor:C.surface, borderRadius:12, marginTop:4, borderWidth:1, borderColor:'#ffffff22' },
  pickerItem:          { padding:14, borderBottomWidth:1, borderBottomColor:'#ffffff11' },
  pickerItemText:      { color:C.text, fontSize:15 },
  infoBox:             { backgroundColor:'#ffffff0D', borderRadius:12, padding:16, marginTop:24 },
  infoText:            { color:C.muted, fontSize:13, lineHeight:20 },
  btn:                 { backgroundColor:C.cyan, borderRadius:16, paddingVertical:18,
                         alignItems:'center', marginTop:32 },
  btnText:             { color:C.bg, fontSize:16, fontWeight:'bold' },
});
