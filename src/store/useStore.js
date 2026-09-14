// src/store/useStore.js
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { targetMsFor } from '../constants/levelTargets';

export const useStore = create((set, get) => ({

  // -- Auth ---------------------------------------------------------------
  authToken:     null,
  authRole:      null,
  placementDone: false,
  setAuth: (token, role) => set({ authToken: token, authRole: role }),
  setPlacementDone: (v) => set({ placementDone: v }),
  clearAuth: () => set({ authToken: null, authRole: null, placementDone: false, student: null }),

  // -- Student ------------------------------------------------------------
  student:      null,
  currentLevel: 1,
  levelAccess:  'trial',
  setStudent: (s) => set({ student: s }),
  setLevel:   (l) => set({ currentLevel: l }),
  setLevelAccess: (a) => set({ levelAccess: a }),

  // -- Demo Mode ----------------------------------------------------------
  // kind: null | 'admin' | 'marketing' | 'client'
  // Saat demoMode aktif:
  //   - levelAccess selalu 'premium'
  //   - saveSession di-skip
  //   - banner "Mode Demo" tampil
  //   - pilih level bebas 1-15
  demoMode:      false,
  demoKind:      null,   // 'admin' | 'marketing' | 'client'
  demoLabel:     null,   // nama untuk banner, mis. "Admin Demo" / "SMP Banjarbaru"
  demoExpiresAt: null,   // Date | null  — hanya untuk client
  demoLevel:     1,      // level yang sedang dipilih di demo

  setDemoMode: (kind, label, expiresAt = null) => set({
    demoMode:      true,
    demoKind:      kind,
    demoLabel:     label || 'Demo',
    demoExpiresAt: expiresAt ? new Date(expiresAt) : null,
    demoLevel:     1,
    levelAccess:   'premium',
  }),
  setDemoLevel: (l) => set({ demoLevel: l, currentLevel: l }),
  clearDemoMode: () => set({
    demoMode: false, demoKind: null, demoLabel: null,
    demoExpiresAt: null, demoLevel: 1,
  }),

  // -- Session ------------------------------------------------------------
  exercises:      [],
  currentIndex:   0,
  sessionResults: [],
  streak:         0,
  xp:             0,

  setExercises: (ex) => set({ exercises: ex, currentIndex: 0, sessionResults: [], xp: 0 }),
  nextExercise: () => set((s) => ({ currentIndex: s.currentIndex + 1 })),

  recordAnswer: (exerciseId, correct, timeMs) => set((s) => {
    const streak = correct ? s.streak + 1 : 0;
    const xp     = s.xp + (correct ? (s.streak >= 5 ? 15 : 10) : 0);
    return { streak, xp, sessionResults: [...s.sessionResults, { id: exerciseId, correct, timeMs }] };
  }),

  // -- Bot state ----------------------------------------------------------
  botMode:  'terbimbing',
  botState: 'idle',
  setBotMode:  (m) => set({ botMode: m }),
  setBotState: (s) => set({ botState: s }),

  // -- Audio (paket cadas-audio — cadas-sounds.md Bagian 5) ---------------
  // bgmVolume default 70%: hierarki Backsound < Micro-sound < Bot audio.
  audioPrefs: { bgmEnabled: true, sfxEnabled: true, bgmVolume: 0.7, sfxVolume: 1.0 },
  levelSessionCounts: {},   // { [level]: jumlah sesi latihan siswa di level itu }
  bgmTrack: null,           // track BGM sesi berjalan (agar Practice -> Result tidak ganti lagu)

  setBgmTrack: (t) => set({ bgmTrack: t }),

  setAudioPrefs: (patch) => {
    const next = { ...get().audioPrefs, ...(patch || {}) };
    set({ audioPrefs: next });
    AsyncStorage.setItem('audioPrefs', JSON.stringify(next)).catch(() => {});
  },

  setLevelSessionCount: (level, count) => {
    const n = Math.max(0, Number(count) || 0);
    const next = { ...get().levelSessionCounts, [level]: Math.max(get().levelSessionCounts[level] || 0, n) };
    set({ levelSessionCounts: next });
    AsyncStorage.setItem('levelSessionCounts', JSON.stringify(next)).catch(() => {});
  },

  // Dipanggil sekali saat app start (App.jsx).
  hydrateAudioState: async () => {
    try {
      const [rawPrefs, rawCounts] = await Promise.all([
        AsyncStorage.getItem('audioPrefs'),
        AsyncStorage.getItem('levelSessionCounts'),
      ]);
      const patch = {};
      if (rawPrefs)  patch.audioPrefs = { ...get().audioPrefs, ...JSON.parse(rawPrefs) };
      if (rawCounts) patch.levelSessionCounts = JSON.parse(rawCounts);
      if (Object.keys(patch).length) set(patch);
    } catch (_) {}
  },

  // -- Companion ----------------------------------------------------------
  companionLevel: 0,
  setCompanionLevel: (l) => set({ companionLevel: l }),
  incrementCompanion: () => set((s) => ({ companionLevel: Math.min(5, s.companionLevel + 1) })),

  // -- Viseme -------------------------------------------------------------
  visemeData: null,
  setVisemeData: (data) => set({ visemeData: data }),
  clearVisemeData: () => set({ visemeData: null }),
  startSpeaking: (visemeData = null, hype = false) => set({
    botState: hype ? 'speaking_hype' : 'speaking_calm',
    visemeData: visemeData ?? null,
  }),
  stopSpeaking: () => set({ botState: 'idle', visemeData: null }),

  // -- Parent -------------------------------------------------------------
  parentToken:   null,
  parentProfile: null,
  setParentAuth:   (token, profile) => set({ parentToken: token, parentProfile: profile }),
  clearParentAuth: ()               => set({ parentToken: null, parentProfile: null }),

  // -- Teacher ------------------------------------------------------------
  teacherToken: null,
  teacher: null,
  setTeacherAuth:   (token, teacher) => set({ teacherToken: token, teacher }),
  clearTeacherAuth: ()               => set({ teacherToken: null, teacher: null }),

  // -- Parent ----------------------------------------------------------------
  parentToken:   null,
  parentProfile: null,
  setParentAuth:   (token, profile) => set({ parentToken: token, parentProfile: profile }),
  clearParentAuth: ()               => set({ parentToken: null, parentProfile: null }),

  // -- Teacher ------------------------------------------------------------
  teacherToken: null,
  teacher: null,
  setTeacherAuth:   (token, teacher) => set({ teacherToken: token, teacher }),
  clearTeacherAuth: ()               => set({ teacherToken: null, teacher: null }),

  // -- Referrer -----------------------------------------------------------
  referrerToken: null,
  referrer: null,
  setReferrerAuth:   (token, referrer) => set({ referrerToken: token, referrer }),
  clearReferrerAuth: ()               => set({ referrerToken: null, referrer: null }),

  // -- Confidence Score ---------------------------------------------------
  getConfidenceScore: () => {
    const results = get().sessionResults.slice(-20);
    if (results.length < 5) return 0;
    const accuracy = results.filter((r) => r.correct).length / results.length;
    const level = get().currentLevel;
    const TARGET_MS = targetMsFor(level);   // satu sumber: constants/levelTargets.js
    const times   = results.filter((r) => r.correct && r.timeMs).map((r) => r.timeMs);
    const avgTime = times.length ? times.reduce((a, b) => a + b, 0) / times.length : TARGET_MS * 2;
    const speedScore = Math.min(1, TARGET_MS / avgTime);
    const variance = times.length > 1
      ? Math.sqrt(times.map((t) => (t - avgTime) ** 2).reduce((a, b) => a + b, 0) / times.length)
      : avgTime;
    const consistency = Math.max(0, 1 - variance / avgTime);
    return accuracy * 0.40 + speedScore * 0.35 + consistency * 0.25;
  },
}));

