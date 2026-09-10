# Progress Log — Cadas App Development
> Diperbarui: 10 September 2026 (Sprint D dimulai — D.0 selesai, D.1 migration dibuat)
> Simbol: ✅ = terverifikasi | ⚠️ = ada tapi gap | ❌ = belum ada

---

## RINGKASAN STATUS PER FASE

| Fase | Nama | Backend | Frontend | Catatan |
|------|------|---------|----------|---------|
| 0 | Setup & Orientasi | ✅ | ✅ | Selesai |
| 1 | Gap Konten | ✅ | — | Gap 1.4 belum dikonfirmasi |
| 2 | Backend Foundation | ✅ | ✅ | index.js OK; double-mount cleanup Sprint D |
| 3 | Auth & Onboarding | ✅ | ✅ | 10 endpoint + 5 screen terverifikasi |
| 4 | Placement Test | ✅ | ✅ | start+submit live-tested; variant bias selesai |
| 5 | Practice Loop | ✅ | ✅ | selection-rule + PracticeScreen ter-wire |
| 6 | Billing Per-Level | ⚠️ | ✅ | Manual OK; Xendit Sprint D |
| 7 | Fast Track | ✅ | ✅ | getLevelAccess() shared, live-tested |
| 8 | RAG Pipeline | ⚠️ | ✅ | Pipeline OK; Bug D.0.1 fixed |
| 9 | Avatar & Gamification | ✅ | ⚠️ | useStore 11-state lengkap; BotCharacter belum reverifikasi |
| 10 | Parent Dashboard | ❌ | ❌ | Belum dimulai |
| 11 | Guru Dashboard | ❌ | ❌ | Belum dimulai |
| 12 | Sprint D: Xendit + Admin + Referrer | ⚠️ | ❌ | D.0 selesai, D.1 file dibuat belum dijalankan |
| 13 | Polish & Beta Test | ❌ | ❌ | Belum dimulai |
| 14 | Distribusi & Rilis | ❌ | ❌ | Belum dimulai |

---

## SPRINT D — STATUS DETAIL

### D.0 Bug Fixes — SELESAI ✅
- ✅ rag.js: GET /select-variant → POST /select-variant; req.query → req.body
- ✅ rag.js: GET /quota/:studentId?level=N — sudah benar sejak Sprint B
- ✅ rag.js: /ask field name (student_id + question_text) — sudah benar
- ✅ Git commit: 29f9e77 — 12 files, 546 insertions

### D.1 Migration 012 — FILE DIBUAT, BELUM DIJALANKAN ⏳
- ✅ File 012_xendit_referrer_dashboard.sql dibuat
- ⏳ Belum dijalankan ke DB
- Tabel baru: xendit_invoices, referrer_earnings, download_clicks
- Kolom baru di referrers: email, password_hash, referral_token, bank_*, status, dll
- Kolom baru di students: referred_by UUID

### D.2 Xendit Integration — BELUM ❌
### D.3 Auth Referrer — BELUM ❌
### D.4 Admin Dashboard Routes — BELUM ❌
### D.5 Referrer Dashboard Routes — BELUM ❌
### D.6 Redirect Token /d/:token — BELUM ❌
### D.7 Frontend ReferrerStack (6 screens) — BELUM ❌

---

## GIT LOG TERKINI
- 29f9e77 Sprint A/B/C + D.0
- db19cdc chore: cleanup backup files
- a96a596 fix(placement): BUG level_id, concept_id, fallback
- 053cf50 feat: placement fixes, auth, session result
- 0be3918 checkpoint fase 0-9

---

## SKEMA DATABASE

| Tabel | Status | Catatan |
|-------|--------|---------|
| students | ✅ | + referred_by kolom (migration 012 belum jalan) |
| parents | ✅ | |
| parent_children | ✅ | |
| teachers | ✅ | |
| referrers | ⚠️ | Perlu kolom baru migration 012 |
| payment_records | ✅ | |
| exercises | ✅ | 5.446 rows level 1-15 |
| concepts | ✅ | 15 rows |
| placement_tests | ✅ | 15 probe pools |
| student_variant_bias | ✅ | Live data confirmed |
| student_explanation_effectiveness | ✅ | UNIQUE constraint confirmed |
| student_level_quota | ✅ | |
| upgrade_tests | ✅ | |
| xendit_invoices | ⏳ | Migration file ada, belum dijalankan |
| referrer_earnings | ⏳ | Migration file ada, belum dijalankan |
| download_clicks | ⏳ | Migration file ada, belum dijalankan |
| technique_taught_and_passed | ❌ | Belum ada migration |

---

## BUG STATUS

| Bug | File | Status |
|-----|------|--------|
| D.0.1: GET /select-variant → POST | rag.js | ✅ Fixed 29f9e77 |
| D.0.2: quota path inconsistency | rag.js | ✅ Tidak perlu fix |
| D.0.3: /ask field name mismatch | rag.js | ✅ Tidak ada bug |
| double-mount /api/admin index.js | index.js | ⚠️ Cleanup Sprint D |
| placement probe concept_id null | data | ⚠️ Acceptable beta |

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
