const db = require("./db");

console.log("--- Verifying quotes table exists ---");
const tableInfo = db.prepare("PRAGMA table_info(quotes)").all();
console.log(tableInfo.map((c) => `${c.name} (${c.type})`).join(", "));

console.log("\n--- Test: insert a Family quote (Applicant 2 present) ---");
const insert = db.prepare(`
  INSERT INTO quotes (
    customer_name, cover_type,
    applicant1_age, applicant1_cover_history,
    applicant2_age, applicant2_cover_history,
    hospital_cover, extras_cover, payment_frequency,
    annual_discount, notes
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const result = insert.run(
  "Test Family",
  "Family",
  40,
  "No",
  35,
  "Yes",
  "Silver",
  "Standard",
  "Yearly",
  5,
  "Sanity check row"
);
console.log("Inserted row id:", result.lastInsertRowid);

console.log("\n--- Test: insert a Single quote (Applicant 2 fields NULL) ---");
const insertSingle = insert.run(
  "Test Single",
  "Single",
  25,
  "Not sure",
  null,
  null,
  "Basic",
  "None",
  "Monthly",
  0,
  null
);
console.log("Inserted row id:", insertSingle.lastInsertRowid);

console.log("\n--- Reading rows back ---");
const rows = db.prepare("SELECT * FROM quotes").all();
console.log(rows);

console.log("\n--- Test: invalid cover_type should be rejected ---");
try {
  insert.run("Bad Row", "InvalidType", 30, "Yes", null, null, "Basic", "None", "Monthly", 0, null);
  console.log("❌ FAIL: invalid cover_type was accepted (should have been rejected)");
} catch (err) {
  console.log("✅ PASS: invalid cover_type correctly rejected —", err.message);
}

// Clean up test rows so this script is repeatable
db.prepare("DELETE FROM quotes").run();
console.log("\nTest rows cleaned up.");