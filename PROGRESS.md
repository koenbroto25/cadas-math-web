# Progress Log — Cadas App Development
> Diperbarui: 9 September 2026 (sesi kedua)
> Berdasarkan audit kode aktual.
> ✅ = terverifikasi ada di file | ⚠️ = ada tapi tidak lengkap/ada gap | ❌ = belum ada

---

## RINGKASAN STATUS PER FASE

| Fase | Nama | Backend | Frontend | Ket |
|------|------|---------|----------|-----|
| 0 | Setup & Orientasi | ✅ | ✅ | Selesai |
| 1 | Gap Konten (speed-math-master) | ✅ | — | Gap 1.4 belum dikonfirmasi |
| 2 | Backend Foundation & Migrasi | ✅ | ✅ | Bug tabel placement dicatat |
| 3 | Auth, Role Routing & Onboarding | ✅ | ⚠️ | Backend lengkap, 1 dari 5 screen frontend selesai |
| 4 | Placement Test | ⚠️ | ❌ | Backend ada, screen PlacementScreen/ResultScreen belum ada |
| 5 | Practice Loop | ⚠️ | ⚠️ | Backend ada, koneksi belum dikonfirmasi |
| 6 | Billing Per-Level | ✅ | ⚠️ | Backend lengkap + security fix, UpgradePaywall ada |
| 7 | Fast Track & Upgrade Test | ✅ | ⚠️ | Backend jalan, SessionResult masih stub |
| 8 | RAG Pipeline & AskKak | ⚠️ | ⚠️ | Pipeline ada, semantic placeholder, circuit breaker belum aktif |
| 9 | Avatar & Gamification | ✅ | ✅ | useStore bersih, BotCharacter ada |
| 10 | Parent Dashboard | ❌ | ❌ | Belum dimulai |
| 11 | Guru & Referral | ❌ | ❌ | Belum dimulai |
| 12 | Polish, Offline, Beta Test | ❌ | ❌ | Belum dimulai |
| 13 | Distribusi & Rilis | ❌ | ❌ | Belum dimulai |

---

## PEKERJAAN SESI INI (9 September 2026)

### Backend — SELESAI
- ✅ POST /api/auth/student/login ditambahkan ke auth.js
- ✅ POST /api/auth/parent/link-child ditambahkan ke auth.js
- ✅ requireRole diimpor di auth.js (fix ReferenceError)
- ✅ GET /api/billing/status/:student_id dilindungi verifyToken + requireRole('admin','parent')
- ✅ Parent-child ownership check ditambahkan ke billing/status handler
- ✅ routes/payment.js dibuat baru:
     POST /api/payment/upgrade-tier
     POST /api/admin/billing/activate
     GET  /api/admin/billing/status/:student_id
- ✅ payment routes didaftarkan di index.js (/api/payment + /api/admin)
- ✅ Semua route load tanpa error (node -e require test lulus)

### Frontend — SELESAI
- ✅ useStore.js ditulis ulang bersih — auth state (authToken, authRole, placementDone, setAuth, clearAuth, setPlacementDone) ada 1x
- ✅ App.jsx ditulis ulang — AuthStack + needPlacement logic + AsyncStorage restore sesi
- ✅ RoleSelectScreen.jsx dibuat

### Frontend — DALAM PROSES
- ⏳ StudentRegisterScreen.jsx — belum dibuat
- ⏳ PlacementScreen.jsx — belum dibuat
- ⏳ PlacementResultScreen.jsx — belum dibuat
- ⏳ ParentAuthScreen.jsx — belum dibuat
- ⏳ SessionResultScreen.jsx — masih stub, perlu rewrite

---

## DATABASE — STATUS TABEL

| Tabel | Migration | Status | Catatan |
|-------|-----------|--------|---------|
| students | 001 | ✅ | paid_basic/premium_up_to_level sesuai Addendum §1.2 |
| parents | 001 | ✅ | |
| parent_children | 001 | ✅ | |
| teachers | 001 | ✅ | |
| referrers | 001 | ✅ | total_active_referrals belum ada di skema — ditambahkan di payment.js tapi kolom belum ada |
| payment_records | 001 | ✅ | |
| placement_tests | 009 | ⚠️ | BUG: start_level DEFAULT 5 (harusnya 8), student_id VARCHAR bukan UUID |
| placement_probe_results | 009 | ✅ | |
| upgrade_tests | 010 | ✅ | |
| student_variant_bias | 011 | ✅ | |
| student_explanation_effectiveness | 011 | ✅ | |
| student_level_quota | 011 | ✅ | limit default 40 |
| openrouter_cost_log | 011 | ✅ | |
| student_questions | 011 | ✅ | |
| technique_taught_and_passed | — | ❌ | Disebut FASE 5, belum ada migration |

---

## GAP YANG MASIH PERLU DIKERJAKAN

### Prioritas 1 — Frontend screen yang belum ada (blocking onboarding)
1. ❌ StudentRegisterScreen.jsx — daftar + login siswa
2. ❌ PlacementScreen.jsx — placement test UI
3. ❌ PlacementResultScreen.jsx — hasil placement + CTA daftar orang tua
4. ❌ ParentAuthScreen.jsx — register/login orang tua
5. ❌ SessionResultScreen.jsx — rewrite dari stub (level_up flag, drill suggestion)

### Prioritas 2 — Bug & gap database
6. ⚠️ Migration fix 009: start_level DEFAULT 8, student_id UUID
7. ❌ Migration baru: kolom referrers.total_active_referrals (dipakai payment.js tapi belum ada di skema)
8. ❌ Migration baru: tabel technique_taught_and_passed

### Prioritas 3 — FASE 10: Parent Dashboard
9. ❌ GET /api/parent/dashboard/:parent_id
10. ❌ GET /api/parent/analytics/:student_id
11. ❌ ParentDashboardScreen.jsx
12. ❌ ParentAnalyticsScreen.jsx
13. ❌ ManageChildrenScreen.jsx
14. ❌ Push notification (FCM)
15. ❌ Focus Score tracking

### Prioritas 4 — FASE 11: Guru & Referral
16. ❌ Referral token system (GET /d/:token, download_clicks, IP attribution)
17. ❌ Alur pengajuan referrer per tipe
18. ❌ ClassroomDashboardScreen.jsx
19. ❌ AjakTemanScreen.jsx
20. ❌ Admin endpoints referral

### Prioritas 5 — Konfirmasi & verifikasi
21. ⚠️ pgvector migration 002 perlu dijalankan ulang setelah upgrade image
22. ⚠️ Gap 1.4 explanation_variants 15/15 belum dikonfirmasi via query
23. ⚠️ upgrade-test.js pakai Pool sendiri — ganti ke shared db.js

---

## PERTANYAAN TERBUKA

| # | Pertanyaan | Memengaruhi |
|---|-----------|-------------|
| 1 | Quota reset: cumulative (saat ini) atau monthly? | FASE 8 |
| 2 | Student login pakai student_id saja — apakah cukup aman untuk konteks ini? | FASE 3 |
| 3 | Bulk purchase kelompok: alur belum didesain | FASE 6/11 |
| 4 | pgvector migration 002 sudah dijalankan setelah upgrade image? | FASE 8 |
| 5 | Gap 1.4: 15/15 explanation_variants sudah lolos audit? | FASE 1 |
| 6 | referrers.total_active_referrals: tambah via migration atau update 001? | FASE 11 |

---

## FIXES APPLIED (9 September 2026)

### Commit 39c25a4 (sebelum sesi ini):
- ✅ Harga diperbaiki: Single 40K, Basic Bundle 100K, Premium Bundle 165K
- ✅ postgres image upgrade ke pgvector/pgvector:pg16
- ✅ gemini-tts.js dihubungkan ke GOOGLE_API_KEY
- ✅ quota-rules.js dibuat

### Sesi ini (belum di-commit):
- ✅ auth.js: student/login, parent/link-child, requireRole import fix
- ✅ index.js: billing/status dilindungi auth + ownership check
- ✅ routes/payment.js dibuat baru
- ✅ index.js: payment + admin routes didaftarkan
- ✅ useStore.js: ditulis ulang bersih dengan auth state
- ✅ App.jsx: ditulis ulang dengan AuthStack + AsyncStorage restore
- ✅ RoleSelectScreen.jsx dibuat
