// api.js — single source of truth for the backend base URL.
//
// Locally: defaults to http://localhost:8000 (matches `uvicorn main:app --reload`).
// On Vercel: set REACT_APP_API_BASE_URL in the frontend service's Environment
// Variables to your backend's deployed path, e.g. "/_/backend" if using the
// experimentalServices routePrefix from vercel.json, or a full URL if the
// backend is deployed as its own separate Vercel project/domain.
//
// IMPORTANT (Create React App): only env vars prefixed with REACT_APP_ are
// embedded in the browser bundle. They must be set at BUILD time (Vercel's
// build step), not just at runtime.

export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export function apiUrl(path) {
  // Avoid double slashes when API_BASE_URL has a trailing slash.
  return `${API_BASE_URL.replace(/\/$/, '')}${path}`;
}