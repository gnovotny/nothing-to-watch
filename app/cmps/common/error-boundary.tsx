import React from 'react'
import config from '../../config'
import telemetry from '../../utils/telemetry/micro-sentry-telemetry'

type ErrorBoundaryState = {
  error: Error | null
}

export class ErrorBoundary extends React.Component<
  React.PropsWithChildren,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error', error, info)
    try {
      telemetry.captureError(error, {
        source: 'ErrorBoundary',
        componentStack: info.componentStack,
      })
    } catch {}
  }

  private copyDetails = async () => {
    try {
      const details = this.getErrorDetails()
      await navigator.clipboard.writeText(details)
    } catch {}
  }

  private dismissError = () => {
    this.setState({ error: null })
  }

  private getErrorDetails() {
    const { error } = this.state
    return [
      `message: ${error?.message ?? 'unknown'}`,
      `stack: ${error?.stack ?? 'n/a'}`,
      `userAgent: ${navigator.userAgent}`,
    ].join('\n')
  }

  render(): React.ReactNode {
    if (!this.state.error) return this.props.children

    const details = this.getErrorDetails()

    return (
      <div className='fixed inset-0 z-50 grid h-dvh w-dvw place-items-center bg-background p-6 text-foreground'>
        <div className='max-w-2xl rounded-lg border border-border bg-card p-6 shadow-sm'>
          <h1 className='mb-2 font-bold text-xl'>Something went wrong</h1>
          <p className='mb-4 text-muted-foreground text-sm'>
            The app encountered an unexpected error. This can happen if your
            browser or GPU doesn’t fully support WebGL or required extensions.
          </p>

          <div className='mb-4 rounded-md border border-border bg-popover p-3 text-xs'>
            <p className='mb-1 font-semibold'>What you can try</p>
            <ul className='list-inside list-disc space-y-1'>
              <li>Reload this page</li>
              <li>Update your browser/graphics drivers</li>
              <li>Try a different browser (Chrome/Firefox)</li>
            </ul>
          </div>

          <pre className='mb-4 max-h-48 overflow-auto rounded-md border border-border bg-muted p-3 text-[11px] leading-tight'>
            {details}
          </pre>

          <div className='flex flex-wrap gap-2'>
            <button
              type='button'
              className='rounded-md border border-input bg-secondary px-3 py-2 text-sm hover:bg-secondary/80'
              onClick={() => window.location.reload()}
            >
              Reload
            </button>
            <button
              type='button'
              className='rounded-md border border-input bg-secondary px-3 py-2 text-sm hover:bg-secondary/80'
              onClick={this.copyDetails}
            >
              Copy details
            </button>
            <a
              className='rounded-md border border-input bg-secondary px-3 py-2 text-sm hover:bg-secondary/80'
              href={config.sourceCodeUrl}
              target='_blank'
              rel='noreferrer noopener'
            >
              Report issue
            </a>
            <button
              type='button'
              className='rounded-md border border-input bg-secondary px-3 py-2 text-sm hover:bg-secondary/80'
              onClick={this.dismissError}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    )
  }
}

export default ErrorBoundary
