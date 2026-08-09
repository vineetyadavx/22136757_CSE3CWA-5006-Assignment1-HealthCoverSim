import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { listQuotes, deleteQuote } from "../api/quotes";

/**
 * QuoteListPage — Section 11's quote list page.
 * Shows summary info only (no calculation needed here — that only happens
 * on the detail page, per the "calculate on read" design decision).
 */
function QuoteListPage() {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadQuotes();
  }, []);

  async function loadQuotes() {
    setLoading(true);
    try {
      const data = await listQuotes();
      setQuotes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id, name) {
    if (!window.confirm(`Delete the quote for "${name}"? This can't be undone.`)) {
      return;
    }
    try {
      await deleteQuote(id);
      loadQuotes();
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <div className="page">Loading quotes...</div>;

  return (
    <div className="page">
      <h2>All Quotes</h2>

      {error && <div className="error-box">{error}</div>}

      {quotes.length === 0 ? (
        <p>No quotes yet. <Link to="/">Create one</Link>.</p>
      ) : (
        <table className="quote-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Cover Type</th>
              <th>Payment</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr key={q.id}>
                <td>
                  <Link to={`/quotes/${q.id}`}>{q.customer_name}</Link>
                </td>
                <td>{q.cover_type}</td>
                <td>{q.payment_frequency}</td>
                <td>{new Date(q.created_at).toLocaleDateString()}</td>
                <td className="row-actions">
                  <Link to={`/quotes/${q.id}/edit`}>Edit</Link>
                  <button onClick={() => handleDelete(q.id, q.customer_name)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default QuoteListPage;