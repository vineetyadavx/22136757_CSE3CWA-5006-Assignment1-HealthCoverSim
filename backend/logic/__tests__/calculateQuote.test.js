/**
 * Quick verification script — not a formal test framework, just plain Node
 * assertions so we can prove the logic matches the assignment brief before
 * building anything else on top of it. Run with: node calculateQuote.test.js
 */
const { calculateQuote, validateQuoteInput } = require("../calculateQuote");

let passed = 0;
let failed = 0;

function assertEqual(actual, expected, label) {
  if (actual === expected) {
    console.log(`✅ PASS: ${label} (${actual})`);
    passed++;
  } else {
    console.log(`❌ FAIL: ${label} — expected ${expected}, got ${actual}`);
    failed++;
  }
}

// ---------------------------------------------------------------
// TEST 1: Section 7 worked example — the assignment's own answer key
// Family, A1: 40/No, A2: 35/Yes, Silver hospital, Standard extras,
// Yearly with 5% discount.
// Expected: monthly $472, yearly before $5,664, yearly after $5,380.80
// ---------------------------------------------------------------
const workedExample = {
  coverType: "Family",
  applicant1Age: 40,
  applicant1CoverHistory: "No",
  applicant2Age: 35,
  applicant2CoverHistory: "Yes",
  hospitalCover: "Silver",
  extrasCover: "Standard",
  paymentFrequency: "Yearly",
  annualDiscount: 5,
};

const result1 = calculateQuote(workedExample);
console.log("\n--- Test 1: Section 7 Worked Example ---");
assertEqual(result1.applicants[0].loadingPercent, 20, "Applicant 1 LHC loading %");
assertEqual(result1.applicants[1].loadingPercent, 0, "Applicant 2 LHC loading %");
assertEqual(result1.hospitalTotal, 352, "Hospital total");
assertEqual(result1.extrasTotal, 90, "Extras total");
assertEqual(result1.familyFee, 30, "Family upgrade fee");
assertEqual(result1.monthlyPremium, 472, "Monthly premium");
assertEqual(result1.yearlyBeforeDiscount, 5664, "Yearly before discount");
assertEqual(result1.yearlyAfterDiscount, 5380.8, "Yearly after 5% discount");

// ---------------------------------------------------------------
// TEST 2: Single, no hospital cover at all (None) -> no LHC loading
// even if the user picked "No" history and is over 30.
// ---------------------------------------------------------------
const noHospitalCover = {
  coverType: "Single",
  applicant1Age: 45,
  applicant1CoverHistory: "No",
  hospitalCover: "None",
  extrasCover: "Basic",
  paymentFrequency: "Monthly",
};

const result2 = calculateQuote(noHospitalCover);
console.log("\n--- Test 2: Hospital = None -> no LHC loading applied ---");
assertEqual(result2.applicants[0].loadingPercent, 0, "No loading when hospital = None");
assertEqual(result2.hospitalTotal, 0, "Hospital total is $0");
assertEqual(result2.extrasTotal, 25, "Extras total (Basic, 1 adult)");
assertEqual(result2.monthlyPremium, 25, "Monthly premium (extras only)");
assertEqual(result2.yearlyAfterDiscount, null, "No yearly-after value when Monthly");

// ---------------------------------------------------------------
// TEST 3: "Not sure" history -> no loading applied, but warning shown
// ---------------------------------------------------------------
const notSureCase = {
  coverType: "Single",
  applicant1Age: 50,
  applicant1CoverHistory: "Not sure",
  hospitalCover: "Gold",
  extrasCover: "None",
  paymentFrequency: "Monthly",
};

const result3 = calculateQuote(notSureCase);
console.log("\n--- Test 3: 'Not sure' history ---");
assertEqual(result3.applicants[0].loadingPercent, 0, "No loading applied for 'Not sure'");
assertEqual(result3.warnings.length, 1, "One warning generated");

// ---------------------------------------------------------------
// TEST 4: Age <= 30 with "No" history -> loading is 0%, not negative
// ---------------------------------------------------------------
const youngNoHistory = {
  coverType: "Single",
  applicant1Age: 25,
  applicant1CoverHistory: "No",
  hospitalCover: "Basic",
  extrasCover: "None",
  paymentFrequency: "Monthly",
};

const result4 = calculateQuote(youngNoHistory);
console.log("\n--- Test 4: Age 25, No history -> 0% loading (not negative) ---");
assertEqual(result4.applicants[0].loadingPercent, 0, "0% loading for age <= 30");
assertEqual(result4.hospitalTotal, 90, "Hospital total unloaded");

// ---------------------------------------------------------------
// TEST 5: Validation catches missing Applicant 2 fields for Couple
// ---------------------------------------------------------------
console.log("\n--- Test 5: Validation - Couple missing Applicant 2 ---");
const invalidCouple = {
  customerName: "Test User",
  coverType: "Couple",
  applicant1Age: 30,
  applicant1CoverHistory: "Yes",
  hospitalCover: "Silver",
  extrasCover: "Basic",
  paymentFrequency: "Monthly",
};
const errors5 = validateQuoteInput(invalidCouple);
assertEqual(errors5.length > 0, true, "Validation errors present for missing Applicant 2");

// ---------------------------------------------------------------
// TEST 6: Validation catches out-of-range discount
// ---------------------------------------------------------------
console.log("\n--- Test 6: Validation - discount out of range ---");
const badDiscount = {
  customerName: "Test User",
  coverType: "Single",
  applicant1Age: 30,
  applicant1CoverHistory: "Yes",
  hospitalCover: "Silver",
  extrasCover: "Basic",
  paymentFrequency: "Yearly",
  annualDiscount: 15,
};
const errors6 = validateQuoteInput(badDiscount);
assertEqual(errors6.length > 0, true, "Validation errors present for discount > 10");

// ---------------------------------------------------------------
console.log(`\n=== RESULTS: ${passed} passed, ${failed} failed ===`);
process.exit(failed > 0 ? 1 : 0);