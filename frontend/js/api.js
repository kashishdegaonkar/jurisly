/**
 * Jurisly API Client
 * Handles all communication with the Flask backend.
 */

const API = (() => {
  const BASE_URL = window.location.origin;

  async function _fetch(endpoint, options = {}) {
    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err) {
      console.error(`API error [${endpoint}]:`, err);
      throw err;
    }
  }

  return {
    /**
     * Search for similar cases.
     * @param {string} text - Legal text to search
     * @param {object} filters - { year_range, case_type }
     * @param {number} topK - Number of results
     */
    search(text, filters = {}, topK = 10) {
      return _fetch("/api/search", {
        method: "POST",
        body: JSON.stringify({ text, filters, top_k: topK }),
      });
    },

    /**
     * Search by citation (quick search).
     * @param {string} query - Citation or case name
     * @param {number} topK - Number of results
     */
    quickSearch(query, topK = 5) {
      return _fetch(`/api/search/quick?q=${encodeURIComponent(query)}&top_k=${topK}`);
    },

    /**
     * Get all cases.
     * @param {object} params - { limit, type, year_from, year_to }
     */
    getCases(params = {}) {
      const qs = new URLSearchParams(params).toString();
      return _fetch(`/api/cases?${qs}`);
    },

    /**
     * Get a single case by ID.
     * @param {number} caseId
     */
    getCase(caseId) {
      return _fetch(`/api/cases/${caseId}`);
    },

    /**
     * Health check.
     */
    health() {
      return _fetch("/api/health");
    },

    /**
     * Get app statistics.
     */
    stats() {
      return _fetch("/api/stats");
    },
  };
})();
