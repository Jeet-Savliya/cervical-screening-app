import axios from "axios";

// In production, set VITE_API_BASE (e.g. in a .env.production file, or your host's
// environment variable settings) to your deployed backend's URL. Falls back to
// localhost automatically for local development.
export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000";

export const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth temporarily disabled on the backend, so 401s shouldn't occur right now.
// When auth is re-enabled, restore the redirect-to-/login logic here.
