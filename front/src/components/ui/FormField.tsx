import React, { forwardRef } from "react";

export type FieldSize = "sm" | "md" | "lg";

interface FormFieldProps {
  label?: string;
  icon?: React.ReactNode;
  required?: boolean;
  className?: string;
  labelClassName?: string;
  children: React.ReactNode;
}

interface ControlStyleOptions {
  size?: FieldSize;
  disabled?: boolean;
  hasIcon?: boolean;
  className?: string;
  heightClassName?: string;
}

const sizeClasses: Record<FieldSize, string> = {
  sm: "px-3 py-2 text-[11px]",
  md: "px-4 py-3 text-sm",
  lg: "px-5 py-3.5 text-base",
};

// eslint-disable-next-line react-refresh/only-export-components
export const getFormControlClassName = ({
  size = "md",
  disabled = false,
  hasIcon = false,
  className = "",
  heightClassName = "",
}: ControlStyleOptions = {}) =>
  [
    "w-full rounded-xl border border-slate-200 bg-slate-50 font-bold outline-none transition-all",
    "focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10",
    "dark:border-slate-800 dark:bg-slate-800 dark:text-white",
    sizeClasses[size],
    hasIcon ? "pl-10" : "",
    disabled
      ? "disabled:cursor-default disabled:opacity-70 disabled:text-slate-300"
      : "",
    heightClassName,
    className,
  ]
    .filter(Boolean)
    .join(" ");

export function FormField({
  label,
  icon,
  required = false,
  className = "",
  labelClassName = "",
  children,
}: FormFieldProps) {
  return (
    <div className={["space-y-2", className].filter(Boolean).join(" ")}>
      {label ? (
        <label
          className={[
            "flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500",
            labelClassName,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {icon}
          <span>{label}</span>
          {required ? (
            <span className="text-rose-500 text-sm font-black leading-none">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
    </div>
  );
}

type TextInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  size?: FieldSize;
  heightClassName?: string;
  hasIcon?: boolean;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  (
    {
      size = "md" as FieldSize,
      className = "",
      heightClassName = "",
      hasIcon = false,
      ...props
    },
    ref,
  ) => (
    <input
      ref={ref}
      {...props}
      autoComplete="off"
      className={getFormControlClassName({
        size,
        disabled: props.disabled,
        hasIcon,
        className,
        heightClassName,
      })}
    />
  ),
);

TextInput.displayName = "TextInput";

type SelectInputProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  size?: FieldSize;
  heightClassName?: string;
  options?: Array<{ value: string; label: string; disabled?: boolean }>;
};

export const SelectInput = forwardRef<HTMLSelectElement, SelectInputProps>(
  (
    {
      size = "md" as FieldSize,
      className = "",
      heightClassName = "",
      options,
      children,
      ...props
    },
    ref,
  ) => (
    <select
      ref={ref}
      {...props}
      className={getFormControlClassName({
        size,
        disabled: props.disabled,
        className: ["appearance-none", className].filter(Boolean).join(" "),
        heightClassName,
      })}
    >
      {children ??
        options?.map((option) => (
          <option
            key={option.value}
            value={option.value}
            disabled={option.disabled}
          >
            {option.label}
          </option>
        ))}
    </select>
  ),
);

SelectInput.displayName = "SelectInput";

type TextAreaInputProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  size?: FieldSize;
  heightClassName?: string;
};

export const TextAreaInput = forwardRef<
  HTMLTextAreaElement,
  TextAreaInputProps
>(
  (
    {
      size = "md" as FieldSize,
      className = "",
      heightClassName = "",
      ...props
    },
    ref,
  ) => (
    <textarea
      ref={ref}
      {...props}
      className={getFormControlClassName({
        size,
        disabled: props.disabled,
        className: ["resize-none", className].filter(Boolean).join(" "),
        heightClassName,
      })}
    />
  ),
);

TextAreaInput.displayName = "TextAreaInput";
