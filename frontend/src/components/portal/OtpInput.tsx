/**
 * Portal OTP Input Component
 * 6-digit OTP input with auto-focus and paste support
 */

import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  length = 6,
  disabled = false,
  error = false,
}) => {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Sync with external value
    if (value) {
      const chars = value.split('').slice(0, length);
      setOtp(chars.concat(Array(length - chars.length).fill('')));
    } else {
      setOtp(Array(length).fill(''));
    }
  }, [value, length]);

  const handleChange = (index: number, digit: string) => {
    if (!/^\d*$/.test(digit)) return;

    const newOtp = [...otp];
    newOtp[index] = digit.slice(-1);
    setOtp(newOtp);
    onChange(newOtp.join(''));

    // Auto focus next input
    if (digit && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const newOtp = pastedData.split('').concat(Array(length).fill('')).slice(0, length);
    setOtp(newOtp);
    onChange(newOtp.join(''));

    // Focus last filled input or next empty
    const lastIndex = Math.min(pastedData.length - 1, length - 1);
    inputRefs.current[lastIndex]?.focus();
  };

  return (
    <div className="flex justify-center gap-2" dir="ltr" style={{ direction: 'ltr' }}>
      {otp.map((digit, index) => (
        <motion.input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          autoComplete="one-time-code"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: index * 0.05 }}
          style={{ direction: 'ltr', textAlign: 'center' }}
          className={`
            w-12 h-14 sm:w-14 sm:h-16
            text-center text-xl sm:text-2xl font-bold
            border-2 rounded-xl
            transition-all duration-200
            font-mono
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-white
            ${error
              ? 'border-red-400 dark:border-red-600 focus:border-red-500 focus:ring-red-500/20'
              : digit
                ? 'border-mint-500 bg-mint-50 dark:bg-mint-900/20'
                : 'border-gray-200 dark:border-gray-700'
            }
            focus:border-mint-500 focus:outline-none focus:ring-4 focus:ring-mint-500/20
            disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed disabled:opacity-60
          `}
        />
      ))}
    </div>
  );
};

export default OtpInput;
