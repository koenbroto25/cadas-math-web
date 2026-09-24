import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../store/useStore';
import { api } from '../services/api';

const C = { bg:'#0A0A12', surface:'#13131F', cyan:'#00F0FF', text:'#FFFFFF', muted:'#888899', good:'#22DD88', bad:'#FF6B6B', warn:'#FFD166' };
const rp = (v) => `Rp${Number(v || 0).toLocaleString('id-ID')}`;
const tabs = ['payments','earnings','payouts','cancellations','windows','scheduler'];

export default function AdminFinanceReportScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const adminToken = useStore((s) => s.adminToken);
  const [from,setFrom] = useState(''); const [to,setTo] = useState('');
  const [partnerType,setPartnerType] = useState(''); const [earningStatus,setEarningStatus] = useState('');
  const [tab,setTab] = useState('payments'); const [summary,setSummary] = useState(null);
  const [report,setReport] = useState([]); const [loading,setLoading] = useState(true);
  const [accountName,setAccountName] = useState('Rekening Utama');
  const [accountDate,setAccountDate] = useState(new Date().toISOString().slice(0,10));
  const [actualBalance,setActualBalance] = useState('');

  const query = useMemo(() => { const q={}; if(from)q.from=from; if(to)q.to=to; if(partnerType)q.partner_type=partnerType; if(earningStatus)q.earning_status=earningStatus; return q; },[from,to,partnerType,earningStatus]);

  async function load() {
    setLoading(true);
    try {
      const [s,r] = await Promise.all([
        api.financeSummary(query,adminToken),
        tab==='payments'?api.financePayments(query,adminToken):tab==='earnings'?api.financeEarnings(query,adminToken):tab==='payouts'?api.financePayouts(query,adminToken):tab==='cancellations'?api.financeCancellations(query,adminToken):tab==='windows'?api.financeWindows(query,adminToken):api.financeSchedulerRuns({limit:100},adminToken),
      ]);
      setSummary(s); setReport(tab==='payouts'?(r.batches||[]):Object.values(r).find(Array.isArray)||[]);
    } catch(e) { Alert.alert('Gagal memuat laporan',e.message); }
    finally { setLoading(false); }
  }
  useEffect(()=>{load();},[tab,from,to,partnerType,earningStatus]);

  async function download(type) {
    if(Platform.OS!=='web') return Alert.alert('Web only','Download laporan tersedia pada versi web.');
    try { const response=await fetch(api.financeExportUrl(type,query),{headers:{Authorization:`Bearer ${adminToken}`}}); if(!response.ok)throw new Error('Export gagal'); const blob=await response.blob(); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`finance-${type}.csv`; a.click(); URL.revokeObjectURL(url); }
    catch(e){Alert.alert('Gagal download',e.message);}
  }
  async function backfill(){try{const r=await api.financeBackfill(adminToken);Alert.alert('Selesai',`${r.inserted} settlement ditambahkan dari ${r.scanned} invoice.`);load();}catch(e){Alert.alert('Gagal',e.message);}}
  async function reconcile(){try{await api.financeSaveReconciliation({account_name:accountName,account_date:accountDate,actual_balance_idr:Number(actualBalance)},adminToken);Alert.alert('Tersimpan','Rekonsiliasi bank dicatat.');setActualBalance('');load();}catch(e){Alert.alert('Gagal',e.message);}}

  const fees=summary?.fees||{}; const cash=summary?.cash||{}; const payments=summary?.payments||{};
  return (
    <ScrollView style={s.scroll} contentContainerStyle={[s.inner,{paddingTop:insets.top+20}]}>
      <View style={s.header}><View style={{flex:1}}><Text style={s.badge}>FINANCE</Text><Text style={s.title}>Laporan Keuangan</Text><Text style={s.sub}>Midtrans masuk, liability fee tertahan di rekening utama, lalu payout & rekonsiliasi</Text></View><TouchableOpacity onPress={()=>navigation.goBack()}><Text style={s.close}>Kembali</Text></TouchableOpacity></View>
      <View style={s.filters}><Text style={s.label}>Dari</Text><TextInput style={s.input} value={from} onChangeText={setFrom} placeholder="YYYY-MM-DD" placeholderTextColor={C.muted}/><Text style={s.label}>Sampai</Text><TextInput style={s.input} value={to} onChangeText={setTo} placeholder="YYYY-MM-DD" placeholderTextColor={C.muted}/><Text style={s.label}>Tipe partner</Text><TextInput style={s.input} value={partnerType} onChangeText={setPartnerType} placeholder="marketing / school / sales" placeholderTextColor={C.muted}/><Text style={s.label}>Status fee</Text><TextInput style={s.input} value={earningStatus} onChangeText={setEarningStatus} placeholder="ready / scheduled / transferred" placeholderTextColor={C.muted}/><TouchableOpacity style={s.primary} onPress={load}><Text style={s.primaryText}>Terapkan Filter</Text></TouchableOpacity></View>
      <Text style={s.section}>Ringkasan</Text><View style={s.grid}><Card label="Settlement" value={rp(payments.gross_settlement_idr)} color={C.good}/><Card label="Cash Delta" value={rp(cash.signed_delta_idr)} color={C.cyan}/><Card label="Fee Outstanding" value={rp((fees.outstanding_idr||0)+(fees.scheduled_idr||0))} color={C.warn}/><Card label="Fee Transferred" value={rp(fees.transferred_idr)} color={C.good}/><Card label="Fee Cancelled" value={rp(fees.cancelled_idr)} color={C.bad}/><Card label="Ledger Balance" value={fees.balance_ok?'OK':'CEK'} color={fees.balance_ok?C.good:C.warn}/></View>
      <View style={s.actions}><TouchableOpacity style={s.action} onPress={()=>download('summary')}><Text style={s.actionText}>Download Summary</Text></TouchableOpacity><TouchableOpacity style={s.action} onPress={backfill}><Text style={s.actionText}>Backfill Settlement</Text></TouchableOpacity><TouchableOpacity style={s.action} onPress={async()=>{try{const r=await api.financeRunScheduler({},adminToken);Alert.alert('Scheduler selesai',`${r.affected_count} window expired.`);load();}catch(e){Alert.alert('Gagal',e.message)}}}><Text style={s.actionText}>Jalankan Scheduler</Text></TouchableOpacity><TouchableOpacity style={s.action} onPress={()=>Platform.OS==='web'&&window.print()}><Text style={s.actionText}>Print / PDF</Text></TouchableOpacity></View>
      <Text style={s.section}>Rekonsiliasi Bank</Text><View style={s.card}><Text style={s.note}>Saldo aplikasi dihitung dari cash ledger. Masukkan saldo bank aktual untuk melihat selisih.</Text><TextInput style={s.input} value={accountName} onChangeText={setAccountName} placeholder="Nama rekening"/><TextInput style={s.input} value={accountDate} onChangeText={setAccountDate} placeholder="YYYY-MM-DD"/><TextInput style={s.input} value={actualBalance} onChangeText={setActualBalance} keyboardType="numeric" placeholder="Saldo bank aktual"/><TouchableOpacity style={s.primary} onPress={reconcile}><Text style={s.primaryText}>Simpan Rekonsiliasi</Text></TouchableOpacity></View>
      <Text style={s.section}>Detail Laporan</Text><View style={s.tabs}>{tabs.map(x=><TouchableOpacity key={x} style={[s.tab,tab===x&&s.tabActive]} onPress={()=>setTab(x)}><Text style={[s.tabText,tab===x&&s.tabTextActive]}>{x}</Text></TouchableOpacity>)}</View>{loading?<ActivityIndicator color={C.cyan}/>:<View style={s.card}>{report.length===0?<Text style={s.note}>Belum ada data.</Text>:report.map((r,i)=><View key={r.id||i} style={s.row}><Text style={s.rowTitle}>{r.batch_code||r.order_id||r.referrer_name||r.id}</Text><Text style={s.rowMeta}>{r.status||''} · {rp(r.commission_idr||r.amount_idr||r.total_idr)}</Text></View>)}</View>}
      {tab!=='payouts'&&<TouchableOpacity style={s.action} onPress={()=>download(tab==='scheduler'?'scheduler-runs':tab)}><Text style={s.actionText}>Download {tab} CSV</Text></TouchableOpacity>}
    </ScrollView>
  );
}
function Card({label,value,color}){return <View style={s.card}><Text style={[s.value,{color}]}>{value}</Text><Text style={s.label}>{label}</Text></View>}
const s=StyleSheet.create({scroll:{flex:1,backgroundColor:C.bg},inner:{padding:20,paddingBottom:50},header:{flexDirection:'row',marginBottom:14},badge:{color:C.cyan,fontSize:11,fontWeight:'900',letterSpacing:2},title:{color:C.text,fontSize:23,fontWeight:'900',marginTop:3},sub:{color:C.muted,fontSize:12,marginTop:3},close:{color:C.muted,paddingTop:4},filters:{backgroundColor:C.surface,borderRadius:14,padding:12,marginBottom:14},label:{color:C.muted,fontSize:11,marginTop:7},input:{backgroundColor:'#0F0F1A',color:C.text,borderRadius:8,padding:10,marginTop:4},primary:{backgroundColor:C.cyan,borderRadius:10,padding:12,alignItems:'center',marginTop:10},primaryText:{color:C.bg,fontWeight:'900'},section:{color:C.cyan,fontSize:12,fontWeight:'900',letterSpacing:1,marginTop:20,marginBottom:8},grid:{flexDirection:'row',flexWrap:'wrap',gap:8},card:{backgroundColor:C.surface,borderRadius:12,padding:12,minWidth:'47%',flexGrow:1},value:{fontSize:18,fontWeight:'900'},label:{color:C.muted,fontSize:11,marginTop:3},actions:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:12},action:{backgroundColor:C.surface,borderRadius:10,padding:11},actionText:{color:C.cyan,fontSize:12,fontWeight:'800'},note:{color:C.muted,fontSize:12,lineHeight:18,marginBottom:10},tabs:{flexDirection:'row',gap:6,flexWrap:'wrap',marginBottom:8},tab:{backgroundColor:C.surface,borderRadius:8,padding:8},tabActive:{backgroundColor:C.cyan},tabText:{color:C.muted,fontSize:12},tabTextActive:{color:C.bg,fontWeight:'800'},row:{borderTopWidth:1,borderTopColor:'#FFFFFF12',paddingVertical:9},rowTitle:{color:C.text,fontSize:12,fontWeight:'800'},rowMeta:{color:C.muted,fontSize:11,marginTop:3}});
