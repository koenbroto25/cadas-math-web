# Cadas Matematika (cadas-app) — Development Plan v2.0
## Roadmap Lengkap: Backend Baru, 3 Role (Siswa/Parent/Guru), Placement, RAG, Fast Track

**Tanggal:** September 2026
**Status:** v2.0 — menggantikan PLAN_DEV.md v1, menggabungkan temuan audit kode aktual +
USER_APP_COMPLETE_DESIGN_v2 + DETAILED_LEVEL_PLANS_ALL_LEVELS + SPEED_TARGETS_QUICK_REFERENCE
**Perubahan mendasar dari v1:** cadas-app sekarang punya **backend sendiri** (Express +
database `cadas_app_dev`, terpisah dari `speed-math-master`) dan **satu-satunya yang live
deploy**. Scope MVP resmi mencakup 3 role penuh (Siswa/Parent/Guru), bukan siswa saja.

---

# DAFTAR ISI

1. Ringkasan Perubahan dari v1
2. Temuan Audit Kode Aktual (Kondisi Riil per September 2026)
3. Arsitektur Backend Baru
4. Skema Database `cadas_app_dev`
5. Sistem Autentikasi & Role Routing
6. Sprint 1 — Backend Foundation & Migrasi Konten
7. Sprint 2 — Placement Test End-to-End
8. Sprint 3 — Practice Loop Penyempurnaan (Section 0.7/0.8)
9. Sprint 4 — Fast Track & Upgrade Test Sungguhan
10. Sprint 5 — RAG Pipeline & AskKak (Tier-Aware)
11. Sprint 6 — Parent Dashboard
12. Sprint 7 — Guru Dashboard & Referral System
13. Sprint 8 — Polish, Offline, Beta Test
14. Dependency Map & Urutan Eksekusi
15. Checklist Sebelum Beta Test

---

# 1. RINGKASAN PERUBAHAN DARI v1

| # | Perubahan | Alasan |
|---|---|---|
| 1 | cadas-app dapat **backend Express sendiri** + database `cadas_app_dev` terpisah dari `speed-math-master` | Isolasi production dari alat dev lokal (lihat PLAN_DEV_MATERIAL_GENERATOR_v2 §5) |
| 2 | Scope MVP naik dari "siswa saja" menjadi **3 role: Siswa/Parent/Guru** | Keputusan eksplisit — USER_APP_COMPLETE_DESIGN_v2 penuh masuk MVP |
| 3 | Auth bukan lagi "nama + PIN 4 digit" — jadi sistem penuh (role detection, Parent Gate, profile-switcher, verifikasi guru) | Konsekuensi dari #2 |
| 4 | **Placement test wajib di awal**, bukan opsional/menyusul | Requirement eksplisit: siswa belajar dari yang belum bisa, diukur presisi + kecepatan |
| 5 | RAG pipeline: **Lexical (Postgres) → Semantic (pgvector) → Ollama fallback (teks)**, lalu **Gemini TTS** khusus premium; standard tier pakai audio pregenerated yang sudah cocok | Klarifikasi arsitektur final |
| 6 | `FastTrackScreen.jsx` dan `AskKakScreen.jsx` — dari placeholder literal "Coming Soon" menjadi fitur penuh | Ditemukan saat audit: keduanya kosong total |
| 7 | Confidence Score **sudah punya implementasi matang** di `useStore.js` (formula: accuracy 40% + speed 35% + consistency 25%) — dipertahankan, disambungkan ke placement | Ditemukan saat audit, bukan dirancang ulang dari nol |
| 8 | Bot teaching behavior (retrieval-before-explanation, fast feedback speed-lock, error-pattern matching, process-praise) dan exercise delivery (interleaving, warm-up, cross-type randomization) — dari DETAILED_LEVEL_PLANS §0.7-0.8, diintegrasikan ke PracticeScreen yang sudah jalan | Penyempurnaan logic yang sudah ada, bukan bangun ulang |
| 9 | Variant naming disatukan: `gasing` \| `pmri` \| `quick` (bukan `mental`/`LOGIKA`) | Sesuai USER_APP_COMPLETE_DESIGN_v2 §4.1 |

---

# 2. TEMUAN AUDIT KODE AKTUAL

## 2.1 Status per File (cadas-app/src)

| File | Status | Catatan |
|---|---|---|
| `App.jsx` (asumsi ada, belum dicek) | — | Perlu dicek navigasi stack saat ini |
| `services/api.js` | ✅ Jalan | Base URL hardcoded IP lokal — perlu dipindah ke `.env`/config saat backend baru dibuat |
| `store/useStore.js` | ✅ Jalan penuh | **Confidence Score sudah terimplementasi matang**, botState granular 8 nilai, visemeData untuk lip-sync |
| `store/useStore.js.bak` | — | File backup lama, evaluasi apakah masih perlu disimpan atau dihapus |
| `components/BotCharacter.jsx` | ✅ Ada (Image+Animated, belum Rive) | `.jsx.bak` juga ada, ada iterasi sebelumnya yang belum tercatat |
| `components/HintPanel.jsx` | ✅ Ada | Perlu dicek isi — apakah sudah pakai variant naming `gasing/pmri/quick` |
| `components/StreakBar.jsx` | ✅ Ada | |
| `screens/HomeScreen.jsx` | ✅ Jalan penuh | Level card, confidence bar, Fast Track banner, XP — semua fungsional |
| `screens/PracticeScreen.jsx` | ✅ Jalan penuh | WebView, adaptive hint 3-level, idle detection, bot state, TTS — paling matang dari semua screen |
| `screens/FastTrackScreen.jsx` | ❌ **Placeholder literal** | `<Text>Fast Track — Coming Soon</Text>`, tidak ada logic sama sekali |
| `screens/AskKakScreen.jsx` | ❌ **Placeholder literal** | `<Text>Tanya Kak — Coming Soon</Text>`, tidak ada logic sama sekali |
| `screens/SessionResultScreen.jsx` | Belum dicek | |
| `screens/SettingsScreen.jsx` | Belum dicek | |
| Placement flow (screen apapun) | ❌ **Tidak ada sama sekali** | `currentLevel` default ke 1 di store, tidak ada onboarding placement |
| Auth/role screens | ❌ **Tidak ada sama sekali** | Tidak ada login, register, role detection, Parent Gate |

## 2.2 Data yang Sudah Solid dan Harus Dipertahankan

### Formula Confidence Score (dari `useStore.js`, JANGAN diubah tanpa alasan kuat)

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

Threshold Fast Track: `confidence > 0.85`, dicek setelah minimal 5 hasil (bukan 20 seperti disebut di dokumen v1 — kode aktual lebih longgar, ambil kode sebagai acuan).

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

Ini **sudah** mengimplementasikan sebagian dari DETAILED_LEVEL_PLANS §0.7 poin 4 (error-pattern-specific), tapi belum secara eksplisit mencocokkan pola jawaban salah ke `common_mistakes` — baru berdasarkan hitungan berapa kali salah, bukan *jenis* kesalahannya. Ini jadi bagian dari Sprint 3.

## 2.3 Yang Perlu Dicek Lebih Lanjut (Belum Diaudit)

- Isi `HintPanel.jsx`, `SettingsScreen.jsx`, `SessionResultScreen.jsx`, `App.jsx` (navigasi)
- Apakah `BotCharacter.jsx.bak` dan `useStore.js.bak` masih relevan atau aman dihapus

---

# 3. ARSITEKTUR BACKEND BARU

## 3.1 Keputusan Final

```
material_generator_db (1 container Postgres, port 5432)
├─ database: material_generator_dev   ← speed-math-master (lokal, tidak berubah)
└─ database: cadas_app_dev            ← BARU

cadas-app-backend (Express, BARU — bisa jadi folder baru atau di dalam
                    cadas-app/backend/, terpisah dari React Native app)
├─ Connect HANYA ke cadas_app_dev
├─ Tidak pernah panggil API speed-math-master di production
│  (konten sudah dimigrasi masuk ke cadas_app_dev, lihat
│  PLAN_DEV_MATERIAL_GENERATOR_v2.md §5)
├─ Menangani: auth, role routing, placement (alur siswa), progress,
│  fast track/upgrade test, RAG live, parent dashboard, guru dashboard
└─ Live deploy ke production (AWS EC2 atau setara — detail di Sprint 8)
```

## 3.2 Kenapa Backend Terpisah dari React Native App

React Native (cadas-app) tidak pernah connect langsung ke PostgreSQL — kredensial database tidak boleh ada di client bundle. `cadas-app-backend` adalah lapisan API baru yang:
1. Menyimpan kredensial `cadas_app_dev` dengan aman (server-side `.env`)
2. Menjalankan RAG pipeline (butuh compute, tidak bisa di client)
3. Menangani JWT/session auth untuk 3 role

## 3.3 Struktur Folder yang Disarankan

```
cadas-app-backend/
├─ src/
│  ├─ index.js                    — Express entrypoint
│  ├─ config/
│  ├─ database/
│  │  ├─ connection.js            — connect ke cadas_app_dev SAJA
│  │  └─ migrations/              — bernomor sejak awal (belajar dari
│  │                                 technical debt speed-math-master)
│  ├─ auth/
│  │  ├─ auth-controller.js       — register/login, role detection
│  │  ├─ jwt.js
│  │  └─ parent-gate.js           — challenge sebelum area parent/guru
│  ├─ student/
│  │  ├─ student-controller.js    — progress, sesi (pindah dari speed-math-master)
│  │  └─ placement-controller.js  — alur adaptif SUNGGUHAN (§7)
│  ├─ fasttrack/
│  │  └─ upgrade-test-controller.js
│  ├─ rag/
│  │  ├─ lexical-search.js
│  │  ├─ semantic-search.js       — pgvector query
│  │  ├─ ollama-client.js         — disalin dari speed-math-master
│  │  ├─ gemini-tts.js            — disalin dari speed-math-master
│  │  ├─ normalizer.js            — disalin dari speed-math-master
│  │  └─ rag-controller.js        — orkestrasi 3 layer + endpoint
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

## 4.1 Tabel Konten (Diimpor dari speed-math-master — Lihat PLAN_DEV_MATERIAL_GENERATOR_v2 §5.2)

```sql
-- Struktur identik dengan speed-math-master, data diimpor saat migrasi
exercises        (termasuk placement probe, kolom is_placement_probe)
explanations     (hanya yang embedding_ready = true)
upgrade_tests
speed_milestones
```

## 4.2 Tabel Aplikasi — Siswa (Native, Lahir di Sini)

```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  kelas VARCHAR(20),
  pin_hash VARCHAR(100),                 -- untuk anak tanpa email/login mandiri
  auth_method VARCHAR(20) DEFAULT 'pin', -- 'pin' | 'email' (siswa lebih besar, 13+)
  email VARCHAR(255),
  current_level INT DEFAULT 1,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE student_sessions (
  -- struktur identik dengan yang sudah ada di speed-math-master,
  -- "pindah rumah" ke sini karena ini data perilaku siswa live
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

-- Placement HASIL SISWA (skema disalin dari speed-math-master,
-- tapi data lahir di sini — bukan diimpor)
CREATE TABLE placement_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  start_level INT DEFAULT 8,             -- FIXED dari mismatch v1 (lihat
                                          -- PLAN_DEV_MATERIAL_GENERATOR_v2 §2.3.1)
  current_probe_level INT,
  probes JSONB,
  results JSONB,
  placed_level INT,
  verified_ceiling_level INT,
  floor_check_passed BOOLEAN,
  speed_emphasis_flag VARCHAR(10),       -- 'low'|'medium'|'high'
  prerequisite_signals JSONB,            -- {"addition_recall":"strong",...}
  status VARCHAR(20) DEFAULT 'in_progress',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

CREATE TABLE placement_probe_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_test_id UUID REFERENCES placement_tests(id),
  level INT NOT NULL,
  probe_type VARCHAR(20),                -- 'core'|'floor'|'ceiling'
  skill_area VARCHAR(50),
  problem_id VARCHAR(100) NOT NULL,      -- referensi ke exercises.id (cross-table)
  student_answer VARCHAR(100),
  correct BOOLEAN NOT NULL,
  time_taken_ms INT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE student_explanation_effectiveness_log (
  -- skema disalin dari speed-math-master, data native di sini
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

## 4.3 Tabel Aplikasi — RAG Live (Baru, Khusus cadas_app_dev)

```sql
-- pgvector extension wajib diaktifkan di cadas_app_dev
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE explanations_embedding (
  explanation_id VARCHAR(100) REFERENCES explanations(id),
  embedding vector(768),          -- dimensi sesuai model embedding yang dipilih
  computed_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (explanation_id)
);

-- Cache dinamis hasil Ollama fallback (RAG_SYSTEM_TECHNICAL_SPEC, disesuaikan)
CREATE TABLE student_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  question_hash VARCHAR(64) NOT NULL,   -- SHA256 normalized question, untuk dedup
  student_id UUID REFERENCES students(id),
  concept_id VARCHAR(100),
  level INT,
  llm_generated_answer TEXT,
  llm_model VARCHAR(100) DEFAULT 'ollama-local',
  llm_latency_ms INT,
  tts_generated BOOLEAN DEFAULT false,   -- true jika premium & sudah di-TTS
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(question_hash, concept_id, level)
);
```

## 4.4 Tabel Aplikasi — Parent & Guru (dari USER_APP_COMPLETE_DESIGN_v2 §8)

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
  verification_status VARCHAR(20) DEFAULT 'pending',
  verification_method VARCHAR(20),      -- 'nuptk'|'school_email'|'manual'
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
  parent_consent_at TIMESTAMP NOT NULL,   -- consent WAJIB sebelum baris ini dibuat
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
  type VARCHAR(20) NOT NULL,             -- 'teacher'|'affiliate'|'other'
  reference_id UUID,
  code VARCHAR(20) UNIQUE NOT NULL,
  compensation_model VARCHAR(30),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE referral_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES referrers(id),
  student_id UUID REFERENCES students(id),
  converted_at TIMESTAMP DEFAULT NOW()
);
```

---

# 5. SISTEM AUTENTIKASI & ROLE ROUTING

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
        │   → Register: nama + kelas + PIN 4 digit (atau email jika 13+)
        │   → LANGSUNG masuk Placement Test (WAJIB, tidak bisa skip)
        │
        ├─ "Saya siswa, sudah punya akun"
        │   → Login: nama + PIN (atau email + password)
        │   → Apakah placement_tests.status = 'completed'?
        │       YA  → HomeScreen
        │       TIDAK → lanjutkan Placement Test dari titik terakhir
        │
        ├─ "Saya orang tua"
        │   → Register/Login dengan email + password
        │   → Link ke anak: masukkan kode dari anak, ATAU
        │     setup profil anak langsung (device-level profile,
        │     anak tanpa login sendiri — untuk anak kecil)
        │   → ParentDashboard (via Parent Gate jika masuk dari sesi anak)
        │
        └─ "Saya guru"
            → Register dengan email + nama
            → Verifikasi: NUPTK / email sekolah / upload bukti manual
            → status 'pending' sampai diverifikasi — bisa browse,
              TIDAK bisa generate invite code sampai verified
            → TeacherDashboard
```

## 5.2 Parent Gate

Implementasi konkret: sebelum masuk `ParentDashboard`/`TeacherDashboard` dari sesi aktif anak (device sama, anak sedang pakai app), tampilkan **soal perkalian sederhana** (misal `7 × 8 = ?`) sebagai challenge. Ini bukan keamanan sungguhan (anak SD kelas 5 bisa jawab), tapi mencegah kejadian tidak sengaja + syarat App Store Kids Category.

```jsx
// components/ParentGate.jsx (baru)
// Tampil sebagai modal sebelum navigasi ke ParentDashboard/TeacherDashboard
// dari state navigasi manapun yang berasal dari sesi Student aktif
```

## 5.3 Profile Switcher (Anak Tanpa Login Mandiri)

Untuk anak yang belum bisa/perlu login sendiri (kelas 1-3 misalnya): orang tua login sekali di device, lalu setup profil anak (nama + avatar, tanpa PIN terpisah). Anak pilih avatarnya dari layar profile-switcher (mirip Netflix) setiap buka app — tidak perlu masukkan password.

```
students.auth_method:
  'pin'          → siswa lebih besar (13+), PIN mandiri
  'device_profile' → anak kecil, di bawah kendali 1 akun parent,
                      tidak ada login terpisah, dipilih dari switcher
```

## 5.4 Navigasi App.jsx (Revisi)

```
AuthStack (belum login)
├─ SplashScreen
├─ RoleSelectScreen        (BARU — pilih Siswa/Parent/Guru)
├─ StudentRegisterScreen   (BARU)
├─ StudentLoginScreen      (BARU)
├─ ParentAuthScreen        (BARU)
└─ TeacherAuthScreen       (BARU)

StudentStack (siswa, setelah login)
├─ PlacementScreen         (BARU, WAJIB sebelum Home jika belum selesai)
├─ HomeScreen              (existing)
├─ PracticeScreen          (existing)
├─ FastTrackScreen         (existing file, TULIS ULANG total)
├─ AskKakScreen            (existing file, TULIS ULANG total)
├─ SessionResultScreen     (existing, cek isi)
└─ SettingsScreen          (existing, cek isi)

ParentStack (di belakang Parent Gate)
├─ ParentDashboardScreen   (BARU)
├─ ParentAnalyticsScreen   (BARU)
├─ ManageChildrenScreen    (BARU)
└─ ParentSettingsScreen    (BARU)

TeacherStack (di belakang Parent Gate equivalent)
├─ ClassroomDashboardScreen (BARU)
├─ AssignmentsScreen        (BARU)
├─ ParentMessagesScreen     (BARU)
└─ TeacherSettingsScreen    (BARU)
```

---

# 6. SPRINT 1 — BACKEND FOUNDATION & MIGRASI KONTEN

**Goal:** Backend baru jalan, database `cadas_app_dev` terisi konten dari migrasi, cadas-app (RN) bisa fetch dari backend baru (bukan lagi dari speed-math-master).

## 6.1 Setup Backend

- [ ] Buat folder `cadas-app-backend/`, `npm init`, Express + pg + dotenv
- [ ] Buat database `cadas_app_dev` (lihat PLAN_DEV_MATERIAL_GENERATOR_v2 §5.4 untuk skrip)
- [ ] Terapkan skema gabungan (§4.1-4.4 dokumen ini)
- [ ] Migration file bernomor sejak commit pertama (`001_initial_schema.sql`)
- [ ] `GET /api/health` — cek koneksi `cadas_app_dev`

## 6.2 Migrasi Konten Pertama

- [ ] Jalankan seluruh checklist di PLAN_DEV_MATERIAL_GENERATOR_v2 §7 (gate konten)
- [ ] Eksekusi skrip migrasi §5.4
- [ ] Verifikasi row count exercises/explanations/upgrade_tests/speed_milestones cocok

## 6.3 Endpoint Dasar (Pindah dari speed-math-master)

- [ ] `GET /api/exercises/:level` — sekarang baca dari `cadas_app_dev`, bukan proxy ke speed-math-master
- [ ] `GET /api/exercises/item/:id`
- [ ] `POST /api/progress/session` — tulis ke `student_sessions` di `cadas_app_dev`
- [ ] `GET /api/progress/:studentId`
- [ ] TTS pregenerated tetap serve dari file yang sudah ada (WAV di-copy/rsync ke server production, atau tetap di S3/storage — detail infra di Sprint 8)

## 6.4 Update cadas-app (React Native)

- [ ] `services/api.js`: ganti `BASE_URL` ke endpoint backend baru, pindahkan ke config/env (jangan hardcode IP)
- [ ] Test ulang `PracticeScreen.jsx` end-to-end dengan backend baru

---

# 7. SPRINT 2 — PLACEMENT TEST END-TO-END

**Goal:** Siswa baru wajib placement sebelum HomeScreen. Ini prioritas MVP paling tinggi sesuai requirement.

## 7.1 Backend — Endpoint Placement (Ditulis dari Nol di cadas-app-backend)

Mengimplementasikan algoritma dari DETAILED_LEVEL_PLANS_ALL_LEVELS §0.2-0.4 secara penuh:

```
POST /api/placement/start
  Body: { student_id }
  → Buat row placement_tests baru, start_level = 8 (probe pertama)
  → Ambil 10 soal probe Level 8 (60% core, 20% floor Level 5, 20% ceiling Level 11)
  → Return: { placement_id, probe_level: 8, problems: [...] }

POST /api/placement/submit-probe
  Body: { placement_id, level, answers: [{problem_id, answer, time_taken_ms}] }
  → Simpan ke placement_probe_results
  → Hitung akurasi core-only (60% soal)
  → Terapkan logic percabangan (§0.2):
      akurasi >= 80% → probe naik satu level (8→11, atau 11→13/14)
      akurasi < 80%  → probe turun satu level (8→5, atau 5→3, atau →Level 1 langsung)
  → MAX_PROBES = 4 — jika belum konvergen, ambil level terendah yang lolos ≥80%
  → Return: { next_probe_level } ATAU { completed: true, redirect: 'result' }

GET /api/placement/result/:placement_id
  → Hitung placed_level (SELALU 1 level di bawah verified_ceiling — never at ceiling)
  → Hitung prerequisite_signals (strong/moderate/weak per skill area)
  → Hitung speed_emphasis_flag (low/medium/high, dari waktu vs target level)
  → MIN_PLACEMENT_LEVEL = 1, MAX_PLACEMENT_LEVEL = 13 (enforce di sini)
  → finalize_placement_test(), update status = 'completed'
  → Return: { placed_level, prerequisite_signals, speed_emphasis_flag }
```

## 7.2 UI — PlacementScreen.jsx (Baru)

```jsx
// src/screens/PlacementScreen.jsx
// Mirip PracticeScreen tapi:
// - Tanpa timer terlihat (UNTIMED untuk akurasi, sesuai §0.2 dokumen kurikulum)
// - Tanpa hint/bot bicara sama sekali (first-contact assessment, bukan
//   sesi belajar — lihat DETAILED_LEVEL_PLANS §0.3)
// - Progress indicator generik ("Soal 3 dari 10"), TIDAK menyebut level
//   probe ke siswa (supaya tidak terasa seperti tes gagal/lulus per level)
// - Setelah semua probe selesai → PlacementResultScreen
```

## 7.3 UI — PlacementResultScreen.jsx (Baru)

Tampilkan hasil dengan framing positif (bukan "kamu lemah di X"):
```
"Kamu akan mulai dari Level {placed_level}!"
[Penjelasan singkat kenapa — level ini pas buat kamu sekarang]
[Tombol: Mulai Latihan → HomeScreen]
```

## 7.4 Integrasi ke Navigasi

- [ ] `App.jsx`: setelah register/login siswa, cek `placement_tests.status`
- [ ] Jika belum ada/belum selesai → paksa ke `PlacementScreen` (tidak bisa back ke Home)
- [ ] Set `students.current_level = placed_level` setelah selesai
- [ ] Simpan `prerequisite_signals` untuk dipakai Sprint 3 (bias explanation variant)

## 7.5 Checklist Sprint 2

- [ ] 3 endpoint placement jalan end-to-end (bukan stub)
- [ ] Algoritma adaptif teruji: skenario siswa kuat (naik ke Level 13), siswa lemah (turun ke Level 1), siswa medium (stabil di satu titik)
- [ ] MAX_PROBES=4 dicoba (siswa yang jawabannya inkonsisten/acak)
- [ ] PlacementScreen tidak menampilkan hint/bot bicara
- [ ] Placement wajib, tidak bisa di-skip dari alur normal

---

# 8. SPRINT 3 — PRACTICE LOOP PENYEMPURNAAN

**Goal:** Menerapkan Section 0.7 (bot behavior) dan 0.8 (exercise delivery) dari DETAILED_LEVEL_PLANS ke `PracticeScreen.jsx` yang sudah jalan — ini penyempurnaan, logic dasarnya dipertahankan.

## 8.1 Bot Teaching Behavior (§0.7)

- [ ] **Retrieval-before-explanation:** tandai di `exercises` (via backend) apakah ini exposure pertama siswa ke `concept_id` tersebut (cek riwayat di `student_sessions`/log jawaban). Jika bukan exposure pertama → jangan tampilkan Main Explanation duluan, langsung soal, baru hint kalau salah.
- [ ] **Fast feedback di speed-lock level (5, 8, 9, 15):** untuk jawaban BENAR di level-level ini, bot response dipersingkat jadi satu kalimat pendek ("Yes! 6.2 detik") — bukan paragraf. Cek `currentLevel` di `handleCorrect()`, kondisional pesan pendek untuk level 5/8/9/15.
- [ ] **Error-pattern-specific mistake matching:** saat `handleWrong()`, bandingkan `student_answer` terhadap pola kesalahan umum di `explanations.common_mistakes` (misal: jawaban = hasil tanpa carrying → tampilkan HANYA common mistake terkait carrying, bukan semua). Butuh endpoint baru atau logic tambahan di response `/api/exercises/item/:id` yang menyertakan pattern matching.
- [ ] **Process-praise occasional:** setiap 4-5 jawaban benar berturut, sisipkan pujian yang menyebut TEKNIK bukan cuma waktu ("Nice, kamu pakai trik lompat ke 10!"). Counter sederhana di `useStore.js` untuk melacak kapan terakhir process-praise muncul.

## 8.2 Exercise Delivery (§0.8)

- [ ] **Interleaving review:** backend `GET /api/exercises/:level` menyisipkan 10-15% soal dari level sebelumnya di bagian akhir urutan (bukan blok konsolidasi terpisah) — logic di endpoint, bukan di app.
- [ ] **Warm-up problems:** setiap sesi baru dibuka dengan 3-5 soal cepat dari level yang SUDAH dikuasai — tandai di response sebagai `is_warmup: true`, tidak masuk skor sesi.
- [ ] **Cross-type randomization:** backend mengacak `visualization_type` antar soal dalam satu Part, bukan blok 30-40 soal bertype sama berturut-turut — perubahan query `ORDER BY`.
- [ ] **Pure-recall speed session terpisah:** untuk Level 5/8/9 yang sudah pernah dijelaskan, backend bisa serve mode "drill" (tanpa `hint`/`quick_trick` di response sama sekali) — parameter baru di endpoint `?mode=drill`.

## 8.3 Checklist Sprint 3

- [ ] Retrieval-before-explanation diverifikasi dengan siswa uji yang mengulang level
- [ ] Fast feedback teruji khusus di level 5/8/9/15
- [ ] Error-pattern matching menunjukkan 1 common mistake spesifik, bukan daftar penuh
- [ ] Process-praise muncul dengan frekuensi wajar (tidak tiap jawaban, tidak pernah)
- [ ] Interleaving, warm-up, cross-type randomization semua terverifikasi di response API

---

# 9. SPRINT 4 — FAST TRACK & UPGRADE TEST SUNGGUHAN

**Goal:** `FastTrackScreen.jsx` berhenti jadi placeholder, jadi ujian naik level sungguhan berbasis 30 `upgrade_tests` yang sudah di-generate (lihat PLAN_DEV_MATERIAL_GENERATOR_v2 Gap 2).

## 9.1 Backend

```
GET /api/upgrade-test/:level
  → Ambil satu upgrade_test yang belum pernah dipakai siswa ini (dari 2
    yang tersedia per level) — supaya tidak hafal jawaban di percobaan ulang
  → Return: { test_id, test_type, num_problems, time_limit_ms, problems: [...] }

POST /api/upgrade-test/:test_id/submit
  Body: { student_id, answers: [...] }
  → Hitung akurasi + waktu total
  → Terapkan pass_criteria sesuai test_type (A=akurasi saja, B/C=akurasi+waktu)
  → Jika PASS → update students.current_level += 1, return pesan sukses
    (termasuk skrip khusus Level 9 "CHAMPIONSHIP SPEED" dari SPEED_TARGETS)
  → Jika FAIL akurasi → pesan review + rekomendasi 10 soal latihan
  → Jika FAIL waktu (akurasi OK) → pesan speed drill spesifik
    (termasuk skrip non-negotiable khusus Level 9)
```

## 9.2 UI — FastTrackScreen.jsx (Tulis Ulang Total)

```jsx
// src/screens/FastTrackScreen.jsx
// 1. Fetch upgrade_test sesuai currentLevel
// 2. Tampilkan intro: jumlah soal, batas waktu (jika ada), pesan motivasi
// 3. Jalankan soal MIRIP PracticeScreen tapi:
//    - TANPA hint sama sekali (ini ujian, bukan latihan)
//    - Timer TERLIHAT dan enforced untuk Type B/C (auto-submit saat habis)
//    - Untuk Type A: tidak ada timer ditampilkan
// 4. Submit → tampilkan hasil dengan pesan sesuai pass/fail dari backend
// 5. Jika pass → animasi + navigasi ke SessionResultScreen dengan flag level_up
// 6. Jika fail → tawarkan speed drill (set mode=drill di PracticeScreen)
```

## 9.3 Pesan Bot Sesuai SPEED_TARGETS_QUICK_REFERENCE (Hardcode per Skenario)

- [ ] Pass tepat target → "Perfect! 🎯 Kamu pas di target."
- [ ] Pass jauh lebih cepat → "WOW! kamu jago banget! 🚀"
- [ ] Fail speed (akurasi OK) → pesan speed drill generik + goal spesifik detik/soal
- [ ] Fail speed Level 9 khusus → skrip non-negotiable ("Perkalian HARUS instan...")
- [ ] Stuck 5x percobaan → tawarkan "accuracy reset mode" (matikan timer sementara)

## 9.4 Checklist Sprint 4

- [ ] FastTrackScreen fungsional penuh, bukan placeholder
- [ ] Timer enforcement teruji untuk Type B dan C
- [ ] Level 9 punya pesan khusus non-negotiable yang berbeda dari level lain
- [ ] Siswa yang gagal 5x mendapat opsi "accuracy reset" (§ dari KUMON_CURRICULUM Scenario 5)
- [ ] `students.current_level` ter-update dengan benar setelah pass

---

# 10. SPRINT 5 — RAG PIPELINE & ASKKAK (TIER-AWARE)

**Goal:** `AskKakScreen.jsx` berhenti jadi placeholder. Free tier pakai audio pregenerated, premium tier pakai RAG live.

## 10.1 Backend RAG Pipeline

```
POST /api/rag/ask
  Body: { student_id, question_text, concept_id?, level? }

  Step 1 — Lexical Search (Postgres, cadas_app_dev.explanations)
    Match by concept_id + level, exact/fuzzy text search
    → HIT: lanjut ke Step 4 langsung

  Step 2 — Semantic Search (pgvector, explanations_embedding)
    Embed question_text, cari cosine similarity terdekat
    → similarity >= 0.85: pakai langsung
    → 0.60-0.85: pakai sebagai few-shot context ke Step 3
    → <0.60: lanjut Step 3 tanpa context kuat

  Step 3 — Ollama Fallback (HANYA jika student premium DAN lexical/semantic
                              tidak cukup kuat)
    - Bangun prompt: system prompt dari PRIMING_STRUKTUR_BOT_TUTOR
      (identitas guru hangat, aturan bahasa, struktur GASING/PMRI)
      + few-shot dari Step 2 (jika ada)
    - Panggil ollama-client.js (disalin dari speed-math-master)
    - Cache hasil ke student_questions (dedup via question_hash)

  Step 4 — Normalisasi (SELALU, apapun sumber teksnya)
    - Jalankan normalizer.js (disalin dari speed-math-master)
    - QA checklist ringan (tidak perlu full speech-qa.js real-time,
      cukup regex check kata Melayu + notasi)

  Step 5 — Output sesuai tier
    is_premium = true  → Gemini TTS live → return audio_url + text
    is_premium = false →
      cari audio pregenerated TERDEKAT dari corpus yang sudah ada
      (match by concept_id, bukan re-generate)
      → jika ketemu: return audio_url (existing WAV) + text
      → jika TIDAK ketemu: return text saja, tanpa audio,
        dengan pesan "Upgrade ke premium untuk dengar Kak Cadas jawab
        langsung pertanyaan ini!"
```

## 10.2 UI — AskKakScreen.jsx (Tulis Ulang Total)

```jsx
// src/screens/AskKakScreen.jsx
// Layout (mengacu USER_APP_COMPLETE_DESIGN_v2 §4.3):
// ├─ Avatar Kak Cadas (BotCharacter, state: idle/listening/thinking/speaking)
// ├─ Tab varian: GASING | PMRI | Quick (variant naming FIXED, bukan LOGIKA/mental)
// ├─ Input: teks (TextInput) ATAU suara (tombol mic)
// │   - Suara: rekam → kirim ke endpoint STT (jika premium; kalau tidak
// │     premium, sembunyikan tombol mic, hanya teks)
// ├─ Area jawaban (scrollable, di bawah avatar)
// ├─ Tombol play audio (jika audio_url ada di response)
// └─ Rating "Membantu?" (thumbs up/down) → simpan ke
//     student_explanation_effectiveness_log
```

## 10.3 Viseme untuk Avatar (Catatan dari USER_APP_COMPLETE_DESIGN_v2)

**Open item yang perlu divalidasi sebelum dianggap selesai:** akurasi viseme pada output Gemini TTS Bahasa Indonesia belum pernah diuji nyata. Sprint 5 harus mencakup uji coba manual dengan beberapa kalimat sampel sebelum dianggap launch-ready — jangan asumsikan lip-sync otomatis akurat.

## 10.4 Checklist Sprint 5

- [ ] Endpoint `/api/rag/ask` jalan end-to-end untuk kedua tier
- [ ] Standard tier TIDAK pernah memicu panggilan Ollama (cost control)
- [ ] Premium tier: cache di `student_questions` mencegah generate ulang untuk pertanyaan yang identik/mirip
- [ ] Normalisasi dijalankan konsisten apapun sumber jawabannya
- [ ] Variant naming `gasing`/`pmri`/`quick` konsisten di API, UI, dan konten
- [ ] Viseme accuracy diuji manual minimal 10 kalimat sampel

---

# 11. SPRINT 6 — PARENT DASHBOARD

**Goal:** Role Parent fungsional — linking, dashboard, analytics, Focus Score (bukan off-app detection).

## 11.1 Backend

```
POST /api/parent/register
POST /api/parent/login
POST /api/parent/link-child      — via kode dari anak, atau buat profil baru
GET  /api/parent/dashboard/:parent_id
GET  /api/parent/analytics/:student_id   — weekly chart data
```

## 11.2 UI — Screens Baru

- [ ] `ParentAuthScreen.jsx`
- [ ] `ParentDashboardScreen.jsx` — ringkasan hari ini per anak (jika multi-anak: profile switcher)
- [ ] `ParentAnalyticsScreen.jsx` — chart mingguan (akurasi, waktu, level progress)
- [ ] `ManageChildrenScreen.jsx` — link/unlink anak, lihat kode invite

## 11.3 Focus Score (Bukan Off-App Detection)

Sesuai koreksi USER_APP_COMPLETE_DESIGN_v2 §5.1 — **off-app detection tidak feasible**, diganti in-app behavior tracking:
- [ ] Track: jumlah switch tab/app selama sesi practice aktif (pakai `AppState` React Native)
- [ ] Track: idle time selama sesi (sudah ada partial di `PracticeScreen.jsx` idle timer, tinggal dikirim ke backend)
- [ ] Track: time-to-first-answer per soal
- [ ] Tampilkan sebagai "Skor Fokus" di parent dashboard, dengan copy jujur: "seberapa fokus waktu latihan di app," bukan klaim soal aktivitas HP lainnya

## 11.4 Checklist Sprint 6

- [ ] Parent bisa register, link ke anak, lihat dashboard
- [ ] Focus Score terhitung dan tampil, dengan framing yang jujur (bukan klaim berlebihan)
- [ ] Copy di Settings tidak menjanjikan sesuatu yang tidak bisa dipenuhi (lihat §12.1 v2 untuk contoh koreksi klaim offline)

---

# 12. SPRINT 7 — GURU DASHBOARD & REFERRAL SYSTEM

**Goal:** Role Guru fungsional — verifikasi, classroom, consent flow, assignment, referral generik.

## 12.1 Backend

```
POST   /api/teacher/verify
POST   /api/teacher/classrooms
GET    /api/teacher/classrooms/:id
POST   /api/teacher/assignments
GET    /api/teacher/assignments/:id/progress
POST   /api/teacher/messages
POST   /api/classroom/join           — parent submit kode + consent
DELETE /api/classroom/students/:id   — parent revoke, kapan saja, unilateral
POST   /api/referrals
GET    /api/referrals/:code/stats
```

## 12.2 UI — Screens Baru

- [ ] `TeacherAuthScreen.jsx` + upload bukti manual (jika bukan NUPTK/school email)
- [ ] `ClassroomDashboardScreen.jsx` — rata-rata kelas, heatmap topik lemah, roster
- [ ] `AssignmentsScreen.jsx` — buat tugas, lihat progress per siswa
- [ ] `ParentMessagesScreen.jsx` — kirim pesan singkat ke orang tua

## 12.3 Consent Flow (Wajib, Bukan Opsional)

- [ ] Parent HARUS eksplisit consent per anak sebelum classroom_students dibuat
- [ ] Layar consent menampilkan **persis** apa yang akan dilihat guru (skor, level progress, topic mastery) dan **apa yang TIDAK** (Focus Score, billing) — sesuai batas permission §6.3 dokumen v2
- [ ] Revoke bisa dilakukan kapan saja oleh parent, tanpa approval guru/sekolah

## 12.4 Permission Boundary (Enforce di Backend, Bukan Cuma UI)

| Data | Guru Akses? |
|---|---|
| Skor, level progress, topic mastery | ✅ |
| Streak/konsistensi | ✅ |
| Focus Score, timing sesi | ❌ (query harus reject di level API, bukan cuma disembunyikan di UI) |
| Billing/status premium | ❌ |

## 12.5 Checklist Sprint 7

- [ ] Guru tidak bisa generate invite code sebelum verified
- [ ] Consent flow menampilkan boundary data dengan jelas sebelum parent konfirmasi
- [ ] Endpoint guru di-reject di level backend untuk data yang bukan haknya (bukan cuma disembunyikan di UI)
- [ ] Revoke oleh parent langsung efektif tanpa perlu aksi dari guru

---

# 13. SPRINT 8 — POLISH, OFFLINE, BETA TEST

Mengikuti struktur v1 Sprint 4 yang masih relevan, disesuaikan:

## 13.1 Offline Support (Klaim Dikoreksi)

Sesuai USER_APP_COMPLETE_DESIGN_v2 §12 — offline **tidak** mendukung penjelasan baru:
- [ ] Cache soal level aktif ke AsyncStorage
- [ ] Cache audio yang **sudah pernah** diputar (replay-only, bukan generate baru)
- [ ] Copy jujur di Settings: "Latihan bisa offline penuh. Penjelasan yang sudah pernah didengar bisa diputar ulang offline. Penjelasan baru dan suara premium butuh internet."

## 13.2 Rive Integration (Jika .riv Selesai)

- [ ] Install `@rive-app/react-native`
- [ ] Swap `BotCharacter.jsx` dari Image+Animated ke Rive
- [ ] Connect `botState` (sudah granular 8 nilai) ke Rive state machine input
- [ ] Connect `visemeData` (sudah ada di store) ke Rive mouth shapes

## 13.3 Beta Test

- [ ] 3-5 siswa nyata (SD kelas 4-6) — uji placement + practice loop + fast track
- [ ] 2-3 orang tua — uji linking + dashboard
- [ ] 1-2 guru (bisa simulasi/uji internal dulu) — uji classroom + consent flow
- [ ] Catat soal mana yang sering salah, hint mana yang membantu, apakah placement terasa akurat

---

# 14. DEPENDENCY MAP & URUTAN EKSEKUSI

```
Sprint 1 (Backend + Migrasi)
   │  [BLOCKING — semua sprint lain butuh backend baru jalan]
   ▼
Sprint 2 (Placement) ──────┐
   │                       │
   ▼                       ▼
Sprint 3 (Practice      Sprint 4 (Fast Track)
 Loop Refinement)           │  [butuh upgrade_tests dari
   │                        │   PLAN_DEV_MATERIAL_GENERATOR_v2 Gap 2]
   │                        │
   ▼                        ▼
Sprint 5 (RAG + AskKak)     │
   │  [butuh explanation_variants   │
   │   teraudit — Gap 3]            │
   └────────────┬───────────────────┘
                ▼
   Sprint 6 (Parent) ── bisa paralel dengan Sprint 7 (Guru)
                ▼
        Sprint 8 (Polish, Offline, Beta)
```

**Catatan kritis:** Sprint 2 (Placement) dan Sprint 4 (Fast Track) **tidak bisa selesai** sebelum `PLAN_DEV_MATERIAL_GENERATOR_v2.md` Gap 1 (placement probe multi-level) dan Gap 2 (30 upgrade_tests) selesai di sisi speed-math-master, lalu ter-migrasi. Koordinasikan urutan kerja lintas dua dokumen ini.

---

# 15. CHECKLIST SEBELUM BETA TEST

```
BACKEND:
[ ] cadas-app-backend live, connect ke cadas_app_dev (bukan speed-math-master lagi)
[ ] Semua endpoint 3 role (siswa/parent/guru) return data benar
[ ] RAG pipeline: standard tier tidak pernah panggil Ollama, premium tier
    cache mencegah generate ulang
[ ] TTS premium (Gemini live) dan TTS standard (pregenerated) keduanya jalan

REACT NATIVE:
[ ] Semua screen (termasuk yang baru: Placement, FastTrack, AskKak, Parent*,
    Teacher*) bisa dibuka tanpa crash
[ ] Placement WAJIB dan tidak bisa di-skip untuk siswa baru
[ ] Parent Gate berfungsi sebelum masuk area parent/guru dari sesi anak
[ ] Fast Track menjalankan ujian sungguhan dengan timer enforcement
[ ] AskKak berbeda perilaku sesuai tier (bukan sama untuk semua)
[ ] Variant naming gasing/pmri/quick konsisten di semua tempat

UX:
[ ] Placement terasa seperti "penilaian ramah," bukan tes yang menghakimi
[ ] Consent flow guru-parent transparan, boundary data jelas
[ ] Copy offline dan Focus Score jujur, tidak melebih-lebihkan klaim
[ ] Touch target minimal 44x44px, teks terbaca di layar kecil
```

---

# RINGKASAN

cadas-app naik level dari "app siswa dengan practice loop" menjadi **platform 3-role penuh** dengan backend sendiri, terpisah sepenuhnya dari `speed-math-master` yang kini murni alat kerja lokal. Placement test jadi gerbang wajib pertama (bukan opsional), Confidence Score yang sudah matang dipertahankan dan disambungkan ke hasil placement, Fast Track dan AskKak berhenti jadi placeholder dan jadi fitur penuh dengan logic RAG hybrid (lexical → semantic → Ollama fallback, Gemini TTS khusus premium). Parent dan Guru dibangun sesuai USER_APP_COMPLETE_DESIGN_v2 dengan koreksi-koreksi pentingnya (off-app detection diganti Focus Score, klaim offline dikoreksi, variant naming disatukan).

**Rujuk `PLAN_DEV_MATERIAL_GENERATOR_v2.md` untuk pekerjaan yang harus selesai lebih dulu di sisi konten sebelum Sprint 2 dan Sprint 4 di dokumen ini bisa dituntaskan.**
