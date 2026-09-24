// src/screens/ChildBillingScreen.jsx - Sprint E
import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet,
         ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../services/api';

const C = { bg:'#0A0A12', surface:'#13131F', cyan:'#00F0FF', text:'#FFFFFF',
            muted:'#888899', green:'#00FF9D', yellow:'#FFD700' };

const STATUS_COLOR = { paid:C.green, pending:C.yellow, expired:'#FF6B6B', failed:'#FF6B6B' };

export default function ChildBillingScreen({ navigation, route }) {
  const insets  = useSafeAreaInsets();
  const student = route?.params?.student;
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem('parentToken');
        const res   = await fetch(`${API_BASE}/api/parent/child/${student.id}/billing`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error);
        setData(d);
      } catch (err) { Alert.alert('Error', err.message || 'Gagal memuat billing.'); }
      finally      { setLoading(false); }
    })();
  }, []);

  const fmt    = (n) => `Rp ${Number(n||0).toLocaleString('id-ID')}`;
  const fmtDate = (d) => d
    ? new Date(d).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })
    : '-';

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.back}>← Kembali</Text>
        </TouchableOpacity>
        <Text style={s.title}>Billing {student?.display_name}</Text>
        <View style={{ width:60 }} />
      </View>

      {loading
        ? <ActivityIndicator color={C.cyan} size="large" style={{ marginTop:60 }} />
        : <ScrollView contentContainerStyle={s.scroll}>
            {/* Status akses */}
            <Text style={s.sectionTitle}>Status Akses</Text>
            <View style={s.accessCard}>
              <View style={s.accessRow}>
                <Text style={s.accessLabel}>Basic s/d Level</Text>
                <Text style={[s.accessVal, { color: data?.student?.paid_basic_up_to_level ? C.green : C.muted }]}>
                  {data?.student?.paid_basic_up_to_level ?? 'Belum bayar'}
                </Text>
              </View>
              <View style={s.accessRow}>
                <Text style={s.accessLabel}>Premium s/d Level</Text>
                <Text style={[s.accessVal, { color: data?.student?.paid_premium_up_to_level ? C.cyan : C.muted }]}>
                  {data?.student?.paid_premium_up_to_level ?? 'Belum bayar'}
                </Text>
              </View>
            </View>

            {/* Riwayat pembayaran manual */}
            <Text style={s.sectionTitle}>Pembayaran Manual</Text>
            {(data?.payment_records || []).length === 0
              ? <Text style={s.emptyText}>Belum ada pembayaran.</Text>
              : (data?.payment_records || []).map((p, i) => (
                <View key={i} style={s.payCard}>
                  <View style={s.payRow}>
                    <Text style={s.payType}>{p.product_type} Lv {p.level_from}-{p.level_to}</Text>
                    <Text style={[s.payStatus, { color: p.is_confirmed ? C.green : C.yellow }]}>
                      {p.is_confirmed ? 'Terkonfirmasi' : 'Menunggu'}
                    </Text>
                  </View>
                  <View style={s.payRow}>
                    <Text style={s.payAmount}>{fmt(p.amount_idr)}</Text>
                    <Text style={s.payDate}>{fmtDate(p.created_at)}</Text>
                  </View>
                </View>
              ))
            }

            {/* Riwayat Midtrans */}
            <Text style={s.sectionTitle}>Pembayaran Online (Midtrans)</Text>
            <TouchableOpacity style={s.payButton} onPress={() => navigation.navigate('UpgradePaywall', { studentId: student.id, placedLevel: data?.student?.current_level })}>
              <Text style={s.payButtonText}>Bayar / Upgrade Level via QRIS</Text>
            </TouchableOpacity>
            {(data?.midtrans_invoices || []).length === 0
              ? <Text style={s.emptyText}>Belum ada transaksi online.</Text>
              : (data?.midtrans_invoices || []).map((x, i) => (
                <View key={i} style={s.payCard}>
                  <View style={s.payRow}>
                    <Text style={s.payType}>{x.product_type} Lv {x.level_from}-{x.level_to}</Text>
                    <Text style={[s.payStatus, { color: STATUS_COLOR[x.status] || C.muted }]}>
                      {x.status}
                    </Text>
                  </View>
                  <View style={s.payRow}>
                    <Text style={s.payAmount}>{fmt(x.amount_idr)}</Text>
                    <Text style={s.payDate}>{fmtDate(x.created_at)}</Text>
                  </View>
                </View>
              ))
            }
          </ScrollView>
      }
    </View>
  );
}

const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:C.bg },
  header:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center',
                  paddingHorizontal:16, paddingVertical:14,
                  borderBottomWidth:1, borderBottomColor:'#ffffff11' },
  back:         { color:C.muted, fontSize:15 },
  title:        { color:C.text, fontSize:16, fontWeight:'bold' },
  scroll:       { padding:16, paddingBottom:48 },
  sectionTitle: { color:C.muted, fontSize:11, fontWeight:'700', letterSpacing:1,
                  textTransform:'uppercase', marginBottom:8, marginTop:16 },
  accessCard:   { backgroundColor:C.surface, borderRadius:14, padding:16, marginBottom:4 },
  accessRow:    { flexDirection:'row', justifyContent:'space-between',
                  paddingVertical:8, borderBottomWidth:1, borderBottomColor:'#ffffff0D' },
  accessLabel:  { color:C.muted, fontSize:14 },
  accessVal:    { fontSize:14, fontWeight:'700' },
  payCard:      { backgroundColor:C.surface, borderRadius:12, padding:14, marginBottom:8 },
  payButton:    { backgroundColor:C.cyan, borderRadius:12, padding:14, alignItems:'center', marginBottom:12 },
  payButtonText:{ color:C.bg, fontSize:14, fontWeight:'800' },
  payRow:       { flexDirection:'row', justifyContent:'space-between', marginBottom:4 },
  payType:      { color:C.text, fontSize:14, fontWeight:'600' },
  payStatus:    { fontSize:12, fontWeight:'600' },
  payAmount:    { color:C.cyan, fontSize:15, fontWeight:'bold' },
  payDate:      { color:C.muted, fontSize:12 },
  emptyText:    { color:C.muted, fontSize:13, marginBottom:8 },
});
