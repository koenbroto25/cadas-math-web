/**
 * PlacementCardModal.jsx — Modal blocker setelah placement test
 * Muncul SATU KALI sebelum PlacementResultScreen jika card_shared belum true.
 * Aksi yang tersedia: Share WA, Download PDF, Copy link.
 * Setelah salah satu aksi → tombol "Lanjutkan →" muncul.
 *
 * Props:
 *   visible:    bool
 *   student:    { name, kelas, display_id, current_level }
 *   placedLevel: number
 *   onDone:     () => void  — dipanggil saat Lanjutkan ditekan
 */

import React, { useState, useCallback } from 'react';
import {
  Modal, View, Text, TouchableOpacity,
  StyleSheet, Linking, Alert, ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useStore } from '../store/useStore';
import { API_BASE } from '../services/api';
import StudentIdCard from '../components/StudentIdCard';

const APP_BASE_URL = 'https://cadasmatematika.web.id';

const LEVEL_NAMES = {
  1:'Penjumlahan & Pengurangan', 2:'Perkalian Awal',    3:'Perkalian Dasar',
  4:'Pembagian Awal',            5:'Pecahan Dasar',      6:'Desimal',
  7:'Operasi Campuran',          8:'Kecepatan Hitung',   9:'Master Kecepatan',
  10:'Pecahan Lanjut',           11:'Desimal & Persen',  12:'Rasio & Proporsi',
  13:'Aljabar Dasar',            14:'Persamaan',          15:'Matematika Terapan',
};

export default function PlacementCardModal({ visible, student, placedLevel, onDone }) {
  const authToken  = useStore((s) => s.authToken);
  const [acted,    setActed]    = useState(false);   // sudah lakukan minimal 1 aksi
  const [loadPdf,  setLoadPdf]  = useState(false);
  const [loadDone, setLoadDone] = useState(false);

  const displayId = student?.display_id;
  const parentLink = `${APP_BASE_URL}/parent/join?ref=${displayId}`;
  const levelName  = LEVEL_NAMES[placedLevel] || `Level ${placedLevel}`;

  // ── Pesan WA yang sudah diformulasikan ───────────────────────────────────────
  const waMessage = encodeURIComponent(
    `Halo! Ini info akun ${student?.name || 'anakku'} di Cadas Matematika 📚\n\n` +
    `🎯 Level: ${placedLevel} (${levelName})\n` +
    `🔑 ID Masuk: ${displayId}\n\n` +
    `Daftar sebagai orang tua untuk pantau progres:\n` +
    `${parentLink}\n\n` +
    `Atau buka app Cadas → "Masuk sebagai Orang Tua" → masukkan ID: ${displayId}`
  );

  // ── Kirim ke WA ──────────────────────────────────────────────────────────────
  const handleShareWA = useCallback(async () => {
    const url = `whatsapp://send?text=${waMessage}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      markShared('whatsapp');
    } else {
      // Fallback: buka WA web
      await Linking.openURL(`https://wa.me/?text=${waMessage}`);
      markShared('whatsapp');
    }
  }, [waMessage, displayId]);

  // ── Download PDF ─────────────────────────────────────────────────────────────
  const handleDownloadPdf = useCallback(async () => {
    if (!displayId) return;
    setLoadPdf(true);
    try {
      const pdfUrl = `${API_BASE}/api/card/my`;
      // Buka di browser bawaan device — user bisa save dari sana
      const canOpen = await Linking.canOpenURL(pdfUrl);
      if (canOpen) {
        await Linking.openURL(
          `${pdfUrl}?token=${encodeURIComponent(authToken)}`
        );
        setActed(true);
        markShared('pdf');
      } else {
        Alert.alert('', 'Tidak bisa membuka PDF. Coba share via WA dulu.');
      }
    } catch (e) {
      Alert.alert('Error', 'Gagal membuka PDF.');
    } finally {
      setLoadPdf(false);
    }
  }, [displayId, authToken]);

  // ── Copy link ─────────────────────────────────────────────────────────────────
  const handleCopyLink = useCallback(async () => {
    await Clipboard.setStringAsync(parentLink);
    Alert.alert('✅ Tersalin!', `Link orang tua sudah disalin:\n${parentLink}`);
    markShared('copy');
    // WA/copy tidak unlock tombol Lanjutkan — hanya PDF yang wajib (D2)
  }, [parentLink]);

  // ── Mark card_shared di backend ───────────────────────────────────────────────
  async function markShared(via) {
    try {
      await fetch(`${API_BASE}/api/auth/student/card-shared`, {
        method:  'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${authToken}`,
        },
        body: JSON.stringify({ shared_via: via }),
      });
    } catch (_) {}
  }

  // ── Lanjutkan ─────────────────────────────────────────────────────────────────
  const handleDone = useCallback(async () => {
    setLoadDone(true);
    // Aksi minimal sudah dilakukan (handleDone hanya aktif bila acted=true).
    setLoadDone(false);
    onDone?.();
  }, [onDone]);

  if (!student || !displayId) return null;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Judul */}
        <Text style={s.emoji}>🎯</Text>
        <Text style={s.title}>Selamat, {student.name}!</Text>
        <Text style={s.subtitle}>
          Kamu cocok mulai dari{' '}
          <Text style={s.levelHighlight}>Level {placedLevel} — {levelName}</Text>
        </Text>

        {/* Kartu identitas */}
        <View style={s.cardWrap}>
          <StudentIdCard
            student={{ ...student, current_level: placedLevel }}
            onShareWA={handleShareWA}
            onDownloadPdf={handleDownloadPdf}
            onCopyLink={handleCopyLink}
          />
        </View>

        {/* Pesan konteks */}
        <View style={s.infoBox}>
          <Text style={s.infoText}>
            💡 Simpan info ini agar orang tua bisa pantau belajarmu dan aktifkan akun lengkap.
          </Text>
        </View>

        {/* Tombol Lanjutkan — hanya aktif setelah aksi dilakukan (D2: PDF wajib) */}
        <TouchableOpacity
          style={[s.doneBtn, acted ? s.doneBtnActive : s.doneBtnMuted]}
          onPress={handleDone}
          activeOpacity={0.85}
          disabled={loadDone || !acted}
        >
          {loadDone
            ? <ActivityIndicator color="#0A0A12" />
            : <Text style={s.doneBtnText}>
                {acted ? '✅ Lanjutkan →' : '⚠️ Pilih salah satu aksi di atas dulu'}
              </Text>
          }
        </TouchableOpacity>

        {/* Hint: instruksikan aksi, bukan ajakan skip */}
        {!acted && (
          <Text style={s.skipHint}>
            💡 Sebaiknya download PDF atau share ke WA biar orang tua bisa pantau.
          </Text>
        )}
      </ScrollView>
    </Modal>
  );
}

const C = {
  bg:      '#0A0A12', surface: '#13131F',
  cyan:    '#00F0FF', text: '#FFFFFF',
  muted:   '#888899', lime: '#B6FF00',
};

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: C.bg },
  content:         { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 40, alignItems: 'center' },
  emoji:           { fontSize: 48, marginBottom: 12 },
  title:           { color: C.text, fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 8 },
  subtitle:        { color: C.muted, fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  levelHighlight:  { color: C.cyan, fontWeight: '700' },
  cardWrap:        { width: '100%', marginBottom: 16 },
  infoBox:         { backgroundColor: C.surface, borderRadius: 14, padding: 16, marginBottom: 24, width: '100%' },
  infoText:        { color: C.muted, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  doneBtn:         { width: '100%', borderRadius: 18, paddingVertical: 20, alignItems: 'center', marginBottom: 12 },
  doneBtnActive:   { backgroundColor: C.lime },
  doneBtnMuted:    { backgroundColor: C.surface, borderWidth: 1, borderColor: '#2A2A3F' },
  doneBtnText:     { color: '#0A0A12', fontSize: 17, fontWeight: '900' },
  skipHint:        { color: C.muted, fontSize: 12, textAlign: 'center' },
});
