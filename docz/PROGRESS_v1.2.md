# Progress Log — Cadas App Development
> Diperbarui: 10 September 2026 (Sprint D planning — Xendit + Admin Dashboard + Referrer System)
> Dokumen ini adalah sumber kebenaran tunggal untuk status development.
> Simbol: ✅ = terverifikasi (file dibaca langsung ATAU endpoint diuji langsung dan sukses)
>          ⚠️ = ada tapi ada gap/belum diuji ulang setelah perubahan
>          ❌ = belum ada / dikonfirmasi rusak

---

## RINGKASAN STATUS PER FASE

| Fase | Nama | Backend | Frontend | Catatan |
|------|------|---------|----------|---------|
| 0 | Setup & Orientasi | ✅ | ✅ | Selesai |
| 1 | Gap Konten (speed-math-master) | ✅ | — | Gap 1.4 (audit explanation_variants) belum dikonfirmasi |
| 2 | Backend Foundation & Migrasi | ✅ | ✅ | index.js diperbaiki & live; double-mount /api/admin ditemukan & difixed sesi ini |
| 3 | Auth, Role Routing & Onboarding | ✅ | ✅ | Semua endpoint + screen terverifikasi; register live-tested sukses |
| 4 | Placement Test & Variant Bias | ✅ | ✅ | start+submit live-tested; student_variant_bias insertion & backtest SELESAI |
| 5 | Practice Loop | ✅ | ✅ | selection-rule + PracticeScreen ter-wire (Sprint B) |
| 6 | Billing Per-Level | ⚠️ | ✅ | Manual flow OK; Xendit integration BELUM (Sprint D) |
| 7 | Fast Track & Upgrade Test | ✅ | ✅ | getLevelAccess() benar, shared db.js dipakai |
| 8 | RAG Pipeline & AskKak | ⚠️ | ✅ | Pipeline OK; 3 bug rag.js ditemukan sesi ini (Sprint D fix) |
| 9 | Avatar & Gamification | ✅ | ⚠️ | useStore 11-state bot system lengkap; BotCharacter.jsx belum diverifikasi ulang |
| 10 | Parent Dashboard | ❌ | ❌ | Belum dimulai |
| 11 | Guru & Referral | ❌ | ❌ | Belum dimulai — dirombak total jadi Sprint D |
| 12 | Admin Dashboard | ❌ | ❌ | BARU — Xendit + admin dashboard + referrer system (Sprint D) |
| 13 | Polish, Offline, Beta Test | ❌ | ❌ | Belum dimulai |
| 14 | Distribusi & Rilis | ❌ | ❌ | Belum dimulai |

---

## 🚨 BUG DITEMUKAN SESI INI (10 September 2026) — BLOCKING SPRINT D

### Bug 1: `GET /api/rag/select-variant` — method salah
Kode di `rag.js` mendefinisikan `router.get('/select-variant')` padahal client
mengirim POST. Hasil: `Cannot POST /api/rag/select-variant`. Perlu diubah ke
`router.post` dan parameter dipindah dari query string ke request body.

### Bug 2: `GET /api/rag/quota` — inconsistency path vs query param
Test memanggil `/api/rag/quota?studentId=...&level=8` tapi route terdaftar sebagai
`GET /quota/:studentId`. Perlu distandarisasi — pilih salah satu: path param atau
query param, konsisten di route dan semua caller.

### Bug 3: `POST /api/rag/ask` — field name mismatch
Route expect `student_id` dan `question_text` tapi test (dan kemungkinan frontend)
mengirim `studentId` dan `question`. Perlu dikonfirmasi field name mana yang dipakai
frontend, lalu diseragamkan.

### Bug 4 (fixed sesi ini): double-mount `/api/admin` di index.js
`payment.js` di-mount dua kali: `/api/payment` dan `/api/admin`. Sekaligus ada
endpoint `/api/billing/status/:student_id` duplikat di `index.js` yang salah path
dan tidak pernah ter-reach. Keduanya sudah dihapus/dirapikan — mount sekarang benar.

---

## 🚀 SPRINT D — PLANNING (Xendit + Admin Dashboard + Referrer System)

**Konteks keputusan:**
- Billing manual (WhatsApp + admin activate) tetap ada sebagai fallback
- Xendit dipilih sebagai payment gateway (bukan Midtrans/Duitku) — SDK Node.js paling
  clean, webhook documentation terbaik, familiar di ekosistem startup Indonesia
- Komisi referrer tetap manual transfer oleh admin (Xendit Disbursement = overkill untuk
  skala awal); pencatatan di DB sudah cukup untuk rekonsiliasi
- Dashboard referrer masuk ke dalam app yang sama (bukan web terpisah)
- Auth referrer: email + password (JWT, role `referrer`) — diseragamkan untuk semua tipe
  referrer (teacher_private, affiliate, parent, other), bukan pakai teacher JWT

---

### D.0 — Bug Fixes (HARUS selesai sebelum Sprint D lain)

- [ ] Fix `rag.js`: `GET /select-variant` → `POST /select-variant` (body: student_id, level, concept_id, options)
- [ ] Fix `rag.js`: standarisasi quota endpoint → `GET /quota/:studentId?level=N` (path param + query)
- [ ] Fix `rag.js`: konfirmasi field name `/ask` — seragamkan dengan frontend (`student_id`/`question_text`)
- [ ] Commit semua perubahan ke git (BELUM ADA SATU PUN commit sejak banyak perubahan dilakukan)

---

### D.1 — DB Schema (Migration Baru: 012)

**Tabel baru: `xendit_invoices`**
```sql
CREATE TABLE xendit_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  xendit_invoice_id VARCHAR(100) UNIQUE NOT NULL,
  xendit_invoice_url TEXT NOT NULL,
  product_type VARCHAR(50) NOT NULL,
  level_from INT NOT NULL,
  level_to INT NOT NULL,
  amount_idr INT NOT NULL,
  referrer_code VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',
  -- pending | paid | expired | failed
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  expired_at TIMESTAMP
);
```

**Tabel baru: `referrer_earnings`**
```sql
CREATE TABLE referrer_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES referrers(id),
  payment_record_id UUID NOT NULL REFERENCES payment_records(id),
  amount_idr INT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  -- pending | paid
  period_month VARCHAR(7),  -- format: '2026-09'
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  paid_by_admin VARCHAR(100)
);
```

**Kolom baru di tabel `referrers`:**
```sql
ALTER TABLE referrers ADD COLUMN email VARCHAR(200) UNIQUE;
ALTER TABLE referrers ADD COLUMN password_hash VARCHAR(200);
ALTER TABLE referrers ADD COLUMN referral_token VARCHAR(20) UNIQUE;
-- token untuk link cadas.app/d/Xk9mP
ALTER TABLE referrers ADD COLUMN bank_name VARCHAR(100);
ALTER TABLE referrers ADD COLUMN bank_account_number VARCHAR(50);
ALTER TABLE referrers ADD COLUMN bank_account_name VARCHAR(100);
ALTER TABLE referrers ADD COLUMN whatsapp_number VARCHAR(20);
ALTER TABLE referrers ADD COLUMN total_earnings_idr INT DEFAULT 0;
ALTER TABLE referrers ADD COLUMN total_paid_idr INT DEFAULT 0;
ALTER TABLE referrers ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
-- pending | approved | rejected | revoked
ALTER TABLE referrers ADD COLUMN application_data JSONB;
ALTER TABLE referrers ADD COLUMN reviewed_by VARCHAR(100);
ALTER TABLE referrers ADD COLUMN reviewed_at TIMESTAMP;
ALTER TABLE referrers ADD COLUMN rejection_reason TEXT;
ALTER TABLE referrers ADD COLUMN last_rejected_at TIMESTAMP;
```

---

### D.2 — Xendit Integration (`src/services/xendit.js` + routes baru)

**`src/services/xendit.js`:**
- `createInvoice(studentId, productType, levelFrom, levelTo, amountIdr, referrerCode)` → Xendit API → simpan ke `xendit_invoices` → return `{invoiceUrl, invoiceId}`
- `verifyWebhookSignature(req)` → validasi header `x-callback-token` dari Xendit
- `handlePaidCallback(xenditInvoiceId)` → update `xendit_invoices.status='paid'` + panggil activate logic + hitung komisi referrer

**Route baru di `payment.js`:**
```
POST /api/payment/create-invoice
  Auth: parent JWT
  Body: { student_id, product_type, level_from, level_to, referrer_code? }
  → Buat Xendit invoice → return { invoice_url, invoice_id, amount_idr }

POST /api/webhooks/xendit
  Auth: x-callback-token header (Xendit signature)
  → Terima paid callback → auto-activate level → catat payment_records
  → Hitung & insert referrer_earnings kalau ada referrer

POST /api/admin/billing/activate  (tetap ada sebagai manual fallback)
  → Tidak berubah dari Sprint C
```

---

### D.3 — Auth Referrer (`src/routes/referrer-auth.js` baru)

```
POST /api/referrer/register
  Body: { name, email, password, referrer_type, whatsapp_number, application_data }
  → Hash password → insert referrers dengan status='pending'
  → Return: { referrer_id, status: 'pending', message: 'Pengajuan diterima, menunggu review admin' }

POST /api/referrer/login
  Body: { email, password }
  → Verify password_hash → return JWT dengan role='referrer' + referrer_id

GET /api/referrer/me
  Auth: referrer JWT
  → Return profil + status approval
```

**Catatan approval per tipe (dari ADDENDUM §5.3):**
- `parent`: auto-approved saat minimal 1 anak ter-link + placement test selesai
- `teacher_school`: auto-approved saat verifikasi NUPTK selesai
- `teacher_private`, `affiliate`, `other`: manual review admin
- `student`: auto-approved saat is_premium + min_age_verified + parent_consent_at not null

---

### D.4 — Admin Dashboard Routes (`src/routes/admin-dashboard.js` baru)

```
GET /api/admin/dashboard/summary
  Auth: x-admin-secret
  → {
      total_revenue_idr,
      revenue_this_month_idr,
      pending_xendit_invoices,
      active_students,
      referrer_payout_pending_idr,
      referrer_approvals_pending  ← jumlah referrer status='pending'
    }

GET /api/admin/dashboard/payments
  Auth: x-admin-secret
  Query: ?status=all|pending|paid|expired&from=YYYY-MM-DD&to=YYYY-MM-DD&page=1
  → List gabungan payment_records + xendit_invoices dengan pagination

GET /api/admin/dashboard/students
  Auth: x-admin-secret
  Query: ?page=1&search=nama
  → List students dengan current_level, paid_basic_up_to_level,
    paid_premium_up_to_level, referred_by

GET /api/admin/dashboard/referrers
  Auth: x-admin-secret
  Query: ?status=pending|approved|all
  → List referrers dengan total_earnings, total_paid, pending_earnings,
    jumlah siswa aktif yang direferensikan

POST /api/admin/referrer/approve/:referrer_id
  Auth: x-admin-secret
  → status='approved' → generate referral_token unik → return token

POST /api/admin/referrer/reject/:referrer_id
  Auth: x-admin-secret
  Body: { rejection_reason }
  → status='rejected', last_rejected_at=NOW()

POST /api/admin/referrer/revoke/:referrer_id
  Auth: x-admin-secret
  → status='revoked' (earnings yang sudah tercatat TIDAK dihapus)

POST /api/admin/referrer/mark-paid/:referrer_id
  Auth: x-admin-secret
  Body: { period_month, amount_idr }
  → Update referrer_earnings.status='paid' untuk period_month tersebut
  → Update referrers.total_paid_idr
```

---

### D.5 — Referrer Dashboard Routes (`src/routes/referrer-dashboard.js` baru)

```
GET /api/referrer/dashboard
  Auth: referrer JWT
  → {
      status,           ← pending|approved|rejected|revoked
      referral_token,   ← null kalau belum approved
      referral_link,    ← 'https://cadas.app/d/{token}' kalau approved
      total_earnings_idr,
      total_paid_idr,
      pending_earnings_idr,
      students_referred_count,
      commission_tier,  ← Mitra|Andalan|Utama
      commission_rate
    }

GET /api/referrer/earnings
  Auth: referrer JWT
  Query: ?status=pending|paid|all&page=1
  → List referrer_earnings dengan detail: siswa ID (anonim), level dibeli,
    amount_idr komisi, status, period_month

GET /api/referrer/students
  Auth: referrer JWT
  → List siswa yang direferensikan (anonim — hanya: joined_at, current_level,
    total_pembelian, masih_aktif) — TANPA nama/identitas siswa

GET /api/referrer/bank-info
  Auth: referrer JWT
  → Return bank_name, bank_account_number (masked), bank_account_name

PUT /api/referrer/bank-info
  Auth: referrer JWT
  Body: { bank_name, bank_account_number, bank_account_name }
  → Update data rekening untuk penerimaan komisi
```

---

### D.6 — Redirect Token (`src/routes/download.js` baru)

```
GET /d/:token
  → Cari referrer berdasarkan referral_token
  → Catat download_clicks (ip_address, user_agent, clicked_at, attributed=false)
  → Redirect ke halaman download APK / landing page
  (IP attribution: saat student register, match IP dalam window 2 jam)
```

---

### D.7 — Frontend Screens Baru (dalam app yang sama)

**Stack Referrer (ReferrerStack):**
- `ReferrerLoginScreen.jsx` — email + password login
- `ReferrerRegisterScreen.jsx` — form pendaftaran (tipe referrer + data aplikasi)
- `ReferrerDashboardScreen.jsx` — summary earnings, status approval, link referral + tombol copy/share
- `ReferrerEarningsScreen.jsx` — list earnings per transaksi dengan filter
- `ReferrerStudentsScreen.jsx` — list anonim siswa yang direferensikan
- `ReferrerBankInfoScreen.jsx` — isi/edit data rekening bank

**Perubahan App.jsx:**
- Tambah `ReferrerStack` sebagai navigasi terpisah
- Role detection saat login: kalau JWT role=`referrer` → masuk ReferrerStack

---

### D.8 — Backtest Checklist Sprint D

```
Xendit:
[ ] POST /api/payment/create-invoice → return invoice_url valid
[ ] POST /api/webhooks/xendit (simulasi paid) → level ter-activate + payment_records masuk
[ ] POST /api/webhooks/xendit (signature salah) → 401
[ ] referrer_earnings ter-insert kalau ada referrer_code
[ ] Manual fallback POST /api/admin/billing/activate masih berjalan

Auth Referrer:
[ ] POST /api/referrer/register → pending
[ ] POST /api/admin/referrer/approve → status approved + token ter-generate
[ ] POST /api/referrer/login → JWT role=referrer
[ ] GET /api/referrer/dashboard → data benar sesuai status

Admin Dashboard:
[ ] GET /api/admin/dashboard/summary → angka benar
[ ] GET /api/admin/dashboard/payments → list dengan filter
[ ] GET /api/admin/dashboard/referrers → list + pending count
[ ] POST /api/admin/referrer/mark-paid → earnings ter-update

Referrer Dashboard:
[ ] GET /api/referrer/earnings → list anonim
[ ] GET /api/referrer/students → tidak bocorkan identitas
[ ] PUT /api/referrer/bank-info → tersimpan

Bug Fixes:
[ ] POST /api/rag/select-variant → 200 (bukan 404)
[ ] GET /api/rag/quota/:studentId?level=8 → 200
[ ] POST /api/rag/ask dengan student_id + question_text → 200
```

---

## 🚀 UPDATE SESI INI (10 September 2026) — AUDIT & BUG FIXES

### Fix yang diterapkan sesi ini:

1. **index.js double-mount `/api/admin` dihapus** — payment.js sebelumnya di-mount dua kali
   (`/api/payment` DAN `/api/admin`). Mount `/api/admin` dihapus lalu ditambah kembali dengan
   benar di bawah mount `/api/payment`, tanpa duplikasi.

2. **Endpoint `/api/billing/status/:student_id` duplikat di index.js dihapus** — endpoint ini
   didefinisikan langsung di index.js dengan path yang salah (`/api/billing/...` bukan
   `/api/admin/billing/...`) dan auth berbeda dari implementasi di payment.js. Dihapus karena
   payment.js sudah handle dengan benar.

### Temuan audit sesi ini:

- `src/rag/selection-rule.js`: skema dan logic sudah benar, UNIQUE constraint di DB terkonfirmasi ada
- `src/rag/pipeline.js`: cache pakai `LOWER(question_text)` (bukan `question_hash` — sudah benar)
- `src/middleware/level-access.js`: pakai `paid_basic_up_to_level` + `paid_premium_up_to_level` (benar)
- `src/routes/rag.js`: 3 bug ditemukan (lihat bagian BUG di atas)
- `payment_records` schema: kolom ada dan benar
- `referrers` schema: ada tapi belum punya kolom email/password/token (perlu migration D.1)
- `concepts` table: 15 rows, semua exercises sudah punya concept_id (backfill Sprint A selesai)
- `student_variant_bias`: 1 row live data, constraint UNIQUE terkonfirmasi ada
- `student_explanation_effectiveness`: UNIQUE constraint terkonfirmasi ada

---

## UPDATE SPRINT SEBELUMNYA (ringkasan)

### Sprint C (9 September 2026) — SELESAI ✅
- Harga paywall frontend disinkronkan (40k/100k/165k)
- Route admin billing diperbaiki (double-prefix bug)
- getLevelAccess diselaraskan (3 implementasi → 1 shared middleware)
- AskKak premium tier diverifikasi (fallback graceful saat key placeholder)

### Sprint B (9 September 2026) — SELESAI ✅
- selection-rule.js + pipeline.js + rag.js difix ke skema aktual
- Semantic search berfungsi (hashing-trick 384 dim, backfill 15/15)
- PracticeScreen ter-wire ke select-variant
- Trial level dikonfirmasi bukan gerbang akses (keputusan desain final)

### Sprint A (9 September 2026) — SELESAI ✅
- correct_count per-skill di student_variant_bias diperbaiki
- Backfill concept_id 148 exercises (variant_type kini pakai concept code)
- GET /api/placement/status terverifikasi OK

---

## DETAIL PER FASE

### FASE 2 — BACKEND FOUNDATION ✅
- index.js: 8 route mount benar, health endpoint live
- Double-mount bug ditemukan & fixed sesi ini
- Semua route terdaftar: auth, exercises, progress, placement, upgrade-test, rag, payment, admin

### FASE 3 — AUTH ✅
Backend: 10 endpoint di auth.js (student/parent/teacher register+login, parent-gate, me, link-child)
Frontend: 5 screen onboarding terverifikasi ada

### FASE 4 — PLACEMENT TEST ✅
- start + submit live-tested sukses
- prerequisiteSignals tersimpan ke placement_tests (JSONB)
- student_variant_bias: ADD_SUB_2DIGIT_L8 1/6 (17%) — per-skill, bukan agregat

### FASE 5 — PRACTICE LOOP ✅
- selection-rule: 3 priority (performance > placement bias > default)
- record-shown + record-helpful berfungsi
- PracticeScreen ter-wire

### FASE 6 — BILLING ⚠️
- Manual flow: POST /api/admin/billing/activate (x-admin-secret) ✅
- GET /api/admin/billing/status/:student_id ✅
- Xendit integration: BELUM (Sprint D)

### FASE 7 — UPGRADE TEST ✅
- getLevelAccess() shared middleware — paid_basic/premium per level
- upgrade-test endpoint live-tested (403 sebelum bayar, 200 setelah)

### FASE 8 — RAG PIPELINE ⚠️
- Pipeline (lexical → semantic → openrouter fallback) ✅
- Cache via LOWER(question_text) ✅
- Quota via student_level_quota ✅
- 3 bug di rag.js route definitions (Sprint D fix)

### FASE 9 — AVATAR ✅/⚠️
- useStore.js: 11 bot states, companionLevel, visemeData — LENGKAP ✅
- BotCharacter.jsx: belum diverifikasi ulang sesi ini ⚠️

---

## GIT & BACKUP — BELUM ADA COMMIT ⚠️

Seluruh pekerjaan Sprint A, B, C, dan sesi ini (audit + bug fixes index.js) masih hanya
ada di disk. Tidak ada satu pun `git commit` yang terkonfirmasi. Risiko kehilangan
pekerjaan sangat tinggi.

**Prioritas sebelum Sprint D dimulai:**
```
git add -A
git commit -m "Sprint A/B/C: placement bias, RAG pipeline, billing — Sprint D planning"
```

---

## PERTANYAAN TERBUKA

| # | Pertanyaan | Memengaruhi |
|---|-----------|-------------|
| 1 | Kuota AskKak: 38 atau dibulatkan ke 40? | FASE 8 |
| 2 | Bulk purchase kelompok (min 10 siswa) — alur Xendit-nya bagaimana? | Sprint D |
| 3 | Gap 1.4: 15/15 explanation_variants sudah lolos audit? | FASE 1 |
| 4 | Xendit test mode key — sudah ada atau perlu daftar dulu? | Sprint D |
| 5 | Domain `cadas.app` sudah ada untuk link `/d/:token`? | Sprint D.6 |
| 6 | komisioner referrer type `student` — kredit premium atau transfer ke orang tua? | Sprint D |
