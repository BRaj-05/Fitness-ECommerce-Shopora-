import React, { useState } from 'react';

/**
 * Bug screenshot display component with error handling
 * @param {Object} props
 * @param {string} props.src - Screenshot URL
 * @param {string} props.title - Bug title for alt text
 */
export default function BugScreenshot({ src, title }) {
  const [hasError, setHasError] = useState(false);

  // Show fallback if no src or image failed to load
  if (!src || hasError) {
    return (
      <div
        role="img"
        aria-label={`Screenshot unavailable for bug: ${title}`}
        className="w-12 h-8 rounded border border-stone-200 bg-stone-50
                   flex items-center justify-center"
      >
        <span className="text-[10px] text-stone-300 text-center leading-tight px-1">
          No screenshot
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={`Screenshot for bug: ${title}`}
      loading="lazy"
      onError={() => setHasError(true)}
      className="w-12 h-8 object-cover rounded border border-stone-200
                 hover:opacity-80 transition-opacity"
    />
  );
}
