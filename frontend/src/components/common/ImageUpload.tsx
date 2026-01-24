import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PhotoIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface ImageUploadProps {
  currentImage?: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove?: () => Promise<void>;
  shape?: 'circle' | 'square';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  accept?: string;
  maxSizeMB?: number;
  placeholder?: React.ReactNode;
  disabled?: boolean;
}

const sizeClasses = {
  sm: 'w-20 h-20',
  md: 'w-32 h-32',
  lg: 'w-40 h-40',
};

export const ImageUpload: React.FC<ImageUploadProps> = ({
  currentImage,
  onUpload,
  onRemove,
  shape = 'circle',
  size = 'md',
  loading = false,
  accept = 'image/jpeg,image/png,image/webp',
  maxSizeMB = 5,
  placeholder,
  disabled = false,
}) => {
  const { t } = useTranslation('common');
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    setError(null);

    // Check file type
    const allowedTypes = accept.split(',').map((t) => t.trim());
    if (!allowedTypes.includes(file.type)) {
      setError(t('upload.invalidType'));
      return false;
    }

    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setError(t('upload.fileTooLarge'));
      return false;
    }

    return true;
  };

  const handleFileSelect = async (file: File) => {
    if (!validateFile(file)) return;

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      await onUpload(file);
      setPreview(null); // Clear preview after successful upload
    } catch (err: any) {
      setError(err.response?.data?.message || t('upload.uploadError'));
      setPreview(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const handleRemove = async () => {
    if (onRemove) {
      setIsUploading(true);
      try {
        await onRemove();
        setPreview(null);
      } catch (err: any) {
        setError(err.response?.data?.message || t('upload.uploadError'));
      } finally {
        setIsUploading(false);
      }
    }
  };

  const displayImage = preview || currentImage;
  const isLoading = loading || isUploading;

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Image Container */}
      <div
        className={`
          relative overflow-hidden border-2 border-dashed transition-all cursor-pointer
          ${sizeClasses[size]}
          ${shape === 'circle' ? 'rounded-full' : 'rounded-lg'}
          ${isDragging ? 'border-primary-500 bg-primary-50' : 'border-gray-300 hover:border-primary-400'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={!disabled ? handleDragOver : undefined}
        onDragLeave={!disabled ? handleDragLeave : undefined}
        onDrop={!disabled ? handleDrop : undefined}
        onClick={() => !disabled && !isLoading && fileInputRef.current?.click()}
      >
        {isLoading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80">
            <ArrowPathIcon className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : displayImage ? (
          <img
            src={displayImage}
            alt="Preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 p-2">
            {placeholder || (
              <>
                <PhotoIcon className="w-8 h-8 mb-1" />
                <span className="text-xs text-center">{t('upload.dragDrop')}</span>
              </>
            )}
          </div>
        )}

        {/* Hover Overlay */}
        {displayImage && !isLoading && !disabled && (
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <span className="text-white text-xs">{t('upload.changeImage')}</span>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled || isLoading}
      />

      {/* Error Message */}
      {error && (
        <p className="text-xs text-red-500 text-center">{error}</p>
      )}

      {/* Max Size Hint */}
      <p className="text-xs text-gray-400">
        {t('upload.maxSize', { size: maxSizeMB })}
      </p>

      {/* Remove Button */}
      {displayImage && onRemove && !disabled && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleRemove();
          }}
          disabled={isLoading}
          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
        >
          <TrashIcon className="w-4 h-4" />
          {t('upload.removeImage')}
        </button>
      )}
    </div>
  );
};
