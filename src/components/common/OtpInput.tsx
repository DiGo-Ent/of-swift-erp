import React, { useRef, useState, useEffect } from 'react';

export interface OtpInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  disabled?: boolean;
  autoFocus?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = React.memo(({
  length = 6,
  value = '',
  onChange,
  disabled = false,
  autoFocus = true,
}) => {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);

  // Auto-focus first input box on mount
  useEffect(() => {
    if (autoFocus && inputRefs.current[0] && !disabled) {
      inputRefs.current[0].focus();
    }
  }, [autoFocus, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    // Allow only numeric digits
    if (val && !/^\d+$/.test(val)) return;

    const newOtp = value.split('');
    // Take only the last entered digit
    newOtp[index] = val.substring(val.length - 1);
    const combinedOtp = newOtp.join('');
    onChange(combinedOtp);

    // Auto advance to next box if digit typed
    if (val && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // Move back to previous input on backspace if current is empty
        inputRefs.current[index - 1]?.focus();
        setFocusedIndex(index - 1);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (!/^\d+$/.test(pastedData)) return;

    const digits = pastedData.slice(0, length);
    onChange(digits);

    // Focus box corresponding to pasted length
    const targetIdx = Math.min(digits.length, length - 1);
    inputRefs.current[targetIdx]?.focus();
    setFocusedIndex(targetIdx);
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
      {Array.from({ length }).map((_, index) => {
        const digit = value[index] || '';
        const isFilled = digit.length > 0;
        const isFocused = focusedIndex === index;

        // Dynamic Status Color Styling
        let borderColor = 'var(--red-danger)';
        let backgroundColor = 'var(--red-bg)';
        let textColor = 'var(--red-danger)';
        let boxShadow = 'none';

        if (isFilled) {
          // Filled Box -> Green outline & fill
          borderColor = 'var(--green-success)';
          backgroundColor = 'var(--green-bg)';
          textColor = 'var(--green-success)';
        } else if (isFocused) {
          // Active Focused Empty Box -> Default Blue outline & glow
          borderColor = 'var(--blue-primary)';
          backgroundColor = 'var(--blue-subtle)';
          textColor = 'var(--blue-primary)';
          boxShadow = '0 0 0 3px rgba(30, 64, 175, 0.2)';
        }

        return (
          <input
            key={index}
            ref={(el) => {
              inputRefs.current[index] = el;
            }}
            type="text"
            inputMode="numeric"
            pattern="\d*"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onChange={(e) => handleChange(e, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            onFocus={() => setFocusedIndex(index)}
            onPaste={handlePaste}
            style={{
              width: '42px',
              height: '48px',
              textAlign: 'center',
              fontSize: '1.25rem',
              fontWeight: 800,
              fontFamily: 'monospace',
              borderRadius: '8px',
              border: `2px solid ${borderColor}`,
              backgroundColor: backgroundColor,
              color: textColor,
              boxShadow: boxShadow,
              outline: 'none',
              transition: 'border-color 0.15s ease, background-color 0.15s ease, box-shadow 0.15s ease',
            }}
          />
        );
      })}
    </div>
  );
});
