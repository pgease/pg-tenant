import React from 'react';
import { AlertCircle } from 'lucide-react';

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
}

export const InlineError: React.FC<InlineErrorProps> = ({ message, onRetry }) => {
  return (
    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-center space-y-2">
      <AlertCircle className="mx-auto h-6 w-6 text-rose-600" />
      <p className="text-xs font-semibold text-rose-800">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-white px-4 text-xs font-bold text-rose-700 border border-rose-200"
        >
          Try again
        </button>
      )}
    </div>
  );
};
