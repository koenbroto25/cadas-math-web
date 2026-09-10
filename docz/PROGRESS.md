# Progress Log — Cadas App Development
> Diperbarui: 10 September 2026 (Sprint D backend selesai — D.1-D.6 complete, D.7 frontend next)
> Simbol: ? = terverifikasi | ?? = ada tapi gap | ? = belum ada

---

## RINGKASAN STATUS PER FASE

| Fase | Nama | Backend | Frontend | Catatan |
|------|------|---------|----------|---------|
| 0 | Setup & Orientasi | ? | ? | Selesai |
| 1 | Gap Konten | ? | — | Gap 1.4 belum dikonfirmasi |
| 2 | Backend Foundation | ? | ? | index.js OK; double-mount FIXED Sprint D |
| 3 | Auth & Onboarding | ? | ? | 10 endpoint + 5 screen terverifikasi |
| 4 | Placement Test | ? | ? | start+submit live-tested; variant bias selesai |
| 5 | Practice Loop | ? | ? | selection-rule + PracticeScreen ter-wire |
| 6 | Billing Per-Level | ? | ? | Manual OK; Xendit Sprint D.2 selesai |
| 7 | Fast Track | ? | ? | getLevelAccess() shared, live-tested |
| 8 | RAG Pipeline | ?? | ? | Pipeline OK; Bug D.0.1 fixed |
| 9 | Avatar & Gamification | ? | ?? | useStore 11-state lengkap; BotCharacter belum reverifikasi |
| 10 | Parent Dashboard | ? | ? | Belum dimulai |
| 11 | Guru Dashboard | ? | ? | Belum dimulai |
| 12 | Sprint D: Xendit + Admin + Referrer | ? | ? | D.1-D.6 backend selesai ?; D.7 frontend next |
| 13 | Polish & Beta Test | ? | ? | Belum dimulai |
| 14 | Distribusi & Rilis | ? | ? | Belum dimulai |

---

## SPRINT D — STATUS DETAIL

### D.0 Bug Fixes — SELESAI ?
- ? rag.js: GET /select-variant ? POST /select-variant; req.query ? req.body
- ? rag.js: GET /quota/:studentId?level=N — sudah benar sejak Sprint B
- ? rag.js: /ask field name (student_id + question_text) — sudah benar
- ? Git commit: 29f9e77 — 12 files, 546 insertions

### D.1 Migration 012 — SELESAI ?
- ? File 012_xendit_referrer_dashboard.sql dibuat & dijalankan
- ? Tabel baru: xendit_invoices, referrer_earnings, download_clicks, technique_taught_and_passed
- ? Kolom baru di referrers: full_name, email, password_hash, referral_token, bank_*, total_clicks, total_conversions, total_earnings_idr, total_transferred_idr, last_login_at, updated_at
- ? referrers.status constraint diperbarui: tambah 'suspended'
- ? Migration 011 di-mark applied (tabel sudah ada manual sebelumnya)

### D.2 Xendit Integration — SELESAI ?
- ? routes/xendit.js dibuat
- ? POST /api/xendit/create-invoice — buat invoice ke Xendit API
- ? POST /api/xendit/webhook — terima callback, aktivasi akses, catat komisi (idempotent)
- ? GET /api/xendit/status/:invoice_id — cek status invoice
- ?? XENDIT_SECRET_KEY di .env masih kosong — isi saat Xendit test key sudah ada

### D.3 Auth Referrer — SELESAI ?
- ? routes/referrer.js dibuat
- ? POST /api/referrer/login — JWT role 'referrer', live-tested ?
- ? GET /api/referrer/me — profil + stats + link download
- ? GET /api/referrer/earnings — history komisi (paginated)
- ? GET /api/referrer/clicks — history klik link (paginated)
- ? PUT /api/referrer/bank — update info bank
- ? PUT /api/referrer/password — ganti password

### D.4 Admin Dashboard Routes — SELESAI ?
- ? routes/admin.js dibuat (menggantikan double-mount payment.js di /api/admin)
- ? GET /api/admin/students — list + pagination + search, live-tested (6 siswa) ?
- ? GET /api/admin/students/:id — detail + payment history + xendit invoices
- ? GET /api/admin/referrers — list semua referrer, live-tested ?
- ? POST /api/admin/referrers — buat referrer baru, live-tested ? (Budi Santoso)
- ? PUT /api/admin/referrers/:id — update status/rate/bank
- ? GET /api/admin/payments — list manual + xendit
- ? GET /api/admin/earnings — list komisi pending/transferred
- ? PUT /api/admin/earnings/:id — mark as transferred + update total_transferred
- ? POST /api/admin/billing/activate — manual activate (pindah dari payment.js, tambah referrer_earnings)
- ? GET /api/admin/billing/status/:student_id

### D.5 Referrer Dashboard Routes — SELESAI ?
- ? Terintegrasi dalam routes/referrer.js (D.3)

### D.6 Redirect Token /d/:token — SELESAI ?
- ? GET /d/:token di index.js — log klik, increment total_clicks, redirect ke App Store
- ? IP di-hash SHA-256 (privacy), user_agent dicatat
- ? Fallback redirect tetap jalan meski tracking gagal
- ?? APP_STORE_URL di .env masih placeholder — update saat app live di Play Store

### D.7 Frontend ReferrerStack (6 screens) — BELUM ?
- Screens yang perlu dibuat:
  - ReferrerLoginScreen
  - ReferrerDashboardScreen (stats: klik, konversi, pendapatan)
  - ReferrerEarningsScreen (list komisi)
  - ReferrerClicksScreen (list klik)
  - ReferrerBankScreen (form update bank)
  - ReferrerChangePasswordScreen

---

## GIT LOG TERKINI
- feat(Sprint D): migration 012, admin/referrer/xendit routes, index.js cleanup (10 Sep 2026)
- 29f9e77 Sprint A/B/C + D.0
- db19cdc chore: cleanup backup files
- a96a596 fix(placement): BUG level_id, concept_id, fallback
- 053cf50 feat: placement fixes, auth, session result
- 0be3918 checkpoint fase 0-9

---

## SKEMA DATABASE

| Tabel | Status | Catatan |
|-------|--------|---------|
| students | ? | referred_by kolom ada |
| parents | ? | |
| parent_children | ? | |
| teachers | ? | |
| referrers | ? | Kolom baru migration 012 sudah diterapkan |
| payment_records | ? | |
| exercises | ? | 5.446 rows level 1-15 |
| concepts | ? | 15 rows |
| placement_tests | ? | 15 probe pools |
| student_variant_bias | ? | Live data confirmed |
| student_explanation_effectiveness | ? | UNIQUE constraint confirmed |
| student_level_quota | ? | |
| upgrade_tests | ? | |
| xendit_invoices | ? | Migration 012 applied |
| referrer_earnings | ? | Migration 012 applied |
| download_clicks | ? | Migration 012 applied |
| technique_taught_and_passed | ? | Migration 012 applied |
| _migrations | ? | 001-012 semua tercatat |

---

## BUG STATUS

| Bug | File | Status |
|-----|------|--------|
| D.0.1: GET /select-variant ? POST | rag.js | ? Fixed 29f9e77 |
| D.0.2: quota path inconsistency | rag.js | ? Tidak perlu fix |
| D.0.3: /ask field name mismatch | rag.js | ? Tidak ada bug |
| double-mount /api/admin index.js | index.js | ? Fixed Sprint D |
| placement probe concept_id null | data | ?? Acceptable beta |

---

## PERTANYAAN TERBUKA

| # | Pertanyaan | Memengaruhi |
|---|-----------|-------------|
| 1 | Kuota AskKak: 38 atau 40 per level? | Fase 8 |
| 2 | Bulk purchase — satu invoice atau batch Xendit? | Sprint D.2 |
| 3 | Gap 1.4: 15/15 explanation_variants lolos audit? | Fase 1 |
| 4 | Xendit test key sudah ada? | Sprint D.2 |
| 5 | Domain cadas.app untuk /d/:token? | Sprint D.6 |
| 6 | Komisi referrer student: kredit premium atau transfer? | Sprint D.5 |
| 7 | Embedding model production: ada-002 atau model 384 dim? | Fase 14 |
