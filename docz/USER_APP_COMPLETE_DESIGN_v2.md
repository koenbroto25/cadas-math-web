# 🎓 SPEED MATH MASTERS - USER APP COMPLETE DESIGN v2.0
## Student + Parent + Teacher — Unified App Specification

**Date:** September 4, 2026
**Version:** 2.0 (Revised from v1.0, Sept 2, 2026)
**Status:** Revised — supersedes v1.0
**Scope:** One unified app (Student + Parent + Teacher roles) + RAG bot integration

---

## 📋 CHANGELOG FROM v1.0

| # | Change | Section |
|---|---|---|
| 1 | Student App + Parent Dashboard merged into **one app** with role-based routing, not two separate products | §3 |
| 2 | Added **Parent Gate** pattern (required for app-store Kids Category compliance) | §3 |
| 3 | Added **Guru (Teacher) role** entirely — dashboard, verification, consent, classroom management | §6 |
| 4 | Added **Referral/Partnership system** — generic engine serving teacher-recruitment AND future affiliate marketing | §7 |
| 5 | Architecture synced with RAG system decisions: Local LLM on VM (Ollama) + OpenRouter fallback, Gemini 3.1 Flash TTS + Gemini Transcribe (STT), PostgreSQL+pgvector only (no Chroma) | §2 |
| 6 | **Off-app detection** flagged as likely infeasible as originally specified (PWA/web has zero visibility into other apps; native apps need restrictive OS permissions) — reframed | §5 |
| 7 | **Offline claims** corrected — bot explanations require cloud LLM/TTS/STT, so only *previously cached* content works offline, not new generation | §12 |
| 8 | **Variant naming unified** across API/UI/content — was inconsistent (`mental` in API, `LOGIKA` in UI, `Pendekatan Cepat` in content) | §4, §9 |
| 9 | Voice/TTS free vs premium tiers clarified to match RAG design (regular = cached audio, premium = live generation) — was ambiguous in v1.0 | §5 |
| 10 | "Security: Zero known vulnerabilities" launch gate replaced with a realistic bar | §15 |
| 11 | Added **Future Roadmap** section for TKA SD/SMP material — explicitly out of current scope | §16 |
| 12 | **Database decision resolved**: user-app shares the same PostgreSQL instance as the material-generation (RAG) app, not a separate DB | §2 |
| 13 | Added **Talking Bot Avatar** (Rive + lip-sync) to Bot Chat — was fully designed in the RAG grand design but never carried into this document | §4.3 |

---

# TABLE OF CONTENTS

1. Executive Summary
2. System Architecture & Tech Stack
3. Unified App — Information Architecture (Student / Parent / Teacher)
4. Student Experience
5. Parent Dashboard
6. Guru (Teacher) Dashboard — NEW
7. Referral & Partnership System — NEW
8. Database Schema
9. API Specification
10. User Journeys & Flows
11. Gamification System
12. Offline Support & Sync
13. Analytics & Personalization
14. Implementation Timeline
15. Deployment & Launch
16. Future Roadmap: TKA SD/SMP Expansion

---

# 1. EXECUTIVE SUMMARY

## What is Speed Math Masters?

```
ONE APP, THREE ROLES:

STUDENT
├─ Gamified math practice (Kumon-based curriculum, 15 levels, 650 exercises)
├─ AI bot for explanations (GASING / PMRI / Quick — via RAG system)
├─ Leaderboard & achievements
└─ Target: Grades 3-12 (age 8-17)

PARENT
├─ Linked to one or more child accounts
├─ Monitor progress, analytics, learning insights
├─ App usage controls (in-app focus score — see §5 for scope correction)
├─ Push notifications & daily reports
└─ Target: Parents of school-age children

GURU (TEACHER) — NEW
├─ Linked to a classroom of students (via invite code, parent-confirmed)
├─ Aggregate class performance + per-student academic progress
├─ Assign practice as homework, with deadlines
├─ Direct messaging to parents
└─ Target: Math teachers (individual referral or school partnership)

PRICING
├─ Free: Levels 1-2, limited sessions, cached voice explanations
├─ Premium: Rp 99K/month — All levels, unlimited, live voice generation
├─ Classroom/School: separate license model (see §7) — not dependent on
│  individual student premium status
└─ Conversion target: 10-15% of free users (individual channel)
```

## Why This Product, Why Now

Indonesia's Ministry of Education (Kemendikdasmen) launched **TKA (Tes Kemampuan Akademik)** in 2026 — a standardized national assessment for SD (grade 6) and SMP (grade 9), testing only two subjects: **Bahasa Indonesia and Matematika**. First administered April–May 2026 with 98.12% participation, TKA results now validate school report-card grades, creating real, current pressure on foundational math skills. This is the market tailwind behind both the parent-facing product and the teacher-partnership GTM strategy (§7).

## User Journey (60 seconds)

```
STUDENT:
1. Open app → Register (name, grade, age) or join via parent/teacher invite
2. Placement test (adaptive, 10 min) → Placed at Level 4
3. Dashboard: Level 4 (45% complete), streak (0 days), XP (0)
4. Practice loop: problem → answer → feedback → quick trick → next (20-30x/session)
5. Session end: summary, badges, streak started
6. Done in 15 minutes

PARENT (within the SAME app, not a separate download):
1. Register or log in → link to child via code, OR set up child's profile
   directly (profile-switcher pattern for young kids without their own login)
2. See today's summary, weekly analytics
3. Set in-app focus preferences, daily report email
4. Optionally: approve/deny a teacher's classroom invite for their child

GURU (new):
1. Verify identity (see §6.1)
2. Create/get classroom invite code, share with parents (not direct enrollment)
3. Parents confirm consent per child (§6.2)
4. See aggregate class dashboard, assign homework, message parents
```

## Success Metrics (First 6 months)

```
User Acquisition:
├─ Downloads: 5,000+ (target)
├─ Active users: 2,000 MAU
├─ Paying users (individual): 200+ (Rp 20M/month revenue)
├─ Teacher accounts: [TBD — new channel, needs its own target once
│  organic vs school-partnership split is validated, see §7.4]
└─ Free-to-paid conversion: 10-15%

Learning Outcomes:
├─ Accuracy improvement: +15% in 8 weeks
├─ Level completion: 80%+
├─ Session duration: 10-15 min/day (healthy)
└─ Retention: 60% 30-day, 40% 90-day
```

---

# 2. SYSTEM ARCHITECTURE & TECH STACK

## ⚠️ Relationship to RAG System (clarify before reading further)

This document covers the **user-facing app** (student/parent/teacher). The **RAG explanation engine** is a separate service — see RAG grand design doc for full detail. What matters here is how they connect:

```
USER APP (this doc)                  RAG SYSTEM (separate doc)
┌──────────────────────┐             ┌──────────────────────────┐
│ Express.js backend    │  ────────▶  │ Lexical → Semantic        │
│ (AWS EC2)             │  /api/bot/  │ → Local LLM (Ollama, VM)  │
│ PostgreSQL (AWS RDS)  │  explain    │ → OpenRouter (fallback)   │
│ - user accounts       │             │ PostgreSQL + pgvector     │
│ - progress/analytics  │  ◀────────  │ (semantic search)         │
│ - classroom data      │  response   │                           │
└──────────────────────┘             └──────────────────────────┘
```

**Decision (resolved):** the user-app database **is** the material-generation (RAG) app's PostgreSQL instance — one shared instance, not two. Practical implication: use **separate schemas** within that instance (e.g., `app.*` for user-facing tables in §8, `rag.*` for explanations/corpus/pgvector tables) so migrations and access control stay clean between the two services even though they share hardware. Confirm this schema split with whoever owns the RAG system's DB before Phase 1 starts.

## High-Level Architecture

```
FRONTEND LAYER (unified — see §3 for role routing):
┌─────────────────────────────────────────────────┐
│  ONE React app (student / parent / guru views)   │
│  ├─ Vercel hosting (global CDN)                  │
│  ├─ Service Worker (offline support — student    │
│  │   practice + cached content only, see §12)    │
│  ├─ IndexedDB (local cache)                      │
│  ├─ Role-based routing after login                │
│  └─ Parent Gate before parent/guru-only screens   │
└─────────────────────────────────────────────────┘
                        ↕
API LAYER:
┌─────────────────────────────────────────────────┐
│  Express.js Backend (Node.js) — AWS EC2          │
│  ├─ Auto-scaling, load balancer (ALB)            │
│  ├─ Redis (sessions + leaderboard cache)         │
│  ├─ Rate limiting & auth (JWT)                   │
│  └─ Role-based access control (student/parent/   │
│      guru — see §9 for permission boundaries)    │
└─────────────────────────────────────────────────┘
                        ↕
DATA LAYER:
┌─────────────────────────────────────────────────┐
│  PostgreSQL (AWS RDS)                            │
│  ├─ User accounts (student + parent + guru)      │
│  ├─ Classroom & referral tables — NEW (§8)       │
│  ├─ Progress tracking, analytics, session logs   │
│  └─ Notifications & settings                     │
│                                                   │
│  Redis Cache (ElastiCache)                       │
│  ├─ Sessions & auth tokens                       │
│  ├─ Leaderboard (real-time)                      │
│  └─ Query cache                                  │
│                                                   │
│  S3 + CloudFront (Content Delivery)               │
│  ├─ Exercise content, SVG visualizations          │
│  ├─ Pre-generated voice files (regular-tier TTS)  │
│  └─ Images & assets                              │
└─────────────────────────────────────────────────┘
                        ↕
EXTERNAL SERVICES (revised to match RAG decisions):
┌─────────────────────────────────────────────────┐
│  RAG System (separate service, see above)        │
│  ├─ Local LLM on VM (Ollama) → OpenRouter        │
│  │   fallback — NOT client-side, NOT 100% local  │
│  └─ /api/bot/explain endpoint                    │
│                                                   │
│  Gemini 3.1 Flash TTS (voice output)              │
│  ├─ Premium: live generation per request          │
│  ├─ Regular: pre-generated, cached in S3          │
│  └─ Cloud-only — no offline TTS fallback (Kokoro  │
│      TTS from earlier local-first plan is dropped)│
│                                                   │
│  Gemini Transcribe (voice input / STT)            │
│  └─ Cloud-only, consistent ecosystem with TTS     │
│                                                   │
│  SendGrid (Email) — parent + guru daily/weekly    │
│  reports (§5, §6)                                 │
│                                                   │
│  Firebase Cloud Messaging (Push)                  │
│  └─ Practice reminders, achievements, alerts       │
│      (parent AND guru — see §6.4 for scope)       │
└─────────────────────────────────────────────────┘
```

## Technology Stack

Unchanged from v1.0 — React 18+/TypeScript/Redux Toolkit/Tailwind frontend, Node.js/Express/PostgreSQL/Redis backend, Vercel + AWS deployment. See v1.0 §2 for full package list.

**Addition:** **Rive runtime** (`@rive-app/react-canvas` or equivalent) for the talking bot avatar (§4.3) — renders the state machine, consumes viseme timing + speaking-state as inputs. Not in v1.0's stack list even though the avatar itself was already decided in the RAG doc.

---

# 3. UNIFIED APP — INFORMATION ARCHITECTURE (NEW)

## 3.1 Why One App

v1.0 treated Student App and Parent Dashboard as two products sharing hosting. This revision merges them into **one login system, one codebase, role-based views** — reduces onboarding friction (parent doesn't need to discover/download a second product), and reuses the same shell for the new Guru role.

## 3.2 Login & Role Routing

```
LOGIN
  │
  ├─ Recognized role: STUDENT (own login, typically age 13+)
  │   └─ Default view: Practice / Leaderboard / Bot Chat tab bar
  │
  ├─ Recognized role: PARENT
  │   └─ Default view: Parent Dashboard
  │       └─ Profile switcher if multiple children (Netflix-style)
  │       └─ "Practice as [child]" preview mode available
  │
  ├─ Recognized role: GURU
  │   └─ Default view: Classroom Dashboard (§6)
  │
  └─ Young child, no independent login
      └─ Parent sets up a device-level profile; child selects their
         avatar/profile on shared device, no password needed
```

## 3.3 Parent Gate (NEW — required addition)

Because parent/guru settings, analytics, and billing now live in the **same app bundle** as child-directed content, add a Parent Gate: a simple challenge (e.g., a multiplication problem) before entering parent-only or guru-only screens from a child's active session. This is standard practice in kids' EdTech apps and matters for:
- Preventing a child from wandering into billing/settings
- App Store **Kids Category** classification, if pursued for iOS (Apple requires clear separation between kid-directed and non-kid-directed areas within a bundle)

## 3.4 Full Navigation Map

```
├─ Auth Flow
│  ├─ Splash → Login/Register → Role detection → Route
│  ├─ Placement test (new students only)
│  └─ Parent/Guru: linking flow (invite code entry or generation)
│
├─ STUDENT views (tab bar)
│  ├─ 🏠 Dashboard  ├─ 📝 Practice  ├─ 🏆 Leaderboard
│  ├─ 💬 Bot Chat   └─ ⚙️ Settings
│
├─ PARENT views (behind Parent Gate if entered from child session)
│  ├─ 📊 Dashboard  ├─ 📈 Analytics  ├─ 🔒 Usage Controls
│  ├─ 👨‍👩‍👧 Manage Children  └─ ⚙️ Settings
│
└─ GURU views (behind Parent Gate equivalent) — NEW
   ├─ 🏫 Classroom Dashboard  ├─ 📋 Assignments  ├─ 💬 Parent Messages
   └─ ⚙️ Settings (incl. verification status)
```

---

# 4. STUDENT EXPERIENCE

Mostly unchanged from v1.0 §3 (Dashboard, Practice Flow, Leaderboard) — see that document for full screen-by-screen detail. Two corrections:

## 4.1 Bot Chat Variant Naming — FIXED

v1.0 had three different names for the same three variants across API, UI, and content. This revision locks one canonical set:

| Canonical ID | UI Label | Content metadata (`approach_name`) |
|---|---|---|
| `gasing` | GASING (concrete) | Pendekatan GASING |
| `pmri` | PMRI (visual) | Pendekatan PMRI |
| `quick` | Quick (mental math) | Pendekatan Cepat |

`mental` and `LOGIKA` are retired — use `quick` everywhere (API enum, UI tab label, content tagging). This must be applied consistently in §9 (API) and in the RAG content pipeline.

## 4.2 Voice Playback — tier behavior clarified

- **Premium student:** tap voice icon → live Gemini 3.1 Flash TTS generation
- **Regular student:** tap voice icon → plays pre-generated, cached audio (same explanation text, generated once, reused across all regular-tier students who hit that explanation)
- Settings screen copy should read "Voice explanations: On" for all users, not "Premium only" — regular users still get voice, just not live-generated (v1.0 settings copy implied free users get no voice at all — corrected here)

## 4.3 Talking Bot Avatar (NEW — was designed in RAG doc, missing from v1.0)

The Bot Chat screen isn't just text + a voice-playback button — it's built around an animated avatar (Rive) that visually "talks" while the explanation plays. This was fully specified in the RAG grand design but never made it into the user-app spec until now.

```
BOT CHAT SCREEN LAYOUT:
├─ Avatar (Rive canvas, top of screen)
│  ├─ State: idle       — default, waiting for a question
│  ├─ State: listening   — while student's mic input is being captured
│  ├─ State: thinking    — while RAG pipeline is generating (lexical →
│  │                       semantic → local LLM → OpenRouter, per RAG doc)
│  └─ State: speaking    — lip-synced to the TTS audio track (see below)
├─ 3 variant tabs (GASING / PMRI / Quick — §4.1)
├─ Explanation text (scrollable, under the avatar)
├─ Mic button — voice INPUT via Gemini Transcribe (STT)
└─ Helpful? rating (thumbs up/down per variant)
```

**Voice input path (student asks a question by speaking):**
`Mic tap → audio captured → Gemini Transcribe (STT, cloud) → text → RAG /api/bot/explain → explanation text → Gemini 3.1 Flash TTS → audio + viseme extraction → Rive "speaking" state`

**Lip-sync pipeline (per RAG doc research, not yet empirically validated):** Gemini TTS does not expose phoneme/viseme timing data, so viseme cues are generated separately from the resulting audio — starting approach is Rhubarb Lip Sync (phonetic mode + the known explanation text as a dialog-file hint), upgrading to Montreal Forced Aligner if accuracy isn't sufficient. Output feeds Rive's state machine as a Number input (viseme index) + Boolean input (`isSpeaking`).

**Open item carried from RAG doc:** viseme accuracy on real Gemini TTS Bahasa Indonesia output hasn't been tested yet — validate before this becomes a launch blocker in Phase 2 (Bot integration, §14).

---

# 5. PARENT DASHBOARD

Mostly unchanged from v1.0 §4 — dashboard home, weekly analytics, daily email report, reminders. Two corrections:

## 5.1 Off-App Detection — SCOPE CORRECTED

v1.0 specified showing which other apps a child opened outside Speed Math Masters (e.g., "YouTube: 4 min, Chrome: 2 min"). **This is not achievable as specified**:
- As a **PWA/web app**, there is no browser API that exposes what other apps or sites a user opened outside the current tab — this is a hard sandboxing boundary, not a missing feature.
- As a **native app** (React Native, planned for iOS/Android), this would require OS-level usage-access permissions: Android's `PACKAGE_USAGE_STATS` (manual grant, not a standard permission dialog) or iOS's tightly-restricted Screen Time/Family Controls frameworks (generally not available to third-party apps without special Apple entitlement).

**Revised feature: "Focus Score" (in-app only)** — replaces off-app detection. Tracks behavior *within* the app: tab/session switches, idle time during a practice session, time-to-first-answer. Framed honestly to parents as "how focused was practice time," not "what else did they do on their phone."

## 5.2 Notifications now also route to Guru (where applicable)

Academic-relevant notifications (milestone reached, stuck on a topic, score drop) go to both parent and any linked, consented teacher. Behavioral/device-level signals (Focus Score, session timing) remain **parent-only** — see §6.3 for the exact boundary.

## 5.3 Gamification/addiction framing — note, not a spec change

v1.0's parent-facing narrative emphasizes "no screen addiction," while the gamification system (§11) uses streaks, FOMO notifications, and leaderboards — mechanics associated with engagement-maximizing design. No structural change proposed here, but worth a conscious call on messaging: market as "healthy AND engaging," not "not addictive," to avoid an easily-noticed contradiction.

---

# 6. GURU (TEACHER) DASHBOARD — NEW

## 6.1 Identity Verification

Before a guru account gets classroom features, verify they are an actual teacher:
- NUPTK (Nomor Unik Pendidik dan Tenaga Kependidikan) number, OR
- School email domain, OR
- Manual review of uploaded proof of teaching (fallback for tutors without NUPTK — see §6.6)

Unverified accounts can browse but cannot generate classroom invite codes.

## 6.2 Classroom Linking & Consent Flow

```
1. Verified guru generates a classroom invite code/link
2. Guru shares code with parents (via school, WA group, etc. — outside app)
3. Parent completes/has already completed their child's account
4. Parent enters classroom code → sees exactly what will be shared:
   "Guru [name] will be able to see [child]'s scores, level progress,
    and topic mastery. Guru will NOT see screen time or other app usage."
5. Parent confirms (opt-in, explicit, per child)
6. Link becomes active
```

**Revocation:** parent can unlink at any time, unilaterally, no teacher/school approval needed. Teacher-initiated offboarding (resignation, class change) auto-expires their access.

## 6.3 What Guru Can See (permission boundary)

| Data | Guru Access |
|---|---|
| Scores, level progress, topic mastery | ✅ Yes |
| Streak / consistency | ✅ Yes (relevant to teaching, not privacy-sensitive) |
| Focus Score, in-app session timing | ❌ No (parent-only) |
| Billing / subscription status | ❌ No |

## 6.4 Classroom Dashboard

- Class average score, sortable per-student breakdown
- Per-topic mastery heatmap across the whole class (surfaces which concepts the class collectively struggles with — pedagogically the highest-value feature for a teacher)
- Roster management (view linked students, pending invites)

## 6.5 Assignments (homework)

Guru selects a level/topic, sets a due date, sees per-student completion. Turns the app from passive monitoring into an actual teaching tool — this is the strongest value proposition for the school-partnership GTM path (§7).

## 6.6 Parent Messaging

Guru can send a short note to a specific parent (e.g., "needs more practice on fractions") in addition to automated notifications — keeps the guru-parent relationship active inside the app.

## 6.7 Yearly Rollover

At the start of a new school year, old guru-student links are archived (not deleted — student progress history is the student/parent's data, retained regardless of teacher link status). Students/parents re-link to a new teacher's classroom code.

## 6.8 Non-school tutors (optional, future consideration)

Private tutors / small bimbel without institutional affiliation have the same underlying need (a "class" of students, progress visibility). Verification would rely on manual review rather than NUPTK/school email. Not required for launch — noted for later.

---

# 7. REFERRAL & PARTNERSHIP SYSTEM — NEW

## 7.1 Design Principle

Built as **one generic system**, not a teacher-only feature — because the two GTM paths below and any future general marketing affiliate program share the same underlying mechanism: a tracked invite code + a compensation calculation.

## 7.2 Two GTM Paths (both use the same system)

| Path | Description | Compensation |
|---|---|---|
| **A — Organic teacher referral** | Teacher recommends to parents directly; students become supplementary practice; scores flow to teacher | None required — teacher's reward is the classroom dashboard/teaching tool itself |
| **B — School partnership** | School hands off to teacher, assuming no special school budget | Mandatory fee option to teacher — same mechanism as a future general affiliate program |

## 7.3 Data Model Implication

Generic `referrers` table with a `type` enum (`teacher` \| `affiliate` \| `other`), tracked invite codes, conversion tracking, and payout calculation — not teacher-specific hardcoded logic. See §8.

## 7.4 Compensation — handle with care

Paying a teacher per-signup (an affiliate-style commission) while they simultaneously recommend the product to their own students' parents can read as a conflict of interest — a sensitive dynamic for teachers, especially civil-servant (ASN) teachers at public schools bound by codes of conduct around commercial endorsement. Two mitigations to build in:
- **Transparency by default**: parents/schools can see that a teacher receives compensation — frame it as a stipend for engagement/contribution (feedback, classroom management), not a bare "per-referral commission"
- **Tie payout to engagement**, not just signups — e.g., active classroom usage or MGMP-channel content feedback (§7.5), not raw headcount

## 7.5 Content Feedback Loop (MGMP)

Exercise material will be shared with MGMP (Musyawarah Guru Matematika — a real, established Indonesian teacher subject-forum) for review and ongoing development feedback. This does double duty: pedagogical validation of content, and a natural source for the RAG system's corpus-building need (real teacher explanations) flagged in the RAG grand design.

## 7.6 Success Metrics for This Channel (separate from overall app metrics)

- Invite-to-consented-signup ratio (parents who complete consent after teacher shares code)
- Average active students per teacher
- Retention: teacher-channel students vs. organic-acquisition students
- Needed to know whether Path A or Path B is actually more effective — not assumed up front

## 7.7 Suggested Addition: lightweight partnership agreement

Not legal advice — but once "school partnership" moves beyond informal, a short document stating what data is shared, teacher compensation terms, and how either side can end the arrangement protects both parties and smooths a Path A → Path B transition.

---

# 8. DATABASE SCHEMA (User-Facing, Revised)

Builds on v1.0 §5 schema (`students`, `parents`, `student_parent_links`, progress/session tables — unchanged, see v1.0 for full DDL). **New tables:**

```sql
-- Teacher accounts
CREATE TABLE teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  verification_status VARCHAR(20) DEFAULT 'pending', -- pending|verified|rejected
  verification_method VARCHAR(20), -- nuptk|school_email|manual
  nuptk VARCHAR(50),
  school_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT now()
);

-- Classrooms (a teacher can have multiple, across years)
CREATE TABLE classrooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID REFERENCES teachers(id),
  invite_code VARCHAR(20) UNIQUE NOT NULL,
  school_year VARCHAR(20), -- e.g. "2026/2027"
  status VARCHAR(20) DEFAULT 'active', -- active|archived
  created_at TIMESTAMP DEFAULT now()
);

-- Student-teacher link, parent-consented, per classroom
CREATE TABLE classroom_students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES classrooms(id),
  student_id UUID REFERENCES students(id),
  parent_consent_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP, -- NULL while active
  UNIQUE(classroom_id, student_id)
);

-- Assignments (homework)
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID REFERENCES classrooms(id),
  level_or_topic VARCHAR(100) NOT NULL,
  due_date DATE,
  created_at TIMESTAMP DEFAULT now()
);

-- Generic referral/affiliate system (serves teacher path + future marketing)
CREATE TABLE referrers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(20) NOT NULL, -- teacher|affiliate|other
  reference_id UUID, -- links to teachers.id when type=teacher
  code VARCHAR(20) UNIQUE NOT NULL,
  compensation_model VARCHAR(30), -- none|stipend|per_active_student
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE referral_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES referrers(id),
  student_id UUID REFERENCES students(id),
  converted_at TIMESTAMP DEFAULT now()
);
```

---

# 9. API SPECIFICATION (Revised)

Adds to v1.0 §6 endpoint list. Key additions and one fix:

```
FIXED:
PATCH /api/bot/explain
  - variant param: 'gasing' | 'pmri' | 'quick' | 'auto'
    (was 'gasing' | 'pmri' | 'mental' | 'auto' — 'mental' retired, see §4.1)

NEW — Guru endpoints:
POST   /api/teacher/verify              — submit NUPTK/school email/proof
POST   /api/teacher/classrooms          — create classroom, get invite code
GET    /api/teacher/classrooms/:id      — classroom dashboard data
POST   /api/teacher/assignments         — create assignment
GET    /api/teacher/assignments/:id/progress
POST   /api/teacher/messages            — send note to a parent

NEW — Consent/linking endpoints:
POST   /api/classroom/join              — parent submits invite code + consent
DELETE /api/classroom/students/:id      — parent revokes (any time, unilateral)

NEW — Referral endpoints:
POST   /api/referrals                   — generate a referral code (teacher or affiliate)
GET    /api/referrals/:code/stats       — conversion stats for a code
```

---

# 10. USER JOURNEYS & FLOWS

v1.0's Student and Parent journeys (§7) remain valid with one edit: Day 1 Parent journey should read "log into the same app, link to child via code or set up child's profile" rather than "receive link, create separate parent account."

## New: Guru First-Week Journey

```
DAY 1: Verify identity → generate classroom invite code → share with parents
DAY 2-4: Parents join, consent per child → classroom dashboard starts
  populating
DAY 5: First assignment created (e.g., "Complete Level 3 by Friday")
WEEK 1 OUTCOME: Classroom dashboard shows real data, guru sees which
  topics the class struggles with collectively, sends first parent message
```

---

# 11. GAMIFICATION SYSTEM

Unchanged from v1.0 §8 (XP, speed badges, streaks, achievements). See §5.3 for the addiction-framing note — no structural changes to the system itself proposed here.

---

# 12. OFFLINE SUPPORT & SYNC (Claims Corrected)

v1.0 claimed "Bot explanations (cached)" work fully offline. Corrected:

```
WHAT ACTUALLY WORKS OFFLINE:
├─ Full practice sessions (problems, answers, local scoring) — unchanged
├─ PREVIOUSLY-VIEWED bot explanations (cached text + cached audio) — replay only
├─ View progress & stats (local)
└─ NOT possible offline: any NEW bot explanation, live TTS (premium), or
   voice input (STT) — these require the RAG system's Local LLM (on VM,
   not on-device) and Gemini's cloud TTS/STT

REVISED COPY FOR FAQ / SETTINGS:
"Practice works fully offline. Explanations you've already seen can replay
offline. New explanations and voice features need an internet connection."
```

Sync flow and conflict handling (v1.0 §9) remain valid as-is.

---

# 13. ANALYTICS & PERSONALIZATION

Unchanged from v1.0 §10, plus: add the guru-channel metrics from §7.6 to the analytics pipeline (invite-to-consent ratio, active-students-per-teacher, teacher-channel retention).

---

# 14. IMPLEMENTATION TIMELINE (Revised)

```
PHASE 1: FOUNDATION (Weeks 1-4) — unchanged
PHASE 2: CORE FEATURES (Weeks 5-10) — unchanged, but Bot integration
  (Week 7) now targets the fixed variant naming from day one
PHASE 3: PARENT DASHBOARD (Weeks 11-16) — unchanged, Focus Score
  replaces off-app detection (§5.1), same timeline
PHASE 4: GURU DASHBOARD (Weeks 17-22) — NEW PHASE
  ├─ Week 17-18: Verification flow, classroom creation, invite/consent
  ├─ Week 19-20: Classroom dashboard, assignments
  ├─ Week 21-22: Referral/partnership system (§7), parent messaging
  └─ Deliverable: Guru role fully functional
PHASE 5: OFFLINE & ADVANCED (Weeks 23-28) — shifted from v1.0's Phase 4,
  same scope, corrected claims per §12
PHASE 6: LAUNCH PREP (Weeks 29-32) — shifted, same scope as v1.0 Phase 5
PHASE 7: DEPLOYMENT (Weeks 33+) — shifted, same scope as v1.0 Phase 6

TOTAL: 36-44 weeks (grew from 28-36 to accommodate Guru phase)
```

---

# 15. DEPLOYMENT & LAUNCH

Same as v1.0 §12 with one fix:

```
RELIABILITY (revised):
├─ Uptime: 99.9% (calculated, not guaranteed)
├─ Data loss: 0% (tested in failures)
├─ Security: No critical or high-severity findings from security audit
│   (was: "Zero known vulnerabilities" — not a realistic absolute claim)
└─ Crash rate: <0.1% of sessions
```

---

# 16. FUTURE ROADMAP: TKA SD/SMP EXPANSION (Explicitly Out of Current Scope)

Materials already prepared (rangkuman TKA SD & SMP, HTML format, ~46-52 sample questions each across 15-17 sub-topics) as a starting reference for this future phase — **not scheduled in Phases 1-7 above**. When this phase is scheduled, note ahead of time:

- Content is currently formatted for visual display (raw notation), not TTS-ready — will need the same normalization/schema treatment as the core SD material before entering the bot pipeline
- Real TKA format includes stimulus-based "soal grup" (shared reading/graph/illustration across multiple questions) — a genuinely new question type, not just more of the existing format
- SMP scope is a bigger jump than "more levels" — new curriculum area (algebra, geometry) and a different target age (13-15) likely needing UX/tone adjustments beyond the SD-oriented gamification design

---

# SUMMARY

This v2.0 revision turns the original two-product design (Student App + Parent Dashboard) into **one unified app with three roles** (Student, Parent, Guru), adds the teacher/school GTM channel as a first-class feature rather than an afterthought, and syncs every architecture reference with the decisions already locked in the RAG system design (VM-hosted local LLM + OpenRouter fallback, Gemini TTS/STT, PostgreSQL+pgvector). Five factual corrections from v1.0 (off-app detection feasibility, offline claims, variant naming, voice tier behavior, security launch gate) are folded in so the spec matches what's actually buildable.

**Next step:** confirm the one open architecture question (§2 — shared vs. separate PostgreSQL instance between this app and the RAG system) before Phase 1 starts.
