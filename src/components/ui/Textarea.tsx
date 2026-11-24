import * as React from "react";
import { cn } from "../../utils/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  showCount?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      maxLength = 254,
      showCount = true,
      value,
      defaultValue,
      onChange,
      onPaste,
      ...props
    },
    ref,
  ) => {
    // Default 254 characters for reason/description/remarks/notes/messages
    const effectiveMaxLength = maxLength !== undefined ? maxLength : 254;

    const [currentVal, setCurrentVal] = React.useState<string>(() => {
      if (typeof value === "string") return value;
      if (typeof defaultValue === "string") return defaultValue;
      return "";
    });

    React.useEffect(() => {
      if (value !== undefined) {
        setCurrentVal(typeof value === "string" ? value : String(value ?? ""));
      }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCurrentVal(e.target.value);
      onChange?.(e);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (effectiveMaxLength !== undefined) {
        const text = e.clipboardData.getData("text");
        const target = e.currentTarget;
        const start = target.selectionStart ?? 0;
        const end = target.selectionEnd ?? 0;
        const selectedLength = end - start;
        const remainingSpace =
          effectiveMaxLength - (target.value.length - selectedLength);

        if (text.length > remainingSpace) {
          e.preventDefault();
          const truncated = text.slice(0, Math.max(0, remainingSpace));
          const newValue =
            target.value.slice(0, start) + truncated + target.value.slice(end);

          const nativeSetter = Object.getOwnPropertyDescriptor(
            window.HTMLTextAreaElement.prototype,
            "value",
          )?.set;
          nativeSetter?.call(target, newValue);
          target.dispatchEvent(new Event("input", { bubbles: true }));
          setCurrentVal(newValue);
        }
      }
      onPaste?.(e);
    };

    const charCount = currentVal.length;
    const isAtLimit =
      effectiveMaxLength !== undefined && charCount >= effectiveMaxLength;

    return (
      <div className="relative w-full">
        <textarea
          className={cn(
            "w-full rounded-xl border border-gray-200 bg-white p-3 text-xs text-brandText focus:border-primary focus:outline-none resize-none transition-colors disabled:opacity-50",
            className,
          )}
          ref={ref}
          maxLength={effectiveMaxLength}
          value={value}
          defaultValue={defaultValue}
          onChange={handleChange}
          onPaste={handlePaste}
          {...props}
        />
        {showCount && effectiveMaxLength !== undefined && (
          <div className="flex justify-end mt-1">
            <span
              className={cn(
                "text-[11px] tabular-nums transition-colors",
                isAtLimit
                  ? "text-red-500 font-semibold"
                  : "text-gray-400 font-normal",
              )}
            >
              {charCount}/{effectiveMaxLength}
            </span>
          </div>
        )}
      </div>
    );
  },
);
Textarea.displayName = "Textarea";
