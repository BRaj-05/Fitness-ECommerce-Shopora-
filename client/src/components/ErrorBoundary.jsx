import React from "react";
import { motion as Motion, useReducedMotion } from "framer-motion";
import ShoporaAmbientBackground from "./ShoporaAmbientBackground";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  render() {
  if (this.state.hasError) {
    return this.props.fallback ?? <ErrorFallback />;
  }
  return this.props.children;
}
}

function ErrorFallback() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#08090b] px-5 py-16 lg:px-10">
      <ShoporaAmbientBackground />
      <Motion.div
        initial={reduceMotion ? false : "hidden"}
        animate="visible"
        variants={{
          hidden: { opacity: 0, y: 30 },
          visible: { opacity: 1, y: 0 },
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="lux-admin-card relative z-10 w-full max-w-md p-8 text-center md:p-10"
      >
        <div className="mb-6 flex justify-center">
          <span className="text-[10px] tracking-[0.15em] uppercase bg-red-50 text-red-600 border border-red-100 px-3.5 py-1.5 rounded-full inline-block">
            System Notice
          </span>
        </div>

        <h1 className="font-heading mb-4 text-3xl leading-tight text-[var(--lux-ink)] md:text-4xl">
          Something went wrong.
        </h1>

        <p className="mb-8 text-sm leading-relaxed text-[var(--lux-muted)]">
          The application encountered an unexpected error. Please refresh the page or return to the main dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
          <Motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.1 }}
            onClick={() => window.location.reload()}
            className="w-full sm:w-auto bg-stone-900 text-white text-sm px-8 py-3 rounded-full hover:bg-stone-700 transition-colors cursor-pointer"
          >
            Refresh Page
          </Motion.button>
          
          <Motion.a
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.1 }}
            href="/"
            className="w-full sm:w-auto text-center border border-stone-300 text-stone-700 text-sm px-8 py-3 rounded-full hover:bg-stone-100 transition-colors"
          >
            Go Home
          </Motion.a>
        </div>
      </Motion.div>
    </div>
  );
}

export default ErrorBoundary;
