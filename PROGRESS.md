# Progress Log — Cadas App Development
> Diperbarui: 10 September 2026 (Sprint E SELESAI — Parent Dashboard 100%)
> Simbol: [OK] = terverifikasi | [!!] = ada tapi gap | [NO] = belum ada

---

## RINGKASAN STATUS PER FASE

| Fase | Nama | Backend | Frontend | Catatan |
|------|------|---------|----------|---------|
| 0 | Setup & Orientasi | OK | OK | Selesai |
| 1 | Gap Konten | OK | - | Gap 1.4 belum dikonfirmasi |
| 2 | Backend Foundation | OK | OK | index.js OK; double-mount FIXED Sprint D |
| 3 | Auth & Onboarding | OK | OK | 10 endpoint + 5 screen terverifikasi |
| 4 | Placement Test | OK | OK | start+submit live-tested; variant bias selesai |
| 5 | Practice Loop | OK | OK | selection-rule + PracticeScreen ter-wire |
| 6 | Billing Per-Level | OK | OK | Manual OK; Xendit Sprint D.2 selesai |
| 7 | Fast Track | OK | OK | getLevelAccess() shared, live-tested |
| 8 | RAG Pipeline | !! | OK | Pipeline OK; Bug D.0.1 fixed |
| 9 | Avatar & Gamification | OK | !! | useStore lengkap; BotCharacter belum reverifikasi |
| 10 | Parent Dashboard | OK | OK | Sprint E SELESAI — 4 backend + 4 screen |
| 11 | Guru Dashboard | NO | NO | Sprint F — belum dimulai |
| 12 | Sprint D: Xendit + Admin + Referrer | OK | OK | D.1-D.7 SEMUA SELESAI |
| 13 | Polish & Beta Test | NO | NO | Belum dimulai |
| 14 | Distribusi & Rilis | NO | NO | Belum dimulai |

---

## SPRINT E — SELESAI SEMUA [OK]

### E.1–E.3 Backend routes/parent.js
- OK GET /api/parent/children — list anak + snapshot (total_sessions, akurasi, last_session_at)
- OK GET /api/parent/child/:id/progress — stats keseluruhan + per_level breakdown
- OK GET /api/parent/child/:id/sessions — paginated (page, limit, total)
- OK GET /api/parent/child/:id/billing — payment_records + xendit_invoices
- OK Helper ownedByParent() — guard akses 403 per endpoint
- OK Didaftarkan di index.js sebelum /api/xendit
- OK Live-tested semua 4 endpoint (data kosong = benar, Budi Test 0 sesi)
- OK Seed data dummy 7 sesi untuk Budi Test (level 1-4)

### E.4 ParentDashboardScreen.jsx
- OK List anak dengan badge: Level, Sesi, Akurasi, Terakhir latihan
- OK Pull-to-refresh
- OK Navigasi ke ChildProgress, ChildSessions, ChildBilling
- OK Logout: AsyncStorage.multiRemove + clearParentAuth() (Zustand)

### E.5 ChildProgressScreen.jsx
- OK Stats ringkasan: level, total sesi, hari aktif, akurasi
- OK Progress bar per level dengan warna (hijau/kuning/merah)
- OK Pull-to-refresh
- OK Shortcut ke ChildBilling

### E.6 ChildSessionsScreen.jsx
- OK List sesi paginated (infinite scroll, load more)
- OK Mini progress bar per sesi
- OK Tampil: level, tanggal, benar/total, rata-rata detik, akurasi%

### E.6b ChildBillingScreen.jsx
- OK Status akses: paid_basic_up_to_level, paid_premium_up_to_level
- OK Riwayat payment_records (manual)
- OK Riwayat xendit_invoices (online)

### E — Fixes & Routing
- OK useStore: tambah parentToken, parent, setParentAuth, clearParentAuth
- OK App.jsx: Parent Stack terpisah (sejajar Referrer Stack, di atas Auth Stack)
- OK App.jsx: bootstrap restore parentToken dari AsyncStorage
- OK ParentAuthScreen: fix URL /api/auth/parent/*, pakai setParentAuth (bukan setPlacementDone)
- OK ParentDashboardScreen: logout pakai clearParentAuth()

---

## SPRINT D — SELESAI SEMUA [OK]

### D.1 Migration 012
- OK xendit_invoices, referrer_earnings, download_clicks, technique_taught_and_passed
- OK Kolom baru referrers: email, password_hash, referral_token, bank_*, total_clicks, total_earnings_idr
- OK referrers.status constraint: tambah suspended

### D.2 Xendit Integration
- OK POST /api/xendit/create-invoice
- OK POST /api/xendit/webhook — idempotent, aktivasi akses + catat komisi
- OK GET /api/xendit/status/:invoice_id
- !! XENDIT_SECRET_KEY masih kosong — isi saat test key tersedia

### D.3 Auth Referrer
- OK POST /api/referrer/login — JWT role referrer, live-tested
- OK GET /api/referrer/me, earnings, clicks
- OK PUT /api/referrer/bank, password

### D.4 Admin Dashboard Routes
- OK GET/POST /api/admin/referrers — live-tested
- OK GET /api/admin/students — live-tested (6 siswa)
- OK GET /api/admin/payments, earnings
- OK PUT /api/admin/earnings/:id — mark transferred
- OK POST /api/admin/billing/activate

### D.5 Referrer Dashboard Routes
- OK Terintegrasi dalam routes/referrer.js

### D.6 Redirect Token /d/:token
- OK Log klik, hash IP SHA-256, redirect App Store
- !! APP_STORE_URL masih placeholder

### D.7 Frontend ReferrerStack
- OK useStore: referrerToken, referrer, setReferrerAuth, clearReferrerAuth
- OK ReferrerLoginScreen, ReferrerDashboardScreen, ReferrerEarningsScreen
- OK ReferrerClicksScreen, ReferrerBankScreen, ReferrerChangePasswordScreen
- OK App.jsx: ReferrerStack + restore sesi AsyncStorage
- OK RoleSelectScreen: tombol Portal Referrer

---

## SPRINT F — RENCANA (Guru Dashboard)

| Task | Deskripsi |
|------|-----------|
| F.1 | Backend: GET /api/teacher/students — list murid + progress |
| F.2 | Backend: GET /api/teacher/student/:id/progress — detail per murid |
| F.3 | Backend: GET /api/teacher/student/:id/sessions — history sesi |
| F.4 | Frontend: TeacherAuthScreen — login guru |
| F.5 | Frontend: TeacherDashboardScreen — list murid |
| F.6 | Frontend: StudentDetailScreen — progress + sesi murid |

---

## GIT LOG TERKINI
- feat(Sprint E): Parent Dashboard — 4 backend routes + 4 screens + routing fix
- feat(Sprint E): routes/parent.js — children, progress, sessions, billing endpoints
- feat(Sprint D.7): ReferrerStack 6 screens + useStore referrer state (10 Sep 2026)
- feat(Sprint D): migration 012, admin/referrer/xendit routes, index.js fix (10 Sep 2026)
- 29f9e77 Sprint A/B/C + D.0

---

## SKEMA DATABASE

| Tabel | Status | Catatan |
|-------|--------|---------|
| students | OK | referred_by kolom ada |
| parents | OK | |
| parent_children | OK | |
| teachers | OK | |
| referrers | OK | Kolom baru migration 012 sudah diterapkan |
| payment_records | OK | |
| exercises | OK | 5.446 rows level 1-15 |
| concepts | OK | 15 rows |
| placement_tests | OK | 15 probe pools |
| student_sessions | OK | Dipakai Sprint E untuk progress/sessions |
| student_variant_bias | OK | Live data confirmed |
| student_explanation_effectiveness | OK | UNIQUE constraint confirmed |
| student_level_quota | OK | |
| upgrade_tests | OK | |
| xendit_invoices | OK | Migration 012 applied |
| referrer_earnings | OK | Migration 012 applied |
| download_clicks | OK | Migration 012 applied |
| technique_taught_and_passed | OK | Migration 012 applied |
| _migrations | OK | 001-012 semua tercatat |

---

## BUG STATUS

| Bug | File | Status |
|-----|------|--------|
| D.0.1: GET /select-variant → POST | rag.js | OK Fixed |
| double-mount /api/admin | index.js | OK Fixed Sprint D |
| placement probe concept_id null | data | !! Acceptable beta |
| ParentAuthScreen URL salah (/auth vs /api/auth) | ParentAuthScreen.jsx | OK Fixed Sprint E |
| ParentAuthScreen setPlacementDone (salah role) | ParentAuthScreen.jsx | OK Fixed Sprint E |
| ParentDashboard logout tidak clear Zustand | ParentDashboardScreen.jsx | OK Fixed Sprint E |
| App.jsx Parent Stack di dalam Main Stack | App.jsx | OK Fixed Sprint E |

---

## PERTANYAAN TERBUKA

| # | Pertanyaan | Memengaruhi |
|---|-----------|-------------|
| 1 | Kuota AskKak: 38 atau 40 per level? | Fase 8 |
| 2 | Bulk purchase — satu invoice atau batch Xendit? | Sprint D.2 |
| 3 | Xendit test key sudah ada? | Sprint D.2 |
| 4 | Domain cadas.app untuk /d/:token? | Sprint D.6 |
| 5 | Komisi referrer: kredit premium atau transfer bank? | Sprint D.5 |
| 6 | Embedding model production: ada-002 atau 384 dim? | Fase 14 |
| 7 | Parent dashboard: notifikasi push jika anak naik level? | Sprint F+ |
| 8 | Guru dashboard: relasi teacher-student lewat tabel apa? | Sprint F |
