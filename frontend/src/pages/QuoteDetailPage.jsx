import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getQuote, deleteQuote } from "../api/quotes";

/**
 * QuoteDetailPage — Section 8's "Explanation Sheet".
 *
 * Must show: monthly premium, yearly premium before discount, hospital
 * premium, extras premium, each applicant's LHC loading %, family upgrade
 * fee (if Family), final total, any warnings, the required LHC statement,
 * and a plain-English explanation.
 *
 * Monthly vs Yearly display rule (Section 8): Monthly payers see monthly +
 * yearly-before-discount only. Yearly payers additionally see yearly-after-discount.
 */
function QuoteDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuote();
  }, [id]);

  async function loadQuote() {
    setLoading(true);
    setError(null);
    try {
      const data = await getQuote(id);
      setQuote(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Delete the quote for "${quote.customerName}"? This can't be undone.`)) {
      return;
    }
    await deleteQuote(id);
    navigate("/quotes");
  }

  if (loading) return <div className="page">Loading...</div>;
  if (error) return <div className="page"><div className="error-box">{error}</div></div>;
  if (!quote) return null;

  const { breakdown, coverType, customerName, paymentFrequency, notes } = quote;
  const isYearly = paymentFrequency === "Yearly";

  return (
    <div className="page">
      <div className="detail-header">
        <h2>Quote for {customerName}</h2>
        <div className="detail-actions">
          <Link to={`/quotes/${id}/edit`}>Edit</Link>
          <button onClick={handleDelete}>Delete</button>
        </div>
      </div>

      <p className="detail-meta">
        {coverType} cover · Paying {paymentFrequency}
      </p>

      {breakdown.warnings.length > 0 && (
        <div className="warning-box">
          {breakdown.warnings.map((w, i) => (
            <p key={i}>⚠️ {w}</p>
          ))}
        </div>
      )}

      <section className="breakdown-section">
        <h3>Premium Breakdown</h3>
        <table className="breakdown-table">
          <tbody>
            <tr>
              <td>Hospital premium</td>
              <td>${breakdown.hospitalTotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Extras premium</td>
              <td>${breakdown.extrasTotal.toFixed(2)}</td>
            </tr>
            {coverType === "Family" && (
              <tr>
                <td>Family upgrade fee</td>
                <td>${breakdown.familyFee.toFixed(2)}</td>
              </tr>
            )}
            <tr className="total-row">
              <td>Monthly premium</td>
              <td>${breakdown.monthlyPremium.toFixed(2)}</td>
            </tr>
            <tr>
              <td>Yearly premium (before discount)</td>
              <td>${breakdown.yearlyBeforeDiscount.toFixed(2)}</td>
            </tr>
            {isYearly && (
              <tr className="total-row">
                <td>Yearly premium (after discount)</td>
                <td>${breakdown.yearlyAfterDiscount.toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="breakdown-section">
        <h3>Lifetime Health Cover Loading</h3>
        <p className="lhc-statement">{breakdown.lhcStatement}</p>
        <ul className="applicant-list">
          {breakdown.applicants.map((a, i) => (
            <li key={i}>
              <strong>{a.label}</strong> (age {a.age}, cover history: {a.coverHistory}) —{" "}
              {a.loadingPercent}% LHC loading applied to hospital cover
            </li>
          ))}
        </ul>
      </section>

      <section className="breakdown-section">
        <h3>How this quote was calculated</h3>
        <p>
          This is a {coverType.toLowerCase()} quote, so hospital and extras premiums are
          calculated for {coverType === "Single" ? "1 adult" : "2 adults"}.
          {coverType === "Family" &&
            " A flat $30/month family upgrade fee is added automatically to cover dependents under one policy."}
          {" "}Each applicant's Lifetime Health Cover loading is calculated individually and
          applied only to their hospital premium — never to extras.
          {isYearly
            ? " Because this quote is paid yearly, the annual payment discount has been applied to the yearly total."
            : " Because this quote is paid monthly, no annual payment discount applies — that discount is only available when paying yearly."}
        </p>
      </section>

      {notes && (
        <section className="breakdown-section">
          <h3>Notes</h3>
          <p>{notes}</p>
        </section>
      )}
    </div>
  );
}

export default QuoteDetailPage;