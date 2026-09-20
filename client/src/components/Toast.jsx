import React from 'react';

/**
 * Toast notification component
 * @param {Object} props
 * @param {string} props.message - Notification message
 * @param {'success'|'error'} props.type - Notification type
 * @param {Function} props.onClose - Close handler
 */
export default function Toast({ message, type, onClose }) {
  if (!message) return null;

  const isError = type === 'error';
  const bgColor = isError ? 'bg-red-50' : 'bg-stone-900';
  const borderColor = isError ? 'border-red-100' : 'border-stone-800';
  const textColor = isError ? 'text-red-600' : 'text-white';
  const iconColor = isError ? 'text-red-400' : 'text-stone-400';
  const icon = isError ? '⚠' : '✓';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 right-6 z-50 ${bgColor} ${borderColor} border
                  rounded-2xl px-5 py-4 shadow-xl
                  flex items-start gap-3 min-w-[280px] max-w-md
                  animate-slide-in`}
    >
      <span className={`text-lg ${iconColor} shrink-0`}>{icon}</span>
      <p className={`text-sm ${textColor} flex-1`}>{message}</p>
      <button
        onClick={onClose}
        aria-label="Close notification"
        className={`shrink-0 ${iconColor} hover:opacity-70 transition-opacity
                    text-lg leading-none -mt-0.5`}
      >
        ×
      </button>
    </div>
  );
}
