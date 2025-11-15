"use client";

import { Component, ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error boundary component for graceful error handling
 * Catches React errors and displays a fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Error caught by boundary:", error, errorInfo);

    // TODO: Send to error tracking service (e.g., Sentry)
    // if (typeof window !== "undefined" && window.Sentry) {
    //   window.Sentry.captureException(error);
    // }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-background-primary p-4">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-accent-error">Wystąpił błąd</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-text-secondary">
                Przepraszamy, coś poszło nie tak. Spróbuj odświeżyć stronę.
              </p>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <div className="bg-background-secondary p-4 rounded-lg">
                  <p className="text-xs font-mono text-accent-error">
                    {this.state.error.message}
                  </p>
                  <pre className="text-xs mt-2 overflow-auto">
                    {this.state.error.stack}
                  </pre>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1"
                >
                  Odśwież stronę
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.history.back()}
                  className="flex-1"
                >
                  Wstecz
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
