/**
 * db.js
 *
 * Connects to (and creates, if it doesn't exist yet) the SQLite database file
 * for HealthCoverSim, and ensures the `quotes` table exists with the schema
 * required by Section 10 of the assignment brief.
 *
 * Design decision: this table stores RAW INPUTS only (age, cover type, tier
 * selections, etc.) — never the calculated premium. The premium is always
 * recalculated fresh by backend/logic/calculateQuote.js whenever a quote is
 * read, so pricing logic lives in exactly one place (Section 10's own
 * recommendation).
 *
 * applicant2_age and applicant2_cover_history are nullable, since Single
 * cover has no second applicant.
 */
const Database = require("better-sqlite3");
const path = require("path");

// Database file lives alongside this script, as healthcoversim.db
const dbPath = path.join(__dirname, "healthcoversim.db");
const db = new Database(dbPath);

// Recommended for better write reliability with concurrent reads
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS quotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_name TEXT NOT NULL,
    cover_type TEXT NOT NULL CHECK (cover_type IN ('Single', 'Couple', 'Family')),

    applicant1_age INTEGER NOT NULL,
    applicant1_cover_history TEXT NOT NULL CHECK (applicant1_cover_history IN ('Yes', 'No', 'Not sure')),

    applicant2_age INTEGER,
    applicant2_cover_history TEXT CHECK (applicant2_cover_history IN ('Yes', 'No', 'Not sure') OR applicant2_cover_history IS NULL),

    hospital_cover TEXT NOT NULL CHECK (hospital_cover IN ('None', 'Basic', 'Bronze', 'Silver', 'Gold')),
    extras_cover TEXT NOT NULL CHECK (extras_cover IN ('None', 'Basic', 'Standard', 'Premium')),

    payment_frequency TEXT NOT NULL CHECK (payment_frequency IN ('Monthly', 'Yearly')),
    annual_discount REAL DEFAULT 0,

    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

module.exports = db;