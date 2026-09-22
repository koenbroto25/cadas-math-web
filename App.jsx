// App.jsx -- root navigation
// Patch: tambah DemoStack (DemoHome + DemoPractice)
// Admin masuk demo via Settings screen yang memanggil /api/auth/demo/admin-token
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStore } from './src/store/useStore';

// Screens -- Student core
import HomeScreen            from './src/screens/HomeScreen';
import PracticeScreen        from './src/screens/PracticeScreen';
import FastTrackScreen       from './src/screens/FastTrackScreen';
import UpgradePaywallScreen  from './src/screens/UpgradePaywallScreen';
import AskKakScreen          from './src/screens/AskKakScreen';
import SettingsScreen        from './src/screens/SettingsScreen';
import SessionResultScreen   from './src/screens/SessionResultScreen';

// Screens -- Auth & Onboarding
import RoleSelectScreen      from './src/screens/RoleSelectScreen';
import StudentRegisterScreen from './src/screens/StudentRegisterScreen';
import PlacementScreen       from './src/screens/PlacementScreen';
import PlacementResultScreen from './src/screens/PlacementResultScreen';
import ParentAuthScreen      from './src/screens/ParentAuthScreen';
import TeacherAuthScreen     from './src/screens/TeacherAuthScreen';

// Screens -- Parent Dashboard

// Screens -- Parent Dashboard (Sprint E)
import ParentDashboardScreen from './src/screens/ParentDashboardScreen';
import ChildProgressScreen   from './src/screens/ChildProgressScreen';
import ChildSessionsScreen   from './src/screens/ChildSessionsScreen';
import ChildBillingScreen           from './src/screens/ChildBillingScreen';
import ChildWeeklySummaryScreen  from './src/screens/ChildWeeklySummaryScreen';

// Screens -- Teacher Dashboard
import TeacherDashboardScreen from './src/screens/TeacherDashboardScreen';
import StudentDetailScreen    from './src/screens/StudentDetailScreen';

// Screens -- Referrer
import ReferrerLoginScreen          from './src/screens/ReferrerLoginScreen';
import ReferrerDashboardScreen      from './src/screens/ReferrerDashboardScreen';
import ReferrerEarningsScreen       from './src/screens/ReferrerEarningsScreen';
import ReferrerClicksScreen         from './src/screens/ReferrerClicksScreen';
import ReferrerBankScreen           from './src/screens/ReferrerBankScreen';
import ReferrerChangePasswordScreen from './src/screens/ReferrerChangePasswordScreen';

// Screens -- Demo Mode
import DemoHomeScreen from './src/screens/DemoHomeScreen';

// Screens -- Admin (owner/developer, full access QA)
import AdminLoginScreen     from './src/screens/AdminLoginScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';

const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const COLORS = { bg: '#0A0A12', surface: '#13131F', cyan: '#00F0FF', muted: '#444455' };

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor:  COLORS.muted,
          borderTopWidth:  1,
          paddingBottom:   8,
          paddingTop:      4,
          height:          60,
        },
        tabBarActiveTintColor:   COLORS.cyan,
        tabBarInactiveTintColor: COLORS.muted,
        tabBarIcon: ({ focused, color, size }) => {
          const icons = {
            Beranda:  focused ? 'home'       : 'home-outline',
            Latihan:  focused ? 'pencil'     : 'pencil-outline',
            TanyaKak: focused ? 'chatbubble' : 'chatbubble-outline',
            Setelan:  focused ? 'settings'   : 'settings-outline',
          };
          return <Ionicons name={icons[route.name]} size={size} color={color} />;
        },
      })}>
      <Tab.Screen name='Beranda'  component={HomeScreen} />
      <Tab.Screen name='Latihan'  component={PracticeScreen} />
      <Tab.Screen name='TanyaKak' component={AskKakScreen} options={{ tabBarLabel: 'Tanya Kak' }} />
      <Tab.Screen name='Setelan'  component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const {
    authToken, authRole, placementDone,
    setAuth, setStudent, setLevel, setPlacementDone,
    referrerToken, setReferrerAuth,
    parentToken,   setParentAuth,
    teacherToken,  setTeacherAuth,
    demoMode, demoKind, demoExpiresAt, setDemoMode,
    clearDemoMode, clearReferrerAuth, clearAuth,
    adminToken, setAdminAuth,
  } = useStore();
  const [bootstrapped, setBootstrapped] = useState(false);

  // Keluar dari demo + bersihkan sesi demo tersimpan (dipakai watchdog)
  function exitDemoNow() {
    clearDemoMode();
    clearReferrerAuth();
    clearAuth();
    AsyncStorage.multiRemove([
      'referrerToken', 'referrerProfile', 'referrerDemoExpiresAt',
      'authToken', 'authRole', 'student',
    ]).catch(() => {});
  }

  useEffect(() => {
    (async () => {
      try {
        // Restore sesi student
        const token      = await AsyncStorage.getItem('authToken');
        const role       = await AsyncStorage.getItem('authRole');
        const rawStudent = await AsyncStorage.getItem('student');
        const done       = await AsyncStorage.getItem('placementDone');
        if (token && role) {
          setAuth(token, role);
          if (rawStudent) {
            const s = JSON.parse(rawStudent);
            setStudent(s);
            if (s?.current_level) setLevel(s.current_level);
          }
          if (done === 'true') setPlacementDone(true);
        }

        // Restore sesi admin (owner/developer) — portal admin, bukan demo
        const admToken = await AsyncStorage.getItem('adminToken');
        const rawAdmin = await AsyncStorage.getItem('adminProfile');
        if (admToken) setAdminAuth(admToken, rawAdmin ? JSON.parse(rawAdmin) : null);

        // Restore sesi referrer
        const refToken = await AsyncStorage.getItem('referrerToken');
        const rawRef   = await AsyncStorage.getItem('referrerProfile');
        const refExp   = await AsyncStorage.getItem('referrerDemoExpiresAt');
        if (refToken && rawRef) {
          const ref = JSON.parse(rawRef);
          if (ref?.type === 'marketing') {
            // FIX: jangan reset timer tiap load. Expiry disimpan
            // di AsyncStorage oleh ReferrerLoginScreen.
            const expMs = Number(refExp) || 0;
            if (expMs > Date.now()) {
              // Masih dalam window demo -> lanjut dengan sisa waktu
              setReferrerAuth(refToken, ref);
              setDemoMode('marketing', ref.full_name || 'Marketing Demo', expMs);
            } else {
              // Sesi demo lama tanpa batas / sudah habis -> JANGAN auto-demo.
              // Dibersihkan agar kembali ke halaman default (RoleSelect -> HomeScreen).
              await AsyncStorage.multiRemove(
                ['referrerToken', 'referrerProfile', 'referrerDemoExpiresAt']);
            }
          } else {
            setReferrerAuth(refToken, ref);
          }
        }

        // Restore sesi parent
        const parToken  = await AsyncStorage.getItem('parentToken');
        const rawParent = await AsyncStorage.getItem('parent');
        if (parToken && rawParent) setParentAuth(parToken, JSON.parse(rawParent));

        // Restore sesi teacher
        const tchToken   = await AsyncStorage.getItem('teacherToken');
        const rawTeacher = await AsyncStorage.getItem('teacher');
        if (tchToken && rawTeacher) setTeacherAuth(tchToken, JSON.parse(rawTeacher));

        // Restore preferensi audio (BGM/SFX) + riwayat sesi per level
        // untuk rotasi adaptif BGM Zona B (cadas-sounds.md Bagian 5 & 6 poin 2)
        await useStore.getState().hydrateAudioState?.();

        // CATATAN: demo mode admin tidak di-persist di AsyncStorage
        // (sengaja — admin harus aktifkan ulang setiap sesi via Settings)
      } catch (_) {}
      setBootstrapped(true);
    })();
  }, []);

  // Watchdog demo: auto-exit tepat waktu walau DemoHome tidak ter-mount
  // (mis. user sedang di DemoPractice atau tab lain).
  useEffect(() => {
    if (!demoMode || !demoExpiresAt) return;
    const left = new Date(demoExpiresAt).getTime() - Date.now();
    if (left <= 0) { exitDemoNow(); return; }
    const id = setTimeout(exitDemoNow, left);
    return () => clearTimeout(id);
  }, [demoMode, demoExpiresAt]);

  if (!bootstrapped) return null;

  const isLoggedIn    = !!authToken;
  const needPlacement = isLoggedIn && authRole === 'student' && !placementDone;
  const isReferrer    = !!referrerToken;
  const isParent      = !!parentToken && !isLoggedIn;
  const isTeacher     = !!teacherToken && !isLoggedIn;
  // Demo mode aktif: client passcode atau marketing yang sudah login
  const isDemo = demoMode;
  // Admin (owner/developer): portal admin dengan full access QA
  const isAdmin = !!adminToken;
  // Marketing referrer yang sedang demo: tetap punya referrerToken tapi masuk demo stack
  const isReferrerOnlyDashboard = isReferrer && !demoMode;
  // P2 (A7): link khusus admin ?via=link → Portal Admin jadi layar awal (web).
  // Link ini disimpan owner secara privat; UI publik tetap tanpa tombol Admin.
  const viaAdminLink = !isAdmin && typeof window !== 'undefined' &&
    typeof window.location === 'object' && !!window.location.search &&
    window.location.search.indexOf('via=link') !== -1;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Stack.Navigator screenOptions={{ headerShown: false }}>

            {/* ── DEMO STACK (admin / marketing / client passcode) ─────── */}
            {isAdmin ? (
              <>
                <Stack.Screen name='AdminDashboard' component={AdminDashboardScreen} />
                <Stack.Screen name='AdminPractice'  component={PracticeScreen} />
                <Stack.Screen name='AdminFastTrack' component={FastTrackScreen} />
                <Stack.Screen name='SessionResult'  component={SessionResultScreen} />
              </>

            ) : isDemo ? (
              <>
                <Stack.Screen name='DemoHome'     component={DemoHomeScreen} />
                <Stack.Screen name='DemoPractice' component={PracticeScreen} />
                <Stack.Screen name='SessionResult' component={SessionResultScreen} />
              </>

            /* ── REFERRER DASHBOARD (school / non-marketing referrer) ── */
            ) : isReferrerOnlyDashboard ? (
              <>
                <Stack.Screen name='ReferrerDashboard' component={ReferrerDashboardScreen} />
                <Stack.Screen name='ReferrerEarnings'  component={ReferrerEarningsScreen} />
                <Stack.Screen name='ReferrerClicks'    component={ReferrerClicksScreen} />
                <Stack.Screen name='ReferrerBank'      component={ReferrerBankScreen} />
                <Stack.Screen name='ReferrerPassword'  component={ReferrerChangePasswordScreen} />
              </>

            /* ── PARENT STACK ────────────────────────────────────────── */
            ) : isParent ? (
              <>
                <Stack.Screen name='ParentDashboard' component={ParentDashboardScreen} />
                <Stack.Screen name='ChildProgress'   component={ChildProgressScreen} />
                <Stack.Screen name='ChildSessions'   component={ChildSessionsScreen} />
                <Stack.Screen name='ChildBilling'         component={ChildBillingScreen} />
                <Stack.Screen name='ChildWeeklySummary' component={ChildWeeklySummaryScreen} />
              </>

            /* ── TEACHER STACK ───────────────────────────────────────── */
            ) : isTeacher ? (
              <>
                <Stack.Screen name='TeacherDashboard' component={TeacherDashboardScreen} />
                <Stack.Screen name='StudentDetail'    component={StudentDetailScreen} />
              </>

            /* ── AUTH STACK (belum login) ────────────────────────────── */
            ) : !isLoggedIn ? (
              <>
                {viaAdminLink ? (
                  <Stack.Screen name='AdminLogin'    component={AdminLoginScreen} />
                ) : (
                  <Stack.Screen name='RoleSelect'    component={RoleSelectScreen} />
                )}
                <Stack.Screen name='StudentRegister' component={StudentRegisterScreen} />
                <Stack.Screen name='Placement'       component={PlacementScreen} />
                <Stack.Screen name='PlacementResult' component={PlacementResultScreen} />
                <Stack.Screen name='ParentAuth'      component={ParentAuthScreen} />
                <Stack.Screen name='TeacherAuth'     component={TeacherAuthScreen} />
                <Stack.Screen name='ReferrerLogin'   component={ReferrerLoginScreen} />
                {!viaAdminLink && (
                  <Stack.Screen name='AdminLogin'    component={AdminLoginScreen} />
                )}
              </>

            /* ── PLACEMENT WAJIB ─────────────────────────────────────── */
            ) : needPlacement ? (
              <>
                <Stack.Screen name='Placement'       component={PlacementScreen} />
                <Stack.Screen name='PlacementResult' component={PlacementResultScreen} />
                <Stack.Screen name='ParentAuth'      component={ParentAuthScreen} />
              </>

            /* ── MAIN APP (student login + placement done) ───────────── */
            ) : (
              <>
                <Stack.Screen name='Main'           component={TabNavigator} />
                <Stack.Screen name='Practice'       component={PracticeScreen} />
                <Stack.Screen name='FastTrack'      component={FastTrackScreen} />
                <Stack.Screen name='UpgradePaywall' component={UpgradePaywallScreen} />
                <Stack.Screen name='SessionResult'  component={SessionResultScreen} />
              </>
            )}

          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
