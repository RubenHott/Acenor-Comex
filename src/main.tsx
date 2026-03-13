import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initSentry } from "./lib/sentry";

// Initialize Sentry error monitoring (no-op when VITE_SENTRY_DSN is not set)
initSentry();

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div style={{
          padding: "2rem",
          fontFamily: "system-ui, sans-serif",
          maxWidth: "600px",
          margin: "2rem auto",
          background: "#fef2f2",
          border: "1px solid #fecaca",
          borderRadius: "8px",
        }}>
          <h1 style={{ color: "#b91c1c", marginBottom: "1rem" }}>Error al cargar la aplicación</h1>
          <pre style={{ overflow: "auto", fontSize: "12px", color: "#991b1b" }}>
            {this.state.error.message}
          </pre>
          <p style={{ marginTop: "1rem", color: "#6b7280" }}>
            Abre la consola del navegador (F12) para más detalles.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}

const root = document.getElementById("root");
if (!root) throw new Error("No se encontró #root");
createRoot(root).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
