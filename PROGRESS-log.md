# Progress Log - Cadas App Development
> Diperbarui: 12 September 2026 (Sprint H — Audio Infrastructure selesai sebagian)
> Simbol: [OK] = terverifikasi live | [!!] = ada tapi ada gap | [NO] = belum ada
> Catatan: Verifikasi dilakukan dengan membaca file aktual + test endpoint langsung

---

## PERBEDAAN DOKUMEN vs APLIKASI AKTUAL (ditemukan 12 Sep 2026)

| # | Yang tercatat di PROGRESS.md lama | Kondisi aktual di kode |
|---|-----------------------------------|------------------------|
| 1 | Sprint E status: NO | Sudah ada — routes/parent.js + 4 screens sudah dibuat sebelumnya |
| 2 | Sprint F status: NO | Sudah ada — routes/teacher.js + 3 screens sudah dibuat sebelumnya |
| 3 | parentToken tidak ada di bootstrap App.jsx | Bug nyata — sudah diperbaiki sesi ini |
| 4 | isParent routing stack tidak ada | Bug nyata — Parent screens stuck di Main Stack student; sudah diperbaiki |
| 5 | useStore tidak punya parentToken/setParentAuth | Sebagian sudah ada tapi ada key orphan `parent: null`; sudah dibersihkan |
| 6 | ParentAuthScreen punya `authToken` unused | Bug minor — sudah dibersihkan |
| 7 | TeacherDashboardScreen: `teacher.total_students` crash jika teacher null | Bug nyata — sudah fix optional chaining |
| 8 | HomeScreen levelSub hardcoded "Penjumlahan Dasar" | Bug nyata — sudah dinamis dari /api/exercises/level-info/:id |
| 9 | api.js tidak punya parent methods | Gap nyata — sudah ditambahkan parentChildren/Progress/Sessions/Billing |
| 10 | Teacher link-student UI di sisi murid | Belum ada sama sekali (frontend + backend kode guru) |

---

## RINGKASAN STATUS PER FASE

| Fase | Nama | Backend | Frontend | Catatan |
|------|------|---------|----------|---------|
| 0 | Setup & Orientasi | OK | OK | Selesai |
| 1 | Gap Konten | OK | - | Gap 1.4 belum dikonfirmasi |
| 2 | Backend Foundation | OK | OK | index.js OK |
| 3 | Auth & Onboarding | OK | OK | 10 endpoint + 5 screen terverifikasi |
| 4 | Placement Test | OK | OK | start+submit live-tested |
| 5 | Practice Loop | OK | OK | selection-rule + PracticeScreen (382 baris) |
| 6 | Billing Per-Level | OK | OK | Manual OK; Xendit selesai |
| 7 | Fast Track | OK | OK | getLevelAccess() shared, live-tested |
| 8 | RAG Pipeline | !! | OK | Pipeline OK; Bug D.0.1 fixed |
| 9 | Avatar & Gamification | OK | !! | BotCharacter + viseme OK; bot reaction audio belum terintegrasi |
| 10 | Parent Dashboard | OK | OK | Sprint E — 4 backend + 4 screens + routing fix |
| 11 | Teacher Dashboard | OK | !! | Sprint F — backend OK; link-student UI belum ada |
| 12 | Sprint D: Xendit + Admin + Referrer | OK | OK | D.1-D.7 SEMUA SELESAI |
| 13 | Sprint G: Polish | !! | !! | level-info endpoint + HomeScreen dinamis OK; sisanya belum |
| 14 | Sprint H: Audio Infrastructure | !! | !! | R2 setup + bot audio upload OK; exercise cache belum |
| 15 | Distribusi & Rilis | NO | NO | Belum dimulai |

---

## SPRINT H — AUDIO INFRASTRUCTURE (SEDANG BERJALAN)

### H.1 — Audit & Keputusan Arsitektur (SELESAI)
- OK Audit total audio: ~3.2 GB WAV (9.996 file)
- OK Keputusan format: Opus 24kbps mono 48kHz (Android-only, ~6% ukuran asli)
- OK Keputusan distribusi: 3-layer architecture
  - Layer 1: Bot reaction audio (52 file) → bundle APK/WPA (require langsung)
  - Layer 2: Exercise TTS cache → Cloudflare R2 (stream on-demand)
  - Layer 3: Device cache via expo-file-system (download saat WiFi, future sprint)
- OK ffmpeg 9.0.1 terinstall via winget
- OK rclone 1.75.1 terinstall (sudah ada sebelumnya)

### H.2 — Konversi & Upload Bot Audio (SELESAI)
- OK Konversi 52 WAV → 52 Opus: 9.41 MB → 0.6 MB (94% lebih kecil)
- OK Output: cadas-app/assets/bot/speech/opus/ (52 file .opus)
- OK Upload R2: r2:cadas-audio/bot/speech/opus (52 file, 614 KB)
- OK Upload R2: r2:cadas-audio/bot/speech/visemes (52 JSON, 73 KB)
- OK Cloudflare R2 bucket: cadas-audio (region Asia Pacific)
- OK rclone config: remote name "r2" → endpoint R2 Cloudflare

### H.3 — Konversi & Upload Exercise Cache (BELUM)
- NO Konversi 9.771 WAV cache → Opus (~2.981 MB → ~194 MB)
- NO Upload ke r2:cadas-audio/speech/cache/
- NO Konversi 172 WAV gemini → Opus (~203 MB → ~13 MB)
- NO Upload ke r2:cadas-audio/speech/gemini/

### H.4 — Update Backend (BELUM)
- NO Tambah static route: app.use('/assets/bot', ...) di index.js
- NO Update /api/tts route: serve dari R2 URL, fallback generate + auto-upload R2
- NO Environment variable: R2_PUBLIC_URL, R2_BUCKET, R2_ACCESS_KEY, R2_SECRET_KEY

### H.5 — Update Frontend api.js (SEBAGIAN)
- OK botAudioUrl: (id) => `${_base}/assets/bot/speech/wav/${id}.wav` (sudah ada, perlu update ke R2 URL)
- OK botVisemeUrl: (id) => `${_base}/assets/bot/speech/visemes/${id}.json` (sama)
- NO Update URL pointing ke R2 public URL setelah domain setup
- NO Tambah botOpusUrl: (id) => `${R2_URL}/bot/speech/opus/${id}.opus`

### H.6 — Integrasi Bot Reaction di PracticeScreen (BELUM)
- NO Mapping logika → file WAV/Opus bot reaction
- NO playBotAudio() di handleCorrect: bot_correct_01~05, bot_correct_after_wrong, bot_correct_last, bot_correct_weak
- NO playBotAudio() di handleWrong: bot_wrong_01, bot_wrong_3row, bot_wrong_after_hint, bot_wrong_many, bot_wrong_trick, bot_wrong_weak
- NO playBotAudio() streak trigger: bot_streak_3, bot_streak_5, bot_streak_10, bot_streak_break_short, bot_streak_break_long
- NO playBotAudio() idle trigger: bot_idle_30s, bot_idle_60s
- NO playBotAudio() level-up: bot_levelup_few, bot_levelup_many, bot_levelup_skill_weak, bot_levelup_speed_good, bot_levelup_speed_slow
- NO playBotAudio() welcome: bot_welcome_l1_l3, bot_welcome_l4_l7, bot_welcome_l8_l12, bot_welcome_l13_l15, bot_welcome_back

### Proyeksi Ukuran Final
| Aset | WAV | Opus | Di mana |
|------|-----|------|---------|
| Bot reaction (52 file) | 9.4 MB | 0.6 MB | Bundle APK + R2 |
| Exercise cache (9.771 file) | 2.981 MB | ~194 MB | R2 only |
| Gemini master (172 file) | 203 MB | ~13 MB | R2 only |
| **Total R2** | **~3.2 GB** | **~208 MB** | **Free tier (< 10 GB)** |

### Urutan Langkah Selanjutnya
1. Konversi massal exercise cache WAV → Opus (script batch)
2. Upload exercise cache ke R2
3. Konversi + upload gemini WAV → R2
4. Update backend: serve dari R2, env vars R2
5. Update api.js: URL audio ke R2
6. Integrasi bot reaction di PracticeScreen (H.6)
7. Setup domain cadasmatematika.id (dibeli di Hostinger, belum aktif)
8. Pasang custom domain di R2: audio.cadasmatematika.id

---

## SPRINT E — PARENT DASHBOARD (SELESAI)

### Backend
- OK GET /api/parent/children — list anak + total_sessions, akurasi
- OK GET /api/parent/child/:id/progress — per level + stats keseluruhan
- OK GET /api/parent/child/:id/sessions — paginated (page, limit)
- OK GET /api/parent/child/:id/billing — payment_records + xendit_invoices
- OK POST /api/auth/parent/register + login (sudah ada sebelumnya)
- OK POST /api/auth/parent/link-child (sudah ada sebelumnya)

### Frontend
- OK ParentDashboardScreen — list anak + badge level/sesi/akurasi/terakhir
- OK ChildProgressScreen — stats + progress bar per level
- OK ChildSessionsScreen — paginated + infinite scroll
- OK ChildBillingScreen — status akses + riwayat manual + xendit
- OK ParentAuthScreen — register/login + auto-link child + setParentAuth
- OK App.jsx isParent stack (terpisah dari student + referrer + teacher)
- OK useStore: parentToken, parentProfile, setParentAuth, clearParentAuth
- OK Bootstrap restore parentToken dari AsyncStorage saat app start
- OK RoleSelectScreen: tombol "Masuk sebagai Orang Tua" → ParentAuth
- OK api.js: parentChildren, parentChildProgress, parentChildSessions, parentChildBilling

### Bug yang ditemukan & diperbaiki
- FIXED: parentToken tidak di-restore saat app boot
- FIXED: isParent routing — Parent screens ada di Main Stack student (harus stack terpisah)
- FIXED: orphan key `parent: null` di useStore (bentrok dengan student.parent)
- FIXED: `authToken` unused di ParentAuthScreen

---

## SPRINT F — TEACHER DASHBOARD (BACKEND OK, FRONTEND PARTIAL)

### Backend
- OK GET /api/teacher/me — profil guru + total_students
- OK GET /api/teacher/students — list murid + snapshot akurasi
- OK GET /api/teacher/student/:id/progress — per level + stats
- OK GET /api/teacher/student/:id/sessions — paginated
- OK POST /api/auth/teacher/register + login
- OK POST /api/auth/teacher/link-student
- OK Tabel: teachers (id, email, display_name, teacher_type, is_verified, password_hash)
- OK Tabel: teacher_students (teacher_id, student_id, linked_at) + unique constraint

### Frontend
- OK TeacherAuthScreen — register (school/private) + login + finalize ke isTeacher
- OK TeacherDashboardScreen — list murid + badge + handleLogout
- OK StudentDetailScreen — progress + sessions tabs (222 baris)
- OK App.jsx isTeacher stack routing
- OK useStore: teacherToken, teacher, setTeacherAuth, clearTeacherAuth
- OK Bootstrap restore teacherToken dari AsyncStorage
- OK RoleSelectScreen: tombol "Portal Guru" → TeacherAuth
- FIXED: `teacher.total_students` crash → `teacher?.total_students`
- NO: Link-student UI di sisi murid (murid input kode guru → terhubung)

### Gap yang perlu diselesaikan (Sprint G.2)
- Teachers belum punya kolom `teacher_code` — perlu migration
- Tidak ada UI di SettingsScreen untuk murid input kode guru
- Tidak ada endpoint GET /api/auth/teacher/by-code/:code

---

## SPRINT G — POLISH (SEDANG BERJALAN)

### G.1 — Selesai
- OK GET /api/exercises/level-info/:level_id — return name + description dari tabel levels
- OK HomeScreen: levelSub dinamis dari API (bukan hardcoded "Penjumlahan Dasar")
- OK api.js: parent methods lengkap (4 endpoints)

### G.2 — Belum (Teacher link-student)
- NO Migration: tambah kolom teacher_code ke tabel teachers
- NO GET /api/auth/teacher/by-code/:code — cari guru by kode
- NO SettingsScreen: input kode guru untuk murid
- NO Notifikasi/konfirmasi setelah murid berhasil terhubung ke guru

### G.3 — Belum (Nice to have)
- NO Global error boundary React Native
- NO Offline detection + retry
- NO Push notification naik level
- NO Xendit end-to-end test dengan test key asli

---

## SPRINT D — SELESAI SEMUA
- OK D.1: migration 012 (xendit_invoices, referrer_earnings, dll)
- OK D.2: Xendit create-invoice + webhook + status
- OK D.3: Auth referrer (login, me, earnings, clicks)
- OK D.4: Admin dashboard routes
- OK D.5: Referrer dashboard routes
- OK D.6: Redirect token /d/:token
- OK D.7: Frontend ReferrerStack 6 screens

---

## GIT LOG TERKINI

### cadas-app-backend
- feat(Sprint G): GET /api/exercises/level-info/:level_id
- feat(Sprint E+F): parent + teacher dashboard routes
- feat(Sprint D): migration 012, admin/referrer/xendit routes

### cadas-app
- feat(Sprint H): konversi 52 bot WAV → Opus, upload R2 cadas-audio
- feat(Sprint H): api.js botAudioUrl + botVisemeUrl helpers
- feat(Sprint G): api.js parent methods + HomeScreen level name dinamis
- feat(Sprint F): BotCharacter viseme assets, HomeScreen, PracticeScreen, AskKak polish
- feat(Sprint E+F): Parent Dashboard + Teacher Dashboard — routing, screens, store

---

## SKEMA DATABASE

| Tabel | Status | Catatan |
|-------|--------|---------|
| students | OK | referred_by kolom ada |
| parents | OK | |
| parent_children | OK | |
| teachers | OK | is_verified ada; teacher_code BELUM ADA |
| teacher_students | OK | linked_at kolom ada |
| referrers | OK | Kolom baru migration 012 |
| payment_records | OK | |
| xendit_invoices | OK | |
| referrer_earnings | OK | |
| student_sessions | OK | level_id, correct_count, avg_time_ms, total_questions |
| exercises | OK | 5.446 rows level 1-15 |
| levels | OK | 15 rows, kolom: id, name, description |
| _migrations | OK | 001-012 semua tercatat |

---

## INFRASTRUKTUR AUDIO (Sprint H)

| Komponen | Status | Detail |
|----------|--------|--------|
| ffmpeg | OK | v9.0.1 via winget |
| rclone | OK | v1.75.1, config "r2" → Cloudflare R2 |
| R2 bucket | OK | cadas-audio, region Asia Pacific |
| Bot opus R2 | OK | 52 file @ r2:cadas-audio/bot/speech/opus |
| Bot viseme R2 | OK | 52 JSON @ r2:cadas-audio/bot/speech/visemes |
| Exercise cache R2 | NO | 9.771 file belum dikonversi/upload |
| Gemini WAV R2 | NO | 172 file belum dikonversi/upload |
| Domain audio | NO | cadasmatematika.id tersedia di Hostinger, belum dibeli |
| Custom domain R2 | NO | audio.cadasmatematika.id — menunggu domain aktif |

---

## BUG STATUS

| Bug | File | Status |
|-----|------|--------|
| D.0.1: GET /select-variant → POST | rag.js | OK Fixed |
| double-mount /api/admin | index.js | OK Fixed Sprint D |
| parentToken tidak di-restore | App.jsx | OK Fixed Sprint E |
| isParent routing stack salah | App.jsx | OK Fixed Sprint E |
| orphan parent: null di useStore | useStore.js | OK Fixed Sprint E |
| teacher.total_students crash | TeacherDashboardScreen | OK Fixed Sprint F |
| HomeScreen levelSub hardcoded | HomeScreen.jsx | OK Fixed Sprint G.1 |
| api.js botAudioUrl template literal rusak | api.js | OK Fixed Sprint H |
| placement probe concept_id null | data | !! Acceptable beta |
| 446 viseme cache gap | speech/cache/visemes | !! Owner akan perbaiki sendiri |

---

## PERTANYAAN TERBUKA

| # | Pertanyaan | Memengaruhi |
|---|-----------|-------------|
| 1 | Xendit test key sudah ada? | Sprint D.2 live test |
| 2 | Domain cadasmatematika.id — kapan beli? | R2 custom domain, Sprint H.8 |
| 3 | Teacher code: format apa? (6 digit angka? kode unik?) | Sprint G.2 |
| 4 | Link murid-guru: perlu approval dari guru dulu? | Sprint G.2 |
| 5 | Embedding model production: ada-002 atau 384 dim? | Fase 15 |
| 6 | Push notification: pakai Expo Notifications atau Firebase? | Sprint G.3 |
| 7 | Bot reaction audio: pakai Opus dari R2 atau WAV dari bundle? | Sprint H.6 |
| 8 | Exercise cache: konversi semua 9.771 file sekarang atau on-demand? | Sprint H.3 |
