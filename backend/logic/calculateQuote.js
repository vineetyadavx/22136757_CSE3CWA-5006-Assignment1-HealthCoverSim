/**
 * calculateQuote.js
 *
 * Pure calculation engine for HealthCoverSim.
 * No database, no Express, no React — just input in, breakdown out.
 * This isolation makes it trivially testable against the Section 7 worked example,
 * and it's the single place all pricing rules live (backend route + frontend
 * preview, if you add one, both call this same logic — never duplicate it).
 */

// ---- Static price tables (Section 5) ----
const HOSPITAL_PRICES = {
    None: 0,
    Basic: 90,
    Bronze: 120,
    Silver: 160,
    Gold: 220,
  };
  
  const EXTRAS_PRICES = {
    None: 0,
    Basic: 25,
    Standard: 45,
    Premium: 70,
  };
  
  const FAMILY_UPGRADE_FEE = 30;
  
  /**
   * Calculates a single applicant's LHC loading percentage (Section 6).
   * @param {number} age
   * @param {"Yes"|"No"|"Not sure"} coverHistory
   * @param {string} hospitalCover - tier name, e.g. "None", "Silver"
   * @returns {{ loadingPercent: number, warning: string|null }}
   */
  function calculateLHCLoading(age, coverHistory, hospitalCover) {
    // No hospital cover selected -> nothing to load, regardless of history.
    if (hospitalCover === "None") {
      return { loadingPercent: 0, warning: null };
    }
  
    if (coverHistory === "Yes") {
      return { loadingPercent: 0, warning: null };
    }
  
    if (coverHistory === "Not sure") {
      return {
        loadingPercent: 0,
        warning:
          "Cover history is unknown — LHC loading has not been applied. This quote may be inaccurate.",
      };
    }
  
    // coverHistory === "No"
    if (age > 30) {
      const loadingPercent = (age - 30) * 2;
      return { loadingPercent, warning: null };
    }
  
    // age <= 30, no prior cover -> no loading yet
    return { loadingPercent: 0, warning: null };
  }
  
  /**
   * Validates raw quote input (Section 9). Returns an array of error strings;
   * empty array means valid. Both frontend and backend should reuse these rules
   * (frontend for instant feedback, backend as the source of truth).
   */
  function validateQuoteInput(input) {
    const errors = [];
  
    const {
      customerName,
      coverType,
      applicant1Age,
      applicant1CoverHistory,
      applicant2Age,
      applicant2CoverHistory,
      hospitalCover,
      extrasCover,
      paymentFrequency,
      annualDiscount,
    } = input;
  
    if (!customerName || !customerName.trim()) {
      errors.push("Customer name is required.");
    }
  
    if (!["Single", "Couple", "Family"].includes(coverType)) {
      errors.push("A valid cover type (Single, Couple, or Family) is required.");
    }
  
    if (!(hospitalCover in HOSPITAL_PRICES)) {
      errors.push("A valid hospital cover level is required.");
    }
  
    if (!(extrasCover in EXTRAS_PRICES)) {
      errors.push("A valid extras cover level is required.");
    }
  
    if (!["Monthly", "Yearly"].includes(paymentFrequency)) {
      errors.push("Payment frequency must be Monthly or Yearly.");
    }
  
    // Applicant 1 age
    const a1Age = Number(applicant1Age);
    if (!Number.isFinite(a1Age) || a1Age < 18 || a1Age > 100) {
      errors.push("Applicant 1 age must be a number between 18 and 100.");
    }
  
    if (!["Yes", "No", "Not sure"].includes(applicant1CoverHistory)) {
      errors.push("Applicant 1 hospital cover history must be Yes, No, or Not sure.");
    }
  
    // Applicant 2 only required for Couple / Family
    if (coverType === "Couple" || coverType === "Family") {
      const a2Age = Number(applicant2Age);
      if (applicant2Age === undefined || applicant2Age === null || applicant2Age === "") {
        errors.push("Applicant 2 age is required for Couple or Family cover.");
      } else if (!Number.isFinite(a2Age) || a2Age < 18 || a2Age > 100) {
        errors.push("Applicant 2 age must be a number between 18 and 100.");
      }
  
      if (!["Yes", "No", "Not sure"].includes(applicant2CoverHistory)) {
        errors.push("Applicant 2 hospital cover history is required for Couple or Family cover.");
      }
    }
  
    // Annual discount only meaningful for Yearly, but validate range whenever present
    if (paymentFrequency === "Yearly") {
      const discount = Number(annualDiscount);
      if (!Number.isFinite(discount) || discount < 0 || discount > 10) {
        errors.push("Annual discount must be a number between 0 and 10 (percent).");
      }
    }
  
    return errors;
  }
  
  /**
   * Calculates the full quote breakdown (Sections 5-8).
   * Assumes input has already passed validateQuoteInput (call that first).
   *
   * @param {Object} input
   * @param {string} input.coverType - "Single" | "Couple" | "Family"
   * @param {number} input.applicant1Age
   * @param {"Yes"|"No"|"Not sure"} input.applicant1CoverHistory
   * @param {number} [input.applicant2Age]
   * @param {"Yes"|"No"|"Not sure"} [input.applicant2CoverHistory]
   * @param {string} input.hospitalCover - tier name
   * @param {string} input.extrasCover - tier name
   * @param {"Monthly"|"Yearly"} input.paymentFrequency
   * @param {number} [input.annualDiscount] - 0-10, only used when Yearly
   */
  function calculateQuote(input) {
    const {
      coverType,
      applicant1Age,
      applicant1CoverHistory,
      applicant2Age,
      applicant2CoverHistory,
      hospitalCover,
      extrasCover,
      paymentFrequency,
      annualDiscount,
    } = input;
  
    const adultCount = coverType === "Single" ? 1 : 2;
    const hospitalBase = HOSPITAL_PRICES[hospitalCover];
    const extrasBase = EXTRAS_PRICES[extrasCover];
  
    const warnings = [];
  
    // --- Applicant 1 ---
    const a1 = calculateLHCLoading(Number(applicant1Age), applicant1CoverHistory, hospitalCover);
    const a1HospitalPremium = hospitalBase * (1 + a1.loadingPercent / 100);
    if (a1.warning) warnings.push(`Applicant 1: ${a1.warning}`);
  
    const applicants = [
      {
        label: "Applicant 1",
        age: Number(applicant1Age),
        coverHistory: applicant1CoverHistory,
        loadingPercent: a1.loadingPercent,
        hospitalPremium: round2(a1HospitalPremium),
      },
    ];
  
    let hospitalTotal = a1HospitalPremium;
  
    // --- Applicant 2 (Couple / Family only) ---
    if (coverType === "Couple" || coverType === "Family") {
      const a2 = calculateLHCLoading(Number(applicant2Age), applicant2CoverHistory, hospitalCover);
      const a2HospitalPremium = hospitalBase * (1 + a2.loadingPercent / 100);
      if (a2.warning) warnings.push(`Applicant 2: ${a2.warning}`);
  
      applicants.push({
        label: "Applicant 2",
        age: Number(applicant2Age),
        coverHistory: applicant2CoverHistory,
        loadingPercent: a2.loadingPercent,
        hospitalPremium: round2(a2HospitalPremium),
      });
  
      hospitalTotal += a2HospitalPremium;
    }
  
    const extrasTotal = extrasBase * adultCount;
    const familyFee = coverType === "Family" ? FAMILY_UPGRADE_FEE : 0;
  
    const monthlyPremium = hospitalTotal + extrasTotal + familyFee;
    const yearlyBeforeDiscount = monthlyPremium * 12;
  
    let yearlyAfterDiscount = null;
    if (paymentFrequency === "Yearly") {
      const discount = Number(annualDiscount) || 0;
      yearlyAfterDiscount = yearlyBeforeDiscount * (1 - discount / 100);
    }
  
    return {
      hospitalTotal: round2(hospitalTotal),
      extrasTotal: round2(extrasTotal),
      familyFee: round2(familyFee),
      monthlyPremium: round2(monthlyPremium),
      yearlyBeforeDiscount: round2(yearlyBeforeDiscount),
      yearlyAfterDiscount: yearlyAfterDiscount !== null ? round2(yearlyAfterDiscount) : null,
      applicants,
      warnings,
      lhcStatement:
        "Lifetime Health Cover loading applies only to hospital cover. It does not apply to extras cover.",
    };
  }
  
  function round2(n) {
    return Math.round(n * 100) / 100;
  }
  
  module.exports = {
    calculateQuote,
    calculateLHCLoading,
    validateQuoteInput,
    HOSPITAL_PRICES,
    EXTRAS_PRICES,
    FAMILY_UPGRADE_FEE,
  };