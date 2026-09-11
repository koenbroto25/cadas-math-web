# Progress Log — Cadas App Development
> Diperbarui: 10 September 2026 (Sprint F SELESAI — Teacher Dashboard 100%)
> Simbol: [OK] = terverifikasi | [!!] = ada tapi gap | [NO] = belum ada

---

## RINGKASAN STATUS PER FASE

| Fase | Nama | Backend | Frontend | Catatan |
|------|------|---------|----------|---------|
| 0 | Setup & Orientasi | OK | OK | Selesai |
| 1 | Gap Konten | OK | - | Gap 1.4 belum dikonfirmasi |
| 2 | Backend Foundation | OK | OK | index.js OK; double-mount FIXED Sprint D |
| 3 | Auth & Onboarding | OK | OK | 10 endpoint + 5 screen terverifikasi |
| 4 | Placement Test | OK | OK | start+submit live-tested; variant bias selesai |
| 5 | Practice Loop | OK | OK | selection-rule + PracticeScreen ter-wire |
| 6 | Billing Per-Level | OK | OK | Manual OK; Xendit Sprint D.2 selesai |
| 7 | Fast Track | OK | OK | getLevelAccess() shared, live-tested |
| 8 | RAG Pipeline | !! | OK | Pipeline OK; Bug D.0.1 fixed |
| 9 | Avatar & Gamification | OK | !! | useStore lengkap; BotCharacter belum reverifikasi |
| 10 | Parent Dashboard | OK | OK | Sprint E SELESAI — 4 backend + 4 screen |
| 11 | Guru Dashboard | OK | OK | Sprint F SELESAI — 4 backend + 3 screen |
| 12 | Sprint D: Xendit + Admin + Referrer | OK | OK | D.1-D.7 SEMUA SELESAI |
| 13 | Polish & Beta Test | NO | NO | Belum dimulai |
| 14 | Distribusi & Rilis | NO | NO | Belum dimulai |

---

## SPRINT F — SELESAI SEMUA [OK]

### F.0 Database
- OK Migration 013: teacher_students junction table (UNIQUE teacher_id, student_id)
- OK Indexes: idx_teacher_students_teacher, idx_teacher_students_student

### F.1–F.3 Backend routes/teacher.js
- OK GET /api/teacher/me — profil guru + total_students
- OK GET /api/teacher/students — list murid + snapshot (total_sessions, akurasi, terakhir)
- OK GET /api/teacher/student/:id/progress — stats keseluruhan + per_level breakdown
- OK GET /api/teacher/student/:id/sessions — paginated sessions (page, limit, total)
- OK Helper ownedByTeacher() — guard akses 403 per endpoint
- OK Didaftarkan di index.js sebelum /api/parent
- OK Live-tested semua 4 endpoint (Pak Guru Test + Budi Test 7 sesi)

### F.1b Auth link-student
- OK POST /api/auth/teacher/link-student — guru add murid via student_id
- OK Didaftarkan di auth.js setelah parent/login

### F.4 TeacherAuthScreen.jsx
- OK Mode: login / register (tab switcher)
- OK Register: name, email, password, teacher_type (school/private picker)
- OK Login: email + password
- OK Save token + teacher ke AsyncStorage
- OK Call setTeacherAuth(token, teacher) → trigger isTeacher di App.jsx

### F.5 TeacherDashboardScreen.jsx
- OK Header: greeting + teacher type + murid count + logout
- OK List murid dengan badge: Level, Sesi, Akurasi, Terakhir
- OK Pull-to-refresh
- OK Navigasi ke StudentDetail per murid
- OK Logout: AsyncStorage.multiRemove + clearTeacherAuth()

### F.6 StudentDetailScreen.jsx
- OK Tab switcher: Progress | Sesi
- OK Progress tab: ringkasan stats + per-level breakdown + bar chart akurasi
- OK Sesi tab: infinite scroll paginated + mini bar per sesi
- OK Akurasi color coding: >= 80 hijau, >= 60 kuning, < 60 merah

### F — Routing & Integration
- OK useStore: tambah teacherToken, teacher, setTeacherAuth, clearTeacherAuth
- OK App.jsx: Teacher Stack terpisah (isTeacher kondisional)
- OK App.jsx: bootstrap restore teacherToken dari AsyncStorage
- OK App.jsx: add TeacherAuth ke AUTH STACK
- OK RoleSelectScreen: tombol "Portal Guru" mengarah TeacherAuth

---

## SPRINT E — SELESAI SEMUA [OK]

### E.1–E.3 Backend routes/parent.js
- OK GET /api/parent/children — list anak + snapshot progress
- OK GET /api/parent/child/:id/progress — detail per anak
- OK GET /api/parent/child/:id/sessions — paginated sesi
- OK GET /api/parent/child/:id/billing — payment + xendit records

### E.4–E.6 Frontend 4 screens
- OK ParentDashboardScreen — list anak + badge
- OK ChildProgressScreen — stats + per-level + pull-refresh
- OK ChildSessionsScreen — paginated sesi + bar chart
- OK ChildBillingScreen — payment status + history

### E — Routing & Integration
- OK useStore: parent state + setParentAuth + clearParentAuth
- OK App.jsx: Parent Stack + bootstrap + routing kondisional

---

## SPRINT D — SELESAI SEMUA [OK]

### D.1–D.7
- OK Migration 012 (xendit_invoices, referrer_earnings, etc)
- OK Xendit routes + admin routes + referrer auth
- OK 6 Referrer frontend screens
- OK ReferrerStack routing + restore session

---

## GIT LOG TERKINI
- feat(Sprint F): Teacher Dashboard — 3 screens + routing + RoleSelect button
- feat(Sprint F): routes/teacher.js + auth link-student + migration 013
- feat(Sprint E): Parent Dashboard — 4 backend routes + 4 screens + routing fix
- feat(Sprint D.7): ReferrerStack 6 screens + useStore referrer state

---

## DATABASE — teacher_students

| Kolom | Type | Constraint |
|-------|------|-----------|
| id | uuid | PRIMARY KEY |
| teacher_id | uuid | FK teachers(id) ON DELETE CASCADE |
| student_id | uuid | FK students(id) ON DELETE CASCADE |
| linked_at | timestamptz | DEFAULT now() |
| — | — | UNIQUE(teacher_id, student_id) |

---

## PERTANYAAN TERBUKA

| # | Pertanyaan | Memengaruhi |
|---|-----------|-------------|
| 1 | Kuota AskKak: 38 atau 40 per level? | Fase 8 |
| 2 | Xendit test key sudah ada? | Sprint D.2 |
| 3 | Domain cadas.app untuk /d/:token? | Sprint D.6 |
| 4 | Komisi referrer: transfer bank or kredit? | Sprint D.5 |
| 5 | Guru dashboard: student linking flow — kode unik? | Sprint F+ |
| 6 | Parent notifikasi push — level up? | Sprint G+ |
