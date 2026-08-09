/**
 * server.js
 *
 * Express backend for HealthCoverSim. Exposes CRUD endpoints for quotes
 * (Section 10) and applies backend validation (Section 9) so invalid data
 * sent directly to the API — bypassing the React form entirely — is still
 * caught with a meaningful error instead of crashing the server or silently
 * producing a wrong quote.
 *
 * Design decision: the calculated premium is never stored. GET /quotes/:id
 * reads the raw stored inputs and calls calculateQuote() fresh every time,
 * so the pricing logic lives in exactly one place (backend/logic/calculateQuote.js).
 */
const express = require("express");
const cors = require("cors");
const db = require("./db");
const { calculateQuote, validateQuoteInput } = require("./logic/calculateQuote");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// ---------------------------------------------------------------
// Helper: map a DB row's snake_case columns into the camelCase shape
// calculateQuote() expects, and back again for inserts/updates.
// Keeping this conversion in one place avoids typos scattered across routes.
// ---------------------------------------------------------------
function rowToQuoteInput(row) {
  return {
    customerName: row.customer_name,
    coverType: row.cover_type,
    applicant1Age: row.applicant1_age,
    applicant1CoverHistory: row.applicant1_cover_history,
    applicant2Age: row.applicant2_age,
    applicant2CoverHistory: row.applicant2_cover_history,
    hospitalCover: row.hospital_cover,
    extrasCover: row.extras_cover,
    paymentFrequency: row.payment_frequency,
    annualDiscount: row.annual_discount,
    notes: row.notes,
  };
}

// ---------------------------------------------------------------
// POST /quotes — create a new quote
// ---------------------------------------------------------------
app.post("/quotes", (req, res) => {
  const input = req.body;
  const errors = validateQuoteInput(input);

  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const isCoupleOrFamily = input.coverType === "Couple" || input.coverType === "Family";

  const insert = db.prepare(`
    INSERT INTO quotes (
      customer_name, cover_type,
      applicant1_age, applicant1_cover_history,
      applicant2_age, applicant2_cover_history,
      hospital_cover, extras_cover, payment_frequency,
      annual_discount, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    const result = insert.run(
      input.customerName,
      input.coverType,
      Number(input.applicant1Age),
      input.applicant1CoverHistory,
      isCoupleOrFamily ? Number(input.applicant2Age) : null,
      isCoupleOrFamily ? input.applicant2CoverHistory : null,
      input.hospitalCover,
      input.extrasCover,
      input.paymentFrequency,
      input.paymentFrequency === "Yearly" ? Number(input.annualDiscount) || 0 : 0,
      input.notes || null
    );
    res.status(201).json({ id: result.lastInsertRowid });
  } catch (err) {
    // Database-level CHECK constraints are a second line of defense;
    // if one fires, it means invalid data slipped past validateQuoteInput.
    res.status(400).json({ errors: [err.message] });
  }
});

// ---------------------------------------------------------------
// GET /quotes — list all quotes (summary only, no calculation needed for a list view)
// ---------------------------------------------------------------
app.get("/quotes", (req, res) => {
  const rows = db.prepare("SELECT * FROM quotes ORDER BY created_at DESC").all();
  res.json(rows);
});

// ---------------------------------------------------------------
// GET /quotes/:id — one quote, WITH its calculated breakdown
// ---------------------------------------------------------------
app.get("/quotes/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM quotes WHERE id = ?").get(req.params.id);

  if (!row) {
    return res.status(404).json({ errors: ["Quote not found."] });
  }

  const input = rowToQuoteInput(row);
  const breakdown = calculateQuote(input);

  res.json({
    id: row.id,
    customerName: row.customer_name,
    coverType: row.cover_type,
    paymentFrequency: row.payment_frequency,
    annualDiscount: row.annual_discount,
    notes: row.notes,
    createdAt: row.created_at,
    // Raw stored inputs, useful for pre-filling an edit form
    raw: input,
    // Freshly calculated breakdown, per Section 8
    breakdown,
  });
});

// ---------------------------------------------------------------
// PUT /quotes/:id — update a quote
// ---------------------------------------------------------------
app.put("/quotes/:id", (req, res) => {
  const existing = db.prepare("SELECT id FROM quotes WHERE id = ?").get(req.params.id);
  if (!existing) {
    return res.status(404).json({ errors: ["Quote not found."] });
  }

  const input = req.body;
  const errors = validateQuoteInput(input);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const isCoupleOrFamily = input.coverType === "Couple" || input.coverType === "Family";

  const update = db.prepare(`
    UPDATE quotes SET
      customer_name = ?, cover_type = ?,
      applicant1_age = ?, applicant1_cover_history = ?,
      applicant2_age = ?, applicant2_cover_history = ?,
      hospital_cover = ?, extras_cover = ?, payment_frequency = ?,
      annual_discount = ?, notes = ?
    WHERE id = ?
  `);

  try {
    update.run(
      input.customerName,
      input.coverType,
      Number(input.applicant1Age),
      input.applicant1CoverHistory,
      isCoupleOrFamily ? Number(input.applicant2Age) : null,
      isCoupleOrFamily ? input.applicant2CoverHistory : null,
      input.hospitalCover,
      input.extrasCover,
      input.paymentFrequency,
      input.paymentFrequency === "Yearly" ? Number(input.annualDiscount) || 0 : 0,
      input.notes || null,
      req.params.id
    );
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ errors: [err.message] });
  }
});

// ---------------------------------------------------------------
// DELETE /quotes/:id
// ---------------------------------------------------------------
app.delete("/quotes/:id", (req, res) => {
  const existing = db.prepare("SELECT id FROM quotes WHERE id = ?").get(req.params.id);
  if (!existing) {
    return res.status(404).json({ errors: ["Quote not found."] });
  }

  db.prepare("DELETE FROM quotes WHERE id = ?").run(req.params.id);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`HealthCoverSim backend running on http://localhost:${PORT}`);
});