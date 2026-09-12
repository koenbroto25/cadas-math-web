# 🎯 CADAS APP — FINAL PLAN v1.3
## Rujukan Tunggal & Final untuk Developer — Fase Linear dari Nol hingga Rilis

**Tanggal disusun:** 8 September 2026
**Versi:** 1.3 (revisi dari v1.2 — migrasi payment gateway: Xendit → Midtrans QRIS)
**Status:** FINAL — dokumen ini adalah urutan eksekusi otoritatif
**Terakhir diupdate:** 12 September 2026

---

## CHANGELOG v1.2 → v1.3

**Konteks:** Keputusan bisnis 12 September 2026 — payment gateway diganti dari Xendit ke Midtrans QRIS.

**Alasan:**
1. **Xendit mensyaratkan PT** untuk akun bisnis penuh — beban administrasi dan perpajakan (PPN) tidak sesuai untuk tahap awal.
2. **Midtrans** dapat didaftarkan dengan KTP saja (perorangan), QRIS 0,7%/transaksi sudah inklusif PPN, tidak ada flat fee tambahan, webhook (HTTP Notification) tersedia, dokumentasi API lengkap.
3. Secara teknis setara: Midtrans mendukung QRIS dinamis, signature verification (SHA-512), HTTP Notification ke callback URL, dan status check via API.

**Perubahan teknis:**
- `src/services/xendit.js` → diganti `src/services/midtrans.js`
- Tabel DB `xendit_invoices` → `midtrans_orders`
- Env: `XENDIT_SECRET_KEY` + `XENDIT_CALLBACK_TOKEN` → `MIDTRANS_SERVER_KEY` + `MIDTRANS_CLIENT_KEY`
- Route webhook: `POST /api/webhooks/xendit` → `POST /api/webhooks/midtrans`
- Verifikasi webhook: `x-callback-token` header → SHA-512 `(order_id + status_code + gross_amount + server_key)`
- Status pembayaran sukses: `status='paid'` → `transaction_status='settlement'` (QRIS/transfer) atau `'capture'` (kartu kredit, tidak dipakai)
- Tidak ada perubahan pada flow referrer, admin dashboard, atau logika aktivasi level.

---

## CHANGELOG v1.1 → v1.2

**Konteks:** Setelah Sprint A/B/C selesai, keputusan bisnis baru diambil:
1. **Billing manual → Xendit otomatis** — payment gateway Xendit dipilih (bukan Midtrans).
   Manual flow (`/api/admin/billing/activate`) tetap ada sebagai fallback.
2. **Admin dashboard** — pencatatan revenue, payment history, referrer management perlu
   UI/API yang proper, bukan hanya endpoint admin raw.
3. **Referrer system dirombak** — auth referrer diseragamkan: email+password (JWT role=`referrer`),
   berlaku untuk semua tipe (teacher_private, affiliate, parent, other). Dashboard referrer
   masuk ke dalam app yang sama, bukan web terpisah.
4. **Bug rag.js ditemukan** — 3 bug di route definitions (method salah, path inconsistency,
   field name mismatch) harus diselesaikan sebelum Sprint D.
5. **Komisi referrer** — dikonfirmasi per-transaksi (per baris payment_records), bukan recurring
   per bulan. Tier Mitra/Andalan/Utama berdasarkan jumlah siswa aktif yang direferensikan.

**Fase baru yang ditambahkan:** Sprint D (Fase 12) mencakup semua poin di atas.
**Fase yang tidak berubah:** 0–11, 13–14 tidak disentuh revisi ini.

---

## CHANGELOG v1.0 → v1.1 (tetap berlaku)

1. Placement menentukan variant bias (sub-fase 4.4 + tabel `student_variant_bias`)
2. Selection Rule generik `selectExplanationVariant()` (sub-fase 8.3b)
3. Mode drill dibatasi hanya level speed-lock (5, 8, 9) setelah teknik diajarkan

---

## ⚠️ EMPAT OVERRIDE WAJIB DIINGAT

1. **LLM fallback: OpenRouter, BUKAN Ollama** — sudah diganti total sejak v1.1
2. **Premium per-level granular, BUKAN boolean global** — `paid_basic_up_to_level` + `paid_premium_up_to_level`
3. **Komisi referrer per-transaksi, BUKAN recurring per bulan** — per baris `payment_records`
4. **Payment gateway: Midtrans QRIS, BUKAN Xendit** — daftar KTP saja di midtrans.com, tabel `midtrans_orders`, webhook SHA-512 (v1.3)

---

## PETA DEPENDENSI

```
FASE 0  Orientasi & Setup
   │
FASE 1  Tutup Gap Konten (speed-math-master)
   │
FASE 2  Backend Foundation & Migrasi Konten
   │
FASE 3  Autentikasi, Role Routing & Onboarding
   │
FASE 4  Placement Test End-to-End
   │
   ├──────────────┐
   ▼              ▼
FASE 5          FASE 6  Billing Manual (selesai) + Midtrans QRIS (Sprint D)
(Practice Loop)    │
   │               ▼
   │            FASE 7  Fast Track & Upgrade Test
   │               │
   ▼               ▼
FASE 8  RAG Pipeline & AskKak
   │
   ▼
FASE 9  Avatar & Gamification
   │
   ├──────────────┬──────────────┐
   ▼              ▼              ▼
FASE 10        FASE 11        FASE 12 (BARU)
(Parent)       (Guru)         Sprint D: Midtrans QRIS + Admin Dashboard + Referrer
   │              │              │
   └──────┬───────┘              │
          ▼                      │
   FASE 13  Polish, Offline, Beta Test  ← butuh FASE 12 selesai
          ▼
   FASE 14  Distribusi & Rilis Produksi
```

---

## STATUS FASE 0–9 (ringkasan — detail di PROGRESS.md)

| Fase | Status | Catatan singkat |
|------|--------|-----------------|
| 0 | ✅ | Selesai |
| 1 | ✅ | Selesai; Gap 1.4 belum dikonfirmasi |
| 2 | ✅ | index.js OK; double-mount bug fixed |
| 3 | ✅ | Auth 10 endpoint; 5 screen onboarding |
| 4 | ✅ | Placement + variant bias end-to-end |
| 5 | ✅ | selection-rule + PracticeScreen wired |
| 6 | ⚠️ | Manual OK; Midtrans QRIS Sprint D (migrasi dari Xendit) |
| 7 | ✅ | getLevelAccess() benar |
| 8 | ⚠️ | Pipeline OK; 3 bug rag.js (Sprint D.0) |
| 9 | ✅/⚠️ | useStore 11 states; BotCharacter belum reverifikasi |

---

# FASE 12 — SPRINT D: MIDTRANS QRIS + ADMIN DASHBOARD + REFERRER SYSTEM

### 🎯 Tujuan
Billing otomatis via Midtrans QRIS, admin punya dashboard operasional lengkap, referrer
punya auth sendiri dan dashboard dalam app.

### 📖 Dokumen wajib dibaca sebelum mulai
- `CADAS_APP_ADDENDUM_v1.md` §4 (komisi referrer), §5 (alur pengajuan referrer)
- `PLAN_DEV_v3_1.md` §12 (Sprint 7 — referral system lengkap)
- Midtrans documentation: QRIS API + HTTP Notification (docs.midtrans.com)

---

### ✅ D.0 — Bug Fixes (BLOCKING — selesaikan dulu)

**D.0.1 Fix `rag.js` — method dan field:**
- `GET /select-variant` → `POST /select-variant`; parameter pindah dari query string ke body
- Standarisasi quota: `GET /quota/:studentId?level=N` (path param studentId, query param level)
- Konfirmasi + seragamkan field name `/ask`: gunakan `student_id` + `question_text` konsisten

**D.0.2 Git commit:**
```bash
git add -A
git commit -m "Sprint A/B/C: placement bias, RAG pipeline, billing, auth — all tested"
```

**🧪 Backtest D.0:**
```
POST /api/rag/select-variant  (body: student_id, level, concept_id) → 200
GET  /api/rag/quota/:studentId?level=8 → 200
POST /api/rag/ask (body: student_id, question_text, level) → 200
git log --oneline → commit tercatat
```

---

### ✅ D.1 — DB Schema Migration (`012_midtrans_referrer_dashboard.sql`)

**Tabel baru: `midtrans_orders`** *(v1.3: menggantikan `xendit_invoices`)*
```sql
CREATE TABLE midtrans_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  order_id VARCHAR(100) UNIQUE NOT NULL,   -- format: CADAS-{studentId}-{timestamp}
  qr_string TEXT,                           -- QRIS string untuk ditampilkan di app
  product_type VARCHAR(50) NOT NULL,
  level_from INT NOT NULL,
  level_to INT NOT NULL,
  amount_idr INT NOT NULL,
  referrer_code VARCHAR(50),
  status VARCHAR(20) DEFAULT 'pending',     -- pending | settlement | expire | cancel
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  expired_at TIMESTAMP
);
CREATE INDEX idx_midtrans_orders_student ON midtrans_orders(student_id);
CREATE INDEX idx_midtrans_orders_status ON midtrans_orders(status);
```

**Tabel baru: `referrer_earnings`**
```sql
CREATE TABLE referrer_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES referrers(id),
  payment_record_id UUID NOT NULL REFERENCES payment_records(id),
  amount_idr INT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  period_month VARCHAR(7),
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  paid_by_admin VARCHAR(100)
);
CREATE INDEX idx_referrer_earnings_referrer ON referrer_earnings(referrer_id);
CREATE INDEX idx_referrer_earnings_status ON referrer_earnings(status, period_month);
```

**Kolom baru di `referrers`:**
```sql
ALTER TABLE referrers ADD COLUMN email VARCHAR(200) UNIQUE;
ALTER TABLE referrers ADD COLUMN password_hash VARCHAR(200);
ALTER TABLE referrers ADD COLUMN referral_token VARCHAR(20) UNIQUE;
ALTER TABLE referrers ADD COLUMN bank_name VARCHAR(100);
ALTER TABLE referrers ADD COLUMN bank_account_number VARCHAR(50);
ALTER TABLE referrers ADD COLUMN bank_account_name VARCHAR(100);
ALTER TABLE referrers ADD COLUMN whatsapp_number VARCHAR(20);
ALTER TABLE referrers ADD COLUMN total_earnings_idr INT DEFAULT 0;
ALTER TABLE referrers ADD COLUMN total_paid_idr INT DEFAULT 0;
ALTER TABLE referrers ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE referrers ADD COLUMN application_data JSONB;
ALTER TABLE referrers ADD COLUMN reviewed_by VARCHAR(100);
ALTER TABLE referrers ADD COLUMN reviewed_at TIMESTAMP;
ALTER TABLE referrers ADD COLUMN rejection_reason TEXT;
ALTER TABLE referrers ADD COLUMN last_rejected_at TIMESTAMP;
```

**Tabel baru: `download_clicks`** (IP attribution untuk referral token)
```sql
CREATE TABLE download_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES referrers(id),
  ip_address VARCHAR(50),
  user_agent TEXT,
  clicked_at TIMESTAMP DEFAULT NOW(),
  attributed BOOLEAN DEFAULT FALSE
);
CREATE INDEX idx_download_clicks_ip ON download_clicks(ip_address, attributed, clicked_at);
```

**🧪 Backtest D.1:**
```sql
\d midtrans_orders
\d referrer_earnings
\d referrers  -- cek kolom baru ada
\d download_clicks
```

---

### ✅ D.2 — Midtrans QRIS Integration *(v1.3: menggantikan Xendit)*

**`src/services/midtrans.js`:**
```javascript
// Fungsi utama:
createQrisOrder({ studentId, productType, levelFrom, levelTo, amountIdr, referrerCode })
  → POST https://api.midtrans.com/v2/charge
     body: { payment_type: 'qris', transaction_details: { order_id, gross_amount }, ... }
  → Simpan ke midtrans_orders (order_id format: CADAS-{studentId}-{Date.now()})
  → Return { qrString, orderId, amountIdr, expiresAt }

verifyWebhookSignature(req)
  // Midtrans HTTP Notification: signature ada di body.signature_key
  // Algoritma: SHA-512(order_id + status_code + gross_amount + MIDTRANS_SERVER_KEY)
  const expected = crypto.createHash('sha512')
    .update(body.order_id + body.status_code + body.gross_amount + process.env.MIDTRANS_SERVER_KEY)
    .digest('hex');
  return expected === body.signature_key;

handleSettlementCallback(orderId)
  → Update midtrans_orders.status = 'settlement', paid_at = NOW()
  → Activate level (update students.paid_*_up_to_level)
  → Insert payment_records
  → Hitung komisi: INSERT referrer_earnings kalau referrer_code ada
  → Update referrers.total_earnings_idr
  → Cek tripwire: parent referrer > 10 konversi/30 hari → flag untuk admin

checkOrderStatus(orderId)
  → GET https://api.midtrans.com/v2/{orderId}/status
  → Authorization: Basic base64(MIDTRANS_SERVER_KEY + ':')
  → Return { transaction_status, fraud_status }
```

**Route baru di `payment.js`:**
```
POST /api/payment/create-order
  Auth: parent JWT (verifyToken + requireRole('parent','admin'))
  Body: { student_id, product_type, level_from, level_to, referrer_code? }
  Validasi: student_id terhubung ke parent JWT
  → createQrisOrder() → return { qr_string, order_id, amount_idr, expires_at }
  (Frontend render qr_string sebagai QR code untuk di-scan user)

GET /api/payment/status/:order_id
  Auth: parent JWT
  → checkOrderStatus() → return { status, paid_at? }

POST /api/webhooks/midtrans
  Auth: verifikasi signature_key di body (SHA-512)
  Body: Midtrans HTTP Notification payload
  → verifyWebhookSignature() → cek transaction_status === 'settlement'
  → handleSettlementCallback()
  → Return 200 { success: true }
  ⚠️ Midtrans juga mengirim notifikasi untuk status lain (pending, expire) — handle idempoten
```

**Environment variables baru di `.env`:**
```
MIDTRANS_SERVER_KEY=SB-Mid-server-...   # Sandbox untuk testing
MIDTRANS_CLIENT_KEY=SB-Mid-client-...   # Untuk frontend (tidak dipakai backend)
MIDTRANS_IS_PRODUCTION=false            # true saat production
# Tidak perlu CALLBACK_TOKEN — Midtrans pakai SHA-512 signature di body
```

**⚠️ Catatan penting:**
- Daftar Midtrans di midtrans.com — cukup KTP, tidak perlu PT
- Sandbox mode: gunakan key `SB-Mid-server-...`, transaksi tidak nyata
- Webhook (HTTP Notification) butuh URL publik — untuk dev lokal pakai ngrok
- Atur Notification URL di Midtrans Dashboard → Settings → Configuration
- Status QRIS sukses = `transaction_status === 'settlement'` (bukan 'paid')
- Midtrans juga kirim notif untuk `pending`, `expire`, `cancel` — handle dengan update status saja
- Manual fallback `/api/admin/billing/activate` TETAP ADA dan tidak berubah

**🧪 Backtest D.2:**
```
POST /api/payment/create-order (valid) → qr_string ada, order_id format CADAS-xxx-xxx
POST /api/payment/create-order (parent bukan pemilik student) → 403
GET  /api/payment/status/:order_id → { status: 'pending' }
POST /api/webhooks/midtrans (signature salah) → 401
POST /api/webhooks/midtrans (simulasi settlement) → level ter-activate
  → midtrans_orders.status = 'settlement'
  → payment_records ter-insert
  → referrer_earnings ter-insert (kalau ada referrer)
POST /api/admin/billing/activate (manual fallback) → masih berjalan ✓
```

---

### ✅ D.3 — Auth Referrer (`src/routes/referrer.js`)

**Pola auth:** Email + password, JWT role=`referrer`. Konsisten dengan pola auth.js yang sudah ada.

**Endpoint auth:**
```
POST /api/referrer/register
  Body: { name, email, password, referrer_type, whatsapp_number, application_data? }
  referrer_type: teacher_private | affiliate | parent | other | student
  → Hash password (bcrypt, rounds=10)
  → Insert referrers status='pending'
  → Untuk parent: auto-approve jika syarat terpenuhi (1 anak ter-link + placement selesai)
  → Return { referrer_id, status, message }

POST /api/referrer/login
  Body: { email, password }
  → Verify bcrypt → return JWT { sub: referrer_id, role: 'referrer', type: referrer_type }

GET /api/referrer/me
  Auth: referrer JWT
  → Return profil lengkap + status approval
```

**Logika auto-approve per tipe (di register handler):**
```javascript
// parent: cek apakah sudah link anak + placement selesai
if (type === 'parent') {
  const hasChild = await db.query(
    `SELECT pc.student_id FROM parent_children pc
     JOIN placement_tests pt ON pt.student_id = pc.student_id
     WHERE pc.parent_id = $1 AND pt.status = 'completed' LIMIT 1`,
    [parentId]
  );
  if (hasChild.rowCount > 0) status = 'approved'; // auto-approve
}

// teacher_school: auto-approve tapi butuh verifikasi NUPTK dulu
// teacher_private, affiliate, other: status = 'pending', tunggu admin

// Generate token hanya saat approved
if (status === 'approved') {
  referralToken = crypto.randomBytes(5).toString('hex'); // 10 char
}
```

**Mount di index.js:**
```javascript
app.use('/api/referrer', require('./routes/referrer'));
app.use('/d', require('./routes/download'));  // token redirect
```

**🧪 Backtest D.3:**
```
POST /api/referrer/register (teacher_private) → status=pending
POST /api/referrer/register (parent dengan anak+placement) → status=approved, token ada
POST /api/referrer/login → JWT role=referrer
GET  /api/referrer/me (token valid) → profil + status
GET  /api/referrer/me (token tidak valid) → 401
```

---

### ✅ D.4 — Admin Dashboard (`src/routes/admin-dashboard.js`)

Semua endpoint dilindungi header `x-admin-secret` (konsisten dengan pola yang sudah ada).

```
GET /api/admin/dashboard/summary
  → {
      revenue: { total_idr, this_month_idr, last_month_idr },
      payments: { pending_midtrans, confirmed_manual, failed_expired },
      students: { total, active_this_month, new_this_month },
      referrers: { total_approved, pending_review, payout_pending_idr }
    }

GET /api/admin/dashboard/payments
  Query: ?status=all|pending|settlement|expire&from=YYYY-MM-DD&to=YYYY-MM-DD&page=1&limit=20
  → Gabungan midtrans_orders + payment_records, sorted by created_at DESC
  → Setiap row: { source: 'midtrans'|'manual', student_name, product_type,
                  level_from, level_to, amount_idr, status, created_at, paid_at }

GET /api/admin/dashboard/students
  Query: ?page=1&limit=20&search=nama
  → { id, username, display_name, current_level,
      paid_basic_up_to_level, paid_premium_up_to_level,
      referred_by_name, created_at }

GET /api/admin/dashboard/referrers
  Query: ?status=pending|approved|all&page=1
  → { id, name, email, referrer_type, status, commission_rate,
      students_count, total_earnings_idr, total_paid_idr,
      pending_earnings_idr, created_at, reviewed_at }

POST /api/admin/referrer/approve/:referrer_id
  → status='approved'
  → Generate referral_token (crypto.randomBytes(5).toString('hex'))
  → reviewed_by=admin, reviewed_at=NOW()
  → Return { referral_token, referral_link }

POST /api/admin/referrer/reject/:referrer_id
  Body: { rejection_reason }
  → status='rejected', last_rejected_at=NOW(), rejection_reason tersimpan

POST /api/admin/referrer/revoke/:referrer_id
  → status='revoked'
  → referral_token di-null (link tidak aktif lagi)
  → referrer_earnings yang sudah ada TIDAK dihapus

POST /api/admin/referrer/mark-paid/:referrer_id
  Body: { period_month, notes? }
  → Update referrer_earnings SET status='paid', paid_at=NOW(), paid_by_admin=$admin
     WHERE referrer_id=$1 AND status='pending' AND period_month=$2
  → Update referrers.total_paid_idr += sum yang dibayar
  → Return { rows_updated, amount_paid_idr }

GET /api/admin/referrer/pending-review
  → List referrers status='pending', sorted by created_at ASC
  → Termasuk application_data untuk review manual

GET /api/admin/referrer/flagged
  → List referrers yang ter-flag tripwire (parent > 10 konversi/30 hari)
```

**Mount di index.js:**
```javascript
app.use('/api/admin', require('./routes/payment'));           // existing
app.use('/api/admin', require('./routes/admin-dashboard'));   // NEW
```

**🧪 Backtest D.4:**
```
GET  /api/admin/dashboard/summary → angka revenue benar
GET  /api/admin/dashboard/payments?status=paid → list payment benar
GET  /api/admin/dashboard/referrers?status=pending → list pending benar
POST /api/admin/referrer/approve/:id → token ter-generate, status=approved
POST /api/admin/referrer/reject/:id → status=rejected, last_rejected_at tersimpan
POST /api/admin/referrer/mark-paid/:id → earnings ter-update, total_paid ter-update
GET  /api/admin/dashboard/summary (secret salah) → 401
```

---

### ✅ D.5 — Referrer Dashboard (endpoint di `src/routes/referrer.js`)

```
GET /api/referrer/dashboard
  Auth: referrer JWT
  → {
      status,
      referral_token,
      referral_link,         ← null kalau belum approved
      commission_tier,       ← Mitra|Andalan|Utama
      commission_rate,
      total_earnings_idr,
      total_paid_idr,
      pending_earnings_idr,  ← total_earnings - total_paid
      students_referred_count,
      earnings_this_month_idr
    }

GET /api/referrer/earnings
  Auth: referrer JWT
  Query: ?status=pending|paid|all&page=1
  → List referrer_earnings: { period_month, amount_idr, status, created_at, paid_at }
  → TIDAK include identitas siswa

GET /api/referrer/students
  Auth: referrer JWT
  → List anonim: { joined_month, current_level, total_spent_idr, is_active }
  → TANPA: nama, username, student_id, apapun yang bisa mengidentifikasi

GET /api/referrer/bank-info
  Auth: referrer JWT
  → { bank_name, bank_account_number_masked, bank_account_name }
  → bank_account_number_masked: tampilkan hanya 4 digit terakhir

PUT /api/referrer/bank-info
  Auth: referrer JWT
  Body: { bank_name, bank_account_number, bank_account_name }
  → Update data rekening
  → Validasi: bank_account_number hanya digit, panjang 8-20 karakter
```

**Logika commission tier:**
```javascript
function getCommissionTier(totalActiveReferrals) {
  if (totalActiveReferrals >= 30) return 'Utama';
  if (totalActiveReferrals >= 10) return 'Andalan';
  return 'Mitra';
}

function getEffectiveRate(baseRate, tier) {
  if (tier === 'Utama') return baseRate + 5;
  if (tier === 'Andalan') return baseRate + 2;
  return baseRate;
}
// Rate dasar: teacher_private=10%, parent=5%, student=3%, affiliate=per kesepakatan
```

**🧪 Backtest D.5:**
```
GET /api/referrer/dashboard (approved) → referral_link ada, earnings benar
GET /api/referrer/dashboard (pending) → referral_link null
GET /api/referrer/students → tidak ada field yang identify siswa
PUT /api/referrer/bank-info → tersimpan, GET konfirmasi masked
GET /api/referrer/earnings?status=pending → list benar
```

---

### ✅ D.6 — Token Redirect (`src/routes/download.js`)

```javascript
router.get('/:token', async (req, res) => {
  const { token } = req.params;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const ua = req.headers['user-agent'];

  const referrer = await db.query(
    'SELECT id FROM referrers WHERE referral_token = $1 AND status = $2',
    [token, 'approved']
  );

  await db.query(
    'INSERT INTO download_clicks (referrer_id, ip_address, user_agent) VALUES ($1, $2, $3)',
    [referrer.rows[0]?.id || null, ip, ua]
  );

  res.redirect(process.env.DOWNLOAD_URL || 'https://cadas.app/download');
});
```

**IP Attribution saat student register (tambahkan ke auth.js register handler):**
```javascript
// Setelah student ter-insert, cek download_clicks dalam 2 jam terakhir
const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
const click = await db.query(
  `SELECT referrer_id FROM download_clicks
   WHERE ip_address = $1 AND attributed = false
   AND clicked_at > NOW() - INTERVAL '2 hours'
   ORDER BY clicked_at DESC LIMIT 1`,
  [ip]
);
if (click.rowCount > 0) {
  await db.query('UPDATE students SET referred_by = $1 WHERE id = $2',
    [click.rows[0].referrer_id, newStudentId]);
  await db.query('UPDATE download_clicks SET attributed = true WHERE referrer_id = $1 AND ip_address = $2 AND attributed = false',
    [click.rows[0].referrer_id, ip]);
}
```

---

### ✅ D.7 — Frontend Screens Baru (ReferrerStack)

**Screens yang perlu dibuat:**

| Screen | File | Konten |
|--------|------|--------|
| Login | `ReferrerLoginScreen.jsx` | Email + password form, link ke register |
| Register | `ReferrerRegisterScreen.jsx` | Form tipe referrer, data aplikasi per tipe, validasi |
| Dashboard | `ReferrerDashboardScreen.jsx` | Status, link referral + copy/share, summary earnings, tier badge |
| Earnings | `ReferrerEarningsScreen.jsx` | List per periode, filter status, total |
| Students | `ReferrerStudentsScreen.jsx` | List anonim, framing: "X teman bergabung" |
| Bank Info | `ReferrerBankInfoScreen.jsx` | Form isi/edit rekening bank |

**Perubahan App.jsx:**
```jsx
// Tambah di navigator:
if (authRole === 'referrer') {
  return <ReferrerStack />;
}
```

**Catatan UX penting:**
- Dashboard tampilkan status approval dengan jelas (pending = "Pengajuan sedang direview")
- Link referral hanya tampil kalau approved — jangan tampilkan input field kosong
- Tab earnings + students dalam satu navigator, bank info di settings referrer
- Tier badge (Mitra/Andalan/Utama) tampil di header dashboard

---

### 🏁 Kriteria Selesai Sprint D

- [ ] D.0: 3 bug rag.js fixed + git commit dilakukan
- [ ] D.1: Migration 012 berjalan tanpa error, semua tabel/kolom ada (`midtrans_orders`)
- [ ] D.2: Midtrans QRIS order create + HTTP Notification webhook berjalan (sandbox mode)
- [ ] D.2: Manual fallback `/api/admin/billing/activate` masih berjalan
- [ ] D.3: Referrer register + login + JWT role=referrer berjalan
- [ ] D.3: Auto-approve parent dan teacher_school berfungsi
- [ ] D.4: Admin dashboard summary, payments, referrers, approve/reject/mark-paid semua berjalan
- [ ] D.5: Referrer dashboard, earnings, students (anonim), bank-info semua berjalan
- [ ] D.6: GET /d/:token redirect + catat download_clicks
- [ ] D.6: IP attribution ter-set saat student register
- [ ] D.7: 6 screen ReferrerStack dibuat dan navigasi berjalan
- [ ] Backtest end-to-end: scan QRIS Midtrans → settlement → level aktif → komisi tercatat → tampil di referrer dashboard

### ⚠️ Catatan Fase
```
Status           : SELESAI (D.2 dimigrasi ke Midtrans QRIS per v1.3, 12 Sep 2026)
Prerequisite     : Sprint A/B/C selesai (✅), git commit (✅)
Midtrans key     : Daftar di midtrans.com (KTP saja, tanpa PT), gunakan Sandbox dulu
                   → Server Key format: SB-Mid-server-xxx (sandbox) / Mid-server-xxx (prod)
Domain /d/       : Perlu domain cadas.app untuk production redirect
Payout manual    : Transfer bank dilakukan admin, dicatat via /api/admin/referrer/mark-paid
Webhook URL      : Atur di Midtrans Dashboard → Settings → Configuration → Notification URL
```

---

# FASE 10 — PARENT DASHBOARD

### 🎯 Tujuan
Role Parent fungsional — linking, dashboard analytics, Focus Score, visibilitas status level anak.

### ✅ Sub-fase & tugas

**10.1 Backend:**
```
GET /api/parent/dashboard/:parent_id
GET /api/parent/analytics/:student_id  — weekly chart data
```
(POST /parent/register, POST /parent/login, POST /parent/link-child sudah ada di auth.js)

**10.2 UI:**
- `ParentDashboardScreen.jsx` — ringkasan per anak, badge status level
- `ParentAnalyticsScreen.jsx` — chart mingguan (akurasi, waktu, level progress)
- `ManageChildrenScreen.jsx` — link/unlink anak

**10.3 Focus Score:**
- Track `AppState` switch selama practice session
- Track idle time + time-to-first-answer
- Tampilkan sebagai "Skor Fokus" dengan copy jujur

### 🏁 Kriteria selesai
- [ ] Parent bisa lihat dashboard semua anak yang ter-link
- [ ] Analytics chart mingguan akurat
- [ ] Focus Score tampil dengan framing jujur
- [ ] Billing status per anak terlihat jelas (Basic/Premium/Locked per level)

---

# FASE 11 — GURU DASHBOARD

### 🎯 Tujuan
Role Guru fungsional — verifikasi, classroom, consent, assignment. Referral guru
sudah ditangani di Sprint D (Fase 12).

### ✅ Sub-fase & tugas

**11.1 Backend:**
```
POST /api/teacher/verify      — verifikasi NUPTK/email sekolah
POST /api/teacher/classrooms
GET  /api/teacher/classrooms/:id
POST /api/teacher/assignments
GET  /api/teacher/assignments/:id/progress
POST /api/classroom/join      — parent submit kode + consent
DELETE /api/classroom/students/:id  — parent revoke
```

**11.2 UI:**
- `TeacherAuthScreen.jsx` — dua sub-alur: school vs private
  - school: verifikasi NUPTK, dapat classroom, TIDAK ada UI komisi
  - private: verifikasi ringan, dapat link referral (via Sprint D)
- `ClassroomDashboardScreen.jsx`
- `AssignmentsScreen.jsx`

**11.3 Permission Boundary (enforce di backend):**

| Data | Guru Akses |
|------|-----------|
| Skor, level progress, topic mastery | ✅ |
| Streak/konsistensi | ✅ |
| Focus Score, timing sesi | ❌ |
| Billing/status premium | ❌ |

**11.4 Consent Flow:**
- Parent HARUS eksplisit consent sebelum classroom_students dibuat
- Layar consent: tampilkan persis apa yang guru bisa lihat + apa yang tidak
- Revoke oleh parent langsung efektif tanpa approval guru

### 🏁 Kriteria selesai
- [ ] Guru sekolah dan guru les punya alur register berbeda
- [ ] Guru tidak bisa generate invite sebelum verified
- [ ] Consent flow jelas tentang batas data
- [ ] Backend reject query guru untuk data billing/Focus Score

---

# FASE 13 — POLISH, OFFLINE, BETA TEST

### ✅ Sub-fase & tugas

**13.1 Offline Support:**
- Cache soal level aktif ke AsyncStorage
- Cache audio yang sudah pernah diputar
- Copy jujur di Settings tentang batasan offline

**13.2 Push Notification (FCM):**
- Laporan malam ke orang tua (dua template: berlatih vs belum)
- Reminder sesi per anak (terjadwal atau bebas)
- Reminder terakhir minimal 2-3 jam sebelum tengah malam

**13.3 Beta Test:**
- Rekrut 20-50 anak + orang tua (campuran level)
- Fokus: placement test accuracy, practice loop engagement, AskKak relevance
- Monitoring: `llm_usage_log`, `student_questions`, error rate endpoint

### 🏁 Kriteria selesai
- [ ] App bisa dipakai offline untuk soal + audio yang sudah di-cache
- [ ] Push notification jalan di Android
- [ ] Beta group aktif minimal 2 minggu, feedback terkumpul

---

# FASE 14 — DISTRIBUSI & RILIS

### ✅ Sub-fase & tugas

**14.1 Android:**
- Build APK production (Expo EAS Build)
- Distribusi via download direct (`cadas.app/download`)
- Play Store listing tanpa IAP (opsional, tidak blocking)

**14.2 iOS:**
- PWA via Add to Home Screen dari Safari
- Tidak submit App Store (hindari 30% cut + review policy IAP)

**14.3 Backend Production:**
- Ganti embedding placeholder ke model nyata (jaga dimensi 384 atau migrasi kolom)
- Pasang OpenRouter API key nyata
- Setup monitoring biaya LLM (circuit breaker threshold aktifkan)
- ADMIN_SECRET kuat, MIDTRANS_SERVER_KEY production (format: Mid-server-xxx, bukan SB-)

**14.4 Ops:**
- Backup DB otomatis (daily)
- Error alerting (Sentry atau minimal email)
- Midtrans Notification URL pointing ke server production (bukan ngrok), set di Midtrans Dashboard

### 🏁 Kriteria selesai
- [ ] APK bisa diinstall dari `cadas.app/download`
- [ ] Midtrans HTTP Notification URL pointing ke server production (bukan ngrok), MIDTRANS_IS_PRODUCTION=true
- [ ] Embedding model nyata terpasang
- [ ] Monitoring biaya LLM aktif
- [ ] Backup DB otomatis berjalan

---

## PERTANYAAN TERBUKA (perlu keputusan sebelum sprint terkait dimulai)

| # | Pertanyaan | Memengaruhi |
|---|-----------|-------------|
| 1 | Kuota AskKak: 38 atau dibulatkan ke 40 per level? | Fase 8/13 |
| 2 | Bulk purchase kelompok (min 10 siswa) — alur Midtrans QRIS-nya? Satu order atau batch per siswa? | Sprint D.2 |
| 3 | Gap 1.4: 15/15 explanation_variants sudah lolos audit? | Fase 1 |
| 4 | Midtrans Server Key & Client Key sudah ada? Daftar di midtrans.com (KTP saja, tanpa PT) | Sprint D.2 |
| 5 | Domain `cadas.app` sudah ada untuk `/d/:token` redirect? | Sprint D.6 |
| 6 | Komisi siswa referrer: kredit premium atau transfer ke rekening orang tua? | Sprint D.5 |
| 7 | Embedding model production: OpenAI ada-002 (1536 dim, perlu migrasi kolom), atau model lain 384 dim? | Fase 14 |
