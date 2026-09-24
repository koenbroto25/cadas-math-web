import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from '../store/useStore';
import { api } from '../services/api';

// Paket = kredit level, 100% dijangkar ke hasil placement test
// (Placement_Test_System.md §13.5). Nominal final ditentukan backend
// (src/routes/midtrans.js -> PRICING); harga di sini hanya untuk display.
const PACKAGES = [
  { key: 'basic_single',     label: 'Basic - 1 Level',   tier: 'basic',   count: 1, price: 'Rp40.000'  },
  { key: 'basic_bundle_3',   label: 'Basic - 3 Level',   tier: 'basic',   count: 3, price: 'Rp100.000' },
  { key: 'premium_single',   label: 'Premium - 1 Level', tier: 'premium', count: 1, price: 'Rp65.000'  },
  { key: 'premium_bundle_3', label: 'Premium - 3 Level', tier: 'premium', count: 3, price: 'Rp165.000' },
];

const MAX_LEVEL = 15; // selaras GET /api/exercises/:level (1-15)

export default function UpgradePaywallScreen() {
  const route = useRoute();
  const nav = useNavigation();
  const authToken      = useStore((s) => s.authToken);
  const parentToken    = useStore((s) => s.parentToken);
  const storeStudent   = useStore((s) => s.student);
  const setLevelAccess = useStore((s) => s.setLevelAccess);
  const { placedLevel: _placedLevel, studentId: routeStudentId } = route.params || {};
  const placedLevel = _placedLevel ?? storeStudent?.current_level ?? 1;
  const studentId = routeStudentId || storeStudent?.id || null;
  const token = authToken || parentToken;
  const isParent = !authToken && !!parentToken;
  const [selectedPkg, setSelectedPkg] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);
  const [referralCode, setReferralCode] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => {
    AsyncStorage.getItem('referralCode').then(v => setReferralCode(String(v || '').trim() || null)).catch(() => {});
  }, []);

  // Rentang level = anchor placement .. anchor+count-1. Tidak boleh 0 —
  // backend menolak level_from yang falsy (routes/midtrans.js).
  const levelsFor = (pkg) => ({
    level_from: placedLevel,
    level_to:   Math.min(placedLevel + pkg.count - 1, MAX_LEVEL),
  });

  const handleSelect = async (pkg) => {
    if (!token) { Alert.alert('Gagal', 'Sesi login habis. Silakan login ulang.'); return; }
    if (!isParent && !studentId) { Alert.alert('Gagal', 'Data siswa tidak ditemukan. Coba login ulang.'); return; }
    const { level_from, level_to } = levelsFor(pkg);
    setSelectedPkg(pkg); setLoading(true); setQrData(null);
    try {
      const res = await api.createQrisPurchase({
        package: pkg.key,
        student_id: studentId || undefined,
        referrer_code: referralCode || undefined,
      }, token);
      setQrData({
        order_id: res.order_id,
        qr_string: res.qr_string,
        qr_url: res.qr_url || null,
        expires_at: res.expires_at || null,
        amount_idr: res.amount_idr || null,
        level_from: res.level_from ?? level_from,
        level_to: res.level_to ?? level_to,
        pending_until_placement: res.pending_until_placement,
      });
    } catch (e) { console.error('createQrisPurchase:', e.message); Alert.alert('Gagal', e.message || 'Tidak dapat membuat transaksi'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!qrData || paid) return;
    pollRef.current = setInterval(async () => {
      try {
        const st = await api.paymentStatus(qrData.order_id, token);
        if (st.status === 'paid') {
          const levelTo = st.level_to ?? qrData.level_to;
          clearInterval(pollRef.current);
          setPaid(true);
          if (!isParent) setLevelAccess(selectedPkg?.tier === 'premium' ? 'premium' : 'basic');
          Alert.alert('Pembayaran Berhasil!', qrData.pending_until_placement ? 'Pembayaran tersimpan. Level akan dibuka setelah placement test anak selesai.' : `Level ${levelTo} sudah terbuka.`, [
            { text: 'Selesai', onPress: () => nav.goBack() },
          ]);
        }
      } catch (e) { console.log('pollStatus:', e.message); }
    }, 4000);
    return () => clearInterval(pollRef.current);
  }, [qrData, paid, token, isParent, selectedPkg]);

  if (paid) return <View style={s.container}><Text style={s.congrats}>Pembayaran Berhasil!</Text><Text style={s.title}>Akses level sudah terbuka.</Text></View>;

  if (!qrData) {
    return (
      <View style={s.container}>
        <Text style={s.congrats}>Selamat!</Text>
        <Text style={s.title}>Kamu sudah kuasai Level {placedLevel}!</Text>
        <Text style={s.sub}>Pilih paket — akses dibuka mulai level hasil placement:</Text>
        {loading && <ActivityIndicator color="#00F0FF" style={{ marginBottom: 12 }} />}
        {PACKAGES.map((pkg) => {
          const { level_from, level_to } = levelsFor(pkg);
          const range = level_from === level_to ? `Level ${level_from}` : `Level ${level_from}-${level_to}`;
          return (
            <TouchableOpacity
              key={pkg.key}
              disabled={loading}
              style={[s.card, selectedPkg && selectedPkg.key === pkg.key && s.cardSelected]}
              onPress={() => handleSelect(pkg)}
            >
              <Text style={s.cardTitle}>{pkg.label}</Text>
              <Text style={s.cardRange}>{range}</Text>
              <Text style={s.price}>{pkg.price}</Text>
            </TouchableOpacity>
          );
        })}
        {!studentId && <Text style={s.warn}>Student tidak terdeteksi — silakan login ulang.</Text>}
        <Text style={s.note}>Pembayaran QRIS via Midtrans (sandbox bila MIDTRANS_SANDBOX aktif).</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.congrats}>Scan QRIS</Text>
      <Text style={s.title}>Total: {selectedPkg && selectedPkg.price}</Text>
      {qrData.qr_url ? (
        <Image source={{ uri: qrData.qr_url }} style={s.qrImage} resizeMode="contain" />
      ) : qrData.qr_string ? (
        <View style={s.qrBox}>
          <QRCode value={qrData.qr_string} size={220} backgroundColor="#FFFFFF" color="#0A0A12" />
        </View>
      ) : (
        <View style={s.qrPlaceholder}>
          <Text style={{ color: '#888' }}>QR tidak tersedia</Text>
          <TouchableOpacity onPress={() => setQrData(null)}>
            <Text style={{ color: '#00F0FF' }}>Pilih paket lain</Text>
          </TouchableOpacity>
        </View>
      )}
      <Text style={s.note}>Pembayaran terdeteksi otomatis setelah scan.</Text>
      <ActivityIndicator color="#00F0FF" style={{ marginTop: 12 }} />
      <Text style={s.timer}>Order: {qrData.order_id}</Text>
      <Text style={s.timer}>Berakhir: {qrData.expires_at || '24:00'}</Text>
      <TouchableOpacity onPress={() => setQrData(null)}>
        <Text style={s.cancel}>Ganti paket</Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A12', alignItems: 'center', padding: 24, paddingTop: 60 },
  congrats: { fontSize: 28, color: '#4CAF50', marginBottom: 8 },
  title: { fontSize: 20, color: '#FFF', fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 14, color: '#AAA', marginBottom: 24, textAlign: 'center' },
  card: { backgroundColor: '#13131F', borderRadius: 12, padding: 20, marginBottom: 12, width: '100%', alignItems: 'center' },
  cardSelected: { borderWidth: 2, borderColor: '#00F0FF' },
  cardTitle: { color: '#00F0FF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  cardRange: { color: '#AAA', fontSize: 13, marginBottom: 6 },
  price: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  warn: { color: '#FF6B6B', fontSize: 13, marginTop: 8, textAlign: 'center' },
  cancel: { color: '#888', fontSize: 14, marginTop: 16, textDecorationLine: 'underline' },
  qrImage: { width: 220, height: 220, marginVertical: 20, backgroundColor: '#FFF', borderRadius: 12 },
  qrBox: { backgroundColor: '#FFF', borderRadius: 12, padding: 10, marginVertical: 20 },
  qrPlaceholder: { width: 220, height: 220, marginVertical: 20, backgroundColor: '#13131F', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  note: { color: '#888', fontSize: 12, marginTop: 12, textAlign: 'center' },
  timer: { color: '#888', fontSize: 11, marginTop: 4, textAlign: 'center' },
});