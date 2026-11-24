import * as React from "react";
import { cn } from "../../utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  showCount?: boolean;
}

const TEXT_LIKE_TYPES = new Set([
  "",
  "text",
  "search",
  "email",
  "url",
  "tel",
  "password",
]);

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      maxLength,
      showCount = false,
      value,
      defaultValue,
      onChange,
      onPaste,
      ...props
    },
    ref,
  ) => {
    // Default 100 characters for all single-line text fields unless explicitly overridden
    const isTextLike = TEXT_LIKE_TYPES.has(type || "");
    const effectiveMaxLength =
      maxLength !== undefined ? maxLength : isTextLike ? 100 : undefined;

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setCurrentVal(e.target.value);
      onChange?.(e);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
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
            window.HTMLInputElement.prototype,
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

    const inputNode = (
      <input
        type={type}
        maxLength={effectiveMaxLength}
        className={cn(
          "w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-xs text-brandText focus:border-primary focus:outline-none transition-colors disabled:opacity-50",
          className,
        )}
        ref={ref}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        onPaste={handlePaste}
        {...props}
      />
    );

    if (showCount && effectiveMaxLength !== undefined) {
      return (
        <div className="relative w-full">
          {inputNode}
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
        </div>
      );
    }

    return inputNode;
  },
);
Input.displayName = "Input";
