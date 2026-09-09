# FEEDBACK: RAG System Technical Specification
**Date:** September 2, 2026  
**Reviewer:** Technical Architecture Review  
**Status:** Comprehensive Review Complete

---

## RINGKASAN EKSEKUTIF

**Overall Assessment: 8/10 — Solid architecture, tapi ada gap krusial di layer priming/prompt**

**Strengths:**
- Hybrid retrieval strategy yang sound (lexical + semantic + LLM)
- Schema database yang comprehensive dan well-indexed
- Caching strategy yang realistic
- Cost analysis yang detail

**Critical Gaps:**
- Priming/prompt engineering untuk LLM belum terintegrasi dengan jelas
- Notasi matematika → bentuk lisan (normalisasi) belum ada di pipeline
- TTS integration belum eksplisit di flow
- Fallback strategy terlalu simplistic (biner: lexical/semantic/LLM)

**Risk Level:** MEDIUM — Akan work, tapi output quality sangat bergantung pada isi corpus dan priming, bukan arsitektur RAG-nya saja.

---

## DETAIL FEEDBACK PER SECTION

### ✅ SECTION 1: EXECUTIVE SUMMARY
**Status:** GOOD, tapi perlu klarifikasi

**Positif:**
- KPI yang jelas (latency, cost, accuracy)
- Ratios 70%/20%/10% masuk akal untuk use case SD

**Issue 1.1 — Accuracy metrics tidak jelas sumbernya**
```
Current:
├─ Lexical match accuracy: 99%
├─ Semantic match accuracy: 85%
├─ LLM accuracy: 95%
└─ Overall system: 95%+

Problem:
- Apa definisi "accuracy"? Apakah "siswa jadi paham soal"?
- Atau "hasil retrieval match soal"?
- Semantic 85% itu dari mana? Sudah validated?
```

**Rekomendasi:**
```
Definisikan dengan jelas:
- Accuracy = "explanation retrieved/generated menghasilkan siswa 
  paham + tidak ada error bahasa Indonesia"
- Lexical 99%: True positives (soal identik, penjelasan pas)
- Semantic 85%: Harus ditest dengan real soal SD
- LLM 95%: Dari OpenRouter documentation atau user testing?
```

---

### ✅ SECTION 2: SYSTEM ARCHITECTURE
**Status:** GOOD, tapi flow diagram kurang detail layer priming

**Positif:**
- Flowchart jelas dan mudah dipahami
- Breakdown per layer (lexical, semantic, LLM) logis

**Issue 2.1 — Priming & normalisasi notasi tidak terlihat di flow**
```
Current flow:
Query → [Lexical/Semantic/LLM] → [Return answer]

Missing:
Query → [Lexical/Semantic/LLM] → [APPLY PRIMING] → [NORMALIZE NOTATION] → [TTS] → [Return]
```

**Rekomendasi:**
Tambahkan diagram rinci untuk layer LLM generation:
```
┌─────────────────────────────────────────────────────────┐
│ LLM GENERATION PIPELINE (Detail Missing)               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Input: (question, concept_id, level, mode: GASING/PMRI)│
│                                                         │
│ Step 1: Load few-shot examples dari corpus retrieval   │
│         ├─ Semantic search: "soal mirip dari corpus"   │
│         └─ Extract 3-5 contoh untuk few-shot context  │
│                                                         │
│ Step 2: Build SYSTEM PROMPT (dari file priming_v1.md) │
│         ├─ Identitas guru hangat                       │
│         ├─ Aturan bahasa (TAMBAH/DIKURANG/DIKALI/DIB)  │
│         ├─ Struktur GASING/PMRI                        │
│         └─ Few-shot examples                           │
│                                                         │
│ Step 3: Call OpenRouter API dengan prompt berkonteks   │
│                                                         │
│ Step 4: APPLY PRIMING OUTPUT RAIL                      │
│         ├─ Cek kata Melayu (watchlist)                 │
│         ├─ Normalize operasi (3+5 → tiga TAMBAH lima) │
│         ├─ Normalize pecahan (3/4 → tiga PER empat)    │
│         ├─ Normalize satuan (cm → sentimeter)          │
│         └─ QA checklist (ritme kalimat, dll)          │
│                                                         │
│ Step 5: Cache ke student_questions table (future hits) │
│                                                         │
│ Output: speech_friendly_explanation                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Issue 2.2 — Unified response format belum include TTS**
```
Current:
{
  source: "lexical|semantic|llm|cache",
  explanation: {...},
  variants: [gasing, pmri, mental_math],
  voice_url: "s3://...",
  response_time_ms: 45,
  cache_hit: true/false
}

Missing:
- speech_format_info: { type: "audio/mp3", duration_sec, bitrate }
- text_before_tts: "[text yang sudah dinormalisasi, siap diucapkan]"
- tts_config: { voice_id, speed, language: "id" }
```

---

### ✅ SECTION 3: DATABASE SCHEMA & INDEXING
**Status:** COMPREHENSIVE, tapi ada beberapa optimasi

**Positif:**
- Tabel `explanations` cover semua kebutuhan (variants, embeddings, metadata)
- Indexes untuk lexical search sudah tepat
- JSONB untuk flexible data (common_mistakes, examples)

**Issue 3.1 — Kolom `speech_friendly_text` tidak konsisten dengan layer normalisasi**
```
Current schema punya:
  speech_friendly_text TEXT

Problem:
- Apakah ini field statis (pre-generated)?
- Atau generated on-the-fly dari `main_explanation` + normalisasi?
- Kalau statis, siapa yang maintain? Perlu update setiap ada rule baru.
- Kalau dynamic, jangan simpan di database — compute di layer aplikasi.
```

**Rekomendasi:**
```
Option 1: Hapus speech_friendly_text dari explanations table
  - Compute on-the-fly dari main_explanation + priming layer
  - Lebih maintainable, tidak perlu re-generate semua data

Option 2: Kalau ingin cache pre-computed
  - Add column: speech_variant_gasing, speech_variant_pmri, speech_variant_mental_math
  - Compute sekali saat explanations diinput
  - Tapi perlu version tracking: speech_version INT
  - Kalau ada update ke normalisasi rule, reset speech_version
```

**Issue 3.2 — Embedding storage split antara PostgreSQL + Chroma**
```
Current:
  embedding_vector vector(1536)  -- di PostgreSQL
  + Chroma menyimpan embedding terpisah

Problem:
- Dual maintenance: update embedding di 2 tempat?
- PostgreSQL pgvector uncommon di production kecil, overkill
```

**Rekomendasi:**
```
Opsi A (Recommended untuk scale kecil-menengah):
- Remove embedding_vector dari PostgreSQL
- Simpan HANYA di Chroma (pure vector DB)
- Chroma sudah siap production, gratis, self-hosted
- Mapping: explanation.id ↔ chroma.document_id

Opsi B (Jika ingin future scale besar):
- Pakai PostgreSQL pgvector untuk primary
- Chroma sebagai cache replica (async sync)
- Setup: async worker sync explanations → Chroma setiap jam
```

**Issue 3.3 — Tabel `student_questions` missing unique constraint**
```
Current:
CREATE TABLE student_questions (
  id UUID PRIMARY KEY,
  question_text TEXT NOT NULL,
  ...
}

Problem:
- Bisa duplicate question text? Atau ada constraint?
- Kalau ada 100 siswa dengan soal identik, 
  bisa terjadi 100 LLM calls (wasted cost) 
  daripada retrieve 1x + share hasil
```

**Rekomendasi:**
```sql
-- Add semantic hash untuk deduplication
CREATE TABLE student_questions (
  id UUID PRIMARY KEY,
  question_text TEXT NOT NULL,
  question_hash VARCHAR(64) NOT NULL,  -- SHA256 of normalized question
  -- ... other columns
  
  UNIQUE(question_hash, concept_id, level)
  -- Jadi kalau ada question yang semantically duplicate, 
  -- bisa reuse LLM result dari question yang sama
);

-- Saat simpan:
-- 1. Hash question_text
-- 2. Check UNIQUE constraint
-- 3. Kalau sudah ada, copy llm_generated_answer dari row yang lama
-- 4. Kalau baru, generate LLM response
```

---

### ✅ SECTION 4: LEXICAL SEARCH IMPLEMENTATION
**Status:** SOLID, tapi kurang contoh error handling

**Positif:**
- Query structure logis (concept_id + level → fast)
- Fallback chain jelas

**Issue 4.1 — Concept_id mapping tidak dijelaskan**
```
Current flow assume:
  exerciseId: 'l5_add_7_4'
  ↓ [somehow map to]
  concept_id: 'addition_7_4', level: 5

Problem:
- Siapa yang maintain mapping ini?
- Bagaimana jika ada soal "7+4" di kelas 1 vs kelas 5 
  (berbeda approach GASING/PMRI)?
```

**Rekomendasi:**
```
Buat tabel lookup eksplisit:

CREATE TABLE concept_mappings (
  exercise_id VARCHAR(100) PRIMARY KEY,
  concept_id VARCHAR(100) NOT NULL,
  level INT NOT NULL,
  difficulty INT (1-5),
  suggested_mode VARCHAR(50) DEFAULT 'GASING',  -- Kelas 1-2: GASING, 4-6: PMRI
  FOREIGN KEY (concept_id, level) 
    REFERENCES explanations(concept_id, level)
);

INSERT INTO concept_mappings VALUES
  ('l1_add_3_2', 'addition_small', 1, 1, 'GASING'),
  ('l5_add_7_4', 'addition_larger', 5, 2, 'GASING'),
  ('l6_frac_1_4', 'fraction_basic', 6, 2, 'PMRI');

Then query:
  mapping = await db.query('SELECT * FROM concept_mappings WHERE exercise_id = ?')
  explanation = await getLexicalExplanation(mapping.concept_id, mapping.level)
```

**Issue 4.2 — Error handling terlalu generic**
```
Current (pseudocode):
  const result = await db.query(...);
  if (!result) return null;  // Fallback ke semantic

Missing:
- Database connection error? Retry logic?
- Index not found? Log alert?
- Timeout >10ms? Fallback ke cache?
```

**Rekomendasi:**
```typescript
async function getLexicalExplanation(conceptId: string, level: int) {
  const timeout = 15; // ms, slightly more than target 10ms
  const maxRetries = 2;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await db.query(
        `SELECT * FROM explanations 
         WHERE concept_id = $1 AND level = $2 LIMIT 1`,
        [conceptId, level],
        { timeout }
      );
      
      if (result.rows.length > 0) {
        return {
          source: 'lexical',
          explanation: result.rows[0],
          response_time_ms: Date.now() - start,
          cache_hit: false
        };
      }
      return null; // No match, fallback to semantic
      
    } catch (err) {
      if (err.code === 'ETIMEDOUT' && attempt < maxRetries - 1) {
        console.warn(`Lexical query timeout, retrying (${attempt + 1}/${maxRetries})`);
        continue;
      }
      
      console.error(`Lexical query failed: ${err.message}`);
      // Alert: database issue
      return null; // Fallback immediately
    }
  }
}
```

---

### ✅ SECTION 5: SEMANTIC SEARCH (CHROMA)
**Status:** GOOD, tapi embedding strategy perlu validasi

**Positif:**
- Chroma choice bagus (open source, dapat di-host sendiri)
- Threshold 0.75 reasonable untuk matematika SD

**Issue 5.1 — Embedding model belum dipilih dengan jelas**
```
Current recommendation:
  "LazarusNLP/indonesian-sentence-embeddings"

Problem:
- Sudah tested dengan soal matematika SD?
- Embedding size (1536 dim) itu dari BERT? Besar sekali.
- Performance impact?
```

**Rekomendasi:**
```
Lakukan benchmark 3 model embedding:

1. LazarusNLP/indonesian-sentence-embeddings (1536 dim)
   - Pro: Dilatih explicit untuk Indonesia
   - Con: Besar, slow

2. paraphrase-multilingual-MiniLM-L12-v2 (384 dim)
   - Pro: Kecil, cepat, universal
   - Con: Bukan Indonesia-spesific

3. all-MiniLM-L6-v2 (384 dim)
   - Pro: Paling ringan, cepat
   - Con: General purpose

Benchmark test set 100 soal SD:
├─ Query: "Kenapa 7+4 jadi 11?"
├─ Expected: retrieval penjelasan penjumlahan
├─ Metric: Mean Reciprocal Rank (MRR), NDCG@5

Rekomendasi final berdasarkan accuracy + speed trade-off.
```

**Issue 5.2 — Semantic search relevance bisa salah arah**
```
Example problem:
  Query: "Bagaimana cara hitung 3×4?"
  Top retrieval: Penjelasan pecahan 3/4
  Similarity score: 0.78 (above threshold 0.75!)
  
Why? Keduanya ada "3" dan "4", embedding tidak paham "×" vs "/"
```

**Rekomendasi:**
```
Tambahkan classifier layer sebelum semantic search:

Step 1: Extract operasi dari query
  "3×4" → operasi = "multiplication"
  "7+4" → operasi = "addition"
  "bagaimana cara..." → query_type = "how_to"

Step 2: Filter semantic search results
  BEFORE ranking by similarity, filter:
  - Same operasi type
  - Same level (±1 level OK)
  - Same query_type (how_to, clarification, challenge, dll)

Step 3: THEN rank by similarity_score

Result: Semantic recall lebih presisi, kurang false positives.

Code example:
  const operasi = extractOperasi(query);  // "addition"
  const results = await chroma.search(query, { limit: 20 });
  const filtered = results.filter(r => 
    r.metadata.operasi === operasi && 
    Math.abs(r.metadata.level - level) <= 1
  );
  const ranked = filtered.sort((a, b) => b.similarity - a.similarity);
  return ranked.slice(0, 5);
```

**Issue 5.3 — Caching semantic results hanya di memory**
```
Current:
  Cache semantic results di Redis untuk <100ms lagi

Problem:
- Kalau Redis crash, lose all semantic cache
- Semantic embedding + vector search expensive 
  (80ms), perlu persistent cache
```

**Rekomendasi:**
```
Tambahkan layer cache bertingkat:

1. Memory cache (Redis): Hot queries, TTL 1 jam
2. Persistent cache (PostgreSQL): All semantic results
   
   CREATE TABLE semantic_cache (
     query_hash VARCHAR(64) PRIMARY KEY,
     query_text TEXT,
     concept_id VARCHAR(100),
     level INT,
     
     result_explanation_id UUID,
     similarity_score FLOAT,
     retrieved_at TIMESTAMP,
     
     FOREIGN KEY (result_explanation_id) 
       REFERENCES explanations(id),
     INDEX idx_query_hash (query_hash),
     INDEX idx_concept_level (concept_id, level)
   );

Flow:
  Query → check Redis (cache)
        → if miss, check semantic_cache (persistent)
        → if miss, run Chroma search + save to both caches
```

---

### ✅ SECTION 6: HYBRID QUERY PIPELINE
**Status:** GOOD, tapi scoring strategy belum robust

**Positif:**
- Multi-path routing jelas
- Threshold 0.75 reasonable untuk semantic

**Issue 6.1 — Decision logic terlalu strict biner**
```
Current decision tree:
  IF lexical hit THEN return
  ELSE IF semantic similarity > 0.75 THEN return
  ELSE call LLM

Problem:
- Semantic hit tapi score 0.74? Discarded, fallback ke LLM (expensive!)
- Kalau semantic result decent (0.70), 
  bisa use sebagai inspiration untuk LLM prompt (few-shot)
```

**Rekomendasi:**
```
Replace biner decision dengan ranking + scoring:

Score_total = (weight_lexical × score_lexical) 
            + (weight_semantic × score_semantic)
            + (weight_cache × score_cache)

Example:
  Lexical hit: 1.0 (perfect match)
  Semantic hit 0.78: 0.78 (high confidence)
  Semantic hit 0.65: 0.65 (moderate confidence)
  Semantic hit 0.40: 0.40 (low confidence)

Threshold logic:
  score >= 0.90 → use result immediately
  0.75 <= score < 0.90 → use result + log as "good enough"
  0.60 <= score < 0.75 → use semantic result BUT inject few-shot LLM prompt
                         (LLM generate refinement, bukan dari scratch)
  score < 0.60 → call LLM from scratch (expensive path)
  
Benefit:
  - Semantic hasil mediocre tetap useful (input ke LLM)
  - Kurangi LLM calls 20-30% dari pure threshold approach
  - Quality tetap terjaga
```

---

### ✅ SECTION 7: LLM FALLBACK (OPENROUTER INTEGRATION)
**Status:** SOLID INFRASTRUCTURE, tapi priming/prompt sangat kurang

**Positif:**
- OpenRouter choice bagus (multi-model, fallback automatic)
- Cost estimation realistic
- Model selection (Claude/Gemini) OK

**⚠️ CRITICAL ISSUE 7.1 — PRIMING STRUCTURE MISSING**
```
Current doc:
  "LLM Fallback" section hanya discuss:
  - API integration
  - Error handling
  - Cost tracking
  
MISSING:
  - System prompt construction
  - Few-shot example injection
  - Output validation/normalization
  - Mode selection (GASING vs PMRI)
```

**Ini masalah PALING BESAR dalam spec ini.**

**Rekomendasi — WAJIB TAMBAHKAN:**
```
Section 7 harus include:

7.1 Prompt Engineering Layer
    ├─ System prompt template (dari PRIMING_STRUKTUR_BOT.md)
    ├─ Few-shot context injection (dari corpus semantic search)
    ├─ Mode selection logic (GASING vs PMRI berdasarkan level)
    └─ Variable substitution (student name, soal number, dll)

7.2 Output Validation Layer
    ├─ Check operasi words (TAMBAH/DIKURANG/DIKALI/DIBAGI)
    ├─ Check notasi normalisasi (3/4 → tiga PER empat)
    ├─ Check Melayu word filter
    ├─ Check kalimat length (max 15 kata)
    └─ QA checklist execution

7.3 Fallback-to-Fallback Logic
    ├─ Kalau LLM output FAIL validation, retry dengan:
    │  - Temperature tuning (lower suhu = lebih konsisten)
    │  - Different model (Claude → Gemini)
    │  - Simplified prompt (kurangi few-shot)
    └─ Jika semua retry gagal, return best effort + log incident

7.4 Caching Strategy untuk LLM results
    ├─ Store ke student_questions table
    ├─ Hash question untuk deduplication
    ├─ Set TTL untuk cache invalidation
    └─ Metric: cache hit rate, should ↑ over time
```

**Rekomendasi eksplisit:**
```typescript
// Pseudocode untuk LLM fallback yang robust
async function llmFallback(query, conceptId, level, mode) {
  // Step 1: Fetch few-shot examples dari corpus
  const fewShotExamples = await semanticSearch(query, { limit: 3 });
  
  // Step 2: Build system prompt
  const systemPrompt = buildSystemPrompt({
    role: 'guru_matematika_sd_hangat',
    mode: mode || suggestMode(level),  // GASING / PMRI
    fewShot: fewShotExamples,
    constraints: PRIMING_CONSTRAINTS // dari file priming
  });
  
  // Step 3: Call OpenRouter
  const response = await callOpenRouter({
    model: 'claude-3.5-sonnet',
    system: systemPrompt,
    messages: [{
      role: 'user',
      content: query
    }],
    temperature: 0.3,  // Low temp untuk consistency
    max_tokens: 300
  });
  
  // Step 4: Validate output
  const validated = await validateOutput(response, {
    checkOperasiWords: true,
    checkMalayuWords: true,
    normalizeNotation: true,
    checkSentenceLength: true
  });
  
  if (validated.passed) {
    // Step 5: Cache result
    await cacheStudentQuestion({
      question_text: query,
      llm_generated_answer: validated.output,
      concept_id: conceptId,
      level: level,
      mode: mode
    });
    
    return validated.output;
  } else {
    // Step 6: Retry atau fallback
    return await llmFallbackRetry(query, conceptId, level, validated.errors);
  }
}
```

**Issue 7.2 — Cost tracking terlalu simple**
```
Current:
  track OpenRouter cost per query
  
Missing:
  - Per-student cost allocation (useful untuk analytics)
  - Per-concept cost (mana konsep paling expensive?)
  - Cost anomaly detection (sudden spike?)
  - Budget enforcement (hardcap per bulan?)
```

**Rekomendasi:**
```sql
CREATE TABLE llm_cost_tracking (
  id UUID PRIMARY KEY,
  student_id UUID,
  question_id UUID,
  concept_id VARCHAR(100),
  level INT,
  model VARCHAR(100),
  tokens_input INT,
  tokens_output INT,
  cost_usd DECIMAL(10, 4),
  cost_rp DECIMAL(15, 2),
  created_at TIMESTAMP
);

-- Dashboard queries:
SELECT concept_id, COUNT(*) queries, SUM(cost_rp) total_cost
FROM llm_cost_tracking
GROUP BY concept_id
ORDER BY total_cost DESC;

SELECT DATE(created_at), SUM(cost_rp) daily_cost
FROM llm_cost_tracking
GROUP BY DATE(created_at)
HAVING daily_cost > EXPECTED_DAILY_BUDGET
ORDER BY created_at DESC;
```

---

### ✅ SECTION 8: CACHING & PERFORMANCE OPTIMIZATION
**Status:** COMPREHENSIVE, tapi missing TTS integration

**Positif:**
- Cache hierarchy (memory + persistent) well-designed
- TTL strategy reasonable
- Warm-up strategy thought through

**Issue 8.1 — Cache invalidation strategy belum jelas**
```
Current:
  "set TTL per explanation untuk invalidate stale data"
  
Vague points:
  - TTL berapa? 1 hari? 1 minggu? 1 bulan?
  - Kalau ada perubahan di explanations table, 
    otomatis invalidate cache mana?
  - Kalau ada update priming rule baru 
    (misal tambah kata Melayu ke watchlist),
    apakah cached result harus di-recompute?
```

**Rekomendasi:**
```
CREATE EXPLICIT INVALIDATION STRATEGY:

1. TTL per jenis cache:
   - Redis (lexical/semantic cache): 24 jam
   - student_questions cache: 7 hari (atau sampai next update)
   - semantic_cache (persistent): 30 hari atau hingga manual purge

2. Event-triggered invalidation:
   a) Kalau UPDATE explanations table:
      - Invalidate Redis entries untuk explanation_id itu
      - Invalidate semantic_cache entries yg match concept_id
      
      CREATE TRIGGER invalidate_cache_on_explanation_update
      AFTER UPDATE ON explanations
      FOR EACH ROW
      BEGIN
        DELETE FROM semantic_cache 
        WHERE result_explanation_id = NEW.id;
        -- Also: DELETE from Redis [key pattern]
      END;
   
   b) Kalau ada UPDATE ke priming rules:
      - Add column: priming_version INT ke explanations table
      - Kalau version berubah, cache semua hasil dependent
      - Trigger: UPDATE explanations SET priming_version = priming_version + 1
               WHERE affected_concepts
      
   c) Kalau batch import explanation baru:
      - Warm-up semantic embeddings async
      - Don't block main API
      - Async worker: scan new explanations, compute embeddings, bulk insert ke Chroma

3. Monitoring cache health:
   - Log: cache hit rate per tier
   - Alert: cache miss rate > 30% (means cache tidak efektif)
   - Alert: memory usage > 80% (need eviction)
```

**Issue 8.2 — Warming cache pada startup**
```
Current strategy:
  Warm up top 1000 explanations saat startup

Missing:
  - Berapa lama warm-up ini? Blok startup?
  - Kalau ada 5000 explanations, 4000 yang lain cold start
  - Per-student warm-up (siswa A sering soal penjumlahan, 
    pre-warm soal penjumlahan untuk siswa A)
```

**Rekomendasi:**
```
Strategi warming bertingkat:

Tier 1 (On startup, sync):
  - Top 100 most-used explanations
  - Time: <1 second
  - Load: lexical indexes only

Tier 2 (Async, background):
  - Top 1000 explanations
  - Load: semantic embeddings di Chroma
  - Time: background worker, tidak blok startup
  - Start immediately setelah Tier 1 done

Tier 3 (On-demand, per student):
  - Based on student learning profile
  - Saat student login, predict soal mana yang akan dia lakukan
  - Pre-load explanations untuk soal tersebut
  - Background worker: student profile analyzer

Monitoring:
  - Track: % explanations cold vs warm
  - Alert: cold hit > 10% (meaning lots of misses)
  - Adjust tier sizes based on actual hit rates
```

---

### ✅ SECTION 9: QUERY DISTRIBUTION ANALYSIS
**Status:** GOOD DATA SCIENCE, tapi missing validation

**Positif:**
- Distribution analysis realistic (70/20/10 split)
- Cost estimation detailed

**Issue 9.1 — Distribution assumptions belum validated**
```
Current:
  "Predict 70% lexical, 20% semantic, 10% LLM"
  
Problem:
  - Dari mana data ini? Survey? Simulation?
  - Bagaimana kalau actual usage berbeda?
    Misal 30% lexical (soal lebih variatif), 60% semantic?
  - Bagaimana kalau corpus masih kecil di awal?
```

**Rekomendasi:**
```
Add section: "Distribution Validation Strategy"

Phase 1 (First 2 weeks):
  - Launch dengan conservative assumption: 50% lexical, 40% semantic, 10% LLM
  - Monitor real distribution
  - Adjust thresholds based on actual data

Phase 2 (Weeks 3-4):
  - Rebuild corpus based on captured queries
  - Re-analyze distribution
  - Implement improved retrieval if needed

Phase 3 (Month 2+):
  - Should stabilize ke predicted 70/20/10 after corpus building
  - Monitor continuously
  - Adjust if distribution shifts

Metrics to track:
  - Daily distribution (% lexical/semantic/llm)
  - Distribution per concept (addition berbeda dari fraction?)
  - Distribution per student level (kelas 1 vs kelas 5?)
  - Distribution per student (some students more creative?)
```

---

### ✅ SECTION 10: IMPLEMENTATION CHECKLIST
**Status:** DETAILED & REALISTIC timeline

**Positif:**
- Phase breakdown clear (4 phases, 10 weeks)
- Weekly milestones specific

**Issue 10.1 — Missing "Corpus Building" phase**
```
Current phases:
  1. Database & Retrieval (Weeks 1-4)
  2. LLM Integration (Weeks 5-6)
  3. Optimization (Weeks 7-8)
  4. Production Deployment (Weeks 9-10)

Missing:
  - Kapan corpus diisi?
  - Corpus = 100+ penjelasan dari mana?
  - Siapa yang validate corpus quality?
```

**Rekomendasi:**
```
Tambahkan Phase 0.5: "Corpus Preparation" (Weeks -1 to 0)
SEBELUM development dimulai

  Week -1 (Preparation):
    [ ] Collect 5-10 video guru SD (YouTube)
    [ ] Transkripsi ke bentuk tutur
    [ ] Identify 30-50 core concepts (penjumlahan, pengurangan, dll)
    [ ] Collect 5-7 penjelasan per concept
    [ ] Total corpus size: 150-350 penjelasan (kebanggaan!)
    
  Week 0 (QA & Import):
    [ ] Format corpus ke JSON sesuai schema
    [ ] Validate each explanation (bahasa, notasi, length)
    [ ] Run priming checklist setiap explanation
    [ ] Import ke PostgreSQL
    [ ] Compute Chroma embeddings
    [ ] Prepare 3-5 test soal per concept

Timeline impact:
  - Phase 0.5 bisa paralel dengan prep development
  - Tapi JANGAN mulai Phase 1 sebelum corpus ready
  - Corpus adalah "make or break" untuk quality
```

**Issue 10.2 — Testing checklist missing TTS validation**
```
Current:
  "Test end-to-end workflow"
  "Test response logging"
  
Missing:
  - TTS testing (actual voice output)
  - Pronunciations checking
  - Duration vs student attention span
```

**Rekomendasi:**
```
Add to Testing Checklist:

Week 8 (add to existing):
  [ ] Run full pipeline to TTS
  [ ] Manual listening test: 20 explanations
  [ ] Checklist per audio:
      - Pronunciation clarity
      - Speed appropriate (not too fast/slow)
      - Notasi diucapkan benar (operasi, pecahan, satuan)
      - Rhythm natural (bukan robot-like)
      - Duration 30-120 sec per explanation
  [ ] If any fail: log and iterate (priming adjustment)
```

---

### ✅ SECTION 11: TESTING & VALIDATION
**Status:** GOOD TEST STRUCTURE, tapi missing edge cases

**Positif:**
- Unit tests konkret
- Integration tests cover happy path
- Load testing metrics reasonable

**Issue 11.1 — Missing edge case tests**
```
Current tests:
  - Lexical happy path
  - Semantic happy path
  - Hybrid fallback

Missing:
  - Soal dengan notasi kompleks (pecahan + operasi)
  - Soal dengan kata Melayu campuran
  - Soal dengan typo/OCR error dari foto
  - Soal yang sangat panjang/kompleks
  - Simultaneous queries (race condition)
```

**Rekomendasi:**
```typescript
// Additional edge case tests

describe('Edge Cases', () => {
  it('should handle mixed notation (fraction + operation)', async () => {
    // Input: "3/4 + 1/2 = ?"
    const result = await hybridBotExplain('student1', {
      questionText: 'Berapa 3/4 tambah 1/2?'
    });
    
    // Verify operasi: TAMBAH (tidak keliru dengan /)
    expect(result.explanation.speech_friendly_text)
      .toContain('TAMBAH'); // not "banding"
    expect(result.explanation.speech_friendly_text)
      .toMatch(/tiga PER empat.*TAMBAH.*satu PER dua/);
  });
  
  it('should filter Malay words', async () => {
    // Imagine LLM accidentally output "awak" instead of "kamu"
    const llmOutput = "awak harus ikuti langkah ini...";
    const validated = await validateOutput(llmOutput);
    
    expect(validated.passed).toBe(false);
    expect(validated.errors).toContain('malay_word_detected');
  });
  
  it('should handle OCR errors in student question', async () => {
    const result = await hybridBotExplain('student1', {
      questionText: 'Berapa 7+4? (from OCR: might have typo)'
    });
    
    // Should still match despite minor typo
    expect(result.source).toMatch(/lexical|semantic|cache/);
  });
  
  it('should handle very long question without breaking', async () => {
    const longQuestion = 'Saya punya 3 apel. Kakak saya punya 4 apel. ...[continues]...';
    const result = await hybridBotExplain('student1', {
      questionText: longQuestion,
      timeout: 10000  // Longer timeout
    });
    
    expect(result.explanation).toBeDefined();
    expect(result.response_time_ms).toBeLessThan(10000);
  });
  
  it('should handle concurrent queries without race condition', async () => {
    const promises = Array(10).fill(0).map((_, i) =>
      hybridBotExplain(`student${i}`, {
        exerciseId: 'l5_add_7_4',
        studentAnswer: '10',
        correctAnswer: '11'
      })
    );
    
    const results = await Promise.all(promises);
    
    // All should succeed
    results.forEach(r => expect(r.explanation).toBeDefined());
    
    // Should reuse cache (not 10 LLM calls)
    const lexicalHits = results.filter(r => r.source === 'lexical').length;
    expect(lexicalHits).toBeGreaterThan(5);  // Most should be lexical
  });
});
```

---

### ✅ SECTION 12: MONITORING & ANALYTICS
**Status:** COMPREHENSIVE DASHBOARD DESIGN

**Positif:**
- Metrics well-defined
- Alerting rules reasonable
- Real-time dashboard concept solid

**Issue 12.1 — Missing student-level metrics**
```
Current:
  System-level metrics (QPS, latency, cost)
  
Missing:
  - Per-student learning progress
  - Which explanations most helpful (by student satisfaction)
  - Repeat question tracking (cache effectiveness from UX perspective)
  - Student comprehension signal (did student ask follow-up?)
```

**Rekomendasi:**
```
Add Student-Level Metrics:

Per Student Dashboard:
├─ Learning progress
│  ├─ Concepts mastered vs struggling
│  ├─ Average time-to-answer per concept
│  └─ Error rate trend (should ↓ over time)
│
├─ Engagement
│  ├─ Questions asked per session
│  ├─ Repeat rate (same question twice? means didn't understand)
│  └─ Follow-up questions (asking "bagaimana caranya?" after explanation)
│
├─ Explanation effectiveness
│  ├─ Did student answer correctly after explanation?
│  ├─ Student rating 1-5 per explanation
│  └─ Time to next question (fast = understood, slow = confused)
│
└─ Cost per student (debug: why this student generates high LLM cost?)

Query examples:
  SELECT concept_id, COUNT(*) times_asked,
         CASE WHEN COUNT(*) > 1 THEN 'struggling' ELSE 'ok' END
  FROM student_questions
  WHERE student_id = $1
  GROUP BY concept_id
  HAVING COUNT(*) > 1;
  
  -- Student confusion pattern
  SELECT student_id, concept_id, COUNT(*) repeat_count
  FROM student_questions
  WHERE student_id = $1 AND created_at > NOW() - INTERVAL '1 week'
  GROUP BY student_id, concept_id
  ORDER BY repeat_count DESC;
```

---

## SUMMARY: CRITICAL GAPS

| Gap | Severity | Impact | Recommendation |
|-----|----------|--------|-----------------|
| Priming structure not integrated | CRITICAL | Output quality will be poor | Integrate priming_struktur_bot.md into Section 7 |
| Notasi normalisasi tidak eksplisit | CRITICAL | TTS akan salah baca | Add normalization layer before TTS |
| TTS integration missing | CRITICAL | Output tidak suara | Add TTS config to response schema |
| Corpus building not scheduled | MAJOR | RAG akan useless tanpa data | Add Phase 0.5 before dev starts |
| LLM prompt engineering vague | MAJOR | LLM output will be unpredictable | Provide concrete prompt templates |
| Edge case tests missing | MEDIUM | Production bugs likely | Add edge case test suite |
| Student-level metrics missing | MEDIUM | Can't measure learning outcome | Add student dashboard metrics |
| Distribution validation missing | MEDIUM | Assumptions unvalidated | Add validation strategy |

---

## RECOMMENDED NEXT STEPS

### Prioritas 1 (URGENT — Do First):
1. **Integrate priming struktur** ke Section 7 (LLM Fallback)
2. **Add normalisasi layer** di pipeline (before TTS)
3. **Add Phase 0.5** (Corpus Preparation) ke timeline
4. **Create prompt templates** (system + few-shot + output validation)

### Prioritas 2 (IMPORTANT — Do Next):
1. Validate semantic search embedding choice dengan test soal real
2. Implement hybrid scoring (bukan biner threshold)
3. Add student-level dashboard metrics
4. Create corpus structure & validation checklist

### Prioritas 3 (NICE-TO-HAVE):
1. Implement per-concept cost analysis
2. Add edge case tests
3. Implement per-student warm-up caching
4. Add priming version tracking

---

## VERDICT

**RAG architecture is solid. But success depends 80% on PRIMING + CORPUS, not on RAG algorithm itself.**

Recommend:
- ✅ Proceed with architecture
- ⚠️ Delay development until corpus ready
- ⚠️ Prioritize priming integration
- ✅ Use this spec as implementation blueprint after gaps closed

**Timeline impact:** Add 2-3 weeks for corpus building before dev starts.

---

