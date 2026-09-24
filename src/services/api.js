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
  // studentId opsional: dipakai backend untuk enforce trial + card gate (A1).
  getExercises: (level, token, studentId) => authFetch(
    `/api/exercises/${level}${studentId ? `?student_id=${encodeURIComponent(studentId)}` : ''}`,
    {}, token
  ),
  getExercise:  (id, token)    => authFetch(`/api/exercises/item/${id}`, {}, token),
  levelInfo:    (level, studentId) => authFetch(
    `/api/exercises/level-info/${level}${studentId ? `?student_id=${encodeURIComponent(studentId)}` : ''}`
  ),
  // Status trial level (5 soal gratis) — dipakai paywall tiap 5 soal.
  // Respons juga memuat card_gate { required, card_shared } (A1/OQ-3).
  trialStatus:  (level, studentId) => authFetch(
    `/api/exercises/level-info/${level}?student_id=${encodeURIComponent(studentId)}`
  ),

  // -- Kartu ID siswa (A1 / OQ-3) --------------------------------------------
  getStudentCard: (token) => authFetch('/api/auth/student/card', {}, token),
  markCardShared: (token, via = 'app') => authFetch('/api/auth/student/card-shared', {
    method: 'PATCH',
    body: JSON.stringify({ shared_via: via }),
  }, token),

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
  referrerDashboard:  (token)       => authFetch('/api/referrer/dashboard', {}, token),
  referrerNetwork:    (token)       => authFetch('/api/referrer/network', {}, token),
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
  adminMarketingOverview: (token) => authFetch('/api/admin/marketing/overview', {}, token),
  adminBillingStatus: (studentId, token) =>
    authFetch(`/api/admin/billing/status/${encodeURIComponent(studentId)}`, {}, token),

  // -- Finance reports ---------------------------------------------------------
  financeSummary: (query = {}, token) => authFetch(`/api/admin/finance/summary?${new URLSearchParams(query)}`, {}, token),
  financePayments: (query = {}, token) => authFetch(`/api/admin/finance/payments?${new URLSearchParams(query)}`, {}, token),
  financeEarnings: (query = {}, token) => authFetch(`/api/admin/finance/earnings?${new URLSearchParams(query)}`, {}, token),
  financeCancellations: (query = {}, token) => authFetch(`/api/admin/finance/cancellations?${new URLSearchParams(query)}`, {}, token),
  financePayouts: (query = {}, token) => authFetch(`/api/admin/finance/payouts?${new URLSearchParams(query)}`, {}, token),
  financeReconciliation: (query = {}, token) => authFetch(`/api/admin/finance/reconciliation?${new URLSearchParams(query)}`, {}, token),
  financeWindows: (query = {}, token) => authFetch(`/api/admin/finance/windows?${new URLSearchParams(query)}`, {}, token),
  financeSchedulerRuns: (query = {}, token) => authFetch(`/api/admin/finance/scheduler-runs?${new URLSearchParams(query)}`, {}, token),
  financeRunScheduler: (data = {}, token) => authFetch('/api/admin/finance/scheduler/run', { method: 'POST', body: JSON.stringify(data) }, token),
  financeBackfill: (token) => authFetch('/api/admin/finance/cash-ledger/backfill', { method: 'POST' }, token),
  financeExportUrl: (type, query = {}) => `${_base}/api/admin/finance/export/${encodeURIComponent(type)}?${new URLSearchParams({ ...query, format: 'csv' })}`,
  financeExportJson: (type, query = {}, token) => authFetch(`/api/admin/finance/export/${encodeURIComponent(type)}?${new URLSearchParams({ ...query, format: 'json' })}`, {}, token),
  financeCreatePayout: (data, token) => authFetch('/api/admin/finance/payout-batches', { method: 'POST', body: JSON.stringify(data) }, token),
  financeMarkTransferred: (id, data, token) => authFetch(`/api/admin/finance/payout-batches/${encodeURIComponent(id)}/transferred`, { method: 'POST', body: JSON.stringify(data) }, token),
  financeCancelEarning: (id, data, token) => authFetch(`/api/admin/finance/earnings/${encodeURIComponent(id)}/cancel`, { method: 'POST', body: JSON.stringify(data) }, token),
  financeSaveReconciliation: (data, token) => authFetch('/api/admin/finance/reconciliation', { method: 'POST', body: JSON.stringify(data) }, token),

  // -- Session Notification System (Sprint S-2 & S-3) -----------------------
  sessionStart: (data, token) =>
    authFetch('/api/session/start', { method: 'POST', body: JSON.stringify(data) }, token),
  sessionHeartbeat: (data, token) =>
    authFetch('/api/session/heartbeat', { method: 'POST', body: JSON.stringify(data) }, token),
  sessionEnd: (data, token) =>
    authFetch('/api/session/end', { method: 'POST', body: JSON.stringify(data) }, token),

  // -- Boss Battle (championship gate L9) ------------------------------------
  bossStatus: (studentId, token) =>
    authFetch(`/api/boss/status/${encodeURIComponent(studentId)}`, {}, token),
  bossStart: (data, token) =>
    authFetch('/api/boss/start', { method: 'POST', body: JSON.stringify(data) }, token),
  bossHit: (data, token) =>
    authFetch('/api/boss/hit', { method: 'POST', body: JSON.stringify(data) }, token),
  bossAbandon: (data, token) =>
    authFetch('/api/boss/abandon', { method: 'POST', body: JSON.stringify(data) }, token),
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

  // -- Midtrans QRIS (infra existing Sprint D.2) -------------------------------
  createTransaction: (data, token) =>
    authFetch('/api/midtrans/create-transaction', { method: 'POST', body: JSON.stringify(data) }, token),
  // GET /api/midtrans/status/:order_id pakai verifyToken -> kirim token.
  midtransStatus: (orderId, token) => authFetch(`/api/midtrans/status/${encodeURIComponent(orderId)}`, {}, token),
  midtransCheckLive: (orderId, token) =>
    authFetch(`/api/midtrans/check-live/${encodeURIComponent(orderId)}`, {}, token),

  // -- Auth & Payment (from payments.js)
  getAccessSummary: (studentId, token) =>
    authFetch(`/api/payments/status/${encodeURIComponent(studentId)}`, {}, token),

  // 2. Midtrans + purchase + payment records
  createQrisPurchase: (data, token) =>
    authFetch('/api/payments/qris', { method: 'POST', body: JSON.stringify(data) }, token),
  paymentStatus: (orderId, token) =>
    authFetch(`/api/midtrans/status/${encodeURIComponent(orderId)}`, {}, token),

  // -- Secure partner invites ------------------------------------------------
  partnerInviteRegister: (data) =>
    authFetch('/api/referrer/register-via-invite', { method: 'POST', body: JSON.stringify(data) }),
  partnerInvitesCreate: (data, token) =>
    authFetch('/api/referrer/team-invites', { method: 'POST', body: JSON.stringify(data) }, token),
  partnerInvitesList: (token) =>
    authFetch('/api/referrer/team-invites', {}, token),
  partnerInviteRevoke: (id, token) =>
    authFetch(`/api/referrer/team-invites/${encodeURIComponent(id)}/revoke`, { method: 'POST' }, token),
  adminPartnerInviteCreate: (data, token) =>
    authFetch('/api/admin/partner-invites', { method: 'POST', body: JSON.stringify(data) }, token),
  adminPartnerInviteList: (token) =>
    authFetch('/api/admin/partner-invites', {}, token),
  adminPartnerInviteRevoke: (id, token) =>
    authFetch(`/api/admin/partner-invites/${encodeURIComponent(id)}/revoke`, { method: 'POST' }, token),

  testAccountRedeem: (code) =>
    authFetch('/api/auth/test-account/redeem', { method: 'POST', body: JSON.stringify({ code }) }),
  testAccountsCreate: (data, token) =>
    authFetch('/api/referrer/test-accounts', { method: 'POST', body: JSON.stringify(data || {}) }, token),
  testAccountsList: (token) =>
    authFetch('/api/referrer/test-accounts', {}, token),
  testAccountRevoke: (id, token) =>
    authFetch(`/api/referrer/test-accounts/${encodeURIComponent(id)}/revoke`, { method: 'POST' }, token),
  adminTestAccountCreate: (data, token) =>
    authFetch('/api/admin/test-accounts', { method: 'POST', body: JSON.stringify(data || {}) }, token),
  adminTestAccountList: (token) =>
    authFetch('/api/admin/test-accounts', {}, token),
  adminTestAccountRevoke: (id, token) =>
    authFetch(`/api/admin/test-accounts/${encodeURIComponent(id)}/revoke`, { method: 'POST' }, token),

  // -- Invite ortu (A2: QR + link web, redeem pasca-login ortu) ----------------
  inviteCreate: (data, token) =>
    authFetch('/api/payments/invite', { method: 'POST', body: JSON.stringify(data) }, token),
  inviteRedeem: (data, token) =>
    authFetch('/api/payments/invite/redeem', { method: 'POST', body: JSON.stringify(data) }, token),

  // Ringkasan mingguan
  parentWeeklySummary: (studentId, token) =>
    authFetch(`/api/parent/weekly-summary/${encodeURIComponent(studentId)}`, {}, token),
};