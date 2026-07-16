import React, { useState } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      containerClassName = "",
      label,
      error,
      leftIcon,
      rightIcon,
      id,
      onFocus,
      onBlur,
      value,
      onChange,
      placeholder,
      ...props
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = useState(false);
    const inputId = id || `glass-input-${Math.random().toString(36).substring(2, 9)}`;

    // Check if the input is "active" (has value or is focused or has default placeholder)
    const hasValue = value !== undefined && value !== null && value !== "";
    const isActive = isFocused || hasValue || placeholder;

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (onFocus) onFocus(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      if (onBlur) onBlur(e);
    };

    return (
      <div className={`glass-input-container ${error ? "has-error" : ""} ${isActive ? "is-active" : ""} ${isFocused ? "is-focused" : ""} ${containerClassName}`}>
        <div className="glass-input-wrapper">
          {leftIcon && <span className="glass-input-icon-left">{leftIcon}</span>}
          
          <input
            id={inputId}
            ref={ref}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className={`glass-input-field ${leftIcon ? "has-left-icon" : ""} ${rightIcon ? "has-right-icon" : ""} ${className}`}
            {...props}
          />
          
          {label && (
            <label htmlFor={inputId} className="glass-input-label">
              {label}
            </label>
          )}

          {rightIcon && <span className="glass-input-icon-right">{rightIcon}</span>}
        </div>
        
        {error && (
          <p className="glass-input-error-msg animate-fade-in">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
