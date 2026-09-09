# Progress Log — Cadas App Development
> Diperbarui: 9 September 2026 (audit sesi lanjutan — berdasarkan transkrip sesi coding + hasil live-test API)
> Dokumen ini menggantikan versi sebelumnya. Sumber kebenaran: isi file yang benar-benar ditampilkan
> dan hasil pengujian endpoint langsung (bukan klaim tertulis dari catatan sesi mana pun, termasuk
> catatan sesi ini sendiri di masa depan — selalu verifikasi ulang saat ada keraguan).
> Simbol: ✅ = terverifikasi (file dibaca langsung ATAU endpoint diuji langsung dan sukses)
>          ⚠️ = ada tapi ada gap/belum diuji ulang setelah perubahan
>          ❌ = belum ada / dikonfirmasi rusak

---

## ⚠️ CATATAN PENTING SEBELUM MEMBACA

Audit `PROGRESS.md` versi sebelumnya (sebelum dokumen ini) mengandung beberapa klaim yang **keliru/usang** —
misalnya menyebut `useStore.js` tidak punya auth state dan `auth.js` tidak punya endpoint login siswa.
Setelah isi file dibaca ulang secara langsung di sesi ini, klaim-klaim itu **tidak benar** — kedua file
tersebut sudah lengkap. Pelajaran: audit berdasarkan asumsi/ingatan gampang usang begitu ada sesi coding
baru berjalan. Dokumen ini disusun berdasarkan bukti paling akhir yang tersedia.

---

## RINGKASAN STATUS PER FASE

| Fase | Nama | Backend | Frontend | Catatan |
|------|------|---------|----------|---------|
| 0 | Setup & Orientasi | ✅ | ✅ | Selesai |
| 1 | Gap Konten (speed-math-master) | ✅ | — | Gap 1.4 (audit explanation_variants) masih belum dikonfirmasi |
| 2 | Backend Foundation & Migrasi | ✅ | ✅ | index.js sempat rusak total, sudah diperbaiki & live |
| 3 | Auth, Role Routing & Onboarding | ✅ | ✅ | Semua endpoint + semua screen terverifikasi ada, register live-tested sukses |
| 4 | Placement Test | ⚠️ | ✅ | start+submit live-tested sukses; status belum diuji ulang; student_variant_bias TIDAK ditulis (gap baru ditemukan) |
| 5 | Practice Loop | ⚠️ | ⚠️ | Tidak tersentuh sesi ini — status sama seperti audit sebelumnya, belum diverifikasi ulang |
| 6 | Billing Per-Level | ✅ | ⚠️ | Harga sudah benar (P0 fix terkonfirmasi), endpoint admin ada; UpgradePaywallScreen konten belum diverifikasi ulang |
| 7 | Fast Track & Upgrade Test | ✅ | ✅ | getLevelAccess() benar, shared db.js sudah dipakai, SessionResultScreen ditulis ulang dari stub |
| 8 | RAG Pipeline & AskKak | ⚠️ | ⚠️ | Tidak tersentuh sesi ini — semantic search masih placeholder per audit sebelumnya |
| 9 | Avatar & Gamification | ✅ | ⚠️ | useStore 11-state bot system terverifikasi lengkap; isi BotCharacter.jsx belum dibaca ulang sesi ini |
| 10 | Parent Dashboard | ❌ | ❌ | Belum dimulai |
| 11 | Guru & Referral | ❌ | ❌ | Belum dimulai |
| 12 | Polish, Offline, Beta Test | ❌ | ❌ | Belum dimulai |
| 13 | Distribusi & Rilis | ❌ | ❌ | Belum dimulai |

---

## 🚨 BUG BARU DITEMUKAN SESI INI — BELUM ADA DI CATATAN MANAPUN SEBELUMNYA

### 1. `student_variant_bias` tidak pernah ditulis oleh `/api/placement/submit`
File `routes/placement.js`, fungsi `calculatePlacement()` menghitung `prerequisite_signals` dengan benar
dan mengembalikannya di response — **tapi tidak ada satu baris kode pun** yang menyimpan hasil ini ke
tabel `student_variant_bias`. Ini persis task FASE 4.4 di `final_plan_v1.1.md` yang seharusnya jadi bagian
inti dari fitur ini. Dampak: bot AskKak tidak akan pernah tahu bias awal dari hasil placement, seluruh
mekanisme "tawarkan Quick Method sejak percobaan pertama untuk siswa dengan sinyal kuat" (Addendum §4.4 /
DETAILED_LEVEL_PLANS §0.5) **tidak aktif** meskipun placement sendiri berjalan sempurna.

**Perlu ditambahkan:** setelah `calculatePlacement()` dipanggil di handler `/submit`, tulis loop yang
mengecek `prerequisite_signals` terhadap level-level dependency (Level 6 dari addition_recall, Level 12
dari multiplication_recall) dan insert ke `student_variant_bias` sesuai aturan yang sudah didokumentasikan.

### 2. `GET /api/placement/status/:studentId` — status perbaikan tidak diketahui
Endpoint ini sempat gagal dengan error `column "created_at" does not exist` (dari log server, sebelum
banyak fix lain diterapkan). **Tidak pernah diuji ulang** setelah itu di sesi ini — status akhirnya belum
diketahui: apakah tabel `placement_tests` memang tidak punya kolom `created_at`, atau ini error sesaat.
**Wajib diuji ulang** sebelum fase ini dianggap selesai.

---

## DETAIL PER FASE (diperbarui)

---

### FASE 2 — BACKEND FOUNDATION ✅ (direvisi dari ⚠️)

**Insiden ditemukan & diperbaiki sesi ini:**
- `index.js` rusak total (syntax error `Unexpected token 'if'` di baris 82) — akibat kode pengecekan
  parent-ownership ter-paste di tengah pemanggilan `db.query(...)` alih-alih sebelum baris itu, dari
  edit manual sesi sebelumnya.
- Percobaan perbaikan pertama (memakai slicing array PowerShell `$src[93..]`) **gagal diam-diam** —
  ekspresi `$tail = $src[93..]` error karena sintaks tidak lengkap, membuat `$tail` kosong dan
  memotong sisa file (closing brace, `app.listen`, `module.exports` semua hilang).
- Perbaikan kedua (menulis ulang bagian yang hilang via `Add-Content`) **berhasil** — file sekarang
  106 baris, dimuat tanpa error.

**Terverifikasi hidup:**
```
GET /api/health → { status: "OK", database: "connected" }
```

**Masih terbuka:**
- ⚠️ `student_level_quota` dan `student_variant_bias` — keberadaan tabelnya di migration 011 belum
  dikonfirmasi lewat query skema langsung (percobaan cek skema di sesi ini gagal karena kesalahan
  sintaks perintah `node -e`, bukan karena tabelnya tidak ada — perlu dicoba ulang dengan cara lain).

---

### FASE 3 — AUTH, ROLE ROUTING & ONBOARDING ✅ (direvisi dari ⚠️/❌)

**Backend — terverifikasi lengkap via `Select-String` terhadap `auth.js`:**
```
POST /student/register            (baris 20)
POST /parent/register             (baris 53)
POST /parent/login                (baris 89)
POST /teacher/register            (baris 117)
POST /teacher/login               (baris 153)
GET  /parent-gate/challenge       (baris 186)
POST /parent-gate/verify          (baris 195)
GET  /me                          (baris 216)
POST /student/login               (baris 224)  ← sebelumnya diklaim tidak ada, TERNYATA ADA
POST /parent/link-child           (baris 245)  ← sebelumnya diklaim tidak ada, TERNYATA ADA
```

**Live-tested — sukses:**
```
POST /api/auth/student/register {"name":"Budi Test","kelas":5}
→ 200 OK, student_id + student object (username auto: "siswa_01b1761f") + JWT token valid
```

**Frontend — semua 5 screen onboarding terverifikasi ada dan dibaca lengkap:**
| Screen | Baris | Catatan |
|---|---|---|
| RoleSelectScreen.jsx | 37 | Dua jalur: daftar anak baru / masuk sebagai orang tua |
| StudentRegisterScreen.jsx | 112 | Mode register (nama+kelas) dan login (student ID) dalam satu file |
| PlacementScreen.jsx | 179 | Fetch semua probe di awal, jawab satu-satu, submit di akhir |
| PlacementResultScreen.jsx | 81 | Framing positif, CTA daftar orang tua, opsi lewati dulu |
| ParentAuthScreen.jsx | 131 | Tab register/login, auto link-child setelah sukses |

**App.jsx — terverifikasi benar:** AuthStack (belum login) → needPlacement branch (login tapi belum
placement) → Main branch (siap pakai app), dengan restore sesi dari AsyncStorage saat app dibuka.
Semua 10 screen ter-import dengan benar, tidak ada import yang hilang.

**useStore.js — terverifikasi LENGKAP** (klaim audit sebelumnya "tidak ada authToken/authRole" **keliru**):
`authToken`, `authRole`, `placementDone`, `setAuth()`, `setPlacementDone()`, `clearAuth()` semua ada.

**Perbaikan tambahan sesi ini:**
- `api.js` awalnya cuma export `BASE_URL`, padahal semua screen import `{ API_BASE }` — akan crash
  saat runtime. Ditulis ulang bersih dengan `authFetch()` helper, `API_BASE` dan `BASE_URL` sama-sama
  di-export dari satu sumber (`_base`), tidak ada duplikasi logic.
- `SettingsScreen.jsx` masih stub 6 baris ("Coming Soon") → ditulis ulang jadi 58 baris (info akun,
  level saat ini, tombol logout dengan konfirmasi + clear AsyncStorage).
- `HomeScreen.jsx` sapaan hardcode "Hai, Cadas!" → diganti pakai `student?.name` dari store.

---

### FASE 4 — PLACEMENT TEST ⚠️ (backend) / ✅ (frontend)

**Backend — live-tested, hasil campuran:**
```
POST /api/placement/start   → SUKSES: placementId + 10 exercises dikembalikan
POST /api/placement/submit  → SUKSES: placedLevel:1, total:10, correct:0, speedEmphasis:low
                               (correct:0 karena jawaban tes pakai dummy "126" untuk semua soal,
                               ini murni tes pipa data, bukan validasi akurasi algoritma placement)
GET  /api/placement/status/:studentId → ⚠️ TIDAK DIUJI ULANG setelah error "column created_at
                               does not exist" ditemukan di log. Status akhir tidak diketahui.
```

**Gap kritis ditemukan:** `student_variant_bias` tidak ditulis oleh handler `/submit` — lihat bagian
"BUG BARU DITEMUKAN" di atas. Ini blocking untuk personalisasi bot AskKak berbasis hasil placement.

**Frontend — kode dibaca lengkap, tampak solid:**
- `PlacementScreen.jsx`: fetch semua soal di `/start`, timer per soal, auto-fokus input, submit satu
  per satu ke state lokal lalu kirim semua sekaligus di `/submit`, penanganan kasus "sudah pernah
  placement" (409) dengan redirect langsung ke result.
- `PlacementResultScreen.jsx`: nama level dari mapping lokal, tampilkan catatan `speedEmphasis`/
  `prerequisiteSignals` sebagai kotak info, dua CTA (daftar orang tua / lewati dulu).

---

### FASE 6 — BILLING PER-LEVEL ✅ (direvisi dari ⚠️, P0 fix terkonfirmasi)

Merujuk `CADAS_APP_AUDIT_REPORT_20260909.md` (commit `39c25a4`), dikonfirmasi dengan membaca ulang
route list di sesi ini:

- ✅ Harga di `upgrade-test.js` sudah benar: Single Rp40.000, Basic Bundle Rp100.000, Premium Bundle
  Rp165.000 — bug harga terbalik (Premium lebih murah dari Basic) sudah diperbaiki dan diverifikasi.
- ✅ `GET /api/billing/status/:student_id` di `index.js` sekarang terlindungi (`verifyToken` +
  `requireRole('admin','parent')` + pengecekan kepemilikan anak untuk role parent) — celah keamanan
  yang saya tandai P0 di audit sebelumnya **sudah tertutup**, dan sekarang terbukti bekerja karena
  backend berhasil start dengan kode ini aktif (sebelumnya kode ini yang justru menyebabkan syntax
  error, jadi baru sekarang benar-benar teruji berjalan).
- ✅ `payment.js` berisi 3 route: `POST /upgrade-tier`, `POST /admin/billing/activate`,
  `GET /admin/billing/status/:student_id` — route yang sebelumnya saya kira tidak ada, ternyata ada,
  hanya beda nama file dari dugaan saya (`payment.js`, bukan `billing.js`).

**Masih terbuka:**
- ⚠️ Apakah endpoint `/api/admin/billing/activate` sudah dilindungi otentikasi admin (`ADMIN_SECRET`
  atau setara) belum dikonfirmasi ulang di sesi ini — perlu dicek isi lengkap `payment.js`, bukan
  cuma daftar route-nya.
- ⚠️ Konten `UpgradePaywallScreen.jsx` (46 baris) belum dibaca ulang untuk konfirmasi tiga harga
  yang ditampilkan ke user sudah sinkron dengan yang di backend.

---

### FASE 7 — FAST TRACK & UPGRADE TEST ✅ (direvisi dari ⚠️)

- ✅ `getLevelAccess()` di `upgrade-test.js` terverifikasi benar, mengikuti Addendum §1.2 persis:
  cek `paid_premium_up_to_level` → `paid_basic_up_to_level` → fallback `locked`.
- ✅ **Diperbaiki sesi ini:** `placement.js` dan `upgrade-test.js` sebelumnya masing-masing bikin
  `new Pool()` sendiri (duplikasi koneksi database, boros resource). Sekarang keduanya pakai
  `require('../database/db')` yang sama seperti route lain.
- ✅ `SessionResultScreen.jsx` **ditulis ulang total** dari stub 6 baris menjadi implementasi 100
  baris: hero card beda gaya untuk level-up vs sesi biasa, tiga kotak statistik (akurasi/benar/waktu),
  saran drill kalau akurasi bagus tapi belum level-up, dua tombol aksi (kembali/lanjut latihan).

**Housekeeping kecil:** ada file `upgrade-test.js.backup.20260909_141218` tertinggal di folder
`routes/` — sebaiknya dihapus dari repo, bukan cuma diabaikan `.gitignore`.

---

### FASE 9 — AVATAR & GAMIFICATION ✅ (backend/state) / ⚠️ (frontend, direvisi dari ⚠️)

**useStore.js dibaca penuh sesi ini — terverifikasi LENGKAP** (klaim audit sebelumnya bahwa file ini
"gap kritis, tidak ada auth state" **sepenuhnya keliru**, kemungkinan dibaca di versi file yang beda):
- 11 bot state dikomentari eksplisit: `idle | listening | thinking | speaking_calm | speaking_hype |
  celebrating | disappointed_mild | sleeping | welcome_back | level_up | fast_track`
- `companionLevel` (0-5) dengan `incrementCompanion()`
- `visemeData` + `startSpeaking()`/`stopSpeaking()`
- `getConfidenceScore()` — implementasi lengkap: akurasi 40% + kecepatan 35% + konsistensi 25%,
  dengan target waktu per level yang sesuai `SPEED_TARGETS_QUICK_REFERENCE.md`

**Belum diverifikasi ulang sesi ini:** isi `BotCharacter.jsx` (apakah benar pakai SVG transformer
sesuai catatan audit sebelumnya, atau ada regresi) — tidak dibuka di sesi ini.

---

## GIT & BACKUP — MASIH BELUM DITANGANI ⚠️

Tidak ada satupun perintah `git commit` yang muncul di transkrip sesi ini, meski banyak sekali
perubahan dilakukan: 4 screen baru, `index.js` diperbaiki dari rusak total, `api.js` ditulis ulang,
`SettingsScreen.jsx` ditulis ulang, `placement.js`/`upgrade-test.js` diperbaiki. **Seluruh pekerjaan
ini masih hanya ada di disk, belum ada checkpoint.** Ini peringatan yang sama yang sudah disampaikan
sebelumnya dan sampai sesi ini belum ditindaklanjuti — risiko kehilangan pekerjaan tetap tinggi.

---

## GAP KRITIS — URUTAN PRIORITAS DIPERBARUI

1. **Commit semua pekerjaan** — `cadas-app-backend` maupun `cadas-app`. Ini di atas segalanya.
2. **Implementasikan penulisan `student_variant_bias`** di handler `/api/placement/submit` — fitur
   personalisasi bot berbasis placement belum aktif tanpa ini.
3. **Uji ulang `/api/placement/status/:studentId`** — pastikan error `column created_at does not
   exist` benar-benar sudah tidak muncul, bukan cuma kebetulan tidak tersentuh di tes terakhir.
4. **Verifikasi keberadaan `student_level_quota`** lewat query skema yang benar (percobaan sebelumnya
   gagal karena kesalahan sintaks perintah, coba pendekatan lain, misal file `.sql` sementara alih-alih
   inline `node -e`).
5. **Cek proteksi otentikasi di `POST /api/admin/billing/activate`** — pastikan tidak bisa dipanggil
   tanpa kredensial admin.
6. **Hapus file backup yang tertinggal** (`upgrade-test.js.backup.*`) dari struktur folder aktif.
7. Item lama yang masih terbuka: Gap 1.4 (audit `explanation_variants`), pgvector migration 002
   (apakah sudah benar-benar dijalankan setelah upgrade image, bukan cuma image-nya yang di-pull),
   dan rekonsiliasi `PLAN_DEV_v3.1.md` vs `PLAN_DEV_v3.md` (1331 vs 1158 baris, belum dibandingkan).

---

## PERTANYAAN TERBUKA (belum berubah dari audit sebelumnya, masih perlu keputusan Anda)

| # | Pertanyaan | Memengaruhi |
|---|-----------|-------------|
| 1 | Kuota reset: cumulative (sekarang, sesuai `quota-rules.js`) atau monthly? | FASE 8 |
| 2 | Student login pakai `student_id` mentah — cukup aman untuk konteks ini? | FASE 3 |
| 3 | Bulk purchase kelompok — alur belum didesain sama sekali | FASE 6/11 |
| 4 | Gap 1.4: 15/15 explanation_variants sudah lolos audit? | FASE 1 |
| 5 | `PLAN_DEV_v3.1.md` vs `PLAN_DEV_v3.md` — mana yang otoritatif? | Semua fase |
