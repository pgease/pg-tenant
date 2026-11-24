import React from 'react';
import { AlertCircle } from 'lucide-react';

interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
}

export const InlineError: React.FC<InlineErrorProps> = ({ message, onRetry }) => {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 text-center shadow-xs space-y-2.5">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-[#008080]">
        <AlertCircle className="h-5 w-5 text-[#008080]" />
      </div>
      <p className="text-xs font-semibold text-[#1F2937] leading-relaxed">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-9 items-center justify-center rounded-xl bg-[#008080] hover:bg-[#005F5F] px-4 text-xs font-bold text-white shadow-xs transition-colors active:scale-95 cursor-pointer"
        >
          Try again
        </button>
      )}
    </div>
  );
};
