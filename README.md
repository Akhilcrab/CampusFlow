<div align="center">

# 🎓 CampusFlow (.ai)
### *The Autonomous AI Academic Operating System for College Life*

[![Next.js](https://img.shields.io/badge/Next.js-16.2.9-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2.4-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![MongoDB Atlas](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-5.18.0-2D3748?style=for-the-badge&logo=prisma)](https://www.prisma.io/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-1.5_Flash-8E75B2?style=for-the-badge&logo=google)](https://ai.google.dev/)
[![Tesseract.js](https://img.shields.io/badge/Tesseract.js-v7.0.0-orange?style=for-the-badge)](https://tesseract.projectnaptha.com/)

<p align="center">
  <b>Turn messy WhatsApp group exports, professor circulars, and portal screenshots into organized assignments, placement trackers, calendar schedules, and desktop alerts in seconds.</b>
</p>

[Key Features](#-key-features) • [What It Helps In](#-what-it-helps-in-the-real-problem) • [Architecture Deep-Dive](#-architecture--how-it-works-deep-dive) • [Attendance Engine Math](#-predictive-attendance-risk-monitor--mathematical-model) • [Getting Started](#-getting-started) • [Upgrade Roadmap](#-future-upgrades--production-roadmap)

---

</div>

## 📌 Executive Summary

**CampusFlow** is an end-to-end intelligent academic workflow automation engine. Built with **Next.js 16**, **React 19**, **Prisma ORM**, and **MongoDB Atlas**, it solves information overload and missed academic deadlines for university students.

Instead of manually typing assignments, exam dates, or placement drive schedules into a calendar, students simply drag and drop raw WhatsApp chat logs (`.txt`) or upload screenshots of university ERP portals. CampusFlow uses **client-side Optical Character Recognition (OCR)** via `Tesseract.js` and **Google Gemini 1.5 Flash** (with a deterministic local regex NLP fallback) to extract tasks, compute priority levels based on deadline proximity, schedule multi-stage browser notifications, and automatically synchronize records into dedicated sub-modules (**Assignments**, **Placements**, and an **Academic Calendar**).

---

## 🎯 What It Helps In (The Real Problem)

### 1. Eliminating "Group Chat Noise" & Buried Deadlines
* **The Problem:** In college, 90% of academic announcements arrive through unorganized WhatsApp groups, Discord channels, or Telegram chats. Important deadlines (e.g., *"Submit OS Lab report tomorrow before 11:59 PM"*) are buried beneath hundreds of casual messages, memes, and chatter.
* **How CampusFlow Helps:** Students export the chat as a `.txt` file and drop it into CampusFlow. The system cleans out metadata (timestamps, sender handles, encryption banners), identifies academic entities, and structures them into an actionable inbox.

### 2. Zero-Server Portal Screenshot Parsing
* **The Problem:** Many colleges use legacy ERP portals or send circulars as image notices that cannot be copied or exported.
* **How CampusFlow Helps:** Students capture a screenshot and drop it into the Upload Center. CampusFlow runs `Tesseract.js` inside an in-browser Web Worker, extracting the text without sending raw images over the network or incurring server CPU charges.

### 3. Preventing Placement Rejections & Missed Registration Windows
* **The Problem:** Campus recruitment drives (TCS, Atlassian, Infosys) often have tight 24-hour registration windows with specific eligibility rules (CGPA, backlog policies). Missing the registration link means losing a job opportunity.
* **How CampusFlow Helps:** It detects placement notices, extracts the hiring role, salary package, location, and eligibility criteria, and feeds them directly into a **Placement Pipeline Kanban/Board** with interview tracking.

### 4. Avoiding Exam Debarment (Attendance Tracking)
* **The Problem:** Most universities enforce a strict 75% or 85% attendance rule. Students struggle to calculate how many consecutive classes they must attend to recover from a low percentage, or how many lectures they can safely skip for hackathons or sickness.
* **How CampusFlow Helps:** A dedicated **Attendance Risk Monitor** calculates the exact mathematical recovery threshold and displays real-time risk indicators (*"Critical Risk"*, *"Safe Zone"*, *"Must Attend"*).

---

## ⚡ Key Features

| Feature | Description | File Reference |
| :--- | :--- | :--- |
| **Smart Ingestion (Chat & Images)** | Drag-and-drop zone handling `.txt` chat exports and image screenshots (`image/*`). | [`FileUpload.tsx`](src/components/FileUpload.tsx) |
| **Client-Side OCR** | Zero-server image text extraction powered by `tesseract.js` in a browser Web Worker. | [`FileUpload.tsx`](src/components/FileUpload.tsx) |
| **Gemini 1.5 Flash AI Engine** | Structured JSON schema extraction with localized timezone context (`Asia/Kolkata`) for resolving relative dates (*"tomorrow by 5pm"*, *"this Friday"*). | [`gemini.ts`](src/lib/gemini.ts) |
| **Offline NLP / Regex Fallback** | Deterministic fallback parser using regex matching and date math if the Gemini API key is missing or calls fail. | [`gemini.ts`](src/lib/gemini.ts) |
| **Dynamic Priority Assignment** | Automated priority computation: **Critical** ($<3$h), **High** ($<24$h), **Medium** ($<72$h), and **Low** ($>72$h). | [`api/extract/route.ts`](src/app/api/extract/route.ts) |
| **Multi-Stage Reminders** | Category-based notification schedules (12h, 3h, 1h before deadline) + 15s instant demo reminder. | [`api/extract/route.ts`](src/app/api/extract/route.ts) |
| **Desktop Web Notifications** | Integrated polling service triggering native OS/browser desktop alerts via the HTML5 Notification API. | [`NotificationManager.tsx`](src/components/NotificationManager.tsx) |
| **Synthesized Audio Chimes** | Native Web Audio API oscillator synthesizing an ascending A-Major arpeggio chord without loading external MP3 files. | [`sound.ts`](src/lib/sound.ts) |
| **Cross-Module Sync Engine** | Centralized data synchronization that automatically propagates extracted tasks into Assignments, Placements, and Calendar events while purging duplicates. | [`services.ts`](src/lib/services.ts) |
| **Subject Assignment Board** | Dedicated tracker with search, subject grouping, status management (`Pending`, `In Progress`, `Completed`, `Overdue`), and custom reminder modals. | [`AssignmentsModule.tsx`](src/components/AssignmentsModule.tsx) |
| **Placement Pipeline** | Recruitment tracker displaying company profiles, roles, package compensation, eligibility, and interview date schedulers. | [`PlacementsModule.tsx`](src/components/PlacementsModule.tsx) |
| **42-Cell Monthly Calendar** | Unified interactive calendar grid displaying deadlines, exams, and academic events with agenda views. | [`CalendarModule.tsx`](src/components/CalendarModule.tsx) |
| **Attendance Risk Monitor** | Subject-wise attendance tracker with algebraic "Safe to Miss" and "Consecutive Recovery" predictors. | [`AttendanceDashboard.tsx`](src/components/AttendanceDashboard.tsx) |
| **Sandbox Reset & Seed Tools** | One-click demo controls to seed mock academic data or completely wipe the database for presentations. | [`api/items/route.ts`](src/app/api/items/route.ts) |

---

## 🏗️ Architecture & How It Works (Deep-Dive)

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
│  │ (Web Worker) │          │                     │            │
│  └──────┬───────┘          │                     │            │
│         │                  │                     │            │
│         └──────────────────┼─────────────────────┘            │
│                            ▼                                  │
│              ┌─────────────────────────┐                      │
│              │   Clean Extracted Text  │                      │
│              └────────────┬────────────┘                      │
│                           │                                   │
│  ┌────────────────────────┼──────────────────────────────┐    │
│  │  Dashboard UI (Next.js 16 + Tailwind 4 + React 19)    │    │
│  │  • Priority Feed  • Stat Cards  • Calendar View       │    │
│  │  • Assignments    • Placements  • Attendance          │    │
│  │  • Desktop Notifications (10s Polling Worker)         │    │
│  │  • Web Audio Chime Synthesizer                        │    │
│  └───────────────────────────────────────────────────────┘    │
└──────────────────────────────┬────────────────────────────────┘
                               │ HTTPS (JSON API Calls)
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
│  │  • Relative Dates  │      │                     │             │
│  │  • Classification  │      │                     │             │
│  │  • Fallback Engine │      │                     │             │
│  └────────┬───────────┘      │                     │             │
│           │                  │                     │             │
│           └──────────────────┼─────────────────────┘             │
│                              ▼                                   │
│                 ┌─────────────────────────┐                      │
│                 │   services.ts Sync Layer│                      │
│                 │  (Deduplication & Sync) │                      │
│                 └────────────┬────────────┘                      │
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
                 └─────────────────────────┘
```

### The Ingestion & AI Pipeline Explained

1. **Ingestion & Sanitization:**
   When a WhatsApp `.txt` file is uploaded, lines are processed through `cleanWhatsAppLine()` in `src/lib/gemini.ts`. This strips out system noise (e.g., `"Messages and calls are end-to-end encrypted"`, `"user joined using group link"`) and removes bracket-formatted timestamps (`[15/06/26, 09:30:15]`) and sender prefixes.
2. **Context-Aware Date Resolution:**
   Because LLMs lack inherent reference dates, conversational text like *"submit tomorrow by 5pm"* would normally fail or hallucinate. CampusFlow computes the exact server timestamp in Indian Standard Time (`Asia/Kolkata`):
   ```typescript
   const currentDateContext = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
   ```
   This is injected into Gemini's system instructions, enabling the model to calculate precise UTC ISO-8601 strings.
3. **Structured JSON Output:**
   Gemini 1.5 Flash is invoked with `responseMimeType: 'application/json'` and a strict JSON schema requiring:
   - `title`: Short action-oriented task name.
   - `category`: `ASSIGNMENT`, `EXAM`, `EVENT`, `PLACEMENT`, `NOTICE`, or `OTHER`.
   - `summary`: Concise 1-2 sentence description.
   - `deadlineISO`: Combined ISO-8601 date-time string.
   - Contextual fields: `subject`, `companyName`, `role`, `package`, `eligibilityText`.
4. **Deterministic Local Fallback:**
   If the Gemini API key is missing or the network call fails, CampusFlow automatically triggers `runFallbackExtractor()`. This regex-driven parser checks for academic keywords, extracts titles, parses 12h/24h time stamps, computes calendar offsets, and generates structured items offline.
5. **Multi-Module Dispatch & Deduplication:**
   When `POST /api/extract` receives structured items, it writes the main `ExtractedItem` with calculated priority and reminders. It then calls `createAssignmentOrPlacementFromAI()` in `src/lib/services.ts` to automatically populate the `Assignment`, `Placement`, and `AcademicCalendarEvent` models.

---

## 📊 Predictive Attendance Risk Monitor — Mathematical Model

University students face strict attendance thresholds (typically $75\%$). CampusFlow implements a zero-dependency mathematical prediction engine in `src/components/AttendanceRecovery.tsx` and `src/components/AttendanceMissCalculator.tsx`.

Let:
- $P$ = Number of classes currently **Present**
- $A$ = **Total** number of classes conducted to date
- $T$ = Target attendance percentage (e.g., $75$)
- $t = \frac{T}{100}$ (Target expressed as a fraction, e.g., $0.75$)

### 1. Attendance Recovery Formula (Consecutive Classes to Attend)
If a student's current percentage $\frac{P}{A} < t$, how many consecutive classes $x$ must they attend without missing any to restore their attendance to $T\%$?

$$\frac{P + x}{A + x} \ge t$$
$$P + x \ge t(A + x)$$
$$P + x \ge tA + tx$$
$$x(1 - t) \ge tA - P$$
$$x = \left\lceil \frac{tA - P}{1 - t} \right\rceil$$

*Example:* If a student has attended $16$ out of $25$ classes ($64\%$), and the required target is $75\%$ ($t = 0.75$):
$$x = \left\lceil \frac{0.75 \times 25 - 16}{1 - 0.75} \right\rceil = \left\lceil \frac{18.75 - 16}{0.25} \right\rceil = \left\lceil \frac{2.75}{0.25} \right\rceil = 11 \text{ consecutive classes}$$

### 2. "Safe to Miss" Formula (Bunk Calculator)
If a student's current percentage $\frac{P}{A} \ge t$, how many upcoming classes $m$ can they skip consecutively without dropping below $T\%$?

$$\frac{P}{A + m} \ge t$$
$$P \ge t(A + m)$$
$$P \ge tA + tm$$
$$\frac{P}{t} - A \ge m$$
$$m = \left\lfloor \frac{P}{t} - A \right\rfloor$$

*Example:* If a student has attended $21$ out of $25$ classes ($84\%$) with a target of $75\%$ ($t = 0.75$):
$$m = \left\lfloor \frac{21}{0.75} - 25 \right\rfloor = \lfloor 28 - 25 \rfloor = 3 \text{ classes safe to miss}$$

---

## 🗄️ Database Schema & Models

Data is persisted in **MongoDB Atlas** via **Prisma ORM** (`prisma/schema.prisma`).

```
                    ┌─────────────────────────┐
                    │          User           │
                    └────────────┬────────────┘
                                 │ 1:N
         ┌───────────────────────┼───────────────────────┐
         │ 1:N                   │ 1:N                   │ 1:N
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  ExtractedItem   │    │    Assignment    │    │    Placement     │
└────────┬─────────┘    └────────┬─────────┘    └────────┬─────────┘
         │ 1:N                   │ 1:N                   │ 1:1
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│     Reminder     │    │AssignmentReminder│    │PlacementApplicat.│
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

### Models Overview
- **`ExtractedItem`**: Central entity storing title, category (`ASSIGNMENT`, `EXAM`, `EVENT`, `PLACEMENT`, `NOTICE`, `OTHER`), summary, deadline, priority (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`), starred status, and completion state.
- **`Reminder`**: Child entity linking to an `ExtractedItem` with scheduled `reminderTime`, `isTriggered`, and `isDismissed` flags.
- **`Assignment`**: Academic task tracking subject, description, due date, status (`Pending`, `In Progress`, `Completed`, `Overdue`), and link to the original `sourceReference`.
- **`Placement`**: Recruitment drive tracker recording company name, role, package, location, eligibility, deadline, and overall status.
- **`PlacementApplication`**: Per-student application tracker tracking interview dates, application stages, and interview notes.
- **`AcademicCalendarEvent`**: Normalized event model feeding the 42-cell monthly calendar grid.

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.18+ or v20+
- **Package Manager**: `npm`, `pnpm`, or `bun`
- **MongoDB Database**: A free MongoDB Atlas cluster connection string
- **Google Gemini API Key**: Free key from [Google AI Studio](https://aistudio.google.com/) *(optional; fallback parser runs if omitted)*

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/Akhilcrab/CampusFlow.git
cd CampusFlow
npm install
```

### 2. Configure Environment Variables
Create a `.env` or `.env.local` file in the project root:
```env
# MongoDB Atlas Connection URL
DATABASE_URL="mongodb+srv://<username>:<password>@cluster0.mongodb.net/campusflow?retryWrites=true&w=majority"

# Google Gemini API Key
GEMINI_API_KEY="AIzaSyYourGeminiApiKeyHere"

# Optional JWT Secret (used for auth token utilities)
JWT_SECRET="your-super-secret-jwt-key-32-chars-minimum"
```

### 3. Generate Prisma Client
```bash
npx prisma generate
```

### 4. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Demonstration Files

CampusFlow includes pre-configured sample files for testing both OCR and chat parsing:
- **`chatwithakhil.txt`**: A realistic college WhatsApp group export containing an OS Lab assignment, a Calculus quiz notice, an Atlassian hiring announcement, and a hostel closure notice.
- **`demo_chat.txt`**: Comprehensive multi-module demo chat export.
- **`demo_files/`**: Dedicated text snippets for testing individual categories (`demo_assignment.txt`, `demo_exam.txt`, `demo_placement.txt`, `demo_event.txt`, `demo_notice.txt`).

### Quick Demonstration Flow:
1. Open the dashboard and click **"Reset Sandbox Data"** (clears old records and seeds fresh mock data).
2. Drag and drop `chatwithakhil.txt` into the **Upload Center**.
3. Watch the progress bar advance as Tesseract/FileReader reads the content and Gemini extracts structured tasks.
4. Listen for the synthesized rising A-major chime on completion.
5. Click **"Enable Notifications"** in the header to authorize desktop alerts and observe the 15-second simulation reminder.
6. Switch across the **Assignments**, **Placements**, and **Calendar** tabs to see synchronized entries.
7. Click **"Attendance"** in the navigation bar to test the mathematical recovery slider.

---

## 🔮 Future Upgrades & Production Roadmap

While CampusFlow functions as a complete academic productivity system, the following upgrades outline the path to an enterprise-grade production platform:

### 1. Multi-Tenant Authentication & Role-Based Access Control (RBAC)
* **Current State:** API routes operate in single-tenant sandbox mode for presentation convenience (`userId` is optional in schema).
* **Upgrade:** 
  - Integrate **NextAuth.js (Auth.js)** or activate the existing `src/lib/jwt.ts` utilities.
  - Implement Next.js `middleware.ts` to inspect session tokens and scope all Prisma queries by `userId`.
  - Add Google OAuth and university SSO (Single Sign-On).

### 2. Background Workers & Web Push Notifications (Off-Tab Alerts)
* **Current State:** Reminders are checked via `setInterval` in `<NotificationManager />` while the tab is open.
* **Upgrade:**
  - Transition from client-side polling to the **Web Push API** using service workers.
  - Integrate **Upstash QStash** or **Redis BullMQ** to schedule serverless webhook jobs that deliver notifications directly to mobile devices or desktop OS notifications even when the browser is closed.

### 3. Official WhatsApp Cloud API / Telegram Bot Webhook
* **Current State:** Students manually export and drop `.txt` files.
* **Upgrade:**
  - Register a **WhatsApp Cloud API** webhook or **Telegram Bot**.
  - Allow students to simply forward messages or screenshots directly to a CampusFlow phone number or bot handle, automatically ingesting tasks into their dashboard in real time.

### 4. LMS & Portal Direct Integration (Google Classroom & Canvas)
* **Current State:** Tasks are extracted from chats and screenshots.
* **Upgrade:**
  - Build two-way synchronization with **Google Classroom API** and **Canvas LMS API** to ingest official assignments and mark submissions automatically.

### 5. Vector Embeddings & RAG Academic Search
* **Current State:** Filtering is keyword-based across titles and subjects.
* **Upgrade:**
  - Store extracted summaries and course syllabi as vector embeddings in **MongoDB Atlas Vector Search** or **Pinecone**.
  - Enable natural language queries like: *"What assignments do I have due this week that require coding in C++?"*

### 6. Automated Test Suite
* **Current State:** Manual testing using sample files.
* **Upgrade:**
  - Set up **Vitest** for unit tests (priority math, date parsing, fallback regex validation).
  - Add **Playwright** for end-to-end tests validating drag-and-drop uploads, tab switching, and completion toggles.

---

## 🛠️ Tech Stack & Dependencies Summary

```json
{
  "dependencies": {
    "@google/generative-ai": "^0.24.1",
    "@prisma/client": "5.18.0",
    "bcryptjs": "^3.0.3",
    "clsx": "^2.1.1",
    "jose": "^6.2.3",
    "lucide-react": "^1.18.0",
    "next": "16.2.9",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "tailwind-merge": "^3.6.0",
    "tesseract.js": "^7.0.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "eslint": "^9",
    "eslint-config-next": "16.2.9",
    "prisma": "5.18.0",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
```

---

## 👨‍💻 Author & Repository

- **Project:** CampusFlow — AI Academic Operating System
- **Repository:** [https://github.com/Akhilcrab/CampusFlow.git](https://github.com/Akhilcrab/CampusFlow.git)
- **Author:** Akhil Crab ([akhilrwt2004@gmail.com](mailto:akhilrwt2004@gmail.com))

---
<div align="center">
  <sub>Built with ❤️ to help college students stay organized, protect their attendance, and never miss an academic deadline again.</sub>
</div>
