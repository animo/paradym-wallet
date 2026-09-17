import * as React from 'react'

export interface ErrorBoundaryProps {
  /**
   * Shown instead of the children once one of them throws while rendering.
   *
   * A function to let the fallback say what went wrong — which is the difference between a
   * development build that can be debugged and one that only ever says something went wrong.
   */
  fallback: React.JSX.Element | ((error: Error) => React.JSX.Element)

  /** Called with anything caught, so it reaches the logs even though the screen recovers. */
  onError?: (error: Error) => void
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren<ErrorBoundaryProps>,
  { error: Error | undefined }
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: undefined }
  }

  static getDerivedStateFromError(error: unknown) {
    // Update state so the next render will show the fallback UI.
    return { error: error instanceof Error ? error : new Error(String(error)) }
  }

  componentDidCatch(error: unknown) {
    this.props.onError?.(error instanceof Error ? error : new Error(String(error)))
  }

  render() {
    const { error } = this.state

    if (error) {
      return typeof this.props.fallback === 'function' ? this.props.fallback(error) : this.props.fallback
    }

    return this.props.children
  }
}
