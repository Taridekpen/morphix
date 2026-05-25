import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Panel crash:", error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{
          background: "#fef2f2", border: "1px solid #fca5a5",
          borderRadius: "16px", padding: "24px 20px",
          fontFamily: "var(--font-mono)", color: "#dc2626",
        }}>
          <div style={{ fontSize: "0.75rem", fontWeight: 700, marginBottom: 8, letterSpacing: "0.1em" }}>
            ⚠ {this.props.label || "MODULE"} FAILED TO LOAD
          </div>
          <div style={{ fontSize: "0.7rem", color: "#991b1b", lineHeight: 1.6 }}>
            {this.state.error?.message}
          </div>
          <button
            onClick={() => this.setState({ error: null })}
            style={{
              marginTop: 14, padding: "6px 14px", borderRadius: "8px",
              background: "#dc2626", color: "#fff", border: "none",
              fontFamily: "var(--font-mono)", fontSize: "0.72rem", cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
