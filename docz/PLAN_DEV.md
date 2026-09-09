# Cadas Matematika — Development Plan
## Roadmap Teknis Lengkap dari Kondisi Saat Ini ke MVP

**Tanggal:** September 2026  
**Status saat ini:** Backend siap, React Native scaffold siap, belum ada screen yang jalan  
**Target MVP:** Practice loop jalan di HP, bot bersuara, Fast Track aktif

---

## Jawaban Dua Pertanyaan Kunci Dulu

### 1. HTML exercise diproduksi di mana?

**Tetap di `speed-math-master`, bukan di `cadas-app`.**

`speed-math-master` adalah **content pipeline** (generator materi offline):
- Generate exercise dari LLM → simpan ke PostgreSQL
- Render PostgreSQL → HTML file di `output/exercises/`
- Generate TTS audio + visemes
- Semua ini dijalankan sekali (atau saat ada konten baru), bukan saat app berjalan

`cadas-app` hanya **mengkonsumsi** hasil pipeline ini via API:
- `GET /api/exercises/:level` → JSON soal
- `GET /api/tts/:id` → audio on-demand
- WebView load HTML dari URL backend (bukan bundle ke dalam app)

HTML exercise **tidak di-bundle ke dalam cadas-app** — WebView fetch langsung dari Express server. Ini benar karena:
- HTML bisa diupdate di server tanpa update app
- Ukuran app tetap kecil
- 650 HTML file tidak perlu ikut masuk ke APK/IPA

### 2. Animasi Rive di mana?

**Di `cadas-app`, bukan di `speed-math-master`.**

`speed-math-master` sudah punya SVG layer Kak Cadas (13 file) dan Rhubarb visemes — itu untuk pipeline TTS. File `.riv` final dirakit di Rive Editor oleh kamu, lalu hasilnya (`kak_cadas.riv`) diletakkan di:

```
cadas-app/assets/rive/kak_cadas.riv
```

Dan dipakai oleh komponen `BotCharacter.jsx` di React Native via `@rive-app/react-native`.

Untuk MVP (sebelum `.riv` selesai): `BotCharacter.jsx` pakai Image + Animated API (sudah ditulis). Setelah `.riv` siap, tinggal swap komponen — tidak ada yang perlu diubah di logic screen.

---

## Peta Repositori

```
D:\local-rag-voice-bot\
├─ speed-math-master\        ← CONTENT PIPELINE (Node.js + Express + PostgreSQL)
│   ├─ src\                  ← backend API yang dikonsumsi cadas-app
│   ├─ output\exercises\     ← 650 HTML file, diserve via Express static
│   ├─ audio\speech\         ← WAV + visemes JSON, diserve via Express static
│   └─ assets\               ← bot SVG, rive SVG layers
│
└─ cadas-app\                ← REACT NATIVE APP (Expo)
    ├─ src\
    │   ├─ screens\          ← layar app
    │   ├─ components\       ← komponen UI termasuk BotCharacter
    │   ├─ services\api.js   ← komunikasi ke backend
    │   └─ store\useStore.js ← global state (Zustand)
    └─ assets\
        └─ rive\             ← kak_cadas.riv (setelah selesai dirakit)
```

---

## Sprint Plan

### SPRINT 0 — Sudah Selesai ✅
- [x] 650 exercise di PostgreSQL
- [x] 650 HTML exercise ter-render
- [x] 121 WAV + 121 visemes JSON
- [x] Express server jalan port 3000
- [x] `GET /api/exercises/:level` — 50 soal Level 1 return OK
- [x] `GET /api/tts/l1_1?type=hint` — WAV 230KB return OK
- [x] `POST /api/progress/session` + `GET /api/progress/:id` — tabel ready
- [x] React Native scaffold dibuat (Expo)
- [x] Struktur folder `cadas-app/src/` dibuat

---

### SPRINT 1 — Foundation App (Minggu 1)
**Goal:** App bisa jalan di HP, bisa lihat soal via WebView

#### 1.1 Copy file yang sudah dibuat ke cadas-app
- [ ] `App.jsx` → replace `App.js` bawaan Expo
- [ ] `src/services/api.js` → isi dari file yang sudah dibuat
- [ ] `src/store/useStore.js` → isi dari file yang sudah dibuat
- [ ] `src/components/BotCharacter.jsx`
- [ ] `src/components/StreakBar.jsx`
- [ ] `src/components/HintPanel.jsx`
- [ ] `src/screens/HomeScreen.jsx`
- [ ] `src/screens/PracticeScreen.jsx`
- [ ] Ganti IP `192.168.1.x` di `api.js` dengan IP lokal PC

#### 1.2 Buat screen placeholder yang belum ada
File-file ini perlu dibuat biar App.jsx tidak error saat import:
- [ ] `src/screens/AskKakScreen.jsx` — placeholder dulu
- [ ] `src/screens/SettingsScreen.jsx` — placeholder dulu
- [ ] `src/screens/FastTrackScreen.jsx` — placeholder dulu
- [ ] `src/screens/SessionResultScreen.jsx` — placeholder dulu

#### 1.3 Tambah static route di Express untuk serve HTML exercise
Di `speed-math-master/src/index.js` sudah ada `/audio` dan `/assets`.
Perlu tambah satu route untuk serve HTML exercise:
```js
app.use('/exercises', express.static(
  path.join(__dirname, '..', 'output', 'exercises')
));
```
- [ ] Tambahkan route ini ke `src/index.js`
- [ ] Test: buka `http://localhost:3000/exercises/l1_1.html` di browser

#### 1.4 Test end-to-end pertama
- [ ] `npx expo start` di cadas-app
- [ ] Scan QR dengan Expo Go
- [ ] HomeScreen muncul di HP
- [ ] Tap "Mulai Latihan" → PracticeScreen
- [ ] WebView load soal l1_1.html
- [ ] Jawab soal → postMessage ke RN → feedback

**Deliverable Sprint 1:** Bisa jawab soal di HP, bot muncul (image static), hint panel muncul saat salah

---

### SPRINT 2 — Bot Audio & Adaptive Presence (Minggu 2)
**Goal:** Kak Cadas bersuara saat siswa salah, deteksi pola jawaban aktif

#### 2.1 Audio hint on-demand
- [ ] Verify `expo-av` terinstall dan bisa play WAV dari URL
- [ ] Test play `http://{IP}:3000/api/tts/l1_1?type=hint` dari RN
- [ ] Cache audio di device setelah pertama kali didownload (AsyncStorage key → URI)
- [ ] Loading state saat audio sedang di-generate (pertama kali, ~2 detik)

#### 2.2 Adaptive Presence System — fine-tuning
- [ ] Test semua 3 mode bot (mandiri/terbimbing/intensif) di SettingsScreen
- [ ] Deteksi asal-asalan: jika 3 jawaban berturut salah dalam < 3 detik → bot tanya "kamu baik-baik aja?"
- [ ] Deteksi idle 2 menit → bot state `sleeping` (animasi image)
- [ ] BotState transitions semua jalan sesuai spec

#### 2.3 Level audio pre-generated
- [ ] Saat pertama masuk level → play `L{n}_main.wav` (pengantar level)
- [ ] Di HintPanel tab penjelasan → play `L{n}_step1.wav`, `L{n}_step2.wav`, dst
- [ ] Tombol mute/unmute di header practice screen

#### 2.4 Konfirmasi WebView ↔ RN postMessage
- [ ] Jawaban benar → `ANSWER: { correct: true }`
- [ ] Jawaban salah → `ANSWER: { correct: false }`
- [ ] Timer soal mulai saat soal muncul, stop saat jawaban masuk
- [ ] TimeMs masuk ke `recordAnswer()` dengan benar

**Deliverable Sprint 2:** Bot bersuara, 3 layer hint aktif, mode bot bisa diubah

---

### SPRINT 3 — Gamifikasi & Fast Track (Minggu 3)
**Goal:** XP, streak, badge, level up celebration, Fast Track jalan

#### 3.1 XP & Streak system
- [ ] XP per soal benar: base 10, streak 5+ = 15, streak 10+ = 20
- [ ] Streak visual di StreakBar: warna berubah di streak 3, 5, 10
- [ ] Streak hilang jika salah (bukan jika skip)
- [ ] XP harian target: 300 XP

#### 3.2 Fast Track algorithm
- [ ] Confidence Score dihitung setiap 5 soal (tidak perlu tiap soal)
- [ ] Threshold 85% setelah minimum 20 soal → tampilkan banner di HomeScreen
- [ ] FastTrackScreen: 15 soal lebih susah, tanpa hint, timer ketat
- [ ] Lolos → Level Up → navigasi ke LevelUpScreen
- [ ] Tidak lolos → feedback spesifik topik yang lemah

#### 3.3 Level Up Celebration
- [ ] `LevelUpScreen.jsx` — full screen animasi
- [ ] Konfeti (library `react-native-confetti-cannon` atau custom)
- [ ] Badge baru muncul dengan animasi stamp
- [ ] Kalimat personal: "Level {n} cleared! Kamu butuh X hari..."
- [ ] Share card: generate gambar dengan `react-native-view-shot`

#### 3.4 SessionResult screen
- [ ] Recap sesi: berapa benar, salah, rata-rata waktu
- [ ] Perbandingan dengan sesi sebelumnya
- [ ] Save ke `/api/progress/session`
- [ ] Animasi XP earned

**Deliverable Sprint 3:** Gamifikasi lengkap, Fast Track jalan, Level Up celebration

---

### SPRINT 4 — Polish & Konten Tambahan (Minggu 4)
**Goal:** App siap beta test dengan siswa nyata

#### 4.1 Screens yang belum selesai
- [ ] `AskKakScreen.jsx` — bot chat, input teks/suara
- [ ] `SettingsScreen.jsx` — mode bot, audio on/off, profil
- [ ] Onboarding flow (nama siswa, kelas)
- [ ] Simple auth: nama + PIN 4 digit, simpan ke AsyncStorage

#### 4.2 Offline support
- [ ] Cache soal level aktif ke AsyncStorage setelah pertama load
- [ ] Cache audio hint yang sudah pernah didownload
- [ ] Graceful degradation: jika offline, pakai cache; jika tidak ada cache, tampilkan pesan

#### 4.3 Rive integration (jika `.riv` sudah selesai)
- [ ] Install `@rive-app/react-native`
- [ ] Swap `BotCharacter.jsx` dari Image+Animated ke Rive component
- [ ] Connect `botState` dari Zustand ke Rive state machine input
- [ ] Connect `visemeIndex` dari audio playback ke Rive mouth shapes

#### 4.4 Backsound lo-fi
- [ ] Pilih/buat 2-3 track lo-fi (royalty free)
- [ ] Play di background saat practice session
- [ ] Tempo adaptif: lambat saat HintPanel terbuka, normal saat latihan
- [ ] Respek setting mute di SettingsScreen

#### 4.5 Beta test
- [ ] Test dengan 3-5 siswa nyata (SD kelas 4-6)
- [ ] Catat: soal mana yang sering salah, hint mana yang membantu
- [ ] Fix bug kritis sebelum soft launch

**Deliverable Sprint 4:** App siap soft launch, semua screen fungsional

---

### SPRINT 5 — Backend tambahan sebelum launch (paralel Sprint 4)
**Goal:** Backend siap untuk multi-user

#### 5.1 Tabel students + auth
```sql
CREATE TABLE students (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       VARCHAR(100) NOT NULL,
  kelas      VARCHAR(20),
  pin_hash   VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
```
- [ ] `POST /api/students/register` — daftar nama + kelas + PIN
- [ ] `POST /api/students/login` — verifikasi nama + PIN → return student_id
- [ ] Tidak pakai JWT dulu — cukup simpan `student_id` di AsyncStorage

#### 5.2 Placement test endpoint
- [ ] `POST /api/placement/start` — buat placement session
- [ ] `POST /api/placement/submit` — submit jawaban per soal adaptif
- [ ] `GET /api/placement/result/:id` — return level rekomendasi

#### 5.3 Exercise serve via Express static (kritis untuk WebView)
- [ ] Route `/exercises/:id.html` sudah ada (dari Sprint 1.3)
- [ ] CORS header untuk request dari Expo Go di device
- [ ] Gzip compression untuk HTML files (ukuran 4-8KB per file)

---

## Urutan Eksekusi Hari Ini

1. **Sekarang:** Tambah route `/exercises` static di `speed-math-master/src/index.js`
2. **Setelah itu:** Copy semua file ke `cadas-app` sesuai struktur
3. **Setelah itu:** Buat 4 screen placeholder
4. **Setelah itu:** Jalankan `npx expo start`, test di HP

---

## Dependency Penting yang Perlu Diingat

```
cadas-app dependencies:
@react-navigation/native          — navigasi
@react-navigation/bottom-tabs     — tab bar
@react-navigation/native-stack    — stack navigator
react-native-screens              — dep navigasi
react-native-safe-area-context    — safe area
react-native-gesture-handler      — gesture
react-native-reanimated           — animasi
expo-av                           — audio playback
expo-linear-gradient              — gradient
@expo/vector-icons                — icon tab bar
zustand                           — state management
react-native-webview              — embed HTML exercise

Menyusul (Sprint 3-4):
react-native-confetti-cannon      — konfeti level up
react-native-view-shot            — share card screenshot
@rive-app/react-native            — Rive avatar (setelah .riv selesai)
```

---

## Checklist Sebelum Beta Test

```
BACKEND:
[ ] Semua endpoint return data yang benar
[ ] HTML exercise bisa diakses via URL dari device HP
[ ] TTS cache berjalan (file .wav tersimpan di server)
[ ] CORS dikonfigurasi benar untuk Expo Go

REACT NATIVE:
[ ] Semua screen bisa dibuka tanpa crash
[ ] WebView load HTML exercise dari server
[ ] postMessage jawaban benar/salah diterima RN
[ ] Audio hint play setelah siswa salah
[ ] Bot animasi berubah sesuai state
[ ] Streak dan XP terupdate real-time
[ ] Fast Track trigger setelah confidence > 85%
[ ] Progress tersimpan ke server setelah sesi selesai

UX:
[ ] Tidak ada loading > 3 detik tanpa indikator
[ ] Semua teks terbaca di layar HP kecil (min 375px wide)
[ ] Touch target minimal 44x44px
[ ] Bisa dimute semua suara dari settings
```
