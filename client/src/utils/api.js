// Centralized API configuration and client for Goalign

export const API_BASE_URL = 
  import.meta.env.VITE_API_BASE_URL || 
  (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:8000'
    : 'https://goalign-mrkd.onrender.com');

/**
 * Standardized fetch helper that prefixes relative API endpoints with the API_BASE_URL.
 * 
 * @param {string} endpoint - e.g. '/api/wallet/balances/1'
 * @param {RequestInit} [options={}] - Standard fetch options
 * @returns {Promise<Response>}
 */
export async function apiFetch(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  return fetch(url, options);
}
