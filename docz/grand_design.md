# Grand Design: Sistem RAG Bot Tutor Matematika SD (Voice + Text)

**Status:** Plan — sangat mungkin direvisi setelah backtest
**Disusun dari:** 4 dokumen awal (ARCHITECTURE_DECISIONS.md, RAG_SYSTEM_TECHNICAL_SPEC.md, FEEDBACK_RAG_SYSTEM_SPEC.md, PRIMING_STRUKTUR_BOT_TUTOR_MATEMATIKA_SD.md) + diskusi lanjutan
**Tanggal:** 3 September 2026

---

## 1. Ringkasan Perubahan dari Dokumen Awal

Dokumen awal (ARCHITECTURE_DECISIONS.md) memutuskan arsitektur **100% lokal di browser** (PGlite, Transformers.js, Whisper.js, Kokoro TTS, tanpa backend). Keputusan ini **sudah direvisi** — sistem sekarang **hybrid cloud + server**:

| Komponen | Rencana Awal | Keputusan Sekarang |
|---|---|---|
| LLM utama | Transformers.js (browser) | **Local LLM di VM** (Ollama), fallback ke **OpenRouter** |
| Database | PGlite (browser) | **PostgreSQL** (server) |
| Vector store | pgvector via PGlite | **PostgreSQL + pgvector** (Chroma di-drop) |
| STT (input suara) | Whisper.js (lokal) | **Gemini transcribe** (cloud) |
| TTS (output suara) | Kokoro TTS (lokal) | **Gemini 3.1 Flash TTS** (cloud) |
| Avatar | Rive | **Rive** (tetap, scope diperluas ke lip-sync) |
| Klaim "100% offline" | Ya | **Tidak berlaku lagi** — perlu direvisi di dokumentasi manapun yang masih nyebut ini |

Konsekuensi: produk ini **bukan lagi "zero API tax"** secara penuh. Trade-off yang diambil sadar: kualitas suara & keandalan LLM jauh lebih baik dibanding opsi 100% lokal, dengan konsekuensi cost per-query yang perlu dipantau (lihat Section 8).

---

## 2. Pipeline End-to-End

```
[SISWA INPUT: teks atau suara]
        │
        ├─ Suara? → [Gemini Transcribe (STT, cloud)] → teks
        │
        ▼
[KLASIFIKASI: concept_id, level, tipe soal]
        │
        ▼
┌─────────────────────────────────────────────┐
│ LAYER 1: LEXICAL SEARCH                      │
│ PostgreSQL query by concept_id + level       │
│ <10ms                                        │
└─────────────────────────────────────────────┘
     │ ditemukan? ──YES──→ [lanjut ke NORMALISASI]
     │ NO
     ▼
┌─────────────────────────────────────────────┐
│ LAYER 2: SEMANTIC SEARCH                     │
│ PostgreSQL + pgvector                        │
│ ├─ similarity ≥ 0.85 → pakai langsung        │
│ ├─ 0.60–0.85 → jadi few-shot context ke LLM  │
│ └─ < 0.60 → LLM generate bebas + style ref   │
└─────────────────────────────────────────────┘
     │ ≥0.85? ──YES──→ [lanjut ke NORMALISASI]
     │ NO (bawa hasil semantic sebagai context)
     ▼
┌─────────────────────────────────────────────┐
│ LAYER 3: LOCAL LLM (Ollama, di VM)           │
│ Input: system prompt priming + few-shot      │
│        + context dari layer 2 (jika ada)     │
│ Retry 1x jika gagal (turunkan temperature /  │
│ tambah few-shot) sebelum lempar ke Layer 4   │
└─────────────────────────────────────────────┘
     │ lolos QA checklist & dalam timeout?
     │ YES ──→ [lanjut ke NORMALISASI]
     │ NO
     ▼
┌─────────────────────────────────────────────┐
│ LAYER 4: OPENROUTER (cloud LLM fallback)     │
│ Trigger: QA checklist gagal item kritis,     │
│ timeout, atau (opsional) low-confidence      │
└─────────────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────────────┐
│ NORMALISASI NOTASI (rule-based, wajib)       │
│ Operasi → TAMBAH/DIKURANG/DIKALI/DIBAGI      │
│ Pecahan → "PER", Desimal → "KOMA"            │
│ Satuan → dieja penuh, Bilangan besar → kata  │
└─────────────────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────┐
│ QA CHECKLIST PRE-TTS (lihat Section 4.6)     │
└─────────────────────────────────────────────┘
        │ PASS → lanjut   │ FAIL → log + fallback/regenerate
        ▼
┌─────────────────────────────────────────────┐
│ CACHE hasil (student_questions table)        │
└─────────────────────────────────────────────┘
        │
        ▼
[TEKS SIAP UCAP] ──┬── User Premium → Gemini TTS live per-request
                   └── User Reguler → ambil audio pre-generated (cached)
        │
        ▼
[Gemini 3.1 Flash TTS output] → audio
        │
        ▼
[RIVE AVATAR: state machine + lip-sync] (lihat Section 4.8 — open item)
        │
        ▼
[SISWA DENGAR + LIHAT AVATAR MENJAWAB]
```

---

## 3. Layer Detail

### 3.1 Lexical Search
- Query `PostgreSQL` by `concept_id + level`, exact match
- Tetap seperti RAG_SYSTEM_TECHNICAL_SPEC.md Section 4 — tidak berubah dari spec awal

### 3.2 Semantic Search
- Sekarang via **PostgreSQL + pgvector** (bukan Chroma terpisah — menghindari dual-maintenance yang sempat diflag di FEEDBACK_RAG_SYSTEM_SPEC.md issue 3.2)
- **Threshold 3-tier** (dari PRIMING_STRUKTUR section 9, menggantikan threshold biner 0.75 di spec awal):
  - `≥ 0.85` → pakai hasil retrieval langsung
  - `0.60–0.85` → hasil retrieval jadi few-shot context untuk LLM
  - `< 0.60` → LLM generate bebas, retrieval jadi style reference saja

### 3.3 Local LLM (VM)
- Jalan di **VM**, bukan browser siswa dan bukan device siswa
- Spek VM: **8–16GB RAM**, GPU **belum dikonfirmasi** — ini nentuin pilihan model & latency real (lihat Section 9 Open Items)
- System prompt = template lengkap dari PRIMING_STRUKTUR section 7 (bukan generic prompt bahasa Inggris yang ada di RAG_SYSTEM_TECHNICAL_SPEC.md Section 7 lama)
- 1x retry sebelum fallback ke OpenRouter

### 3.4 OpenRouter (Fallback Layer 4)
Trigger fallback (starting point untuk backtest, **bukan final** — lihat Section 7):
| Kondisi | Threshold awal |
|---|---|
| QA checklist gagal item kritis (notasi mentah, kata Melayu) | gagal ≥1 item kritis |
| Timeout | >4 detik (tentatif, tergantung spek VM final) |
| Low-confidence (opsional, jika model expose log-prob) | nice-to-have |

Definisi persis "gagal" **sengaja belum dikunci** — menunggu hasil backtest (lihat Section 7).

### 3.5 Normalisasi Notasi
- Wajib, rule-based, deterministic (dari PRIMING_STRUKTUR section 6)
- Jalan **setelah** LLM/retrieval generate teks, **sebelum** masuk TTS
- Cakupan: operasi aritmetika, pecahan, desimal, satuan, bilangan besar

### 3.6 QA Checklist Pre-TTS
Dari PRIMING_STRUKTUR section 8 — dijalankan sebelum teks masuk TTS:
- Tidak ada simbol matematika mentah
- Tidak ada kata Melayu dari watchlist
- Rata-rata kalimat sesuai batas panjang per jenjang kelas
- Ada partikel lisan natural
- Tidak ada anak kalimat berbelit
- Lolos normalisasi notasi penuh

### 3.7 STT — Gemini Transcribe
- Input suara siswa → teks, via API Gemini (cloud)
- Konsisten satu ekosistem dengan TTS (keputusan yang diambil di diskusi)
- Implikasi: input suara **butuh koneksi internet**, tidak ada mode STT offline lagi

### 3.8 TTS — Gemini 3.1 Flash TTS
Terverifikasi via riset (bukan asumsi):
- Model **preview**, tersedia di Google AI Studio & Vertex AI
- 70+ bahasa (termasuk Indonesia), 30 voice, dukungan audio tags ekspresif untuk kontrol narasi
- Batas: gabungan teks+prompt ≤8.000 byte, output audio ≤±655 detik
- Biaya: **$1.00/juta token teks (input)**, **$20.00/juta token audio (output)** — ini beda dari asumsi "Rp 5-10K/query" di dokumen lama, perlu dihitung ulang per use case nyata (lihat Section 8)
- Output audio watermark otomatis (SynthID) — baik untuk didokumentasikan jika nanti masuk konteks institusi/sekolah
- **Tidak ditemukan** bukti bahwa model ini expose data viseme/fonem berwaktu di output — beda dari beberapa provider lain (OpenAI/Azure/ElevenLabs) yang memang punya alignment data. Berdampak ke Section 3.9.

### 3.9 Avatar — Rive (Scope Diperluas)
- Rive tetap pilihan yang tepat: state machine berbasis logika, ukuran file kecil, performa tinggi — alasan ini tidak berubah meski backend sekarang server-based
- **Peningkatan dari rencana awal**: bukan cuma animasi state umum, tapi **lip-sync berbasis viseme** — Rive state machine native support input viseme index + status "sedang bicara"
- Karena Gemini TTS tidak expose data viseme/fonem timing, viseme perlu di-generate terpisah dari audio hasil Gemini TTS. Keuntungan: app **sudah punya ground-truth teks** (`text_before_tts`) yang dikirim ke TTS, jadi bisa pakai *forced alignment* (cocokkan teks dikenal ke audio), bukan cuma nebak dari audio mentah.

**Opsi open source yang sudah diriset:**

| Tool | Cara kerja | Dukungan Indonesia | Effort integrasi | Output |
|---|---|---|---|---|
| **Rhubarb Lip Sync** (rekomendasi awal) | CLI, audio → viseme, mode `phonetic` (language-independent) + bisa dikasih dialog text buat bantu akurasi | Ya, via mode phonetic — bukan model khusus Indonesia, presisi lebih rendah dari mode English | Kecil — CLI langsung pakai, output JSON `mouthCues` (A-X) siap dipetakan ke Rive | JSON: `{start, end, value}` per bentuk mulut |
| **Montreal Forced Aligner (MFA)** | Forced alignment fonem-level, pakai model akustik + Kaldi | Ya — ada model akustik Indonesia komunitas (Indonesia-Jawa, HuggingFace) + riset akademik khusus forced alignment Bahasa Indonesia | Sedang-besar — perlu setup Kaldi/pynini + bikin sendiri tabel mapping fonem→viseme | TextGrid/CSV timing fonem (perlu diproses lanjut jadi viseme) |
| **HeadAudio** | Audio-driven murni (MFCC + classifier), tanpa teks/transkrip, MIT license, jalan di browser | Otomatis mendukung (language-agnostic, tidak butuh teks) | Kecil — client-side, tanpa proses server tambahan | Viseme blend-shape real-time |

**Rekomendasi urutan coba:** mulai dari **Rhubarb (mode phonetic + dialog file Bahasa Indonesia)** — effort paling kecil, output langsung cocok buat Rive. Kalau akurasi kurang memadai untuk kebutuhan produk edukasi anak, upgrade ke **MFA** yang punya model akustik Indonesia lebih matang secara linguistik (effort lebih besar karena perlu bikin mapping fonem→viseme sendiri). HeadAudio jadi opsi fallback ringan kalau butuh solusi cepat tanpa proses audio di server.

---

## 4. Database & Storage

- **PostgreSQL** sebagai satu-satunya database utama (menggantikan kombinasi PGlite/Postgres+Chroma di dua dokumen awal yang saling kontradiksi)
- **pgvector** untuk semantic search — Chroma **di-drop** dari desain
- Skema tabel `explanations` dan `student_questions` mengikuti RAG_SYSTEM_TECHNICAL_SPEC.md Section 3, dengan catatan dari FEEDBACK_RAG_SYSTEM_SPEC.md yang masih relevan:
  - Tambahkan `question_hash` + `UNIQUE` constraint di `student_questions` untuk deduplikasi (issue 3.3)
  - Keputusan `speech_friendly_text`: **compute on-the-fly** dari `main_explanation` + layer normalisasi, bukan disimpan statis (Opsi 1 di issue 3.1) — lebih maintainable, tidak perlu re-generate ulang semua data tiap ada rule baru

---

## 5. Unified Response Schema

Menggabungkan schema RAG_SYSTEM_TECHNICAL_SPEC.md + gap yang diflag FEEDBACK_RAG_SYSTEM_SPEC.md issue 2.2:

```typescript
{
  source: "lexical|semantic|local_llm|openrouter|cache",
  explanation: {
    id: "uuid",
    main_explanation: "...",
    variant_1_gasing: "...",
    variant_2_pmri: "...",
    variant_3_mental_math: "..."
  },
  recommended_variant: "gasing",
  text_before_tts: "[teks sudah dinormalisasi, siap diucapkan]",
  tts_config: {
    voice_id: "...",
    language: "id",
    tier: "premium|regular"   // nentuin live-generate vs cached
  },
  speech_format_info: {
    type: "audio/mp3",
    duration_sec: 0,
    bitrate: 0
  },
  voice_url: "...",            // live (premium) atau cached (regular)
  response_time_ms: 0,
  cache_hit: true,
  confidence_score: 0
}
```

---

## 6. Parameter Fallback — Starting Point untuk Backtest

**Ini bukan angka final.** Disiapkan supaya backtest langsung bisa jalan, dan direvisi berdasarkan data, bukan tebakan ulang.

| Transisi | Parameter awal | Catatan |
|---|---|---|
| Lexical → Semantic | Biner (row ditemukan / tidak) | Tidak perlu threshold numerik |
| Semantic → Local LLM | 3-tier: ≥0.85 / 0.60–0.85 / <0.60 | Dari PRIMING_STRUKTUR section 9 |
| Local LLM → OpenRouter | QA gagal item kritis, timeout >4s, retry 1x dulu | Timeout & definisi "gagal kritis" masih tentatif |

**Instrumentasi yang wajib disiapkan sebelum backtest jalan** (supaya hasilnya kepake buat mengunci threshold, bukan cuma angka mentah):
1. Logging granular **per item** QA checklist (bukan cuma pass/fail total) — biar kelihatan polanya (misal: mayoritas gagal di aturan kata Melayu vs di notasi)
2. Sample size & variasi soal yang representatif — termasuk edge case (pecahan campuran, soal cerita panjang, kata Melayu campuran) yang sempat diflag FEEDBACK_RAG_SYSTEM_SPEC.md Section 11

---

## 7. Model Bisnis: Free vs Premium (Voice)

| Tier | Perilaku TTS |
|---|---|
| **Premium** | Gemini TTS live, generate per-request |
| **Reguler** | Ambil hasil Gemini TTS yang sudah di-generate & disimpan di app sebelumnya (bukan generate ulang tiap query) |

Implikasi: biaya `$20.00/juta token audio` **tidak linear** terhadap jumlah user gratis, karena mereka pakai audio yang sudah di-cache. Biaya real per bulan sangat tergantung: (a) berapa banyak *unique* explanation yang perlu di-generate sekali untuk cache reguler, dan (b) berapa volume query user premium yang generate live. Ini perlu dihitung terpisah dari asumsi cost lama di RAG_SYSTEM_TECHNICAL_SPEC.md yang belum memperhitungkan biaya TTS sama sekali.

---

## 8. Corpus Strategy

Tidak berubah dari rekomendasi sebelumnya — ini titik yang paling krusial dan **belum ada progress konkret** dari diskusi sejauh ini:
- Sumber wajib: **transkrip lisan guru asli** (video guru SD, pelatihan GASING/PMRI resmi), bukan buku/modul tertulis
- Minimal 30–50 contoh, ideal 150–350 (30–50 concept × 5–7 penjelasan per concept)
- Corpus building harus **paralel** dengan development infra ringan, tapi **tidak boleh** development pipeline penuh dimulai sebelum corpus siap — ini disepakati baik oleh FEEDBACK_RAG_SYSTEM_SPEC.md maupun catatan penting #1 di PRIMING_STRUKTUR ("Corpus > Tool")

---

## 9. Open Items — Belum Diputuskan

Hal-hal ini perlu keputusan/riset lanjutan sebelum grand design ini dianggap final:

1. **Spek VM final**: RAM dikonfirmasi 8–16GB, tapi **GPU belum dikonfirmasi**. Ini nentuin model lokal mana yang realistis (Qwen kecil quantized vs model lebih besar) dan apakah target latency masuk akal di CPU-only.
2. **Model local LLM spesifik**: belum dipilih. Trade-off: model kecil (muat RAM, cepat) berpotensi lebih sering gagal QA checklist priming; model lebih besar lebih capable tapi latency naik.
3. **Definisi "gagal" Local LLM → OpenRouter**: sengaja ditunda sampai backtest — perlu instrumentasi (Section 6) disiapkan dulu.
4. **Mode GASING vs PMRI**: belum dibahas siapa/apa yang menentukan mode mana dipakai per soal (aturan eksplisit? LLM yang memilih? preferensi siswa?).
5. **Rive lip-sync — sumber data viseme**: sudah diriset (Section 3.9) — 3 opsi open source (Rhubarb, MFA, HeadAudio) dengan trade-off masing-masing. Rekomendasi: mulai dari Rhubarb (mode phonetic + dialog file), upgrade ke MFA kalau akurasi kurang. **Belum dites langsung** di corpus/audio Gemini TTS asli — perlu validasi empiris sebelum dikunci.
6. **Hosting**: ARCHITECTURE_DECISIONS.md awalnya memutuskan Vercel dengan asumsi "stateless server, no backend processing" — asumsi ini sudah tidak berlaku karena sekarang ada VM yang menjalankan local LLM terus-menerus. Perlu diputuskan ulang: Vercel untuk frontend saja + VM terpisah untuk backend/LLM?
7. **Corpus building**: belum ada progress/jadwal konkret dari diskusi ini.
8. **Revisi FAQ/klaim lama**: ARCHITECTURE_DECISIONS.md masih berisi klaim seperti "Yes! After the first model download, everything works offline" — ini sudah tidak valid dan perlu direvisi eksplisit di dokumentasi manapun yang masih dipakai sebagai referensi.

---

## 10. Urutan Kerja yang Disarankan

1. Konfirmasi GPU/spek final VM → tentukan model local LLM (Open Item 1–2)
2. Siapkan instrumentasi logging QA checklist granular (Section 6) → mulai backtest
3. Integrasikan priming template penuh (PRIMING_STRUKTUR section 7) ke Local LLM & OpenRouter call — ganti system prompt generic yang ada di spec lama
4. Mulai corpus building (Section 8) — paralel, prioritas tinggi
5. Riset pendekatan viseme untuk Rive (Open Item 5)
6. Putuskan ulang hosting (Open Item 6)
7. Jalankan backtest → kunci threshold fallback final (Section 6) berdasar data, bukan tebakan
