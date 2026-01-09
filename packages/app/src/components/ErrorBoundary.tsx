import * as React from 'react'

export interface ErrorBoundaryProps {
  fallback: React.JSX.Element
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren<ErrorBoundaryProps>, { hasError: boolean }> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }

    return this.props.children
  }
}
