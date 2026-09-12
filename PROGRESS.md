# Progress Log - Cadas App Development
> Diperbarui: 12 September 2026 (Sprint E + F + G.1 selesai)
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
| 9 | Avatar & Gamification | OK | OK | BotCharacter + viseme assets committed |
| 10 | Parent Dashboard | OK | OK | Sprint E — 4 backend + 4 screens + routing fix |
| 11 | Teacher Dashboard | OK | !! | Sprint F — backend OK; link-student UI belum ada |
| 12 | Sprint D: Xendit + Admin + Referrer | OK | OK | D.1-D.7 SEMUA SELESAI |
| 13 | Sprint G: Polish | !! | !! | level-info endpoint + HomeScreen dinamis OK; sisanya belum |
| 14 | Distribusi & Rilis | NO | NO | Belum dimulai |

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
| placement probe concept_id null | data | !! Acceptable beta |

---

## PERTANYAAN TERBUKA

| # | Pertanyaan | Memengaruhi |
|---|-----------|-------------|
| 1 | Xendit test key sudah ada? | Sprint D.2 live test |
| 2 | Domain cadas.app untuk /d/:token? | Sprint D.6 |
| 3 | Teacher code: format apa? (6 digit angka? kode unik?) | Sprint G.2 |
| 4 | Link murid-guru: perlu approval dari guru dulu? | Sprint G.2 |
| 5 | Embedding model production: ada-002 atau 384 dim? | Fase 14 |
| 6 | Push notification: pakai Expo Notifications atau Firebase? | Sprint G.3 |
