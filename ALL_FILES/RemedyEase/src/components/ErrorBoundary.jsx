import React from "react";
import { Link } from "react-router-dom";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: "#fafcfb",
            fontFamily: "'Inter', -apple-system, sans-serif",
            color: "#0f172a",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "#f0fdf4",
              color: "#16a34a",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "28px",
              marginBottom: "16px",
            }}
          >
            ☘
          </div>
          <h1
            style={{
              fontFamily: "'Manrope', sans-serif",
              fontSize: "24px",
              fontWeight: "800",
              margin: "0 0 8px",
              color: "#0f172a",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "#64748b",
              maxWidth: "460px",
              margin: "0 0 24px",
              lineHeight: "1.5",
            }}
          >
            An unexpected error occurred while loading this view. You can safely return to the login or home page.
          </p>
          <div style={{ display: "flex", gap: "12px" }}>
            <a
              href="/user/login"
              style={{
                padding: "10px 20px",
                background: "#16a34a",
                color: "#ffffff",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: "700",
                fontSize: "14px",
              }}
            >
              Go to Sign In
            </a>
            <a
              href="/"
              style={{
                padding: "10px 20px",
                background: "#ffffff",
                color: "#334155",
                border: "1.5px solid #e2e8f0",
                borderRadius: "10px",
                textDecoration: "none",
                fontWeight: "600",
                fontSize: "14px",
              }}
            >
              Return Home
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
