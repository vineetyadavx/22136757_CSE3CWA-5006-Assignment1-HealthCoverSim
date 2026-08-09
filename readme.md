# HealthCoverSim — Private Health Insurance Quote Simulator

A full-stack simulator that calculates estimated monthly and yearly private
health insurance premiums from cover type, hospital/extras tiers, applicant
ages, Lifetime Health Cover (LHC) loading, the family upgrade fee, and the
annual-payment discount. Built for CSE3CWA-5006, Assignment 1.

**This is a learning simulator only — not financial advice, and it does not
reflect any real insurer's actual pricing.**

## Tech stack

- **Frontend:** React (Vite) + React Router
- **Backend:** Node.js + Express
- **Database:** SQLite (via `better-sqlite3`)
- **Styling:** Plain CSS

## How to install and run

You need [Node.js](https://nodejs.org) (v18+) installed.

### 1. Backend

```bash
cd backend
npm install
node db.js       # creates healthcoversim.db and the quotes table (safe to re-run — no-op if it already exists)
node server.js   # starts the API at http://localhost:4000
```

### 2. Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev      # starts the app at http://localhost:5173
```

Open `http://localhost:5173` in your browser. The backend must be running
for the frontend to work, since every page fetches from `http://localhost:4000`.

## How the database is created

`backend/db.js` connects to (and creates, if missing) a SQLite file called
`healthcoversim.db`, and creates the `quotes` table if it doesn't already
exist, using `CREATE TABLE IF NOT EXISTS`. This means running `node db.js`
is always safe to repeat — it never wipes existing data. The table includes
`CHECK` constraints on fields like `cover_type` and `hospital_cover` as a
second line of defense underneath the application-level validation, so
invalid data can't be written to the database even if it somehow got past
the frontend and backend checks.

The database only stores the **raw input fields** — customer name, ages,
tier selections, and so on — never the calculated premium itself. I went
back and forth on this a bit, but decided storing a calculated number felt
risky: if I ever tweaked a price table, old quotes would show stale numbers
unless I remembered to recalculate them too. So instead `GET /quotes/:id`
just reads the raw row and runs the calculation fresh every time it's
viewed, which keeps the pricing logic in exactly one place.

## How the quote calculation works

All calculation logic lives in `backend/logic/calculateQuote.js`, kept
completely separate from the database and API layer so it could be tested
in isolation before anything else was built on top of it.

For each applicant, the hospital premium is calculated as: hospital premium = tier base price × (1 + LHC loading %)

LHC loading only applies to hospital cover, and only when:
- the applicant selected "No" prior cover history, **and**
- their age is over 30, **and**
- hospital cover is not "None"

The formula is `(age − 30) × 2%`. If cover history is "Yes", loading is 0%.
If it's "Not sure", loading is also 0%, but a warning is shown on the
explanation sheet saying the quote may be inaccurate.

Extras premium is calculated separately and never receives LHC loading —
the explanation sheet always states this explicitly, since it's easy to
assume loading applies everywhere once you see it applied to hospital cover.

The final premium is: monthly premium = hospital total (all applicants) + extras total (all applicants) + family fee
yearly before discount = monthly premium × 12
yearly after discount = yearly before × (1 − annual discount %) [only if paying Yearly]

## How Family cover is calculated

Family cover is priced as **2 adults**, exactly like Couple cover — children
aren't priced individually, since the brief specifies they're covered under
one policy without needing their own ages entered. On top of the 2-adult
hospital and extras calculation, a flat **$30/month family upgrade fee** is
added automatically; the user never enters this fee themselves, it's applied
by the backend whenever `coverType === "Family"`.

## Validation

Both the frontend (for instant feedback) and backend (as the actual source
of truth) validate: required fields, applicant ages between 18–100,
Applicant 2 fields required for Couple/Family, and the annual discount
between 0–10%. The backend validates independently of the frontend, since a
request can be sent to the API directly without going through the React
form at all — this was deliberately tested by sending a request straight to
`POST /quotes` with `curl`, missing the customer name, and confirming the
server returned a clean error response instead of crashing.

## AI use statement

I used Claude (Anthropic) as my main coding assistant for this project,
working inside VScode. It helped me with the first draft of most files — the
calculation logic, the SQLite schema, the Express routes, and the React
components — and I built on top of that rather than writing everything
from a blank file. It was also genuinely useful for explaining why things
work the way they do (e.g. why calculate the quote on read instead of
storing it), which mattered to me since I wanted to actually be able to
explain my own logic in the video, not just hand in something I couldn't
walk through.

A decent chunk of the back-and-forth was just Windows/PowerShell pain, to
be honest — `curl` quoting differently than I expected, Cursor's file
explorer collapsing empty folders and making me create files in the wrong
spot a couple of times, that kind of thing. None of that is really "AI
did my assignment," it's closer to rubber-duck debugging with someone who
already knows the answer.

A few things I decided on my own:
- `better-sqlite3` was really a spec decision, not an AI one — Section 3
  just says "SQLite" without naming a package, so I told Claude to pick
  something the spec actually asks for rather than whatever's trendy.
- I went with ESLint over Oxlint when Cursor's Vite setup asked, mainly
  because ESLint's more established and I'd rather troubleshoot something
  with more documentation if it breaks later.
- The edge-case testing was mine — I went through Section 9's list one at
  a time in the browser myself (missing Applicant 2, bad ages, discount
  out of range, hospital = None, extras-only, "Not sure" history, and
  hitting the API directly with curl to skip the form entirely), and threw
  in a couple of my own variations beyond what was suggested, mostly
  because I wanted to actually understand why each rule exists instead of
  just ticking it off.

Things I checked myself rather than just assuming they worked:
- Ran the pricing test script and matched it against the assignment's own
  Section 7 example — $472 monthly, $5,664 yearly before discount, $5,380.80
  after 5%.
- Ran the database script and checked Family quotes save both applicants,
  Single quotes leave Applicant 2 as NULL, and bad data actually gets
  rejected.
- Clicked through every CRUD action myself in the actual app, not just
  through the API.
- Went through every edge case above in the browser and watched the real
  output each time.

## Limitations

The Lifetime Health Cover loading calculation is simplified compared to the
real Australian LHC scheme — the real scheme caps the maximum loading and
removes it entirely after 10 years of continuous cover, neither of which
this simulator implements, since the assignment brief specifies the
simplified `(age − 30) × 2%` formula with no cap or removal rule.

