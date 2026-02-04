/**
 * Signature Pad Component
 * Canvas-based digital signature capture
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

interface SignaturePadProps {
  onSave: (signatureData: string) => void;
  onClear?: () => void;
  onCancel?: () => void;
  width?: number;
  height?: number;
  disabled?: boolean;
  isLoading?: boolean;
  className?: string;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  onSave,
  onClear,
  onCancel,
  width = 400,
  height = 200,
  disabled = false,
  isLoading = false,
  className = '',
}) => {
  const { t } = useTranslation('forms');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    // Set up canvas for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.scale(dpr, dpr);

    // Set drawing styles
    context.strokeStyle = '#1f2937';
    context.lineWidth = 2;
    context.lineCap = 'round';
    context.lineJoin = 'round';

    // Fill with white background
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    setCtx(context);
  }, [width, height]);

  // Get coordinates from event
  const getCoordinates = useCallback(
    (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();

      if ('touches' in e) {
        // Touch event
        if (e.touches.length === 0) return null;
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      } else {
        // Mouse event
        return {
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        };
      }
    },
    []
  );

  // Start drawing
  const startDrawing = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (disabled || !ctx) return;

      const coords = getCoordinates(e);
      if (!coords) return;

      setIsDrawing(true);
      setIsEmpty(false);
      ctx.beginPath();
      ctx.moveTo(coords.x, coords.y);
    },
    [ctx, disabled, getCoordinates]
  );

  // Draw
  const draw = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!isDrawing || disabled || !ctx) return;

      const coords = getCoordinates(e);
      if (!coords) return;

      ctx.lineTo(coords.x, coords.y);
      ctx.stroke();
    },
    [ctx, disabled, getCoordinates, isDrawing]
  );

  // Stop drawing
  const stopDrawing = useCallback(() => {
    if (!ctx) return;
    setIsDrawing(false);
    ctx.closePath();
  }, [ctx]);

  // Clear canvas
  const handleClear = useCallback(() => {
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    setIsEmpty(true);
    onClear?.();
  }, [ctx, width, height, onClear]);

  // Save signature
  const handleSave = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || isEmpty) return;

    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  }, [isEmpty, onSave]);

  // Prevent scrolling on touch devices while drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventDefault = (e: TouchEvent) => {
      if (isDrawing) {
        e.preventDefault();
      }
    };

    canvas.addEventListener('touchmove', preventDefault, { passive: false });
    return () => {
      canvas.removeEventListener('touchmove', preventDefault);
    };
  }, [isDrawing]);

  return (
    <div className={`signature-pad ${className}`}>
      {/* Canvas Container */}
      <div
        className={`relative border-2 border-dashed rounded-xl overflow-hidden ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'border-gray-300 hover:border-primary-400'
        }`}
      >
        <canvas
          ref={canvasRef}
          className={`touch-none ${disabled ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Placeholder */}
        {isEmpty && !disabled && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center text-gray-400">
              <div className="text-4xl mb-2">✍️</div>
              <p className="text-sm">{t('signature.placeholder')}</p>
            </div>
          </div>
        )}

        {/* Signature Line */}
        <div className="absolute bottom-8 left-8 right-8 border-b-2 border-gray-300 pointer-events-none">
          <span className="absolute -bottom-5 left-0 text-xs text-gray-400">
            {t('signature.signHere')}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={disabled || isLoading}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
              disabled || isLoading
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            ❌ {t('signature.cancel')}
          </button>
        )}
        <button
          type="button"
          onClick={handleClear}
          disabled={disabled || isEmpty || isLoading}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border rounded-lg transition-colors ${
            disabled || isEmpty || isLoading
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          🗑️ {t('signature.clear')}
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={disabled || isEmpty || isLoading}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg transition-colors ${
            disabled || isEmpty || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-primary-500 text-white hover:bg-primary-600 shadow-md'
          }`}
        >
          {isLoading ? '⏳' : '✅'} {isLoading ? t('signature.saving') : t('signature.save')}
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;
