import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getQuote, updateQuote } from "../api/quotes";

/**
 * EditQuotePage — Section 11's edit page.
 *
 * Same shape and validation as CreateQuotePage, but:
 * 1. Loads the existing quote's raw inputs first and pre-fills the form
 * 2. Submits via PUT (update) instead of POST (create)
 *
 * Reuses the same conditional-rendering pattern for Applicant 2 fields
 * and the same frontend validation rules as the Create form.
 */
function EditQuotePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState(null); // null until loaded
  const [errors, setErrors] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await getQuote(id);
        // data.raw has camelCase fields matching the form shape already
        setForm({
          customerName: data.raw.customerName,
          coverType: data.raw.coverType,
          applicant1Age: String(data.raw.applicant1Age),
          applicant1CoverHistory: data.raw.applicant1CoverHistory,
          applicant2Age: data.raw.applicant2Age ? String(data.raw.applicant2Age) : "",
          applicant2CoverHistory: data.raw.applicant2CoverHistory || "Yes",
          hospitalCover: data.raw.hospitalCover,
          extrasCover: data.raw.extrasCover,
          paymentFrequency: data.raw.paymentFrequency,
          annualDiscount: data.raw.annualDiscount ? String(data.raw.annualDiscount) : "",
          notes: data.raw.notes || "",
        });
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  if (loading) return <div className="page">Loading...</div>;
  if (loadError) return <div className="page"><div className="error-box">{loadError}</div></div>;
  if (!form) return null;

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
      await updateQuote(id, payload);
      navigate(`/quotes/${id}`);
    } catch (err) {
      setErrors([err.message]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page">
      <h2>Edit Quote</h2>

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
          <input type="text" name="customerName" value={form.customerName} onChange={handleChange} />
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
            <input type="number" name="applicant1Age" min="18" max="100" value={form.applicant1Age} onChange={handleChange} />
          </label>
          <label>
            Hospital cover history
            <select name="applicant1CoverHistory" value={form.applicant1CoverHistory} onChange={handleChange}>
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
              <input type="number" name="applicant2Age" min="18" max="100" value={form.applicant2Age} onChange={handleChange} />
            </label>
            <label>
              Hospital cover history
              <select name="applicant2CoverHistory" value={form.applicant2CoverHistory} onChange={handleChange}>
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
            <input type="number" name="annualDiscount" min="0" max="10" value={form.annualDiscount} onChange={handleChange} />
          </label>
        )}

        <label>
          Notes (optional)
          <textarea name="notes" value={form.notes} onChange={handleChange} />
        </label>

        <button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

export default EditQuotePage;