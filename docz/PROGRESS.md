# Progress Log - Cadas App Development
> Diperbarui: 10 September 2026 (Sprint D SELESAI SEMUA - D.1-D.7 complete)
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
| 10 | Parent Dashboard | NO | NO | Belum dimulai |
| 11 | Guru Dashboard | NO | NO | Belum dimulai |
| 12 | Sprint D: Xendit + Admin + Referrer | OK | OK | D.1-D.7 SEMUA SELESAI |
| 13 | Polish & Beta Test | NO | NO | Belum dimulai |
| 14 | Distribusi & Rilis | NO | NO | Belum dimulai |

---

## SPRINT D - SELESAI SEMUA

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
- OK GET/POST /api/admin/referrers — live-tested (Budi Santoso)
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
- OK api.js: 6 referrer endpoints
- OK ReferrerLoginScreen.jsx
- OK ReferrerDashboardScreen.jsx — stats + share link + menu
- OK ReferrerEarningsScreen.jsx — paginated + status badge
- OK ReferrerClicksScreen.jsx — paginated + device detection
- OK ReferrerBankScreen.jsx — picker 13 bank
- OK ReferrerChangePasswordScreen.jsx
- OK App.jsx — ReferrerStack + restore sesi AsyncStorage
- OK RoleSelectScreen.jsx — tombol Portal Referrer

---

## SPRINT E - RENCANA (Parent Dashboard)

| Task | Deskripsi |
|------|-----------|
| E.1 | Backend: GET /api/parent/children — list anak + progress |
| E.2 | Backend: GET /api/parent/child/:id/progress — detail progres |
| E.3 | Backend: GET /api/parent/child/:id/sessions — history sesi |
| E.4 | Frontend: ParentDashboardScreen — list anak + ringkasan |
| E.5 | Frontend: ChildProgressScreen — grafik level + akurasi |
| E.6 | Frontend: ChildSessionHistoryScreen — detail sesi |

---

## GIT LOG TERKINI
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
| referrers | OK | Kolom baru migration 012 sudah diterapkan |
| payment_records | OK | |
| exercises | OK | 5.446 rows level 1-15 |
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
| 7 | Parent dashboard: notifikasi push jika anak naik level? | Sprint E |