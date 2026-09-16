import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';

const WHATSAPP = '6281234567890';
const PRICING = { single: 40000, basicBundle: 100000, premiumBundle: 165000 }; // sinkron dgn backend PRICING (payment.js) & upgrade-test.js

export default function UpgradePaywallScreen() {
  const route = useRoute();
  const { level = 4, placedLevel = 4 } = route.params || {};

  const handleWhatsApp = (tier) => {
    let msg = '';
    if (tier === 'single') msg = `Halo Kak Cadas, saya ingin beli level ${level} (Rp${PRICING.single.toLocaleString()}).`;
    if (tier === 'basic') msg = `Halo Kak Cadas, saya ingin beli Basic Bundle (sampai level 8, Rp${PRICING.basicBundle.toLocaleString()}).`;
    if (tier === 'premium') msg = `Halo Kak Cadas, saya ingin beli Premium Bundle (semua level, Rp${PRICING.premiumBundle.toLocaleString()}).`;
    Linking.openURL(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <View style={s.container}>
      <Text style={s.congrats}>?? Selamat!</Text>
      <Text style={s.title}>Kamu sudah kuasai Level {placedLevel}!</Text>
      <Text style={s.sub}>Untuk lanjut ke Level {level} ke atas, pilih paket di bawah:</Text>

      <TouchableOpacity style={s.card} onPress={() => handleWhatsApp('single')}>
        <Text style={s.cardTitle}>Satu Level (L{level})</Text>
        <Text style={s.price}>Rp{PRICING.single.toLocaleString()}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.card} onPress={() => handleWhatsApp('basic')}>
        <Text style={s.cardTitle}>Basic Bundle (sampai L8)</Text>
        <Text style={s.price}>Rp{PRICING.basicBundle.toLocaleString()}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={s.card} onPress={() => handleWhatsApp('premium')}>
        <Text style={s.cardTitle}>Premium Bundle (semua level)</Text>
        <Text style={s.price}>Rp{PRICING.premiumBundle.toLocaleString()}</Text>
      </TouchableOpacity>

      <Text style={s.note}>Pembayaran manual via WhatsApp. Hubungi untuk konfirmasi.</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A12', alignItems: 'center', padding: 24, paddingTop: 60 },
  congrats: { fontSize: 28, color: '#4CAF50', marginBottom: 8 },
  title: { fontSize: 20, color: '#FFF', fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 14, color: '#AAA', marginBottom: 24, textAlign: 'center' },
  card: { backgroundColor: '#13131F', borderRadius: 12, padding: 20, marginBottom: 12, width: '100%', alignItems: 'center' },
  cardTitle: { color: '#00F0FF', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  price: { color: '#FFF', fontSize: 22, fontWeight: 'bold' },
  note: { color: '#888', fontSize: 12, marginTop: 16, textAlign: 'center' }
});
