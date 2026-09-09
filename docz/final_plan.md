# 🎯 CADAS APP — FINAL PLAN
## Rujukan Tunggal & Final untuk Developer — Fase Linear dari Nol hingga Rilis

**Tanggal disusun:** 8 September 2026
**Status:** FINAL — dokumen ini adalah urutan eksekusi otoritatif
**Cakupan:** `speed-math-master` (gap konten) + `cadas-app-backend` (Express) + `cadas-app` (React Native)

---

## CARA MEMAKAI DOKUMEN INI

Dokumen ini **bukan** pengganti empat dokumen sumber. Dokumen ini adalah **peta eksekusi** — urutan fase yang benar, tugas konkret per fase, kapan harus membaca dokumen sumber yang mana, cara memvalidasi (backtest) sebelum lanjut ke fase berikutnya, dan tempat mencatat kendala/perubahan.

**Empat dokumen sumber:**

| Kode | Nama file | Isi |
|---|---|---|
| `[MG]` | `PLAN_DEV_MATERIAL_GENERATOR_v2.md` | Pekerjaan di `speed-math-master` — generate & audit konten sebelum migrasi |
| `[V2]` | `PLAN_DEV_v2.md` | Rancangan awal `cadas-app` — backend, skema, Sprint 1-8 (v2.0) |
| `[V3]` | `PLAN_DEV_v3_1.md` | Revisi `[V2]` — billing, freemium, referral lengkap (v3.1, **paling detail**) |
| `[ADD]` | `CADAS_APP_ADDENDUM_v1.md` | Keputusan final pasca-`[V3]` — model bayar per-level, kuota, referral, dll |

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

## STATUS EKSEKUSI (diupdate 8 Sep 2026)

| Fase | Status | Catatan singkat |
|---|---|---|
| 0 | ✅ Lingkungan terverifikasi | Kedua repo jalan lokal; `cadas-app-backend/` sudah dibuat |
| 1 | ⚠️ Sebagian | Voice level 120/120 (L8 regen selesai) ✅, teks 5.446/5.446 ✅. **Gap terbuka:** 1.2 placement probe, 1.3 upgrade tests, 1.4 audit variants. Cache TTS per-soal 56% (tidak blocking) |
| 2 | ✅ Selesai (2.5 tinggal uji manual) | 2.4 semua endpoint dasar teruji via HTTP + static HTML/audio + TTS cache. Sisa: uji sentuh `PracticeScreen` di emulator/device. Detail di Catatan Fase FASE 2 |
| 3 | ✅ Backend selesai (3.1), UI menyusul | 3.1 semua endpoint auth teruji 16/16 lulus: student/parent/teacher register+login, JWT, Parent Gate, /me. Backend siap — UI (3.2/3.3) menyusul setelah FASE 4 placement test |
| 4–13 | ⬜ Belum mulai | |

> Catatan metode penting: migrasi konten FASE 2 memakai **copy-with-transform**
> (ETL Node antar-pool di instance Postgres yang sama), bukan dump/import dari
> `[MG]` §5.4 — alasan dan detail di Catatan Fase FASE 2. Alat verifikasi:
> `cadas-app-backend/src/database/backtest-content.js` (pembandingan penuh
> 5.446 soal field-per-field) dan `verify-source-intact.js` (sumber utuh).

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
   │                                                       dan status premium FASE 6
   ▼
FASE 9  Avatar Rive & Gamification
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
[ ] Node.js LTS terpasang (cek: node -v)
[ ] Docker terpasang, container material_generator_db bisa dijalankan
[ ] PostgreSQL client (psql) terpasang untuk query manual/verifikasi
[ ] Akses ke repo speed-math-master (sudah ada, berisi kode ter-audit)
[ ] Akses ke repo cadas-app (React Native, sudah ada — HomeScreen/PracticeScreen jalan)
[ ] Akun OpenRouter dengan API key (untuk FASE 8 nanti — siapkan dari awal)
[ ] Akun Google Cloud dengan Gemini TTS API key
[ ] Nomor WhatsApp admin untuk alur pembayaran manual (FASE 6)
[ ] File .riv avatar dari tim desain (untuk FASE 9) — jika belum selesai, FASE 9 bisa
    ditunda tanpa memblokir fase lain (BotCharacter.jsx tetap pakai Image+Animated sampai .riv siap)
```

---

# FASE 0 — ORIENTASI & SETUP LINGKUNGAN

### 🎯 Tujuan
Developer paham peta keseluruhan proyek dan siap kerja sebelum menyentuh kode apapun.

### 📖 Dokumen wajib dibaca sebelum mulai
- **Dokumen ini secara penuh** (sudah sedang Anda lakukan)
- `[MG]` §1 (Ringkasan Perubahan Peran) — paham kenapa `speed-math-master` bukan backend produksi
- `[V3]` §1 (Ringkasan Perubahan) — paham konteks evolusi v1→v2→v3

### ✅ Sub-fase & tugas

**0.1 — Verifikasi kondisi kode aktual**
- [ ] Clone/pull kedua repo (`speed-math-master`, `cadas-app`)
- [ ] Jalankan `speed-math-master` lokal, konfirmasi masih sesuai temuan audit `[MG]` §2.1 (5.096 exercises, 15 explanations, 0 placement_tests, 0 upgrade_tests)
- [ ] Jalankan `cadas-app` (React Native) lokal, konfirmasi `HomeScreen`/`PracticeScreen` masih jalan seperti temuan `[V3]` §2.1

**0.2 — Siapkan kredensial**
- [ ] `.env` OpenRouter API key disiapkan (belum dipakai sampai FASE 8, tapi daftar akun dari sekarang)
- [ ] `.env` Gemini TTS API key
- [ ] `ADMIN_SECRET` di-generate (string acak panjang) — dipakai FASE 6 untuk endpoint admin billing

**0.3 — Siapkan struktur folder baru**
- [ ] Buat folder `cadas-app-backend/` (kosong dulu, diisi di FASE 2)

### 🧪 Backtest / validasi
```bash
cd speed-math-master && npm start
# Expected: server jalan tanpa error, bisa GET /api/health (atau setara)

cd cadas-app && npx expo start
# Expected: bundler jalan tanpa error, app terbuka di emulator/device,
# HomeScreen dan PracticeScreen masih berfungsi seperti sebelumnya
```

### 🏁 Kriteria selesai
- [ ] Kedua repo jalan lokal tanpa error
- [ ] Semua kredensial API tersedia di `.env` masing-masing tempat (belum dipakai, cukup tersedia)
- [ ] Developer sudah baca dokumen ini + `[MG]` §1 + `[V3]` §1

### 📝 Catatan Fase
```
Tanggal mulai       :
Tanggal selesai      :
Kendala yang ditemui :
Perubahan dari rencana:
Developer            :
```

---

# FASE 1 — TUTUP GAP KONTEN (speed-math-master)

### 🎯 Tujuan
Menyelesaikan tiga gap kritis di `speed-math-master` supaya konten layak dimigrasi. **Tidak ada fase backend yang bisa mulai kerja sungguhan sebelum fase ini selesai** — placement (FASE 4) butuh probe multi-level, Fast Track (FASE 7) butuh upgrade_tests, RAG (FASE 8) butuh explanations teraudit.

### 📖 Dokumen wajib dibaca sebelum mulai
- `[MG]` §2 penuh (Temuan Audit) — pahami kondisi riil data saat ini
- `[MG]` §3 penuh (Tiga Gap Kritis) — ini instruksi detail untuk fase ini
- `[MG]` §7 (Checklist Sebelum Rilis Konten) — ini gate yang harus lolos sebelum FASE 2

### ✅ Sub-fase & tugas

**1.1 — Perbaiki `start_level` mismatch**
- [ ] Ubah `schema.sql`: `start_level DEFAULT 8` (bukan 5) — lihat `[MG]` §2.3.1
- [ ] Mulai disiplin migration file bernomor (`001_initial.sql`, dst) — folder `migrations/` yang sebelumnya kosong (`[MG]` §2.3.3)

**1.2 — Gap 1: Placement Probe Generator (lihat `[MG]` §3.1 untuk detail penuh)**
- [ ] `placement-generator.js` bisa terima parameter level acuan (bukan hardcode 1 level)
- [ ] Tambah kolom pembeda probe di `exercises` (`is_placement_probe BOOLEAN`)
- [ ] Generate probe untuk Level 3, 5, 8, 11, 13/14 (komposisi 60% core/20% floor/20% ceiling)
- [ ] Hapus/deprecate 3 endpoint placement stub di `index.js` (`/api/placement/*`) — alur siswa sungguhan ditulis di `cadas-app-backend`, bukan di sini
- [ ] Dokumentasikan di README `speed-math-master`: alur placement siswa ada di `cadas-app`

**1.3 — Gap 2: Generate 30 Upgrade Tests (lihat `[MG]` §3.2 untuk detail penuh)**
- [ ] Buat `src/generation/upgrade-test-generator.js` (pola sama seperti `exercise-generator.js`)
- [ ] Buat endpoint `POST /api/generate/upgrade-tests`
- [ ] Generate 2 test per level × 15 level = 30 baris `upgrade_tests` (satu untuk kondisi normal, satu untuk retry setelah gagal)
- [ ] Tarik parameter dari `SPEED_TARGETS_QUICK_REFERENCE.md` (jumlah soal, batas waktu, test type A/B/C, skrip pesan termasuk skrip non-negotiable Level 9)
- [ ] QA manual: jalankan simulasi 1 test per level

**1.4 — Gap 3: Audit `explanation_variants` (lihat `[MG]` §3.3 untuk query & kriteria lengkap)**
- [ ] Jalankan query audit (lihat `[MG]` §3.3 poin 1) untuk 15 baris `explanations`
- [ ] Tandai level yang gagal kriteria (variant count/type/panjang kata)
- [ ] Jalankan `speech-qa.js` terhadap 15 `speech_friendly_text`
- [ ] Regenerate level yang gagal via `explanation-generator.js` yang sudah ada
- [ ] Re-audit sampai 15/15 lolos

**1.5 — Tambah soal Level 1 yang kurang**
- [ ] Level 1 saat ini 260 soal, target 300 — tambah 40 soal (lihat `[MG]` §2.2, Level 1 adalah first impression paling kritis)

**1.6 — Siapkan corpus untuk RAG (lihat `[MG]` §4.2)**
- [ ] Tambah kolom `embedding_ready BOOLEAN DEFAULT false` di `explanations`
- [ ] Set `true` untuk baris yang sudah lolos Gap 3
- [ ] **Tidak perlu generate embedding vector di sini** — itu terjadi di `cadas_app_dev` (FASE 2)

**1.7 — Siapkan modul yang akan disalin ke backend baru**
- [ ] Pastikan `src/speech/normalizer.js` bersih dan siap disalin (dipakai di FASE 8, bukan `ollama-client.js` — lihat ⚠️ Override di bawah)
- [ ] Pastikan fungsi `generateTTS`/`pcmToWav` di `gemini-client.js` terpisah rapi dan siap disalin

**1.8 — Housekeeping**
- [ ] README `speed-math-master` diupdate: jelaskan peran baru sebagai content workshop
- [ ] Pastikan `.env`/docker-compose tidak ter-expose ke jaringan luar

### ⚠️ OVERRIDE
`[MG]` §4.4 menyebutkan `ollama-client.js` sebagai salah satu modul yang perlu disalin ke `cadas-app-backend`. **Ini tidak perlu dilakukan.** Fallback LLM di FASE 8 memakai OpenRouter (panggilan HTTP API biasa), bukan Ollama lokal. Modul yang tetap perlu disalin hanya: `normalizer.js` dan fungsi TTS dari `gemini-client.js`.

### 🧪 Backtest / validasi
```bash
# Setelah 1.2-1.4:
psql -d material_generator_dev -c "SELECT level, COUNT(*) FROM exercises WHERE is_placement_probe = true GROUP BY level;"
# Expected: baris untuk level 3, 5, 8, 11, 13, 14 muncul

psql -d material_generator_dev -c "SELECT COUNT(*) FROM upgrade_tests;"
# Expected: 30

psql -d material_generator_dev -c "SELECT level, COUNT(*) FROM exercises GROUP BY level ORDER BY level;"
# Expected: Level 1 >= 300, semua level >= target kurikulum masing-masing

psql -d material_generator_dev -c "SELECT COUNT(*) FROM explanations WHERE embedding_ready = true;"
# Expected: 15

node --check speed-math-master/src/generation/upgrade-test-generator.js
# Expected: tidak ada syntax error

npm run lint   # jika eslint dikonfigurasi di speed-math-master
```

### 🏁 Kriteria selesai
Jalankan **seluruh checklist `[MG]` §7** (Checklist Sebelum Rilis Konten) — semua item KONTEN, KUALITAS, dan TEKNIS harus tercentang sebelum lanjut ke FASE 2. Ini gate keras, tidak boleh dilewati sebagian.

### 📝 Catatan Fase
```
Tanggal mulai        : (sebagian pekerjaan sudah berjalan sebelum fase diformalkan)
Tanggal selesai      : belum
Status audit 8 Sep 2026:
  - Voice segmen konsep level: 120/120 DB↔manifest↔disk sinkron, L8 regen selesai ✅
  - Teks: 5.446/5.446 soal punya problem_text + speech_text ✅
  - Cache TTS per-soal (hint/trick): ~56% (2.849 hint + 2.983 trick dari 5.446×2)
    → tidak blocking FASE 2; soal tanpa audio fallback teks (V3.1 §10.1)
  - Gap 1.2 placement probe: placement_tests = 0 rows → BELUM dikerjakan
  - Gap 1.3 upgrade tests: upgrade_tests = 0 rows → BELUM dikerjakan
  - Gap 1.4 audit explanation_variants: BELUM dikerjakan
Kendala yang ditemui  :
Perubahan dari rencana:
Developer             : Cline (AI pair)
```

---

# FASE 2 — BACKEND FOUNDATION & MIGRASI KONTEN PERTAMA

### 🎯 Tujuan
`cadas-app-backend` (Express, baru) jalan, terhubung ke database baru `cadas_app_dev` yang sudah terisi konten hasil migrasi dari FASE 1. Ini fase **paling blocking** — semua fase berikutnya butuh backend ini jalan.

### 📖 Dokumen wajib dibaca sebelum mulai
- `[MG]` §5 penuh (Arsitektur Migrasi Database) — pahami skrip migrasi §5.4
- `[V3]` §3 penuh (Arsitektur Backend Baru) — struktur folder yang disarankan
- `[V3]` §4 penuh (Skema Database) — **PENTING:** baca §4.2 baris `students` dengan cermat, lalu langsung baca ⚠️ Override di bawah karena skema ini akan direvisi

### ✅ Sub-fase & tugas

**2.1 — Setup backend baru** ✅ (8 Sep 2026)
- [x] `cadas-app-backend/`, `npm init`, install `express pg dotenv jsonwebtoken bcryptjs` (+ cors)
- [x] `src/index.js` — Express entrypoint
- [ ] Struktur folder sesuai `[V3]` §3.2 (auth/, student/, fasttrack/, rag/, billing/, parent/, teacher/, referral/) — sementara monolitik di `index.js`
- [x] `GET /api/health` — cek koneksi `cadas_app_dev` (teruji: 200 + db_time)
- [x] Migration file bernomor sejak commit pertama (`001_initial_schema.sql` — plus `003_content_etl_adjustments.sql`, `004_concepts_upsert_index.sql`; `002_pgvector.sql` auto-skip, lihat 2.2)

**2.2 — Buat database & terapkan skema** ✅ (8 Sep 2026)
- [x] `CREATE DATABASE cadas_app_dev;` (di container `material_generator_db` yang sama, database terpisah)
- [x] Terapkan skema tabel konten (`[V3]` §4.1) + tabel siswa (`[V3]` §4.2, **dengan modifikasi ⚠️ Override**) + tabel RAG (`[V3]` §4.3, **dengan modifikasi ⚠️ Override untuk `llm_model`**) + tabel parent/guru (`[V3]` §4.4) + tabel billing (`[V3]` §4.5, **dengan modifikasi ⚠️ Override**) — 14 tabel via migration runner idempotent (status di `_migrations`); penyesuaian hasil audit: `variant` nullable (milik penjelasan, bukan per soal) + kolom `source_id` untuk mapping audio
- [ ] Aktifkan extension pgvector — **TIDAK TERSEDIA** di image `postgres:16` polos yang dipakai container ini → `002_pgvector.sql` dilewati otomatis dengan warning (tidak ditandai applied). Layer lexical tetap jalan; aktifkan via image `pgvector/pgvector:pg16` (volume tetap `./pgdata`) saat mendekati FASE 8, lalu `npm run migrate` ulang

**2.3 — Eksekusi migrasi konten** ✅ (8 Sep 2026) — metode berubah, lihat Catatan Fase
- [x] Migrasi konten: **copy-with-transform** via `src/database/migrate-content.js` (ETL Node, ~4 detik, idempotent) — BUKAN dump `[MG]` §5.4; hasil: 15 level, 15 konsep, 15 explanations (steps+variants), 5.446 exercises, 120 segmen audio level + viseme JSON; terverifikasi **field-per-field 5.446/5.446** via `backtest-content.js` (9/9 lulus)
- [x] Voice dimigrasi **bertahap**: fase 1 segmen level ✅ (tabel `level_audio_segments`); fase 2 cache per-soal resumable via `backfill-exercise-audio.js` (tabel `exercise_audio`, ~56% — jalankan ulang tiap precache bertambah)
- [x] Tabel `content_release_log` (`[MG]` §5.4 catatan penting) ✅ — dibuat via migration 005; ETL mencatat satu baris per eksekusi (teruji: id 1 = 5446/15/120)

**2.4 — Endpoint dasar (pindah dari speed-math-master)** ✅ (8 Sep 2026)
- [x] `GET /api/exercises/:level` — teruji: level 5 → 450 soal, format `{level, total, exercises[]}` sesuai kontrak `services/api.js`
- [x] `GET /api/exercises/item/:id` — teruji: 200 + payload lengkap; 404 untuk id tak dikenal
- [x] `POST /api/progress/session` — teruji: 201, hitung total/correct/avg_time otomatis; tabel `student_sessions` (migration 005); `student_id`/`device_id` opsional (auth menyusul di FASE 3)
- [x] `GET /api/progress/:studentId` — teruji: agregat total + per-level
- [x] Bonus agar app jalan end-to-end: static `/exercises/*.html` (WebView PracticeScreen), static `/audio/*` (segmen level + viseme), `GET /api/tts/:id?type=hint|trick` (layani cache yang ada, 404 → fallback teks; input di-sanitasi)
- [x] Modul mulai dipecah ke struktur `[V3]` §3.2: `src/routes/exercises.js`, `src/routes/progress.js`

**2.5 — Update cadas-app (React Native)** 🔶 kode selesai, uji manual menyusul
- [x] `services/api.js`: `BASE_URL` tidak lagi hardcode IP — pakai `EXPO_PUBLIC_API_URL` (override via env, Expo SDK 57), default dev `http://10.0.2.2:3000` (Android emulator); `BASE_URL` di-export dan dipakai ulang oleh `PracticeScreen.jsx` (termasuk di dalam `INJECTED_JS` WebView — 2 hardcode IP dihapus)
- [ ] Test ulang `PracticeScreen.jsx` end-to-end di emulator/device — **jalankan manual**: `cd cadas-app-backend && npm start` lalu `cd cadas-app && npx expo start` (API + static HTML + audio sudah terverifikasi via HTTP; tinggal uji sentuh di emulator)

### ⚠️ OVERRIDE — skema `students`, `student_questions`, `payment_records`

Skema di `[V3]` §4.2, §4.3, §4.5 dirancang untuk model "1 level gratis + `is_premium` global." Terapkan versi berikut, bukan versi `[V3]` mentah:

```sql
-- students: HAPUS baris ini dari [V3] §4.2:
--   is_premium BOOLEAN DEFAULT false
--   premium_activated_at TIMESTAMP
--   trial_level INT
-- (trial_level TETAP ADA tapi maknanya berubah — lihat FASE 4 ⚠️ Override)
-- GANTI/TAMBAH dengan (lihat [ADD] §1.2):
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  kelas VARCHAR(20),
  pin_hash VARCHAR(100),
  auth_method VARCHAR(20) DEFAULT 'pin',
  email VARCHAR(255),
  current_level INT DEFAULT 1,

  trial_level INT,                          -- hasil placement, HANYA untuk tampilan
                                             -- "kamu cocok mulai dari level X",
                                             -- BUKAN gerbang akses gratis (lihat FASE 4)
  paid_basic_up_to_level    INT DEFAULT NULL,
  paid_premium_up_to_level  INT DEFAULT NULL,
  is_complimentary BOOLEAN DEFAULT false,   -- siswa guru/beta tester, dari [V3] item 16

  referred_by UUID REFERENCES referrers(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- student_questions: ganti default llm_model
-- [V3] §4.3: llm_model VARCHAR(100) DEFAULT 'ollama-local'
-- JADI:
  llm_model VARCHAR(100) DEFAULT 'openrouter'

-- payment_records: struktur [V3] §4.5 TETAP DIPAKAI APA ADANYA
-- (amount_idr, payment_method, commission_amount_idr, referrer_id — tidak berubah)
-- yang berubah hanya LOGIKA di sekitarnya, bukan struktur tabel ini
```

Tambahkan juga tabel kuota (dipakai nanti di FASE 8, tapi buat sekarang sekalian sementara developer di dalam skema):

```sql
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

### 🧪 Backtest / validasi
```bash
cd cadas-app-backend && npm run lint
node --check src/index.js
npm start &
curl http://localhost:3000/api/health
# Expected: {"status":"ok", ...}

psql -d cadas_app_dev -c "\d students"
# Expected: kolom paid_basic_up_to_level, paid_premium_up_to_level ADA;
#           kolom is_premium, premium_activated_at TIDAK ADA

psql -d cadas_app_dev -c "SELECT COUNT(*) FROM exercises;"
psql -d cadas_app_dev -c "SELECT COUNT(*) FROM explanations;"
psql -d cadas_app_dev -c "SELECT COUNT(*) FROM upgrade_tests;"
psql -d cadas_app_dev -c "SELECT COUNT(*) FROM speed_milestones;"
# Expected: semua row count SAMA dengan sumber di material_generator_dev

curl http://localhost:3000/api/exercises/1
# Expected: JSON array soal Level 1

# Di React Native:
cd cadas-app && npx expo start
# Expected: PracticeScreen fetch dari backend baru, bukan speed-math-master lagi
```

### 🏁 Kriteria selesai
- [ ] `cadas-app-backend` live secara lokal, connect ke `cadas_app_dev`
- [ ] Row count semua tabel konten cocok dengan sumber
- [ ] Skema `students`/`payment_records`/`student_questions` sudah pakai versi ⚠️ Override, bukan versi mentah `[V3]`
- [ ] `content_release_log` tercatat
- [ ] `PracticeScreen.jsx` di React Native berhasil fetch dari backend baru

### 📝 Catatan Fase
```
Tanggal mulai        : 8 Sep 2026
Tanggal selesai      : belum (sisa: uji manual PracticeScreen di emulator/device)
Row count migrasi (exercises/explanations/upgrade_tests/speed_milestones):
  5446 / 15 / belum / belum
  (exercises & explanations terverifikasi field-per-field vs sumber;
   upgrade_tests & speed_milestones belum dimigrasi — sumber juga masih
   kosong karena Gap 1.2/1.3 FASE 1 belum dikerjakan)
Kendala yang ditemui  :
  1. pgvector tidak tersedia di image postgres:16 polos (container shared dgn
     speed-math-master, sengaja tidak di-restart) → 002 auto-skip
  2. ON CONFLICT tidak bisa infer partial unique index → perlu klausa WHERE
  3. Re-run ETL pertama merusak explanations (DELETE concepts ditolak FK dari
     exercises) → diperbaiki jadi upsert (migration 004); backtest menangkap
     sebelum jadi masalah
Perubahan dari rencana:
  1. Metode migrasi = copy-with-transform (ETL Node, 2 pool di instance yang
     sama), bukan dump/import [MG] §5.4 — skema & format ID sumber berbeda
     (ID legacy, tanpa tabel levels/concepts); hasil ~4 detik, idempotent
  2. Skema diperkaya kolom hasil audit sumber: source_id, source_concept_id,
     speech_text, quick_trick, operation, num1/num2, correct_answer,
     visualization_type (migration 003); variant jadi nullable
  3. Voice migrasi BERTAHAP: fase 1 segmen level 120/120 + viseme JSON ✅;
     fase 2 cache per-soal ~56% (resumable) — tidak blocking
  4. Verifikasi: backtest-content.js membandingkan SEMUA 5.446 soal
     field-per-field (bukan sampling) + verify-source-intact.js memastikan
     sumber tak berubah
Developer             : Cline (AI pair)
```

**3.1 — Backend auth** ✅ (8 Sep 2026)
- [x] `POST /api/auth/student/register` — teruji 201: hanya minta `name` + `kelas` (TANPA email/password, urutan [ADD] §6.2); auto-generate `username` unik + token JWT
- [x] `POST /api/auth/parent/register` — teruji 201: `name` + (`email` ATAU `phone`) + `password` (bcrypt, 10 rounds); unique constraint pada email & phone (partial index, nullable)
- [x] `POST /api/auth/parent/login` — teruji 200 (benar) / 401 (salah)
- [x] `POST /api/auth/teacher/register` — teruji 201: `name` + `email` + `password` + `teacher_type` (private/school, validated); `verified=false` default (verifikasi manual di FASE 11)
- [x] `POST /api/auth/teacher/login` — teruji 200 + `verified` flag di payload token
- [x] JWT middleware (`src/middleware/auth.js`) — `signToken(payload, ttl?)` + `verifyToken` + `requireRole(...roles)`; TTL default 30d, custom untuk gate (15m) & challenge (2m)
- [x] Parent Gate (`[V3]` §5.2) — `GET /api/auth/parent-gate/challenge` (soal perkalian 2-9 × 2-9, token 2 menit) + `POST /api/auth/parent-gate/verify` (cek jawaban → `gate_token` 15 menit)
- [x] `GET /api/auth/me` — echo payload token (uji middleware + identitas app)
- [x] Skema: `parents.password_hash` + `parents.email` (migration 006, 007); `parents.phone` dijadikan nullable + partial unique index (migration 008); `teachers.password_hash` + `students.pin_hash` (migration 006)
- [x] Uji otomatis 16 skenario — **16/16 lulus** (`src/test/test-auth.js --auto`, idempotent via email/UUID unik per run)

**3.2 — Navigasi App.jsx** ⬜ menyusul
**3.3 — Alur onboarding** ⬜ menyusul (setelah FASE 4 placement test)

### 📝 Catatan Fase
```
Tanggal mulai        : 8 Sep 2026
Tanggal selesai      : 8 Sep 2026 (backend 3.1 selesai; UI 3.2/3.3 menyusul)
Endpoint teruji      : 9 endpoint auth (register/login 3 role + parent-gate + me)
  Semua teruji via HTTP (node fetch) + test otomatis 16 skenario 16/16 lulus
Kendala yang ditemui  :
  1. parents.phone NOT NULL di skema asli (migration 001) → error 500 saat parent
     daftar email-only → diperbaiki migration 008 (phone nullable + partial
     unique index)
  2. signToken hanya terima 1 argumen → gate token tidak bisa TTL custom
     → diperbaiki signToken(payload, ttl?) dengan fallback ke TOKEN_TTL
Perubahan dari rencana:
  1. Urutan onboarding sesuai [ADD] §6.2 (OVERRIDE [V3] §5.1): siswa daftar
     TANPA email/password → placement dulu → baru orang tua daftar lengkap.
     student/register hanya bikin profil anak + token device-profile.
  2. Parent Gate challenge stateless (jawaban ditandatangani JWT 2 menit)
     → tidak perlu tabel/session di DB
Developer             : Cline (AI pair)
```

---

# FASE 3 — AUTENTIKASI, ROLE ROUTING & ONBOARDING

### 🎯 Tujuan
Tiga role (Siswa/Parent/Guru) bisa register/login. Alur onboarding siswa baru mengikuti urutan: data anak → placement (sebagai "trial" implisit) → baru registrasi lengkap orang tua.

### 📖 Dokumen wajib dibaca sebelum mulai
- `[V3]` §5.1-5.4 penuh (Alur Login/Register, Parent Gate, Profile Switcher, Navigasi App.jsx)
- `[ADD]` §6 penuh (Alur Onboarding) — **ini yang menentukan urutan layar, bukan `[V3]` §5.1 apa adanya**

### ✅ Sub-fase & tugas

**3.1 — Backend auth**
- [ ] `POST /api/auth/student/register`, `POST /api/auth/student/login`
- [ ] `POST /api/parent/register`, `POST /api/parent/login`
- [ ] `POST /api/teacher/register` + alur verifikasi (NUPTK/email sekolah/manual) — detail penuh di FASE 11, cukup skeleton dulu di sini
- [ ] JWT + `parent-gate.js` (challenge soal perkalian sederhana sebelum masuk area Parent/Guru dari sesi anak — `[V3]` §5.2)

**3.2 — Navigasi App.jsx**
- [ ] Terapkan struktur navigasi `[V3]` §5.4 (AuthStack, StudentStack, ParentStack, TeacherStack)
- [ ] `RoleSelectScreen.jsx`, `StudentRegisterScreen.jsx`, `StudentLoginScreen.jsx`, `ParentAuthScreen.jsx`, `TeacherAuthScreen.jsx` (baru semua)

**3.3 — Alur onboarding sesuai urutan `[ADD]` §6.2**
- [ ] Landing/video (di luar app atau layar pembuka tanpa login) — CTA "Tes Level Anak, Gratis"
- [ ] Form data anak minimal (nama, kelas, usia) + centang Parent Gate ringan ("Saya orang tua/wali yang mendampingi")
- [ ] **Langsung masuk Placement Test** (lihat FASE 4) — BELUM minta registrasi penuh
- [ ] `PlacementResultScreen` menampilkan "Ananda [nama] cocok mulai dari Level X" + 1-2 contoh soal preview non-interaktif
- [ ] **Baru di titik ini** — form registrasi orang tua penuh (email/HP, password)
- [ ] Layar harga (Basic/Premium, single/bundel) — **stub dulu di fase ini**, akan disambungkan penuh ke data harga sungguhan di FASE 6
- [ ] Profile Switcher untuk anak tanpa login mandiri (`[V3]` §5.3) — anak kecil, `auth_method = 'device_profile'`

### ⚠️ OVERRIDE
`[V3]` §5.1 menulis alur "Register siswa → LANGSUNG placement" tanpa menyebutkan orang tua daftar di titik mana. `[ADD]` §6 mengunci urutan ini secara eksplisit: **anak/placement dulu, registrasi lengkap orang tua BELAKANGAN** (setelah hasil placement ditunjukkan). Jangan minta registrasi email/password orang tua di awal — itu titik drop-off. Alasan lengkap: `[ADD]` §6.2 paragraf terakhir.

### 🧪 Backtest / validasi
```bash
curl -X POST http://localhost:3000/api/auth/student/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Anak","kelas":"5"}'
# Expected: 200, return student_id (BELUM minta email/password orang tua)

curl -X POST http://localhost:3000/api/parent/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Ortu","email":"test@example.com","password":"test123"}'
# Expected: 200, return parent_id + JWT

npx eslint cadas-app/src
npx expo start
# Manual: jalankan urutan onboarding di device/emulator dari awal —
# konfirmasi registrasi orang tua TIDAK muncul sebelum placement selesai
```

### 🏁 Kriteria selesai
- [ ] 3 role bisa register/login
- [ ] Urutan onboarding sesuai `[ADD]` §6.2 (anak → placement → baru orang tua)
- [ ] Parent Gate berfungsi sebelum masuk area Parent/Guru dari sesi anak
- [ ] Profile Switcher berfungsi untuk anak tanpa login mandiri

### 📝 Catatan Fase
```
Tanggal mulai        :
Tanggal selesai       :
Kendala yang ditemui  :
Perubahan dari rencana:
Developer             :
```

---

# FASE 4 — PLACEMENT TEST END-TO-END

### 🎯 Tujuan
Siswa baru wajib melalui placement test adaptif sebelum HomeScreen. Ini prioritas MVP tertinggi.

### 📖 Dokumen wajib dibaca sebelum mulai
- `[V3]` §7 penuh (Sprint 2 — Placement Test End-to-End) — instruksi endpoint dan UI paling detail ada di sini
- `DETAILED_LEVEL_PLANS_ALL_LEVELS.md` §0.2-0.4 (dirujuk oleh `[V3]`, algoritma percabangan lengkap)

### ✅ Sub-fase & tugas

**4.1 — Backend endpoint placement** (ikuti `[V3]` §7.1 persis, tiga endpoint: `start`, `submit-probe`, `result`)
- [ ] `POST /api/placement/start` — start_level = 8, ambil 10 soal probe (60% core/20% floor/20% ceiling)
- [ ] `POST /api/placement/submit-probe` — logic percabangan (akurasi ≥80% naik, <80% turun), MAX_PROBES=4
- [ ] `GET /api/placement/result/:placement_id` — hitung `placed_level` (selalu 1 level di bawah ceiling terverifikasi), `prerequisite_signals`, `speed_emphasis_flag`; MIN=1, MAX=13

**4.2 — UI**
- [ ] `PlacementScreen.jsx` — UNTIMED, tanpa hint/bot bicara, progress generik ("Soal 3 dari 10", tidak sebut level probe)
- [ ] `PlacementResultScreen.jsx` — framing positif ("Kamu akan mulai dari Level X!"), sudah dibangun kerangkanya di FASE 3, sekarang disambungkan ke data hasil sungguhan

**4.3 — Integrasi navigasi**
- [ ] Cek `placement_tests.status` setelah register/login — belum selesai → paksa ke PlacementScreen (tidak bisa back)
- [ ] `students.current_level` DAN `students.trial_level` di-set setelah placement selesai

### ⚠️ OVERRIDE
`[V3]` §7.1 endpoint `result` menulis: `UPDATE students.trial_level = placed_level`. Baris ini **tetap dijalankan apa adanya** — `trial_level` tetap diisi dari hasil placement. Yang berubah adalah **maknanya**: di `[V3]`, `trial_level` adalah gerbang akses gratis (siswa boleh latihan penuh di level itu tanpa bayar). Dengan `[ADD]` §1, **tidak ada level yang gratis diakses penuh** — `trial_level` sekarang murni **nilai tampilan** ("kamu cocok mulai dari sini") dan referensi bundel harga pertama yang ditawarkan (level pertama yang perlu dibeli = `trial_level`). Placement test itu sendiri (proses probe-nya) yang gratis, bukan level hasil placement-nya. Detail penuh: `[ADD]` §6.1.

### 🧪 Backtest / validasi
```bash
curl -X POST http://localhost:3000/api/placement/start -d '{"student_id":"<uuid>"}'
# Expected: { placement_id, probe_level: 8, problems: [...10 soal...] }

# Simulasikan 3 skenario manual:
# 1. Siswa kuat (jawab semua benar) → placed_level naik sampai mendekati 13
# 2. Siswa lemah (jawab semua salah) → placed_level turun sampai mendekati 1
# 3. Siswa medium (jawab campur) → stabil di satu titik dalam <=4 probe

psql -d cadas_app_dev -c "SELECT placed_level, verified_ceiling_level FROM placement_tests ORDER BY started_at DESC LIMIT 1;"
# Expected: placed_level = verified_ceiling_level - 1 (never at ceiling)
```

### 🏁 Kriteria selesai
- [ ] 3 endpoint placement jalan end-to-end (bukan stub)
- [ ] `trial_level` ter-set di database setelah placement selesai
- [ ] 3 skenario manual (kuat/lemah/medium) teruji
- [ ] MAX_PROBES=4 teruji (siswa dengan jawaban tidak konsisten)
- [ ] PlacementScreen tidak menampilkan hint/bot bicara
- [ ] Placement wajib, tidak bisa di-skip

### 📝 Catatan Fase
```
Tanggal mulai        :
Tanggal selesai       :
Hasil uji 3 skenario (kuat/lemah/medium) — level akhir yang didapat:
Kendala yang ditemui  :
Perubahan dari rencana:
Developer             :
```

---

# FASE 5 — PRACTICE LOOP PENYEMPURNAAN

### 🎯 Tujuan
Menerapkan perilaku bot (§0.7) dan cara penyajian soal (§0.8) dari `DETAILED_LEVEL_PLANS_ALL_LEVELS.md` ke `PracticeScreen.jsx` yang sudah jalan. Ini **penyempurnaan**, bukan membangun ulang — logic dasar dan Confidence Score dipertahankan seperti temuan audit.

### 📖 Dokumen wajib dibaca sebelum mulai
- `[V3]` §8 penuh (Sprint 3) — checklist detail ada di sini
- `[V3]` §2.2 (Data yang Sudah Solid) — **baca ini supaya tidak mengubah formula Confidence Score tanpa alasan kuat**
- `DETAILED_LEVEL_PLANS_ALL_LEVELS.md` §0.7-0.8

### ✅ Sub-fase & tugas

**5.1 — Bot Teaching Behavior**
- [ ] Retrieval-before-explanation: cek riwayat `concept_id` di `student_sessions`, exposure kedua+ langsung soal tanpa Main Explanation dulu
- [ ] Fast feedback di speed-lock level (5, 8, 9, 15): jawaban benar → respons satu kalimat pendek
- [ ] Error-pattern matching: bandingkan jawaban salah vs `explanations.common_mistakes`, tampilkan SATU pola spesifik
- [ ] Process-praise setiap 4-5 jawaban benar berturut, menyebut teknik bukan cuma waktu

**5.2 — Exercise Delivery**
- [ ] Interleaving: 10-15% soal level sebelumnya disisip di akhir urutan
- [ ] Warm-up: 3-5 soal dari level yang sudah dikuasai di awal sesi (`is_warmup: true`, tidak masuk skor)
- [ ] Cross-type randomization: acak `visualization_type` antar soal
- [ ] Mode drill: parameter `?mode=drill` — tanpa hint/quick_trick sama sekali

### 🧪 Backtest / validasi
```bash
curl "http://localhost:3000/api/exercises/5?mode=drill"
# Expected: response TIDAK mengandung field hint/quick_trick sama sekali

curl "http://localhost:3000/api/exercises/5" | jq '.[] | .is_warmup' | head -5
# Expected: beberapa true di awal array

# Manual QA dengan siswa uji:
# - Ulangi level yang sudah pernah dikerjakan → konfirmasi Main Explanation TIDAK muncul lagi
# - Jawab benar 5x di Level 8 → konfirmasi respons bot jadi singkat
# - Jawab salah dengan pola carrying error → konfirmasi hanya 1 common mistake ditampilkan
```

### 🏁 Kriteria selesai
- [ ] Semua 8 sub-item (§0.7 dan §0.8) terverifikasi via response API dan/atau uji manual
- [ ] Formula Confidence Score TIDAK diubah dari versi `useStore.js` yang sudah ada

### 📝 Catatan Fase
```
Tanggal mulai        :
Tanggal selesai       :
Kendala yang ditemui  :
Perubahan dari rencana:
Developer             :
```

---

# FASE 6 — MODEL PEMBAYARAN PER-LEVEL & BILLING MANUAL

### 🎯 Tujuan
Sistem pembayaran granular per level (Basic/Premium) berfungsi penuh, dengan alur aktivasi manual (admin toggle via WhatsApp) untuk fase awal. **Fase ini seluruhnya baru** — tidak ada padanan langsung "Sprint 6" di `[V3]`, ini gabungan revisi dari `[ADD]` §1, §2, §7.2 yang menggantikan model billing lama.

### 📖 Dokumen wajib dibaca sebelum mulai
- `[ADD]` §1, §2, §3, §7.2 penuh — **ini instruksi utama fase ini**
- `[V3]` §5.5-5.6 (untuk memahami APA yang diganti — pola UI paywall dan alur WhatsApp-nya tetap relevan, hanya logika akses yang berubah)
- `[V3]` §6.4 (endpoint admin billing — pola strukturnya dipakai, isinya disesuaikan)

### ✅ Sub-fase & tugas

**6.1 — Skema (sudah diterapkan di FASE 2, verifikasi ulang di sini)**
- [ ] Konfirmasi `students.paid_basic_up_to_level` dan `paid_premium_up_to_level` ada
- [ ] Konfirmasi `student_level_quota` ada (dipakai penuh nanti di FASE 8)

**6.2 — Logika akses per level**
- [ ] Implementasikan fungsi `getLevelAccess(student, level)` → `'locked' | 'basic' | 'premium'` (lihat `[ADD]` §1.2 untuk logic persis)
- [ ] Endpoint terpusat: `GET /api/upgrade-test/:level` mengembalikan status akses + daftar harga saat `locked` (lihat `[ADD]` §1.2 untuk bentuk response JSON)

**6.3 — Endpoint pembelian & upgrade tingkat**
- [ ] `POST /api/payment/upgrade-tier` — upgrade Basic→Premium untuk level yang sudah dibeli, bayar selisih Rp25.000 (`[ADD]` §1.2)
- [ ] `POST /api/admin/billing/activate` — Header `Authorization: Bearer {ADMIN_SECRET}`, body `{ student_id, level_target, tier, amount_idr, payment_method, proof_note, referrer_code? }` → update `paid_basic_up_to_level`/`paid_premium_up_to_level` sesuai, tulis `payment_records`
- [ ] `GET /api/admin/billing/status/:student_id` — riwayat pembayaran + level yang sudah dibuka

**6.4 — Kuota AskKak Premium (skema disiapkan di sini, dipakai penuh di FASE 8)**
- [ ] Konfirmasi angka kuota final bersama product owner: 150 corpus (batas lunak) / ~38-40 LLM (batas keras) per level — lihat `[ADD]` §3.2, ini item terbuka #1 di `[ADD]` §11

**6.5 — UI harga & pembayaran**
- [ ] Sambungkan layar harga (stub dari FASE 3) ke data harga sungguhan: Basic 1 level Rp40.000, bundel 3 level Rp100.000, Premium 1 level Rp65.000, bundel 3 level Rp165.000
- [ ] Tombol "Hubungi WhatsApp" dengan pesan pre-fill (pola dari `[V3]` §5.5 `UpgradePaywallScreen.jsx` tetap dipakai)
- [ ] **Tidak ada UI transaksi di dalam app** — hanya info harga + redirect WhatsApp (lihat `[ADD]` §7.1, ini syarat kepatuhan kebijakan toko aplikasi)

**6.6 — Alur admin manual**
- [ ] Dokumentasikan SOP: orang tua WA → admin kirim instruksi QRIS/rekening → orang tua transfer + kirim bukti → admin jalankan `POST /api/admin/billing/activate` → siswa langsung akses saat app di-refresh

### ⚠️ OVERRIDE
Seluruh §4.5, §5.5, §6.4, §9.1 (bagian cek `is_premium`) di `[V3]` yang menyebut `students.is_premium` sebagai gerbang tunggal **tidak dipakai apa adanya**. Ganti setiap referensi `is_premium` di kode manapun yang disalin dari `[V3]` dengan pemanggilan `getLevelAccess()`. Detail penuh dan alasan: `[ADD]` §1.1.

### 🧪 Backtest / validasi
```bash
# Unit test getLevelAccess() — jalankan skenario berikut:
# level <= trial_level         → harus 'basic' TIDAK BENAR lagi (lihat override FASE 4,
#                                 trial_level bukan gerbang gratis) — pastikan test ini
#                                 mengonfirmasi level manapun di luar yang dibeli = 'locked'
# level <= paid_premium_up_to_level → 'premium'
# level <= paid_basic_up_to_level (tapi > paid_premium)  → 'basic'
# selainnya                     → 'locked'

curl -X POST http://localhost:3000/api/admin/billing/activate \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"student_id":"<uuid>","level_target":9,"tier":"premium","amount_idr":65000,"payment_method":"manual_transfer","proof_note":"test"}'
# Expected: 200, payment_records bertambah 1 baris, paid_premium_up_to_level ter-update

psql -d cadas_app_dev -c "SELECT paid_basic_up_to_level, paid_premium_up_to_level FROM students WHERE id='<uuid>';"

curl http://localhost:3000/api/upgrade-test/10
# (untuk siswa yang baru beli sampai level 9) Expected: locked, dengan daftar harga
```

### 🏁 Kriteria selesai
- [ ] `getLevelAccess()` teruji untuk keempat kondisi (locked/basic/premium/upgrade-tier)
- [ ] Endpoint admin billing berfungsi end-to-end, `payment_records` terisi benar
- [ ] Tidak ada UI transaksi di dalam app (hanya info + redirect WA)
- [ ] Satu siklus penuh diuji manual: WA → admin toggle → siswa akses tanpa restart app

### 📝 Catatan Fase
```
Tanggal mulai        :
Tanggal selesai       :
Angka kuota final yang disepakati (150/38 atau revisi):
Kendala yang ditemui  :
Perubahan dari rencana:
Developer             :
```

---

# FASE 7 — FAST TRACK & UPGRADE TEST SUNGGUHAN

### 🎯 Tujuan
`FastTrackScreen.jsx` berhenti jadi placeholder — jadi ujian naik level sungguhan, dengan paywall yang benar sesuai model per-level dari FASE 6.

### 📖 Dokumen wajib dibaca sebelum mulai
- `[V3]` §9 penuh (Sprint 4) — struktur endpoint dan UI paling detail ada di sini
- `[ADD]` §1.1 (progres linear, bundel = level berurutan berikutnya) — **penting untuk memahami batas Fast Track**

### ✅ Sub-fase & tugas

**7.1 — Backend**
- [ ] `GET /api/upgrade-test/:level` — panggil `getLevelAccess()` dari FASE 6; jika `locked` return 403 `PREMIUM_REQUIRED` dengan daftar harga; jika `basic`/`premium` lanjut ambil upgrade_test yang belum pernah dipakai siswa ini
- [ ] `POST /api/upgrade-test/:test_id/submit` — hitung akurasi+waktu, terapkan `pass_criteria` sesuai `test_type` (A/B/C), PASS → `students.current_level += 1`

**7.2 — UI FastTrackScreen.jsx (tulis ulang total)**
- [ ] Fetch upgrade_test → 403 → navigate ke layar harga (FASE 6) → selesai
- [ ] Sukses → intro (jumlah soal, batas waktu) → soal tanpa hint, timer terlihat+enforced untuk Type B/C
- [ ] Submit → hasil dari backend → PASS: animasi + `SessionResultScreen` dengan flag `level_up`; FAIL: tawarkan speed drill (`mode=drill` dari FASE 5)

**7.3 — Pesan bot per skenario** (hardcode, ikuti `[V3]` §9.3/§9.4 persis — daftar skrip lengkap ada di sana)
- [ ] Pass tepat target, pass jauh lebih cepat, fail speed (akurasi OK), fail speed Level 9 (skrip non-negotiable khusus), stuck 5x (tawarkan accuracy reset mode)

### ⚠️ OVERRIDE
`[V3]` §9.1 menulis: `Cek students.is_premium — jika false, return 403`. Ganti dengan: cek `getLevelAccess(student, level)` dari FASE 6 — jika `'locked'`, return 403 `PREMIUM_REQUIRED` beserta harga level tersebut (single/bundel Basic/Premium). Penting juga: Fast Track **tidak pernah melompati level yang belum dibeli** — siswa yang lulus upgrade test di level yang sudah dibayar tetap berhenti di paywall begitu mencapai level yang belum dibeli, walau Confidence Score-nya tinggi. Lihat `[ADD]` §1.1 untuk penegasan progres linear ini.

### 🧪 Backtest / validasi
```bash
curl http://localhost:3000/api/upgrade-test/10
# (siswa yang belum beli level 10) Expected: 403, body berisi kode PREMIUM_REQUIRED + pricing

# Manual: siswa dengan Confidence Score >0.85 di level yang SUDAH dibeli
# → Fast Track banner muncul → tes berjalan dengan timer sesuai test_type
# Manual: siswa dengan Confidence Score >0.85 di level yang BELUM dibeli
# → tetap diarahkan ke layar harga, TIDAK diberi ujian gratis

# Uji Type B/C: biarkan timer habis tanpa submit → konfirmasi auto-submit terjadi
```

### 🏁 Kriteria selesai
- [ ] Paywall gate berfungsi benar sesuai level spesifik (bukan global)
- [ ] Timer enforcement teruji untuk Type B dan C
- [ ] Level 9 punya pesan khusus non-negotiable
- [ ] Siswa gagal 5x mendapat opsi accuracy reset
- [ ] `students.current_level` ter-update benar setelah pass

### 📝 Catatan Fase
```
Tanggal mulai        :
Tanggal selesai       :
Kendala yang ditemui  :
Perubahan dari rencana:
Developer             :
```

---

# FASE 8 — RAG PIPELINE & ASKKAK (HYBRID: LEXICAL → SEMANTIC → OPENROUTER)

### 🎯 Tujuan
`AskKakScreen.jsx` berhenti jadi placeholder. Fitur bertingkat sesuai Basic/Premium per level (bukan tier global), dengan kontrol biaya OpenRouter yang eksplisit.

### 📖 Dokumen wajib dibaca sebelum mulai
- `[V3]` §10 penuh (Sprint 5) — struktur 5-langkah pipeline, **baca dengan pemahaman bahwa Step 3 "Ollama Fallback" dibaca sebagai "OpenRouter Fallback"** (lihat ⚠️ Override utama di kepala dokumen ini)
- `[ADD]` §3 penuh (Kuota AskKak Premium)
- `[ADD]` §10 penuh (Kontrol Biaya AskKak — ringkasan lima aturan wajib)
- `[MG]` §4.3 (arsitektur pipeline, untuk konteks kenapa corpus disiapkan dengan cara tertentu)

### ✅ Sub-fase & tugas

**8.1 — Salin modul dari speed-math-master**
- [ ] Salin `normalizer.js` ke `cadas-app-backend/src/rag/normalizer.js`
- [ ] Salin fungsi `generateTTS`/`pcmToWav` dari `gemini-client.js` ke `cadas-app-backend/src/rag/gemini-tts.js`
- [ ] **Buat baru** `cadas-app-backend/src/rag/openrouter-client.js` (bukan menyalin `ollama-client.js`) — panggilan HTTP biasa ke OpenRouter API

**8.2 — Layer 1 & 2 (Lexical + Semantic, jalan untuk SEMUA tier)**
- [ ] Lexical search: match by `concept_id` + `level`, exact/fuzzy text search di `explanations`
- [ ] Semantic search: hitung embedding sekali saat impor konten (di FASE 2), simpan di `explanations_embedding`; similarity ≥0.85 pakai langsung, 0.60-0.85 pakai sebagai few-shot context, <0.60 lanjut/berhenti sesuai tier

**8.3 — Layer 3 (OpenRouter Fallback, HANYA untuk akses Premium level tersebut)**
- [ ] Panggil hanya jika `getLevelAccess(student, level) == 'premium'` **dan** `student_level_quota.llm_calls_used < 40` (lihat `[ADD]` §3.2)
- [ ] System prompt: identitas guru hangat, aturan bahasa (dari `PRIMING_STRUKTUR_BOT_TUTOR`), struktur GASING/PMRI/Quick + few-shot dari Layer 2
- [ ] **System prompt membatasi topik** — tolak sopan kalau pertanyaan di luar topik matematika yang sedang dipelajari (`[ADD]` §10)
- [ ] **Kirim ID anonim saja ke OpenRouter, bukan nama asli siswa** (`[ADD]` §10)
- [ ] Cache hasil ke `student_questions` (dedup via `question_hash`)
- [ ] Setelah panggilan sukses: `UPDATE student_level_quota SET llm_calls_used = llm_calls_used + 1`

**8.4 — Circuit breaker biaya (`[ADD]` §10)**
- [ ] Hitung total pengeluaran OpenRouter harian/bulanan (dari log biaya per panggilan)
- [ ] Kalau melewati ambang yang disepakati → AskKak otomatis masuk mode "sementara tidak tersedia" untuk seluruh siswa premium, bukan terus memanggil API tanpa batas

**8.5 — Layer 4: Normalisasi (SELALU, apapun sumber teksnya)**
- [ ] Jalankan `normalizer.js` terhadap teks final sebelum dikirim ke TTS

**8.6 — Layer 5: Output sesuai tingkat akses level tersebut**
- [ ] `'premium'` untuk level itu → Gemini TTS live → `audio_url` + teks
- [ ] `'basic'`/`'locked'-tapi-masih-boleh-tanya-dari-corpus` → cari audio pregenerated terdekat by `concept_id`; ketemu → return; tidak ketemu → teks saja + pesan upgrade (bukan generic "Upgrade ke Premium" global — sebutkan level spesifik yang perlu di-upgrade)

**8.7 — UI AskKakScreen.jsx (tulis ulang total)**
- [ ] Avatar (state idle/listening/thinking/speaking — detail penuh state di FASE 9)
- [ ] Tab varian: GASING | PMRI | Quick
- [ ] Input teks selalu ada; tombol mic **hanya tampil** (bukan disabled) jika akses level = `'premium'`
- [ ] Tombol play audio jika `audio_url` ada
- [ ] Rating "Membantu?" → `student_explanation_effectiveness_log`

**8.8 — Perilaku setelah kuota LLM habis**
- [ ] Turun otomatis ke perilaku Basic untuk level itu (jawaban dari corpus saja), pesan sopan dari avatar, bukan blokir keras (`[ADD]` §3.2)

**8.9 — Validasi viseme**
- [ ] Uji manual minimal 10 kalimat sampel Bahasa Indonesia dari Gemini TTS — konfirmasi akurasi viseme sebelum fase ini dianggap selesai (`[V3]` §10.3)

### ⚠️ OVERRIDE
Seluruh "Ollama" di `[V3]` §10.1 Step 3 dan `[MG]` §4.3 dibaca sebagai "OpenRouter". Trigger Layer 3 di `[V3]` ("HANYA jika `students.is_premium = true`") diganti "HANYA jika `getLevelAccess(student, level) == 'premium'` **dan** kuota belum habis" — dua syarat, bukan satu. Lihat `[ADD]` §1.3 (tabel fitur per tingkat) dan §3 (kuota) untuk detail penuh.

### 🧪 Backtest / validasi
```bash
curl -X POST http://localhost:3000/api/rag/ask \
  -d '{"student_id":"<uuid>","question_text":"7 tambah 4 berapa?","level":5}'
# Expected: response punya field "source": "lexical"|"semantic"|"openrouter",
#           dan response_time_ms masuk akal (lexical <50ms, openrouter beberapa detik)

# Simulasikan 40 panggilan OpenRouter berturut untuk 1 siswa di 1 level:
# Expected: panggilan ke-40+ otomatis fallback ke corpus, bukan terus panggil OpenRouter

curl -X POST http://localhost:3000/api/rag/ask \
  -d '{"student_id":"<uuid>","question_text":"Siapa presiden Indonesia?","level":5}'
# Expected: bot menolak sopan, tetap dalam topik matematika

# Manual: 10 kalimat sampel TTS didengar, viseme dicocokkan visual dengan audio
```

### 🏁 Kriteria selesai
- [ ] Pipeline 3-layer jalan end-to-end, `source` di response mencerminkan layer yang benar-benar menjawab
- [ ] Kuota LLM per level ditegakkan (bukan cuma dicatat, tapi benar-benar memblokir setelah batas)
- [ ] System prompt membatasi topik, teruji
- [ ] Tombol mic tersembunyi (bukan disabled) untuk level yang bukan premium
- [ ] Circuit breaker biaya global berfungsi
- [ ] Viseme diuji manual 10 kalimat

### 📝 Catatan Fase
```
Tanggal mulai        :
Tanggal selesai       :
Hasil uji viseme (akurat/perlu penyesuaian):
Kendala yang ditemui  :
Perubahan dari rencana:
Developer             :
```

---

# FASE 9 — AVATAR RIVE & GAMIFICATION

### 🎯 Tujuan
`BotCharacter.jsx` beralih dari Image+Animated ke Rive (jika `.riv` sudah tersedia), dengan state machine yang sudah dipetakan lengkap. Gamification berpusat di reaksi avatar, bukan sistem poin terpisah.

### 📖 Dokumen wajib dibaca sebelum mulai
- `[ADD]` §8 penuh (Gamification & Avatar Rive) — ini instruksi utama fase ini
- `[V3]` §13.2 (langkah instalasi teknis Rive)

### ✅ Sub-fase & tugas

**9.1 — Pemetaan state avatar (lakukan SEBELUM produksi animasi, bukan sesudah)**
- [ ] Petakan minimal 8 state: benar (percobaan pertama vs berulang), salah (percobaan pertama vs berulang), sedang berpikir/AskKak, merayakan streak, merayakan naik level normal, merayakan Fast Track, menyambut kembali setelah absen, idle
- [ ] Rancang API state machine sempit: satu input "mood" (enum: senang/berpikir/mendorong-semangat/merayakan) + satu trigger

**9.2 — State "berpikir" (kritis secara teknis, bukan cuma estetika)**
- [ ] Loop animasi berpikir yang menutupi latency OpenRouter (~1-4 detik dari FASE 8) — sinkronkan durasi loop dengan latency nyata yang terukur di FASE 8

**9.3 — Validasi viseme (jika belum dilakukan di FASE 8)**
- [ ] Konfirmasi ulang hasil uji viseme FASE 8 — putuskan: rig penuh viseme, atau gerak mulut ritmis sederhana jika akurasi kurang meyakinkan

**9.4 — Integrasi Rive (jika `.riv` sudah selesai dari tim desain)**
- [ ] Install `@rive-app/react-native`
- [ ] Swap `BotCharacter.jsx` ke Rive
- [ ] Connect `botState` (sudah granular 8 nilai di `useStore.js`) ke Rive state machine input
- [ ] Connect `visemeData` (sudah ada di store) ke Rive mouth shapes

**9.5 — Gamification berpusat avatar**
- [ ] Reward mikro per soal benar: reaksi avatar + animasi Confidence Score naik — **bukan** angka XP terpisah
- [ ] Companion growth berdasarkan konsistensi (streak, penyelesaian level) — **bukan** akurasi, supaya anak yang lambat/sering salah tetap punya jalur merasa berhasil
- [ ] Momen naik level (jalur normal) dapat perayaan sendiri, terpisah dari perayaan Fast Track

### 🧪 Backtest / validasi
```bash
npx eslint cadas-app/src
npx expo start
# Manual: trigger tiap state satu per satu, konfirmasi tidak ada crash dan
# transisi antar state terlihat wajar (tidak patah/lompat)

# Ukur latency riil OpenRouter dari FASE 8, konfirmasi loop "berpikir"
# durasinya proporsional (tidak terlalu pendek sehingga terpotong,
# tidak terlalu panjang sehingga terasa lambat)
```

### 🏁 Kriteria selesai
- [ ] Seluruh state avatar dipetakan dan diimplementasikan (minimal 8)
- [ ] State "berpikir" menutupi latency OpenRouter secara natural
- [ ] Reward mikro dan companion growth berjalan sesuai prinsip (bukan sistem poin terpisah)
- [ ] (Jika `.riv` tersedia) Rive terintegrasi penuh, tidak ada crash di state manapun

### 📝 Catatan Fase
```
Tanggal mulai            :
Tanggal selesai           :
Status file .riv (tersedia/belum — jika belum, BotCharacter tetap Image+Animated):
Kendala yang ditemui      :
Perubahan dari rencana    :
Developer                 :
```

---

# FASE 10 — PARENT DASHBOARD, FOCUS SCORE & NOTIFIKASI

### 🎯 Tujuan
Role Parent fungsional penuh — linking, dashboard, analytics, Focus Score (bukan off-app detection), laporan malam, dan reminder sesi.

### 📖 Dokumen wajib dibaca sebelum mulai
- `[V3]` §11 penuh (Sprint 6) — struktur endpoint dan UI dasar
- `[ADD]` §9 penuh (Push Notification) — fitur baru yang tidak ada di `[V3]`

### ✅ Sub-fase & tugas

**10.1 — Backend dasar** (ikuti `[V3]` §11.1)
- [ ] `POST /api/parent/link-child`, `GET /api/parent/dashboard/:parent_id`, `GET /api/parent/analytics/:student_id`
- [ ] `GET /api/billing/status/:student_id` — **sesuaikan response-nya ke model per-level** (bukan `is_premium` boolean tunggal): kembalikan `paid_basic_up_to_level`, `paid_premium_up_to_level`, `trial_level` (nilai tampilan saja, lihat FASE 4 Override)

**10.2 — UI**
- [ ] `ParentDashboardScreen.jsx` — ringkasan per anak, badge status per level (bukan badge "Trial"/"Premium" global tunggal seperti `[V3]` §11.2 — tampilkan sampai level berapa Basic dan sampai level berapa Premium)
- [ ] `ParentAnalyticsScreen.jsx`, `ManageChildrenScreen.jsx`

**10.3 — Focus Score** (ikuti `[V3]` §11.3 persis — bagian ini tidak berubah)
- [ ] Track switch app/tab selama practice session (`AppState` React Native)
- [ ] Track idle time (sudah ada partial di `PracticeScreen.jsx`)
- [ ] Track time-to-first-answer per soal
- [ ] Tampilkan sebagai "Skor Fokus" dengan copy jujur: "seberapa fokus waktu latihan di app," bukan klaim aktivitas HP lain

**10.4 — Laporan malam** (`[ADD]` §9.1, fitur baru)
- [ ] Preset waktu sederhana (pagi/siang/malam), bukan time-picker bebas
- [ ] Dua template: berlatih hari itu (ringkasan + satu highlight) vs belum berlatih (pengingat lembut)
- [ ] Setup FCM (Firebase Cloud Messaging)

**10.5 — Reminder sesi** (`[ADD]` §9.2, fitur baru)
- [ ] Pengaturan per anak di Parent Dashboard: mode "sesi terjadwal" (jam tetap) vs "sesi bebas" (pengingat generik jika belum ada sesi sampai jam tertentu)
- [ ] Reminder terakhir hari itu dikirim minimal 2-3 jam sebelum tengah malam
- [ ] Tidak spam ulang — cukup masuk laporan malam kalau sudah diingatkan sekali

### ⚠️ OVERRIDE
`[V3]` §11.2 menulis "badge Trial atau Premium per anak" (biner). Ganti dengan tampilan level-spesifik sesuai model FASE 6: contoh "Basic sampai Level 9, Premium sampai Level 7" (dua angka, karena Basic dan Premium bisa berbeda batas level).

### 🧪 Backtest / validasi
```bash
curl http://localhost:3000/api/billing/status/<student_id> -H "Authorization: Bearer <parent_jwt>"
# Expected: { paid_basic_up_to_level, paid_premium_up_to_level, trial_level, ... }
# BUKAN { is_premium: true/false }

# FCM: kirim test notification ke device token test
# Expected: notifikasi diterima di device

# Manual: set reminder "sesi terjadwal" jam 16:00, tunggu/simulasikan waktu
# Expected: notifikasi terkirim tepat jam 16:00

# Manual: set reminder "sesi bebas", jangan buka app sampai 18:00
# Expected: satu notifikasi generik terkirim, TIDAK berulang setelahnya
```

### 🏁 Kriteria selesai
- [ ] Parent bisa register, link ke anak, lihat dashboard
- [ ] Status akses level per anak ditampilkan akurat (bukan biner Trial/Premium)
- [ ] Focus Score tampil dengan framing jujur
- [ ] Laporan malam terkirim sesuai preset waktu
- [ ] Reminder sesi (kedua mode) berfungsi, tidak spam

### 📝 Catatan Fase
```
Tanggal mulai        :
Tanggal selesai       :
Kendala yang ditemui  :
Perubahan dari rencana:
Developer             :
```

---

# FASE 11 — GURU DASHBOARD, SISTEM REFERRAL & KELOMPOK

### 🎯 Tujuan
Role Guru fungsional (classroom, consent, assignment), sistem referral dengan alur pengajuan yang diformalkan, dan pembelian kelompok.

### 📖 Dokumen wajib dibaca sebelum mulai
- `[V3]` §12 penuh (Sprint 7) — struktur classroom, consent, dan sistem token referral dasar
- `[ADD]` §4, §5, §2.2 penuh — **override komisi dan alur pengajuan, baca ini SETELAH `[V3]` §12 supaya paham apa yang diganti**

### ✅ Sub-fase & tugas

**11.1 — Backend Classroom & Consent** (ikuti `[V3]` §12.1-§12.2, §12.4-§12.5 apa adanya — bagian ini TIDAK berubah)
- [ ] `POST /api/teacher/verify`, `/api/teacher/classrooms`, `/api/teacher/assignments`, dst
- [ ] `POST /api/classroom/join` (parent submit kode + consent), `DELETE /api/classroom/students/:id` (parent revoke kapan saja)
- [ ] Consent flow: layar menampilkan persis apa yang guru bisa/tidak bisa lihat, sebelum parent konfirmasi
- [ ] Permission boundary di-enforce di **backend**, bukan cuma UI: Focus Score dan billing REJECT untuk query guru

**11.2 — Skema referrer (sesuai `[V3]` §4.4 kolom `referrers`/`teachers.teacher_type`, DITAMBAH kolom dari `[ADD]` §5.2)**
```sql
ALTER TABLE referrers ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE referrers ADD COLUMN application_data JSONB;
ALTER TABLE referrers ADD COLUMN reviewed_by VARCHAR(100);
ALTER TABLE referrers ADD COLUMN reviewed_at TIMESTAMP;
ALTER TABLE referrers ADD COLUMN rejection_reason TEXT;
ALTER TABLE referrers ADD COLUMN last_rejected_at TIMESTAMP;
```

**11.3 — Alur pengajuan & approval per tipe referrer** (`[ADD]` §5.3-§5.6, ini menggantikan asumsi `[V3]` §12.1-12.2 bahwa guru terverifikasi otomatis dapat token)
- [ ] `teacher_school` — tidak perlu mengajukan, otomatis approved setelah verifikasi NUPTK/email sekolah selesai
- [ ] `parent` — otomatis approved begitu syarat teknis terpenuhi (≥1 anak ter-link + placement selesai); token langsung aktif
- [ ] `teacher_private`/`affiliate`/`other` — formulir pengajuan (field sesuai `[ADD]` §5.4) → `pending` → review manual admin → `approved`/`rejected`; ditolak → jeda 14 hari sebelum bisa mengajukan ulang
- [ ] `student` — tidak ada formulir terpisah, syarat usia 13+ + consent orang tua + `is_premium` (sekarang: minimal satu level Premium terbeli) sudah jadi gerbang (`[V3]` §12.3 bagian Referral Siswa tetap berlaku apa adanya)
- [ ] Endpoint admin: `POST /api/admin/referrals/:id/approve`, `/reject`, `/revoke` (pola sama dengan `ADMIN_SECRET` dari FASE 6)
- [ ] Token (`cadas.app/d/xxxxx`) baru di-generate saat `status = 'approved'`, **bukan** saat submit formulir

**11.4 — Tripwire otomatis untuk `parent`** (`[ADD]` §5.5, karena auto-approved tanpa review manual)
- [ ] Background job: jika satu `referrer_id` tipe `parent` menghasilkan >10 konversi berbayar dalam 30 hari → flag masuk antrean review yang sama dengan `teacher_private`/`affiliate` (token TIDAK dicabut otomatis, hanya ditandai untuk dicek admin)

**11.5 — Sistem token & attribution** (ikuti `[V3]` §12.3 bagian "Sistem Token" apa adanya — ini TIDAK berubah)
- [ ] `GET /d/:token` — catat `download_clicks`, redirect ke halaman download
- [ ] Saat register: cocokkan IP dalam window 2 jam ke `download_clicks` yang belum `attributed`

**11.6 — Komisi** (⚠️ Override — lihat di bawah)
- [ ] Hitung `commission_amount_idr` di `payment_records` **setiap kali baris baru dibuat** (satu kali per transaksi level/bundel yang dibeli), bukan proses berkala bulanan
- [ ] Tier (Mitra/Andalan/Utama) tetap dihitung dari `total_active_referrals` seperti `[V3]` §12.3, tapi update tier terjadi setiap `payment_records` baru masuk — hapus logika "atau siswa churn" dari `[V3]`

**11.7 — Kelompok/bulk purchase** (`[ADD]` §2.2, item terbuka #2 di `[ADD]` §11 — rancang endpoint sendiri, belum ada skeleton di dokumen sumber manapun)
- [ ] Rancang endpoint baru (usulan: `POST /api/admin/billing/activate-bulk`) — satu payer, banyak `student_id` sekaligus, satu `batch_id`/invoice untuk rekonsiliasi, tiap siswa tetap dapat baris `payment_records` sendiri dengan `amount_idr` sesuai harga kelompok (lihat tabel harga di `[ADD]` §2.2)
- [ ] Syarat minimal 10 siswa per transaksi kelompok
- [ ] UI sederhana untuk guru memasukkan daftar siswa yang dibayari sekaligus

### ⚠️ OVERRIDE
`[V3]` §12.3 bagian "Tier Komisi" menulis rate "10% recurring per bulan" dan "Update tier ... atau siswa churn (berhenti langganan)". Ganti seluruh bahasa ini: komisi dihitung **satu kali per transaksi** (persentase dari `amount_idr` di baris `payment_records` itu), tidak ada siklus bulanan, tidak ada konsep churn karena tidak ada langganan. Detail dan alasan penuh: `[ADD]` §4.1.

### 🧪 Backtest / validasi
```bash
# Uji alur pengajuan teacher_private:
curl -X POST http://localhost:3000/api/referrals/apply \
  -d '{"type":"teacher_private","name":"...","whatsapp":"...", ...}'
# Expected: status pending, TIDAK ada token di response

curl -X POST http://localhost:3000/api/admin/referrals/<id>/approve -H "Authorization: Bearer $ADMIN_SECRET"
# Expected: status approved, token ter-generate

curl http://localhost:3000/d/<token>
# Expected: redirect, baris baru di download_clicks

# Register siswa dalam 2 jam dari IP yang sama:
# Expected: students.referred_by ter-set otomatis

curl -X POST http://localhost:3000/api/admin/billing/activate \
  -d '{"student_id":"<uuid>","level_target":6,"tier":"basic","amount_idr":40000,"referrer_code":"<token>"}'
psql -d cadas_app_dev -c "SELECT commission_amount_idr FROM payment_records ORDER BY created_at DESC LIMIT 1;"
# Expected: nilai komisi terisi benar (persentase dari 40000, bukan 0/null)

# Uji tripwire: buat >10 payment_records untuk referrer tipe parent dalam simulasi 30 hari
# Expected: masuk antrean review, token TETAP AKTIF
```

### 🏁 Kriteria selesai
- [ ] Guru sekolah dan guru les punya alur register berbeda, tidak ada UI komisi untuk guru sekolah
- [ ] Alur pengajuan referrer berfungsi sesuai tipe (auto/manual/tidak perlu)
- [ ] Token baru aktif setelah `approved`, bukan saat submit
- [ ] Komisi dihitung per transaksi, bukan bulanan
- [ ] Tripwire parent berfungsi tanpa mencabut akses otomatis
- [ ] Endpoint bulk purchase kelompok berfungsi, minimal 10 siswa per transaksi
- [ ] Backend reject query guru untuk data Focus Score/billing

### 📝 Catatan Fase
```
Tanggal mulai        :
Tanggal selesai       :
Desain endpoint bulk purchase yang dipakai (jika berbeda dari usulan):
Kendala yang ditemui  :
Perubahan dari rencana:
Developer             :
```

---

# FASE 12 — POLISH, OFFLINE, BETA TEST

### 🎯 Tujuan
Aplikasi siap diuji oleh pengguna nyata — offline support jujur, avatar final, dan siklus beta lengkap.

### 📖 Dokumen wajib dibaca sebelum mulai
- `[V3]` §13 penuh (Sprint 8)

### ✅ Sub-fase & tugas

**12.1 — Offline support** (ikuti `[V3]` §13.1 apa adanya)
- [ ] Cache soal level aktif ke AsyncStorage
- [ ] Cache audio yang sudah pernah diputar (replay-only, bukan generate baru)
- [ ] Copy jujur di Settings: "Latihan bisa offline penuh. Penjelasan yang sudah pernah didengar bisa diputar ulang offline. Penjelasan baru dan suara premium butuh internet."

**12.2 — Rive final** (jika belum selesai di FASE 9)
- [ ] Selesaikan swap ke Rive jika `.riv` baru tersedia sekarang

**12.3 — Beta test** (ikuti `[V3]` §13.3, tambahkan validasi pembayaran kelompok)
- [ ] 3-5 siswa nyata (SD kelas 4-6) — placement + practice + fast track
- [ ] 2-3 orang tua — linking + dashboard + **proses pembayaran manual end-to-end per level**
- [ ] 1-2 guru — classroom + consent + **jika relevan, uji pembelian kelompok**
- [ ] Validasi satu siklus pembayaran: orang tua WA → admin toggle level spesifik → siswa langsung akses level itu saja (bukan semua level)
- [ ] Catat soal yang sering salah, hint yang membantu, apakah placement terasa akurat, apakah kuota AskKak terasa cukup untuk pemakaian wajar

### 🧪 Backtest / validasi
```bash
# Matikan koneksi internet di device uji
# Expected: latihan di level aktif tetap berjalan, audio yang sudah pernah
# diputar bisa diulang, penjelasan baru menampilkan pesan butuh internet
# (bukan crash atau macet)

npx eslint cadas-app/src --max-warnings=0
cd cadas-app-backend && npm run lint
```

### 🏁 Kriteria selesai
- [ ] Offline berjalan sesuai klaim yang jujur (tidak lebih, tidak kurang dari yang dijanjikan di UI)
- [ ] Seluruh siklus beta test selesai dengan catatan tertulis
- [ ] Minimal satu siklus pembayaran manual per-level tervalidasi langsung dengan orang tua nyata

### 📝 Catatan Fase
```
Tanggal mulai              :
Tanggal selesai             :
Ringkasan temuan beta test  :
Kendala yang ditemui        :
Perubahan dari rencana      :
Developer                   :
```

---

# FASE 13 — DISTRIBUSI & RILIS PRODUKSI

### 🎯 Tujuan
Aplikasi live dan bisa diunduh pengguna nyata, sesuai strategi distribusi yang dipilih (hindari toko aplikasi untuk pembayaran).

### 📖 Dokumen wajib dibaca sebelum mulai
- `[ADD]` §7.1 penuh (Hindari Toko Aplikasi untuk Pembayaran)
- `[V3]` §15 penuh (Checklist Sebelum Beta Test — dipakai ulang di sini sebagai checklist pra-rilis, sesuaikan judul mentalnya jadi "pra-produksi")

### ✅ Sub-fase & tugas

**13.1 — Build produksi**
- [ ] Build APK Android (`eas build` jika pakai Expo, atau `./gradlew assembleRelease` jika bare React Native)
- [ ] Konfirmasi **tidak ada** mekanisme pembelian di dalam APK (tidak ada tombol yang memproses transaksi, hanya info harga + redirect WhatsApp — verifikasi ulang FASE 6.5)
- [ ] Setup halaman download di website Cadas untuk distribusi APK langsung
- [ ] (Opsional) listing Play Store tanpa mekanisme IAP sama sekali, jika ingin tambahan kanal discovery

**13.2 — iOS (ditunda, siapkan alternatif)**
- [ ] Pastikan versi web/PWA (Add to Home Screen dari Safari) berfungsi untuk kebutuhan dasar (latihan soal + dashboard orang tua), sebagai pengganti sementara sebelum native iOS dikerjakan

**13.3 — Infrastruktur produksi**
- [ ] Deploy `cadas-app-backend` ke server produksi (AWS EC2 atau setara)
- [ ] Migrasi database produksi terpisah dari `cadas_app_dev` (development) — jalankan skrip migrasi `[MG]` §5.4 ke database produksi
- [ ] Environment variables produksi: `ADMIN_SECRET`, OpenRouter API key, Gemini TTS API key — pastikan berbeda dari kredensial development

**13.4 — Checklist final** (jalankan seluruh isi `[V3]` §15, dengan penyesuaian sesuai override dokumen ini — terutama bagian BILLING & PAYMENT yang perlu dibaca sebagai "per level", bukan status premium global)

```
BACKEND:
[ ] cadas-app-backend live produksi, connect ke database produksi
[ ] Semua endpoint 3 role return data benar
[ ] RAG: tier non-premium tidak pernah panggil OpenRouter, tier premium
    cache mencegah generate ulang, kuota per level ditegakkan
[ ] TTS premium (Gemini live) dan standard (pregenerated) keduanya jalan
[ ] Endpoint admin billing berfungsi: update level akses, tulis payment_records

REACT NATIVE:
[ ] Semua screen bisa dibuka tanpa crash
[ ] Placement WAJIB dan tidak bisa di-skip untuk siswa baru
[ ] Paywall muncul benar per-level (bukan blanket semua level)
[ ] AskKak: mic tersembunyi untuk level non-premium
[ ] AskKak: OpenRouter tidak pernah dipanggil di luar kuota/tier premium
[ ] Parent Gate berfungsi
[ ] Parent dashboard menampilkan status per-level dengan jelas
[ ] Guru sekolah: tidak ada UI komisi
[ ] Guru les: token ada, komisi terhitung benar per transaksi
[ ] Attribution IP berfungsi
[ ] Variant naming gasing/pmri/quick konsisten di semua tempat

BILLING & PAYMENT:
[ ] Siklus pembayaran manual per-level teruji end-to-end
[ ] Tidak ada UI transaksi di dalam app
[ ] payment_records terisi benar, termasuk untuk pembelian kelompok

UX:
[ ] Placement terasa seperti penilaian ramah
[ ] Paywall muncul di momen tepat (setelah kuasai level, bukan di tengah latihan)
[ ] Consent flow guru-parent transparan
[ ] Copy offline dan Focus Score jujur
[ ] Touch target minimal 44×44px
```

### 🧪 Backtest / validasi
```bash
# Build APK, install di device fisik (bukan emulator), uji dari nol:
# download → install → register → placement → practice → paywall → WA → aktivasi admin → akses level

curl https://<domain-produksi>/api/health
# Expected: 200, response cepat (<500ms)
```

### 🏁 Kriteria selesai
- [ ] Seluruh checklist §13.4 tercentang
- [ ] APK bisa diunduh dan diinstall dari kanal distribusi yang dipilih
- [ ] Minimal 1 siklus pembayaran nyata (bukan simulasi) berhasil di lingkungan produksi

### 📝 Catatan Fase
```
Tanggal mulai        :
Tanggal rilis         :
Kanal distribusi yang dipakai (APK langsung / Play Store tanpa IAP / keduanya):
Kendala yang ditemui  :
Perubahan dari rencana:
Developer             :
```

---

# PENUTUP

Dokumen ini mencakup seluruh jalur dari kondisi kode saat ini (hasil audit `[MG]`/`[V3]`) sampai rilis produksi, dengan tiga override kunci (OpenRouter, pembayaran per-level, komisi per-transaksi) ditandai eksplisit di setiap fase yang tersentuh. Developer yang mengikuti fase demi fase secara berurutan, membaca dokumen sumber yang dirujuk di tiap fase, dan mengisi Catatan Fase setelah tiap fase selesai — akan punya jejak lengkap kenapa keputusan tertentu diambil, bukan cuma daftar tugas kosong.

**Kalau ada perubahan keputusan besar setelah dokumen ini dipakai** (misalnya angka kuota AskKak direvisi, atau desain bulk purchase berbeda dari usulan FASE 11), catat di Catatan Fase terkait — dokumen ini tidak perlu ditulis ulang untuk perubahan kecil, cukup catatan fase yang jadi sumber kebenaran untuk apa yang benar-benar terjadi vs apa yang direncanakan.
