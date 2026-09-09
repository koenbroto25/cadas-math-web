# 📋 DEVELOPMENT PLAN WITH RAG SYSTEM REFERENCE v1.0
## Complete Implementation Roadmap (28-36 weeks)

**Date:** September 2, 2026  
**Version:** 1.0 (Complete)  
**Status:** Ready for Execution  
**Scope:** Material Generator + Student App + RAG System + Parent Dashboard

---

# TABLE OF CONTENTS

1. Overall Timeline
2. Phase Breakdown (0-12)
3. Parallel Workstreams
4. RAG System Integration Points
5. Detailed Phase Plans
6. Dependencies & Critical Path
7. Risk Management
8. Quality Gates
9. Team Structure & Roles
10. Tracking & Reporting

---

# 1. OVERALL TIMELINE

## 28-36 Week Implementation (7-9 months)

```
Week 1:     PHASE 0 (Setup)
Weeks 2-3:  PHASE 1 (Backend Framework)
Weeks 2-4:  PHASE 1.5 (Bot Framework) [PARALLEL]
Weeks 4-6:  PHASE 2 (Problem Generation)
Weeks 7-9:  PHASE 3 (HTML Templates)
Week 10:    PHASE 3.5 (HTML Backtest) [QUALITY GATE]
Weeks 11-12: PHASE 4 (File Storage)
Weeks 13-30: PHASES 5-9 (Level Generation) [MAIN CONTENT]
Weeks 31-32: PHASE 10 (RAG Indexing)
Weeks 33-35: PHASE 11 (QA & Optimization)
Weeks 36+:  PHASE 12 (Deployment & Launch)

CRITICAL MILESTONES:
├─ Week 1: Environment ready
├─ Week 3: Core backend operational
├─ Week 6: Problem generation working
├─ Week 10: QA gates passed (HTML backtest)
├─ Week 30: All levels generated
├─ Week 32: RAG system operational
├─ Week 36: Ready for beta launch
└─ Week 40: Production deployment
```

---

# 2. PHASE BREAKDOWN (0-12)

## PHASE 0: Environment Setup (Week 1)

### Duration: 1 week
### Team: DevOps Lead + Backend Lead
### Deliverables:
- PostgreSQL with v1.2 schema
- Ollama + Qwen model
- Redis instance
- Chroma Vector DB setup ⭐ RAG RELATED
- .env configuration
- Git repository

### Tasks Checklist:
```
Database Setup:
  [ ] PostgreSQL 14+ installed
  [ ] Run schema.sql (v1.2 with all 9 tables)
  [ ] Create indexes for lexical search ⭐ RAG RELATED
  [ ] Create vector_index_metadata table ⭐ RAG RELATED
  [ ] Test connection & verify all tables exist
  [ ] Create backups configured

LLM Setup (Ollama):
  [ ] Download Ollama
  [ ] Pull Qwen 2.5 14B model
  [ ] Verify model loaded: curl http://localhost:11434/api/tags
  [ ] Test generation: Simple prompt → Verify output
  [ ] Memory check: Confirm 28GB+ available

Cache & Vector DB:
  [ ] Redis installed & running
  [ ] Chroma initialized (embedded or standalone) ⭐ RAG RELATED
  [ ] Chroma data directory created
  [ ] Test Chroma connection ⭐ RAG RELATED

Configuration:
  [ ] .env file created with all variables
  [ ] .env.example created for documentation
  [ ] Secrets properly secured (not in git)
  [ ] Database credentials tested

Version Control:
  [ ] GitHub repository created
  [ ] .gitignore configured
  [ ] Initial commit with setup files
  [ ] Branch strategy defined (main, dev, feature branches)

Verification:
  [ ] PostgreSQL health: SELECT NOW()
  [ ] Ollama health: Model list returns Qwen
  [ ] Redis health: PING returns PONG
  [ ] Chroma health: Collection creation test ⭐ RAG RELATED
  [ ] All connections working
```

### RAG System Impact:
```
PREPARE FOR RAG:
├─ ✓ Vector DB (Chroma) initialized
├─ ✓ vector_index_metadata table created
├─ ✓ Embeddings model ready (will be loaded in Phase 2)
└─ ✓ All infrastructure ready for semantic search

Next step: Phase 1.5 (Bot framework) will setup Chroma collections
```

---

## PHASE 1: Core Backend Framework (Weeks 2-3)

### Duration: 2 weeks
### Team: Backend Lead + 2 Backend Engineers
### Deliverables:
- Express.js server
- Database connection pool
- API endpoints (stubbed)
- Ollama integration
- Admin dashboard (basic)
- Logging & error handling

### Tasks Checklist:
```
Express Server:
  [ ] Initialize Node.js project
  [ ] Install dependencies (express, pg, redis, etc)
  [ ] Create basic server (listen on port 3000)
  [ ] Setup middleware (CORS, body-parser, auth)
  [ ] Verify: npm start → Server runs

Database Layer:
  [ ] Create db/connection.js (PostgreSQL pool)
  [ ] Create db/helpers.js (CRUD operations)
  [ ] Implement query wrappers (error handling, logging)
  [ ] Test: Simple SELECT query succeeds
  [ ] Connection pooling: Min 5, Max 20 connections

API Endpoints (Stubbed):
  [ ] GET /api/health → {status: OK}
  [ ] POST /api/auth/register → Stub
  [ ] POST /api/auth/login → Stub
  [ ] GET /api/exercises/:level → Stub
  [ ] POST /api/exercises/:id/submit → Stub
  [ ] POST /api/bot/explain → Stub ⭐ RAG RELATED
  [ ] GET /api/leaderboard → Stub
  [ ] GET /api/parent/dashboard/:child_id → Stub

Ollama Integration:
  [ ] Create llm/ollama-client.js
  [ ] Implement generate(prompt) method
  [ ] Add error handling & retries
  [ ] Test: Simple prompt → Get response
  [ ] Benchmark: Response time measurement

Admin Dashboard:
  [ ] Create routes/admin.ts
  [ ] Basic UI: Job monitoring
  [ ] Display: Generation progress
  [ ] Trigger buttons: Manual start/stop
  [ ] Logging: View system logs

Logging & Monitoring:
  [ ] Setup Winston logger
  [ ] Console + file logging
  [ ] Error tracking setup (Sentry stub)
  [ ] Request logging middleware
  [ ] Health check endpoint

Testing:
  [ ] Unit tests for db helpers
  [ ] Integration tests for API endpoints
  [ ] Manual testing: All endpoints respond
```

### RAG System Impact:
```
FRAMEWORK FOR RAG:
├─ ✓ API endpoint /api/bot/explain ready (stubbed)
├─ ✓ Database layer supports complex queries (needed for lexical search)
├─ ✓ Error handling for timeouts (RAG queries can be slow)
└─ ✓ Logging infrastructure (track RAG performance)

Next step: Phase 1.5 (Bot framework) implements RAG logic
```

---

## PHASE 1.5: Bot Framework & RAG Preparation (Weeks 2-4, Parallel)

### Duration: 2 weeks
### Team: Bot Engineer + QA Lead + Content Lead
### Deliverables:
- Bot explanation backtest framework
- Scenario simulator (for variant switching)
- Sample explanations tested
- Bot guidelines documented
- **RAG Pipeline Prepared** ⭐ CRITICAL

### Tasks Checklist:
```
Bot Explanation Backtest:
  [ ] Create backtest/bot-explanation-backtest.js
  [ ] Implement validateExplanationVariants() ⭐ RAG RELATED
  [ ] Implement validateQuickMethod() ⭐ RAG RELATED
  [ ] Implement 6 pedagogy checks (clarity, structure, examples)
  [ ] Test with sample explanations

Bot Scenario Simulator:
  [ ] Scenario 1: Student gets wrong answer
  [ ] Scenario 2: Student stuck after 3 attempts
  [ ] Scenario 3: Bot switches explanation variant ⭐ RAG RELATED
  [ ] Scenario 4: Student requests different style ⭐ RAG RELATED
  [ ] Scenario 5: Bot learns effectiveness ⭐ RAG RELATED
  [ ] All scenarios return PASS/FAIL result

RAG System Preparation: ⭐ **CRITICAL FOR RAG**
  [ ] Create RAG schema (vector_index_metadata table)
  [ ] Design lexical search queries
  [ ] Design semantic search queries
  [ ] Plan LLM fallback logic
  [ ] Create /api/bot/explain endpoint structure

Sample Explanations Testing:
  [ ] Level 1: Addition +1 (3 variants)
  [ ] Level 5: Addition all (3 variants)
  [ ] Level 9: Multiplication tables (3 variants)
  [ ] Level 10: Long multiplication (3 variants)
  [ ] All pass backtest 100%

Guidelines Documentation:
  [ ] Bot explanation guidelines
  [ ] GASING pedagogy guide (concrete→pictorial→abstract)
  [ ] PMRI model-based teaching guide
  [ ] Quick method documentation
  [ ] Grade-appropriate language guide

RAG-Specific Documentation: ⭐ RAG SYSTEM SPEC
  [ ] Reference: RAG_SYSTEM_TECHNICAL_SPEC.md created
  [ ] Hybrid search strategy documented
  [ ] Lexical search implementation planned
  [ ] Semantic search implementation planned
  [ ] LLM fallback strategy documented
  [ ] Caching strategy documented
  
Testing:
  [ ] Unit tests for backtest functions
  [ ] Scenario tests (all 5 scenarios)
  [ ] Integration: Backtest + LLM stub
```

### RAG System Impact:
```
FOUNDATION FOR RAG:
├─ ✓ Hybrid search strategy defined (lexical + semantic + LLM)
├─ ✓ Variant effectiveness tracking prepared
├─ ✓ Cache strategy designed
├─ ✓ /api/bot/explain endpoint ready for implementation
├─ ✓ Backtest framework knows what to test
└─ ✓ Team aligned on RAG approach

DELIVERABLE: RAG_SYSTEM_TECHNICAL_SPEC.md (reference for Phases 2+)

Next step: Phase 2 implements lexical search; Phase 1.5 parallels it
```

---

## PHASE 2: Problem Generation (Weeks 4-6)

### Duration: 3 weeks
### Team: LLM Engineer + Backend Engineer + QA
### Deliverables:
- LLM prompts for all 15 levels (v1.2.1 with GASING & PMRI)
- Problem generation working
- Quick trick validation (100% pass rate target)
- Batch queue operational
- Test: 50 problems per level generated

### Tasks Checklist:
```
LLM Prompt Engineering:
  [ ] Create prompts/level_1.txt (Addition +1)
  [ ] Create prompts/level_5.txt (Addition all - speed lock)
  [ ] Create prompts/level_9.txt (Multiplication - championship)
  [ ] Create prompts/level_10.txt (2-digit × 1-digit)
  [ ] Create prompts/level_13.txt (Fractions)
  [ ] All 15 levels have prompts
  [ ] All prompts include v1.2 requirements (quick_trick mandatory)

Problem Generation:
  [ ] Implement problemGenerator.generate(level, quantity)
  [ ] Call Ollama for each level
  [ ] Parse JSON response
  [ ] Extract: num1, num2, operation, answer, hint, quick_trick
  [ ] Generate 50 test problems per level

Problem Validation:
  [ ] Implement validator.validateProblem()
  [ ] Check: quick_trick present (mandatory)
  [ ] Check: quick_trick.length >= 20 characters ⭐ RAG RELATED
  [ ] Check: quick_trick !== hint ⭐ RAG RELATED
  [ ] Check: correct_answer == calculation
  [ ] Check: JSON valid
  [ ] Test pass rate: Target ≥90%

Batch Queue Setup:
  [ ] Setup Bull queue (Redis-backed)
  [ ] Create job structure: {level, concept, quantity}
  [ ] Implement processJob() function
  [ ] Add retry logic (if generation fails)
  [ ] Monitor queue status

Testing:
  [ ] Unit tests: Problem generation per level
  [ ] Validation tests: All constraints checked
  [ ] Integration: LLM → Validator → Database
  [ ] Pass rate tracking per level
  [ ] If <90%: Debug & improve prompts

Database Storage:
  [ ] Insert validated problems into exercises table
  [ ] Verify: quick_trick field populated for ALL
  [ ] Verify: 50 problems per level in database
```

### RAG System Impact:
```
PREPARE CONTENT FOR RAG:
├─ ✓ Problems stored with quick_trick (for display)
├─ ✓ Problem-to-concept mapping established (for lexical search)
├─ ✓ Database indexed for fast lookups ⭐ RAG USES THIS
└─ ✓ Content quality verified (100% pass on quick_trick constraint)

Phase 1.5 created validation rules; Phase 2 implements them!

Next step: Phase 3 creates HTML; Phase 2 feeds content to database
```

---

## PHASE 3: HTML Templates & Rendering (Weeks 7-9)

### Duration: 3 weeks
### Team: Frontend Engineer + 1 Backend Engineer
### Deliverables:
- 8 HTML template types
- SVG generator
- Template rendering engine
- 50 sample HTMLs rendered

### Tasks Checklist:
```
Template Creation (8 types):
  [ ] Template 1: Colored Blocks (Level 1-2)
  [ ] Template 2: Number Line (Level 3-5)
  [ ] Template 3: Dot Representation (Level 1-3)
  [ ] Template 4: Array/Grid (Level 9-11)
  [ ] Template 5: Area Model (Level 10-12)
  [ ] Template 6: Fraction Bar (Level 13)
  [ ] Template 7: Decimal Representation (Level 14)
  [ ] Template 8: Word Problem (Level 15)

Each template includes:
  [ ] Problem text display
  [ ] Visualization area (SVG placeholder)
  [ ] Quick trick display ⭐ SHOWS TO USER
  [ ] Answer input field
  [ ] Submit button
  [ ] Accessibility features (WCAG AA)
  [ ] Responsive design

SVG Generator:
  [ ] Implement generateColoredBlocks()
  [ ] Implement generateNumberLine()
  [ ] Implement generateArray()
  [ ] Implement generateAreaModel()
  [ ] Implement generateFractionBar()
  [ ] All SVGs render correctly in browser
  [ ] Performance: <50ms per SVG

Template Rendering:
  [ ] Create rendering/template-renderer.js
  [ ] Load all 8 templates
  [ ] Replace {{placeholders}} with problem data
  [ ] Output: Valid HTML files
  [ ] Performance: 50+ HTML files per second

Sample Generation:
  [ ] Generate 50 sample HTMLs (from Level 1 problems)
  [ ] Save to output/ directory
  [ ] Test in browser: All render correctly
  [ ] Verify: Quick trick displayed
  [ ] Verify: SVG visible and interactive

Testing:
  [ ] Unit tests: Template rendering
  [ ] Visual tests: HTML appearance
  [ ] Accessibility audit: WCAG AA
  [ ] Performance benchmark: Render time
```

### RAG System Impact:
```
CONTENT DISPLAY & RAG INTEGRATION:
├─ ✓ Quick trick displayed in HTML (student sees it)
├─ ✓ problem_id linked to explanations ⭐ LEXICAL SEARCH KEY
├─ ✓ Exercise HTML ready for S3 upload (Phase 4)
└─ ✓ Problem structure supports RAG lookups (concept_id available)

Phase 3 creates the UI; RAG system looks up explanations for it!

Next step: Phase 3.5 validates HTML quality (including quick_trick display)
```

---

## PHASE 3.5: HTML Backtest ⭐ CRITICAL QUALITY GATE (Week 10)

### Duration: 1 week
### Team: QA Lead + Frontend Engineer
### Deliverables:
- HTML backtest framework (8 tests + Test 8)
- Spot check results (≥95% pass, Test 8 @ 100%)
- Manual review approved
- **QUALITY GATE DECISION**

### Tasks Checklist:
```
Backtest Implementation:
  [ ] Test 1: HTML Structure (valid HTML5)
  [ ] Test 2: SVG Rendering (displays correctly)
  [ ] Test 3: Interactivity (input works, submit responds)
  [ ] Test 4: Performance (<200ms render, <50KB file)
  [ ] Test 5: Accessibility (WCAG AA compliant)
  [ ] Test 6: Responsiveness (mobile, tablet, desktop)
  [ ] Test 7: Content Accuracy (math verified, hint relevant)
  [ ] Test 8: Quick Trick Validation ⭐ RAG RELATED
    ├─ Presence: quick_trick not NULL
    ├─ Length: quick_trick >= 20 characters
    ├─ Uniqueness: quick_trick !== hint
    ├─ Quality: quick_trick is genuine (not trivial)
    └─ Pass rate: MUST be 100%

Spot Check Execution:
  [ ] Generate 50 random Level 1 problems
  [ ] Run backtest on all 50
  [ ] Test 8 results: 50/50 PASS (100%) ⭐ MANDATORY
  [ ] Overall pass rate: ≥95% (47/50 minimum)
  [ ] If <95%: Fix issues, regenerate, retest

Manual Review:
  [ ] QA opens 5 random HTMLs in browser
  [ ] Visual inspection: Renders correctly
  [ ] Functionality check: Input + submit works
  [ ] Content check: Quick trick helpful
  [ ] Mobile check: Responsive works
  [ ] All 5 pass: APPROVED

Quality Gate Decision:
  ✅ PASS if:
    ├─ Test 8 (quick_trick): 100% pass
    ├─ Overall backtest: ≥95% pass
    ├─ Manual review: All 5 approved
    └─ No critical bugs found

  ❌ FAIL if:
    ├─ Test 8 < 100% pass (requires regeneration)
    ├─ Overall backtest < 95% pass (requires fixing)
    ├─ Manual review: Any fails (requires investigation)
    └─ Critical bugs present (blocks Phase 4)

  [ ] Signed off: QA Lead + Frontend Lead
  [ ] Decision: ✅ PASS → Proceed to Phase 4
              ❌ FAIL → Return to Phase 3, fix, retest
```

### RAG System Impact:
```
QUALITY GATE FOR RAG:
├─ ✓ Quick trick validated (100% pass required)
├─ ✓ Ensures quality content for RAG lookups
├─ ✓ Quick trick display verified (shows in HTML)
└─ ✓ Only high-quality content indexed to Chroma ⭐ RAG USES THIS

Test 8 ensures RAG system will have clean, validated quick_tricks!

If FAIL: Don't proceed to Phase 4! Fix quality first.

Next step (if PASS): Phase 4 - Upload to S3
```

---

## PHASE 4: File Storage & S3 (Weeks 11-12)

### Duration: 2 weeks
### Team: Backend Engineer + DevOps
### Deliverables:
- S3 bucket configured
- Batch HTML uploader
- PostgreSQL indexed
- Content ready for CDN

### Tasks:
```
See GRAND_DESIGN_SPEED_MATH_MASTERS.md Phase 4 section
+RAG Integration:
  [ ] S3 URLs stored in database
  [ ] Metadata includes quick_trick (for RAG)
  [ ] Ready for Chroma indexing (Phase 10)
```

---

## PHASES 5-9: Level Generation with Backtests (Weeks 13-30)

### Duration: 18 weeks (6 levels, 3 weeks each)
### Team: LLM Engineer + Content Lead + QA Lead
### Deliverables:
- All 15 levels generated
- All explanations created (3 variants each)
- All backtests passed
- All educator reviews approved
- All uploaded to S3 + indexed in PostgreSQL

### 12-Step Level Generation Workflow (for EACH level):

```
For each of Levels 1-15:

Step 1: Generate 50 exercises
  ├─ LLM prompt → Ollama
  ├─ Validate (quick_trick ≥20 chars, ≠hint)
  └─ Pass rate target: ≥90%

Step 2: HTML backtest (50 problems)
  ├─ Test 1-7: ≥95% pass
  ├─ Test 8 (quick_trick): 100% pass ⭐ CRITICAL
  └─ If fail: Regenerate problems, retry

Step 3: Manual spot check
  ├─ Open 5 random HTMLs in browser
  ├─ Visual inspection: Looks good?
  ├─ All pass: Proceed
  └─ If any fail: Investigate & fix

Step 4: Generate full level (300-450 problems)
  ├─ Run LLM generation for all
  ├─ Validate all
  └─ Pass rate target: ≥90%

Step 5: Spot check full level
  ├─ Random 10 problems
  ├─ Verify quality consistent
  └─ Pass: Proceed to explanations

Step 6: Generate explanations (3 variants each)
  ├─ Variant 1: GASING (concrete, Indonesian context)
  ├─ Variant 2: PMRI (visual, model-based)
  ├─ Variant 3: Mental Math (logic, why it works)
  └─ All 3 required per concept

Step 7: Bot explanation backtest
  ├─ Validate 3 variants exist
  ├─ Check pedagogy (6 criteria)
  ├─ Verify clarity & examples
  └─ Pass rate: 100% required

Step 8: Manual educator review ⭐ IMPORTANT
  ├─ Educator reads GASING variant (authenticity?)
  ├─ Educator reads PMRI variant (model correct?)
  ├─ Educator reads Mental Math (logic sound?)
  ├─ Educators verify: Age-appropriate?
  ├─ Special for Levels 9-15: MANDATORY detailed review
  └─ APPROVED required before proceeding

Step 9: Create upgrade tests
  ├─ Type A: Accuracy only (Level 1-2)
  ├─ Type B: Accuracy + gentle speed (Level 3-8)
  ├─ Type C: Speed primary (Level 9-15)
  └─ 30 problems per test

Step 10: Upload to S3
  ├─ All HTML files
  ├─ Verify integrity
  └─ Test CDN delivery

Step 11: Database indexing
  ├─ Index exercises in PostgreSQL ⭐ FOR LEXICAL SEARCH
  ├─ Create vector embeddings (Chroma) ⭐ FOR SEMANTIC SEARCH
  ├─ Index explanations (GASING/PMRI/Mental)
  ├─ All content searchable
  └─ Verify: Can retrieve via RAG

Step 12: Final sign-off
  ├─ Developer: ✓ Code working
  ├─ QA: ✓ All tests pass
  ├─ Educator: ✓ Content approved
  ├─ Bot Lead: ✓ RAG indexing complete
  └─ Level marked: READY FOR PRODUCTION
```

### Schedule:
```
Level 1-2 (Weeks 13-16): 4 weeks
  ├─ Addition facts (+1, +2, +all)
  ├─ High priority (foundational)
  └─ Quality bar: Highest

Level 3-5 (Weeks 17-19): 3 weeks
  ├─ Mixed addition (speed lock)
  ├─ Speed emphasis
  └─ Parallel: Start Level 6-8 prep

Level 6-8 (Weeks 20-22): 3 weeks
  ├─ Subtraction facts
  ├─ Similar to Levels 1-2 quality bar
  └─ Parallel: Start Level 9 prep

Level 9 (Weeks 23-25): 3 weeks
  ├─ Multiplication tables (CHAMPIONSHIP LEVEL)
  ├─ Special attention: Educator review detailed
  ├─ Quality bar: Very high
  └─ Weak-fact system implemented

Level 10-15 (Weeks 26-30): 5 weeks
  ├─ Long multiplication, division, fractions, decimals, mixed
  ├─ 3 explanation_variants MANDATORY (not 2!)
  ├─ Educator review MANDATORY for all
  ├─ Quality bar: Highest (complex concepts)
  └─ Parallel: Prep for Phase 10 (RAG indexing)

RAG System Integration Points:
  Step 11 (Database indexing):
    ├─ ✓ Index exercises in PostgreSQL (for lexical search)
    ├─ ✓ Create embeddings for explanations (for semantic search)
    ├─ ✓ Store in Chroma vector DB
    ├─ ✓ Verify: RAG can find explanations
    └─ ✓ Reference: RAG_SYSTEM_TECHNICAL_SPEC.md sections 3-4
```

### Critical RAG-Related Tasks:
```
Each level must complete:

Database Indexing (Step 11):
  [ ] Exercises indexed by (concept_id, level)
  [ ] Quick trick field fully populated
  [ ] All explanations have vector embeddings
  [ ] Chroma collection updated with new vectors
  [ ] Test lexical search: Retrieve by concept ⭐ RAG REQUIREMENT
  [ ] Test semantic search: Retrieve by similarity ⭐ RAG REQUIREMENT
  [ ] Performance: Queries <100ms ⭐ RAG PERFORMANCE

Verification:
  [ ] RAG_SYSTEM_TECHNICAL_SPEC.md Phase "Database Schema" implemented
  [ ] Lexical search implemented (see Section 4 of RAG spec)
  [ ] Semantic search implemented (see Section 5 of RAG spec)
  [ ] Hybrid query pipeline ready (see Section 6 of RAG spec)
```

---

## PHASE 10: RAG Indexing & Semantic Search Setup (Weeks 31-32)

### Duration: 2 weeks
### Team: Backend Engineer + Data Engineer + Bot Engineer
### Deliverables:
- Vector embeddings for all explanations
- Chroma vector DB fully indexed
- RAG search verified working
- Hybrid pipeline (lexical + semantic + LLM) ready

### Tasks Checklist:
```
Vector Embedding Generation: ⭐ CRITICAL FOR RAG
  [ ] Load embeddings model: Xenova/all-MiniLM-L6-v2
  [ ] For each explanation (1000+ total):
    ├─ Combine: main_explanation + variant_1 + variant_2 + variant_3
    ├─ Generate embedding: 384-dimensional vector
    ├─ Store in Chroma collection
    └─ Store metadata: concept_id, level, source
  [ ] Batch processing: 100 at a time (memory management)
  [ ] Time estimate: 2-3 hours total
  [ ] Verify: All explanations have embeddings

Chroma Collection Setup: ⭐ CRITICAL FOR RAG
  [ ] Create collection: "explanations"
  [ ] Metadata: {description, model, version}
  [ ] Add all pre-generated explanations
  [ ] Add dynamic Q&A cache (prepared for Phase 2)
  [ ] Test collection: Can query vectors?

Lexical Search Verification: ⭐ TESTING RAG LAYER 1
  [ ] Test: Retrieve explanation by concept_id + level
  [ ] Time: <10ms per query
  [ ] Accuracy: 100% exact match
  [ ] Coverage: 70%+ of typical queries
  [ ] Execute: npm run test:rag:lexical

Semantic Search Verification: ⭐ TESTING RAG LAYER 2
  [ ] Test: Query with paraphrased question
  [ ] Find: Similar explanations in Chroma
  [ ] Time: <100ms per query
  [ ] Accuracy: Similarity score > 0.75 (acceptable)
  [ ] Coverage: 20%+ of typical queries
  [ ] Execute: npm run test:rag:semantic

Hybrid Pipeline Testing: ⭐ TESTING RAG COMPLETE FLOW
  [ ] Test Case 1: Wrong answer → Lexical search → Instant response
  [ ] Test Case 2: Paraphrased question → Semantic search → Fast response
  [ ] Test Case 3: Unique question → LLM fallback → Cache result
  [ ] Test Case 4: Cached question → Retrieve from student_questions → Instant
  [ ] All tests: <1 second response (99%ile)
  [ ] Execute: npm run test:rag:hybrid

LLM Fallback Setup: ⭐ OPTIONAL FOR RAG
  [ ] OpenRouter API key configured
  [ ] Test single LLM call
  [ ] Implement: storeLLMResponseAsQuestion()
  [ ] Implement: getCachedStudentQuestion()
  [ ] Cost tracking: Log Rp per query
  [ ] Execute: npm run test:rag:llm

RAG Documentation Update:
  [ ] Reference: RAG_SYSTEM_TECHNICAL_SPEC.md
  [ ] Update section 3 (Database Schema) with final schema
  [ ] Update section 4 (Lexical Search) with actual implementation
  [ ] Update section 5 (Semantic Search) with actual implementation
  [ ] Add API documentation for /api/bot/explain
  [ ] Add performance benchmarks
  [ ] Add cost analysis (actual vs projected)

Performance Benchmarking: ⭐ CRITICAL FOR RAG
  [ ] Lexical queries: <10ms (P99)
  [ ] Semantic queries: <100ms (P99)
  [ ] LLM queries: 3-5 seconds (P99)
  [ ] Cache hits: <50ms (P99)
  [ ] Load test: 1000 concurrent queries
    ├─ Throughput: 100+ QPS
    ├─ Error rate: <0.1%
    └─ P95 latency: <200ms

Bot API Integration: ⭐ CONNECT RAG TO APP
  [ ] /api/bot/explain endpoint fully implemented
  [ ] Calls hybridBotExplain() from RAG layer
  [ ] Returns: explanation + variants + response_time
  [ ] Handles: Both lexical (wrong answer) and semantic (freeform) paths
  [ ] Logging: All queries logged to bot_queries table
  [ ] Tracking: Effectiveness of each variant

Testing & Sign-Off:
  [ ] All tests pass: ✓
  [ ] Performance targets met: ✓
  [ ] Load testing passed: ✓
  [ ] Documentation complete: ✓
  [ ] RAG system READY FOR PRODUCTION: ✓
```

### RAG System Deliverables:
```
By end of Phase 10, RAG system is PRODUCTION READY:

Lexical Search (Layer 1):
  ├─ ✓ Fast (<10ms)
  ├─ ✓ Accurate (100% exact match)
  ├─ ✓ Covers 70% of queries
  └─ ✓ $0 cost

Semantic Search (Layer 2):
  ├─ ✓ Fast (<100ms)
  ├─ ✓ Flexible (paraphrased questions)
  ├─ ✓ Covers 20% of queries (from non-lexical)
  └─ ✓ $0 cost (local Chroma)

LLM Fallback (Layer 3):
  ├─ ✓ Complete coverage (100%, all questions)
  ├─ ✓ Caches results (improves over time)
  ├─ ✓ Low cost (Rp 5-10K/month for 1K users)
  └─ ✓ Scales easily

Performance Targets MET:
  ├─ ✓ 95% of queries <500ms
  ├─ ✓ 70% of queries <100ms
  ├─ ✓ Zero failures or timeouts
  └─ ✓ Cost <Rp 100K/month per 1K users

Reference Document: RAG_SYSTEM_TECHNICAL_SPEC.md
```

---

## PHASE 11: QA & Optimization (Weeks 33-35)

### Duration: 3 weeks
### Team: QA Lead + Performance Engineer + Backend Engineer

### Tasks:
```
See GRAND_DESIGN_SPEED_MATH_MASTERS.md Phase 11
+RAG Specific:
  [ ] RAG system load testing: 1000 concurrent queries
  [ ] Cache hit rate monitoring: Target >70%
  [ ] LLM cost tracking: Stay under budget
  [ ] Explain latency: P95 <500ms
  [ ] Embedding quality: Semantic search accuracy >85%
```

---

## PHASE 12: Deployment & Launch (Weeks 36+)

### Duration: 2+ weeks
### Team: DevOps + All leads

### Tasks:
```
See GRAND_DESIGN_SPEED_MATH_MASTERS.md Phase 12
+RAG Production Deployment:
  [ ] RAG system deployed to production
  [ ] Monitoring: Query latencies, cache hits, LLM costs
  [ ] Alerts: Setup for RAG failures
  [ ] Documentation: Bot explanation system ready
```

---

# 3. PARALLEL WORKSTREAMS

## Workstream A: Material Generation (Weeks 1-36)
```
Phase 0:  Setup (Week 1)
Phase 1:  Backend (Weeks 2-3)
Phase 2:  Problem generation (Weeks 4-6)
Phase 3:  Templates (Weeks 7-9)
Phase 3.5: Backtest (Week 10) ⭐ GATE
Phase 4:  S3 upload (Weeks 11-12)
Phase 5-9: Levels 1-15 (Weeks 13-30)
Phase 10: RAG indexing (Weeks 31-32) ⭐ RAG COMPLETE
Phase 11: QA (Weeks 33-35)
Phase 12: Deploy (Weeks 36+)

Critical Path: Every phase depends on previous
Parallel: Some sub-tasks within phases can run parallel
```

## Workstream B: Bot & RAG System (Weeks 2-32)
```
Phase 1.5: Bot framework (Weeks 2-4)
Phase 10:  RAG indexing (Weeks 31-32) ⭐ DEPENDS ON Phase 5-9

RAG System Dependencies:
├─ Needs: All explanations pre-generated (Phase 5-9)
├─ Needs: All exercises indexed in PostgreSQL (Phase 5-9)
├─ Creates: Hybrid search pipeline (lexical+semantic+LLM)
└─ Result: Bot explanations ready for student app
```

## Workstream C: Student App (Weeks 1-36)
```
Phase 0-1: Backend (Weeks 1-3)
Phase 1.5: Bot framework (Weeks 2-4)
Weeks 5-20: Frontend development (parallel with content)
Phase 10:   Integrate RAG (Weeks 31-32) ⭐ WHEN RAG READY
Phase 11:   QA & testing (Weeks 33-35)
Phase 12:   Deploy (Weeks 36+)

Frontend doesn't need content until Phase 10,
but can build UI in parallel!
```

## Workstream D: Parent Dashboard (Weeks 5-25)
```
Phase 0-1: Backend APIs (Weeks 1-3)
Weeks 5-20: Dashboard development
Phase 10:   Integrate with RAG analytics (Weeks 31-32)
Phase 11:   QA & testing (Weeks 33-35)
Phase 12:   Deploy (Weeks 36+)

Can build in parallel with content generation
```

---

# 4. RAG SYSTEM INTEGRATION POINTS

## Where RAG System Fits Into Development Plan

```
┌─────────────────────────────────────────────────────┐
│  MATERIAL GENERATOR (Weeks 1-30)                    │
│  └─ Generates: Exercises + Explanations             │
│     ├─ Exercises: With quick_trick (for display)   │
│     └─ Explanations: 3 variants (GASING/PMRI/Mental)
│                                                      │
│  DATABASE INDEXING (Phase 5-9, Step 11)            │
│  └─ Stores: All content in PostgreSQL              │
│     ├─ Exercises indexed by (concept_id, level)    │
│     └─ Explanations ready for embeddings            │
│                                                      │
│  RAG SYSTEM BUILT (Phase 10, Weeks 31-32) ⭐       │
│  ├─ Lexical Search: Query exercises by concept     │
│  ├─ Semantic Search: Embed explanations → Chroma   │
│  ├─ LLM Fallback: OpenRouter for unique questions  │
│  └─ Caching: Student questions cache               │
│                                                      │
│  STUDENT APP INTEGRATION (Phase 10+) ⭐            │
│  └─ Calls: /api/bot/explain                        │
│     ├─ Returns: Best explanation via RAG            │
│     ├─ Shows: 3 variants (GASING/PMRI/Mental)      │
│     └─ Logs: Effectiveness for learning            │
│                                                      │
│  PARENT DASHBOARD (Phase 10+)                      │
│  └─ Shows: Which explanation style works best      │
│     └─ Feeds: Learning analytics                   │
└─────────────────────────────────────────────────────┘

Timeline:
└─ Weeks 1-30: Content ready
└─ Weeks 31-32: RAG system built
└─ Weeks 33-35: QA & optimization
└─ Week 36+: Student app + RAG ready, launch beta
```

## Detailed Integration Points

### Integration Point 1: Phase 1.5 → Phase 10
```
Phase 1.5 Output:
  ├─ Bot explanation guidelines
  ├─ Variant effectiveness tracking design
  └─ Reference: RAG_SYSTEM_TECHNICAL_SPEC.md

Phase 10 Input:
  ├─ Uses: Guidelines for indexing decisions
  ├─ Implements: Hybrid search per spec
  └─ Result: RAG system operational
```

### Integration Point 2: Phase 5-9 → Phase 10
```
Phase 5-9 Output (Step 11):
  ├─ All explanations with 3 variants
  ├─ Indexed in PostgreSQL (lexical ready)
  ├─ All vector embeddings generated
  └─ Chroma collection populated

Phase 10 Input:
  ├─ Queries: Chroma by similarity
  ├─ Queries: PostgreSQL by (concept_id, level)
  ├─ Verifies: RAG can find explanations
  └─ Result: Hybrid search working
```

### Integration Point 3: Phase 10 → Student App
```
Phase 10 Output:
  ├─ /api/bot/explain endpoint ready
  ├─ RAG hybrid search operational
  └─ All explanations indexed & cached

Student App (Weeks 5-20, Building):
  ├─ Builds: UI for practice mode
  ├─ Builds: Bot chat interface
  ├─ Builds: 3-variant explanation viewer
  ├─ Waits: RAG indexing (Phase 10)
  └─ Week 30+: Integrate with /api/bot/explain

Week 31-32: Connect app → RAG system
```

---

# 5. DEPENDENCIES & CRITICAL PATH

## Critical Path Analysis

```
Critical Path (determines overall project length):

Week 1:     Phase 0 setup ──→
            ↓
Weeks 2-3:  Phase 1 backend ──→
            ↓
Weeks 4-6:  Phase 2 problem generation ──→
            ↓
Weeks 7-9:  Phase 3 templates ──→
            ↓
Week 10:    Phase 3.5 BACKTEST ⭐ GATE ──→
            ↓
Weeks 11-12: Phase 4 S3 upload ──→
            ↓
Weeks 13-30: Phases 5-9 level generation ──→ (6-7 weeks for 15 levels)
            ↓
Weeks 31-32: Phase 10 RAG indexing ⭐ RAG COMPLETE ──→
            ↓
Weeks 33-35: Phase 11 QA ──→
            ↓
Weeks 36+:  Phase 12 deployment & beta launch

TOTAL: 36 weeks = 9 months

Parallel Paths (don't affect critical path):
├─ Phase 1.5 (Weeks 2-4): Parallel with Phase 1
├─ Student App UI (Weeks 5-20): Parallel with content gen
├─ Parent Dashboard (Weeks 5-25): Parallel with content gen
└─ All integrate at Week 30+
```

## Critical Dependencies

```
MUST COMPLETE BEFORE PROCEEDING:

Phase 3.5 → Phase 4:
  Dependency: HTML backtest PASS (≥95%, Test 8 @ 100%)
  If FAIL: Return to Phase 3, fix, retest
  Impact: Cannot proceed without this gate

Phase 5-9 Step 11 → Phase 10:
  Dependency: All explanations indexed in PostgreSQL + Chroma
  Dependency: Lexical & semantic search tested
  Impact: RAG system cannot build without indexed content

Phase 10 → Student App Integration:
  Dependency: RAG system must be production-ready
  Dependency: /api/bot/explain endpoint stable
  Impact: Bot feature cannot launch without working RAG

Phase 11 → Phase 12 Launch:
  Dependency: RAG system load-tested (1000 concurrent users)
  Dependency: Cache hit rate > 70%
  Dependency: Zero critical bugs
  Impact: Cannot launch beta without passing QA
```

---

# 6. RISK MANAGEMENT

## High-Risk Areas

### Risk 1: LLM Quality Degrades Over Time
```
Impact: If quick_trick generation drops below 90%
Mitigation:
├─ Phase 1.5: Establish quality standards
├─ Phase 2: Monitor pass rates, refine prompts if <90%
├─ Phase 5-9: Each level regenerates if <90%
├─ Phase 10: Verify all content before indexing
└─ Recovery: Rerun generation, cost = 1 week delay
```

### Risk 2: RAG System Performance Too Slow
```
Impact: If queries take >1 second (unacceptable UX)
Mitigation:
├─ Phase 10: Performance benchmark during indexing
├─ Phase 11: Load testing with 1000 concurrent queries
├─ Fallback: Optimize indexes, add caching
└─ Recovery: Performance tuning, cost = 1 week delay
```

### Risk 3: Semantic Search Accuracy Poor
```
Impact: If similarity matching < 80% (worse than random)
Mitigation:
├─ Phase 10: Test semantic search with 100 queries
├─ Adjust: Threshold, embedding model, or strategy
├─ Fallback: Rely more on lexical + LLM
└─ Recovery: Different embedding model, cost = 3 days
```

### Risk 4: LLM Cost Exceeds Budget
```
Impact: If LLM usage grows uncontrolled (budget overrun)
Mitigation:
├─ Phase 10: Setup cost tracking & alerts
├─ Limits: Cap LLM queries to budget
├─ Monitor: Weekly cost review
├─ Fallback: Reduce LLM call rate, use only for truly unique questions
└─ Recovery: Implemented immediately, cost = budget recalculation
```

---

# 7. QUALITY GATES

## Gate 1: Phase 3.5 (HTML Backtest)
```
GATE: Phase 3.5 → Phase 4

Criteria:
├─ Test 8 (quick_trick): 100% pass MANDATORY
├─ Overall backtest: ≥95% pass
├─ Manual review: All 5 samples approved
└─ No critical bugs

If FAIL:
├─ Return to Phase 3
├─ Fix quality issues
├─ Retest until PASS
└─ Cost: 1-2 weeks delay

If PASS:
└─ Sign-off: QA Lead + Frontend Lead
```

## Gate 2: Phase 10 (RAG System Operational)
```
GATE: Phase 10 → Phase 11

Criteria:
├─ Lexical search: <10ms, 100% accuracy, >99% coverage
├─ Semantic search: <100ms, >80% accuracy, >80% coverage
├─ LLM fallback: Working, cost tracked, caching implemented
├─ Load test: 1000 concurrent queries, <0.1% error
└─ All explanations indexed & searchable

If FAIL:
├─ Investigate root cause
├─ Performance tuning
├─ Retest until PASS
└─ Cost: 1-2 weeks delay

If PASS:
└─ Sign-off: Backend Lead + Bot Engineer
```

## Gate 3: Phase 11 (Production Ready)
```
GATE: Phase 11 → Phase 12

Criteria:
├─ Zero critical bugs in RAG system
├─ Cache hit rate > 70%
├─ Performance: P95 latency <500ms
├─ All tests pass (unit + integration + load)
├─ Documentation complete
└─ Team trained on deployment

If FAIL:
├─ Fix remaining issues
├─ Retest
└─ Cost: 1 week delay

If PASS:
└─ Sign-off: Project Lead + Tech Lead
```

---

# 8. TEAM STRUCTURE & ROLES

## Recommended Team Composition

```
SMALL TEAM (12-15 people):

Backend:
├─ Backend Lead (1): Oversee all backend, RAG integration
├─ Backend Engineers (3): Implement API, database, RAG layers
└─ DevOps Engineer (1): Infrastructure, deployment, monitoring

Frontend:
├─ Frontend Lead (1): UI/UX direction
├─ Frontend Engineers (2): React PWA, student app, parent dashboard
└─ Designer (1): UI/UX design

Content & AI:
├─ LLM Engineer (1): Prompts, generation, quality control
├─ Content/Educator Lead (1): Content review, GASING/PMRI verification
└─ Bot Engineer (1): Bot logic, variant switching, RAG integration

QA:
├─ QA Lead (1): Test strategy, backtests, quality gates
└─ QA Engineers (2): Manual testing, load testing, bug tracking

Management:
├─ Project Manager (1): Timeline, coordination, reporting
└─ Product Manager (1): Strategy, priorities, user focus

Total: ~12-15 people for 36-week project

CRITICAL ROLES FOR RAG:
├─ Backend Lead: RAG system oversight
├─ LLM Engineer: Prompt quality, content generation
├─ Bot Engineer: RAG integration, variant switching
├─ QA Lead: RAG testing & performance validation
└─ DevOps: Infrastructure for Chroma, Redis, etc
```

---

# 9. TRACKING & REPORTING

## Weekly Status Report Template

```
WEEK N STATUS REPORT

COMPLETED THIS WEEK:
├─ Phase X Task 1: ✅ DONE
├─ Phase X Task 2: ✅ DONE (with note: found issue Y)
└─ RAG Integration Point A: ✅ READY

IN PROGRESS:
├─ Phase X Task 3: 80% done (blocker: wait for Task 2)
└─ RAG Semantic Search: Implementation 50%, testing pending

BLOCKED:
├─ Task: [Name] Reason: [Dependency] Expected unblock: [Date]
└─ [Other blockers if any]

METRICS:
├─ Problem generation: 250/450 Level 3 problems done (56%)
├─ LLM pass rate: 92% (target: ≥90%) ✅
├─ HTML backtest: Spot check 50/50 (100%) ✅
├─ RAG indexing progress: [When Phase 10]

RISKS:
├─ Risk: [Description] Mitigation: [Plan]
└─ [Other risks]

UPCOMING (next week):
├─ Phase X Task 4: Start
├─ RAG Integration: [What's next]
└─ [Other plans]

CONFIDENCE LEVEL: [Green/Yellow/Red]
└─ [Brief explanation if not green]

---

RAG-SPECIFIC METRICS (when Phase 10+):
├─ Lexical search latency: X ms (target <10ms)
├─ Semantic search latency: Y ms (target <100ms)
├─ Cache hit rate: Z% (target >70%)
├─ LLM cost: Rp X/month (target <Rp 100K)
└─ Error rate: X% (target <0.1%)
```

---

# SUMMARY

## Implementation Roadmap Summary

```
Timeline: 36 weeks (9 months)

Content Pipeline (Weeks 1-32):
├─ Setup & backend infrastructure (Weeks 1-3)
├─ Problem generation & HTML (Weeks 4-12)
├─ All 15 levels generated (Weeks 13-30)
├─ RAG system built & tested (Weeks 31-32)
└─ Reference: Grand Design + RAG Technical Spec

Quality Assurance (Weeks 10-35):
├─ Phase 3.5 Quality Gate (Week 10) ⭐ CRITICAL
├─ Continuous testing throughout
├─ Phase 11 Final QA (Weeks 33-35)
└─ Zero bugs before launch

RAG System Delivery (Weeks 31-32):
├─ Hybrid lexical + semantic + LLM search
├─ All explanations indexed & searchable
├─ Performance validated (load tested)
├─ Ready for student app integration

Launch (Week 36+):
├─ Beta: 50 students + 20 parents
├─ Monitor: RAG performance, cache hits, learning outcomes
├─ Iterate: Feedback from beta users
└─ Production: Full launch

Reference Documents:
├─ GRAND_DESIGN_SPEED_MATH_MASTERS.md (overall strategy)
├─ RAG_SYSTEM_TECHNICAL_SPEC.md (RAG implementation details)
└─ This DEV_PLAN_WITH_RAG_REFERENCE.md (implementation timeline)
```

---

**Development plan is ready. Execute with confidence!**

**Key Success Factor: Complete Phase 3.5 quality gate before Phase 4. Ensure RAG system passes all tests in Phase 10 before integrating with student app.**

