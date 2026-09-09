# 🔍 RAG SYSTEM TECHNICAL SPECIFICATION v1.0
## Retrieval-Augmented Generation (Hybrid Lexical + Semantic Search)

**Date:** September 2, 2026  
**Version:** 1.0 (Complete)  
**Status:** Ready for Implementation  
**Scope:** Bot explanation retrieval system with lexical + semantic hybrid approach

---

# TABLE OF CONTENTS

1. Executive Summary
2. System Architecture
3. Database Schema & Indexing
4. Lexical Search Implementation
5. Semantic Search (Chroma Vector DB)
6. Hybrid Query Pipeline
7. LLM Fallback (OpenRouter Integration)
8. Caching & Performance Optimization
9. Query Distribution Analysis
10. Implementation Checklist
11. Testing & Validation
12. Monitoring & Analytics

---

# 1. EXECUTIVE SUMMARY

## Purpose
Provide instant, accurate bot explanations to students by combining:
- **Lexical Search** (70% of queries): Fast, exact-match database lookups
- **Semantic Search** (20% of queries): Vector similarity matching (Chroma)
- **LLM Fallback** (10% of queries): Dynamic generation for unique questions

## Key Goals
```
Performance:
├─ Lexical response: <10ms
├─ Semantic response: <100ms
├─ LLM response: 3-5 seconds
└─ Overall 95%ile latency: <500ms

Cost:
├─ Lexical/Semantic: $0 (database + local vector DB)
├─ LLM: Rp 5-10K/month for 1000 users
└─ Infrastructure: <Rp 100K/month total

Accuracy:
├─ Lexical match accuracy: 99%
├─ Semantic match accuracy: 85%
├─ LLM accuracy: 95%
└─ Overall system: 95%+

Coverage:
├─ Lexical hits: 70%+
├─ Semantic hits: 80%+ (of non-lexical)
├─ LLM hits: 100% (fallback)
└─ Total coverage: 99.99%
```

## Why Hybrid Approach

```
Problem 1: Pure Lexical
├─ Fast but rigid
├─ Misses paraphrased questions
└─ Not suitable for freeform input

Problem 2: Pure Semantic
├─ More flexible but slower
├─ More expensive (vector DB costs)
├─ Sometimes weak match quality

Problem 3: Pure LLM
├─ Most expensive (every query)
├─ Slowest (3-5 seconds each)
├─ Not needed for structured cases

Solution: HYBRID
├─ Fast path (Lexical) → 70% of queries
├─ Medium path (Semantic) → 20% of queries
├─ Slow path (LLM) → 10% of queries
└─ Result: Optimal cost, speed, quality
```

---

# 2. SYSTEM ARCHITECTURE

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  BOT QUERY FROM STUDENT                     │
│  "Mengapa 7+4 itu 11?" OR "Explain wrong answer (7+4=10)" │
└─────────────────────────────────────────────────────────────┘
                            ↓
        ┌───────────────────────────────────────┐
        │  HYBRID SEARCH PIPELINE                │
        └───────────────────────────────────────┘
                            ↓
        ┌─────────────────────────────────────────────────────┐
        │ LAYER 1: LEXICAL SEARCH (Fast Path)                 │
        │ ├─ Query PostgreSQL by concept_id + level           │
        │ ├─ Time: <10ms                                      │
        │ ├─ Accuracy: 99%                                    │
        │ └─ Hit rate: 70%                                    │
        └─────────────────────────────────────────────────────┘
                   ✓ FOUND? (70%)        ✗ NOT FOUND (30%)
                      ↓                           ↓
                  [Return answer]    ┌──────────────────────┐
                   (DONE, <10ms)    │ LAYER 2: SEMANTIC     │
                                    │ SEARCH (Medium Path)  │
                                    │ ├─ Convert query→    │
                                    │ │  vector (embedding) │
                                    │ ├─ Search Chroma DB   │
                                    │ ├─ Time: <100ms       │
                                    │ ├─ Accuracy: 85%      │
                                    │ └─ Hit rate: 80% of   │
                                    │   non-lexical queries │
                                    └──────────────────────┘
                                   ✓ FOUND (80%)  ✗ NO MATCH
                                      ↓              (6%)
                                  [Return answer]    ↓
                               (DONE, <100ms)  ┌──────────────┐
                                               │ LAYER 3: LLM │
                                               │ (Slow Path)  │
                                               │              │
                                               │ Call:        │
                                               │ OpenRouter   │
                                               │ API          │
                                               │              │
                                               │ Time:3-5s    │
                                               │ Cost:Rp 5-10│
                                               │ Hit: 100%    │
                                               └──────────────┘
                                                      ↓
                                            [Generate + Cache]
                                             (Save for future)
                                                      ↓
                                               [Return answer]
                                            (DONE, 3-5 seconds)
                                                      ↓
                    ┌─────────────────────────────────────────┐
                    │ ALL PATHS CONVERGE HERE:                │
                    │ Display bot explanation to student      │
                    │ Log effectiveness (which variant helped?)│
                    │ Update student learning profile         │
                    └─────────────────────────────────────────┘
```

## Component Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                    SPEED MATH APP                            │
│                  (React PWA Frontend)                        │
└──────────────────────────────────────────────────────────────┘
                            ↕
┌──────────────────────────────────────────────────────────────┐
│                   BOT API GATEWAY                            │
│           (Express.js, Rate Limiting, Auth)                 │
└──────────────────────────────────────────────────────────────┘
         ↓              ↓              ↓              ↓
    ┌─────────┐  ┌──────────┐  ┌─────────────┐  ┌──────────┐
    │ Lexical │  │ Semantic │  │ LLM         │  │ Cache    │
    │ Search  │  │ Search   │  │ Fallback    │  │ Layer    │
    │         │  │          │  │             │  │          │
    │PostgreSQL  │Chroma    │  │OpenRouter   │  │Redis     │
    │         │  │          │  │             │  │          │
    └─────────┘  └──────────┘  └─────────────┘  └──────────┘
         ↓              ↓              ↓              ↓
    ┌──────────────────────────────────────────────────────┐
    │   UNIFIED RESPONSE FORMAT                           │
    │  {                                                   │
    │    source: "lexical|semantic|llm|cache",           │
    │    explanation: {...},                             │
    │    variants: [gasing, pmri, mental_math],          │
    │    voice_url: "s3://...",                          │
    │    response_time_ms: 45,                           │
    │    cache_hit: true/false                           │
    │  }                                                   │
    └──────────────────────────────────────────────────────┘
```

---

# 3. DATABASE SCHEMA & INDEXING

## Table 1: Explanations (Pre-Generated Content)

```sql
CREATE TABLE explanations (
  id UUID PRIMARY KEY,
  concept_id VARCHAR(100) NOT NULL,
  level INT NOT NULL,
  
  -- Main explanation content
  main_explanation TEXT NOT NULL,
  step_by_step JSONB,
  quick_method TEXT NOT NULL,
  
  -- v1.2: Three variants (GASING, PMRI, Mental Math)
  variant_1_gasing TEXT NOT NULL,
  variant_2_pmri TEXT NOT NULL,
  variant_3_mental_math TEXT NOT NULL,
  
  -- Metadata for retrieval
  explanation_style VARCHAR(50),
  preferred_method VARCHAR(100),
  common_mistakes JSONB,
  examples JSONB,
  speech_friendly_text TEXT,
  
  -- For vector search
  embedding_vector vector(1536),  -- Chroma embedding dimension
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  created_by VARCHAR(100),
  educator_reviewed BOOLEAN DEFAULT FALSE,
  
  -- Constraints
  CONSTRAINT check_variants_not_null CHECK (
    variant_1_gasing IS NOT NULL 
    AND variant_2_pmri IS NOT NULL 
    AND variant_3_mental_math IS NOT NULL
  )
);

-- CRITICAL INDEXES for LEXICAL SEARCH
CREATE INDEX idx_concept_level ON explanations(concept_id, level);
CREATE INDEX idx_concept_only ON explanations(concept_id);
CREATE INDEX idx_level ON explanations(level);

-- INDEX for SEMANTIC SEARCH (Chroma will handle)
-- Embeddings stored in Chroma, not in PostgreSQL directly

-- Full-text search capability
CREATE INDEX idx_explanation_fulltext ON explanations 
  USING gin(to_tsvector('indonesian', main_explanation));
```

## Table 2: Student Questions (Dynamic Cache)

```sql
CREATE TABLE student_questions (
  id UUID PRIMARY KEY,
  
  -- Question metadata
  question_text TEXT NOT NULL,
  question_language VARCHAR(20) DEFAULT 'id',
  
  -- Context
  student_id UUID,
  concept_id VARCHAR(100),
  level INT,
  question_type VARCHAR(50),
  -- Types: 'clarification', 'concept', 'difficulty', 'freeform'
  
  -- LLM-generated answer
  llm_generated_answer TEXT,
  llm_model VARCHAR(100),
  llm_cost_rp DECIMAL(10,2),
  llm_latency_ms INT,
  
  -- Embeddings for semantic search
  embedding_vector vector(1536),
  
  -- Effectiveness tracking
  hit_count INT DEFAULT 1,
  -- How many students found this answer helpful?
  
  total_views INT DEFAULT 1,
  helpful_votes INT DEFAULT 0,
  unhelpful_votes INT DEFAULT 0,
  
  -- Feedback
  student_feedback VARCHAR(500),
  student_rating INT,
  -- 1-5 scale (1=unhelpful, 5=very helpful)
  
  -- Caching
  cached_at TIMESTAMP,
  cache_expiry TIMESTAMP,
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP,
  
  -- Index for searches
  INDEX idx_question_text ON student_questions(question_text(100)),
  INDEX idx_student_id ON student_questions(student_id),
  INDEX idx_concept_level ON student_questions(concept_id, level),
  INDEX idx_created_at ON student_questions(created_at DESC)
);

-- Full-text search for student questions
CREATE INDEX idx_question_fulltext ON student_questions 
  USING gin(to_tsvector('indonesian', question_text));
```

## Table 3: Bot Query Analytics

```sql
CREATE TABLE bot_queries (
  id UUID PRIMARY KEY,
  
  -- Query identification
  student_id UUID NOT NULL,
  session_id UUID,
  
  -- Query details
  query_text TEXT NOT NULL,
  query_type VARCHAR(50),
  -- Types: 'wrong_answer', 'clarification', 'freeform', 'pre_teaching'
  
  -- Context (if wrong answer)
  exercise_id VARCHAR(100),
  student_answer VARCHAR(100),
  correct_answer VARCHAR(100),
  concept_id VARCHAR(100),
  level INT,
  
  -- Retrieval source (which layer answered?)
  retrieval_source VARCHAR(50),
  -- 'lexical', 'semantic', 'llm', 'cache'
  
  -- Response details
  explanation_id UUID,
  variant_shown VARCHAR(50),
  -- 'gasing', 'pmri', 'mental_math'
  
  response_time_ms INT,
  cache_hit BOOLEAN,
  
  -- Effectiveness
  student_understood BOOLEAN,
  student_rating INT,
  -- 1-5 scale
  
  attempt_after_explanation INT,
  -- How many attempts before solved?
  
  -- Audit
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Indexes
  INDEX idx_student_id ON bot_queries(student_id),
  INDEX idx_source ON bot_queries(retrieval_source),
  INDEX idx_concept_level ON bot_queries(concept_id, level),
  INDEX idx_created_at ON bot_queries(created_at DESC)
);
```

## Table 4: Vector Index Metadata (For Chroma)

```sql
CREATE TABLE vector_index_metadata (
  id UUID PRIMARY KEY,
  
  -- Source document
  source_table VARCHAR(50),
  -- 'explanations' or 'student_questions'
  
  source_id UUID,
  
  -- Vector details
  embedding_model VARCHAR(100),
  -- 'Xenova/all-MiniLM-L6-v2' (default for Chroma)
  
  embedding_dimension INT,
  -- 384 for MiniLM, 1536 for OpenAI embeddings
  
  vector_stored_in_chroma BOOLEAN,
  chroma_collection_name VARCHAR(100),
  
  -- Metadata for retrieval
  concept_id VARCHAR(100),
  level INT,
  language VARCHAR(20),
  
  -- When indexed
  indexed_at TIMESTAMP,
  last_updated TIMESTAMP,
  
  -- Status
  active BOOLEAN DEFAULT TRUE,
  
  INDEX idx_source ON vector_index_metadata(source_table, source_id),
  INDEX idx_concept ON vector_index_metadata(concept_id)
);
```

---

# 4. LEXICAL SEARCH IMPLEMENTATION

## Purpose
Fast, exact-match retrieval for structured queries (wrong answer explanations).

## Query Patterns

### Pattern 1: By Concept + Level (Most Common)

```typescript
// Input: Student got 7+4 wrong (exercise_id: "l5_add_7_4")
// Extract: concept_id = "addition_7_4", level = 5

const getLexicalExplanation = async (conceptId: string, level: number) => {
  const query = `
    SELECT 
      id,
      concept_id,
      level,
      main_explanation,
      variant_1_gasing,
      variant_2_pmri,
      variant_3_mental_math,
      quick_method,
      examples,
      speech_friendly_text
    FROM explanations
    WHERE concept_id = $1 
    AND level = $2
    AND educator_reviewed = TRUE
    LIMIT 1;
  `;
  
  const result = await db.query(query, [conceptId, level]);
  
  if (result.rows.length > 0) {
    return {
      source: 'lexical',
      explanation: result.rows[0],
      response_time_ms: Date.now() - startTime
    };
  }
  
  return null; // Fall through to semantic search
};

// Usage:
const explanation = await getLexicalExplanation('addition_7_4', 5);
// Returns in <10ms!
```

### Pattern 2: By Exercise ID (Direct)

```typescript
// Extract concept from exercise_id directly
// exercise_id format: "l5_add_7_4" → concept_id: "addition_7_4"

const getExplanationByExerciseId = async (exerciseId: string) => {
  // Parse exercise ID to get concept
  const conceptId = parseExerciseIdToConcept(exerciseId);
  // e.g., "l5_add_7_4" → "addition_7_4"
  
  const levelMatch = exerciseId.match(/^l(\d+)/);
  const level = parseInt(levelMatch[1]);
  
  return await getLexicalExplanation(conceptId, level);
};

// Helper function to parse exercise ID
const parseExerciseIdToConcept = (exerciseId: string): string => {
  // l5_add_7_4 → addition_7_4
  const parts = exerciseId.split('_');
  // Remove level prefix (l5)
  parts.shift();
  return parts.join('_');
};
```

### Pattern 3: Full-Text Search (Fallback)

```typescript
// For questions like: "Bagaimana cara hitung penjumlahan?"
// Search full-text index

const lexicalFullTextSearch = async (query: string) => {
  const sqlQuery = `
    SELECT 
      id,
      concept_id,
      level,
      ts_rank(
        to_tsvector('indonesian', main_explanation),
        plainto_tsquery('indonesian', $1)
      ) AS rank,
      main_explanation,
      variant_1_gasing,
      variant_2_pmri,
      variant_3_mental_math
    FROM explanations
    WHERE to_tsvector('indonesian', main_explanation) @@ 
          plainto_tsquery('indonesian', $1)
    ORDER BY rank DESC
    LIMIT 1;
  `;
  
  const result = await db.query(sqlQuery, [query]);
  
  if (result.rows.length > 0 && result.rows[0].rank > 0.5) {
    // Only return if rank > threshold
    return {
      source: 'lexical_fulltext',
      explanation: result.rows[0],
      confidence: result.rows[0].rank
    };
  }
  
  return null;
};
```

## Performance Characteristics

```
Query Execution Time:
├─ Index scan: 1-3ms
├─ Data fetch: 5-7ms
├─ Total: <10ms per query (99%ile)

Throughput:
├─ Single connection: 100+ queries/second
├─ With connection pool (10 connections): 1000+ QPS
└─ PostgreSQL can easily handle millions of lookups

Cache Impact:
├─ PostgreSQL query cache: Significant for repeated queries
├─ OS page cache: Further improves repeated access
└─ With caching: 70% of queries <5ms
```

---

# 5. SEMANTIC SEARCH (Chroma Vector DB)

## Purpose
Flexible, similarity-based retrieval for paraphrased/flexible queries.

## Architecture

```
┌──────────────────────────────────────────────────────┐
│ SEMANTIC SEARCH PIPELINE                             │
└──────────────────────────────────────────────────────┘

Input Query:
  "Bagaimana cara hitung penjumlahan dengan jari?"

    ↓

┌──────────────────────────────────────────────────────┐
│ Step 1: EMBEDDING GENERATION                         │
│                                                      │
│ Model: Xenova/all-MiniLM-L6-v2                      │
│ (runs locally in backend, no API cost)             │
│                                                      │
│ Input: "Bagaimana cara hitung penjumlahan..."       │
│ ↓                                                    │
│ Output: [0.123, 0.456, -0.789, ..., 0.234]         │
│         (384 dimensions)                            │
│                                                      │
│ Time: <100ms (on first call)                       │
│       <10ms (cached)                               │
└──────────────────────────────────────────────────────┘

    ↓

┌──────────────────────────────────────────────────────┐
│ Step 2: VECTOR SIMILARITY SEARCH                     │
│                                                      │
│ Search in Chroma Collection: "explanations"         │
│                                                      │
│ Find K nearest neighbors (K=3):                     │
│ 1. "penjumlahan dengan jari" (similarity: 0.92)   │
│ 2. "addition menggunakan fingers" (0.89)           │
│ 3. "hitung maju dengan jari" (0.85)                │
│                                                      │
│ Time: <50ms                                        │
└──────────────────────────────────────────────────────┘

    ↓

┌──────────────────────────────────────────────────────┐
│ Step 3: RANKING & FILTERING                         │
│                                                      │
│ Threshold: Similarity > 0.75                        │
│ Rerank: By student_variant_bias & educator_score   │
│                                                      │
│ Final result:                                        │
│ Match: "Bayangkan jarimu..." (score: 0.92)         │
│        [GASING variant for concrete teaching]      │
│                                                      │
│ Confidence: 92% (high)                             │
│ Time: <10ms                                        │
└──────────────────────────────────────────────────────┘

    ↓

Output: Best matching explanation + confidence score
Total time: <100ms
```

## Implementation

### Setup Chroma (One-Time)

```typescript
import { Chroma } from 'chromadb';
import { TransformersEmbeddings } from 'langchain/embeddings/transformers';

// Initialize on server startup
const initChroma = async () => {
  const client = new Chroma({
    path: './chroma_data', // Local storage
  });

  // Create or get collection
  const collection = await client.getOrCreateCollection({
    name: 'explanations',
    metadata: {
      description: 'Pre-generated math explanations with embeddings',
      model: 'Xenova/all-MiniLM-L6-v2'
    }
  });

  // Initialize embeddings model (runs locally)
  const embeddings = new TransformersEmbeddings({
    modelName: 'Xenova/all-MiniLM-L6-v2',
  });

  return { client, collection, embeddings };
};

// On app startup:
const { chroma_client, chroma_collection, embeddings } = await initChroma();
```

### Index Explanations into Chroma

```typescript
// Run once when explanations are generated/updated
const indexExplanationsInChroma = async () => {
  const explanations = await db.query(
    `SELECT id, concept_id, level, main_explanation, 
            variant_1_gasing, variant_2_pmri, variant_3_mental_math
     FROM explanations 
     WHERE educator_reviewed = TRUE`
  );

  for (const exp of explanations.rows) {
    // Combine all explanation text for embedding
    const combined_text = `
      ${exp.main_explanation}
      ${exp.variant_1_gasing}
      ${exp.variant_2_pmri}
      ${exp.variant_3_mental_math}
    `;

    // Generate embedding
    const embedding = await embeddings.embedQuery(combined_text);

    // Add to Chroma collection
    await chroma_collection.add({
      ids: [exp.id],
      embeddings: [embedding],
      documents: [combined_text],
      metadatas: [{
        concept_id: exp.concept_id,
        level: exp.level,
        source: 'explanation'
      }]
    });
  }

  console.log(`Indexed ${explanations.rows.length} explanations`);
};
```

### Query Chroma (Runtime)

```typescript
const semanticSearch = async (query: string, topK = 3) => {
  try {
    // Generate query embedding
    const queryEmbedding = await embeddings.embedQuery(query);

    // Search Chroma
    const results = await chroma_collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: topK,
      where: { educator_reviewed: true } // Only approved content
    });

    if (!results || results.ids.length === 0) {
      return null; // No matches, fall through to LLM
    }

    // Parse results
    const matches = results.ids[0].map((id, idx) => ({
      explanation_id: id,
      metadata: results.metadatas[0][idx],
      similarity: results.distances[0][idx],
      document: results.documents[0][idx]
    }));

    // Filter by threshold
    const bestMatch = matches.find(m => m.similarity > 0.75);

    if (bestMatch) {
      // Fetch full explanation from PostgreSQL
      const explanation = await db.query(
        `SELECT * FROM explanations WHERE id = $1`,
        [bestMatch.explanation_id]
      );

      return {
        source: 'semantic',
        explanation: explanation.rows[0],
        similarity_score: bestMatch.similarity,
        response_time_ms: Date.now() - startTime
      };
    }

    return null; // No threshold match, fall through to LLM

  } catch (error) {
    console.error('Semantic search error:', error);
    return null; // Fallback on error
  }
};
```

## Performance Tuning

```
Optimization 1: Batch Indexing
├─ Index in batches of 100 documents
├─ Reduces memory usage
└─ Faster overall indexing

Optimization 2: Query Caching
├─ Cache embedding results
├─ Reuse for similar queries
└─ <10ms for cached embeddings

Optimization 3: Dimensionality Reduction
├─ Use smaller embedding model (MiniLM: 384D)
├─ vs OpenAI embeddings (1536D)
├─ Faster similarity computation
└─ Still very accurate for education domain

Optimization 4: Approximate Nearest Neighbors (ANN)
├─ If scaling to millions of documents
├─ Chroma uses HNSW algorithm (fast approximate search)
└─ Trade-off: slightly less accuracy for speed
```

---

# 6. HYBRID QUERY PIPELINE

## Complete Flow

```typescript
const hybridBotExplain = async (
  studentId: string,
  queryContext: {
    exerciseId?: string,      // For wrong answer path
    questionText?: string,    // For freeform path
    studentAnswer?: string,
    correctAnswer?: string
  }
) => {
  const startTime = Date.now();
  let explanation = null;
  let source = null;

  try {
    // ==========================================
    // LAYER 1: LEXICAL SEARCH (Fast Path)
    // ==========================================
    if (queryContext.exerciseId) {
      const conceptId = parseExerciseIdToConcept(queryContext.exerciseId);
      const level = extractLevelFromExerciseId(queryContext.exerciseId);

      explanation = await getLexicalExplanation(conceptId, level);

      if (explanation) {
        source = 'lexical';
        console.log(`✓ Lexical match found in ${Date.now() - startTime}ms`);
        return { explanation, source };
      }
    }

    // ==========================================
    // LAYER 2: SEMANTIC SEARCH (Medium Path)
    // ==========================================
    let query = queryContext.questionText || queryContext.exerciseId;
    if (!query) {
      throw new Error('No query context provided');
    }

    explanation = await semanticSearch(query, 3);

    if (explanation) {
      source = 'semantic';
      console.log(`✓ Semantic match found in ${Date.now() - startTime}ms`);
      
      // Log query for potential caching
      if (explanation.similarity_score > 0.85) {
        // High confidence, consider caching
        logQueryForCache(query, explanation.explanation_id);
      }

      return { explanation, source };
    }

    // ==========================================
    // LAYER 3: CHECK CACHE (Dynamic Q&A)
    // ==========================================
    const cachedAnswer = await getCachedStudentQuestion(query);
    if (cachedAnswer && cachedAnswer.hit_count > 3) {
      // Question asked 3+ times, return cached LLM answer
      source = 'cache';
      console.log(`✓ Cache hit in ${Date.now() - startTime}ms`);
      
      return { 
        explanation: {
          id: cachedAnswer.id,
          main_explanation: cachedAnswer.llm_generated_answer,
          variant_1_gasing: null,
          variant_2_pmri: null,
          variant_3_mental_math: null
        },
        source
      };
    }

    // ==========================================
    // LAYER 4: LLM FALLBACK (Slow Path)
    // ==========================================
    console.log(`→ No lexical/semantic/cache match. Calling LLM...`);

    const llmPrompt = buildLLMPrompt(queryContext, studentId);
    const llmResponse = await callOpenRouterLLM(llmPrompt);

    if (!llmResponse) {
      throw new Error('LLM failed to generate response');
    }

    // Cache the LLM response for future use
    const cachedId = await storeLLMResponseAsQuestion(
      query,
      llmResponse,
      studentId,
      queryContext
    );

    source = 'llm';
    console.log(`✓ LLM response generated in ${Date.now() - startTime}ms`);

    return {
      explanation: {
        id: cachedId,
        main_explanation: llmResponse,
        variant_1_gasing: null,
        variant_2_pmri: null,
        variant_3_mental_math: null
      },
      source
    };

  } catch (error) {
    console.error('Bot explain error:', error);
    
    // Emergency fallback: Return generic explanation
    return {
      explanation: {
        main_explanation: 'Sorry, I couldn\'t generate an explanation. Please try again or ask your teacher for help.'
      },
      source: 'error'
    };
  }
};
```

## Request-Response Format

### Request

```typescript
POST /api/bot/explain
Content-Type: application/json

{
  "student_id": "rafi_001",
  "query_context": {
    // Option 1: Wrong answer path
    "exercise_id": "l5_add_7_4",
    "student_answer": "10",
    "correct_answer": "11",
    
    // Option 2: Freeform question path
    "question_text": "Bagaimana cara hitung 7+4 dengan jari?"
  }
}
```

### Response

```typescript
{
  "success": true,
  "source": "lexical|semantic|cache|llm|error",
  "response_time_ms": 45,
  "explanation": {
    "id": "uuid",
    "main_explanation": "...",
    "variant_1_gasing": "...",
    "variant_2_pmri": "...",
    "variant_3_mental_math": "...",
    "quick_method": "...",
    "examples": [...]
  },
  "recommended_variant": "gasing",  // Based on student profile
  "voice_url": "s3://bucket/audio/uuid.mp3",
  "cache_hit": false,
  "confidence_score": 0.95  // Relevance confidence
}
```

---

# 7. LLM FALLBACK (OpenRouter Integration)

## When to Use LLM

```
Trigger LLM when:
├─ Lexical search returns nothing (no exact match)
├─ Semantic search confidence < 0.75
├─ Cache miss (question not seen before)
└─ Student asked completely unique question

DO NOT use LLM when:
├─ Lexical found exact match (waste of money)
├─ Semantic found good match (already good enough)
└─ Similar question cached (use cache instead)
```

## OpenRouter Setup

```typescript
// 1. Initialize OpenRouter client
import { OpenRouter } from 'openrouter';

const openrouter = new OpenRouter({
  api_key: process.env.OPENROUTER_API_KEY
});

// 2. Call LLM for fallback
const callOpenRouterLLM = async (prompt: string): Promise<string> => {
  try {
    const response = await openrouter.generateText({
      model: 'qwen/qwen-2.5-14b',
      // Alternative: 'qwen/qwen-2.5-7b' (faster, cheaper)
      // Alternative: 'mistral/mistral-7b' (good balance)
      
      messages: [
        {
          role: 'system',
          content: `You are a helpful math tutor for Indonesian students (Grade 3-12).
          Explain math concepts in simple Indonesian language.
          Use GASING method (Concrete → Pictorial → Abstract).
          Be encouraging and avoid jargon.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      
      temperature: 0.7,
      max_tokens: 300,
      top_p: 0.95,
      
      // Important: Route through OpenRouter aggregate
      route: 'fallback'  // Use fallback provider if main unavailable
    });

    return response.text;

  } catch (error) {
    console.error('OpenRouter error:', error);
    throw error;
  }
};

// 3. Build prompt
const buildLLMPrompt = (queryContext: any, studentId: string): string => {
  const studentProfile = getStudentProfile(studentId);

  let prompt = '';

  if (queryContext.exerciseId) {
    // Wrong answer path
    prompt = `
    Student answer untuk soal: ${queryContext.exerciseId}
    - Student's answer: ${queryContext.studentAnswer}
    - Correct answer: ${queryContext.correctAnswer}
    - Student grade: Grade ${studentProfile.grade}
    - Student learning style: ${studentProfile.preferred_style}
    
    Jelaskan kenapa jawaban tersebut salah dan tunjukkan cara yang benar.
    Gunakan ${studentProfile.preferred_style === 'visual' ? 'model visual' : 'contoh konkret'}.
    `;
  } else {
    // Freeform question path
    prompt = `
    Student question: "${queryContext.questionText}"
    - Student grade: Grade ${studentProfile.grade}
    - Learning style: ${studentProfile.preferred_style}
    - Recent topics: ${studentProfile.recent_topics.join(', ')}
    
    Jawab pertanyaan tersebut dengan jelas dan sesuai untuk tingkat ${studentProfile.grade}.
    `;
  }

  return prompt;
};
```

## Cost Tracking

```typescript
// Track LLM usage for billing
const trackLLMUsage = async (
  studentId: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  costRp: number
) => {
  await db.query(`
    INSERT INTO llm_usage_log 
    (student_id, model, input_tokens, output_tokens, cost_rp, created_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
  `, [studentId, model, inputTokens, outputTokens, costRp]);

  // Monthly budget check
  const monthlyUsage = await db.query(`
    SELECT SUM(cost_rp) as total_cost
    FROM llm_usage_log
    WHERE DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
  `);

  const monthlyBudget = 100000; // Rp 100K per month
  if (monthlyUsage.rows[0].total_cost > monthlyBudget) {
    console.warn('⚠️ Monthly LLM budget exceeded!');
  }
};
```

---

# 8. CACHING & PERFORMANCE OPTIMIZATION

## Multi-Level Caching

```
┌─────────────────────────────────────────────────────┐
│ CACHING STRATEGY                                    │
└─────────────────────────────────────────────────────┘

Level 1: PostgreSQL Query Cache (Automatic)
├─ Query result caching
├─ Managed by PostgreSQL internally
└─ Hit rate: 90%+ for repeated queries

Level 2: Redis Application Cache
├─ Cache frequent explanations
├─ Key: `explanation:{concept_id}:{level}`
├─ TTL: 24 hours
├─ Size: ~50MB (all common concepts)
└─ Hit rate: 70%+ for popular topics

Level 3: Browser Cache (Service Worker)
├─ Cache on user device
├─ Offline access support
└─ Hit rate: 60%+ for returning students

Level 4: Student Questions Cache (PostgreSQL)
├─ Cache LLM responses
├─ Reuse for similar questions
├─ Hit rate: 5-10% (grows over time)
└─ TTL: 30 days

Level 5: CDN Cache (S3 + CloudFront)
├─ Cache voice files (S3 URLs)
├─ Image assets
└─ Hit rate: 80%+

COMBINED HIT RATE: 95%+
(Only 5% of queries need real-time generation)
```

## Implementation

### Redis Cache Setup

```typescript
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST,
  port: 6379,
  db: 0,
  maxRetriesPerRequest: null,
  enableReadyCheck: false
});

// Cache explanation in Redis
const cacheExplanation = async (
  conceptId: string,
  level: number,
  explanation: any
) => {
  const key = `explanation:${conceptId}:${level}`;
  const ttl = 86400; // 24 hours
  
  await redis.setex(
    key,
    ttl,
    JSON.stringify(explanation)
  );
};

// Get from Redis cache
const getCachedExplanation = async (
  conceptId: string,
  level: number
): Promise<any | null> => {
  const key = `explanation:${conceptId}:${level}`;
  const cached = await redis.get(key);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  return null;
};

// Warm up cache on startup
const warmUpCache = async () => {
  const explanations = await db.query(`
    SELECT concept_id, level, * FROM explanations
    WHERE educator_reviewed = TRUE
    LIMIT 100  // Cache top 100 most important
  `);

  for (const exp of explanations.rows) {
    await cacheExplanation(exp.concept_id, exp.level, exp);
  }

  console.log(`✓ Warmed up cache with ${explanations.rows.length} explanations`);
};
```

### Query-Level Caching

```typescript
// Modify hybrid search to check cache first
const hybridBotExplainWithCache = async (queryContext: any) => {
  const startTime = Date.now();

  // Step 0: Check Redis cache
  if (queryContext.exerciseId) {
    const conceptId = parseExerciseIdToConcept(queryContext.exerciseId);
    const level = extractLevelFromExerciseId(queryContext.exerciseId);

    const cached = await getCachedExplanation(conceptId, level);
    if (cached) {
      return {
        explanation: cached,
        source: 'cache_redis',
        response_time_ms: Date.now() - startTime
      };
    }
  }

  // Step 1-4: Normal pipeline (lexical → semantic → cache → llm)
  const result = await hybridBotExplain(queryContext);

  // Cache the result for future use
  if (result.source === 'lexical' || result.source === 'semantic') {
    if (queryContext.exerciseId) {
      const conceptId = parseExerciseIdToConcept(queryContext.exerciseId);
      const level = extractLevelFromExerciseId(queryContext.exerciseId);
      await cacheExplanation(conceptId, level, result.explanation);
    }
  }

  return result;
};
```

---

# 9. QUERY DISTRIBUTION ANALYSIS

## Expected Distribution (Production)

```
1,000 paying users × 10 queries/month = 10,000 queries/month

Distribution by source:

LEXICAL SEARCH: 7,000 queries (70%)
├─ Cost: $0
├─ Response time: <10ms
├─ Examples:
│  ├─ Wrong answer on exercise_id "l5_add_7_4" → concept "addition_7_4"
│  ├─ Wrong answer on "l9_mul_7_8" → concept "multiplication_7_8"
│  └─ Wrong answer on "l13_frac_1_2" → concept "fractions_1_2"
└─ Probability of match: 99%+ (well-defined problems)

SEMANTIC SEARCH: 2,000 queries (20%)
├─ Cost: $0
├─ Response time: <100ms
├─ Examples:
│  ├─ "Bagaimana cara hitung penjumlahan?"
│  ├─ "Kenapa perkalian seperti itu?"
│  └─ "Gimana cara membagi?"
├─ Probability of match: 80-90% (similar to existing explanations)
└─ Hit rate: 80% of these (80% × 20% = 16% of total)

LLM FALLBACK: 1,000 queries (10%)
├─ Cost: 1,000 × Rp 5-10 = Rp 5-10K
├─ Response time: 3-5 seconds
├─ Examples:
│  ├─ "Kenapa tanda kurung pakai yang besar?"
│  ├─ "Apa bedanya 1/2 dan 2/1?"
│  └─ "Bagaimana cara hitung kalau pembilang lebih besar?"
├─ Probability of match: 100% (always generates something)
└─ Hit rate: 100% (but slow and expensive)

CACHE HIT (Student Questions): 0% initially, grows to 30% by month 12
├─ Cost: $0 (already generated, cached)
├─ Response time: <50ms
└─ Savings: 3,000 × Rp 5-10 = Rp 15-30K/month by year 1

TOTAL COST TRAJECTORY:
├─ Month 1: Rp 5-10K (all LLM queries are new)
├─ Month 3: Rp 3-6K (10% cache hit rate)
├─ Month 6: Rp 2-4K (20% cache hit rate)
├─ Month 12: Rp 1-2K (30% cache hit rate, plus fewer new questions)
└─ Year 2: Rp 1K/month (system is self-sustaining via cache)
```

## Scaling to 100,000 Users

```
100,000 paying users × 10 queries/month = 1,000,000 queries/month

Cost breakdown:

Lexical: 700,000 queries → Cost: $0
Semantic: 200,000 queries → Cost: $0
LLM (10% new questions): 100,000 queries → Cost: Rp 500K-1M
Cache hit (growing): Reduces LLM by 30% → Savings: Rp 150-300K

Total monthly cost for bot: Rp 350-700K (~$20-40)

Comparison:
├─ Pure LLM approach: 1,000,000 × Rp 5-10 = Rp 5-10B/month (500x more!)
├─ Pure Semantic: 1,000,000 × Rp 0.5 (vector cost) = Rp 500K/month
├─ Hybrid (recommended): Rp 350-700K/month
└─ Savings: 90-95% cost reduction vs pure LLM
```

---

# 10. IMPLEMENTATION CHECKLIST

## Phase 1: Core RAG Setup (Weeks 1-4)

```
Week 1: Database & Chroma
  [ ] Create explanations table with v1.2 schema
  [ ] Create bot_queries analytics table
  [ ] Create indexes for lexical search
  [ ] Setup Chroma locally (Docker or embedded)
  [ ] Verify PostgreSQL + Chroma connectivity

Week 2: Lexical Search
  [ ] Implement getExplanationByConceptLevel()
  [ ] Implement getExplanationByExerciseId()
  [ ] Test with 50 sample exercises
  [ ] Benchmark: <10ms latency
  [ ] Add unit tests

Week 3: Semantic Search
  [ ] Setup embeddings model (Xenova/MiniLM)
  [ ] Index first batch of explanations to Chroma
  [ ] Implement semanticSearch() function
  [ ] Test with paraphrased queries
  [ ] Benchmark: <100ms latency
  [ ] Add unit tests

Week 4: Hybrid Pipeline
  [ ] Implement hybridBotExplain() (layers 1-3)
  [ ] Add fallback to LLM stub (return placeholder)
  [ ] Test end-to-end workflow
  [ ] Add response logging
  [ ] Add integration tests
```

## Phase 2: LLM Integration (Weeks 5-6)

```
Week 5: OpenRouter Setup
  [ ] Get OpenRouter API key
  [ ] Implement OpenRouter client
  [ ] Build LLM prompt templates
  [ ] Test single query
  [ ] Add error handling

Week 6: Dynamic Caching
  [ ] Create student_questions table
  [ ] Implement storeLLMResponseAsQuestion()
  [ ] Implement getCachedStudentQuestion()
  [ ] Test cache hit/miss scenarios
  [ ] Add cost tracking
```

## Phase 3: Optimization (Weeks 7-8)

```
Week 7: Redis Cache
  [ ] Setup Redis
  [ ] Implement warmUpCache()
  [ ] Add cache invalidation strategy
  [ ] Benchmark with cache hits
  [ ] Monitor cache effectiveness

Week 8: Performance Tuning
  [ ] Profile query latencies
  [ ] Optimize indexes if needed
  [ ] Add query result caching
  [ ] Benchmark P50, P95, P99 latencies
  [ ] Load test: 1000 concurrent queries
```

## Phase 4: Production Deployment (Weeks 9-10)

```
Week 9: Monitoring & Analytics
  [ ] Setup Sentry for error tracking
  [ ] Add Prometheus metrics
  [ ] Dashboard: Query latencies by source
  [ ] Dashboard: LLM cost tracking
  [ ] Dashboard: Cache hit rates

Week 10: Beta Launch
  [ ] Deploy to staging
  [ ] Run 24-hour test with 10 beta users
  [ ] Monitor for errors/latency
  [ ] Gather user feedback on explanations
  [ ] Deploy to production
```

---

# 11. TESTING & VALIDATION

## Unit Tests

```typescript
// Test lexical search
describe('Lexical Search', () => {
  it('should find explanation by concept+level', async () => {
    const result = await getLexicalExplanation('addition_7_4', 5);
    expect(result).toBeDefined();
    expect(result.source).toBe('lexical');
    expect(result.response_time_ms).toBeLessThan(10);
  });

  it('should return null if no match', async () => {
    const result = await getLexicalExplanation('unknown_concept', 99);
    expect(result).toBeNull();
  });
});

// Test semantic search
describe('Semantic Search', () => {
  it('should find similar explanation', async () => {
    const result = await semanticSearch('Bagaimana cara hitung penjumlahan?');
    expect(result).toBeDefined();
    expect(result.source).toBe('semantic');
    expect(result.similarity_score).toBeGreaterThan(0.75);
  });

  it('should return null if similarity < threshold', async () => {
    const result = await semanticSearch('xyz abc 123 random words');
    expect(result).toBeNull();
  });
});

// Test hybrid pipeline
describe('Hybrid Bot Explain', () => {
  it('should use lexical for wrong answer path', async () => {
    const result = await hybridBotExplain('student1', {
      exerciseId: 'l5_add_7_4',
      studentAnswer: '10',
      correctAnswer: '11'
    });
    expect(result.source).toBe('lexical');
  });

  it('should fallback to semantic if lexical fails', async () => {
    // Mock lexical failure
    const result = await hybridBotExplain('student1', {
      questionText: 'Paraphrased version of addition concept'
    });
    expect(result.source).toMatch(/semantic|llm|cache/);
  });
});
```

## Integration Tests

```typescript
describe('End-to-End Bot Explain', () => {
  it('should explain wrong answer in <100ms (lexical)', async () => {
    const start = Date.now();
    const result = await hybridBotExplain('student1', {
      exerciseId: 'l5_add_7_4',
      studentAnswer: '10',
      correctAnswer: '11'
    });
    const elapsed = Date.now() - start;

    expect(result.explanation).toBeDefined();
    expect(result.explanation.variant_1_gasing).toBeDefined();
    expect(elapsed).toBeLessThan(100);
  });

  it('should handle freeform questions', async () => {
    const result = await hybridBotExplain('student1', {
      questionText: 'Mengapa 7+4 itu 11?'
    });

    expect(result.explanation).toBeDefined();
    expect(result.explanation.main_explanation).toBeDefined();
    expect(['lexical', 'semantic', 'cache', 'llm']).toContain(result.source);
  });

  it('should log query for analytics', async () => {
    await hybridBotExplain('student1', {
      exerciseId: 'l5_add_7_4',
      studentAnswer: '10',
      correctAnswer: '11'
    });

    const logged = await db.query(
      'SELECT * FROM bot_queries ORDER BY created_at DESC LIMIT 1'
    );

    expect(logged.rows[0]).toBeDefined();
    expect(logged.rows[0].student_id).toBe('student1');
  });
});
```

## Load Testing

```bash
# Load test: 1000 concurrent queries
npm run test:load --concurrent 1000 --duration 60s

Expected results:
├─ Throughput: 100-500 QPS (depending on query distribution)
├─ P50 latency: <50ms
├─ P95 latency: <200ms
├─ P99 latency: <1000ms
└─ Error rate: <0.1%
```

---

# 12. MONITORING & ANALYTICS

## Key Metrics

```
Real-time Dashboard:

Query Metrics:
├─ Queries/second (by source)
├─ Average response time (by source)
├─ Cache hit rate (% redis/db/cache)
├─ Error rate
└─ LLM cost/hour

Source Distribution:
├─ Lexical: X% (target: 70%)
├─ Semantic: Y% (target: 20%)
├─ LLM: Z% (target: 10%)
└─ Cache: W% (target: growing over time)

Quality Metrics:
├─ Student understanding rate (by explanation)
├─ Explanation rating (1-5 scale)
├─ Repeat questions (cache effectiveness)
└─ Time to answer by student type

Cost Metrics:
├─ LLM cost/month
├─ Cost per query
├─ Monthly budget tracking
└─ Savings from caching
```

## Alerting

```
Alert Conditions:

CRITICAL:
├─ Error rate > 5%
├─ LLM API unavailable for >5 min
├─ Database connection pool exhausted
└─ Monthly LLM budget exceeded

WARNING:
├─ P95 latency > 1000ms
├─ Cache hit rate < 50% (should be >70%)
├─ Lexical hit rate < 60% (should be >70%)
└─ LLM cost > 80% of monthly budget

INFO:
├─ Semantic hit rate increasing (good cache building)
├─ New cached questions accumulating
└─ Cache invalidation running successfully
```

---

# SUMMARY

## What This RAG System Provides

```
Fast Path (95% of queries):
├─ Lexical: <10ms, $0 cost
├─ Semantic: <100ms, $0 cost
├─ Cache: <50ms, $0 cost
└─ User experience: Instant!

Fallback Path (5% of queries):
├─ LLM: 3-5s, Rp 5-10 cost
├─ Cached immediately for future use
└─ System learns and improves

Scaling:
├─ Handles 100K+ concurrent users
├─ Cost: <Rp 1K per query
├─ 90%+ cache hit rate long-term
└─ Essentially free at scale
```

## Next Steps

See `DEV_PLAN_WITH_RAG_REFERENCE.md` for how to integrate this RAG system into the overall development plan.

---

**This RAG specification is production-ready. Implement with confidence!**

