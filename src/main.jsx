import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

import React from 'react';
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return <div style={{color: 'red', padding: '20px'}}><h1>Something went wrong.</h1><pre>{this.state.error.toString()}</pre></div>;
    }
    return this.props.children;
  }
}
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary><App /></ErrorBoundary>
  </StrictMode>,
)
