# CampusFlow — Tech Architecture & User Workflow

---

## 1. Tech Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              CAMPUSFLOW ARCHITECTURE                             │
└─────────────────────────────────────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────────────────┐
│                     CLIENT (Browser)                           │
│                                                               │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐  │
│  │  Screenshot  │   │  WhatsApp    │   │  Manual Text     │  │
│  │  Upload      │   │  .txt Export │   │  Input           │  │
│  └──────┬───────┘   └──────┬───────┘   └────────┬─────────┘  │
│         │                  │                     │            │
│         ▼                  │                     │            │
│  ┌──────────────┐          │                     │            │
│  │ Tesseract.js │          │                     │            │
│  │  (OCR)       │          │                     │            │
│  └──────┬───────┘          │                     │            │
│         │                  │                     │            │
│         └──────────────────┼─────────────────────┘            │
│                            ▼                                  │
│              ┌─────────────────────────┐                      │
│              │   Raw Extracted Text    │                      │
│              └────────────┬────────────┘                      │
│                           │                                   │
│  ┌────────────────────────┼──────────────────────────────┐    │
│  │  Dashboard UI (Next.js + Tailwind + Shadcn/ui)        │    │
│  │  • Priority Feed  • Stat Cards  • Calendar View       │    │
│  │  • Assignments    • Placements  • Attendance          │    │
│  │  • Desktop Notifications (Browser Notification API)   │    │
│  └───────────────────────────────────────────────────────┘    │
└──────────────────────────────┬────────────────────────────────┘
                               │ HTTPS (API Calls)
                               ▼
┌──────────────────────────────────────────────────────────────────┐
│                   SERVER (Next.js API Routes)                     │
│                                                                  │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐ │
│  │ POST /api/     │  │ GET /api/items │  │ GET /api/calendar  │ │
│  │   extract      │  │ GET /api/      │  │ GET /api/summary   │ │
│  │                │  │   assignments  │  │ PUT/DELETE /api/    │ │
│  │                │  │ GET /api/      │  │   items/[id]       │ │
│  │                │  │   placements   │  │                    │ │
│  └───────┬────────┘  └───────┬────────┘  └────────┬───────────┘ │
│          │                   │                     │             │
│          ▼                   │                     │             │
│  ┌────────────────────┐      │                     │             │
│  │  Gemini 1.5 Flash  │      │                     │             │
│  │  (AI Extraction)   │      │                     │             │
│  │                    │      │                     │             │
│  │  • Structured JSON │      │                     │             │
│  │  • Date Parsing    │      │                     │             │
│  │  • Classification  │      │                     │             │
│  │  • Priority Calc   │      │                     │             │
│  └────────┬───────────┘      │                     │             │
│           │                  │                     │             │
│           └──────────────────┼─────────────────────┘             │
│                              ▼                                   │
│                 ┌─────────────────────────┐                      │
│                 │    Prisma ORM Layer     │                      │
│                 └────────────┬────────────┘                      │
└──────────────────────────────┼───────────────────────────────────┘
                               │
                               ▼
                 ┌─────────────────────────┐
                 │    MongoDB Atlas        │
                 │                         │
                 │  • ExtractedItems       │
                 │  • Assignments          │
                 │  • Placements           │
                 │  • Reminders            │
                 │  • Calendar Events      │
                 │  • User Preferences     │
                 └─────────────────────────┘
```

---

## 2. User Workflow — 3-Step Visual Flow

```
╔═══════════════════════════════════════════════════════════════════════════════╗
║                    HOW A STUDENT USES CAMPUSFLOW                             ║
╚═══════════════════════════════════════════════════════════════════════════════╝

  STEP 1                      STEP 2                       STEP 3
  ─────────                   ─────────                    ─────────
  📤 UPLOAD                   🤖 AI PROCESSES              📋 ACT & TRACK

┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────────┐
│                 │     │                      │     │                     │
│  Student drops  │     │  Gemini AI extracts: │     │  Smart Dashboard:   │
│  a screenshot   │────▶│                      │────▶│                     │
│  or WhatsApp    │     │  ✓ Title & Category  │     │  ✓ Priority Feed    │
│  chat export    │     │  ✓ Deadline & Time   │     │  ✓ Auto Reminders   │
│                 │     │  ✓ Priority Level    │     │  ✓ Calendar View    │
│  ┌───────────┐  │     │  ✓ Action Required   │     │  ✓ Mark Complete    │
│  │ 📷 or 📄 │  │     │  ✓ Subject/Company   │     │  ✓ Desktop Alerts   │
│  └───────────┘  │     │                      │     │                     │
│                 │     │  Classifies into:    │     │  Never miss a       │
│  Supports:      │     │  📝 Assignment       │     │  deadline again!    │
│  • Screenshots  │     │  📚 Exam             │     │                     │
│  • .txt exports │     │  💼 Placement        │     │                     │
│  • Copy-paste   │     │  🎉 Event            │     │                     │
│                 │     │  📢 Notice           │     │                     │
└─────────────────┘     └──────────────────────┘     └─────────────────────┘

         │                        │                          │
         ▼                        ▼                          ▼
   "Zero manual                "Instant                  "Proactive
    data entry"            classification"              notifications"
```

---

## 3. Data Flow Sequence (Technical)

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  Student │     │  Browser │     │ Next.js  │     │  Gemini  │     │ MongoDB  │
│          │     │  Client  │     │  API     │     │  AI      │     │  Atlas   │
└────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘     └────┬─────┘
     │                │                │                │                │
     │ 1. Upload      │                │                │                │
     │ screenshot/txt │                │                │                │
     │───────────────▶│                │                │                │
     │                │                │                │                │
     │                │ 2. OCR (if img)│                │                │
     │                │───────┐        │                │                │
     │                │       │Tesseract│               │                │
     │                │◀──────┘        │                │                │
     │                │                │                │                │
     │                │ 3. POST /api/  │                │                │
     │                │    extract     │                │                │
     │                │───────────────▶│                │                │
     │                │                │                │                │
     │                │                │ 4. Send text   │                │
     │                │                │───────────────▶│                │
     │                │                │                │                │
     │                │                │ 5. Structured  │                │
     │                │                │    JSON back   │                │
     │                │                │◀───────────────│                │
     │                │                │                │                │
     │                │                │ 6. Calculate priority           │
     │                │                │    + Generate reminders         │
     │                │                │                │                │
     │                │                │ 7. Save item + │                │
     │                │                │    reminders   │                │
     │                │                │───────────────────────────────▶│
     │                │                │                │                │
     │                │ 8. Return item │                │                │
     │                │◀───────────────│                │                │
     │                │                │                │                │
     │ 9. Dashboard   │                │                │                │
     │    updates +   │                │                │                │
     │    notification│                │                │                │
     │◀───────────────│                │                │                │
     │                │                │                │                │
```

---

## 4. Priority Classification Engine

```
┌─────────────────────────────────────────────────────────────────┐
│              SMART PRIORITY CALCULATION                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   Deadline Distance          Priority        Color    Action    │
│   ─────────────────          ────────        ─────    ──────    │
│                                                                 │
│   ⏰ < 3 hours away     ──▶  🔴 CRITICAL    Red      Instant   │
│                                                       Alert     │
│                                                                 │
│   ⏰ < 24 hours away    ──▶  🟠 HIGH        Amber    Remind    │
│                                                       every hr  │
│                                                                 │
│   ⏰ < 3 days away      ──▶  🔵 MEDIUM      Blue     Remind    │
│                                                       1d before │
│                                                                 │
│   ⏰ > 3 days away      ──▶  ⚪ LOW         Slate    Track     │
│                                                       only      │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  Reminder Schedule (Auto-Generated):                            │
│                                                                 │
│  ASSIGNMENT  →  12h, 3h, 1h before deadline                    │
│  EXAM        →  24h, 12h, 3h, 1h before deadline               │
│  PLACEMENT   →  48h, 24h, 12h before deadline                  │
│  EVENT       →  24h, 3h before event                           │
│  NOTICE      →  24h, 1h before deadline                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. Module Map

```
┌─────────────────────────────────────────────────────────────────┐
│                     CAMPUSFLOW MODULES                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ 📤 Smart    │  │ 📋 Priority │  │ 📅 Academic Calendar    │ │
│  │   Upload    │  │   Feed      │  │    (Unified View)       │ │
│  │             │  │             │  │                         │ │
│  │ OCR + TXT   │  │ Real-time   │  │ Assignments + Exams +   │ │
│  │ parsing     │  │ sorted view │  │ Placements + Events     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ 📝 Assign-  │  │ 💼 Place-   │  │ 📊 Attendance           │ │
│  │   ments     │  │   ments     │  │    Tracker              │ │
│  │             │  │             │  │                         │ │
│  │ Track &     │  │ Apply &     │  │ Subject-wise stats      │ │
│  │ submit      │  │ track apps  │  │ + miss calculator       │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │ 🔔 Notifi-  │  │ 📈 Daily    │  │ 🤖 AI Engine            │ │
│  │   cations   │  │   Summary   │  │                         │ │
│  │             │  │             │  │ Gemini 1.5 Flash        │ │
│  │ Desktop +   │  │ Today's     │  │ + Local Fallback        │ │
│  │ in-app      │  │ overview    │  │ (Regex NLP)             │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Tech Stack Summary (For Presentation Slide)

```
┌──────────────────────────────────────────────────────────┐
│                    TECH STACK                             │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend    │  Next.js 14 (App Router) + TypeScript     │
│              │  Tailwind CSS + Shadcn/ui + Lucide Icons  │
│              │                                           │
│  AI/ML      │  Google Gemini 1.5 Flash (Structured JSON)│
│              │  + Regex NLP Fallback Engine              │
│              │                                           │
│  OCR        │  Tesseract.js (Client-side, zero server   │
│              │  load)                                    │
│              │                                           │
│  Backend    │  Next.js API Routes (Serverless)          │
│              │  Prisma ORM                               │
│              │                                           │
│  Database   │  MongoDB Atlas (Document-based, flexible) │
│              │                                           │
│  Alerts     │  Browser Notification API + Polling       │
│              │                                           │
│  Deploy     │  Vercel (Zero-config deployment)          │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 7. Key Differentiators (Presentation Talking Points)

```
┌─────────────────────────────────────────────────────────────────┐
│  WHY CAMPUSFLOW?                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ❌ Problem:  Students receive 50+ messages/day across          │
│              WhatsApp groups, notice boards, and portals.       │
│              Critical deadlines get buried.                     │
│                                                                 │
│  ✅ Solution: One upload → AI extracts → Smart dashboard       │
│              with priority alerts. Zero manual data entry.      │
│                                                                 │
│  🚀 USP:                                                        │
│     1. Works with EXISTING data (screenshots + chat exports)   │
│     2. No app installations needed (PWA-ready web app)         │
│     3. AI with local fallback (works without internet)         │
│     4. Proactive reminders (don't check, get notified)         │
│     5. Privacy-first (OCR runs in-browser, not on server)      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```
