import React from "react";

export interface ToggleProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string;
  description?: string;
}

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
  ({ className = "", label, description, id, checked, onChange, ...props }, ref) => {
    const toggleId = id || `glass-toggle-${Math.random().toString(36).substring(2, 9)}`;

    return (
      <div className={`glass-toggle-container ${className}`}>
        <div className="glass-toggle-switch-wrapper">
          <input
            id={toggleId}
            ref={ref}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            className="glass-toggle-input"
            {...props}
          />
          <label htmlFor={toggleId} className="glass-toggle-slider" />
        </div>
        
        {(label || description) && (
          <div className="glass-toggle-labels">
            {label && <label htmlFor={toggleId} className="glass-toggle-label">{label}</label>}
            {description && <p className="glass-toggle-desc">{description}</p>}
          </div>
        )}
      </div>
    );
  }
);

Toggle.displayName = "Toggle";
