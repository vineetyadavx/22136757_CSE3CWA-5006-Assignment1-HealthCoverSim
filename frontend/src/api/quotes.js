/**
 * api/quotes.js
 *
 * Thin wrapper around fetch() for talking to the Express backend.
 * Centralizing this means the base URL and error-handling logic only
 * live in one place — if the backend port changes, or you want to add
 * auth headers later, this is the only file that needs editing.
 */
const API_BASE = "http://localhost:4000";

async function handleResponse(res) {
  const data = await res.json();
  if (!res.ok) {
    // Backend sends { errors: [...] } on validation failures (400) and not-found (404)
    const message = data.errors ? data.errors.join(" ") : "Something went wrong.";
    throw new Error(message);
  }
  return data;
}

export async function createQuote(input) {
  const res = await fetch(`${API_BASE}/quotes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse(res);
}

export async function listQuotes() {
  const res = await fetch(`${API_BASE}/quotes`);
  return handleResponse(res);
}

export async function getQuote(id) {
  const res = await fetch(`${API_BASE}/quotes/${id}`);
  return handleResponse(res);
}

export async function updateQuote(id, input) {
  const res = await fetch(`${API_BASE}/quotes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return handleResponse(res);
}

export async function deleteQuote(id) {
  const res = await fetch(`${API_BASE}/quotes/${id}`, { method: "DELETE" });
  return handleResponse(res);
}