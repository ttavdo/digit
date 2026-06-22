import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '2rem auto', fontFamily: 'system-ui' }}>
          <h1 style={{ color: '#b91c1c', marginBottom: '1rem' }}>შეცდომა</h1>
          <p style={{ marginBottom: '1rem', lineHeight: 1.6 }}>{this.state.error.message}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              background: '#2563eb',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
            }}
          >
            გვერდის განახლება
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
