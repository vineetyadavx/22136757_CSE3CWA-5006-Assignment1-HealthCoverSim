import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createQuote } from "../api/quotes";

/**
 * CreateQuotePage — Section 11's quote-creation form.
 *
 * Key requirement from Section 11: "Applicant 2 fields must appear only
 * when Couple or Family is selected (React conditional rendering)."
 * That's handled below by simply checking `coverType` before rendering
 * that block of inputs.
 *
 * Frontend validation here mirrors backend/logic/calculateQuote.js's
 * validateQuoteInput() rules, but is re-implemented as simple inline checks
 * for instant user feedback. The backend re-validates independently — never
 * trust the frontend alone, since Section 9 explicitly says users can send
 * invalid data straight to the API.
 */
const initialForm = {
  customerName: "",
  coverType: "Single",
  applicant1Age: "",
  applicant1CoverHistory: "Yes",
  applicant2Age: "",
  applicant2CoverHistory: "Yes",
  hospitalCover: "None",
  extrasCover: "None",
  paymentFrequency: "Monthly",
  annualDiscount: "",
  notes: "",
};

function CreateQuotePage() {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

  const isCoupleOrFamily = form.coverType === "Couple" || form.coverType === "Family";

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function validate() {
    const errs = [];

    if (!form.customerName.trim()) {
      errs.push("Customer name is required.");
    }

    const a1Age = Number(form.applicant1Age);
    if (!form.applicant1Age || a1Age < 18 || a1Age > 100) {
      errs.push("Applicant 1 age must be between 18 and 100.");
    }

    if (isCoupleOrFamily) {
      const a2Age = Number(form.applicant2Age);
      if (!form.applicant2Age || a2Age < 18 || a2Age > 100) {
        errs.push("Applicant 2 age is required and must be between 18 and 100 for Couple or Family cover.");
      }
    }

    if (form.paymentFrequency === "Yearly") {
      const discount = Number(form.annualDiscount);
      if (form.annualDiscount === "" || discount < 0 || discount > 10) {
        errs.push("Annual discount must be between 0 and 10 (percent) when paying Yearly.");
      }
    }

    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    setErrors([]);

    try {
      const payload = {
        ...form,
        applicant2Age: isCoupleOrFamily ? form.applicant2Age : null,
        applicant2CoverHistory: isCoupleOrFamily ? form.applicant2CoverHistory : null,
        annualDiscount: form.paymentFrequency === "Yearly" ? Number(form.annualDiscount) : 0,
      };
      const result = await createQuote(payload);
      navigate(`/quotes/${result.id}`);
    } catch (err) {
      setErrors([err.message]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h2>New Quote</h2>

      {errors.length > 0 && (
        <div className="error-box" role="alert">
          <ul>
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="quote-form">
        <label>
          Customer name
          <input
            type="text"
            name="customerName"
            value={form.customerName}
            onChange={handleChange}
          />
        </label>

        <label>
          Cover type
          <select name="coverType" value={form.coverType} onChange={handleChange}>
            <option value="Single">Single</option>
            <option value="Couple">Couple</option>
            <option value="Family">Family</option>
          </select>
        </label>

        <fieldset>
          <legend>Applicant 1</legend>
          <label>
            Age
            <input
              type="number"
              name="applicant1Age"
              min="18"
              max="100"
              value={form.applicant1Age}
              onChange={handleChange}
            />
          </label>
          <label>
            Hospital cover history
            <select
              name="applicant1CoverHistory"
              value={form.applicant1CoverHistory}
              onChange={handleChange}
            >
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Not sure">Not sure</option>
            </select>
          </label>
        </fieldset>

        {isCoupleOrFamily && (
          <fieldset>
            <legend>Applicant 2</legend>
            <label>
              Age
              <input
                type="number"
                name="applicant2Age"
                min="18"
                max="100"
                value={form.applicant2Age}
                onChange={handleChange}
              />
            </label>
            <label>
              Hospital cover history
              <select
                name="applicant2CoverHistory"
                value={form.applicant2CoverHistory}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Not sure">Not sure</option>
              </select>
            </label>
          </fieldset>
        )}

        <label>
          Hospital cover level
          <select name="hospitalCover" value={form.hospitalCover} onChange={handleChange}>
            <option value="None">None</option>
            <option value="Basic">Basic</option>
            <option value="Bronze">Bronze</option>
            <option value="Silver">Silver</option>
            <option value="Gold">Gold</option>
          </select>
        </label>

        <label>
          Extras cover level
          <select name="extrasCover" value={form.extrasCover} onChange={handleChange}>
            <option value="None">None</option>
            <option value="Basic">Basic</option>
            <option value="Standard">Standard</option>
            <option value="Premium">Premium</option>
          </select>
        </label>

        <label>
          Payment frequency
          <select name="paymentFrequency" value={form.paymentFrequency} onChange={handleChange}>
            <option value="Monthly">Monthly</option>
            <option value="Yearly">Yearly</option>
          </select>
        </label>

        {form.paymentFrequency === "Yearly" && (
          <label>
            Annual payment discount (%)
            <input
              type="number"
              name="annualDiscount"
              min="0"
              max="10"
              value={form.annualDiscount}
              onChange={handleChange}
            />
          </label>
        )}

        <label>
          Notes (optional)
          <textarea name="notes" value={form.notes} onChange={handleChange} />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? "Creating..." : "Create Quote"}
        </button>
      </form>
    </div>
  );
}

export default CreateQuotePage;