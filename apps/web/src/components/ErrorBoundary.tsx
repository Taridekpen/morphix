import React from "react";
import { Button } from "./ui/Button";

interface Props {
  label?: string;
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-[var(--radius-lg)] border border-red-200 dark:border-red-900 bg-[var(--error-bg)] p-5">
          <p className="text-sm font-semibold text-red-800 dark:text-red-200">
            {this.props.label ?? "Module"} failed to load
          </p>
          <p className="text-xs text-red-700 dark:text-red-300 mt-2 leading-relaxed">{this.state.error.message}</p>
          <Button variant="danger" size="sm" className="mt-4" onClick={() => this.setState({ error: null })}>
            Try again
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
