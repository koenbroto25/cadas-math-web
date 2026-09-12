# Progress Log - Cadas App Development
> Diperbarui: 13 September 2026 (Sprint H.4-H.6 selesai)
> Simbol: [OK] = terverifikasi live | [!!] = ada tapi gap | [NO] = belum ada

---

## RINGKASAN STATUS PER FASE

| Fase | Nama | Backend | Frontend | Catatan |
|------|------|---------|----------|---------|
| 0 | Setup & Orientasi | OK | OK | Selesai |
| 1 | Gap Konten | OK | - | Gap 1.4 belum dikonfirmasi |
| 2 | Backend Foundation | OK | OK | index.js OK |
| 3 | Auth & Onboarding | OK | OK | 10 endpoint + 5 screen terverifikasi |
| 4 | Placement Test | OK | OK | start+submit live-tested |
| 5 | Practice Loop | OK | OK | selection-rule + PracticeScreen 382→420 baris |
| 6 | Billing Per-Level | OK | OK | Manual OK; Xendit selesai |
| 7 | Fast Track | OK | OK | getLevelAccess() shared, live-tested |
| 8 | RAG Pipeline | !! | OK | Pipeline OK; Bug D.0.1 fixed |
| 9 | Avatar & Gamification | OK | OK | BotCharacter + viseme + 52 bot audio mapped |
| 10 | Parent Dashboard | OK | OK | Sprint E selesai |
| 11 | Teacher Dashboard | OK | OK | Sprint F selesai + G.2 link-guru UI |
| 12 | Sprint D: Xendit + Admin + Referrer | OK | OK | D.1-D.7 SEMUA SELESAI |
| 13 | Sprint G: Polish | OK | OK | G.1 + G.2 selesai; G.3 belum |
| 14 | Sprint H: Audio Infrastructure | OK | OK | H.1-H.6 selesai; domain R2 belum |
| 15 | Distribusi & Rilis | NO | NO | Belum dimulai |

---

## PERBEDAAN DOKUMEN vs APLIKASI AKTUAL (ditemukan & diperbaiki 12-13 Sep 2026)

| # | Gap yang ditemukan | Status |
|---|-------------------|--------|
| 1 | parentToken tidak di-restore saat boot | FIXED |
| 2 | isParent routing stack salah (stuck di Main) | FIXED |
| 3 | orphan key `parent: null` di useStore | FIXED |
| 4 | TeacherDashboard crash jika teacher null | FIXED |
| 5 | HomeScreen levelSub hardcoded | FIXED |
| 6 | api.js duplikat + entry rusak botAudio/parent | FIXED |
| 7 | PracticeScreen bot audio tidak terhubung ke 52 file | FIXED |
| 8 | /api/tts masih serve lokal WAV bukan R2 Opus | FIXED |

---

## SPRINT E — PARENT DASHBOARD (SELESAI)

- OK GET /api/parent/children + progress + sessions + billing
- OK POST /api/auth/parent/register + login + link-child
- OK ParentDashboardScreen, ChildProgressScreen, ChildSessionsScreen, ChildBillingScreen
- OK App.jsx isParent stack (terpisah, dengan bootstrap restore)
- OK useStore: parentToken, parentProfile, setParentAuth, clearParentAuth
- OK api.js: parentChildren, parentChildProgress, parentChildSessions, parentChildBilling

---

## SPRINT F — TEACHER DASHBOARD (SELESAI)

- OK GET /api/teacher/me + students + student/:id/progress + sessions
- OK POST /api/auth/teacher/register + login + link-student
- OK Migration 013: teacher_code kolom (6 char unique, auto-generated)
- OK GET /api/auth/teacher/by-code/:code — public endpoint
- OK POST /api/auth/student/link-teacher — murid input kode guru
- OK TeacherAuthScreen, TeacherDashboardScreen, StudentDetailScreen
- OK App.jsx isTeacher stack + bootstrap restore
- OK SettingsScreen: input kode 6 char → link ke guru (live-tested kode 15CCC0)

---

## SPRINT G — POLISH (G.1 + G.2 SELESAI, G.3 BELUM)

### G.1 Selesai
- OK GET /api/exercises/level-info/:level_id (live-tested: "Addition +1", "Multiplication Tables")
- OK HomeScreen levelSub dinamis dari API

### G.2 Selesai
- OK Migration 013 teacher_code
- OK GET /api/auth/teacher/by-code/:code
- OK POST /api/auth/student/link-teacher
- OK SettingsScreen link-guru UI (TextInput 6 char + tombol Hubungkan)

### G.3 Belum
- NO Global error boundary React Native
- NO Offline detection + retry
- NO Push notification naik level
- NO Xendit test key live test

---

## SPRINT H — AUDIO INFRASTRUCTURE (H.1-H.6 SELESAI)

### H.1-H.3 Selesai (audit, konversi, upload R2)
- OK Total R2: 19.886 file (~208 MB) di bucket cadas-audio
- OK bot/speech/opus: 52 file | bot/speech/visemes: 52 JSON
- OK speech/cache/opus: 9.771 | speech/cache/visemes: 9.771
- OK speech/gemini/opus: 120 | speech/gemini/visemes: 120

### H.4 Selesai — Backend serve R2
- OK R2_PUBLIC_URL=https://pub-525e5eaf26164322afff13a0b9efb5f5.r2.dev (di .env, gitignored)
- OK GET /api/tts/:id → redirect 302 ke R2 Opus (fallback lokal WAV)
- OK GET /api/viseme/:id → redirect 302 ke R2 JSON
- OK GET /api/bot-audio/:file → redirect 302 ke R2 Opus
- OK Live-tested: 3/3 endpoint return 302 dengan Location R2 ✅

### H.5 Selesai — api.js bersih
- OK ttsUrl: → /api/tts/:id?type=
- OK visemeUrl: → /api/viseme/:id?type= (sebelumnya lokal path)
- OK botAudioUrl: → /api/bot-audio/:id (sebelumnya rusak/duplikat)
- OK levelAudioUrl: → /audio/speech/gemini/opus/ (update ke opus)
- OK parentChild* methods fix (sebelumnya path string rusak)

### H.6 Selesai — PracticeScreen bot audio mapping
- OK playBotAudio() helper terpisah dari playSound() exercise TTS
- OK Welcome audio by level range (bot_welcome_l1_l3 ~ l13_l15, welcome_back)
- OK handleCorrect: correct_01~05 acak / after_wrong / last / weak / streak 3/5/10
- OK handleCorrect: speed feedback (kilat/cepat/pelan) 15% chance
- OK handleWrong: wrong_01 / after_hint / 3row / many / trick / weak
- OK Streak break detection: break_short (≥3) / break_long (≥5)
- OK Idle: bot_idle_30s @ 30s, bot_idle_60s @ 60s, sleeping @ 120s
- OK prevStreakRef untuk track streak break
- OK botSoundRef terpisah dari soundRef

### H.7-H.8 Belum
- NO Domain cadasmatematika.id (tersedia di Hostinger, belum dibeli)
- NO Custom domain R2: audio.cadasmatematika.id

---

## SPRINT D — SELESAI SEMUA
- OK D.1-D.7: migration, Xendit, admin, referrer, frontend 6 screens

---

## GIT LOG TERKINI

### cadas-app (frontend)
- feat(Sprint H.6): PracticeScreen — bot reaction audio lengkap 52 file mapping
- fix(Sprint H.5): api.js rewrite bersih
- feat(Sprint G.2): SettingsScreen link-guru UI + HomeScreen level name dinamis
- feat(Sprint E-G): parent dashboard, viseme, bot audio, screens

### cadas-app-backend
- feat(Sprint H.4): /api/tts + /api/viseme + /api/bot-audio redirect ke R2 Opus
- feat(Sprint G.2): teacher_code migration + by-code + student/link-teacher
- feat(Sprint E+F): parent + teacher dashboard routes

---

## SKEMA DATABASE

| Tabel | Status | Catatan |
|-------|--------|---------|
| students | OK | referred_by ada |
| parents | OK | |
| parent_children | OK | |
| teachers | OK | teacher_code kolom ada (migration 013) |
| teacher_students | OK | linked_at ada |
| referrers | OK | migration 012 |
| payment_records | OK | |
| xendit_invoices | OK | |
| student_sessions | OK | level_id, correct_count, avg_time_ms |
| exercises | OK | 5.446 rows level 1-15 |
| levels | OK | 15 rows |
| _migrations | OK | 001-013 tercatat |

---

## BUG STATUS

| Bug | Status |
|-----|--------|
| D.0.1: GET /select-variant → POST | OK Fixed |
| double-mount /api/admin | OK Fixed |
| parentToken tidak di-restore | OK Fixed |
| isParent routing stack salah | OK Fixed |
| orphan parent: null di useStore | OK Fixed |
| teacher.total_students crash | OK Fixed |
| HomeScreen levelSub hardcoded | OK Fixed |
| api.js duplikat botAudio + parent path rusak | OK Fixed |
| /api/tts serve lokal WAV bukan R2 | OK Fixed |
| PracticeScreen bot audio tidak terpetakan | OK Fixed |
| placement probe concept_id null | !! Acceptable beta |

---

## PERTANYAAN TERBUKA

| # | Pertanyaan | Memengaruhi |
|---|-----------|-------------|
| 1 | Xendit test key? | Live payment test |
| 2 | Domain cadasmatematika.id — kapan beli? | R2 custom domain |
| 3 | Link murid-guru: perlu approval guru? | G.2 UX |
| 4 | Push notification: Expo atau Firebase? | G.3 |
| 5 | Embedding model production: ada-002 atau 384 dim? | Fase 15 |

---

## NEXT SPRINT KANDIDAT

| Priority | Task |
|----------|------|
| 🔴 High | SessionResultScreen — save session ke DB + level-up detection |
| 🔴 High | Xendit live test dengan test key |
| 🟡 Medium | G.3: error boundary + offline detection |
| 🟡 Medium | Domain + R2 custom domain audio.cadasmatematika.id |
| 🟢 Low | Push notification naik level |
| 🟢 Low | Admin mobile view |
