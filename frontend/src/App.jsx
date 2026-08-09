import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import CreateQuotePage from "./pages/CreateQuotePage";
import QuoteListPage from "./pages/QuoteListPage";
import QuoteDetailPage from "./pages/QuoteDetailPage";
import EditQuotePage from "./pages/EditQuotePage";
import "./App.css";

/**
 * App.jsx — top-level routing shell.
 * Section 11 requires: a quote-creation form, a quote list page, a quote
 * detail page, and an edit page. Each gets its own route/component.
 */
function App() {
  return (
    <BrowserRouter>
      <div className="app-shell">
        <header className="app-header">
          <h1>HealthCoverSim</h1>
          <nav>
            <Link to="/">New Quote</Link>
            <Link to="/quotes">All Quotes</Link>
          </nav>
        </header>

        <main className="app-main">
          <Routes>
            <Route path="/" element={<CreateQuotePage />} />
            <Route path="/quotes" element={<QuoteListPage />} />
            <Route path="/quotes/:id" element={<QuoteDetailPage />} />
            <Route path="/quotes/:id/edit" element={<EditQuotePage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;