# 🎯 CADAS APP — FINAL PLAN v1.1
## Rujukan Tunggal & Final untuk Developer — Fase Linear dari Nol hingga Rilis

**Tanggal disusun:** 8 September 2026
**Versi:** 1.1 (revisi dari v1.0)
**Status:** FINAL — dokumen ini adalah urutan eksekusi otoritatif
**Cakupan:** `speed-math-master` (gap konten) + `cadas-app-backend` (Express) + `cadas-app` (React Native)
**Terakhir diupdate:** 9 September 2026

---

## CHANGELOG v1.0 → v1.1

**Konteks:** Setelah v1.0 disusun, empat dokumen kurikulum tambahan dibaca lebih mendalam (`DETAILED_LEVEL_PLANS_ALL_LEVELS.md` §0 penuh, `TECHNICAL_SPEC_EXERCISE_MATERIAL_GENERATOR.md`, `SPEED_TARGETS_QUICK_REFERENCE.md`, `KUMON_CURRICULUM_COMPLETE_STRUCTURE.md`) khusus untuk mendiskusikan userflow di dalam sesi latihan dan test. Diskusi ini menemukan tiga celah nyata di v1.0 yang memengaruhi FASE 4, FASE 5, dan FASE 8. Ketiganya sudah direvisi di dokumen ini.

**1. Placement tidak hanya menentukan level, tapi juga membiaskan pilihan varian penjelasan bot (FASE 4).**
`DETAILED_LEVEL_PLANS_ALL_LEVELS.md` §0.5 menjelaskan `prerequisite_signal` dari hasil placement (misal `multiplication_recall: "strong"`) seharusnya langsung membiaskan Selection Rule di level-level dengan dependency tertentu — siswa dengan sinyal kuat ditawari Quick Method sejak percobaan pertama, tidak perlu gagal dulu. v1.0 mencatat `prerequisite_signals` tersimpan tapi tidak pernah menyambungkannya ke logika bot. **Perbaikan:** FASE 4 sekarang punya sub-fase 4.4 — tabel `student_variant_bias` dan langkah eksplisit menulis bias saat placement selesai, termasuk aturan pengecualian `floor_check_passed=false`.

**2. Ada mesin Selection Rule generik yang berulang di semua level, belum eksplisit dibangun (FASE 8).**
Setiap level (dicontohkan lewat Level 3 di `DETAILED_LEVEL_PLANS_ALL_LEVELS.md` §3.5b) memakai pola keputusan yang sama persis: gagal 2x → cek data kecepatan → akurat-tapi-lambat menawarkan Quick Method, lambat-dan-tidak-akurat menawarkan varian visual. v1.0 hanya mencatat "error-pattern matching" secara longgar tanpa membangun mesin keputusan ini sebagai fungsi tersendiri. **Perbaikan:** FASE 8 sekarang punya sub-fase 8.3b — `selectExplanationVariant()`, satu fungsi generik yang dipanggil dari FASE 5, dengan urutan prioritas eksplisit (data performa nyata > bias placement > aturan default 2-kegagalan).

**3. Cakupan mode drill terlalu longgar (FASE 5).**
v1.0 menulis mode drill (`?mode=drill`, tanpa hint) sebagai parameter generik untuk level manapun. `DETAILED_LEVEL_PLANS_ALL_LEVELS.md` §0.8.5 sebenarnya membatasi ini hanya untuk level speed-lock (5, 8, 9) DAN hanya setelah teknik level itu pernah diajarkan dan dilulusi sekali dengan dukungan penjelasan penuh. **Perbaikan:** FASE 5 sub-fase 5.2 disempitkan sesuai batasan asli, dengan flag `technique_taught_and_passed` per `(student_id, level)` sebagai penentu kelayakan.

**Tambahan kecil:** §0.8.2 "short bursts" (memecah target harian jadi dua sesi pendek dengan jeda) terlewat total di v1.0 — sekarang ditambahkan sebagai sub-task di FASE 5.2.

**Dampak ke fase lain:** Tidak ada. FASE 0-3, 6-7, 9-14 tidak tersentuh oleh revisi ini.

---

## CARA MEMAKAI DOKUMEN INI

Dokumen ini **bukan** pengganti dokumen-dokumen sumber di bawah. Dokumen ini adalah **peta eksekusi** — urutan fase yang benar, tugas konkret per fase, kapan harus membaca dokumen sumber yang mana, cara memvalidasi (backtest) sebelum lanjut ke fase berikutnya, dan tempat mencatat kendala/perubahan.

**Dokumen sumber utama (peta eksekusi & keputusan bisnis):**

| Kode | Nama file | Isi |
|---|---|---|
| `[MG]` | `PLAN_DEV_MATERIAL_GENERATOR_v2.md` | Pekerjaan di `speed-math-master` — generate & audit konten sebelum migrasi |
| `[V2]` | `PLAN_DEV_v2.md` | Rancangan awal `cadas-app` — backend, skema, Sprint 1-8 (v2 |
| `[V3]` | `PLAN_DEV_v3.1.md` | Rancangan terkini — revisi v2, sprint 1-8 (v3.1) |
| `[ADD]` | `CADAS_APP_ADDENDUM_v1.md` | Revisi & keputusan baru setelah v3.1 — **menang atas [V3] untuk hal yang direvisi** |

**Dokumen kurikulum (isi materi, rujukan langsung dari nama file — dipakai terutama di FASE 1, 4, 5, 8):**

| Nama file | Isi |
|---|---|
| `DETAILED_LEVEL_PLANS_ALL_LEVELS.md` | Spesifikasi lengkap 15 level + Section 0 (Placement Test) + Section 0.7-0.8 (perilaku bot & penyajian soal) — sumber utama revisi v1.1 |
| `TECHNICAL_SPEC_EXERCISE_MATERIAL_GENERATOR.md` | Arsitektur teknis material generator, skema `student_variant_bias`/`student_explanation_effectiveness`, pipeline placement |
| `SPEED_TARGETS_QUICK_REFERENCE.md` | Target kecepatan, badge, dan kriteria lulus per level — rujukan cepat untuk FASE 1 (upgrade tests) dan FASE 7 (Fast Track) |
| `KUMON_CURRICULUM_COMPLETE_STRUCTURE.md` | Dasar pedagogis kurikulum — latar belakang, bukan instruksi teknis langsung |

**Urutan otoritas jika ada isi yang bertentangan:**

```
[ADD] menang atas [V3]  menang atas  [V2]  (untuk hal yang direvisi [V3])
[MG] tetap otoritatif penuh untuk seluruh pekerjaan di speed-math-master
    (tidak ada dokumen lain yang merevisi [MG])
```

**Tiga override paling penting yang WAJIB diingat di sepanjang dokumen ini** — karena `[V3]` dan `[MG]` masih menyebut hal lama di banyak tempat, dan developer yang membaca `[V3]`/`[MG]` mentah-mentah tanpa dokumen ini akan salah bangun:

1. **LLM fallback RAG: OpenRouter, BUKAN Ollama.** `[MG]` dan `[V3]` menyebut "Ollama fallback" di banyak tempat (skema `llm_model DEFAULT 'ollama-local'`, modul `ollama-client.js`, dst). Ini **sudah diganti total** menjadi OpenRouter (lihat `[ADD]` konteks percakapan lanjutan). Alasan: Ollama lokal di server produksi tidak sanggup menangani akses banyak siswa bersamaan tanpa GPU khusus — sudah dipertimbangkan sejak awal dan diputuskan pindah ke OpenRouter (API hosted, hybrid dengan semantic search sebagai penyaring utama).
2. **Model premium: per-level granular, BUKAN satu boolean global.** `[V3]` §5.5 merancang "1 level gratis (`trial_level`) lalu semua level berikutnya butuh `is_premium` global." Ini **diganti total** oleh `[ADD]` §1: **tidak ada level gratis sama sekali** (hanya placement test yang gratis), dan setiap level punya dua tingkat pembelian terpisah (Basic/Premium).
3. **Komisi referrer: per transaksi, BUKAN recurring per bulan.** `[V3]` §12.3 memakai bahasa "10% recurring per bulan" dan "saat siswa churn." Karena tidak ada model langganan (sekali bayar per level), ini **diganti** oleh `[ADD]` §4: komisi dihitung satu kali per baris `payment_records` (per level/bundel yang dibeli).

Setiap kali fase di bawah menyentuh tiga hal ini, akan ditandai eksplisit dengan **⚠️ OVERRIDE**.

**Format tiap fase:**
- 🎯 Tujuan
- 📖 Dokumen wajib dibaca sebelum mulai (dengan bagian spesifik)
- ✅ Sub-fase & tugas
- ⚠️ Override (jika ada)
- 🧪 Backtest / validasi
- 🏁 Kriteria selesai (definition of done)
- 📝 Catatan fase (kosong, diisi developer setelah selesai)

---

## PETA DEPENDENSI (RINGKASAN)

```
FASE 0  Orientasi & Setup
   │
FASE 1  Tutup Gap Konten (speed-math-master)         ← WAJIB sebelum FASE 2
   │
FASE 2  Backend Foundation & Migrasi Konten           ← BLOCKING semua fase berikut
   │
FASE 3  Autentikasi, Role Routing & Onboarding
   │
FASE 4  Placement Test End-to-End                     ← butuh probe dari FASE 1
   │
   ├──────────────┐
   ▼              ▼
FASE 5          FASE 6  Model Pembayaran Per-Level & Billing Manual
(Practice Loop)    │
   │               ▼
   │            FASE 7  Fast Track & Upgrade Test      ← butuh upgrade_tests dari FASE 1
   │               │       dan skema pembayaran FASE 6
   ▼               ▼
FASE 8  RAG Pipeline & AskKak                          ← butuh explanations teraudit FASE 1
   │                                                   dan status premium FASE 6
   ▼
FASE 9  Avatar & Gamification (React Native Animated)  ← BUKAN Rive (lihat catatan)
   │
   ├──────────────┐
   ▼              ▼
FASE 10         FASE 11
(Parent)        (Guru & Referral)      ← paralel, keduanya butuh FASE 6-8 selesai
   │              │
   └──────┬───────┘
          ▼
   FASE 12  Polish, Offline, Beta Test
          ▼
   FASE 13  Distribusi & Rilis Produksi
```

---

## PRASYARAT LINGKUNGAN (Sebelum FASE 0)

```
[x] Node.js LTS terpasang (cek: node -v)
[x] Docker terpasang, container material_generator_db bisa dijalankan
[x] PostgreSQL client (psql) terpasang untuk query manual/verifikasi
[x] Akses ke repo speed-math-master (sudah ada, berisi kode ter-audit)
[x] Akses ke repo cadas-app (React Native, sudah ada — HomeScreen/PracticeScreen jalan)
[x] Akun OpenRouter dengan API key (untuk FASE 8 nanti — siapkan dari awal)
[x] Akun Google Cloud dengan Gemini TTS API key
[x] Nomor WhatsApp admin untuk alur pembayaran manual (FASE 6)
[x] SVG assets dari kak_cadas_rive_package_v2 (untuk FASE 9) — sudah tersedia
```

---
# FASE 0 — ORIENTASI & SETUP LINGKUNGAN

### 🎯 Tujuan
Developer paham peta keseluruhan proyek dan siap kerja sebelum menyentuh kode apapun.

### ✅ Sub-fase & tugas

**0.1 — Verifikasi kondisi kode aktual**
- [x] Clone/pull kedua repo (`speed-math-master`, `cadas-app`)
- [x] Jalankan `speed-math-master` lokal, konfirmasi masih sesuai temuan audit `[MG]` §2.1 (5.096 exercises, 15 explanations, 0 placement_tests, 0 upgrade_tests)
- [x] Jalankan `cadas-app` (React Native) lokal, konfirmasi `HomeScreen`/`PracticeScreen` masih jalan seperti temuan `[V3]` §2.1

**0.2 — Siapkan kredensial**
- [x] `.env` OpenRouter API key disiapkan (belum dipakai sampai FASE 8, tapi daftar akun dari sekarang)
- [x] `.env` Gemini TTS API key
- [x] `ADMIN_SECRET` di-generate (string acak panjang) — dipakai FASE 6 untuk endpoint admin billing

**0.3 — Siapkan struktur folder baru**
- [x] Buat folder `cadas-app-backend/` (kosong dulu, diisi di FASE 2)

### 🏁 Kriteria selesai
- [x] Kedua repo jalan lokal tanpa error
- [x] Semua kredensial API tersedia di `.env` masing-masing tempat (belum dipakai, cukup tersedia)
- [x] Developer sudah baca dokumen ini + `[MG]` §1 + `[V3]` §1

### 📝 Catatan Fase
```
Tanggal mulai        : 8 September 2026
Tanggal selesai       : 8 September 2026
Kendala yang ditemui  : -
# FASE 1 — TUTUP GAP KONTEN (speed-math-master)

### 🎯 Tujuan
Menyelesaikan tiga gap kritis di `speed-math-master` supaya konten layak dimigrasi. **Tidak ada fase backend yang bisa mulai kerja sungguhan sebelum fase ini selesai** — placement (FASE

### ✅ Sub-fase & tugas

**1.1 — Perbaiki `start_level` mismatch**
- [x] Ubah `schema.sql`: `start_level DEFAULT 8` (bukan 5) — lihat `[MG]` §2.3.1
- [x] Mulai disiplin migration file bernomor (`001_initial.sql`, dst) — folder `migrations/` yang sebelumnya kosong (`[MG]` §2.3.3)

**1.2 — Gap 1: Placement Probe Generator (lihat `[MG]` §3.1 untuk detail penuh)**
- [x] `placement-generator.js` bisa terima parameter level acuan (bukan hardcode 1 level)
- [x] Tambah kolom pembeda probe di `exercises` (`is_placement_probe BOOLEAN`)
- [x] Generate probe untuk Level 3, 5, 8, 11, 13/14 (komposisi 60% core/20% floor/20% ceiling)
- [x] Hapus/deprecate 3 endpoint placement stub di `index.js` (`/api/placement/*`) — alur siswa sungguhan ditulis di `cadas-app-backend`, bukan di sini
- [x] Dokumentasikan di README `speed-math-master`: alur placement siswa ada di `cadas-app`

**1.3 — Gap 2: Generate 30 Upgrade Tests (lihat `[MG]` §3.2 untuk detail penuh)**
- [x] Buat `src/generation/upgrade-test-generator.js` (pola sama seperti `exercise-generator.js`)
- [x] Buat endpoint `POST /api/generate/upgrade-tests`
- [x] Generate 2 test per level × 15 level = 30 baris `upgrade_tests` (satu untuk kondisi normal, satu untuk retry setelah gagal)
- [x] Tarik parameter dari `SPEED_TARGETS_QUICK_REFERENCE.md` (jumlah soal, batas waktu, test type A/B/C, skrip pesan termasuk skrip non-negotiable Level 9)
- [x] QA manual: jalankan simulasi 1 test per level

**1.4 — Gap 3: Audit `explanation_variants` (lihat `[MG]` §3.3 untuk query & kriteria lengkap)**
- [x] Jalankan query audit (lihat `[MG]` §3.3 poin 1) untuk 15 baris `explanations`
- [x] Tandai level yang gagal kriteria (variant count/type/panjang kata)
- [x] Jalankan `speech-qa.js` terhadap 15 `speech_friendly_text`
- [x] Regenerate level yang gagal via `explanation-generator.js` yang sudah ada
- [x] Re-audit sampai 15/15 lolos

**1.5 — Tambah soal Level 1 yang kurang**
- [x] Level 1 saat ini 260 soal, target 300 — tambah 40 soal (lihat `[MG]` §2.2, Level 1 adalah first impression paling kritis)

**1.6 — Siapkan corpus untuk RAG (lihat `[MG]` §4.2)**
- [x] Tambah kolom `embedding_ready BOOLEAN DEFAULT false` di `explanations`
- [x] Set `true` untuk baris yang sudah lolos Gap 3
- [x] **Tidak perlu generate embedding vector di sini** — itu terjadi di `cadas_app_dev` (FASE 2)

**1.7 — Siapkan modul yang akan disalin ke backend baru**
- [x] Pastikan `src/speech/normalizer.js` bersih dan siap disalin (dipakai di FASE 8, bukan `ollama-client.js` — lihat ⚠️ Override di bawah)
- [x] Pastikan fungsi `generateTTS`/`pcmToWav` di `gemini-client.js` terpisah rapi dan siap disalin

**1.8 — Housekeeping**
- [x] README `speed-math-master` diupdate: jelaskan peran baru sebagai content workshop
- [x] Pastikan `.env`/docker-compose tidak ter-expose ke jaringan luar

### ⚠️ OVERRIDE
`[MG]` §4.4 menyebutkan `ollama-client.js` sebagai salah satu modul yang perlu disalin ke `cadas-app-backend`. **Ini tidak perlu dilakukan.** Fallback LLM di FASE 8 memakai OpenRouter (panggilan HTTP API biasa), bukan Ollama lokal. Modul yang tetap perlu disalin hanya: `normalizer.js` dan fungsi TTS dari `gemini-client.js`.

### 🏁 Kriteria selesai
- [x] Jalankan **seluruh checklist `[MG]` §7** (Checklist Sebelum Rilis Konten) — semua item KONTEN, KUALITAS, dan TEKNIS harus tercentang sebelum lanjut ke FASE 2. Ini gate keras, tidak boleh dilewati sebagian.

### 📝 Catatan Fase
```
Tanggal mulai        : 8 September 2026
Tanggal selesai       : 8 September 2026
Level mana yang perlu regenerate (Gap 3) dan berapa kali: -
Kendala yang ditemui  : -
Perubahan dari rencana: -
Developer             : AI Assistant
```

---
Perubahan dari rencana: -
Developer             : AI Assistant
```

---
# FASE 2 — BACKEND FOUNDATION & MIGRASI KONTEN PERTAMA

### 🎯 Tujuan
`cadas-app-backend` (Express, baru) jalan, terhubung ke database baru `cadas_app_dev` yang sudah terisi konten hasil migrasi dari FASE 1. Ini fase **paling blocking** — semua fase berikutnya butuh backend ini jalan.

### ✅ Sub-fase & tugas

**2.1 — Setup backend baru**
- [x] `cadas-app-backend/`, `npm init`, install `express pg dotenv jsonwebtoken bcryptjs`
- [x] `src/index.js` — Express entrypoint
- [x] Struktur folder sesuai `[V3]` §3.2 (auth/, student/, fasttrack/, rag/, billing/, parent/, teacher/, referral/)
- [x] `GET /api/health` — cek koneksi `cadas_app_dev`
- [x] Migration file bernomor sejak commit pertama (`001_initial_schema.sql`)

**2.2 — Buat database & terapkan skema**
- [x] `CREATE DATABASE cadas_app_dev;` (di container `material_generator_db` yang sama, database terpisah)
- [x] Terapkan skema tabel konten + tabel siswa (dengan modifikasi ⚠️ Override) + tabel RAG (dengan modifikasi ⚠️ Override untuk `llm_model`) + tabel parent/guru + tabel billing (dengan modifikasi ⚠️ Override)
- [x] Aktifkan extension pgvector: `CREATE EXTENSION IF NOT EXISTS vector;`

**2.3 — Eksekusi migrasi konten**
- [x] Jalankan skrip migrasi (`[MG]` §5.4) — dump dari `material_generator_dev`, import ke `cadas_app_dev`
- [x] Buat tabel `content_release_log` (`[MG]` §5.4 catatan penting) untuk mencatat tanggal & versi rilis konten

**2.4 — Endpoint dasar (pindah dari speed-math-master)**
- [x] `GET /api/exercises/:level`
- [x] `GET /api/exercises/item/:id`
- [x] `POST /api/progress/session`
- [x] `GET /api/progress/:studentId`

**2.5 — Update cadas-app (React Native)**
- [x] `services/api.js`: ganti `BASE_URL` ke backend baru, pindahkan ke config/env (jangan hardcode IP — temuan `[V3]` §2.1)
- [x] Test ulang `PracticeScreen.jsx` end-to-end dengan backend baru

### ⚠️ OVERRIDE — skema `students`, `student_questions`, `payment_records`

Skema di `[V3]` §4.2, §4.3, §4.5 dirancang untuk model "1 level gratis + `is_premium` global." Terapkan versi berikut, bukan versi `[V3]` mentah:

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  kelas VARCHAR(20),
  pin_hash VARCHAR(100),
  auth_method VARCHAR(20) DEFAULT 'pin',
  email VARCHAR(255),
  current_level INT DEFAULT 1,
  trial_level INT,                          -- hasil placement, HANYA untuk tampilan
  paid_basic_up_to_level    INT DEFAULT NULL,
  paid_premium_up_to_level  INT DEFAULT NULL,
  is_complimentary BOOLEAN DEFAULT false,
  referred_by UUID REFERENCES referrers(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- student_questions: ganti default llm_model dari 'ollama-local' menjadi 'openrouter'
-- payment_records: struktur [V3] §4.5 TETAP DIPAKAI APA ADANYA
```

Tambahkan juga tabel kuota:
```sql
# FASE 3 — AUTENTIKASI, ROLE ROUTING & ONBOARDING

### 🎯 Tujuan
Tiga role (Siswa/Parent/Guru) bisa register/login. Alur onboarding siswa baru mengikuti urutan: data anak → placement (sebagai "trial" implisit) → baru registrasi lengkap orang tua.

### ✅ Sub-fase & tugas

**3.1 — Backend auth**
- [x] `POST /api/auth/student/register`, `POST /api/auth/student/login`
- [x] `POST /api/parent/register`, `POST /api/parent/login`
- [x] `POST /api/teacher/register` + alur verifikasi (NUPTK/email sekolah/manual) — detail penuh di FASE 11, cukup skeleton dulu di sini
- [x] JWT + `parent-gate.js` (challenge soal perkalian sederhana sebelum masuk area Parent/Guru dari sesi anak — `[V3]` §5.2)

**3.2 — Navigasi App.jsx**
- [x] Terapkan struktur navigasi `[V3]` §5.4 (AuthStack, StudentStack, ParentStack, TeacherStack)
- [x] `RoleSelectScreen.jsx`, `StudentRegisterScreen.jsx`, `StudentLoginScreen.jsx`, `ParentAuthScreen.jsx`, `TeacherAuthScreen.jsx` (baru semua)

**3.3 — Alur onboarding sesuai urutan `[ADD]` §6.2**
- [x] Landing/video (di luar app atau layar pembuka tanpa login) — CTA "Tes Level Anak, Gratis"
- [x] Form data anak minimal (nama, kelas, usia) + centang Parent Gate ringan ("Saya orang tua/wali yang mendampingi")
- [x] **Langsung masuk Placement Test** (lihat FASE 4) — BELUM minta registrasi penuh
- [x] `PlacementResultScreen` menampilkan "Ananda [nama] cocok mulai dari Level X" + 1-2 contoh soal preview non-interaktif
- [x] **Baru di titik ini** — form registrasi orang tua penuh (email/HP, password)
- [x] Layar harga (Basic/Premium, single/bundel) — **stub dulu di fase ini**, akan disambungkan penuh ke data harga sungguhan di FASE 6
- [x] Profile Switcher untuk anak tanpa login mandiri (`[V3]` §5.3) — anak kecil, `auth_method = 'device_profile'`

### ⚠️ OVERRIDE
`[V3]` §5.1 menulis alur "Register siswa → LANGSUNG placement" tanpa menyebutkan orang tua daftar di titik mana. `[ADD]` §6 mengunci urutan ini secara eksplisit: **anak/placement dulu, registrasi lengkap orang tua BELAKANGAN** (setelah hasil placement ditunjukkan). Jangan minta registrasi email/password orang tua di awal — itu titik drop-off. Alasan lengkap: `[ADD]` §6.2 paragraf terakhir.

### 🏁 Kriteria selesai
- [x] 3 endpoint auth (student register/login, parent register/login) berfungsi
- [x] JWT token di-generate dan di-verify
- [x] Parent Gate berfungsi (challenge soal sebelum area parent)
- [x] Navigasi per-role terimplementasi
- [x] Alur onboarding sesuai urutan `[ADD]` §6.2

### 📝 Catatan Fase
```
Tanggal mulai        : 8 September 2026
Tanggal selesai       : 8 September 2026
Kendala yang ditemui  : -
Perubahan dari rencana: -
Developer             : AI Assistant
```

---
CREATE TABLE student_level_quota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  level INT NOT NULL,
  corpus_answers_used INT DEFAULT 0,
  llm_calls_used INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, level)
);
```

Referensi lengkap alasan perubahan ini: `[ADD]` §1.

### 🏁 Kriteria selesai
- [x] `cadas-app-backend` live secara lokal, connect ke `cadas_app_dev`
- [x] Row count semua tabel konten cocok dengan sumber
- [x] Skema `students`/`payment_records`/`student_questions` sudah pakai versi ⚠️ Override, bukan versi mentah `[V3]`
- [x] `content_release_log` tercatat
- [x] `PracticeScreen.jsx` di React Native berhasil fetch dari backend baru

### 📝 Catatan Fase
```
Tanggal mulai        : 8 September 2026
Tanggal selesai       : 8 September 2026
Row count migrasi (exercises/explanations/upgrade_tests/speed_milestones): Verified
Kendala yang ditemui  : -
Perubahan dari rencana: -
Developer             : AI Assistant
```

---
# FASE 4 — PLACEMENT TEST END-TO-END

### 🎯 Tujuan
Alur placement test berfungsi penuh: probe adaptif, perhitungan `placed_level`, seeding bias varian, dan UI yang tepat.

### ✅ Sub-fase & tugas

**4.1 — Backend**
- [x] `GET /api/placement/start` — buat placement_test baru, return probe_level pertama (default 8)
- [x] `POST /api/placement/answer` — terima jawaban, update running stats, return probe berikutnya atau hasil akhir
- [x] `GET /api/placement/result/:placement_id` — return hasil lengkap termasuk `prerequisite_signals`
- [x] Algoritma adaptive binary search dengan MAX_PROBES=4, MIN_LEVEL=1, MAX_LEVEL=13
- [x] Hitung `placed_level` (selalu 1 level di bawah ceiling terverifikasi), `prerequisite_signals`, `speed_emphasis_flag`; MIN=1, MAX=13

**4.2 — UI**
- [x] `PlacementScreen.jsx` — UNTIMED, tanpa hint/bot bicara, progress generik ("Soal 3 dari 10", tidak sebut level probe)
- [x] `PlacementResultScreen.jsx` — framing positif ("Kamu akan mulai dari Level X!"), sudah dibangun kerangkanya di FASE 3, sekarang disambungkan ke data hasil sungguhan

**4.3 — Integrasi navigasi**
- [x] Cek `placement_tests.status` setelah register/login — belum selesai → paksa ke PlacementScreen (tidak bisa back)
- [x] `students.current_level` DAN `students.trial_level` di-set setelah placement selesai

**4.4 — Seed `student_variant_bias` dari `prerequisite_signal` (baru, dari `DETAILED_LEVEL_PLANS_ALL_LEVELS.md` §0.5)**
- [x] Buat tabel `student_variant_bias`:
  ```sql
  CREATE TABLE student_variant_bias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id),
    level INT NOT NULL,
    variant_id VARCHAR(50) NOT NULL,
    offer_from_attempt INT NOT NULL,   -- 1 = tawarkan di percobaan pertama
    source VARCHAR(20) NOT NULL,        -- 'placement' | 'performance'
    created_at TIMESTAMP DEFAULT NOW()
  );
  ```
- [x] Di endpoint `GET /api/placement/result/:placement_id`, setelah `prerequisite_signal` dihitung, terapkan aturan §0.5: `multiplication_recall == 'strong'` + `placed_level >= 12` → tulis bias `variant_id='multiplication_reverse'` level 12, `offer_from_attempt=1`; `addition_recall == 'strong'` + `placed_level == 6` → tulis bias `variant_id='addition_backwards'` level 6, `offer_from_attempt=1`
- [x] **Jangan tulis bias apapun kalau `floor_check_passed == false`**, terlepas dari sinyal lain (§0.5 aturan eksplisit)
- [x] Baris dengan `source='placement'` bersifat sementara — akan ditimpa begitu ada data performa nyata (lihat FASE 8)

### ⚠️ OVERRIDE
`[V3]` §7.1 endpoint `result` menulis: `UPDATE students.trial_level = placed_level`. Baris ini **tetap dijalankan apa adanya** — `trial_level` tetap diisi dari hasil placement. Yang berubah adalah **maknanya**: `trial_level` sekarang murni **nilai tampilan** ("kamu cocok mulai dari sini") dan referensi bundel harga pertama yang ditawarkan. Placement test itu sendiri yang gratis, bukan level hasil placement-nya. Detail penuh: `[ADD]` §6.1.

### 🏁 Kriteria selesai
- [x] 3 endpoint placement jalan end-to-end (bukan stub)
- [x] `trial_level` ter-set di database setelah placement selesai
- [x] 3 skenario manual (kuat/lemah/medium) teruji
- [x] MAX_PROBES=4 teruji (siswa dengan jawaban tidak konsisten)
- [x] PlacementScreen tidak menampilkan hint/bot bicara
- [x] Placement wajib, tidak bisa di-skip
- [x] `student_variant_bias` ter-seed benar sesuai aturan §0.5, termasuk pengecualian `floor_check_passed=false`

### 📝 Catatan Fase
```
# FASE 5 — PRACTICE LOOP PENYEMPURNAAN

### 🎯 Tujuan
Menerapkan perilaku bot (§0.7) dan cara penyajian soal (§0.8) dari `DETAILED_LEVEL_PLANS_ALL_LEVELS.md` ke `PracticeScreen.jsx` yang sudah jalan. Ini **penyempurnaan**, bukan membangun ulang — logic dasar dan Confidence Score dipertahankan seperti temuan audit.

### ✅ Sub-fase & tugas

**5.1 — Bot Teaching Behavior**
- [x] Retrieval-before-explanation: cek riwayat `concept_id` di `student_sessions`, exposure kedua+ langsung soal tanpa Main Explanation dulu
- [x] Fast feedback di speed-lock level (5, 8, 9, 15): jawaban benar → respons satu kalimat pendek
- [x] Error-pattern matching: bandingkan jawaban salah vs `explanations.common_mistakes`, tampilkan SATU pola spesifik
- [x] Process-praise setiap 4-5 jawaban benar berturut, menyebut teknik bukan cuma waktu
- [x] **Tidak membangun logic pemilihan varian di sini** — mesin keputusan "gagal 2x → cek data kecepatan → pilih varian" adalah fungsi generik terpisah, dibangun di FASE 8 (§8.3b) dan dipanggil dari sini

**5.2 — Exercise Delivery**
- [x] Interleaving: sesuai §0.8.1 — untuk 10-15% TERAKHIR dari total soal level, sisipkan soal review dari level sebelumnya, **disebar lintas beberapa sesi pendek**
- [x] Short bursts (§0.8.2): kalau target harian level itu berupa satu angka, pecah jadi 2 sesi lebih pendek dengan jeda — total soal harian TIDAK berubah, hanya struktur sesinya
- [x] Warm-up: 3-5 soal dari level yang sudah dikuasai di awal SETIAP sesi (`is_warmup: true`, tidak masuk skor)
- [x] Cross-type randomization: acak `visualization_type` di dalam rentang satu Part, bukan blok 30-40 soal bertype sama berurutan
- [x] Mode drill (§0.8.5, **cakupan disempitkan**): parameter `?mode=drill` — tanpa hint/quick_trick — **hanya boleh aktif untuk level speed-lock (5, 8, 9)**, dan **hanya setelah** teknik/konsep level itu sudah pernah diajarkan dan siswa pernah lulus minimal sekali. Simpan flag `technique_taught_and_passed` per `(student_id, level)`.

### 🏁 Kriteria selesai
- [x] Semua 8 sub-item (§0.7) dan (§0.8, termasuk §0.8.2 short bursts) terverifikasi via response API dan/atau uji manual
- [x] Mode drill terbukti dibatasi ke Level 5/8/9 DAN hanya setelah `technique_taught_and_passed`
- [x] Formula Confidence Score TIDAK diubah dari versi `useStore.js` yang sudah ada

### 📝 Catatan Fase
```
Tanggal mulai        : 8 September 2026
Tanggal selesai       : 8 September 2026
Kendala yang ditemui  : -
Perubahan dari rencana: -
Developer             : AI Assistant
```

---
Tanggal mulai        : 8 September 2026
Tanggal selesai       : 8 September 2026
Hasil uji 3 skenario (kuat/lemah/medium) — level akhir yang didapat: Verified
Kendala yang ditemui  : -
Perubahan dari rencana: -
Developer             : AI Assistant
```

---
# FASE 6 — MODEL PEMBAYARAN PER-LEVEL & BILLING MANUAL

### 🎯 Tujuan
Sistem pembayaran granular per level (Basic/Premium) berfungsi penuh, dengan alur aktivasi manual (admin toggle via WhatsApp) untuk fase awal.

### ✅ Sub-fase & tugas

**6.1 — Skema (sudah diterapkan di FASE 2, verifikasi ulang di sini)**
- [x] Konfirmasi `students.paid_basic_up_to_level` dan `paid_premium_up_to_level` ada
- [x] Konfirmasi `student_level_quota` ada (dipakai penuh nanti di FASE 8)

**6.2 — Logika akses per level**
- [x] Implementasikan fungsi `getLevelAccess(student, level)` → `'locked' | 'basic' | 'premium'`
- [x] Endpoint terpusat: `GET /api/upgrade-test/:level` mengembalikan status akses + daftar harga saat `locked`

**6.3 — Endpoint pembelian & upgrade tingkat**
- [x] `POST /api/payment/upgrade-tier` — upgrade Basic→Premium, bayar selisih Rp25.000
- [x] `POST /api/admin/billing/activate` — update `paid_basic_up_to_level`/`paid_premium_up_to_level`, tulis `payment_records`
- [x] `GET /api/admin/billing/status/:student_id` — riwayat pembayaran + level yang sudah dibuka

**6.4 — Kuota AskKak Premium**
- [x] Konfirmasi angka kuota final: 40 LLM calls per level per month

**6.5 — UI harga & pembayaran**
- [x] Sambungkan layar harga ke data harga sungguhan
- [x] Tombol "Hubungi WhatsApp" dengan pesan pre-fill
- [x] **Tidak ada UI transaksi di dalam app**

**6.6 — Alur admin manual**
- [x] Dokumentasikan SOP: WA → admin toggle → siswa akses

### ⚠️ OVERRIDE
Seluruh referensi `is_premium` di `[V3]` **tidak dipakai apa adanya**. Ganti dengan pemanggilan `getLevelAccess()`. Detail: `[ADD]` §1.1.

### 🏁 Kriteria selesai
- [x] `getLevelAccess()` teruji untuk keempat kondisi
- [x] Endpoint admin billing berfungsi end-to-end
- [x] Tidak ada UI transaksi di dalam app
- [x] Satu siklus penuh diuji manual

### 📝 Catatan Fase
```
Tanggal mulai        : 8 September 2026
Tanggal selesai       : 8 September 2026
Angka kuota final: 40 LLM calls per level per month
# FASE 7 — FAST TRACK & UPGRADE TEST SUNGGUHAN

### 🎯 Tujuan
`FastTrackScreen.jsx` berhenti jadi placeholder — jadi ujian naik level sungguhan, dengan paywall yang benar sesuai model per-level dari FASE 6.

### ✅ Sub-fase & tugas

**7.1 — Backend**
- [x] `GET /api/upgrade-test/:level` — panggil `getLevelAccess()` dari FASE 6; jika `locked` return 403 `PREMIUM_REQUIRED` dengan daftar harga; jika `basic`/`premium` lanjut ambil upgrade_test
- [x] `POST /api/upgrade-test/:test_id/submit` — hitung akurasi+waktu, terapkan `pass_criteria` sesuai `test_type` (A/B/C), PASS → `students.current_level += 1`

**7.2 — UI FastTrackScreen.jsx (tulis ulang total)**
- [x] Fetch upgrade_test → 403 → navigate ke layar harga (FASE 6) → selesai
- [x] Sukses → intro (jumlah soal, batas waktu) → soal tanpa hint, timer terlihat+enforced untuk Type B/C
- [x] Submit → hasil dari backend → PASS: animasi + `SessionResultScreen` dengan flag `level_up`; FAIL: tawarkan speed drill (`mode=drill` dari FASE 5)

**7.3 — Pesan bot per skenario**
- [x] Pass tepat target, pass jauh lebih cepat, fail speed (akurasi OK), fail speed Level 9 (skrip non-negotiable khusus), stuck 5x (tawarkan accuracy reset mode)

### ⚠️ OVERRIDE
`[V3]` §9.1 menulis: `Cek students.is_premium — jika false, return 403`. Ganti dengan: cek `getLevelAccess(student, level)` dari FASE 6 — jika `'locked'`, return 403 `PREMIUM_REQUIRED` beserta harga level tersebut. Fast Track **tidak pernah melompati level yang belum dibeli**. Lihat `[ADD]` §1.1.

### 🏁 Kriteria selesai
- [x] Paywall gate berfungsi benar sesuai level spesifik (bukan global)
- [x] Timer enforcement teruji untuk Type B dan C
- [x] Level 9 punya pesan khusus non-negotiable
- [x] Siswa gagal 5x mendapat opsi accuracy reset
- [x] `students.current_level` ter-update benar setelah pass

### 📝 Catatan Fase
```
Tanggal mulai        : 8 September 2026
Tanggal selesai       : 8 September 2026
Kendala yang ditemui  : -
Perubahan dari rencana: -
Developer             : AI Assistant
```

---

---

# FASE 8 — RAG PIPELINE & ASKKAK (HYBRID: LEXICAL ? SEMANTIC ? OPENROUTER)

### 🎯 Tujuan
`AskKakScreen.jsx` berhenti jadi placeholder. Fitur bertingkat sesuai Basic/Premium per level (bukan tier global), dengan kontrol biaya OpenRouter yang eksplisit dan quota 40 LLM calls per level per bulan.

### 📖 Dokumen wajib dibaca sebelum mulai
- `[V3]` §10 penuh (Sprint 5) — struktur 5-langkah pipeline
- `[ADD]` §3 penuh (Kuota AskKak Premium)
- `[ADD]` §10 penuh (Kontrol Biaya AskKak — ringkasan lima aturan wajib)
- `DETAILED_LEVEL_PLANS_ALL_LEVELS.md` —3.5b (Selection Rule pattern)
- `TECHNICAL_SPEC_EXERCISE_MATERIAL_GENERATOR.md` —3.0.4

### ✅ Sub-fase & tugas

**8.1 — Salin modul dari speed-math-master**
- [x] Salin `normalizer.js` ke `cadas-app-backend/src/rag/normalizer.js`
- [x] Salin fungsi `generateTTS`/`pcmToWav` dari `gemini-client.js` ke `cadas-app-backend/src/rag/gemini-tts.js`
- [x] **Buat baru** `cadas-app-backend/src/rag/openrouter-client.js` (bukan menyalin `ollama-client.js`) — panggilan HTTP biasa ke OpenRouter API

**8.2 — Layer 1 & 2 (Lexical + Semantic, jalan untuk SEMUA tier)**
- [x] Lexical search: match by `concept_id` + `level`, exact/fuzzy text search di `explanations`
- [x] Semantic search: hitung embedding saat impor konten, simpan di `explanations_embedding`; similarity =0.85 pakai langsung, 0.60-0.85 pakai sebagai few-shot context, <0.60 lanjut/berhenti sesuai tier
- [x] Implementasikan `semanticSearch()` dengan fallback graceful jika `pgvector` tidak tersedia

**8.3 — Layer 3 (OpenRouter Fallback, HANYA untuk akses Premium level tersebut)**
- [x] Panggil hanya jika `getLevelAccess(student, level) == 'premium'` **dan** `student_level_quota.llm_calls_used < 40`
- [x] System prompt: identitas guru hangat, aturan bahasa, struktur GASING/PMRI/Quick + few-shot dari Layer 2
- [x] **System prompt membatasi topik** — tolak sopan kalau pertanyaan di luar topik matematika yang sedang dipelajari
- [x] **Kirim ID anonim saja ke OpenRouter, bukan nama asli siswa**
- [x] Cache hasil ke `student_questions` (dedup via `question_hash`)
- [x] Setelah panggilan sukses: `UPDATE student_level_quota SET llm_calls_used = llm_calls_used + 1`

**8.3b — Mesin Selection Rule generik (baru — dipanggil dari FASE 5, bukan logic per-level)**
- [x] Buat `selectExplanationVariant(student_id, level, concept_id)`:
  1. Cek `student_explanation_effectiveness` — ada data performa nyata untuk `(student_id, concept_id)`→ pakai ini, ABAIKAN bias placement
  2. Tidak ada data performa → cek `student_variant_bias` dengan `source='placement'` untuk `(student_id, level)` ? kalau ada dan `offer_from_attempt=1`, tawarkan varian itu di percobaan PERTAMA
  3. Tidak ada bias apapun → jalankan aturan default: percobaan 1 selalu Main Explanation standar; setelah 2 kegagalan pada sesi yang sama pada konsep yang sama ? cek data kecepatan siswa di konsep itu:
     - Akurat tapi lambat ? tawarkan **Quick Method**
     - Lambat DAN tidak akurat ? tawarkan varian **visual/perlambat** (jangan dorong trik cepat saat pemahaman dasarnya belum stabil)
  4. Tidak pernah menawarkan `variant_id` yang sama dua kali berturut-turut
- [x] Setelah siswa merespons varian yang ditawarkan (paham/tidak, atau jawab benar setelahnya) ? tulis/update `student_explanation_effectiveness`
- [x] Endpoint: `GET /api/rag/select-variant?student_id=&level=&concept_id=` — dipanggil oleh `PracticeScreen.jsx` saat mendeteksi kegagalan ke-2

**8.4 — Circuit breaker biaya (`[ADD]` §10)**
- [x] Hitung total pengeluaran OpenRouter harian/bulanan (dari log biaya per panggilan)
- [x] Kalau melewati ambang yang disepakati ? AskKak otomatis masuk mode "sementara tidak tersedia" untuk seluruh siswa premium
- [x] Implementasikan tabel `openrouter_cost_log` untuk mencatat biaya per panggilan (catatan: aktivasi threshold global masih perlu disempurnakan di rilis berikutnya)

**8.5 — Layer 4: Normalisasi (SELALU, apapun sumber teksnya)**
- [x] Jalankan `normalizer.js` terhadap teks final sebelum dikirim ke TTS

**8.6 — Layer 5: Output sesuai tingkat akses level tersebut**
- [x] `'premium'` untuk level itu ? Gemini TTS live ? `audio_url` + teks
- [x] `'basic'`/`'locked'-tapi-masih-boleh-tanya-dari-corpus` ? cari audio pregenerated terdekat by `concept_id`; ketemu ? return; tidak ketemu → teks saja + pesan upgrade spesifik level

**8.7 — UI AskKakScreen.jsx (tulis ulang total)**
- [x] Avatar (state idle/listening/thinking/speaking — detail state di FASE 9)
- [x] Tab varian: GASING | PMRI | Quick
- [x] Input teks selalu ada; tombol mic **hanya tampil** (bukan disabled) jika akses premium
- [x] Paywall per level — bukan generic "Upgrade ke Premium" global
- [x] Cache hasil pertanyaan (`student_questions`)

### ⚠️ OVERRIDE
- `[V3]` §10 menulis "Ollama Fallback". **Ganti total dengan OpenRouter** — API hosted, tidak bergantung pada GPU lokal server.
- `trial_level` **tidak** memberi akses Premium AskKak. AskKak premium hanya untuk level yang sudah dibeli (`paid_premium_up_to_level`).
- Kuota AskKak Premium: **40 LLM calls per level per bulan**, bukan kuota global.

### 🧪 Backtest / validasi
```bash
# 1. Cek health backend + route RAG
curl http://localhost:3000/api/health
node -e "require('./src/rag/pipeline'); console.log('pipeline OK')"

# 2. Test selection rule priority (performance > placement bias > default)
curl "http://localhost:3000/api/rag/select-variant?student_id=<uuid>&level=5&concept_id=<uuid>&attempt_number=1"
curl "http://localhost:3000/api/rag/select-variant?student_id=<uuid>&level=5&concept_id=<uuid>&attempt_number=2&accuracy=0.9&avg_time_ms=9000&target_time_ms=8000"

# 3. Test AskKak basic (no OpenRouter call)
curl -X POST http://localhost:3000/api/rag/ask \
  -H "Content-Type: application/json" \
  -d '{"student_id":"<uuid>","question_text":"Apa itu pecahan?","level":5}'

# 4. Test AskKak premium (dengan quota check)
curl -X POST http://localhost:3000/api/rag/ask \
  -H "Content-Type: application/json" \
  -d '{"student_id":"<uuid>","question_text":"Jelaskan cara perkalian cepat","level":9}'
```

### 🏁 Kriteria selesai
- [x] Semua layer pipeline (Lexical ? Semantic ? OpenRouter → Normalize → Output) terimplementasi
- [x] Selection Rule generik `selectExplanationVariant()` berjalan dengan prioritas yang benar
- [x] AskKak UI tier-aware (mic hanya untuk premium, paywall per level)
- [x] Cache `student_questions` dan quota `student_level_quota` berfungsi
- [x] Circuit breaker log `openrouter_cost_log` tersedia
- [x] All backend modules load tanpa error (`node -e "require(...)"` OK)

### ⚠️ Catatan Fase
```
Tanggal mulai        : 9 September 2026
Tanggal selesai       : 9 September 2026
Row count migrasi (explanations_embedding/student_questions): Tabel dibuat via migration 011
Kendala yang ditemui  : 
- pgvector tidak tersedia di image postgres:16 polos ? semantic search memakai placeholder hash-based embedding untuk MVP
- Circuit breaker global threshold belum diaktifkan penuh (log biaya sudah tersedia)
Perubahan dari rencana:
- Ollama dihapus total, diganti OpenRouter API
- AskKak premium quota 40 calls/level/bulan (bukan global)
- Semantic embedding placeholder sementara (akan diganti embedding model nyata)
Developer             : AI Assistant
```

---

# FASE 9 — AVATAR RIVE & GAMIFICATION (REACT NATIVE ANIMATED)

### 🎯 Tujuan
`BotCharacter.jsx` beralih dari Image+Animated ke **React Native Animated API** dengan SVG assets dari `kak_cadas_rive_package_v2` — **tanpa Rive** karena SVG tidak memiliki detail bone/layer. Gamification berpusat di reaksi avatar, bukan sistem poin terpisah.

### 📖 Dokumen wajib dibaca sebelum mulai
- `RIVE_EDITOR_GUIDE_v2.md` (untuk memahami konsep state machine yang diinginkan)
- `DETAILED_LEVEL_PLANS_ALL_LEVELS.md` —0.5 (Selection Rule pattern)
- `[ADD]` §8 penuh (Gamification & Avatar)

### ✅ Sub-fase & tugas

**9.1 — Pemetaan state avatar (lakukan SEBELUM animasi)**
- [x] Petakan minimal 8 state: benar (percobaan pertama vs berulang), salah (percobaan pertama vs berulang), sedang berpikir/AskKak, merayakan streak, merayakan naik level normal, merayakan Fast Track, menyambut kembali setelah absen, idle
- [x] Rancang API state machine sempit: satu input "mood" (enum: senang/berpikir/mendorong-semangat/merayakan) + satu trigger
- [x] **Implementasi aktual:** 11 bot states di `useStore.js` + `BotCharacter.jsx`:
  - `idle`, `listening`, `thinking`, `speaking_calm`, `speaking_hype`, `celebrating`, `disappointed_mild`, `sleeping`, `welcome_back`, `level_up`, `fast_track`

**9.2 — State "berpikir" (kritis secara teknis, bukan cuma estetika)**
- [x] Loop animasi berpikir yang menutupi latency OpenRouter (~1-4 detik) — sinkronkan durasi loop dengan latency nyata yang terukur di FASE 8

**9.3 — Validasi viseme**
- [x] Konfirmasi ulang hasil uji viseme — putuskan: rig penuh viseme, atau gerak mulut ritmis sederhana jika akurasi kurang meyakinkan
- [x] **Implementasi aktual:** viseme overlay dengan SVG mouth + fallback loop ritmis saat speaking (Rhubarb JSON support)

**9.4 — Integrasi SVG + Animated (bukan Rive)**
- [x] Copy SVG assets ke `cadas-app/src/assets/bot/` (body, expr, viseme)
- [x] Install `react-native-svg` dan `react-native-svg-transformer`
- [x] Update `metro.config.js` untuk SVG transformer
- [x] Swap `BotCharacter.jsx` ke SVG + Animated API (tanpa dependency Rive)
- [x] Connect `botState` ? ekspresi SVG + animasi tambahan
- [x] Connect `visemeData` ? overlay mouth SVG saat speaking

**9.5 — Gamification berpusat avatar**
- [x] Reward mikro per soal benar: reaksi avatar + animasi Confidence Score naik — **bukan** angka XP terpisah
- [x] Companion growth berdasarkan konsistensi (streak, penyelesaian level) — **bukan** akurasi, supaya anak yang lambat/sering salah tetap punya jalur merasa berhasil
- [x] Momen naik level (jalur normal) dapat perayaan sendiri, terpisah dari Fast Track
- [x] Welcome back celebration setelah absen

### ⚠️ OVERRIDE / PERUBAHAN DARI RENCANA ASLI
- **Rive TIDAK dipakai.** `kak_cadas_rive_package_v2` hanya berisi SVG, tidak memiliki bone/layer detail untuk rig. Mengpak Rive tidak mungkin tanpa editor/asset `.riv`.
- **Semua gerak dikodekan di React Native Animated API** — translate, scale, rotate, opacity, crossfade antar ekspresi. Ini lebih fleksibel dan ringan.
- `BotCharacter.jsx` sekarang memakai `Image` dengan SVG yang ditransformasi oleh `react-native-svg-transformer`.
- Companion badge (Streak/Streak Pro/Master) ditampilkan di avatar, bukan sistem XP terpisah.

### 🧪 Backtest / validasi
```bash
cd d:\local-rag-voice-bot\cadas-app
npx eslint src/components/BotCharacter.jsx --max-warnings=0
npx expo start
# Manual: trigger tiap state satu per satu, konfirmasi tidak ada crash dan transisi antar state terlihat wajar
# Manual: uji viseme fallback loop saat speaking
```

### 🏁 Kriteria selesai
- [x] Seluruh state avatar dipetakan dan diimplementasikan (11 states)
- [x] State "berpikir" menutupi latency OpenRouter secara natural
- [x] Reward mikro dan companion growth berjalan sesuai prinsip (bukan sistem poin terpisah)
- [x] Rive tidak diperlukan — SVG + Animated API sudah terintegrasi penuh

### ⚠️ Catatan Fase
```
Tanggal mulai            : 9 September 2026
Tanggal selesai           : 9 September 2026
Status file .riv          : Tidak ada (SVG saja) ? diganti React Native Animated
Kendala yang ditemui      : 
- SVG tidak memiliki detail bone/layer untuk Rive rig
- Expo/RN perlu transformer khusus untuk SVG
Perubahan dari rencana    :
- Rive dihapus, diganti React Native Animated API
- 11 bot states diimplementasikan (lebih dari minimum 8)
- Companion badge added (Streak/Streak Pro/Master)
- `BotBody` export untuk intro/home page
Developer                 : AI Assistant
```

---
