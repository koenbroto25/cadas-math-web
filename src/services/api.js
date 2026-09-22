// src/services/api.js
// Semua komunikasi ke backend Express (cadas-app-backend)
//
// Override tanpa ubah kode:
//   EXPO_PUBLIC_API_URL=http://192.168.1.5:3000 npx expo start
// Default dev: 10.0.2.2 = loopback host laptop dari Android emulator.
// Untuk device fisik di WiFi yang sama, isi EXPO_PUBLIC_API_URL dgn IP LAN.

const _base = process.env.EXPO_PUBLIC_API_URL
  || (typeof window !== 'undefined' ? window.location.origin
    : (__DEV__ ? 'http://10.0.2.2:3000' : 'https://cadasmatematika.web.id'));

export const API_BASE = _base;
export const BASE_URL = _base;

async function authFetch(path, options = {}, token = null) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${_base}${path}`, { ...options, headers });
  let data;
  try {
    data = await res.json();
  } catch {
    data = { error: `Response tidak valid (${res.status})` };
  }

  if (!res.ok) {
    const err = new Error(data.error || `${options.method || 'GET'} ${path} failed: ${res.status}`);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // -- Exercises -------------------------------------------------------------
  getExercises: (level, token) => authFetch(`/api/exercises/${level}`, {}, token),
  getExercise:  (id, token)    => authFetch(`/api/exercises/item/${id}`, {}, token),
  levelInfo:    (level)        => authFetch(`/api/exercises/level-info/${level}`),

  // -- Selection Rule --------------------------------------------------------
  selectVariant: (studentId, level, conceptId, extra = {}, token) =>
    authFetch('/api/rag/select-variant', {
      method: 'POST',
      body: JSON.stringify({
        student_id: String(studentId),
        level: Number(level),
        concept_id: conceptId || null,
        ...(extra || {}),
      }),
    }, token),
  recordVariantShown:   (data, token) =>
    authFetch('/api/rag/record-shown',   { method: 'POST', body: JSON.stringify(data) }, token),
  recordVariantHelpful: (data, token) =>
    authFetch('/api/rag/record-helpful', { method: 'POST', body: JSON.stringify(data) }, token),

  // -- Progress --------------------------------------------------------------
  saveSession: (data, token) =>
    authFetch('/api/progress/session', { method: 'POST', body: JSON.stringify(data) }, token),
  getProgress: (studentId, token) => authFetch(`/api/progress/${studentId}`, {}, token),

  // -- Audio TTS -------------------------------------------------------------
  ttsUrl:    (exerciseId, type = 'hint') => `${_base}/api/tts/${exerciseId}?type=${type}`,
  visemeUrl: (exerciseId, type = 'hint') => `${_base}/api/viseme/${exerciseId}?type=${type}`,

  // -- Audio level -----------------------------------------------------------
  levelVoice:    (level)          => authFetch(`/api/rag/level-voice/${level}`),
  levelAudioUrl: (level, segment) =>
    `${_base}/audio/speech/gemini/opus/L${level}_${segment}.opus`,

  // -- Bot audio -------------------------------------------------------------
  botAudioUrl:  (id) => `${_base}/api/bot-audio/${id}`,
  botVisemeUrl: (id) => `${_base}/api/bot-viseme/${id}`,

  // -- BGM & SFX -------------------------------------------------------------
  bgmUrl: (track) => `${_base}/api/bgm/${track}`,
  sfxUrl: (id)    => `${_base}/api/sfx/${id}`,

  // -- Referrer --------------------------------------------------------------
  referrerLogin:      (data)        =>
    authFetch('/api/referrer/login',    { method: 'POST', body: JSON.stringify(data) }),
  referrerMe:         (token)       => authFetch('/api/referrer/me', {}, token),
  referrerEarnings:   (token, page) =>
    authFetch(`/api/referrer/earnings?page=${page || 1}`, {}, token),
  referrerClicks:     (token, page) =>
    authFetch(`/api/referrer/clicks?page=${page || 1}`, {}, token),
  referrerUpdateBank: (data, token) =>
    authFetch('/api/referrer/bank',     { method: 'PUT', body: JSON.stringify(data) }, token),
  referrerChangePass: (data, token) =>
    authFetch('/api/referrer/password', { method: 'PUT', body: JSON.stringify(data) }, token),

  // -- Parent Dashboard ------------------------------------------------------
  parentChildren:      (token)                            =>
    authFetch('/api/parent/children', {}, token),
  parentChildProgress: (studentId, token)                 =>
    authFetch(`/api/parent/child/${encodeURIComponent(studentId)}/progress`, {}, token),
  parentChildSessions: (studentId, page = 1, limit = 20, token) =>
    authFetch(`/api/parent/child/${encodeURIComponent(studentId)}/sessions?page=${page}&limit=${limit}`, {}, token),
  parentChildBilling:  (studentId, token)                 =>
    authFetch(`/api/parent/child/${encodeURIComponent(studentId)}/billing`, {}, token),

  // -- Parent Auth -----------------------------------------------------------
  parentAddChild: (childId, token) =>
    authFetch('/api/auth/parent/add-child', {
      method: 'POST', body: JSON.stringify({ child_id: childId }),
    }, token),
  parentMergeAccount: (sourceEmail, password, token) =>
    authFetch('/api/auth/parent/merge-account', {
      method: 'POST', body: JSON.stringify({ source_email: sourceEmail, password }),
    }, token),
  parentLinkedChildren: (token) =>
    authFetch('/api/auth/parent/children', {}, token),

  // -- Teacher Dashboard -----------------------------------------------------
  teacherMe:       (token)            => authFetch('/api/teacher/me', {}, token),
  teacherStudents: (token)            => authFetch('/api/teacher/students', {}, token),
  teacherProgress: (studentId, token) =>
    authFetch(`/api/teacher/student/${encodeURIComponent(studentId)}/progress`, {}, token),
  teacherSessions: (studentId, page = 1, limit = 20, token) =>
    authFetch(`/api/teacher/student/${encodeURIComponent(studentId)}/sessions?page=${page}&limit=${limit}`, {}, token),

  // -- Demo Mode -------------------------------------------------------------
  demoRedeem: (code) =>
    authFetch('/api/auth/demo/redeem', { method: 'POST', body: JSON.stringify({ code }) }),
  demoAdminToken: (adminSecret) =>
    authFetch('/api/auth/demo/admin-token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-secret': adminSecret },
    }),
  demoPasscodeList:   (token) =>
    authFetch('/api/admin/demo-passcodes', {}, token),
  demoPasscodeCreate: (label, hours, token) =>
    authFetch('/api/admin/demo-passcodes', {
      method: 'POST', body: JSON.stringify({ label, hours }),
    }, token),
  demoPasscodeRevoke: (id, token) =>
    authFetch(`/api/admin/demo-passcodes/${id}`, { method: 'DELETE' }, token),

  // -- Admin -----------------------------------------------------------------
  adminLogin: (email, password) =>
    authFetch('/api/auth/admin/login', {
      method: 'POST', body: JSON.stringify({ email, password }),
    }),
  adminPinLogin: (pin) =>
    authFetch('/api/auth/admin/pin-login', {
      method: 'POST', body: JSON.stringify({ pin }),
    }),
  adminMe:        (token) => authFetch('/api/auth/admin/me', {}, token),
  adminStudents:  (token) => authFetch('/api/admin/students', {}, token),
  adminPayments:  (token) => authFetch('/api/admin/payments', {}, token),
  adminReferrers: (token) => authFetch('/api/admin/referrers', {}, token),
  adminBillingStatus: (studentId, token) =>
    authFetch(`/api/admin/billing/status/${encodeURIComponent(studentId)}`, {}, token),

  // -- Session Notification System (Sprint S-2 & S-3) -----------------------
  sessionStart: (data, token) =>
    authFetch('/api/session/start', { method: 'POST', body: JSON.stringify(data) }, token),
  sessionHeartbeat: (data, token) =>
    authFetch('/api/session/heartbeat', { method: 'POST', body: JSON.stringify(data) }, token),
  sessionEnd: (data, token) =>
    authFetch('/api/session/end', { method: 'POST', body: JSON.stringify(data) }, token),

  // Jadwal belajar (parent set)
  scheduleSet: (data, token) =>
    authFetch('/api/schedule', { method: 'POST', body: JSON.stringify(data) }, token),
  scheduleGet: (studentId, token) =>
    authFetch(`/api/schedule/${encodeURIComponent(studentId)}`, {}, token),

  // FCM device token
  registerDeviceToken: (data, token) =>
    authFetch('/api/device-token', { method: 'POST', body: JSON.stringify(data) }, token),

  // Riwayat study_sessions (focus_ratio, exit_count, dll)
  parentStudySessions: (studentId, page = 1, limit = 20, token) =>
    authFetch(`/api/parent/child/${encodeURIComponent(studentId)}/study-sessions?page=${page}&limit=${limit}`, {}, token),

  // Ringkasan mingguan
  parentWeeklySummary: (studentId, token) =>
    authFetch(`/api/parent/weekly-summary/${encodeURIComponent(studentId)}`, {}, token),
};