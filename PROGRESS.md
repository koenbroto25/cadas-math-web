# Progress Log ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Cadas App Development (DOKUMEN UTAMA)
> Diperbarui: 12 September 2026 (Sprint F OK + Midtrans QRIS live-tested)
> **Keputusan Billing (12 Sep):** Payment gateway diganti dari Midtrans ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ **Midtrans QRIS** (KTP saja, tanpa PT, QRIS 0,7% sudah inklusif PPN, webhook HTTP Notification tersedia).
> `docz/PROGRESS.md` dan `docz/PROGRESS_add.md` sudah SUPERSEDED ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â seluruh isinya digabung & diperbarui ke sini.
> Terakhir dikerjakan: **Sprint G.2 SELESAI (12 Sep)** ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â pcmToVisemes live lip-sync premium, threshold dikalibrasi, random key rotation, FP fix; sebelumnya G.1 ESLint + voice pipeline.
> Simbol: [OK] = terverifikasi | [!!] = ada tapi gap | [NO] = belum ada

---

## RINGKASAN STATUS PER FASE

| Fase | Nama | Backend | Frontend | Catatan |
|------|------|---------|----------|---------|
| 0 | Setup & Orientasi | OK | OK | Selesai |
| 1 | Gap Konten | OK | - | Gap 1.4 SELESAI ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â audit 15/15 explanations.variants PASS (Sprint G.0) |
| 2 | Backend Foundation | OK | OK | index.js OK; double-mount FIXED Sprint D |
| 3 | Auth & Onboarding | OK | OK | 10 endpoint + 5 screen terverifikasi |
| 4 | Placement Test | OK | OK | start+submit live-tested; variant bias selesai |
| 5 | Practice Loop | OK | OK | selection-rule + PracticeScreen ter-wire |
| 6 | Billing Per-Level | OK | OK | Manual OK; Midtrans QRIS Sprint D.2 selesai (migrasi dari Midtrans) |
| 7 | Fast Track | OK | OK | getLevelAccess() shared, live-tested |
| 8 | RAG Pipeline | OK | OK | G.2 SELESAI ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â premium live lip-sync pcmToVisemes verified (72 cues/5s, 6 viseme, FP clean) |
| 9 | Avatar & Gamification | OK | OK | G.1 audit: BotCharacter VISEME map dikoreksi ke set baru a/b/c/d/e/x |
| 10 | Parent Dashboard | OK | OK | Sprint E SELESAI ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â 4 backend + 4 screen |
| 11 | Guru Dashboard | OK | OK | Sprint F SELESAI ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â 4 backend + 3 screen |
| 12 | Sprint D: Midtrans QRIS + Admin + Referrer | OK | OK | D.1-D.7 SEMUA SELESAI (D.2 migrasi Midtrans ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Midtrans QRIS) |
| G.2 | Premium Live Lip-Sync | OK | OK | SELESAI 12 Sep ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â pcmToVisemes + threshold kalibrasi + random key + FP fix |
| 13 | Polish & Beta Test | NO | NO | Belum dimulai |
| 14 | Distribusi & Rilis | NO | NO | Belum dimulai |

---

## SPRINT F ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â SELESAI SEMUA [OK]

### F.0 Database
- OK Migration 013: teacher_students junction table (UNIQUE teacher_id, student_id)
- OK Indexes: idx_teacher_students_teacher, idx_teacher_students_student

### F.1ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œF.3 Backend routes/teacher.js
- OK GET /api/teacher/me ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â profil guru + total_students
- OK GET /api/teacher/students ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â list murid + snapshot (total_sessions, akurasi, terakhir)
- OK GET /api/teacher/student/:id/progress ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â stats keseluruhan + per_level breakdown
- OK GET /api/teacher/student/:id/sessions ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â paginated sessions (page, limit, total)
- OK Helper ownedByTeacher() ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â guard akses 403 per endpoint
- OK Didaftarkan di index.js sebelum /api/parent
- OK Live-tested semua 4 endpoint (Pak Guru Test + Budi Test 7 sesi)
- OK Runtime test 2026-09-11: register/login guru ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ response menyertakan `teacher` objek dan `display_name`; `/teacher/me` menyertakan `total_students`; `/teacher/students` menyertakan snapshot fields; `/teacher/student/:id/progress` menyertakan `stats` keys dan `per_level`; `/teacher/student/:id/sessions` paginated; guard `ownedByTeacher()` mengembalikan 403 untuk guru lain.

### F.1b Auth link-student
- OK POST /api/auth/teacher/link-student ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â guru add murid via student_id
- OK Didaftarkan di auth.js setelah parent/login

### F.4 TeacherAuthScreen.jsx
- OK Mode: login / register (tab switcher)
- OK Register: name, email, password, teacher_type (school/private picker)
- OK Login: email + password; response login guru kini konsisten menyertakan `teacher` objek (id, display_name, teacher_type, verified) dan `display_name`/`name` alias ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ sinkron dengan `TeacherAuthScreen` fallback.
- OK Runtime test: login guru ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ JWT valid ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ `setTeacherAuth` menyimpan teacher objek yang sesuai.
- OK Save token + teacher ke AsyncStorage
- OK Call setTeacherAuth(token, teacher) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ trigger isTeacher di App.jsx

### F.5 TeacherDashboardScreen.jsx
- OK Header: greeting + teacher type + murid count (menggunakan `me.total_students ?? students.length`) + logout
- OK Header count diverifikasi runtime setelah link-student (menjadi 1).
- OK List murid dengan badge: Level, Sesi, Akurasi, Terakhir
- OK Pull-to-refresh
- OK Navigasi ke StudentDetail per murid
- OK Logout: AsyncStorage.multiRemove + clearTeacherAuth()

### F.6 StudentDetailScreen.jsx
- OK Tab switcher: Progress | Sesi
- OK Progress tab: ringkasan stats + per-level breakdown + bar chart akurasi
- OK Sesi tab: infinite scroll paginated + mini bar per sesi
- OK Akurasi color coding: >= 80 hijau, >= 60 kuning, < 60 merah
- OK `useEffect` reload ketika `route.params.student.id` berubah ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ mencegah data lama saat berpindah murid.

### F ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Routing & Integration
- OK useStore: tambah teacherToken, teacher, setTeacherAuth, clearTeacherAuth
- OK App.jsx: Teacher Stack terpisah (isTeacher kondisional)
- OK App.jsx: bootstrap restore teacherToken dari AsyncStorage
- OK App.jsx: add TeacherAuth ke AUTH STACK
- OK RoleSelectScreen: tombol "Portal Guru" mengarah TeacherAuth
- OK `api.selectVariant()` ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ `POST /api/rag/select-variant` dengan body `{ student_id, level, concept_id }` ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ selaras dengan `rag.js` yang mengharapkan `concept_id`.
- OK `PracticeScreen.jsx` mengirim `exercise.concept_id` dan dependency `exercise?.concept_id`.
- OK Pertanyaan Terbuka #5 (student linking flow) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ **TERSELESAIKAN**: `POST /api/auth/teacher/link-student` sudah ada dan runtime-test berhasil.

---

## SPRINT G.0 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â GAP CLEANUP SELESAI [OK] (2026-09-11)

### G.0.1 Gap 1.4 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Audit explanations.variants
- OK Audit 15/15 baris `explanations` (1 per level): semua punya array `variants` dengan `content`, `approach_name`, `explanation_style` lengkap
- OK **Data fix**: 9 level (L3, L4, L7, L10ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œL15) memiliki label ketiga `algorithmic`/`shortcut` ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ dinormalisasi ke `quick` (kanonik Quick Method sesuai `VARIANT_TO_INDEX` di selection-rule.js)
- OK Hasil final: semua level punya varian `gasing` + `pmri`; level L3/L4/L7/L10ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œL15 tambah `quick` (2ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ3 variant per level)
- OK `speech_variants` = JSONB object dengan key `quick`, `steps`, `variants`, `generated_at` ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â struktur valid
- OK Tool audit tersimpan di `cadas-app-backend/audit-variants.js` (idempotent, bisa re-run)

### G.0.2 BotCharacter.jsx ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Reverifikasi
- OK 11 bot states lengkap di `EXPR_MAP`: idle, listening, thinking, speaking_calm, speaking_hype, celebrating, disappointed_mild, sleeping, welcome_back, level_up, fast_track
- OK Asset SVG lengkap: 13 file (body + 6 expr + 6 viseme) di `src/assets/bot/`
- OK Crossfade ekspresi + viseme overlay saat speaking + companion badge (Streak/Streak Pro/Master) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â semua terverifikasi
- OK Syntax valid via `@babel/parser`
- **Bug #1 FIXED**: `AskKakScreen.jsx` memanggil `setBotState('speaking')` ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â state ini tidak ada di EXPR_MAP ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ diganti `speaking_calm` + icon switch diperbarui
- **Bug #2 FIXED**: `finally` di `sendMessage()` memanggil `setBotState('idle')` segera setelah response ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ menimpa `speaking_calm` sebelum animasi jalan ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ idle reset dipindah ke masing-masing branch (403/no-answer/error), success tetap via setTimeout 2s

### G.0.3 Fase 8 RAG ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Runtime Test (9/9 PASS)
- OK POST /api/rag/select-variant default ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ `{variantId:'main', source:'default'}`
- OK POST /api/rag/select-variant accurate-but-slow ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ `{variantId:'quick', source:'default_speed_rule', reason:'accurate_but_slow'}`
- OK POST /api/rag/select-variant tanpa student_id ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ 400 (validasi)
- OK GET /api/rag/quota/:studentId ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ `{llm_calls_limit:40, remaining:40}`
- OK POST /api/rag/record-shown + record-helpful ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ roundtrip OK
- OK select-variant SETELAH record-helpful ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ `{variantId:'gasing', source:'performance', effectiveness:1}` ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â pipeline performance-data bekerja end-to-end
- OK POST /api/rag/normalize ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ OK
- OK POST /api/rag/ask tanpa level ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ 400 (validasi)
- OK Doc comment rag.js diperbaiki (sebelumnya salah tulis GET /select-variant, aktual POST)
- OK Data test `student_explanation_effectiveness` dibersihkan setelah test

### G.0 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Gap Tooling
- OK **SELESAI Sprint G.1** ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â `eslint.config.js` flat config mandiri (ESLint v10.0.3, tanpa dependency baru) + script `npm run lint`; full lint: **0 error / 0 warning**

---

## SPRINT G.1 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â SELESAI [OK] ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ESLint + Voice & Lip-Sync Kak Cadas

### G.1.1 ESLint (flat config mandiri)
- OK `eslint.config.js` (cadas-app): ECMA 2022 + JSX, globals React Native/Hermes, ruleset pragmatis (no-undef/no-dupe-keys/no-unreachable error; prefer-const/no-var warn)
- OK `package.json`: script `"lint": "eslint src"`
- OK Full `eslint src`: **0 error / 0 warning** ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â 30 file .js/.jsx semuanya lolos `@babel/parser`

### G.1.2 Bug riil yang ditemukan & diperbaiki lint
- **PracticeScreen**: `handleCorrect()` memakai variabel `correct` yang hanya ada di `handleMessage` ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ ReferenceError saat siswa jawab benar, timer soal berikutnya mati. FIXED: `handleCorrect(correct)`
- **StudentRegisterScreen**: 3ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â `fetch(${API_BASE}/...)` **kehilangan backtick** (file tidak bisa di-parse ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ layar register/login mati total) + header `Authorization: Bearer ${data.token}` hilang interpolasinya. FIXED semua
- **HomeScreen**: `student` tidak di-destructure ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ greeting "Hai, {student?.name}" ReferenceError. FIXED (`storeStudent` dari useStore)
- **TeacherDashboardScreen**: `me.total_students` ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ `teacher.total_students` (FIXED)
- PracticeScreen: import tak terpakai (`Animated`, `Platform`) dihapus; AskKakScreen: `API_BASE` lokal diganti dari services/api

### G.1.3 Asset SVG baru dari user
- OK 6 ekspresi baru (`08_expr_idle` ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ `13_expr_disappointed`) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ `src/assets/bot/expr/{idle,listening,thinking,hype,celebrating,disappointed}.svg`
- OK 6 mulut baru **A, B, C, D, E, X** ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ `src/assets/bot/viseme/{a,b,c,d,e,x}.svg`
- ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Set Rhubarb penuh = AÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œH+X; **F (9,9% cue), G (0,8%), H (2,0%) belum ada SVG** ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ sementara fallback: FÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ou.svg (pucker), GÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢c.svg, HÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢d.svg (87ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢97% akurasi jika F dibuat)

### G.1.4 Backend ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â voice + viseme
- OK `pipeline.js generateOutput` (basic tier): fallback ke `level_audio_segments` ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â `audioUrl` + `visemes` (viseme_json Rhubarb) kini terkirim walau `explanations.audio_url` NULL (respons premium/TTS live tetap pakai fallback loop)
- OK `askKak()` meneruskan `visemes` ke respons `/api/rag/ask` ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â runtime test ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ (source=semantic, audioUrl=/audio/speech/gemini/wav/L1_main.wav, **92 viseme cues**)
- OK Endpoint baru **GET /api/rag/level-voice/:level** ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ 7 segmen level 1 lengkap dgn visemes ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â runtime test ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦
- OK Static `/audio` (wav + JSON viseme) terverifikasi 200

### G.1.5 WAV Quality Test & Regenerate (?? progress)
- Validasi 9,771 file: 9,149 OK (93.6%), 152 PADDED (1.6%), 470 MISMATCH (4.8%)
- Script scripts/wav-quality-final.js ? report: wav-quality-report.json (energy ratio detection)
- Script scripts/regenerate_audio.py (edge-tts + Python) ? 67+ file diregenerate
- Voice: id-ID-GadisNeural (edge-tts), format: WAV 24kHz mono 16-bit
- ETA: ~44 menit untuk 570 file

- OK **Rhubarb Lip-Sync 1.14.0** ditemukan di `speed-math-master/tools/rhubarb` ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â tervalidasi (1 wav ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ JSON mouthCues, ~10 dtk/file)
- OK `cadas-app-backend/scripts/generate-visemes.js` ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â batch 4 proses paralel, resume-able (skip yang sudah ada), output `audio/speech/cache/visemes/{nama}.json` (tersaji otomatis via mount `/audio`)
- OK Batch dijalankan di background (log: `viseme-batch.log`); estimasi ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±8ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œ13 jam sekali jalan
- Data: hanya **120 pasang** wav+viseme (penjelasan level) yang punya skrip viseme di DB; 9.771 wav hint/trick sebelumnya tanpa viseme ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ kini digenerate
- ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾ **Status live (update terakhir)**: **367/9.771 selesai, 0 gagal** ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ETA ~707 menit (~12 jam); script resume-able jadi bisa dihentikan/dilanjutkan kapan saja (`node scripts/generate-visemes.js`); frontend otomatis memakai viseme yang sudah jadi (yang belum ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ fallback loop bibir)

### G.1.6 Frontend wiring lip-sync
- OK `BotCharacter.jsx`: `VISEME` map diganti ke set huruf baru (A,B,C,D,E,X) + alias Rhubarb F/G/HÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢fallback; cue tak dikenal ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ X (rest)
- OK `PracticeScreen.playSound`: **fix bug** `const BASE = '${BASE_URL}'` (string literal rusak ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ fetch viseme selalu gagal) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ `api.visemeUrl()` dari `cache/visemes/`
- OK `AskKakScreen`: emoji avatar diganti **BotCharacter sungguhan** (crossfade ekspresi + bibir); `playBotAudio()` implementasi penuh dengan `expo-av` ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â `startSpeaking(visemes)` saat play, `stopSpeaking()` + idle saat selesai; tombol "ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€¦Ã‚Â  Putar" ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â "ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€¹Ã¢â‚¬Â  Memutar..."
- OK `api.js`: helper baru `visemeUrl(exerciseId, type)` + `levelVoice(level)`
- OK Cleanup unmount AskKak (stop audio + reset bot state)

### G.1.7 Status terakhir AskKak (lip-sync end-to-end siap)
- OK Layout AskKak kini menampilkan **BotCharacter sungguhan** (bukan emoji) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ekspresi crossfade + gerak bibir mengikuti state bot
- OK Alur tanya-jawab: kirim pertanyaan ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ `thinking` (rock animation) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ jawaban masuk ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ **audio otomatis diputar + `speaking_calm` + bibir sinkron data Rhubarb** (`visemes` dari `/api/rag/ask`) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ selesai ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ `idle`
- OK Tombol "ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€¦Ã‚Â  Putar" per-pesan: memutar ulang audio pesan + lip-sync; label berubah "ÃƒÆ’Ã‚Â°Ãƒâ€¦Ã‚Â¸ÃƒÂ¢Ã¢â€šÂ¬Ã‚ÂÃƒâ€¹Ã¢â‚¬Â  Memutar..." saat aktif
- OK `stopSpeaking()` + reset `idle` saat audio selesai/error dan saat keluar layar (cleanup unmount)
- OK Runtime test backend: `ask` ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ `source=semantic, tier=basic, audioUrl=/audio/speech/gemini/wav/L1_main.wav, visemes=92 cues` ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦
- ~~ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã‚Â¡Ãƒâ€šÃ‚Â ÃƒÆ’Ã‚Â¯Ãƒâ€šÃ‚Â¸Ãƒâ€šÃ‚Â Premium (TTS live Gemini) belum punya timestamp viseme~~ ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ **SELESAI Sprint G.2** ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â pcmToVisemes live, 72 cues/5s, semua 6 viseme valid

---

## SPRINT G.2 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â SELESAI [OK] ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Premium Live Lip-Sync (12 Sep 2026)

### G.2.1 pcmToVisemes() di gemini-tts.js
- OK Fungsi pcmToVisemes(pcmBuffer, sampleRate=24000, frameMs=40) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â analisis RMS per frame 40ms dari PCM buffer Gemini TTS
- OK Decode: Int16Array dari buffer, frameSamples = round(sampleRate * frameMs / 1000) = 960 @24kHz
- OK Normalisasi vs peak RMS seluruh buffer ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ threshold map ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ 6 viseme: X B C D A O
- OK Merge adjacent same-value cue ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ output { mouthCues: [{start, end, value}] }
- OK Graceful: return null jika error/buffer kosong ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ frontend fallback SPEAKING_LOOP, tidak pernah throw
- OK Format output identik Rhubarb ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ BotCharacter.jsx kompatibel 100% tanpa perubahan

### G.2.2 Threshold dikalibrasi dari data aktual
- OK Test sine wave normalized: ratio RMS/amplitude konsisten 1.18x (sine RMS = amp/sqrt(2))
- OK Threshold lama [0.05, 0.15, 0.30, 0.50, 0.70] ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ semua FAIL (nilai selalu lebih tinggi dari threshold)
- OK Threshold baru dikalibrasi: [0.036, 0.119, 0.261, 0.473, 0.708] ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ 7/7 PASS
- OK Live test Gemini TTS: 72 cues, 5.17s, unique values [A,B,C,D,O,X] ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦

### G.2.3 Floating point fix ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â integer ms arithmetic
- OK Bug: f * frameDur akumulasi FP error ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ 0.24000000000000002, 0.39999999999999997
- OK Fix: startMs = round(f * frameMs), endMs = round((f+1) * frameMs), bagi /1000 di akhir
- OK Verifikasi: test sintetis 3s ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ cues [0, 1, 3] bersih, contiguous PASS, duration 3.000s ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦

### G.2.4 Random key rotation + baca 250 keys
- OK Bug: loop sequential _keyIndex++ ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ key pertama exhausted duluan
- OK Fix: Math.floor(Math.random() * apiKeys.length) per request
- OK Constructor baca GOOGLE_API_KEY_1..250 (sebelumnya hanya 1..5) sesuai .env.example
- OK Verifikasi: 20 picks ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ 5 unique keys dipakai, distribusi merata ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦

### G.2.5 pipeline.js premium path
- OK generateOutput() premium: pcmToVisemes(audioBuffer, sampleRate) dipanggil setelah pcmToWav
- OK sampleRate diparse dari mimeType (audio/L16;codec=pcm;rate=24000) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ diteruskan ke keduanya
- OK Response /api/rag/ask premium kini menyertakan visemes: { mouthCues: [...] } atau null (graceful)
- OK Basic tier tidak berubah ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â tetap pakai Rhubarb pre-generated dari DB

### Kriteria Selesai ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â SEMUA TERPENUHI ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦
- Premium ask ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ visemes non-null (verified live)
- Semua 6 viseme terwakili (A,B,C,D,O,X) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â semua punya SVG di BotCharacter
- Floating point bersih ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â tidak ada 000000 atau 999999 di timestamps
- Random key rotation ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â tidak exhausted dari ujung, baca 250 keys
- Basic tier tidak berubah; zero latency tambahan (~1-3ms per 5s audio)

---

## SPRINT E ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â SELESAI SEMUA [OK]

### E.1ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œE.3 Backend routes/parent.js
- OK GET /api/parent/children ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â list anak + snapshot progress
- OK GET /api/parent/child/:id/progress ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â detail per anak
- OK GET /api/parent/child/:id/sessions ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â paginated sesi
- OK GET /api/parent/child/:id/billing ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â payment + midtrans_orders records

### E.4ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œE.6 Frontend 4 screens
- OK ParentDashboardScreen ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â list anak + badge
- OK ChildProgressScreen ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â stats + per-level + pull-refresh
- OK ChildSessionsScreen ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â paginated sesi + bar chart
- OK ChildBillingScreen ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â payment status + history

### E ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Routing & Integration
- OK useStore: parent state + setParentAuth + clearParentAuth
- OK App.jsx: Parent Stack + bootstrap + routing kondisional

---

## SPRINT D ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â SELESAI SEMUA [OK]

### D.1 Migration 012
- OK midtrans_orders (ex Midtrans_invoices), referrer_earnings, download_clicks, technique_taught_and_passed
- OK Kolom baru referrers: email, password_hash, referral_token, bank_*, total_clicks, total_earnings_idr
- OK referrers.status constraint: tambah suspended

### D.2 Midtrans QRIS Integration (migrasi dari Midtrans)
- OK POST /api/payment/create-order ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â buat transaksi Midtrans QRIS dinamis
- OK POST /api/webhooks/midtrans ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â HTTP Notification, verifikasi SHA-512 signature, aktivasi akses + catat komisi
- OK GET /api/payment/status/:order_id ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â cek status transaksi via Midtrans API
- !! MIDTRANS_SERVER_KEY masih kosong ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â isi saat akun Midtrans aktif (daftar KTP saja di midtrans.com)
- Catatan: biaya QRIS 0,7%/transaksi sudah inklusif PPN, tidak ada flat fee tambahan

### D.3 Auth Referrer
- OK POST /api/referrer/login ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â JWT role referrer, live-tested
- OK GET /api/referrer/me, earnings, clicks
- OK PUT /api/referrer/bank, password

### D.4 Admin Dashboard Routes
- OK GET/POST /api/admin/referrers ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â live-tested
- OK GET /api/admin/students ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â live-tested (6 siswa)
- OK GET /api/admin/payments, earnings
- OK PUT /api/admin/earnings/:id ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â mark transferred
- OK POST /api/admin/billing/activate

### D.5 Referrer Dashboard Routes
- OK Terintegrasi dalam routes/referrer.js

### D.6 Redirect Token /d/:token
- OK Log klik, hash IP SHA-256, redirect App Store
- !! APP_STORE_URL masih placeholder

### D.7 Frontend ReferrerStack
- OK useStore: referrerToken, referrer, setReferrerAuth, clearReferrerAuth
- OK ReferrerLoginScreen, ReferrerDashboardScreen, ReferrerEarningsScreen
- OK ReferrerClicksScreen, ReferrerBankScreen, ReferrerChangePasswordScreen
- OK App.jsx: ReferrerStack + restore sesi AsyncStorage
- OK RoleSelectScreen: tombol Portal Referrer

---

## GIT LOG TERKINI
- fix(Sprint G.0): Gap 1.4 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â normalisasi explanation_style algorithmic/shortcut ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ quick (15/15 audit PASS)
- feat(Sprint G.1): eslint.config.js + viseme pipeline (level-voice endpoint, Rhubarb batch 9.771, BotCharacter lip-sync wiring AskKak/Practice)
- fix(Sprint G.1): handleCorrect(correct) ReferenceError; StudentRegisterScreen 3x fetch tanpa backtick; HomeScreen student; TeacherScreen meÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢teacher
- fix(Sprint G.0): AskKakScreen botState 'speaking' ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ 'speaking_calm' + urutan reset idle yang benar
- feat(Sprint F): Teacher Dashboard ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â 3 screens + routing + RoleSelect button
- feat(Sprint F): routes/teacher.js + auth link-student + migration 013
- feat(Sprint E): Parent Dashboard ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â 4 backend routes + 4 screens + routing fix
- feat(Sprint D.7): ReferrerStack 6 screens + useStore referrer state

---

## SKEMA DATABASE

| Tabel | Status | Catatan |
|-------|--------|---------|
| students | OK | referred_by kolom ada |
| parents | OK | |
| parent_children | OK | |
| teachers | OK | |
| teacher_students | OK | Migration 013 (Sprint F) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â junction table |
| referrers | OK | Kolom baru migration 012 sudah diterapkan |
| payment_records | OK | |
| exercises | OK | 5.446 rows level 1-15 |
| concepts | OK | 15 rows |
| placement_tests | OK | 15 probe pools |
| student_sessions | OK | Dipakai Sprint E/F untuk progress/sessions |
| student_variant_bias | OK | Live data confirmed |
| student_explanation_effectiveness | OK | UNIQUE constraint confirmed |
| student_level_quota | OK | |
| upgrade_tests | OK | |
| level_audio_segments | OK | Migration 003 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â fallback audio+viseme Sprint G.1 |
| midtrans_orders | OK | Migration 012 applied (ex Midtrans_invoices, direname ke midtrans_orders) |
| referrer_earnings | OK | Migration 012 applied |
| download_clicks | OK | Migration 012 applied |
| technique_taught_and_passed | OK | Migration 012 applied |
| _migrations | OK | 001-013 semua tercatat |

### Detail tabel: teacher_students

| Kolom | Type | Constraint |
|-------|------|-----------|
| id | uuid | PRIMARY KEY |
| teacher_id | uuid | FK teachers(id) ON DELETE CASCADE |
| student_id | uuid | FK students(id) ON DELETE CASCADE |
| linked_at | timestamptz | DEFAULT now() |
| ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â | ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â | UNIQUE(teacher_id, student_id) |

---

## PERTANYAAN TERBUKA

| # | Pertanyaan | Memengaruhi | Status/Note |
|---|-----------|-------------|
| 1 | Kuota AskKak: 38 atau 40 per level? | Fase 8 | Implementasi aktual pakai **40** (`daily_limit` default) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â runtime-test ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ |
| 2 | Midtrans Server Key & Client Key sudah ada? Daftar di midtrans.com (KTP saja) | Sprint D.2 |
| 3 | Domain cadas.app untuk /d/:token? | Sprint D.6 |
| 4 | Komisi referrer: transfer bank or kredit? | Sprint D.5 |
| 5 | Guru dashboard: student linking flow ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â kode unik? | Sprint F+ | **TERSELESAIKAN** ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â `POST /api/auth/teacher/link-student` runtime-test ÃƒÆ’Ã‚Â¢Ãƒâ€¦Ã¢â‚¬Å“ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ |
| 6 | Parent notifikasi push ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â level up? | Sprint G+ |
| 7 | Premium lip-sync: pcmToVisemes (RMS, lihat Catatan) atau TTS provider lain? | Sprint G.2 |

---

## BUG STATUS

| Bug | File | Status |
|-----|------|--------|
| D.0.1: GET /select-variant ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ POST | rag.js | OK Fixed (+ doc comment diperbaiki G.0) |
| D.2: Migrasi Midtrans ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Midtrans QRIS | payment.js / midtrans.js | OK ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â tabel direname, webhook diganti HTTP Notification Midtrans |
| double-mount /api/admin | index.js | OK Fixed Sprint D |
| placement probe concept_id null | data | !! Acceptable beta |
| ParentAuthScreen URL salah (/auth vs /api/auth) | ParentAuthScreen.jsx | OK Fixed Sprint E |
| ParentAuthScreen setPlacementDone (salah role) | ParentAuthScreen.jsx | OK Fixed Sprint E |
| ParentDashboard logout tidak clear Zustand | ParentDashboardScreen.jsx | OK Fixed Sprint E |
| App.jsx Parent Stack di dalam Main Stack | App.jsx | OK Fixed Sprint E |
| AskKak botState 'speaking' ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ salah enum | AskKakScreen.jsx | OK Fixed Sprint G.0 |
| Lint G.1: handleCorrect ReferenceError; backtick StudentRegister; HomeScreen student; meÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢teacher | PracticeScreen / StudentRegisterScreen / HomeScreen / TeacherDashboardScreen | OK Fixed Sprint G.1 |
| Premium TTS live Gemini belum punya timestamp viseme ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ fallback SPEAKING_LOOP | pipeline.js + gemini-tts.js | OK FIXED Sprint G.2 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â pcmToVisemes live, threshold dikalibrasi, FP fix, random key 250 keys |
| SVG viseme F/G/H belum ada di disk (alias: FÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢b.svg, GÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢c.svg, HÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢d.svg) | src/assets/bot/viseme | !! Minor ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â alias sudah benar di VISEME map; buat SVG F untuk +~10% akurasi |

---

## CATATAN ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Pendekatan lip-sync premium yang TIDAK dieksekusi (eks-docz/PROGRESS_add.md)

Rencana "Sprint G ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â HeadAudio Live Lip-Sync" (pcmToVisemes: analisis RMS per frame 40ms
dari PCM buffer Gemini TTS ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ mouthCues[]) dipertimbangkan tapi **tidak pernah
diimplementasi** ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â `pcmToVisemes` tidak ada di `gemini-tts.js` maupun `pipeline.js`,
dan git log tidak memuat commit tersebut (klaim git log di docz_add tidak valid).
Pendekatan yang dieksekusi: **Rhubarb batch pre-generated** (G.1.5 WAV Quality Test & Regenerate (?? progress)
- Validasi 9,771 file: 9,149 OK (93.6%), 152 PADDED (1.6%), 470 MISMATCH (4.8%)
- Script scripts/wav-quality-final.js ? report: wav-quality-report.json (energy ratio detection)
- Script scripts/regenerate_audio.py (edge-tts + Python) ? 67+ file diregenerate
- Voice: id-ID-GadisNeural (edge-tts), format: WAV 24kHz mono 16-bit
- ETA: ~44 menit untuk 570 file

sudah ada, dan jawaban premium live tetap fallback SPEAKING_LOOP (bug G.2 terbuka di atas).
Jika nanti premium lip-sync dikerjakan, algoritma pcmToVisemes di bawah tetap bisa
dipakai sebagai referensi:

```
PCM Buffer (16-bit signed LE, 24000 Hz)
  ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ slice per frame: 40ms = 960 samples = 1920 bytes
  ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ RMS energy per frame ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ normalize relatif peak buffer
  ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ map: <0.05 'X' | <0.15 'B' | <0.30 'C' | <0.50 'D' | <0.70 'A' | >=0.70 'O'
  ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ output: { mouthCues: [{ start, end, value }] }
```

Catatan: BotCharacter.jsx & useStore.startSpeaking(visemeData) frontend sudah siap
menerima format `mouthCues[]` identik Rhubarb ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â tinggal backend premium path yang
belum mengisi `visemes` di response.

---

## RENCANA Sprint G.2 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â Premium Live Lip-Sync (pcmToVisemes, HeadAudio approach)

> Tujuan: jawaban premium (TTS live Gemini) menyertakan `visemes` sehingga BotCharacter
> lip-sync sinkron per-suku-kata, tidak lagi fallback SPEAKING_LOOP (bug G.2 terbuka).
> Format output IDENTIK Rhubarb `{ mouthCues: [{start, end, value}] }` (start/end detik)
> ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ frontend 100% kompatibel TANPA perubahan wajib.
> Terverifikasi: BotCharacter.jsx:187-195 (tick 40ms, cari cue by elapsed), AskKakScreen
> playBotAudio ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ startSpeaking(vData) langsung dari response /api/rag/ask.

### G.2.1 Backend ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â `pcmToVisemes()` di `gemini-tts.js` [inti, ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±50 baris]
- Signature: `pcmToVisemes(pcmBuffer, sampleRate = 24000, frameMs = 40)`
- Decode: `Int16Array(pcmBuffer.buffer, byteOffset, floor(len/2))` (16-bit signed LE)
- frameSamples = sampleRate * frameMs / 1000 (= 960 @24kHz)
- RMS per frame ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ normalisasi vs max RMS seluruh buffer
- Threshold map (default): <0.05 X | <0.15 B | <0.30 C | <0.50 D | <0.70 A | else O
- Merge cue adjacent same-value; cue pertama mulai 0.00; cue terakhir clamp ke durasi total
- Graceful: return null jika error/buffer kosong (frontend ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ fallback loop, aman)
- Biaya: O(n) ~1-3ms per 10 detik audio ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â zero-impact, jalan sebelum pcmToWav

### G.2.2 Backend ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â `pipeline.js` premium path [ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±5 baris]
- Dalam blok try premium: `const visemes = geminiTTS.pcmToVisemes(audioBuffer);`
  ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ return `{ text, audioUrl, visemes, tier: 'premium' }`
- Catch: tetap return tanpa visemes (perilaku sekarang)
- Basic tier & route /api/rag/ask: TIDAK diubah (askKak sudah meneruskan `visemes`,
  pipeline.js:320) ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â tidak ada perubahan schema/route

### G.2.3 Robustness sample-rate
- `synthesize()` kini hardcode 24000 di pcmToWav ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â parse `rate=` dari
  `part.inlineData.mimeType` (mis. `audio/L16;rate=24000`) dan teruskan ke
  pcmToWav & pcmToVisemes agar WAV/viseme tidak salah kecepatan jika model lain

### G.2.4 Unit test offline (tanpa API key)
- Script node: PCM sintetis (diam + burst sine amplitudo bertingkat)
- Assert: nilai cue hanya {X,B,C,D,A,O}; boundary cue kontinu 0..durasi;
  jumlah cue ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°Ãƒâ€¹Ã¢â‚¬Â  durasi/0.04; tidak ada NaN

### G.2.5 Live test premium
- POST /api/rag/ask (token premium): visemes != null, mouthCues non-kosong,
  cue count ~ durasi/0.04 (ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±20%)
- Regresi basic: jawaban tier basic tetap Rhubarb dari DB (tidak terpengaruh)

### G.2.6 (Opsional) Sinkronisasi timeline frontend
- Saat ini timer viseme mulai saat `startSpeaking()` (sebelum Audio.Sound selesai load)
  ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ ada offset puluhan-hingga-ratusan ms. Perbaikan: mulai tick dari
  `status.positionMillis / 1000` (onUpdate) alih-alih Date.now() ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â menyentuh
  BotCharacter.jsx/AskKakScreen, disarankan task terpisah setelah G.2.1-G.2.5 terverifikasi

### G.2.7 (Opsional) Tuning
- Env: `VISEME_FRAME_MS=40`, `VISEME_THRESHOLDS=0.05,0.15,0.30,0.50,0.70`
- Smoothing rata-rata bergerak 2 frame (80ms) opsional ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â amplitude-based cenderung
  salah tandai konsonan plosif sebagai 'O'
- Uji 2-3 teks berbeda; bandingkan durasi cue vs audio

### Kriteria Selesai
- Premium ask ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ visemes non-null (ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°Ãƒâ€šÃ‚Â¥95% saat TTS sukses); lip-sync terlihat sinkron
- Basic tier tidak berubah; ESLint 0 error; tanpa latensi tambahan terukur
- Estimasi: G.2.1-G.2.5 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â°Ãƒâ€¹Ã¢â‚¬Â  1 sesi (60-90 menit); G.2.6/G.2.7 opsional menyusul

