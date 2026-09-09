# Cadas Matematika (cadas-app) — Development Plan v3.0
## Roadmap Lengkap: Backend Baru, 3 Role (Siswa/Parent/Guru), Placement, RAG, Fast Track, Billing

**Tanggal:** September 2026
**Status:** v3.0 — menggantikan PLAN_DEV_v2.md, menambahkan keputusan final model freemium,
strategi distribusi & pembayaran, revenue-share guru, dan logika paywall berbasis level.
**Perubahan dari v2:** Tiga keputusan baru masuk ke skema dan sprint — freemium berbasis level
(bukan waktu), distribusi APK langsung tanpa toko aplikasi, revenue-share eksklusif untuk
guru les/tutor privat (bukan guru sekolah).

---

# DAFTAR ISI

1. Ringkasan Perubahan dari v1 & v2
2. Temuan Audit Kode Aktual (Kondisi Riil per September 2026)
3. Arsitektur Backend Baru
4. Skema Database `cadas_app_dev`
5. Sistem Autentikasi, Role Routing & Freemium
6. Sprint 1 — Backend Foundation & Migrasi Konten
7. Sprint 2 — Placement Test End-to-End
8. Sprint 3 — Practice Loop Penyempurnaan (Section 0.7/0.8)
9. Sprint 4 — Fast Track & Upgrade Test Sungguhan
10. Sprint 5 — RAG Pipeline & AskKak (Tier-Aware)
11. Sprint 6 — Parent Dashboard & Billing Manual
12. Sprint 7 — Guru Dashboard & Referral System
13. Sprint 8 — Polish, Offline, Beta Test
14. Dependency Map & Urutan Eksekusi
15. Checklist Sebelum Beta Test

---

# 1. RINGKASAN PERUBAHAN DARI v1 & v2

## Perubahan dari v1 (tetap berlaku, dipertahankan dari v2)

| # | Perubahan | Alasan |
|---|---|---|
| 1 | cadas-app dapat **backend Express sendiri** + database `cadas_app_dev` | Isolasi production dari alat dev lokal |
| 2 | Scope MVP: **3 role (Siswa/Parent/Guru)** | Keputusan eksplisit |
| 3 | Auth sistem penuh (role detection, Parent Gate, profile-switcher, verifikasi guru) | Konsekuensi dari #2 |
| 4 | **Placement test wajib di awal**, bukan opsional | Siswa belajar dari yang belum bisa, diukur presisi + kecepatan |
| 5 | RAG: Lexical → Semantic (pgvector) → Ollama fallback → Gemini TTS premium | Arsitektur final |
| 6 | FastTrackScreen & AskKakScreen: dari placeholder → fitur penuh | Ditemukan saat audit: kosong total |
| 7 | Confidence Score sudah matang di `useStore.js` — dipertahankan | Tidak dirancang ulang dari nol |
| 8 | Bot behavior §0.7-0.8 diintegrasikan ke PracticeScreen | Penyempurnaan, bukan bangun ulang |
| 9 | Variant naming disatukan: `gasing` \| `pmri` \| `quick` | Sesuai USER_APP_COMPLETE_DESIGN_v2 §4.1 |

## Perubahan baru di v3

| # | Perubahan | Alasan |
|---|---|---|
| 10 | **Freemium berbasis level, bukan waktu** — siswa dapat 1 level gratis di placed_level; upgrade test = paywall gate | Siswa rajin bisa selesai semua level dalam 14 hari — gerbang waktu tidak efektif |
| 11 | **Distribusi APK langsung, bukan Play Store/App Store** — pembayaran via Midtrans/Xendit; fase MVP: manual (WhatsApp + admin toggle) | Hindari potongan 15–30% toko, dan Play Billing memblokir revenue-share guru lintas transaksi |
| 12 | **Revenue-share eksklusif untuk guru les/tutor privat** — guru sekolah dapat fitur classroom gratis, bukan komisi langsung dari siswanya | Konflik kepentingan jika guru institusional dapat komisi dari siswa di bawah kewenangannya |
| 13 | `students` table: tambah `trial_level`, `premium_activated_at`, `referred_by` | Mendukung logika paywall dan tracking referral per siswa |
| 14 | `referrers` table: tipe dipisah `teacher_private` \| `teacher_school` \| `affiliate` \| `other`; tambah `commission_model` dan `commission_rate` | teacher_school = 0% komisi, teacher_private/affiliate = komisi berulang |
| 15 | Tabel baru `payment_records` — catatan pembayaran manual fase MVP | Tracking siapa bayar kapan, meski tanpa gateway otomatis |
| 16 | `students.is_complimentary` — siswa guru/beta tester dapat akses premium penuh tanpa bayar | Siswa guru sendiri dipakai untuk uji sistem; tidak adil dikenakan paywall |
| 17 | `referrers.type` tambah nilai `parent` — orang tua siswa bisa jadi mitra | Orang tua di sekolah guru adalah kanal marketing organik paling natural |
| 18 | Sistem tier komisi berbasis performa pribadi (Model B): Mitra → Andalan → Utama | Marketing menyebar luas tanpa kompleksitas MLM; komisi hanya dari konversi sendiri |

---

# 2. TEMUAN AUDIT KODE AKTUAL

## 2.1 Status per File (cadas-app/src)

| File | Status | Catatan |
|---|---|---|
| `App.jsx` (asumsi ada, belum dicek) | — | Perlu dicek navigasi stack saat ini |
| `services/api.js` | ✅ Jalan | Base URL hardcoded IP lokal — perlu dipindah ke `.env`/config |
| `store/useStore.js` | ✅ Jalan penuh | **Confidence Score sudah terimplementasi matang**, botState granular 8 nilai, visemeData |
| `store/useStore.js.bak` | — | File backup lama, evaluasi apakah masih perlu |
| `components/BotCharacter.jsx` | ✅ Ada (Image+Animated, belum Rive) | `.jsx.bak` juga ada |
| `components/HintPanel.jsx` | ✅ Ada | Perlu dicek variant naming `gasing/pmri/quick` |
| `components/StreakBar.jsx` | ✅ Ada | |
| `screens/HomeScreen.jsx` | ✅ Jalan penuh | Level card, confidence bar, Fast Track banner, XP |
| `screens/PracticeScreen.jsx` | ✅ Jalan penuh | WebView, adaptive hint 3-level, idle detection, bot state, TTS |
| `screens/FastTrackScreen.jsx` | ❌ **Placeholder literal** | `<Text>Fast Track — Coming Soon</Text>` |
| `screens/AskKakScreen.jsx` | ❌ **Placeholder literal** | `<Text>Tanya Kak — Coming Soon</Text>` |
| `screens/SessionResultScreen.jsx` | Belum dicek | |
| `screens/SettingsScreen.jsx` | Belum dicek | |
| Placement flow | ❌ **Tidak ada sama sekali** | `currentLevel` default ke 1, tidak ada placement |
| Auth/role screens | ❌ **Tidak ada sama sekali** | Tidak ada login, register, role detection, Parent Gate |

## 2.2 Data yang Sudah Solid (JANGAN diubah tanpa alasan kuat)

### Formula Confidence Score (dari `useStore.js`)

```js
getConfidenceScore: () => {
  const results = get().sessionResults.slice(-20);   // rolling 20 soal terakhir
  if (results.length < 5) return 0;

  const accuracy = results.filter((r) => r.correct).length / results.length;

  const TARGET_MS = { /* per level, sesuai SPEED_TARGETS_QUICK_REFERENCE */ };
  const avgTime = /* rata-rata waktu jawaban benar */;
  const speedScore = Math.min(1, TARGET_MS / avgTime);

  const variance = /* standar deviasi waktu jawaban */;
  const consistency = Math.max(0, 1 - variance / avgTime);

  return accuracy * 0.40 + speedScore * 0.35 + consistency * 0.25;
}
```

Threshold Fast Track: `confidence > 0.85`, dicek setelah minimal 5 hasil.

### Adaptive Hint 3-Level (dari `PracticeScreen.jsx`, sudah jalan)

```
Salah ke-1 (mode terbimbing/intensif) → hint teks saja
Salah ke-2                             → audio hint (TTS on-demand)
Salah ke-3+                            → penjelasan penuh (quick_trick via TTS)

Threshold beda per botMode:
  intensif   → selalu bicara dari salah ke-1
  terbimbing → bicara mulai salah ke-1
  mandiri    → baru bicara di salah ke-3
```

## 2.3 Yang Perlu Dicek Lebih Lanjut (Belum Diaudit)

- Isi `HintPanel.jsx`, `SettingsScreen.jsx`, `SessionResultScreen.jsx`, `App.jsx`
- Apakah `BotCharacter.jsx.bak` dan `useStore.js.bak` masih relevan atau aman dihapus

---

# 3. ARSITEKTUR BACKEND BARU

## 3.1 Keputusan Final

```
material_generator_db (1 container Postgres, port 5432)
├─ database: material_generator_dev   ← speed-math-master (lokal, tidak berubah)
└─ database: cadas_app_dev            ← BARU

cadas-app-backend (Express, BARU)
├─ Connect HANYA ke cadas_app_dev
├─ Tidak pernah panggil API speed-math-master di production
├─ Menangani: auth, role routing, placement, progress, fast track/upgrade test,
│  RAG live, parent dashboard, guru dashboard, billing (manual fase MVP)
└─ Live deploy ke production (AWS EC2 atau setara — detail di Sprint 8)
```

## 3.2 Struktur Folder yang Disarankan

```
cadas-app-backend/
├─ src/
│  ├─ index.js
│  ├─ config/
│  ├─ database/
│  │  ├─ connection.js
│  │  └─ migrations/              — bernomor sejak awal
│  ├─ auth/
│  │  ├─ auth-controller.js
│  │  ├─ jwt.js
│  │  └─ parent-gate.js
│  ├─ student/
│  │  ├─ student-controller.js
│  │  └─ placement-controller.js
│  ├─ fasttrack/
│  │  └─ upgrade-test-controller.js
│  ├─ rag/
│  │  ├─ lexical-search.js
│  │  ├─ semantic-search.js
│  │  ├─ ollama-client.js
│  │  ├─ gemini-tts.js
│  │  ├─ normalizer.js
│  │  └─ rag-controller.js
│  ├─ billing/
│  │  └─ billing-controller.js    — BARU: toggle is_premium, cek status, catat payment
│  ├─ parent/
│  │  └─ parent-controller.js
│  ├─ teacher/
│  │  └─ teacher-controller.js
│  └─ referral/
│     └─ referral-controller.js
└─ package.json
```

---

# 4. SKEMA DATABASE `cadas_app_dev`

## 4.1 Tabel Konten (Diimpor dari speed-math-master)

```sql
-- Struktur identik dengan speed-math-master, data diimpor saat migrasi
exercises        (termasuk placement probe, kolom is_placement_probe)
explanations     (hanya yang embedding_ready = true)
upgrade_tests
speed_milestones
```

## 4.2 Tabel Aplikasi — Siswa

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  kelas VARCHAR(20),
  pin_hash VARCHAR(100),
  auth_method VARCHAR(20) DEFAULT 'pin',   -- 'pin' | 'device_profile'
  email VARCHAR(255),
  current_level INT DEFAULT 1,

  -- Trial & Premium
  trial_level INT,                          -- BARU: set = placed_level setelah placement
                                            -- selesai. Ini satu-satunya level yang bisa
                                            -- diakses penuh tanpa bayar.
                                            -- NULL = placement belum selesai.
  is_premium BOOLEAN DEFAULT false,
  premium_activated_at TIMESTAMP,           -- BARU: kapan is_premium di-set true

  -- Referral
  referred_by UUID REFERENCES referrers(id), -- BARU: NULL jika tidak ada referrer

  created_at TIMESTAMP DEFAULT NOW()
);

-- Logika akses dari skema ini:
--   trial_level IS NULL               → placement belum selesai, akses terbatas
--   current_level <= trial_level
--     AND NOT is_premium              → bisa latihan di level ini, TIDAK bisa upgrade
--   is_premium = true                 → akses penuh semua level + AskKak premium

CREATE TABLE student_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  level INT NOT NULL CHECK (level >= 1 AND level <= 15),
  total_problems INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  avg_time_ms NUMERIC(10,2),
  confidence_score NUMERIC(5,2),
  fast_track_triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE placement_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  start_level INT DEFAULT 8,             -- FIXED: sesuai DETAILED_LEVEL_PLANS §0.2
  current_probe_level INT,
  probes JSONB,
  results JSONB,
  placed_level INT,
  verified_ceiling_level INT,
  floor_check_passed BOOLEAN,
  speed_emphasis_flag VARCHAR(10),       -- 'low'|'medium'|'high'
  prerequisite_signals JSONB,
  status VARCHAR(20) DEFAULT 'in_progress',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE placement_probe_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_test_id UUID REFERENCES placement_tests(id),
  level INT NOT NULL,
  probe_type VARCHAR(20),
  skill_area VARCHAR(50),
  problem_id VARCHAR(100) NOT NULL,
  student_answer VARCHAR(100),
  correct BOOLEAN NOT NULL,
  time_taken_ms INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE student_explanation_effectiveness_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  concept_id VARCHAR(100) NOT NULL,
  explanation_variant_id VARCHAR(50),
  attempt_number INT,
  effectiveness_score NUMERIC(3,2),
  next_action VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE student_explanation_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  preferred_style_1 VARCHAR(50),
  preferred_style_2 VARCHAR(50),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

## 4.3 Tabel Aplikasi — RAG Live

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE explanations_embedding (
  explanation_id VARCHAR(100) REFERENCES explanations(id),
  embedding vector(768),
  computed_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (explanation_id)
);

CREATE TABLE student_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  question_hash VARCHAR(64) NOT NULL,
  student_id UUID REFERENCES students(id),
  concept_id VARCHAR(100),
  level INT,
  llm_generated_answer TEXT,
  llm_model VARCHAR(100) DEFAULT 'ollama-local',
  llm_latency_ms INT,
  tts_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(question_hash, concept_id, level)
);
```

## 4.4 Tabel Aplikasi — Parent & Guru

```sql
CREATE TABLE parents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE student_parent_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES parents(id),
  student_id UUID REFERENCES students(id),
  linked_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(parent_id, student_id)
);

CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  teacher_type VARCHAR(20) NOT NULL,        -- BARU: 'school'|'private'
                                            -- school = guru sekolah, dapat classroom gratis, 0% komisi
                                            -- private = tutor privat/guru les, dapat komisi
  verification_status VARCHAR(20) DEFAULT 'pending',
  verification_method VARCHAR(20),          -- 'nuptk'|'school_email'|'manual'
  nuptk VARCHAR(50),
  school_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  invite_code VARCHAR(20) UNIQUE NOT NULL,
  school_year VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE classroom_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES classrooms(id),
  student_id UUID REFERENCES students(id),
  parent_consent_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP,
  UNIQUE(classroom_id, student_id)
);

CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES classrooms(id),
  level_or_topic VARCHAR(100) NOT NULL,
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE teacher_parent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES classrooms(id),
  student_id UUID REFERENCES students(id),
  message TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE referrers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL,                -- DIPERBARUI: 'teacher_private' | 'teacher_school'
                                            -- | 'affiliate' | 'other'
                                            --
                                            -- teacher_school: guru institusional, TIDAK dapat
                                            --   komisi dari siswanya sendiri. Nilai mereka =
                                            --   fitur classroom gratis. Tabel ini dibuat
                                            --   hanya untuk tracking referral ke luar kelasnya.
                                            --
                                            -- teacher_private: tutor privat/guru les, dapat
                                            --   komisi penuh — tidak ada konflik kepentingan
                                            --   karena tidak punya otoritas institusional.
  reference_id UUID,                        -- teachers.id atau NULL untuk affiliate/other
  code VARCHAR(20) UNIQUE NOT NULL,
  commission_model VARCHAR(30),             -- BARU: NULL untuk teacher_school
                                            -- 'recurring_percentage' untuk teacher_private
                                            -- 'one_time_bonus' untuk affiliate/other
  commission_rate NUMERIC(5,2),             -- BARU: 0.00 untuk teacher_school,
                                            -- misal 10.00 untuk 10% recurring (teacher_private)
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE referral_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES referrers(id),
  student_id UUID REFERENCES students(id),
  converted_at TIMESTAMP DEFAULT NOW()
);
```

## 4.5 Tabel Billing (BARU)

```sql
-- ---------------------------------------------------------------
-- Catatan arsitektur: Fase MVP menggunakan model MANUAL.
-- Tidak ada payment gateway terintegrasi di fase ini.
-- Alur:
--   1. Orang tua transfer QRIS/bank, kirim bukti via WhatsApp
--   2. Admin catat di payment_records
--   3. Admin toggle students.is_premium = true via endpoint admin
--   4. students.premium_activated_at ter-set otomatis oleh trigger/endpoint
--
-- Payment gateway (Midtrans/Xendit) diintegrasikan di sprint terpisah
-- setelah ada traksi pembayaran yang konsisten (fase 2).
-- ---------------------------------------------------------------

CREATE TABLE payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE RESTRICT,
  amount_idr INT NOT NULL,
  payment_method VARCHAR(50) NOT NULL,   -- 'manual_transfer' | 'qris_manual' | 'midtrans' (nanti)
  payment_proof_note TEXT,               -- catatan admin, misal: "Transfer BCA 14/9 pk 14.22"
  activated_by VARCHAR(100) NOT NULL,    -- username/nama admin yang toggle
  referrer_id UUID REFERENCES referrers(id),  -- jika ada, untuk hitung komisi
  commission_amount_idr INT,             -- komisi yang harus dibayar ke referrer (dihitung saat insert)
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

# 5. SISTEM AUTENTIKASI, ROLE ROUTING & FREEMIUM

## 5.1 Alur Login/Register

```
Splash Screen
    │
    ▼
Apakah ada sesi tersimpan (AsyncStorage token)?
    │
    ├─ YA → validasi token ke backend → route sesuai role
    │
    └─ TIDAK → pilih jalur:
        │
        ├─ "Saya siswa, akun baru"
        │   → Register: nama + kelas + PIN 4 digit
        │   → LANGSUNG masuk Placement Test (WAJIB, tidak bisa skip)
        │
        ├─ "Saya siswa, sudah punya akun"
        │   → Login: nama + PIN
        │   → placement_tests.status = 'completed'?
        │       YA  → HomeScreen
        │       TIDAK → lanjutkan Placement dari titik terakhir
        │
        ├─ "Saya orang tua"
        │   → Register/Login dengan email + password
        │   → Link ke anak → ParentDashboard
        │
        └─ "Saya guru"
            → Register → verifikasi (NUPTK / email sekolah / manual)
            → status 'pending' sampai diverifikasi
            → TeacherDashboard
```

## 5.2 Parent Gate

Sebelum masuk `ParentDashboard`/`TeacherDashboard` dari sesi aktif anak, tampilkan **soal perkalian sederhana** sebagai challenge. Bukan keamanan sungguhan — mencegah kejadian tidak sengaja.

```jsx
// components/ParentGate.jsx (baru)
```

## 5.3 Profile Switcher (Anak Tanpa Login Mandiri)

```
students.auth_method:
  'pin'            → siswa mandiri (PIN terpisah)
  'device_profile' → anak kecil, di bawah kendali akun parent,
                      dipilih dari layar switcher (mirip Netflix)
```

## 5.4 Navigasi App.jsx (Revisi)

```
AuthStack           → SplashScreen, RoleSelectScreen, StudentRegisterScreen,
                      StudentLoginScreen, ParentAuthScreen, TeacherAuthScreen

StudentStack        → PlacementScreen (wajib), HomeScreen, PracticeScreen,
                      FastTrackScreen, AskKakScreen, UpgradePaywallScreen (BARU),
                      SessionResultScreen, SettingsScreen

ParentStack         → ParentDashboardScreen, ParentAnalyticsScreen,
                      ManageChildrenScreen, ParentSettingsScreen

TeacherStack        → ClassroomDashboardScreen, AssignmentsScreen,
                      ParentMessagesScreen, TeacherSettingsScreen
```

## 5.5 Model Freemium & Logika Paywall (BARU)

### Definisi tier

| Fitur | Trial (gratis) | Premium |
|---|---|---|
| Placement test | ✅ Penuh | ✅ Penuh |
| Latihan soal | ✅ Di `trial_level` saja | ✅ Semua level |
| Naik level (upgrade test / Fast Track) | ❌ Diblokir (paywall) | ✅ Semua level |
| AskKak — teks jawaban | ✅ Dari corpus pregenerated saja | ✅ + Ollama fallback |
| AskKak — audio jawaban | ✅ Pregenerated (jika tersedia) | ✅ Gemini TTS live |
| AskKak — input suara (mic) | ❌ | ✅ |

### Bagaimana `trial_level` di-set

```
Setelah placement selesai:
  students.trial_level = placement_tests.placed_level

Contoh: siswa ditempatkan di Level 8
  → trial_level = 8
  → siswa bisa latihan Level 8 sebebasnya
  → saat Confidence Score > 0.85, Fast Track banner muncul seperti biasa
  → saat siswa mengetuk Fast Track → cek is_premium:
       is_premium = true  → lanjut ke upgrade test seperti biasa
       is_premium = false → navigate ke UpgradePaywallScreen
```

### Mengapa bukan trial berbasis waktu

Siswa yang sangat rajin bisa menyelesaikan semua level dalam 14 hari — gerbang waktu menciptakan insentif yang salah (belajar ngebut bukan belajar tuntas). Gerbang level lebih adil: siswa mendapat pengalaman utuh di level tempat mereka benar-benar berada, lalu memilih lanjut dengan bayar.

### UpgradePaywallScreen.jsx (baru)

```jsx
// src/screens/UpgradePaywallScreen.jsx
// Muncul saat siswa menekan Fast Track tapi is_premium = false
//
// Konten layar:
// ├─ "Kamu sudah kuasai Level {trial_level}! 🎉"
// ├─ "Lanjut ke Level {trial_level + 1} dan semua level berikutnya"
// ├─ Harga + metode pembayaran
// └─ Tombol "Hubungi WhatsApp" (fase MVP)
//    → deeplink ke WA dengan pesan pre-fill:
//      "Halo, saya ingin upgrade akun [nama siswa] ke Cadas Premium"
//
// Catatan: tidak ada UI pembayaran dalam app — tidak ada tombol "Bayar Sekarang"
// yang memproses transaksi. Ini penting supaya app tidak melanggar
// kebijakan Play Store terkait in-app purchases (app hanya menampilkan
// info harga + redirect ke kanal eksternal, bukan transaksi di dalam app).
```

### Paywall di AskKak

```
AskKak untuk tier gratis:
  - Tampilkan BotCharacter dalam state 'idle'
  - TextInput aktif (bisa tanya)
  - Response: ambil dari corpus explanations (lexical/semantic, Layer 1-2 saja)
  - Jika ketemu → tampilkan teks + audio pregenerated (jika ada)
  - Jika tidak ketemu → tampilkan teks generik: "Kak Cadas belum punya jawaban
    untuk ini. Upgrade ke Premium supaya Kak Cadas bisa jawab langsung!"
  - Tombol mic: tersembunyi (hidden, bukan disabled)

AskKak untuk tier premium:
  - Semua fitur aktif (Layer 1-2-3, Gemini TTS live, input suara)
```

## 5.6 Strategi Distribusi & Pembayaran (BARU)

### Distribusi

```
Android (prioritas utama):
  - APK direct download dari website Cadas
  - Atau Play Store listing TANPA any billing UI di dalam app
    (tidak ada tombol "Upgrade" yang memproses transaksi,
    tidak ada harga yang ditampilkan dalam konteks checkout)
  - Status premium 100% dikontrol dari backend berdasarkan
    pembayaran yang terjadi di kanal eksternal

iOS (ditunda pasca-MVP):
  - PWA "Add to Home Screen" dari Safari sebagai pengganti sementara
  - Native iOS app menyusul setelah skala dan resource memungkinkan
    Apple App Store review
```

### Pembayaran — Fase MVP (Manual)

```
Alur:
  1. Orang tua lihat harga di UpgradePaywallScreen (atau website Cadas)
  2. Orang tua hubungi admin via WhatsApp
  3. Admin kirim instruksi transfer (QRIS / nomor rekening)
  4. Orang tua transfer + kirim bukti
  5. Admin verifikasi → jalankan endpoint admin:
       POST /api/admin/billing/activate
       Body: { student_id, amount_idr, payment_method, proof_note }
       → Tulis ke payment_records
       → Set students.is_premium = true
       → Set students.premium_activated_at = NOW()
  6. Siswa bisa langsung akses upgrade test saat app direfresh

Kenapa manual dulu:
  - Nol biaya integrasi di fase awal
  - Validasi apakah orang tua benar-benar mau bayar sebelum invest ke gateway
  - Kapan otomasi: setelah ada 50+ pembayaran manual yang konsisten
```

### Pembayaran — Fase 2 (Otomasi via Gateway)

```
Platform: Midtrans atau Xendit
  - QRIS, GoPay/OVO/DANA, virtual account bank
  - Biaya: ~2–3% per transaksi (vs 15–30% toko aplikasi)
  - Webhook backend: saat payment success → otomatis toggle is_premium

Revenue-share guru (otomasi menyusul):
  - Fase MVP: hitung komisi dari payment_records.commission_amount_idr
    → transfer manual bulanan ke guru les yang aktif
  - Fase 2: payout otomatis via Xendit Disbursement API
```

---

# 6. SPRINT 1 — BACKEND FOUNDATION & MIGRASI KONTEN

**Goal:** Backend baru jalan, database `cadas_app_dev` terisi konten, cadas-app (RN) fetch dari backend baru.

## 6.1 Setup Backend

- [ ] Buat folder `cadas-app-backend/`, `npm init`, Express + pg + dotenv
- [ ] Buat database `cadas_app_dev`
- [ ] Terapkan skema lengkap (§4.1–4.5 dokumen ini)
- [ ] Migration file bernomor sejak commit pertama (`001_initial_schema.sql`)
- [ ] `GET /api/health` — cek koneksi `cadas_app_dev`

## 6.2 Migrasi Konten Pertama

- [ ] Jalankan seluruh checklist di PLAN_DEV_MATERIAL_GENERATOR_v2 §7 (gate konten)
- [ ] Eksekusi skrip migrasi §5.4 (dari dokumen MATERIAL_GENERATOR)
- [ ] Verifikasi row count: exercises / explanations / upgrade_tests / speed_milestones cocok

## 6.3 Endpoint Dasar (Pindah dari speed-math-master)

- [ ] `GET /api/exercises/:level`
- [ ] `GET /api/exercises/item/:id`
- [ ] `POST /api/progress/session`
- [ ] `GET /api/progress/:studentId`

## 6.4 Endpoint Admin Billing (BARU — implementasi minimal, aktifkan sejak Sprint 1)

```
POST /api/admin/billing/activate
  Header: Authorization: Bearer {ADMIN_SECRET}  ← dari .env, bukan login UI
  Body: { student_id, amount_idr, payment_method, proof_note, referrer_code? }
  → Validasi student_id ada
  → Hitung commission_amount_idr jika referrer_code ada dan tipe = teacher_private/affiliate
  → Tulis ke payment_records
  → UPDATE students SET is_premium = true, premium_activated_at = NOW()
      WHERE id = student_id
  → Return: { success: true, student_name, level: students.current_level }

GET /api/admin/billing/status/:student_id
  Header: Authorization: Bearer {ADMIN_SECRET}
  → Return: { is_premium, premium_activated_at, payment_history: [...] }
```

Catatan: endpoint ini tidak punya UI admin di fase MVP — cukup dipanggil
via curl/Postman/script sederhana oleh admin. UI admin panel bisa ditambahkan
kemudian sebagai Sprint terpisah.

## 6.5 Update cadas-app (React Native)

- [ ] `services/api.js`: ganti `BASE_URL` ke endpoint backend baru, pindahkan ke config/env
- [ ] Test ulang `PracticeScreen.jsx` end-to-end dengan backend baru

---

# 7. SPRINT 2 — PLACEMENT TEST END-TO-END

**Goal:** Siswa baru wajib placement sebelum HomeScreen. Prioritas MVP paling tinggi.

## 7.1 Backend — Endpoint Placement

```
POST /api/placement/start
  Body: { student_id }
  → Buat row placement_tests baru, start_level = 8
  → Ambil 10 soal probe Level 8 (60% core, 20% floor Level 5, 20% ceiling Level 11)
  → Return: { placement_id, probe_level: 8, problems: [...] }

POST /api/placement/submit-probe
  Body: { placement_id, level, answers: [{problem_id, answer, time_taken_ms}] }
  → Simpan ke placement_probe_results
  → Hitung akurasi core-only (60% soal)
  → Logic percabangan (§0.2 DETAILED_LEVEL_PLANS):
      akurasi >= 80% → probe naik
      akurasi < 80%  → probe turun
  → MAX_PROBES = 4
  → Return: { next_probe_level } ATAU { completed: true }

GET /api/placement/result/:placement_id
  → Hitung placed_level (selalu 1 level di bawah verified_ceiling)
  → Hitung prerequisite_signals, speed_emphasis_flag
  → MIN = 1, MAX = 13
  → UPDATE students.trial_level = placed_level   ← BARU: set trial level
  → UPDATE students.current_level = placed_level
  → finalize_placement_test(), status = 'completed'
  → Return: { placed_level, prerequisite_signals, speed_emphasis_flag }
```

## 7.2 UI — PlacementScreen.jsx (Baru)

```jsx
// Mirip PracticeScreen tapi:
// - Tanpa timer terlihat (UNTIMED untuk akurasi)
// - Tanpa hint/bot bicara (first-contact assessment)
// - Progress indicator generik ("Soal 3 dari 10"), tidak menyebut level probe
// - Setelah selesai → PlacementResultScreen
```

## 7.3 UI — PlacementResultScreen.jsx (Baru)

```
"Kamu akan mulai dari Level {placed_level}!"
[Penjelasan singkat — framing positif, bukan "kamu lemah di X"]
[Tombol: Mulai Latihan → HomeScreen]
```

Tidak ada keterangan trial/premium di layar ini — anak tidak perlu tahu dulu soal paywall sebelum merasakan produk.

## 7.4 Integrasi ke Navigasi

- [ ] Setelah register/login siswa, cek `placement_tests.status`
- [ ] Belum selesai → paksa ke PlacementScreen (tidak bisa back)
- [ ] `students.current_level` dan `students.trial_level` di-set setelah placement selesai

## 7.5 Checklist Sprint 2

- [ ] 3 endpoint placement jalan end-to-end
- [ ] `trial_level` ter-set di database setelah placement selesai
- [ ] Algoritma adaptif teruji: siswa kuat (naik ke 13), lemah (turun ke 1), medium
- [ ] MAX_PROBES=4 teruji
- [ ] PlacementScreen tidak tampilkan hint/bot
- [ ] Placement wajib, tidak bisa skip

---

# 8. SPRINT 3 — PRACTICE LOOP PENYEMPURNAAN

**Goal:** Terapkan §0.7 (bot behavior) dan §0.8 (exercise delivery) dari DETAILED_LEVEL_PLANS ke `PracticeScreen.jsx`.

## 8.1 Bot Teaching Behavior (§0.7)

- [ ] **Retrieval-before-explanation:** cek riwayat `concept_id` di student_sessions. Bukan exposure pertama → soal langsung, hint baru muncul kalau salah.
- [ ] **Fast feedback di speed-lock level (5, 8, 9, 15):** jawaban benar → bot response satu kalimat pendek ("Yes! 6.2 detik").
- [ ] **Error-pattern matching:** bandingkan `student_answer` vs `explanations.common_mistakes`, tampilkan mistake spesifik (bukan daftar penuh).
- [ ] **Process-praise:** setiap 4–5 jawaban benar berturut, pujian menyebut teknik, bukan cuma waktu.

## 8.2 Exercise Delivery (§0.8)

- [ ] **Interleaving review:** 10–15% soal dari level sebelumnya disisipkan di akhir urutan.
- [ ] **Warm-up:** 3–5 soal dari level sudah dikuasai di awal sesi, `is_warmup: true`, tidak masuk skor.
- [ ] **Cross-type randomization:** acak `visualization_type` antar soal dalam satu Part.
- [ ] **Pure-recall drill session:** parameter `?mode=drill` di endpoint, tanpa hint/quick_trick di response.

## 8.3 Checklist Sprint 3

- [ ] Retrieval-before-explanation diverifikasi dengan siswa uji yang mengulang level
- [ ] Fast feedback teruji di level 5/8/9/15
- [ ] Error-pattern: 1 common mistake spesifik
- [ ] Process-praise tidak tiap jawaban, tidak pernah-tidak
- [ ] Interleaving, warm-up, cross-type semua terverifikasi di response API

---

# 9. SPRINT 4 — FAST TRACK & UPGRADE TEST SUNGGUHAN

**Goal:** FastTrackScreen.jsx berhenti jadi placeholder, dengan paywall gate untuk tier gratis.

## 9.1 Backend

```
GET /api/upgrade-test/:level
  → Cek students.is_premium — jika false, return 403 dengan kode 'PREMIUM_REQUIRED'
  → Ambil upgrade_test yang belum pernah dipakai siswa ini
  → Return: { test_id, test_type, num_problems, time_limit_ms, problems: [...] }

POST /api/upgrade-test/:test_id/submit
  Body: { student_id, answers: [...] }
  → Hitung akurasi + waktu
  → Terapkan pass_criteria sesuai test_type (A/B/C)
  → PASS → UPDATE students.current_level += 1
  → FAIL akurasi → rekomendasi latihan
  → FAIL waktu → pesan speed drill
```

## 9.2 UI — FastTrackScreen.jsx (Tulis Ulang Total)

```jsx
// Alur:
// 1. Fetch upgrade_test dari backend
//    → Error 403 'PREMIUM_REQUIRED'?
//        → navigate ke UpgradePaywallScreen
//        → SELESAI (tidak lanjut ke bawah)
//    → Sukses → lanjut
// 2. Intro: jumlah soal, batas waktu, pesan motivasi
// 3. Soal MIRIP PracticeScreen tapi:
//    - TANPA hint sama sekali
//    - Timer TERLIHAT + enforced untuk Type B/C
//    - Type A: tanpa timer
// 4. Submit → hasil dari backend
// 5. PASS → animasi + SessionResultScreen dengan flag level_up
// 6. FAIL → tawarkan speed drill (mode=drill di PracticeScreen)
```

## 9.3 UpgradePaywallScreen.jsx (lihat §5.5 untuk detail lengkap)

- Muncul saat endpoint return 403 `PREMIUM_REQUIRED`
- Copy: "Kamu sudah kuasai Level {trial_level}! 🎉"
- Harga + tombol WhatsApp (fase MVP)
- Tidak ada UI transaksi di dalam app

## 9.4 Pesan Bot (Hardcode per Skenario)

- [ ] Pass tepat target → "Perfect! 🎯 Kamu pas di target."
- [ ] Pass jauh lebih cepat → "WOW! kamu jago banget! 🚀"
- [ ] Fail speed (akurasi OK) → pesan speed drill + goal spesifik
- [ ] Fail speed Level 9 → skrip non-negotiable ("Perkalian HARUS instan...")
- [ ] Stuck 5x → tawarkan "accuracy reset mode"

## 9.5 Checklist Sprint 4

- [ ] Paywall gate berfungsi: 403 dari backend → UpgradePaywallScreen
- [ ] FastTrackScreen fungsional penuh untuk user premium
- [ ] Timer enforcement teruji untuk Type B dan C
- [ ] Level 9 punya pesan khusus non-negotiable
- [ ] Siswa yang gagal 5x dapat opsi "accuracy reset"
- [ ] `students.current_level` ter-update dengan benar setelah pass

---

# 10. SPRINT 5 — RAG PIPELINE & ASKKAK (TIER-AWARE)

**Goal:** AskKakScreen.jsx berhenti jadi placeholder. Free tier pakai pregenerated, premium tier pakai RAG live.

## 10.1 Backend RAG Pipeline

```
POST /api/rag/ask
  Body: { student_id, question_text, concept_id?, level? }

  Step 1 — Lexical Search (selalu dijalankan, semua tier)
    → HIT kuat: lanjut ke Step 4

  Step 2 — Semantic Search (selalu dijalankan, semua tier)
    similarity >= 0.85: pakai langsung → Step 4
    0.60-0.85: pakai sebagai few-shot context → Step 3 (premium) atau Step 4 (free)
    <0.60: lanjut Step 3 (premium) atau return "tidak ketemu" (free)

  Step 3 — Ollama Fallback (HANYA jika students.is_premium = true)
    - Prompt: system prompt PRIMING + few-shot dari Step 2
    - Cache ke student_questions

  Step 4 — Normalisasi (SELALU, semua sumber)
    - Jalankan normalizer.js

  Step 5 — Output sesuai tier
    is_premium = true  → Gemini TTS live → return audio_url + text
    is_premium = false →
      cari audio pregenerated terdekat (by concept_id)
      ketemu → return audio_url (existing WAV) + text
      tidak ketemu → return text + "Upgrade ke Premium supaya Kak Cadas
                      bisa jawab langsung pertanyaan ini!"
```

## 10.2 UI — AskKakScreen.jsx (Tulis Ulang Total)

```jsx
// Layout:
// ├─ Avatar Kak Cadas (BotCharacter: idle/listening/thinking/speaking)
// ├─ Tab varian: GASING | PMRI | Quick
// ├─ Input: TextInput (semua tier)
// │          Tombol mic (HANYA tampil jika is_premium)
// ├─ Area jawaban (scrollable)
// ├─ Tombol play audio (jika audio_url ada)
// └─ Rating "Membantu?" (thumbs up/down) → student_explanation_effectiveness_log
```

## 10.3 Viseme (Catatan)

Akurasi viseme Gemini TTS Bahasa Indonesia belum tervalidasi — uji manual 10 kalimat sampel wajib sebelum Sprint 5 dianggap selesai.

## 10.4 Checklist Sprint 5

- [ ] Endpoint `/api/rag/ask` jalan untuk kedua tier
- [ ] Standard tier TIDAK PERNAH memicu panggilan Ollama
- [ ] Premium tier: cache mencegah generate ulang pertanyaan identik
- [ ] Normalisasi dijalankan konsisten apapun sumber jawabannya
- [ ] Tombol mic tersembunyi untuk tier gratis (bukan hanya disabled)
- [ ] Variant naming `gasing`/`pmri`/`quick` konsisten di API, UI, dan konten
- [ ] Viseme diuji manual minimal 10 kalimat sampel

---

# 11. SPRINT 6 — PARENT DASHBOARD & BILLING MANUAL

**Goal:** Role Parent fungsional — linking, dashboard, analytics, Focus Score, dan visibilitas status premium anak.

## 11.1 Backend

```
POST /api/parent/register
POST /api/parent/login
POST /api/parent/link-child
GET  /api/parent/dashboard/:parent_id
GET  /api/parent/analytics/:student_id     — weekly chart data
GET  /api/billing/status/:student_id       — BARU: status premium + trial level
```

Endpoint `/api/billing/status/:student_id` (parent-accessible, bukan admin):

```
GET /api/billing/status/:student_id
  Auth: parent JWT, dengan validasi bahwa parent ini terhubung ke student_id
  → Return: {
      is_premium,
      premium_activated_at,
      trial_level,
      current_level,
      whatsapp_contact: "62xxx"    ← nomor WA admin untuk proses pembayaran
    }
```

## 11.2 UI — Screens Baru

- [ ] `ParentAuthScreen.jsx`
- [ ] `ParentDashboardScreen.jsx` — ringkasan per anak, **badge "Trial" atau "Premium"** per anak
- [ ] `ParentAnalyticsScreen.jsx` — chart mingguan (akurasi, waktu, level progress)
- [ ] `ManageChildrenScreen.jsx` — link/unlink anak
- [ ] Status premium terlihat jelas di dashboard — jika trial, tampilkan "Trial Level {n}" + tombol "Upgrade" yang redirect ke info pembayaran WA

## 11.3 Focus Score

- [ ] Track: switch app/tab selama practice session (`AppState` RN)
- [ ] Track: idle time (sudah ada partial di PracticeScreen)
- [ ] Track: time-to-first-answer per soal
- [ ] Tampilkan sebagai "Skor Fokus" — copy jujur: "seberapa fokus waktu latihan di app," bukan klaim soal aktivitas HP lainnya

## 11.4 Checklist Sprint 6

- [ ] Parent bisa register, link ke anak, lihat dashboard
- [ ] Status premium/trial terlihat jelas di parent dashboard
- [ ] `/api/billing/status` return data yang akurat
- [ ] Focus Score tampil dengan framing jujur
- [ ] Endpoint billing admin (`/api/admin/billing/activate` dari Sprint 1) sudah pernah diuji end-to-end dengan skenario nyata

---

# 12. SPRINT 7 — GURU DASHBOARD & REFERRAL SYSTEM

**Goal:** Role Guru fungsional — verifikasi, classroom, consent, assignment, referral dengan pembedaan guru sekolah vs guru les.

## 12.1 Backend

```
POST   /api/teacher/verify
POST   /api/teacher/classrooms
GET    /api/teacher/classrooms/:id
POST   /api/teacher/assignments
GET    /api/teacher/assignments/:id/progress
POST   /api/teacher/messages
POST   /api/classroom/join           — parent submit kode + consent
DELETE /api/classroom/students/:id   — parent revoke, kapan saja
POST   /api/referrals
GET    /api/referrals/:code/stats
```

## 12.2 UI — Screens Baru

- [ ] `TeacherAuthScreen.jsx` — dua sub-alur berdasarkan `teacher_type`:
  - `school`: verifikasi NUPTK / email sekolah / upload manual. **Setelah verified → fitur classroom gratis, tidak ada UI komisi sama sekali.**
  - `private`: verifikasi lebih ringan (bisa email biasa + deskripsi singkat). **Setelah verified → dapat referral code + dashboard komisi.**
- [ ] `ClassroomDashboardScreen.jsx`
- [ ] `AssignmentsScreen.jsx`
- [ ] `ParentMessagesScreen.jsx`

## 12.3 Referral System (Diperbarui untuk Dua Tipe Guru)

```
Guru sekolah (teacher_school):
  - Dapat referral code HANYA untuk referral ke luar kelasnya
    (misal: rekomendasikan ke guru lain di sekolah lain, atau grup WA orang tua
     di luar institusinya)
  - Untuk siswa di kelasnya sendiri: TIDAK punya referral code yang bisa
    meng-attributkan komisi — ini sengaja untuk hindari konflik kepentingan
  - commission_rate = 0.00 di tabel referrers

Guru les / tutor privat (teacher_private):
  - Dapat referral code untuk semua konversi yang direferensikan
  - commission_model = 'recurring_percentage', commission_rate = 10.00 (atau sesuai kesepakatan)
  - Commission dihitung otomatis saat admin input payment_records dengan referrer_code
  - Fase MVP: rekap komisi dibuat manual bulanan, transfer via admin
  - Fase 2: payout otomatis via Xendit Disbursement
```

## 12.4 Consent Flow

- [ ] Parent HARUS eksplisit consent per anak sebelum classroom_students dibuat
- [ ] Layar consent: tampilkan persis apa yang guru bisa lihat + apa yang tidak
- [ ] Revoke oleh parent langsung efektif tanpa approval guru

## 12.5 Permission Boundary (Enforce di Backend)

| Data | Guru Akses? |
|---|---|
| Skor, level progress, topic mastery | ✅ |
| Streak/konsistensi | ✅ |
| Focus Score, timing sesi | ❌ (reject di level API) |
| Billing/status premium | ❌ |

## 12.6 Checklist Sprint 7

- [ ] Guru sekolah dan guru les punya alur register yang berbeda, tidak ada UI komisi untuk guru sekolah
- [ ] Referral code guru les menghitung komisi dengan benar saat payment_records diisi
- [ ] Guru tidak bisa generate invite code sebelum verified
- [ ] Consent flow jelas tentang batas data
- [ ] Backend reject query guru untuk data billing/Focus Score

---

# 13. SPRINT 8 — POLISH, OFFLINE, BETA TEST

## 13.1 Offline Support

- [ ] Cache soal level aktif ke AsyncStorage
- [ ] Cache audio yang sudah pernah diputar (replay-only)
- [ ] Copy jujur di Settings: "Latihan bisa offline penuh. Penjelasan yang sudah pernah didengar bisa diputar ulang offline. Penjelasan baru dan suara premium butuh internet."

## 13.2 Rive Integration (Jika .riv Selesai)

- [ ] Install `@rive-app/react-native`
- [ ] Swap `BotCharacter.jsx` dari Image+Animated ke Rive
- [ ] Connect `botState` (8 nilai) ke Rive state machine
- [ ] Connect `visemeData` ke Rive mouth shapes

## 13.3 Beta Test

- [ ] 3–5 siswa nyata (SD kelas 4–6) — placement + practice + fast track
- [ ] 2–3 orang tua — linking + dashboard + **proses pembayaran manual (end-to-end)**
- [ ] 1–2 guru — classroom + consent
- [ ] Validasi satu siklus pembayaran: orang tua WA → admin toggle → siswa langsung premium

---

# 14. DEPENDENCY MAP & URUTAN EKSEKUSI

```
Sprint 1 (Backend + Migrasi + Admin Billing endpoint)
   │  [BLOCKING — semua sprint lain butuh backend jalan]
   ▼
Sprint 2 (Placement) ──────────────────────────────┐
   │  [Blocking untuk placement_tests.placed_level  │
   │   dan trial_level yang jadi fondasi freemium]  │
   ▼                                                ▼
Sprint 3 (Practice Loop)              Sprint 4 (Fast Track + Paywall)
   │                                      │  [Butuh upgrade_tests dari
   │                                      │   MATERIAL_GENERATOR Gap 2
   │                                      │   dan is_premium check]
   ▼                                      ▼
Sprint 5 (RAG + AskKak, tier-aware)
   │  [Butuh explanations teraudit — MATERIAL_GENERATOR Gap 3]
   │
   └────────┬────────────────────────────────────────────┐
            ▼                                            ▼
Sprint 6 (Parent + Billing status)        Sprint 7 (Guru + Referral)
  [bisa paralel setelah Sprint 5]           [bisa paralel setelah Sprint 5]
            └─────────────────────┬──────────────────────┘
                                  ▼
                         Sprint 8 (Polish, Beta)
```

**Catatan kritis lintas dokumen:** Sprint 2 dan Sprint 4 tidak bisa selesai sebelum
`PLAN_DEV_MATERIAL_GENERATOR_v2.md` Gap 1 (placement probe) dan Gap 2 (30 upgrade_tests) selesai.

---

# 15. CHECKLIST SEBELUM BETA TEST

```
BACKEND:
[ ] cadas-app-backend live, connect ke cadas_app_dev
[ ] Semua endpoint 3 role return data benar
[ ] RAG: standard tier tidak pernah panggil Ollama, premium tier cache berfungsi
[ ] TTS premium (Gemini live) dan standard (pregenerated) keduanya jalan
[ ] Endpoint admin billing berfungsi: toggle is_premium, tulis payment_records

REACT NATIVE:
[ ] Semua screen bisa dibuka tanpa crash (termasuk UpgradePaywallScreen)
[ ] Placement WAJIB dan tidak bisa skip untuk siswa baru
[ ] trial_level ter-set dengan benar setelah placement selesai
[ ] Paywall muncul dengan benar saat siswa non-premium mencoba Fast Track
[ ] AskKak: tombol mic tersembunyi untuk tier gratis
[ ] AskKak: Ollama tidak pernah dipanggil untuk tier gratis
[ ] Parent Gate berfungsi sebelum masuk area parent/guru dari sesi anak
[ ] Parent dashboard menampilkan status trial/premium per anak dengan jelas
[ ] Guru sekolah: tidak ada UI komisi di dashboard mereka
[ ] Guru les: referral code ada dan komisi dihitung dengan benar
[ ] Variant naming gasing/pmri/quick konsisten di semua tempat

BILLING & PAYMENT:
[ ] Satu siklus pembayaran manual sudah diuji end-to-end:
      orang tua WA → admin jalankan endpoint → siswa langsung premium tanpa restart app
[ ] UpgradePaywallScreen TIDAK mengandung UI transaksi di dalam app
      (hanya info harga + redirect ke WA)
[ ] payment_records terisi dengan benar setelah setiap aktivasi

UX:
[ ] Placement terasa seperti "penilaian ramah," bukan tes yang menghakimi
[ ] Paywall muncul di momen yang tepat (setelah kuasai level, bukan di tengah latihan)
[ ] Consent flow guru-parent transparan, batas data jelas
[ ] Copy offline dan Focus Score jujur, tidak melebih-lebihkan klaim
[ ] Touch target minimal 44×44px, teks terbaca di layar kecil
```

---

# RINGKASAN

cadas-app v3: **platform 3-role penuh** dengan backend sendiri, model freemium berbasis level
(1 level gratis di placed_level → paywall saat upgrade test), distribusi APK langsung tanpa
toko aplikasi, pembayaran via gateway eksternal dimulai manual. Revenue-share dibedakan tegas:
guru sekolah dapat fitur classroom gratis (bukan komisi dari siswanya), guru les/tutor privat
dapat komisi berulang yang dihitung otomatis dari setiap konversi yang direferensikan.

Paywall gate terpusat di satu titik — endpoint `/api/upgrade-test/:level` return 403 untuk
tier gratis — sehingga tidak ada logika paywall yang tersebar di banyak tempat di app.

**Rujuk `PLAN_DEV_MATERIAL_GENERATOR_v2.md` untuk pekerjaan konten yang harus selesai lebih
dulu sebelum Sprint 2 dan Sprint 4 di dokumen ini bisa dituntaskan.**
