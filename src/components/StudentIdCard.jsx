/**
 * StudentIdCard.jsx — Komponen kartu identitas reusable
 * Dipakai di: PlacementCardModal, SettingsScreen
 * Props:
 *   student: { name, kelas, display_id, current_level }
 *   onShareWA: () => void
 *   onDownloadPdf: () => void
 *   onCopyLink: () => void
 *   compact: bool — mode kecil untuk Settings
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const LEVEL_NAMES = {
  1:'Penjumlahan & Pengurangan', 2:'Perkalian Awal',    3:'Perkalian Dasar',
  4:'Pembagian Awal',            5:'Pecahan Dasar',      6:'Desimal',
  7:'Operasi Campuran',          8:'Kecepatan Hitung',   9:'Master Kecepatan',
  10:'Pecahan Lanjut',           11:'Desimal & Persen',  12:'Rasio & Proporsi',
  13:'Aljabar Dasar',            14:'Persamaan',          15:'Matematika Terapan',
};

// Fonetik tiap karakter untuk dibaca lisan
const PHONETIC = {
  A:'A', B:'Be', C:'Ce', D:'De', E:'E', F:'Ef', G:'Ge', H:'Ha',
  J:'Je', K:'Ka', L:'El', M:'Em', N:'En', P:'Pe', Q:'Ki', R:'Er',
  S:'Es', T:'Te', U:'U', V:'Ve', W:'We', X:'Eks', Y:'Ye', Z:'Zet',
  2:'dua', 3:'tiga', 4:'empat', 5:'lima',
  6:'enam', 7:'tujuh', 8:'delapan', 9:'sembilan',
};

export default function StudentIdCard({
  student,
  onShareWA,
  onDownloadPdf,
  onCopyLink,
  compact = false,
  parentLinked = false,
}) {
  if (!student?.display_id) return null;

  const { name, kelas, display_id, current_level } = student;
  const levelName = LEVEL_NAMES[current_level] || `Level ${current_level}`;
  const phonetic  = display_id.split('').map(c => PHONETIC[c] || c).join(' · ');
  const chars     = display_id.split('');

  return (
    <View style={[s.card, compact && s.cardCompact]}>

      {/* Header */}
      <View style={s.cardHeader}>
        <View style={s.logoRow}>
          <Text style={s.logoCyan}>C</Text>
          <Text style={s.logoWhite}>ADA</Text>
          <Text style={s.logoCyan}>S</Text>
        </View>
        <View style={s.badge}>
          <Text style={s.badgeText}>🎓 Kartu Identitas</Text>
        </View>
      </View>

      {/* Nama & info */}
      <Text style={s.name}>{name}</Text>
      <View style={s.infoRow}>
        <View style={s.infoBox}>
          <Text style={s.infoLabel}>KELAS</Text>
          <Text style={s.infoValue}>{kelas}</Text>
        </View>
        <View style={s.infoBox}>
          <Text style={s.infoLabel}>LEVEL</Text>
          <Text style={s.infoValue} numberOfLines={1}>{current_level} · {levelName}</Text>
        </View>
      </View>

      {/* ID besar */}
      <View style={s.idBox}>
        <Text style={s.idLabel}>ID MASUK</Text>
        <View style={s.idCharsRow}>
          {chars.map((c, i) => (
            <View key={i} style={s.idChar}>
              <Text style={s.idCharText}>{c}</Text>
            </View>
          ))}
        </View>
        <Text style={s.idPhonetic}>{phonetic}</Text>
      </View>

      {/* Status orang tua */}
      <Text style={[s.parentStatus, parentLinked ? s.parentOk : s.parentMissing]}>
        {parentLinked ? '✅ Orang tua sudah terhubung' : '○ Orang tua belum terhubung'}
      </Text>

      {/* Tombol aksi */}
      {!compact && (
        <View style={s.actionRow}>
          {onShareWA && (
            <TouchableOpacity style={s.btnWA} onPress={onShareWA} activeOpacity={0.85}>
              <Text style={s.btnWAText}>📱 Kirim ke WA</Text>
            </TouchableOpacity>
          )}
          {onDownloadPdf && (
            <TouchableOpacity style={s.btnPdf} onPress={onDownloadPdf} activeOpacity={0.85}>
              <Text style={s.btnPdfText}>📄 PDF</Text>
            </TouchableOpacity>
          )}
          {onCopyLink && (
            <TouchableOpacity style={s.btnCopy} onPress={onCopyLink} activeOpacity={0.85}>
              <Text style={s.btnCopyText}>🔗 Link</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

const C = {
  bg:     '#0A0A12', surface: '#13131F', card: '#1A1A2E',
  cyan:   '#00F0FF', text: '#FFFFFF',   muted: '#888899',
  border: '#2A2A3F', lime: '#B6FF00',
};

const s = StyleSheet.create({
  card:        { backgroundColor: C.surface, borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: C.cyan + '44' },
  cardCompact: { padding: 16 },
  cardHeader:  { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  logoRow:     { flexDirection: 'row' },
  logoCyan:    { color: C.cyan,  fontSize: 18, fontWeight: '900' },
  logoWhite:   { color: C.text,  fontSize: 18, fontWeight: '900' },
  badge:       { backgroundColor: C.cyan + '22', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText:   { color: C.cyan, fontSize: 11, fontWeight: '700' },
  name:        { color: C.text, fontSize: 20, fontWeight: '800', marginBottom: 12 },
  infoRow:     { flexDirection: 'row', gap: 10, marginBottom: 16 },
  infoBox:     { flex: 1, backgroundColor: C.card, borderRadius: 10, padding: 10 },
  infoLabel:   { color: C.muted, fontSize: 9, fontWeight: '700', letterSpacing: 1, marginBottom: 4 },
  infoValue:   { color: C.text, fontSize: 13, fontWeight: '700' },
  idBox:       { backgroundColor: C.bg, borderRadius: 14, padding: 16, borderWidth: 1.5, borderColor: C.cyan, marginBottom: 12 },
  idLabel:     { color: C.cyan, fontSize: 9, fontWeight: '700', letterSpacing: 2, marginBottom: 10 },
  idCharsRow:  { flexDirection: 'row', gap: 8, marginBottom: 8 },
  idChar:      { width: 48, height: 48, backgroundColor: C.card, borderRadius: 10, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.cyan + '66' },
  idCharText:  { color: C.cyan, fontSize: 26, fontWeight: '900', fontFamily: 'monospace' },
  idPhonetic:  { color: C.muted, fontSize: 11 },
  parentStatus:{ fontSize: 12, marginBottom: 14 },
  parentOk:    { color: C.lime },
  parentMissing:{ color: C.muted },
  actionRow:   { flexDirection: 'row', gap: 8 },
  btnWA:       { flex: 2, backgroundColor: '#25D366', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  btnWAText:   { color: '#fff', fontWeight: '700', fontSize: 13 },
  btnPdf:      { flex: 1, backgroundColor: C.card, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  btnPdfText:  { color: C.text, fontWeight: '600', fontSize: 12 },
  btnCopy:     { flex: 1, backgroundColor: C.card, borderRadius: 12, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
  btnCopyText: { color: C.text, fontWeight: '600', fontSize: 12 },
});
