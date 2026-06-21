"use client";

import Image from "next/image";
import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = {
  children: ReactNode;
  fallbackSrc?: string;
};

type State = {
  hasError: boolean;
};

export class WorksCanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[WorksCanvas] WebGL error", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="works-gallery__canvas-fallback" aria-label="Project gallery">
          <Image
            src={this.props.fallbackSrc ?? "/works-sequence/frame_007.jpg"}
            alt="Works gallery preview"
            fill
            className="works-gallery__canvas-fallback-image"
            priority
          />
        </div>
      );
    }

    return this.props.children;
  }
}
