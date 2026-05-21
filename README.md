# Diaspora AI Task Manager

An elegant, premium, full-stack enterprise task processing and operational auditing application designed specifically for diaspora users managing local errands, financial transfers, and compliance in Kenya.

The platform integrates high-end **Generative AI reasoning (Google Gemini 2.5 Flash)** with a **Supabase relational database backend** and an **interactive glassmorphic operational dashboard**.

---

## 🛠️ Tech Stack

- **Frontend Core**: Vanilla HTML5, CSS Variables, and responsive CSS Grid/Flexbox layouts.
- **Frontend Interactivity**: Modern Vanilla browser Fetch API with dynamic DOM state management.
- **Backend Core**: Node.js and Express.js REST API with CORS middleware integration.
- **AI Reasoning**: Google Generative AI SDK utilizing the `gemini-2.5-flash` model.
- **Database & Persistence**: Supabase PostgreSQL client (real-time relational task tracking).
- **Environment Management**: dotenv (secure credentials loading) and Node.js native `--watch` for hot-reloading.

---

## 🚀 Setup & Execution Instructions

Follow these steps to launch the Diaspora Task Manager locally:

### 1. Prerequisite Configuration
Ensure you have Node.js (version 18+) installed. Clone the repository and configure your environment file.

Create a `.env` file in the root directory and insert your credentials:
```env
PORT=3000
SUPABASE_URL=your_supabase_url_here
SUPABASE_KEY=your_supabase_anon_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Dependency Installation
Initialize the node modules and load the required modules:
```bash
npm install
```

### 3. Initialize Server
Launch the backend development server. Node will watch for changes and keep the port listening:
```bash
npm run dev
```
*Expected log output:*
```
Server is running on port 3000
```

### 4. Access the Platform
- **Frontend client**: Open the [index.html](index.html) file directly in your web browser.
- **Operational Dashboard**: Click the **Dashboard** toggle at the top right of the navigation header to view live task records and transition task states.
- **API Health check**: Navigate to `http://127.0.0.1:3000/health` in your browser or client.

---

## 💡 Decisions I made and why

This section details key architectural decisions, course corrections, and compliance implementations resolved during the design and development lifecycle:

### 1. Which AI Tools I Used
- **Antigravity IDE**: Employed as the primary agentic development partner for code compilation, terminal scripting, database integration checks, and designing the premium, dark-mode glassmorphic client interface.
- **Gemini 2.5 Flash**: Selected as the backend AI brain. Its low latency, cost-efficiency, and native JSON schema-enforcement parameters made it the ideal engine for extracting task details and drafting automated communications in real-time.

### 2. System Prompt Design
To prevent model hallucination and guarantee transactional consistency, we designed a highly constrained and strict system instruction:
- **Strict JSON Enforcement**: The generation config forces `responseMimeType: 'application/json'` to avoid raw markdown delimiters (` ```json ` wrapper bugs) that break string parsing.
- **Intent Restriction Guardrails**: The instruction strictly restricts task classification to exactly one of 5 pre-approved intent keys (`send_money`, `get_airport_transfer`, `hire_service`, `verify_document`, `check_status`). Any unrecognized request is mapped to `unknown` or fails gracefully, ensuring predictable database inputs.

### 3. One Override Decision (Database SQL Dump)
During database schema creation, the AI originally compiled a `database.sql` seed dump using hallucinated transaction texts and bloated mock data. 
- **The Override**: To ensure absolute authenticity and matching verification streams, I manually overrode the generation. I directed the AI to rewrite the SQL dump file to populate the table using the **exact 5 raw input strings** tested in the UI:
  1. *'Send $500 to my mom in Nairobi for her airport taxi and verify her identity card.'*
  2. *'I need a taxi from JKIA to Westlands for two people.'*
  3. *'Please verify my passport document for the application.'*
  4. *'I want to hire a local plumber to fix a leak in my kitchen.'*
  5. *'Can you check the status of my recent transaction?'*
This ensured that the historical datasets completely matched our user acceptance criteria.

### 4. One Thing That Didn't Work (CORS & Local Loopback Mismatches)
When first launching the split-client structure, two distinct networking bugs stopped the client from communicating with the server:
- **CORS Block**: The browser refused to let the local client (`file:///...`) ingest tasks from the server (`http://localhost:3000`) due to cross-origin resource sharing limits. I resolved this by installing and configuring the Express `cors` package globally to allow all origins.
- **IPv6 Localhost Mismatch**: The browser's DNS resolution mapped `localhost` to the IPv6 loopback (`::1`) while the Node backend server was listening on the IPv4 loopback (`127.0.0.1`). This threw immediate connection rejection errors. I bypassed this by replacing all relative or `localhost` paths in `index.html`'s `fetch()` controllers with the explicit IPv4 address `http://127.0.0.1:3000`.

### 5. Risk Scoring Logic
Managing actions from diaspora users requires intelligent classification of financial and compliance risks. We built custom heuristics inside `server.js` tailored to the diaspora context:
- **High Risk (Score 85 - `send_money`)**: Financial remittances represent high compliance, fraud, and money-laundering risks. These transactions default to a score of 85, triggering immediate identity card checks.
- **Medium Risk (Score 60 - `verify_document`)**: Document submissions (such as passport or land registry uploads) represent data privacy and compliance risks. These default to 60, indicating that cross-checks against state registries (e.g., ArdhiSasa) are underway.
- **Low Risk (Score 10 - Standard Errands/Service provider coordination)**: Local household tasks (e.g., hiring plumbers) pose zero financial liability and default to a safe score of 10.
