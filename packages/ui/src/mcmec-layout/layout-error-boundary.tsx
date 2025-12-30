"use client";

import * as React from "react";

interface LayoutErrorBoundaryProps {
	children: React.ReactNode;
	fallback?: React.ReactNode;
}

interface LayoutErrorBoundaryState {
	hasError: boolean;
	error?: Error;
}

export class LayoutErrorBoundary extends React.Component<
	LayoutErrorBoundaryProps,
	LayoutErrorBoundaryState
> {
	constructor(props: LayoutErrorBoundaryProps) {
		super(props);
		this.state = { hasError: false };
	}

	static getDerivedStateFromError(error: Error): LayoutErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error("Layout Error:", error, errorInfo);
	}

	render() {
		if (this.state.hasError) {
			if (this.props.fallback) {
				return this.props.fallback;
			}

			return (
				<div className="flex h-screen w-full items-center justify-center">
					<div className="text-center">
						<h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
						<p className="text-muted-foreground mb-4">
							There was an error loading the layout.
						</p>
						<button
							onClick={() => window.location.reload()}
							className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
						>
							Reload page
						</button>
					</div>
				</div>
			);
		}

		return this.props.children;
	}
}
