# 🎓 SPEED MATH MASTERS - USER APP COMPLETE DESIGN v1.0
## Student App + Parent Dashboard - Specification & Implementation

**Date:** September 2, 2026  
**Version:** 1.0 (Complete)  
**Status:** Ready for Development  
**Scope:** Student App (React PWA) + Parent Dashboard (Web/Mobile)  
**Duration:** 20-36 weeks (parallel with material generation)

---

# TABLE OF CONTENTS

1. Executive Summary
2. System Architecture & Tech Stack
3. Student App - Complete Design
4. Parent Dashboard - Complete Design
5. Database Schema (User-Facing Only)
6. API Specification (User App Endpoints)
7. User Journeys & Flows
8. Gamification System
9. Offline Support & Sync
10. Analytics & Personalization
11. Implementation Timeline
12. Deployment & Launch

---

# 1. EXECUTIVE SUMMARY

## What is Speed Math Masters User App?

```
STUDENT APP:
├─ React PWA (Progressive Web App)
├─ Mobile-first, works offline
├─ Gamified math practice
├─ AI bot for explanations (via RAG system)
├─ Leaderboard & achievements
└─ Target: Grades 3-12 (age 8-17)

PARENT DASHBOARD:
├─ Web app (desktop/mobile responsive)
├─ Monitor child's progress
├─ Analytics & learning insights
├─ App lock & screen time controls
├─ Push notifications & reminders
├─ Off-app detection (shows actual screen time)
└─ Target: Parents of school-age children

PRICING:
├─ Free: Levels 1-2, limited sessions
├─ Premium: Rp 99K/month - All levels, unlimited
└─ Conversion target: 10-15% of free users
```

## User Journey (60 seconds)

```
STUDENT:
1. Download app / Open website
2. Register (name, grade, age)
3. Placement test (adaptive, 10 min) → Placed at Level 4
4. Dashboard shows: Level 4 (45% complete), streak (0 days), XP (0)
5. Tap "START PRACTICE"
6. See problem: "7 + 4 = ?" with visual (blocks)
7. Enter answer: 11 ✓ CORRECT!
8. Feedback: +10 XP, speed bonus +5 XP, quick trick shown
9. Next problem... (repeat 20-30 times per session)
10. Session end: Summary, badges unlocked, streak started
11. Done in 15 minutes

PARENT:
1. Child registers on app
2. Parent gets link to connect dashboard
3. Parent sees: Today's summary (27 problems, 91% accuracy, 15 min used)
4. Weekly analytics: Progress chart, accuracy trend, speed improvement
5. Alert: "Subtraction accuracy dipping, needs 20 min today"
6. Set app lock: 15 min/day, 4-6 PM only
7. Daily report emailed at 6 PM
8. Child practices with app lock enabled
9. Parent sees updated dashboard next day
10. Satisfied: Learning is happening, no screen addiction
```

## Success Metrics (First 6 months)

```
User Acquisition:
├─ Downloads: 5,000+ (target)
├─ Active users: 2,000 MAU
├─ Paying users: 200+ (Rp 20M/month revenue)
└─ Free-to-paid conversion: 10-15%

Learning Outcomes:
├─ Accuracy improvement: +15% in 8 weeks
├─ Level completion: 80%+
├─ Session duration: 10-15 min/day (healthy)
└─ Retention: 60% 30-day, 40% 90-day

User Satisfaction:
├─ App rating: 4.5+/5 stars
├─ Parent satisfaction: 4.5+/5
├─ Feature request volume: Low (good design)
└─ Bug reports: <1% of sessions
```

---

# 2. SYSTEM ARCHITECTURE & TECH STACK

## High-Level Architecture

```
┌─────────────────────────────────────────────────┐
│         SPEED MATH MASTERS - USER APP            │
└─────────────────────────────────────────────────┘

FRONTEND LAYER:
┌─────────────────────────────────────────────────┐
│  STUDENT APP (React PWA)                        │
│  ├─ Vercel hosting (global CDN)                 │
│  ├─ Service Worker (offline support)            │
│  ├─ IndexedDB (local cache)                     │
│  └─ Mobile-first, touch optimized               │
│                                                 │
│  PARENT DASHBOARD (React)                       │
│  ├─ Same Vercel hosting                         │
│  ├─ Desktop/responsive design                   │
│  ├─ Charts & analytics                          │
│  └─ No offline needed (web-only)                │
└─────────────────────────────────────────────────┘
                        ↕
API LAYER:
┌─────────────────────────────────────────────────┐
│  Express.js Backend (Node.js)                   │
│  ├─ AWS EC2 (auto-scaling)                      │
│  ├─ Load balancer (ALB)                         │
│  ├─ Redis (sessions + cache)                    │
│  └─ Rate limiting & auth                        │
└─────────────────────────────────────────────────┘
                        ↕
DATA LAYER:
┌─────────────────────────────────────────────────┐
│  PostgreSQL (AWS RDS)                           │
│  ├─ User accounts (student + parent)            │
│  ├─ Progress tracking                           │
│  ├─ Analytics & session logs                    │
│  └─ Notifications & settings                    │
│                                                 │
│  Redis Cache (ElastiCache)                      │
│  ├─ Sessions & auth tokens                      │
│  ├─ Leaderboard (real-time)                     │
│  ├─ Frequently accessed data                    │
│  └─ Cache layer (queries)                       │
│                                                 │
│  S3 + CloudFront (Content Delivery)             │
│  ├─ Exercise HTML files                         │
│  ├─ SVG visualizations                          │
│  ├─ Voice files (TTS)                           │
│  └─ Images & assets                             │
└─────────────────────────────────────────────────┘
                        ↕
EXTERNAL SERVICES:
┌─────────────────────────────────────────────────┐
│  RAG System (Separate, see RAG_SYSTEM_DESIGN)  │
│  ├─ /api/bot/explain endpoint                   │
│  └─ Returns explanations + variants             │
│                                                 │
│  Google Cloud TTS (Voice)                       │
│  ├─ Premium feature                             │
│  └─ Indonesian accent                           │
│                                                 │
│  SendGrid (Email)                               │
│  ├─ Daily parent reports                        │
│  └─ Notifications                               │
│                                                 │
│  Firebase Cloud Messaging (Push)                │
│  ├─ Practice reminders                          │
│  ├─ Achievement notifications                   │
│  └─ Alerts (parent dashboard)                   │
└─────────────────────────────────────────────────┘
```

## Technology Stack

```
FRONTEND:
  React 18+
  ├─ TypeScript (type safety)
  ├─ Redux Toolkit (state management)
  ├─ Tailwind CSS (styling)
  ├─ Framer Motion (animations)
  ├─ React Query (data fetching)
  ├─ Service Worker (offline)
  ├─ Dexie.js (IndexedDB wrapper)
  └─ Chart.js (analytics charts)

BACKEND:
  Node.js + Express.js
  ├─ TypeScript (type safety)
  ├─ PostgreSQL (primary DB)
  ├─ Redis (cache + sessions)
  ├─ JWT (authentication)
  ├─ Axios (HTTP client)
  ├─ Winston (logging)
  ├─ Joi (validation)
  └─ Socket.io (real-time leaderboard)

DEPLOYMENT:
  Frontend: Vercel
  Backend: AWS (EC2 + RDS + ElastiCache)
  CDN: CloudFront
  Monitoring: Sentry + DataDog
```

---

# 3. STUDENT APP - COMPLETE DESIGN

## 3.1 Information Architecture (IA)

```
STUDENT APP SCREENS:

├─ Auth Flow
│  ├─ Splash screen (loading)
│  ├─ Login screen
│  ├─ Register screen
│  ├─ Placement test (if new)
│  └─ Dashboard (after auth)
│
├─ Main Navigation (Tab bar, bottom)
│  ├─ 🏠 Dashboard (home)
│  ├─ 📝 Practice (main feature)
│  ├─ 🏆 Leaderboard (social)
│  ├─ 💬 Bot Chat (help)
│  └─ ⚙️ Settings (profile)
│
├─ Dashboard Flow
│  ├─ Quick stats (level, streak, XP, accuracy)
│  ├─ Current level progress bar
│  ├─ Concept mastery cards
│  ├─ Recommended next session
│  └─ [START PRACTICE] button
│
├─ Practice Flow (MAIN)
│  ├─ Problem display (with visual)
│  ├─ Input answer
│  ├─ Feedback (correct/wrong)
│  ├─ Optional: Bot explanation
│  ├─ Optional: Skip
│  └─ Session end summary
│
├─ Bot Chat Flow
│  ├─ Tab 1: GASING (concrete)
│  ├─ Tab 2: PMRI (visual)
│  ├─ Tab 3: LOGIKA (mental math)
│  ├─ Voice playback
│  └─ Helpful? (rating)
│
├─ Leaderboard Flow
│  ├─ Weekly rankings
│  ├─ Streak leaders
│  ├─ Personal rank & stats
│  └─ Filter by class/school
│
└─ Settings Flow
   ├─ Profile info
   ├─ Parent link (connect dashboard)
   ├─ Preferences (language, theme, sound)
   ├─ About & help
   └─ Logout
```

## 3.2 Dashboard Screen (Home)

```
┌─────────────────────────────────────────────────────┐
│ SPEED MATH MASTERS          [Settings]              │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 👤 Rafi, Grade 4 (8 years old)                    │
│                                                     │
│ ╔═════════════════════════════════════════════════╗ │
│ ║ TODAY'S SUMMARY                                 ║ │
│ ╠═════════════════════════════════════════════════╣ │
│ ║ ✓ 27 problems  │  91% accuracy                 ║ │
│ ║ 🔥 5-day streak │  +180 XP earned              ║ │
│ ║ ⏱️  15 min used  │  🏃 Running badge             ║ │
│ ╚═════════════════════════════════════════════════╝ │
│                                                     │
│ LEVEL 3 - ADDITION (Mixed, 1-5)                   │
│ ████████░░ 65% Complete (195/300 problems)       │
│ Estimate: Ready for Level 4 in 5 days            │
│                                                     │
│ MASTERY BY CONCEPT                                │
│ ├─ 📚 Addition 1-5:     94% 🐇 Rabbit           │
│ ├─ 📚 Subtraction 1-5:  78% 🚶 Walking          │
│ ├─ 📚 Multiplication:   Locked (next level)      │
│ └─ 📚 Division:         Locked                    │
│                                                     │
│ ╔═════════════════════════════════════════════════╗ │
│ ║       [►  START PRACTICE SESSION  ]             ║ │
│ ╚═════════════════════════════════════════════════╝ │
│                                                     │
│ This Week Rank: #7 / 45 students                  │
│ 💡 Tip: Subtraction needs 20 min today           │
│                                                     │
│ [🏠 Dashboard] [📝 Practice] [🏆 Board] [💬 Help]│
└─────────────────────────────────────────────────────┘
```

**Key Elements:**
- **Quick Stats:** Today's summary at top (first thing they see)
- **Streak Counter:** Big, motivating (🔥 5-day)
- **Level Progress:** Visual bar showing completion %
- **Mastery Cards:** Concept-by-concept breakdown with badge
- **CTA Button:** "START PRACTICE" - primary action
- **Personalized Tip:** Smart recommendation based on data
- **Leaderboard Rank:** Social motivation

## 3.3 Practice Session (Core Loop)

### Problem Display

```
┌─────────────────────────────────────────────────────┐
│ ⬅️ Level 3  7 / 30  ⏱️  2:14  🏃 Running        │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 🥜 Bayangkan kamu punya 7 kelereng.              │
│    Temanmu kasih 4 kelereng lagi.                │
│    Berapa kelereng kamu sekarang?                │
│                                                     │
│ ┌───────────────────────────────────────────────┐ │
│ │   🔵🔵🔵🔵🔵🔵🔵 + 🔵🔵🔵🔵              │ │
│ │   [SVG Animation: balls combining]           │ │
│ └───────────────────────────────────────────────┘ │
│                                                     │
│ 7 + 4 = ? ________                               │
│                                                     │
│ [?] [💬 Help]  [SUBMIT]                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Key Features:**
- **Problem Counter:** "7 / 30" (progress in session)
- **Timer:** Shows elapsed time (motivating, not stressful)
- **Speed Badge:** Current level badge (🏃 Running)
- **Context:** 🥜 Indonesian context (GASING pedagogy)
- **Visual:** Animated blocks/balls combining
- **Input:** Number input field
- **Help Buttons:** ? (hint) and 💬 (bot explanation)
- **Submit:** Large, clear button

### Feedback - Correct Answer

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   🎉 CORRECT! 🎉  [Confetti animation ✨✨✨]   │
│                                                     │
│   7 + 4 = 11 ✓                                    │
│                                                     │
│   Quick Trick:                                     │
│   "7 is close to 10, so 7+4 = (7+3)+1 = 11"     │
│                                                     │
│   +10 XP BASE  ⚡ +5 XP SPEED BONUS               │
│   ═════════════════════════════════════════       │
│   TOTAL: +15 XP (180/250 today)                   │
│                                                     │
│ ╔═════════════════════════════════════════════════╗ │
│ ║        [►  NEXT PROBLEM (8 / 30)  ]             ║ │
│ ╚═════════════════════════════════════════════════╝ │
│                                                     │
│ [Another way to solve] [View explanation]         │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Key Features:**
- **Celebration:** Emoji + confetti animation (dopamine hit)
- **Answer Verification:** Shows they got it right
- **Quick Trick:** Instantly teaches the shortcut
- **XP Breakdown:** Shows base + speed bonus (motivation)
- **Progress:** XP bar filling up
- **CTA:** Clear next button with problem count
- **Options:** Can see alternative explanations

### Feedback - Wrong Answer

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   ✗ TRY AGAIN                                      │
│   (You said: 10)                                   │
│                                                     │
│   Hint: 7 + 4... Count from 7: 8, 9, 10, 11     │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [ RETRY ]  [ EXPLAIN ]  [ SKIP ]                │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ Streak protection: 3 attempts remaining           │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Key Features:**
- **Gentle Feedback:** Not harsh, encouraging
- **User Answer Shown:** So they know what they said
- **Hint:** Helpful guidance (not the answer)
- **Three Options:** Retry / Explain / Skip (student choice)
- **Streak Protection:** After 3 wrong, can skip without losing streak
- **No XP Loss:** Failure doesn't punish (safe to try)

## 3.4 Bot Explanation Interface

```
┌─────────────────────────────────────────────────────┐
│ Student taps [EXPLAIN] on wrong answer             │
│                                                     │
│ ╔════════════════════════════════════════════════╗ │
│ ║ How would you like me to explain?              ║ │
│ ║ (Pick your learning style)                     ║ │
│ ╚════════════════════════════════════════════════╝ │
│                                                     │
│ ┌─────────────────────────────────────────────────┐ │
│ │ [🥜 GASING] [📊 PMRI] [⚡ LOGIKA]              │ │
│ └─────────────────────────────────────────────────┘ │
│                                                     │
│ TAB 1: 🥜 GASING (Cerita - Concrete)             │
│ ├─ "Bayangkan kamu punya 7 kelereng.             │
│ │  Temanmu kasih 4 kelereng lagi.                │
│ │  [Animation: circles combining]                │
│ │  Jadi 7 + 4 = 11 kelereng!                     │
│ │  Gampang, kan?"                                │
│ │                                                 │
│ │ 🔊 [Play voice explanation]                    │
│ │                                                 │
│ │ "Ini cara paling mudah untuk diingat"          │
│ ├─ [Mana yang paling membantu?]                  │
│ │  [GASING] [PMRI] [LOGIKA]                      │
│ └─ Feedback logged → Bot learns                  │
│                                                     │
│ TAB 2: 📊 PMRI (Visual - Pictorial)              │
│ ├─ "Number line:"                                 │
│ │ [Animation: 0----5----7----10----11]           │
│ │  Start di 7, lompat 4 kali ke 11.             │
│ │  7 + 4 = 11                                    │
│ │                                                 │
│ │ 🔊 [Play voice explanation]                    │
│ └─ [Mana yang paling membantu?]                  │
│                                                     │
│ TAB 3: ⚡ LOGIKA (Mental - Abstract)             │
│ ├─ "Kenapa ini trick cepat:"                     │
│ │  7 + 4 = (7 + 3) + 1 = 10 + 1 = 11            │
│ │                                                 │
│ │  Karena 10 adalah angka yang mudah!           │
│ │                                                 │
│ │ 🔊 [Play voice explanation]                    │
│ └─ [Mana yang paling membantu?]                  │
│                                                     │
│ ╔════════════════════════════════════════════════╗ │
│ ║     [Try Again] [View Another Way] [Skip]      ║ │
│ ╚════════════════════════════════════════════════╝ │
│                                                     │
└─────────────────────────────────────────────────────┘

FLOW:
  Student picks tab
    ↓
  Bot shows explanation (text + animation + optional voice)
    ↓
  Student rates: "Mana yang paling membantu?" (1-5 stars)
    ↓
  Bot logs effectiveness for this student/concept
    ↓
  Next time: Show most effective variant first
```

**Key Features:**
- **Three Variants:** GASING (concrete) / PMRI (visual) / LOGIKA (abstract)
- **Animated Explanations:** Not just text, visual learning
- **Voice Option:** Optional TTS (Google Cloud for Premium users)
- **Student Rating:** Bot learns which variant works best
- **Personalization:** Next time, most effective variant shown first
- **Language:** Simple Indonesian, no jargon, age-appropriate

## 3.5 Session End Summary

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│   🎉 GREAT SESSION, RAFI! 🎉                      │
│                                                     │
│ ╔═════════════════════════════════════════════════╗ │
│ ║ SESSION RESULTS                                 ║ │
│ ╠═════════════════════════════════════════════════╣ │
│ ║ Problems completed:  30/30                      ║ │
│ ║ Accuracy:           91%                         ║ │
│ ║ Average speed:      8.5 sec/problem             ║ │
│ ║ Session time:       15 min 23 sec               ║ │
│ ║ XP earned:          350 points                  ║ │
│ ║ Streak:             5 days maintained 🔥       ║ │
│ ╚═════════════════════════════════════════════════╝ │
│                                                     │
│ 🏆 NEW ACHIEVEMENTS UNLOCKED!                      │
│ ├─ ✨ 50 XP Milestone (earned 350 XP today)      │
│ ├─ 🚀 Speed improved by 1 sec (was 9.5 avg)     │
│ ├─ 🎯 5-day Streak Badge                         │
│ └─ 💪 2x Problems in one day (28→30)             │
│                                                     │
│ WEEKLY PROGRESS                                    │
│ Level 3: ████████░░ 72% Complete                 │
│ Estimate ready for Level 4: September 8 (5 days) │
│                                                     │
│ NEXT SESSION RECOMMENDATION:                       │
│ "Subtraction 1-5 needs practice (78% accuracy)"  │
│ Suggested: 10-min session tomorrow                │
│                                                     │
│ ╔═════════════════════════════════════════════════╗ │
│ ║ [ Continue Practice ] [ Back to Dashboard ]     ║ │
│ ╚═════════════════════════════════════════════════╝ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Key Features:**
- **Celebration:** Big emoji, positive reinforcement
- **Stats Breakdown:** All important metrics shown
- **Achievements:** What badges were earned today
- **Progress Projection:** When next level will be ready
- **Smart Recommendation:** Which skill to practice next
- **CTA Options:** Continue or go back

## 3.6 Leaderboard

```
┌─────────────────────────────────────────────────────┐
│ 🏆 WEEKLY CHAMPIONS              [Class v Global]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ #1  👑 Andi       1,250 XP  ⚡⚡⚡ 15-day 🔥     │
│ #2      Siti      1,180 XP  ⚡⚡   12-day 🔥     │
│ #3      Budi      1,095 XP  ⚡     8-day 🔥      │
│ #4  👉 Rafi        980 XP  🏃    5-day 🔥       │ ← YOU
│ #5      Citra       945 XP  🚶    3-day          │
│ #6      Widi        820 XP  🐢    2-day          │
│ #7      Asep        750 XP  🐢    1-day          │
│ #8      Dina        680 XP                       │
│ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─       │
│ #45     You-5      100 XP                       │
│                                                     │
│ FILTER BY: [Weekly] [Monthly] [All Time]         │
│ LEADERBOARD: [Class] [School] [Global]           │
│                                                     │
│ STREAK LEADERS (Consistency)                       │
│ 🔥 Andi: 15 days                                 │
│ 🔥 Siti: 12 days                                 │
│ 🔥 Budi: 8 days                                  │
│ 🔥 Rafi: 5 days (↑ growing!)                     │
│                                                     │
│ MY STATS THIS WEEK:                               │
│ ├─ Rank: #4 (↑ up from #6 last week)             │
│ ├─ XP: 980 (vs class avg 750)                    │
│ ├─ Streak: 5 days (best ever!)                   │
│ ├─ Speed badge: 🏃 Running                       │
│ └─ Next: Get to 🐇 Rabbit this week!             │
│                                                     │
│ [XP Earned] [Speed Race] [Streak Leaders]        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Key Features:**
- **Ranking:** Your position + nearby users
- **XP Display:** What they earned (motivating)
- **Speed Badges:** Visual representation of progress
- **Streak Display:** Consistency motivation
- **Filters:** By timeframe (weekly/monthly/all-time)
- **Scope:** Class / School / Global
- **Personal Stats:** How you compare to average
- **Social Motivation:** Friendly competition

## 3.7 Settings & Profile

```
┌─────────────────────────────────────────────────────┐
│ ⚙️  SETTINGS                                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│ PROFILE                                             │
│ Name: Rafi                                         │
│ Grade: 4                                           │
│ Age: 8                                             │
│ [✏️ Edit Profile]                                  │
│                                                     │
│ ACCOUNT                                             │
│ Email: rafi@example.com                            │
│ Created: September 1, 2026                         │
│ Account type: Free (upgrade to Premium ↑)         │
│                                                     │
│ PREFERENCES                                         │
│ Language: [Bahasa Indonesia ▼]                     │
│ Theme: [Light / Dark] ○ Light ● Dark              │
│ Sound effects: ✓ On                                │
│ Voice explanations: ✓ On (requires TTS - Premium) │
│                                                     │
│ PARENT LINK                                         │
│ Parent connected: ✓ Ibu (Rafi's Mom)             │
│ [View parent's account]                            │
│ [Disconnect parent]                                │
│                                                     │
│ OFFLINE DATA                                        │
│ Offline downloaded: 234 MB                         │
│ Cache age: Updated 2 hours ago                     │
│ [✓ Auto-sync when online]                         │
│ [Refresh now]                                      │
│                                                     │
│ ABOUT                                               │
│ Version: 1.0.5                                     │
│ Last updated: September 2, 2026                    │
│ [Help & FAQ] [Send feedback] [Privacy policy]     │
│                                                     │
│ [🔓 Logout]                                        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

# 4. PARENT DASHBOARD - COMPLETE DESIGN

## 4.1 Dashboard Home (Quick Overview)

```
┌──────────────────────────────────────────────────────┐
│ SPEED MATH MASTERS - PARENT DASHBOARD               │
│ [Bell notification] [Settings] [Account]             │
├──────────────────────────────────────────────────────┤
│                                                      │
│ QUICK SUMMARY - Rafi                                │
│ ╔══════════════════════════════════════════════════╗ │
│ ║ TODAY (September 2, 2026)                        ║ │
│ ╠══════════════════════════════════════════════════╣ │
│ ║ ✓ 27 problems solved     91% accuracy           ║ │
│ ║ 🔥 5-day streak maintained                      ║ │
│ ║ +350 XP earned today                            ║ │
│ ║ ⏱️  15 minutes invested                          ║ │
│ ║ 📈 Level 3 progress: 72%                        ║ │
│ ╚══════════════════════════════════════════════════╝ │
│                                                      │
│ ALERTS & RECOMMENDATIONS                            │
│ ⚠️  Subtraction accuracy at 78% (trending down)   │
│    → Recommend: 20 min practice on subtraction    │
│    → Best time: 4-5 PM (where focus is highest)   │
│                                                      │
│ ✅ Speed improving! 1 sec/day progress            │
│    → Keep up the momentum                          │
│                                                      │
│ SMART INSIGHTS                                       │
│ • Child learns best with PMRI (visual models)     │
│ • Optimal session: 15 min (longer → accuracy drops) │
│ • Best practice time: 4-5 PM (focus score 92%)    │
│ • Weak concept: Subtraction (needs intervention)  │
│                                                      │
│ ╔══════════════════════════════════════════════════╗ │
│ ║ [View Full Analytics] [Set Reminder]             ║ │
│ ╚══════════════════════════════════════════════════╝ │
│                                                      │
│ USAGE THIS WEEK                                      │
│ ├─ Mon: 15 min (25 problems, 89% accuracy)        │
│ ├─ Tue: 12 min (18 problems, 92% accuracy)        │
│ ├─ Wed: 0 min (missed day)                         │
│ ├─ Thu: 18 min (32 problems, 87% accuracy)        │
│ ├─ Fri: 15 min (27 problems, 91% accuracy)        │
│ ├─ Sat: 0 min (missed day)                         │
│ └─ Sun: 20 min (35 problems, 88% accuracy)        │
│                                                      │
│ Total: 80 min, 177 problems, 89% avg accuracy     │
│                                                      │
│ [Add child] [Manage children]                       │
│                                                      │
└──────────────────────────────────────────────────────┘
```

**Key Features:**
- **Today's Stats:** First thing parent sees
- **Smart Alerts:** Issues that need attention
- **Insights:** Personalized recommendations
- **Weekly Overview:** Daily breakdown at a glance
- **CTA:** "View Full Analytics" for deep dive

## 4.2 Detailed Analytics

```
┌──────────────────────────────────────────────────────┐
│ 📊 ANALYTICS - Rafi                                │
│ [Progress] [Accuracy] [Speed] [Usage]              │
├──────────────────────────────────────────────────────┤
│                                                      │
│ TAB 1: PROGRESS (Level Advancement)                │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Current Level: 3 - Addition (Mixed, 1-5)        │ │
│ │ Progress: ████████░░ 72% (195/300 problems)    │ │
│ │ Level completion ETA: September 8 (+5 days)    │ │
│ │                                                 │ │
│ │ Concept Mastery Breakdown:                      │ │
│ │ ├─ Addition 1-5:     94% ✅ Mastered          │ │
│ │ ├─ Subtraction 1-5:  78% ⚠️  Needs practice  │ │
│ │ ├─ Multiplication:   - (not started)          │ │
│ │ └─ Division:         - (locked)                │ │
│ │                                                 │ │
│ │ Time-to-Proficiency Analysis:                   │ │
│ │ ├─ Addition 1-5: 25 exercises (faster learner) │ │
│ │ ├─ Subtraction: 45 exercises (more practice)   │ │
│ │ └─ Class avg: 40 exercises per concept         │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ TAB 2: ACCURACY (Correctness Over Time)            │
│ ┌──────────────────────────────────────────────────┐ │
│ │ [LINE CHART: 7-day accuracy trend]              │ │
│ │ Mon Tue Wed Thu Fri Sat Sun                     │ │
│ │ 89% 92% --  87% 91% --  88%                     │ │
│ │                                                 │ │
│ │ Overall accuracy: 89%                           │ │
│ │ Target: 90%+                                    │ │
│ │ Status: On track (avg +0.5% per day)            │ │
│ │                                                 │ │
│ │ Concept-by-Concept:                             │ │
│ │ • Addition 1-5: 94% (strong)                   │ │
│ │ • Subtraction: 78% (needs focus)                │ │
│ │                                                 │ │
│ │ Days at 90%+: 3/7 (getting better)             │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ TAB 3: SPEED (Problem Solving Time)               │
│ ┌──────────────────────────────────────────────────┐ │
│ │ [LINE CHART: Avg time per problem (sec)]        │ │
│ │ Mon Tue Wed Thu Fri Sat Sun                     │ │
│ │ 9.2 9.1 --  8.8 8.5 --  8.3                     │ │
│ │                                                 │ │
│ │ Current average: 8.5 sec/problem                │ │
│ │ Improvement: -0.9 sec in 7 days                 │ │
│ │ Trend: ↓ Consistently improving                 │ │
│ │ Rate: -1.3 sec/week (excellent!)                │ │
│ │                                                 │ │
│ │ Speed Badge Progression:                        │ │
│ │ • 🐢 Turtle (15+ sec): Day 1                   │ │
│ │ • 🚶 Walking (12-15 sec): Day 2                │ │
│ │ • 🏃 Running (8-12 sec): Day 4 ← NOW          │ │
│ │ • 🐇 Rabbit (5-8 sec): Est. Day 8              │ │
│ │ • ⚡ Lightning (2-5 sec): Est. Week 3          │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
│ TAB 4: USAGE (Screen Time & Activity)             │
│ ┌──────────────────────────────────────────────────┐ │
│ │ Weekly Usage Pattern:                            │ │
│ │ • Mon: 15 min (on-app), 0 min (off-app)        │ │
│ │ • Tue: 12 min (on-app), 1 min (YouTube)        │ │
│ │ • Wed: 0 min (skipped)                          │ │
│ │ • Thu: 18 min (on-app), 2 min (Chrome)         │ │
│ │ • Fri: 15 min (on-app), 0 min (off-app)        │ │
│ │ • Sat: 0 min (skipped)                          │ │
│ │ • Sun: 20 min (on-app), 1 min (notifications)  │ │
│ │                                                 │ │
│ │ Total: 80 min in-app, 4 min off-app            │ │
│ │ Focus Score: 95% (excellent - minimal distraction) │
│ │                                                 │ │
│ │ Optimal Session Length: 15 min                  │ │
│ │ • <15 min: Good (focused)                      │ │
│ │ • 15-20 min: Best (zone)                       │ │
│ │ • >20 min: Accuracy drops                       │ │
│ └──────────────────────────────────────────────────┘ │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## 4.3 Usage & Screen Time Control

```
┌──────────────────────────────────────────────────────┐
│ 📱 USAGE MANAGEMENT                                │
├──────────────────────────────────────────────────────┤
│                                                      │
│ APP LOCK (Parental Control)                         │
│ Status: ✓ ENABLED                                   │
│                                                      │
│ Daily Limit:                                         │
│ ├─ Set to: 15 minutes per day                      │
│ ├─ Used today: 12 minutes                          │
│ ├─ Remaining: 3 minutes                            │
│ ├─ Time resets: Tomorrow 12:00 AM                  │
│ └─ [Adjust limit]                                  │
│                                                      │
│ Allowed Time Window:                                 │
│ ├─ Start: 4:00 PM                                  │
│ ├─ End: 6:00 PM                                    │
│ ├─ Current time: 4:45 PM (within window ✓)        │
│ └─ [Adjust window]                                 │
│                                                      │
│ Strict Mode:                                         │
│ ├─ Status: ✓ ENABLED                              │
│ ├─ When limit reached: App closes immediately     │
│ ├─ Override allowed: No (strict)                   │
│ └─ [Toggle strict mode]                           │
│                                                      │
│ Emergency Override:                                  │
│ ├─ Times used this month: 0                        │
│ ├─ [Request override] (requires parent password)   │
│ └─ Available for true emergencies only            │
│                                                      │
│ OFF-APP DETECTION (What child actually does)       │
│ ├─ When child leaves app: Logged                   │
│ ├─ Today: Child opened 1 other app                │
│ │  ├─ YouTube: 1 min (while waiting for next level) │
│ │  └─ Total off-app: 1 min                        │
│ ├─ Focus score: 95% (child stays focused)         │
│ └─ "This is healthy - minimal distraction"        │
│                                                      │
│ This Week Off-App Activity:                         │
│ ├─ YouTube: 4 min total (typical)                 │
│ ├─ Chrome: 2 min total (checking homework)        │
│ ├─ Maps: 1 min (location request)                │
│ ├─ Messages: 1 min (sibling chat)                 │
│ └─ Other: 0 min                                    │
│                                                      │
│ PARENT INSIGHT:                                      │
│ ✓ Healthy usage pattern                            │
│ ✓ Minimal distractions                             │
│ ✓ Not showing signs of app addiction               │
│ ✓ Sessions are focused (15-20 min optimal)         │
│                                                      │
│ RECOMMENDATION:                                      │
│ Keep current settings (15 min/day, 4-6 PM)        │
│ Focus time: After school, before dinner            │
│                                                      │
│ [Save settings] [Disable app lock]                 │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## 4.4 Smart Alarms & Reminders

```
┌──────────────────────────────────────────────────────┐
│ 🔔 ALARMS & REMINDERS                              │
├──────────────────────────────────────────────────────┤
│                                                      │
│ CONFIGURED REMINDERS:                               │
│                                                      │
│ Reminder 1: Daily Math Practice                     │
│ ├─ Time: 4:00 PM                                   │
│ ├─ Days: Monday - Friday                           │
│ ├─ Message: "Time for math! 2 days from 10-day    │
│ │            streak 🔥"                            │
│ ├─ Delivery: Push notification + Email             │
│ └─ [Edit] [Delete]                                 │
│                                                      │
│ Reminder 2: Weekend Catch-Up (Saturday)             │
│ ├─ Time: 2:00 PM                                   │
│ ├─ Message: "Don't break streak! Practice now?"    │
│ ├─ Delivery: Push notification only                │
│ └─ [Edit] [Delete]                                 │
│                                                      │
│ AUTOMATIC SMART ALERTS (Triggered by AI):           │
│                                                      │
│ ✓ Alert (Sept 2): "Subtraction accuracy at 78%"   │
│   Action: Set reminder for subtraction practice   │
│   Time: Suggested 4:00 PM (best focus time)       │
│   Status: Sent to parent ✓                         │
│                                                      │
│ ✓ Alert (Aug 31): "Ready for Level 4!"            │
│   Rafi has completed 72% of Level 3             │
│   Estimated ready: September 8                     │
│   Action: Parent notified                          │
│                                                      │
│ ✓ Alert (Aug 25): "Streak at risk (1 day)"        │
│   Rafi missed practice yesterday                   │
│   Action: Sent push notification reminder          │
│   Result: Rafi practiced next day ✓               │
│                                                      │
│ QUIET HOURS:                                         │
│ ├─ No notifications after: 9:00 PM                │
│ ├─ Resume notifications: 7:00 AM                  │
│ └─ [Edit quiet hours]                             │
│                                                      │
│ NOTIFICATION METHODS:                               │
│ ☑ Push Notifications (app alerts)                 │
│ ☑ Email (daily summary)                           │
│ ☐ SMS (critical alerts only)                      │
│ ☐ Voice message (Premium - AI call)               │
│                                                      │
│ [Add new reminder] [View all alerts]               │
│                                                      │
└──────────────────────────────────────────────────────┘
```

## 4.5 Daily Report (Email)

```
SUBJECT: Daily Math Report - Rafi [September 2, 2026]

Hi Bu (Mom),

Here's how Rafi did with math today:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✓ 27 problems solved
✓ 91% accuracy (great!)
✓ 15 minutes invested (healthy session)
✓ +350 XP earned

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CONCEPT BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Addition 1-5:     14 problems (93% accuracy) ✓
• Subtraction 1-5:  13 problems (88% accuracy) ⚠️

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
PROGRESS TRENDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Speed: ↑ Improving (+2 sec/day slower today vs yesterday)
       "Rafi solved problems 1 sec faster than yesterday!"

Accuracy: ↑ Consistent (88-93% this week)
          "No downward trend - good stability"

Streak: 5 days 🔥
        "One more day for 6-day badge!"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBSERVATIONS & RECOMMENDATIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ HEADS UP: Subtraction accuracy is slightly down (88%)
   This is normal - Rafi might need a few extra problems.
   
   👉 SUGGESTION: 
   • Practice 10-15 min on subtraction tomorrow
   • Best time: 4-5 PM (Rafi's best focus time)
   • We'll send a reminder at 3:50 PM

✅ WHAT'S GOING WELL:
   • Speed improving consistently
   • Accuracy stable above 88%
   • Focused sessions (no app-switching)
   • Staying motivated with streak

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
LEVEL PROGRESSION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Level 3 Progress: ████████░░ 72% (195/300 problems)
Estimated Ready: September 8, 2026 (+5 days)

When Level 4 is ready, Rafi will start:
→ Multiplication facts (1-5)
→ New speed targets
→ New badges to earn

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACHIEVEMENT UNLOCKED TODAY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏆 5-Day Streak Badge
   "Rafi has practiced 5 days in a row!"
   
💪 Speed Improvement
   "Speed improved by 1 sec compared to last week"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT ACTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[ View Full Dashboard ]
[ Set Reminder for Subtraction ]
[ Disable Reminders ]
[ Change Email Frequency ]

Tap any link above to take action right from this email.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Questions? [Contact Support] [FAQ]

Speed Math Masters Learning Coach 🤖
Powered by AI, focused on your child's growth 💪
```

---

# 5. DATABASE SCHEMA (User-Facing Only)

## Tables (Simplified for User App)

```sql
-- Users (students)
CREATE TABLE students (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  name VARCHAR(100),
  grade INT,
  age INT,
  current_level INT,
  
  -- Gamification
  total_xp INT DEFAULT 0,
  streak_days INT DEFAULT 0,
  speed_badge VARCHAR(50),
  
  -- Preferences
  preferred_explanation_style VARCHAR(50),
  language VARCHAR(20) DEFAULT 'id',
  
  -- Offline
  last_sync TIMESTAMP,
  offline_enabled BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Parents
CREATE TABLE parents (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  name VARCHAR(100),
  
  notification_preferences JSONB,
  app_lock_settings JSONB,
  time_limit_minutes INT DEFAULT 15,
  usage_window_start TIME,
  usage_window_end TIME,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);

-- Student-Parent relationship
CREATE TABLE student_parent_links (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  parent_id UUID REFERENCES parents(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Sessions (practice)
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  level INT,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  
  problems_attempted INT,
  problems_correct INT,
  accuracy_percent INT,
  
  xp_earned INT,
  streak_maintained BOOLEAN,
  achievements_unlocked JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Student answers (for analytics)
CREATE TABLE student_answers (
  id UUID PRIMARY KEY,
  session_id UUID REFERENCES sessions(id),
  student_id UUID REFERENCES students(id),
  exercise_id VARCHAR(100),
  
  answer_given VARCHAR(100),
  correct BOOLEAN,
  time_taken_ms INT,
  
  hint_used BOOLEAN,
  explanation_shown BOOLEAN,
  explanation_variant VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Leaderboard (denormalized for performance)
CREATE TABLE leaderboard_weekly (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  week_of DATE,
  
  rank INT,
  xp_total INT,
  streak_days INT,
  level_reached INT,
  
  updated_at TIMESTAMP
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES parents(id),
  message TEXT,
  type VARCHAR(50),
  
  scheduled_time TIMESTAMP,
  sent_time TIMESTAMP,
  method VARCHAR(50),
  status VARCHAR(50),
  
  created_at TIMESTAMP DEFAULT NOW()
);

-- Analytics (for personalization)
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  
  event_type VARCHAR(100),
  event_data JSONB,
  
  created_at TIMESTAMP DEFAULT NOW(),
  
  INDEX idx_student_created (student_id, created_at DESC)
);
```

---

# 6. API SPECIFICATION (User App Endpoints)

## Authentication Endpoints

```typescript
// Student Registration
POST /api/auth/student/register
Body: {
  email: string
  password: string
  name: string
  grade: number (3-12)
  age: number (8-17)
}
Response: {
  user_id: string
  token: string
  current_level: number
}

// Student Login
POST /api/auth/student/login
Body: { email, password }
Response: { user_id, token, current_level }

// Parent Registration
POST /api/auth/parent/register
Body: { email, password, name, child_id }
Response: { parent_id, token }

// Parent Login
POST /api/auth/parent/login
Body: { email, password }
Response: { parent_id, token }

// Verify Token
GET /api/auth/verify
Headers: { Authorization: Bearer <token> }
Response: { valid: boolean }
```

## Student App Endpoints

```typescript
// Get Dashboard Data
GET /api/student/dashboard
Response: {
  student: { name, grade, level, xp, streak }
  today: { problems_solved, accuracy, time_used }
  level_progress: { current_level, percent_complete }
  concept_mastery: [{ concept, percent, badge }]
  recommended_next_session: string
}

// Start Practice Session
POST /api/student/session/start
Body: { level: number }
Response: {
  session_id: string
  problems: [{ id, problem_text, visualization_type }]
}

// Submit Answer
POST /api/student/session/submit
Body: {
  session_id: string
  exercise_id: string
  answer: string
  time_taken_ms: number
}
Response: {
  correct: boolean
  correct_answer: string
  quick_trick: string
  xp_awarded: number
  speed_bonus: number
  next_problem_preview: { ... }
}

// Get Hint
GET /api/student/exercise/:exercise_id/hint
Response: { hint: string }

// Request Bot Explanation (triggers RAG)
POST /api/student/bot/explain
Body: {
  exercise_id: string
  student_answer: string
  correct_answer: string
  variant?: 'gasing' | 'pmri' | 'mental' | 'auto'
}
Response: {
  explanation: string
  variant_shown: string
  voice_url?: string
}

// Rate Explanation Helpfulness
POST /api/student/bot/rate
Body: {
  explanation_id: string
  rating: number (1-5)
  variant: string
}
Response: { success: boolean }

// End Session
POST /api/student/session/end
Body: {
  session_id: string
  total_xp: number
  achievements: string[]
}
Response: {
  summary: { ... },
  session_stats: { ... },
  badges_earned: [ ... ]
}

// Get Leaderboard
GET /api/student/leaderboard
Query: { period: 'week'|'month'|'all', limit: 10 }
Response: [{
  rank: number
  student_name: string
  xp_total: number
  streak_days: number
  current_badge: string
}]

// Get Personal Rank
GET /api/student/leaderboard/me
Response: {
  rank: number
  xp_total: number
  nearby_ranks: [{ rank, name, xp }]
}

// Sync Offline Data
POST /api/student/sync
Body: {
  offline_sessions: [ ... ],
  offline_answers: [ ... ]
}
Response: { synced_count: number, new_content?: [ ... ] }
```

## Parent Dashboard Endpoints

```typescript
// Get Child Progress
GET /api/parent/child/:child_id/dashboard
Response: {
  today_summary: { ... },
  level_progress: { ... },
  concept_mastery: { ... },
  usage_today: { ... },
  alerts: [ ... ]
}

// Get Detailed Analytics
GET /api/parent/child/:child_id/analytics
Query: { period: '7d'|'30d'|'all' }
Response: {
  accuracy_trend: [ ... ],
  speed_trend: [ ... ],
  concept_breakdown: { ... },
  time_investment: { ... },
  off_app_detection: { ... }
}

// Set Reminder
POST /api/parent/reminders
Body: {
  child_id: string
  time: string
  days: string[]
  message: string
  delivery_methods: string[]
}
Response: { reminder_id: string }

// Set App Lock
POST /api/parent/app-lock
Body: {
  child_id: string
  enabled: boolean
  daily_limit_minutes: number
  usage_window_start: string
  usage_window_end: string
  strict_mode: boolean
}
Response: { success: boolean }

// Get Daily Report
GET /api/parent/child/:child_id/daily-report
Query: { date: 'YYYY-MM-DD' }
Response: {
  summary: { ... },
  concepts: { ... },
  trends: { ... },
  alerts: [ ... ]
}

// Send Daily Report Email
POST /api/parent/send-daily-report
Body: { child_id, email }
Response: { sent: boolean }
```

---

# 7. USER JOURNEYS & FLOWS

## Complete Student User Journey (First Week)

```
DAY 1 - ONBOARDING:
├─ Download app (iOS/Android/Web)
├─ See splash screen (loading animation)
├─ Create account (name, grade, age)
├─ Watch 2-min onboarding tutorial
├─ Take placement test (10 min, adaptive)
│  └─ Placed at Level 4
├─ See welcome dashboard
│  └─ "You're ready for Level 4!"
├─ First practice session (20 min)
│  ├─ 20 problems
│  ├─ Feel gamification (XP, streaks)
│  └─ Unlock first achievement
├─ See session summary
│  └─ "Great start! 200 XP earned!"
└─ Done for day 1

DAY 2:
├─ Open app (remembers from yesterday)
├─ See dashboard (streak = 1 day)
├─ Notification: "Ready for another 15 min?"
├─ Practice session (15 min)
├─ Earn XP, extend streak
└─ Day 2 complete

DAYS 3-5:
├─ Daily practice (10-15 min)
├─ Streak growing (3 → 4 → 5 days)
├─ Leaderboard rank improving
├─ Achievements unlocking
└─ Learning solid foundation

WEEK 1 OUTCOME:
├─ 5 practice sessions completed
├─ 150 problems solved
├─ Average 90% accuracy
├─ Streak: 5 days (not broken)
├─ XP: 1,500 (vs goal 1,000) ✓
├─ Badges: 3 earned
├─ Engaged in app (feels like game, not homework)
└─ Parent connected dashboard
```

## Complete Parent User Journey (First Week)

```
DAY 1 - SETUP:
├─ Receive link from child's app
├─ Create parent account
├─ Connect to child's account
├─ See first dashboard
│  └─ Empty (waiting for child to practice)
└─ Get notification: "Child just started practice!"

DAY 2:
├─ Check dashboard (morning)
├─ See: "Rafi did 20 problems yesterday, 92% accuracy"
├─ Feel confident: "This app works!"
├─ Set reminder for today (4 PM)
└─ Child practices (prompted by notification)

DAY 3:
├─ Receive daily email report
├─ See progress: "Speed improving, accuracy stable"
├─ Notice: "Subtraction at 85%, needs practice"
├─ Set app lock (15 min/day, 4-6 PM)
└─ Child sees lock enforced

DAYS 4-5:
├─ Daily reports showing progress
├─ Analytics trending up
├─ Leaderboard rank: #7 in class
├─ Feeling good about learning
└─ Off-app time minimal (focused)

WEEK 1 OUTCOME:
├─ Dashboard setup complete
├─ Daily reports configured
├─ App lock working
├─ Reminders sent (child responds)
├─ 0 concerns about screen addiction (honest reporting)
├─ Seeing real learning progress
├─ Confidence in app: "This is worth Rp 99K/month"
└─ Ready to upgrade to Premium
```

---

# 8. GAMIFICATION SYSTEM

## XP System

```
BASE XP PER PROBLEM:
├─ Correct answer: +10 XP
├─ Speed bonus (faster than target): +2-5 XP
└─ First attempt (no hints): +5 XP
Total per correct problem: 15-20 XP

DAILY XP TARGETS:
├─ Light (5 problems): ~80 XP
├─ Normal (20 problems): ~320 XP
├─ Heavy (35+ problems): ~600+ XP

WEEKLY MILESTONES:
├─ 500 XP: +50 XP bonus
├─ 1000 XP: +100 XP bonus + special badge
├─ 2000 XP: +200 XP bonus + trophy

MONTHLY LEADERBOARD:
├─ Based on total XP earned
├─ Resets 1st of month
└─ Top 10 get badges
```

## Speed Badges (Progressive)

```
🐢 TURTLE (15+ seconds per problem)
   └─ Earned on: Day 1 (default starting badge)
   └─ Upgrade requirement: Solve 50 problems < 12 sec avg

🚶 WALKING (12-15 seconds per problem)
   └─ Earned on: ~Day 2-3 (natural progression)
   └─ Upgrade requirement: Solve 100 problems < 10 sec avg

🏃 RUNNING (8-12 seconds per problem)
   └─ Earned on: ~Day 4-5 (momentum building)
   └─ Upgrade requirement: Solve 150 problems < 7 sec avg

🐇 RABBIT (5-8 seconds per problem)
   └─ Earned on: ~Week 2 (committed learner)
   └─ Upgrade requirement: Solve 200 problems < 5 sec avg

⚡ LIGHTNING (2-5 seconds per problem)
   └─ Earned on: ~Month 2-3 (expert level)
   └─ Highest achievement, shows mastery
```

## Streak System

```
1-DAY STREAK: Just started
3-DAY STREAK: Getting momentum
5-DAY STREAK: Building habit 🔥
7-DAY STREAK: Full week (1-week badge)
14-DAY STREAK: Two weeks (2-week badge)
30-DAY STREAK: One month (1-month badge)
100-DAY STREAK: Legendary 🏆

STREAK PROTECTION:
├─ First skip: Can skip 1 day without losing streak
├─ After 3 days: Unlock skip (use once per week)
└─ If streak breaks: Starts over at 0

LOSS CONDITIONS:
├─ Miss 2+ days in a row: Streak ends
└─ Parent disables for too long: Resets

LOSS PREVENTION:
├─ Daily push notification (4 PM)
├─ Parent can set reminders
├─ Email alert if at risk
└─ SMS reminder (if Parent subscribed)
```

## Achievements (Unlockable Badges)

```
LEARNING MILESTONES:
├─ First Step: Solve 1 problem correctly
├─ Momentum: Solve 10 problems in one session
├─ Perfect: Solve 20 problems with 100% accuracy
├─ Speed Run: Solve 15 problems in <2 minutes
├─ Focus: 20-min session without phone switch

CONSISTENCY:
├─ Early Bird: Practice before 8 AM
├─ Night Owl: Practice after 6 PM
├─ Weekend Warrior: Practice on Saturday or Sunday
├─ Daily Grind: 7-day streak
├─ Unstoppable: 30-day streak

CONCEPT MASTERY:
├─ Addition Master: 95%+ accuracy on Level 1-2
├─ Subtraction Pro: 95%+ accuracy on Level 3
├─ Multiplication Genius: 95%+ accuracy on Level 4-5
├─ Master of All: Complete Level 1-5 with 90%+

SOCIAL:
├─ Socialite: Share score on leaderboard
├─ Climb: Move up 10 ranks on leaderboard
├─ Champion: #1 rank in weekly leaderboard
├─ Helpful: Rate explanations 100+ times
```

---

# 9. OFFLINE SUPPORT & SYNC

## Offline Architecture

```
WHAT GETS CACHED LOCALLY:
├─ 100 exercises per current level (~20MB)
├─ Bot explanations (text + voice, ~5MB)
├─ SVG visualizations (~3MB)
├─ User progress data (~1MB)
├─ Leaderboard cache (~2MB)
└─ Total: ~30MB cache per device

OFFLINE CAPABILITIES:
├─ Full practice sessions (no internet needed)
├─ Bot explanations (cached)
├─ View progress & stats
├─ No leaderboard (needs sync)
└─ No new content (needs sync)

OFFLINE STORAGE:
├─ IndexedDB (primary, 50MB limit)
├─ Service Worker cache (20MB limit)
├─ SQLite (mobile apps, unlimited)

AUTO-SYNC:
├─ When connection detected: Begin sync
├─ Queue all offline answers
├─ Upload to server
├─ Download new content (if any)
├─ Update leaderboard
├─ Clear offline cache
└─ Seamless (no user intervention)

SYNC FREQUENCY:
├─ Manual: [Sync now] button in settings
├─ Auto: Every time connection restored
├─ Scheduled: Once per day (if online)
└─ Smart: Prioritize critical data first
```

## Data Sync Flow

```
OFFLINE SESSION:
├─ Student solves 20 problems
├─ Answers stored in local IndexedDB
├─ Progress shown locally (optimistic UI)
├─ Session marked as "offline"

WHEN INTERNET RETURNS:
├─ Service Worker detects connection
├─ Queues sync operation
├─ Uploads: All offline answers + session data
├─ Server validates answers (anti-cheat)
├─ Server calculates XP, streak, badges
├─ Server returns confirmation
├─ App receives confirmation
├─ IndexedDB cleared (answers now on server)
├─ Leaderboard updated
├─ Parent dashboard refreshes
└─ User sees: "Synced 47 answers"

CONFLICT HANDLING:
├─ Last-write-wins (rare, < 1% of cases)
├─ Server has authority (never trust client)
├─ User notified if data conflicts
└─ Can resubmit if needed

STORAGE OPTIMIZATION:
├─ Compress answer data (gzip)
├─ Only cache needed exercises
├─ Delete cache after 2 weeks offline
└─ Average: 5-10MB per level
```

---

# 10. ANALYTICS & PERSONALIZATION

## What Gets Tracked

```
PER SESSION:
├─ Session ID, start/end time
├─ Problems attempted
│  ├─ Exercise ID
│  ├─ Time taken
│  ├─ Answer given
│  ├─ Correct/incorrect
│  └─ Hints used
├─ Bot interactions
│  ├─ Variant shown
│  ├─ Time in explanation
│  └─ Helpfulness rating
└─ Off-app switches (counts + duration)

PER DAY:
├─ Total time in app
├─ Total problems solved
├─ Average accuracy
├─ Speed improvements
├─ Streak status
└─ Achievements unlocked

PER CONCEPT:
├─ Problems seen
├─ Accuracy %
├─ Speed progression
├─ Time to proficiency
├─ Preferred variant
└─ Weak areas

PERSONALIZATION LOGIC:
├─ Rule-based (Days 1-3): Collect preferences
├─ Bot-driven (Days 4+): Show effective variants first
├─ ML-based (Week 2+): Predict optimal session length
└─ Curriculum adaptive (Month 2+): Custom pacing per student
```

---

# 11. IMPLEMENTATION TIMELINE

## 20-36 Week Development Plan

```
PHASE 1: FOUNDATION (Weeks 1-4)
├─ Week 1: Project setup, auth system
├─ Week 2: Dashboard UI (basic)
├─ Week 3: Practice session flow (core loop)
├─ Week 4: Feedback & summary screens
└─ Deliverable: Basic app working, not polished

PHASE 2: CORE FEATURES (Weeks 5-10)
├─ Week 5-6: Leaderboard & social features
├─ Week 7: Bot integration (stub with RAG)
├─ Week 8: Gamification (XP, badges, streak)
├─ Week 9: Analytics & personalization (basic)
├─ Week 10: Polish & bug fixes
└─ Deliverable: Fully functional app

PHASE 3: PARENT DASHBOARD (Weeks 11-16)
├─ Week 11-12: Dashboard home & analytics
├─ Week 13-14: App lock & usage controls
├─ Week 15: Reminders & notifications
├─ Week 16: Polish & testing
└─ Deliverable: Parent features working

PHASE 4: OFFLINE & ADVANCED (Weeks 17-24)
├─ Week 17-18: Service Worker & offline support
├─ Week 19-20: Data sync & conflict resolution
├─ Week 21-22: Advanced personalization (ML)
├─ Week 23-24: Performance optimization
└─ Deliverable: Offline app working perfectly

PHASE 5: LAUNCH PREP (Weeks 25-28)
├─ Week 25: QA & bug fixes
├─ Week 26: Load testing (1000+ concurrent)
├─ Week 27: Beta testing (50 users)
├─ Week 28: Iterate based on feedback
└─ Deliverable: App ready for production

PHASE 6: DEPLOYMENT (Weeks 29+)
├─ Week 29: App store submission (iOS/Android)
├─ Week 30: Marketing & launch prep
├─ Week 31+: Monitor, fix bugs, iterate
└─ Deliverable: Live app in production

TOTAL: 28-36 weeks (parallel with material generation)
```

---

# 12. DEPLOYMENT & LAUNCH

## Platform Support

```
TARGET PLATFORMS:
├─ WEB: https://app.speedmathmasters.com
│  ├─ Chrome, Firefox, Safari
│  ├─ Desktop & mobile browsers
│  └─ PWA installable on home screen
│
├─ iOS: App Store (coming Sept 2026)
│  ├─ iOS 14+
│  ├─ iPhone & iPad
│  └─ Built with React Native
│
└─ Android: Google Play (coming Sept 2026)
   ├─ Android 10+
   ├─ All Android devices
   └─ Built with React Native

RECOMMENDED ENTRY POINT:
└─ Web first (simplest, no app store)
   └─ "Install to home screen" for app-like experience
```

## Quality Metrics Before Launch

```
PERFORMANCE:
├─ First load: <3 seconds (on 4G)
├─ Practice screen: <200ms response
├─ Leaderboard: <500ms to display
└─ No crashes in 8-hour load test

USABILITY:
├─ 95%+ of new users understand without tutorial
├─ No user gets stuck for >2 min
├─ Onboarding drop-off: <20%
└─ App rating target: 4.5+/5

RELIABILITY:
├─ Uptime: 99.9% (calculated, not guaranteed)
├─ Data loss: 0% (tested in failures)
├─ Security: Zero known vulnerabilities
└─ Crash rate: <0.1% of sessions

BEFORE GO-LIVE:
├─ [ ] All backtests pass
├─ [ ] Load tests pass (1000 concurrent)
├─ [ ] 50-user beta testing complete
├─ [ ] Security audit completed
├─ [ ] Accessibility (WCAG AA) verified
├─ [ ] Offline sync tested thoroughly
├─ [ ] Push notifications working
├─ [ ] Analytics pipeline working
└─ [ ] Monitoring & alerts set up
```

---

# SUMMARY

You now have a **complete, production-ready design** for the Speed Math Masters user app. This document covers:

✅ **Complete student app** - All screens, features, UX flows  
✅ **Complete parent dashboard** - Analytics, controls, insights  
✅ **Gamification system** - XP, badges, streaks, leaderboard  
✅ **Offline support** - Works without internet, auto-sync  
✅ **Analytics & personalization** - Smart learning adaptation  
✅ **Database schema** - User-facing tables only  
✅ **API specification** - All endpoints for frontend  
✅ **Implementation timeline** - 28-36 weeks, phase-by-phase  
✅ **Launch checklist** - Quality gates before production  

**This document is everything you need to brief a frontend/backend team and start development immediately.**

**Next step:** Share this with your engineering team. They can start building against the API spec while material generation is ongoing.

---

**Speed Math Masters User App - Ready to build! 🚀**

