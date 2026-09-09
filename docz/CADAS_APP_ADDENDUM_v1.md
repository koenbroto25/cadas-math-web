# 📋 CADAS APP — ADDENDUM KEPUTUSAN v1.0
## Revisi & Keputusan Baru Setelah PLAN_DEV_v3_1

**Tanggal:** 8 September 2026
**Status:** Final — siap dituangkan ke sprint plan
**Cara pakai dokumen ini:** Dokumen ini BUKAN pengganti PLAN_DEV_MATERIAL_GENERATOR_v2.md, PLAN_DEV_v2.md, atau PLAN_DEV_v3_1.md. Baca dokumen-dokumen itu dulu untuk konteks penuh arsitektur, sprint, dan skema. Dokumen ini hanya mencatat apa yang **berubah** atau **baru diputuskan** dari diskusi lanjutan, dengan referensi eksplisit ke bagian mana di v3.1 yang direvisi.

---

## RINGKASAN PERUBAHAN UTAMA

1. Model `is_premium` global (all-or-nothing) di v3.1 **diganti total** — premium sekarang granular per level, dua tingkat (Basic/Premium) per level, bukan satu boolean untuk semua level.
2. Harga final ditetapkan: individual dan kelompok, Basic dan Premium.
3. Kuota AskKak Premium per level didefinisikan eksplisit (bukan tanpa batas).
4. Komisi referrer dihitung per transaksi (per level/bundel dibeli), bukan recurring per bulan.
5. Alur pengajuan referrer diformalkan — tidak semua tipe referrer otomatis dapat akses.
6. Alur onboarding baru: placement test sebagai "trial" implisit, bukan trial konten terpisah.
7. Model bisnis: tanpa trial konten, tanpa toko aplikasi untuk pembayaran, distribusi Android-first.

---

## 1. MODEL PEMBAYARAN — PER LEVEL, DUA TINGKAT

### 1.1 Kenapa berubah dari v3.1

Di v3.1 §5.5, §9.1, §12.3: `students.is_premium` adalah **satu boolean global**. Begitu `true`, siswa dapat akses semua level + semua fitur AskKak premium selamanya. Komisi referrer dihitung sebagai "% recurring per bulan" dengan konsep "churn."

**Masalah:** Model harga yang diputuskan adalah **per level, sekali bayar, bukan langganan**. Satu boolean global tidak bisa merepresentasikan "siswa sudah beli Level 9 tapi belum beli Level 10." Konsep "recurring per bulan" dan "churn" tidak relevan untuk pembelian sekali bayar.

**Prinsip progres yang dikonfirmasi:** Progres **linear dan berurutan**. Begitu placement test menempatkan siswa di Level X, siswa harus melalui X, X+1, X+2, dst secara berurutan — tidak bisa loncat level. Yang membedakan siswa cepat dan lambat adalah **jumlah latihan soal** yang dikerjakan sebelum Confidence Score cukup untuk lulus upgrade test, bukan levelnya dilompati. Ini berarti bundel "3 level" **selalu berarti 3 level berurutan berikutnya dari posisi siswa saat itu**, bukan pilihan bebas.

### 1.2 Perubahan skema

**Ganti (v3.1 §4.1, kolom `students.is_premium BOOLEAN`):**

```sql
-- HAPUS:
-- is_premium BOOLEAN DEFAULT FALSE

-- GANTI DENGAN:
paid_basic_up_to_level    INT DEFAULT NULL,  -- level tertinggi yang sudah dibeli tingkat Basic
paid_premium_up_to_level  INT DEFAULT NULL,  -- level tertinggi yang sudah dibeli tingkat Premium
```

**Logika akses per level, saat siswa mencoba mengakses level N:**

```typescript
function getLevelAccess(student: Student, level: number): 'locked' | 'basic' | 'premium' {
  if (level <= student.trial_level) return 'basic'; // hasil placement test, gratis
  if (level <= (student.paid_premium_up_to_level ?? 0)) return 'premium';
  if (level <= (student.paid_basic_up_to_level ?? 0)) return 'basic';
  return 'locked'; // munculkan paywall
}
```

**Endpoint paywall terpusat (v3.1 §9.1) tetap dipertahankan strukturnya**, hanya responsnya diperkaya:

```typescript
// GET /api/upgrade-test/:level
// Response saat locked:
{
  "access": "locked",
  "level": 10,
  "pricing": {
    "basic_single": 40000,
    "basic_bundle_3": 100000,
    "premium_single": 65000,
    "premium_bundle_3": 165000
  }
}
```

**Upgrade Basic → Premium untuk level yang sudah dibeli:** diizinkan. Siswa yang sudah beli Level 9 Basic bisa bayar selisih (Rp25.000) untuk naik ke Premium di level yang sama, tanpa perlu beli ulang dari nol.

```typescript
// POST /api/payment/upgrade-tier
// Body: { student_id, level, target_tier: 'premium' }
// Hanya berlaku jika level <= paid_basic_up_to_level DAN level > paid_premium_up_to_level
// amount_idr = harga_premium_single - harga_basic_single = 25000
```

### 1.3 Fitur yang dikontrol per level (bukan lagi global)

| Fitur | Basic | Premium |
|---|---|---|
| Latihan soal di level tersebut | Ya | Ya |
| Bot: jawaban dari corpus (lexical/semantic) | Ya | Ya |
| Bot: pertanyaan bebas (OpenRouter fallback) | Tidak | Ya (dengan kuota, lihat §3) |
| Bot: TTS live / suara | Tidak | Ya |
| Bot: input mic | Tidak | Ya |
| Upgrade test untuk naik ke level berikutnya | Ya (kalau level berikutnya sudah dibeli) | Ya |

---

## 2. HARGA FINAL

### 2.1 Individual

| Paket | Harga |
|---|---|
| Basic — 1 level | Rp40.000 |
| Basic — bundel 3 level berurutan | Rp100.000 (~Rp33.333/level) |
| Premium — 1 level | Rp65.000 |
| Premium — bundel 3 level berurutan | Rp165.000 (~Rp55.000/level) |
| Upgrade Basic → Premium (level yang sudah dibeli) | Rp25.000 (selisih) |

### 2.2 Kelompok (dibeli oleh satu pembayar untuk banyak anak sekaligus — guru les, sekolah, atau kelompok orang tua)

**Syarat: minimal 10 siswa dalam satu transaksi kelompok.**

| Paket | Harga per siswa |
|---|---|
| Basic — 1 level | Rp25.000 (~37% diskon dari individual) |
| Basic — bundel 3 level | Rp65.000/siswa (~35% diskon) |
| Premium — 1 level | Rp45.000 (~31% diskon) |
| Premium — bundel 3 level | Rp115.000/siswa (~30% diskon) |

**Catatan implementasi penting:** Karena tiap siswa dalam kelompok bisa punya level penempatan berbeda (placement test individual), harga kelompok dihitung **per siswa per level spesifiknya** — bukan "beli level X untuk seluruh kelas." Pembayar kelompok cukup jadi satu payer untuk banyak baris `payment_records` sekaligus (satu batch/invoice ID untuk rekonsiliasi), bukan mekanisme baru yang mengubah granularitas pencatatan pembayaran.

**Referensi riset pasar:** Ruangguru memberi diskon kelompok les privat mulai dari kelompok 3 siswa (~33% diskon) hingga kelompok 5 siswa (~40-50% diskon). Angka Cadas (~30-37%) berada di tengah rentang ini, dengan ambang minimal lebih tinggi (10 siswa) karena model per-level satu kali bayar punya margin lebih tipis dibanding langganan bulanan berkelanjutan yang jadi basis perbandingan Ruangguru.

### 2.3 Perbandingan pasar (konteks, bukan bagian dari produk)

- Kumon: Rp525.000–575.000/**bulan per mata pelajaran** (Jabodetabek) — dengan pembimbing manusia di lokasi
- Ruangguru: Rp250.000/bulan (multi-mata pelajaran, video)
- Cadas Premium 1 level ≈ Rp65.000 **sekali bayar** (bukan bulanan) — jauh di bawah kedua pembanding pada basis nilai yang diterima siswa per level pembelajaran

---

## 3. KUOTA ASKKAK PREMIUM

### 3.1 Kenapa perlu (revisi dari kekosongan di v3.1 §7)

Per-level saja belum menutup risiko biaya LLM sepenuhnya — tanpa batas, satu pembayaran Rp65.000 bisa memicu ratusan panggilan OpenRouter tanpa batas waktu selama siswa mengerjakan level itu.

### 3.2 Struktur kuota — dua penghitung terpisah per level yang dibeli Premium

```sql
CREATE TABLE student_level_quota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  level INT NOT NULL,
  corpus_answers_used INT DEFAULT 0,      -- batas lunak, anti-abuse
  llm_calls_used INT DEFAULT 0,           -- batas keras, kontrol biaya nyata
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, level)
);
```

| Jenis jawaban | Batas per level | Sifat |
|---|---|---|
| Jawaban dari corpus (lexical/semantic) | 300 | Batas lunak — praktis bukan kendala nyata, murni jaring pengaman anti-spam |
| Panggilan OpenRouter (pertanyaan bebas) | ~38 | Batas keras — ini yang mengontrol biaya riil |

**Dasar angka:** target distribusi 75% corpus / 25% LLM dari total anggaran nosional 150 pertanyaan → 150 × 25% ≈ 38 panggilan LLM. *(Perlu konfirmasi final apakah 38 dibulatkan ke 40, dan apakah 150/300 sudah sesuai keinginan — angka ini bisa disesuaikan tanpa mengubah struktur.)*

**Estimasi biaya worst-case:** 38 query × Rp10-20/query = Rp380-760 per level. Ini hanya 3-5% dari markup Premium (Rp25.000), menyisakan margin besar sebagai buffer untuk biaya TTS live, lonjakan pemakaian tak terduga, atau kenaikan harga model di masa depan.

**Perilaku setelah kuota LLM habis:** Tidak diblokir keras. Turun otomatis ke perilaku Basic untuk level itu (jawaban dari corpus saja), dengan pesan yang sopan dari avatar ("Kak Cadas sudah banyak bantu di level ini, coba lihat penjelasan yang sudah ada dulu ya"), bukan penalti atau pesan yang terasa menghukum.

---

## 4. KOMISI REFERRER

### 4.1 Basis perhitungan (revisi dari v3.1 §12.3)

**Ganti:** "% recurring per bulan" dengan konsep churn (langganan berhenti)
**Jadi:** **% dari `amount_idr` di setiap baris `payment_records`**, dihitung satu kali saat transaksi terjadi.

Setiap kali siswa yang direferensikan membeli level/bundel baru — kapan pun, berkali-kali sepanjang waktu — itu satu event pembayaran baru yang dihitung komisinya saat itu juga. Tidak ada konsep "berhenti berlangganan" karena tidak ada langganan.

**Alasan dipilih dibanding alternatif lain:**
- **Per siswa bayar** (bonus sekali, berapa pun level dibeli setelahnya) — tidak menghargai guru yang siswanya jadi pengguna jangka panjang.
- **Per upgrade test lulus** — keliru karena lulus/gagal upgrade test adalah peristiwa akademik, tidak selalu berbarengan dengan uang berpindah tangan.
- **Per transaksi pembayaran (dipilih)** — selaras dengan lifetime value siswa yang direferensikan, dan sudah sesuai struktur tabel `payment_records` yang ada (kolom `commission_amount_idr` dihitung saat insert, tidak perlu ubah struktur tabel, hanya logika pemicunya).

### 4.2 Tabel `payment_records` (dari v3.1) — tidak berubah struktur

Kolom `amount_idr`, `commission_amount_idr`, `referrer_id` yang sudah ada di v3.1 tetap dipakai persis seperti itu. Yang berubah hanya: setiap baris sekarang merepresentasikan **satu pembelian level/bundel/upgrade-tingkat**, bukan satu siklus langganan bulanan.

---

## 5. ALUR PENGAJUAN REFERRER

### 5.1 Prinsip: tidak semua tipe otomatis dapat akses referral

Berbeda dari asumsi v3.1 §12 yang menyiratkan guru yang sudah terverifikasi (`teacher_type`) otomatis dapat link referral — sekarang **verifikasi identitas** dan **kelayakan jadi mitra referral** adalah dua langkah terpisah untuk sebagian tipe.

### 5.2 Perubahan skema

```sql
ALTER TABLE referrers ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
  -- pending | approved | rejected | revoked
ALTER TABLE referrers ADD COLUMN application_data JSONB;
ALTER TABLE referrers ADD COLUMN reviewed_by VARCHAR(100);
ALTER TABLE referrers ADD COLUMN reviewed_at TIMESTAMP;
ALTER TABLE referrers ADD COLUMN rejection_reason TEXT;
ALTER TABLE referrers ADD COLUMN last_rejected_at TIMESTAMP;  -- untuk hitung jeda 14 hari
```

**Token referral (`cadas.app/d/xxxxx`) baru di-generate saat `status = 'approved'`, bukan saat submit formulir.**

### 5.3 Alur per tipe referrer (final)

| Tipe | Alur | Alasan |
|---|---|---|
| `teacher_school` | Tidak perlu mengajukan. Otomatis approved begitu verifikasi NUPTK/email sekolah selesai (proses yang sudah ada di v3.1) | Sudah melalui verifikasi institusional yang lebih ketat dari formulir referral biasa; kapasitasnya juga sudah dibatasi (hanya referral ke luar kelasnya sendiri, sesuai batasan etika di v3.1) |
| `parent` | Otomatis approved begitu syarat teknis terpenuhi: minimal 1 anak ter-link DAN anak itu sudah menyelesaikan placement test. Token langsung aktif tanpa menunggu admin. | Syarat teknis ini sendiri sudah jadi filter kuat (tidak bisa dipalsukan mudah), dan jangkauan referral orang tua secara alami terbatas ke lingkaran sosialnya sendiri — risiko penyalahgunaan kecil dan tidak membesar sendiri |
| `teacher_private`, `affiliate`, `other` | Isi formulir pengajuan → `pending` → review manual admin → `approved`/`rejected`. Kalau ditolak, jeda 14 hari sebelum bisa mengajukan ulang. | Jangkauan tidak terbatas dan tidak otomatis terverifikasi lewat aktivitas produk — butuh review manusia |
| `student` | Tidak ada formulir terpisah. Syarat usia 13+, consent orang tua, dan status premium (dari v3.1 §12.3) itu sendiri jadi gerbangnya. | Sudah cukup ketat by design, menambah formulir untuk anak-anak berlebihan |

### 5.4 Formulir pengajuan (untuk `teacher_private`, `affiliate`, `other`)

**Pertanyaan umum (semua tipe ini):**
- Nama lengkap sesuai KTP
- Nomor WhatsApp aktif
- Bagaimana rencana membagikan link Cadas? (teks bebas)
- Alasan ingin jadi mitra Cadas (teks bebas)

**Tambahan khusus `teacher_private`:**
- Lama mengajar les privat/kelompok
- Rata-rata jumlah siswa per bulan
- Nama tempat/komunitas les (kalau ada)
- Bukti aktivitas mengajar (opsional — foto jadwal, grup WA, dll)

**Tambahan khusus `affiliate`/`other`:**
- Platform promosi utama beserta link/handle
- Perkiraan jangkauan (boleh estimasi kasar)

**Kriteria evaluasi admin (checklist ya/tidak, bukan skoring otomatis):**

| Tipe | Kriteria lolos |
|---|---|
| `teacher_private` | Data konsisten (nama, WA aktif) + indikasi aktivitas mengajar nyata (jawaban tidak kosong/asal) + tidak ada red flag |
| `affiliate`/`other` | Platform/kanal bisa diverifikasi (link/handle valid) + jangkauan masuk akal + tidak ada indikasi spam |

### 5.5 Tripwire otomatis untuk `parent` (pengganti review manual)

Karena `parent` auto-approved tanpa review, tambahkan pemantauan latar belakang (bukan blocking saat approval):

```
Jika satu referrer_id (tipe parent) menghasilkan lebih dari 10
konversi berbayar dalam 30 hari
  -> flag otomatis, masuk antrean review yang sama dengan
     teacher_private/affiliate
  -> status referrer TIDAK berubah otomatis (tetap approved,
     token tetap aktif) -- hanya jadi bahan cek admin
  -> kalau wajar (orang tua aktif di komunitas besar): tidak
     perlu tindakan
  -> kalau mencurigakan: admin revoke via status yang sudah ada
```

Ini memakai ulang antrean review dan status `revoked` yang sama dengan tipe lain — tidak ada komponen baru yang perlu dibangun.

### 5.6 Endpoint admin (pola sama dengan admin billing di Sprint 1)

```
POST /api/admin/referrals/:id/approve
  -> status = 'approved', generate token, aktifkan akses

POST /api/admin/referrals/:id/reject
  -> status = 'rejected', simpan reviewed_by/reviewed_at/rejection_reason
  -> last_rejected_at = NOW() (untuk hitung jeda 14 hari)

POST /api/admin/referrals/:id/revoke
  -> status = 'revoked' (riwayat komisi yang sudah dibayar TIDAK dihapus)
```

Otentikasi memakai `ADMIN_SECRET` yang sama dengan endpoint admin billing — tidak perlu UI admin khusus di tahap ini, konsisten dengan pola yang sudah ditetapkan di Sprint 1.

---

## 6. ALUR ONBOARDING

### 6.1 Keputusan: tanpa trial konten terpisah

Bukan "coba 1 level gratis lalu bayar" — placement test yang memang wajib ada **sendiri sudah berfungsi sebagai demo tanpa risiko komersial**, karena soal-soal probe placement adalah kolam terpisah dari konten level berbayar.

### 6.2 Alur

1. **Video/landing** (di luar app, tanpa login) — jelaskan konsep, CTA tunggal: "Tes Level Anak, Gratis."
2. **Data minimal anak** — nama, kelas, usia. Tambahkan centang ringan gaya Parent Gate ("Saya orang tua/wali yang mendampingi saat ini").
3. **Placement test langsung jalan** — adaptif, personal.
4. **Hasil ditampilkan sebagai momen puncak**: "Ananda [nama] cocok mulai dari Level X", dengan 1-2 contoh soal dari level itu sebagai cuplikan (preview non-interaktif).
5. **Baru di titik ini minta registrasi orang tua** (email/HP, password) — setelah ada nilai konkret yang ditunjukkan, bukan sebelum.
6. **Tampilkan harga langsung**: opsi Basic/Premium, single/bundel, dengan penghematan tertulis jelas.
7. **Bayar** (manual di tahap awal — lihat §7) → level terbuka.
8. **Anak kedua/ketiga**: akun orang tua sudah ada, ulangi langkah 2-3 saja (data anak + placement), tidak daftar ulang orang tua. Tetap unit pembayaran terpisah per anak.

**Alasan anak/placement duluan, bukan registrasi orang tua duluan:** setiap field yang diminta sebelum ada nilai yang ditunjukkan adalah titik orang berhenti (drop-off). Placement test yang memang wajib ada dobel fungsi sebagai demo tanpa mengorbankan apapun secara komersial.

---

## 7. MODEL BISNIS & DISTRIBUSI

### 7.1 Hindari toko aplikasi untuk pembayaran

**Keputusan:** Tidak ada mekanisme pembelian di dalam app (tidak ada tombol "Upgrade", tidak ada teks yang mengarahkan bayar di dalam UI). Status akses level dikontrol murni dari backend berdasarkan pembayaran yang terjadi di kanal terpisah.

**Alasan:** Program "external payment links" resmi dari Google saat ini hanya berlaku untuk Jepang — Indonesia belum termasuk. Mengandalkan celah resmi tidak tersedia. Menghindari toko sepenuhnya (bukan mencari celah di dalamnya) adalah jalan yang lebih bersih. Ini juga prasyarat teknis: pembayaran lewat Play/App Store billing membuat pelacakan referral untuk komisi guru nyaris mustahil (toko tidak meneruskan parameter referral custom saat checkout).

**Distribusi:** Android-first (APK direct download dari website Cadas, distribusi lazim di Indonesia) atau listing Play Store tanpa mekanisme IAP sama sekali. iOS ditunda — arahkan ke versi web/PWA (Add to Home Screen dari Safari) untuk kebutuhan latihan soal dan dashboard, tanpa tunduk ke App Store.

**Pembayaran:** Midtrans/Xendit (QRIS, e-wallet, VA bank) — sekitar 2-3% biaya transaksi, jauh di bawah potongan toko aplikasi, dan familiar bagi orang tua Indonesia.

### 7.2 Tahap awal: manual dulu, otomasi belakangan

Sesuai prinsip "belum rumit, mudah diulang" — jangan bangun payment gateway otomatis di awal:

- **Fase 0 (beta awal, puluhan pengguna):** orang tua transfer QRIS/bank, kirim bukti via WhatsApp, admin aktifkan akses manual lewat endpoint admin sederhana (`POST /api/admin/billing/activate`, pola sudah ada di Sprint 1).
- **Fase 1 (traksi tervalidasi, puluhan-ratusan pembayar):** baru integrasi Midtrans/Xendit otomatis dengan webhook.
- Komisi referrer juga bisa mulai manual (pencatatan + transfer manual bulanan) sebelum dibangun sistem payout otomatis.

### 7.3 Kanal dukungan orang tua

Form dalam app ("Kirim Pesan ke Admin") tersimpan ke tabel tiket + notifikasi email ke admin. Tambahkan halaman FAQ statis untuk pertanyaan berulang (konfirmasi pembayaran, cara kerja placement test). WhatsApp resmi mahal, tidak resmi banyak kendala — dukungan dalam app jadi kanal utama, WhatsApp manual tetap dipakai khusus untuk alur konfirmasi bukti pembayaran di Fase 0.

---

## 8. GAMIFICATION & AVATAR RIVE

### 8.1 Prinsip: gamification berpusat di avatar, bukan sistem poin terpisah

XP/leaderboard sengaja tidak diadakan (v3.1 sudah konsisten dengan ini). Reward mikro per soal diwakili **reaksi avatar** (ekspresi, animasi kecil) + animasi Confidence Score naik — bukan angka XP bertambah, menjaga satu sumber kebenaran progres.

**Companion growth berdasarkan konsistensi (streak, penyelesaian level), bukan akurasi** — supaya anak yang lambat/sering salah tetap punya jalur untuk merasa berhasil, tidak hanya anak yang selalu benar.

**Momen naik level butuh perayaan tersendiri**, terpisah dari perayaan Fast Track — karena mayoritas anak naik lewat jalur normal (bukan skip), bukan Fast Track saja.

### 8.2 Rencana state avatar Rive — perlu dipetakan sebelum produksi animasi dimulai

State minimal yang perlu dirancang lebih dulu (state machine mahal diubah setelah banyak animasi jadi):

- Benar (percobaan pertama vs setelah beberapa kali coba)
- Salah (percobaan pertama vs berulang)
- Sedang berpikir/memproses AskKak (loop menutupi latency OpenRouter, sekitar 1-4 detik)
- Merayakan streak
- Merayakan naik level (jalur normal)
- Merayakan Fast Track (jalur cepat — beda dari naik level normal)
- Menyambut kembali setelah absen beberapa hari
- Idle menunggu input

**State "berpikir" krusial secara teknis** — menutupi latency fallback OpenRouter ("Kak Cadas lagi mikir dulu ya...") supaya jeda terasa seperti bagian dari karakter, bukan loading spinner yang bikin anak tidak sabar.

**Validasi viseme/lip-sync Bahasa Indonesia lebih awal** — kalau viseme dari TTS tidak akurat, mungkin lebih baik avatar hanya "gerak mulut ritmis" daripada rig penuh viseme yang mahal tapi kurang meyakinkan. Sebaiknya dites dengan contoh kecil sebelum semua state selesai dirig.

**API state machine ke tim app sebaiknya sempit**: satu input "mood" (enum: senang/berpikir/mendorong-semangat/merayakan) plus satu trigger — supaya tim Rive bisa iterasi tanpa selalu koordinasi ulang dengan tim React Native.

---

## 9. PUSH NOTIFICATION

### 9.1 Laporan malam ke orang tua

Preset waktu sederhana (pagi/siang/malam), bukan time-picker bebas. Dua template: siswa berlatih hari itu (ringkasan positif + satu highlight) vs belum berlatih (pengingat lembut, bukan menyalahkan).

### 9.2 Reminder sesi — per anak, dua mode

Pengaturan di profil anak dalam Parent Dashboard (bukan global):
- **Sesi terjadwal**: reminder tepat di jam yang dipilih tiap hari.
- **Sesi bebas**: satu pengingat generik kalau sampai jam tertentu (misal 18:00) belum ada sesi tercatat hari itu.
- Reminder terakhir hari itu dikirim minimal 2-3 jam sebelum tengah malam (batas streak) — bukan setelah kesempatan lewat.
- Tidak spam ulang kalau sudah diingatkan sekali dan belum berlatih — cukup masuk laporan malam.

**Infrastruktur:** FCM (Firebase Cloud Messaging), gratis di skala ini, tidak ada isu kontrol biaya seperti AskKak.

---

## 10. KONTROL BIAYA ASKKAK (RINGKASAN)

Selain kuota di §3, kontrol tambahan yang perlu jadi kriteria selesai eksplisit di sprint AskKak:

- Semantic search selalu dicoba dulu, OpenRouter hanya dipanggil kalau similarity di bawah ambang dan kuota LLM belum habis (aturan wajib, bukan optimasi opsional)
- System prompt membatasi topik — bot menolak sopan kalau pertanyaan di luar topik matematika yang sedang dipelajari
- Circuit breaker di level global — kalau pengeluaran OpenRouter harian/bulanan melewati ambang, AskKak otomatis masuk mode "sementara tidak tersedia" alih-alih terus memanggil API tanpa batas
- Tidak kirim data identitas asli anak ke OpenRouter — cukup ID anonim di payload

---

## 11. YANG MASIH TERBUKA — PERLU DIPUTUSKAN SEBELUM SPRINT TERKAIT DIMULAI

| # | Pertanyaan | Memengaruhi |
|---|---|---|
| 1 | Angka final kuota: 150/38 dibulatkan, atau ubah ke angka lain (misal 150/40)? | Sprint AskKak, kontrol biaya |
| 2 | Endpoint bulk purchase untuk kelompok — desain alurnya belum ada di sprint plan manapun | Sprint 6/7, pembayaran kelompok |
| 3 | Format formulir pengajuan referrer di UI — sudah ada strukturnya, belum di-mapping ke sprint tertentu | Sprint 7 |

---

## PENUTUP

Dokumen ini melengkapi PLAN_DEV_v3_1.md dengan seluruh keputusan bisnis dan produk yang dibahas setelahnya. Bagian arsitektur teknis lain yang tidak disebut di sini (RAG hybrid layer, Focus Score, consent flow guru, placement test algorithm, dsb.) tetap berlaku seperti tertulis di v3.1 — tidak berubah.
