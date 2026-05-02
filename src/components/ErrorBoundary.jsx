import { Component } from "react"

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }
  componentDidCatch(error, info) {
    console.error("[ecomof-ai] Uncaught error:", error, info)
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          margin: "48px auto", maxWidth: 560, padding: 32,
          background: "rgba(232,134,134,0.08)", border: "1px solid rgba(232,134,134,0.30)",
          borderRadius: 12, textAlign: "center",
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⚠</div>
          <div style={{ color: "#E88686", fontWeight: 800, fontSize: 16, marginBottom: 8 }}>
            Something went wrong
          </div>
          <div style={{ color: "#8EA0B8", fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              background: "#4E8EF7", color: "#fff", border: "none",
              borderRadius: 8, padding: "10px 20px", fontSize: 13,
              fontWeight: 700, cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
