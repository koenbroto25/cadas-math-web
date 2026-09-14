# Progress Log - Cadas App Development
> Diperbarui: 14 September 2026 — Sprint H+I+J+K SELESAI SEMUA termasuk K.RAG corpus BGE-M3
> Simbol: [OK] = terverifikasi live | [!!] = ada tapi gap | [NO] = belum ada

---

## RINGKASAN STATUS PER FASE

| Fase | Nama | Backend | Frontend | Catatan |
|------|------|---------|----------|---------|
| 0 | Setup & Orientasi | OK | OK | Selesai |
| 1 | Gap Konten | OK | - | 5.446 exercises L1-15 di DB |
| 2 | Backend Foundation | OK | OK | index.js OK, 016 migrations |
| 3 | Auth & Onboarding | OK | OK | 10 endpoint + 5 screen |
| 4 | Placement Test | OK | OK | start+submit live-tested |
| 5 | Practice Loop | OK | OK | PracticeScreen 531 baris, H.6 bot audio 52 file |
| 6 | Billing Per-Level | OK | OK | Midtrans sandbox live-tested Sprint J |
| 7 | Fast Track | OK | OK | getLevelAccess() shared, live-tested |
| 8 | RAG Pipeline | OK | OK | BGE-M3 1024-dim, 14.926 chunks, MRR@10=0.9997 ✅ |
| 9 | Avatar & Gamification | OK | !! | Bot audio 52 file OK; GAP-1,2,3 minor |
| 10 | Parent Dashboard | OK | OK | Sprint E selesai + payment notification |
| 11 | Teacher Dashboard | OK | OK | Sprint F + G.2 link-guru selesai |
| 12 | Xendit→Midtrans + Admin + Referrer | OK | OK | Sprint D + I + J selesai |
| 13 | Sprint G: Polish | OK | !! | G.1+G.2 OK; G.3 belum |
| 14 | Sprint H: Audio Infrastructure | OK | OK | H.1-H.8 selesai; H.9 domain pending |
| I | Sprint I: Referral Sekolah+Marketing | OK | OK | Migration 015, split fee, trial enforcement |
| J | Sprint J: Midtrans Sandbox | OK | - | Full flow verified 13 Sep 2026 |
| K | Sprint K: RAG/LLM Overhaul | OK | OK | SELESAI — corpus 14.926 chunks, MRR@10=0.9997, Recall@10=100% |
| L | Sprint L: Demo Mode | NO | NO | PLANNED — admin/marketing/passcode client |
| 15 | Distribusi & Rilis | NO | NO | Belum dimulai |

---

## AUDIT KODE AKTUAL — 13 Sep 2026

### ✅ Sudah Beres

**PracticeScreen.jsx (531 baris):**
- OK playBotAudio() + playSound() terpisah bersih
- OK 52 bot audio file mapped: CORRECT_SOUNDS[5], streak_3/5/10, correct_after_wrong/weak/last, speed_kilat/cepat/pelan, wrong_01/after_hint/trick/3row/many/weak, streak_break_short/long, idle_30s/60s, welcome_l1_l3/l4_l7/l8_l12/l13_l15/back
- OK Idle timer: 30s audio, 60s audio, 120s sleeping
- OK prevStreakRef untuk streak break detection
- OK saveSession await + didLevelUp + newLevelVal + sessionCount dari response
- OK levelAccess di-pass ke SessionResult navigate params (Sprint I)
- OK Fast Track Alert saat confidence > 0.85

**SessionResultScreen.jsx:**
- OK 5 bot_levelup_* audio: few(≤4), many(≥9), skill_weak(≤87%), speed_slow, speed_good
- OK 5 bot_result_* audio: perfect(≥95%), pass(≥75%), medium(≥50%), close(≥30%), far(<30%)
- OK Payment notification banner saat levelUp + levelAccess=trial/locked (Sprint I)

**ParentDashboardScreen.jsx:**
- OK Badge "Perlu Bayar" saat paid_basic_up_to_level < current_level
- OK Summary banner di header jika ada anak perlu bayar
- OK CTA "Bayar Sekarang" → ChildBilling

**progress.js:**
- OK Level-up: 3 sesi terakhir ≥80% konsekutif
- OK session_count di response
- OK race condition fix (Sprint I+J commit)

**admin.js:**
- OK Split fee otomatis sekolah 30% + marketing 10%
- OK GET/PUT /api/admin/referral-settings
- OK GET/POST/PUT/DELETE /api/admin/school-marketing-links
- OK referrer type: school|marketing|parent|student + is_active

### ❌ Gap yang Masih Ada

| # | Gap | File | Prioritas |
|---|-----|------|-----------|
| GAP-1 | bot_correct_weak kemungkinan 404 di R2 | PracticeScreen | 🔴 |
| GAP-2 | bot_wrong_weak kemungkinan 404 di R2 | PracticeScreen | 🔴 |
| GAP-3 | bot_wrong_3row vs bot_wrong_3_row — cek nama file R2 | PracticeScreen | 🟠 |
| GAP-5 | companionLevel + incrementCompanion() tidak pernah dipanggil | useStore | 🟡 |
| GAP-6 | BotCharacter showCompanion tidak dikirim di PracticeScreen | PracticeScreen | 🟡 |
| GAP-7 | XP tidak di-reset di setExercises — akumulasi lintas sesi | useStore | 🟡 |
| GAP-8 | bot_placement_speed + bot_placement_skill — cek nama file R2 | PlacementResultScreen | 🟠 |
| GAP-9 | upgrade-test.js tidak punya bot audio | FastTrackScreen | 🟡 |

---

## SPRINT E — PARENT DASHBOARD (SELESAI)
- OK GET /api/parent/children + progress + sessions + billing
- OK POST /api/auth/parent/register + login + link-child
- OK ParentDashboardScreen + payment badge + summary banner (Sprint I)
- OK App.jsx isParent stack + bootstrap restore parentToken

---

## SPRINT F — TEACHER DASHBOARD (SELESAI)
- OK GET /api/teacher/me + students + student/:id/progress + sessions
- OK POST /api/auth/teacher/register + login + link-student
- OK Migration 013: teacher_code (6 char unique)
- OK SettingsScreen link-guru UI — live-tested kode 15CCC0

---

## SPRINT G — POLISH
### G.1 + G.2 Selesai
- OK GET /api/exercises/level-info/:level_id
- OK HomeScreen levelSub dinamis
- OK SettingsScreen link-guru UI

### G.3 Belum
- NO Global error boundary
- NO Offline detection + retry
- NO Push notification naik level

---

## SPRINT H — AUDIO INFRASTRUCTURE (SELESAI kecuali H.9)

### H.1-H.3: R2 Upload
- OK ~3.2 GB WAV → Opus 24kbps; 44 corrupt → regen; 19.886 file ~208 MB di R2
- OK bot/speech/opus: 52 | cache/opus: 9.771 | gemini/opus: 120

### H.4-H.7: Backend + api.js + Bot Audio + Viseme
- OK 4 endpoint redirect R2: /api/tts, /api/viseme, /api/bot-audio, /api/bot-viseme
- OK playBotAudio() + viseme lip-sync di semua screen

### H.8: Level-up flow
- OK 3 sesi terakhir ≥80% konsekutif; session_count di response

### H.9: Domain
- NO cadasmatematika.id (tersedia di Hostinger, belum dibeli)

---

## SPRINT I — REFERRAL SEKOLAH + MARKETING (SELESAI 13 Sep 2026)

### I.1 Migration 015
- OK ALTER referrers: +type (school|marketing|parent|student) + is_active
- OK CREATE referral_settings (9 key: school_rate=30%, marketing_rate=10%)
- OK CREATE school_marketing_links
- OK ALTER referrer_earnings: +split_group_id + referrer_type

### I.2 admin.js baru
- OK Split fee otomatis calcSplitFee() + saveEarnings()
- OK GET/PUT /api/admin/referral-settings
- OK GET/POST/PUT/DELETE /api/admin/school-marketing-links
- OK PATCH /api/admin/referrers/:id/toggle-active

### I.3 Trial Enforcement
- OK Migration 015: student_trial_usage (student_id, level_id, questions_used)
- OK exercises.js GET /:level: kalau trial, return 5 soal saja + trial_mode: true
- OK progress.js POST /session: increment trial_questions_used
- OK upgrade-test.js submit: UPDATE trial_level = level_to saat lulus
- OK getLevelAccess(): cek trial_questions_used ≥ 5 → return 'trial_exhausted'

### I.4 Payment Notification Frontend
- OK SessionResultScreen: banner upgrade saat levelUp + levelAccess=trial
- OK ParentDashboardScreen: badge + banner "Perlu Bayar" + summary header
- OK PracticeScreen: pass levelAccess ke SessionResult navigate

---

## SPRINT J — MIDTRANS SANDBOX (SELESAI 13 Sep 2026)
- OK Midtrans Snap token + redirect URL
- OK Webhook /api/midtrans/notification: verifikasi signature, update status
- OK race condition fix progress.js
- OK Migration 014: rename xendit_invoices → midtrans_invoices
- OK Full flow verified: create invoice → payment → webhook → billing activated

---

## SPRINT K — RAG/LLM OVERHAUL (IN PROGRESS)

### K.1 Audit Semantic Search — SELESAI
- OK Ditemukan: 15 baris di explanations_embedding, hashing-trick (fake embedding 384-dim)
- OK ~16.000 exercise chunks tidak ter-embed sama sekali
- OK Keputusan: rebuild corpus dengan BGE-M3 1024-dim via Ollama lokal

### K.2 Upgrade Model LLM — SELESAI
- OK Ganti gpt-4o-mini → google/gemini-2.5-flash via OpenRouter
- OK openrouter-client.js: default model + fallback gpt-4o-mini

### K.3 Trial & Access Control — SELESAI (via Sprint I.3)
- OK 5 soal limit enforced di exercises.js
- OK trial_exhausted state di getLevelAccess()
- OK AskKakScreen: trial → text-only (no LLM, no TTS)

### K.4 Post-LLM Math Filter — SELESAI
- OK math-validator.js: extractNumbers, evalMathQuestion, validateAnswer, correctAnswer
- OK Integrate di pipeline.js setelah orResult.text

### K.5 Kuota Premium + Notifikasi — SELESAI
- OK openRouterFallback(): cek student_level_quota sebelum LLM
- OK Response: quotaExhausted + resetAt jika kena limit
- OK AskKakScreen: banner kuota habis + waktu reset

### K.6 setLevelAccess Integration — SELESAI
- OK exercises.js level-info: return level_access jika student_id ada
- OK HomeScreen: fetch level-info + setLevelAccess(data.level_access)
- OK AskKakScreen isPremium sekarang benar dari store

### K.RAG — Corpus Rebuild BGE-M3 (SELESAI 13 Sep 2026)
- OK Migration 016: ALTER vector 384→1024, +exercise_id, +chunk_type, ivfflat index
- OK scripts/build-rag-corpus.js: extract chunks, embed BGE-M3, insert batch 200
- OK pipeline.js: generateEmbedding BGE-M3, semanticSearch baru, threshold 0.55/0.40
- OK Deduplikasi: 16.244 → 14.926 chunks (-1.318 duplikat)
  - Level 8 speech_text: 329 → 1 unique (teks identik di DB)
  - Level 8 hint_text: 350 → 290 unique
- OK REINDEX ivfflat selesai

**Hasil Backtest Final (Post-Dedup):**

| Metrik | Pre-dedup | Post-dedup |
|---|---|---|
| MRR@10 | 0.9468 | **0.9997** ✅ |
| Recall@10 | 97.8% | **100%** ✅ |
| Recall@1 | 92.3% | **99.9%** ✅ |
| Cross-type R@10 | 38.0% | **46.0%** |
| Corpus size | 16.244 | **14.926** |

**Threshold Final (confirmed):**
- SIM_STRONG = 0.55 | SIM_PARTIAL = 0.40 — tidak perlu perubahan

---

## SPRINT L — DEMO MODE (PLANNED)

### Latar Belakang
Marketing akan presentasi ke sekolah-sekolah. Perlu mode khusus yang:
- Bypass semua level lock dan paywall
- Pilih level bebas 1-15
- Full premium (AskKak + TTS + LLM aktif)
- Data tidak disimpan ke DB — hanya di memory/store
- Reset otomatis saat logout/exit

### Tiga Tipe Akses Demo

| Tipe | Siapa | Cara Masuk | Durasi | Reset |
|------|-------|-----------|--------|-------|
| **Admin** | Developer/owner | Passcode admin di RoleSelect (tersembunyi) | Permanen | Saat logout |
| **Marketing** | Referrer type=marketing | Login referrer existing | Permanen | Saat logout |
| **Client** | Sekolah/calon klien | Passcode 4 digit dari admin | 2 jam | Expired otomatis + saat exit |

### Arsitektur

```
useStore: tambah demoMode state
├── demoMode: false | 'admin' | 'marketing' | 'client'
├── demoExpiresAt: null | timestamp (untuk client 2 jam)
├── setDemoMode(type, expiresAt?)
└── clearDemoMode()

Demo mode efeknya:
├── levelAccess → selalu 'premium' di semua level
├── currentLevel → bisa set bebas 1-15 (LevelPickerModal)
├── saveSession → skip (tidak hit backend)
├── sessionResults → di store saja, reset saat clearDemoMode()
└── Banner "Mode Demo" di HomeScreen + PracticeScreen
```

### Backend yang Dibutuhkan

**1. Passcode Admin (di index.js atau auth.js):**
```
POST /api/auth/demo/admin-login
Body: { secret }  ← ADMIN_DEMO_SECRET di .env
Response: { ok: true, demo_type: 'admin' }
Tidak pakai JWT — state hanya di frontend store
```

**2. Passcode Client 4 digit (di admin.js):**
```
POST /api/admin/demo/generate-passcode
Header: x-admin-secret
Body: { label? }  ← opsional label "SMAN 5 Banjarmasin"
Response: { passcode: "4829", expires_at: "...", label }

POST /api/auth/demo/client-login
Body: { passcode }
Response: { ok: true, demo_type: 'client', expires_at, label }
Simpan passcode di DB tabel demo_passcodes (in-memory atau tabel sementara)
```

**3. Marketing — deteksi dari referrer login existing:**
```
Saat referrer login berhasil + type='marketing':
→ setDemoMode('marketing') otomatis di frontend
→ tidak perlu endpoint baru
```

### Frontend yang Dibutuhkan

**1. useStore.js — tambah demo state:**
```js
demoMode: null,         // null | 'admin' | 'marketing' | 'client'
demoExpiresAt: null,    // Date | null
setDemoMode: (type, expiresAt) => set({ demoMode: type, demoExpiresAt: expiresAt ?? null }),
clearDemoMode: () => set({ demoMode: null, demoExpiresAt: null }),
isDemoActive: () => {
  const { demoMode, demoExpiresAt } = get();
  if (!demoMode) return false;
  if (demoExpiresAt && new Date() > new Date(demoExpiresAt)) return false;
  return true;
},
```

**2. RoleSelectScreen.jsx — tambah entry point demo:**
```
Tombol tersembunyi kecil di bawah: "Mode Demo"
→ Modal muncul dengan 2 pilihan:
  [Input passcode admin] ← untuk admin/owner
  [Input passcode client 4 digit] ← untuk klien yang dapat dari marketing
Marketing: masuk via ReferrerLogin existing, auto-detect
```

**3. DemoModeModal (komponen baru):**
```
Input passcode → validasi ke backend → setDemoMode → navigate ke DemoHome
```

**4. DemoHomeScreen atau modifikasi HomeScreen:**
```
Jika isDemoActive():
├── Banner kuning "⚡ MODE DEMO — [Admin/Marketing/Client]"
├── Level Picker: ScrollView level 1-15 (bisa tap langsung)
├── Semua level tampil unlocked (warna cyan, tidak ada lock)
├── Timer countdown untuk client (sisa waktu demo)
└── Tombol "Keluar Demo" → clearDemoMode + navigate RoleSelect
```

**5. PracticeScreen — guard demo:**
```js
// Di handleCorrect, sebelum saveSession:
if (useStore.getState().isDemoActive()) {
  // Skip saveSession, langsung navigate SessionResult
  navigation.navigate('SessionResult', { ...params, levelAccess: 'premium' });
  return;
}
```

**6. getLevelAccess override:**
```js
// Di HomeScreen/PracticeScreen, saat fetch level-info:
if (isDemoActive()) {
  setLevelAccess('premium');
  return; // skip fetch
}
```

### Migration yang Dibutuhkan

**Migration 017 — demo_passcodes:**
```sql
CREATE TABLE demo_passcodes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passcode    CHAR(4) NOT NULL UNIQUE,
  label       TEXT,
  expires_at  TIMESTAMPTZ NOT NULL,
  used_count  INTEGER DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
-- Auto-expire: passcode > 2 jam otomatis tidak valid
-- Admin bisa lihat + revoke via GET/DELETE /api/admin/demo/passcodes
```

### Urutan Implementasi

| Step | Task | File |
|------|------|------|
| L.1 | Migration 017 demo_passcodes | migrations/017_demo_passcodes.sql |
| L.2 | Backend: POST /api/auth/demo/admin-login + client-login | auth.js |
| L.3 | Backend: POST /api/admin/demo/generate-passcode + GET/DELETE list | admin.js |
| L.4 | useStore: demoMode + demoExpiresAt + isDemoActive() | useStore.js |
| L.5 | RoleSelectScreen: tombol "Mode Demo" tersembunyi + DemoModeModal | RoleSelectScreen.jsx |
| L.6 | App.jsx: isDemo stack (DemoHome) | App.jsx |
| L.7 | DemoHomeScreen: level picker 1-15 + banner + timer | DemoHomeScreen.jsx (baru) |
| L.8 | HomeScreen: banner demo + override levelAccess | HomeScreen.jsx |
| L.9 | PracticeScreen: skip saveSession saat demo | PracticeScreen.jsx |
| L.10 | ReferrerLoginScreen: auto-setDemoMode jika type=marketing | ReferrerLoginScreen.jsx |
| L.11 | Marketing login: deteksi type dari referrer profile | ReferrerLoginScreen.jsx |

### Catatan Penting
- Passcode admin (`ADMIN_DEMO_SECRET`) di `.env` — **tidak boleh di-commit ke git**
- Client passcode 4 digit: generate baru tiap sesi presentasi, expired 2 jam
- Data demo tidak masuk DB — aman untuk demo ke banyak klien
- Marketing auto-enter demo saat login referrer (tidak perlu passcode terpisah)
- Admin bisa revoke passcode client kapan saja via endpoint DELETE



### Sprint L — Dashboard Guru Lanjutan
- Virtual Classrooms (grup kelas dengan sub-code)
- E-Rapor Export (CSV/PDF)
- Diagnostic Insights (AI ringkasan topik sulit per kelas)
- Recognition System ("Kirim Semangat" dari guru)

### Sistem Bisnis
- Single Account Settlement (fee ke rekening institusi)
- Marketing-to-School Pipeline (portal tertutup)
- Flexible Commission per teacher_code

---

## GIT LOG TERKINI

### cadas-app (frontend)
- chore: restore bot SVG assets, untrack audio R2, fix .gitignore
- feat(Sprint I): payment notification SessionResult+Parent, levelAccess navigate
- feat(level-up): saveSession await + bot_levelup_* 5 file SessionResultScreen
- fix(H.7): PlacementScreen + SessionResultScreen bot audio + viseme lip-sync

### cadas-app-backend
- feat(Sprint I+J+K): referral split fee, trial enforcement, race condition fix, midtrans webhook, route cleanup
- feat(Sprint I): trial enforcement, 5 soal limit, upgrade-test trial_level
- feat(level-up): session_count di response saveSession

---

## SKEMA DATABASE

| Tabel | Status | Catatan |
|-------|--------|---------|
| students | OK | referred_by, trial_level, paid_basic/premium_up_to_level |
| parents | OK | |
| parent_children | OK | |
| teachers | OK | teacher_code (migration 013) |
| teacher_students | OK | |
| referrers | OK | type, is_active (migration 015) |
| referral_settings | OK | 9 key: school_rate=30%, marketing_rate=10% |
| school_marketing_links | OK | UNIQUE school+marketing |
| referrer_earnings | OK | split_group_id, referrer_type |
| payment_records | OK | |
| midtrans_invoices | OK | rename dari xendit (migration 014) |
| student_sessions | OK | level_id, correct_count, avg_time_ms, results |
| student_trial_usage | OK | student_id, level_id, questions_used (migration 015) |
| explanations_embedding | OK | vector(1024) BGE-M3, 14.926 chunks, dedup selesai |
| exercises | OK | 5.446 rows L1-15 |
| levels | OK | 15 rows |
| _migrations | OK | 001-016 semua tercatat |

---

## BUG STATUS

| Bug | Status |
|-----|--------|
| currentLevel reset ke 1 tiap restart | OK Fixed (App.jsx setLevel di bootstrap) |
| isTeacher tanpa guard !isLoggedIn | OK Fixed |
| needPlacement stack tanpa ParentAuth | OK Fixed |
| Logout tidak hapus semua token | OK Fixed (SettingsScreen multiRemove) |
| BotCharacter tidak dirender SessionResult | OK Fixed |
| levelAccess tidak ada di store | OK Fixed (useStore + setLevelAccess) |
| saveSession fire-and-forget (GAP-4) | OK Fixed (PracticeScreen async IIFE) |
| api.js duplikat botAudio | OK Fixed |
| /api/tts serve WAV lokal bukan R2 | OK Fixed |
| placement probe concept_id null | !! Acceptable beta |
| GAP-1,2: bot_correct/wrong_weak 404 R2 | !! Perlu verifikasi nama file R2 |

---

## PERTANYAAN TERBUKA

| # | Pertanyaan | Memengaruhi |
|---|-----------|-------------|
| 1 | Domain cadasmatematika.id — kapan beli? | R2 custom domain H.9 |
| 2 | AskKak live test dengan siswa nyata — kualitas jawaban? | Sprint L |
| 4 | Internal beta test — kapan? | Sprint 15 |
| 5 | Fee sekolah — approval guru dulu atau otomatis? | Sprint L |
