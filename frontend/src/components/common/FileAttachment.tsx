import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PaperClipIcon,
  DocumentIcon,
  PhotoIcon,
  TrashIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { MedicalAttachment } from '../../types';

interface FileAttachmentProps {
  attachments: MedicalAttachment[];
  onUpload: (file: File, description?: string) => Promise<void>;
  onDelete: (attachmentId: string) => Promise<void>;
  readonly?: boolean;
  maxFiles?: number;
  maxSizeMB?: number;
  loading?: boolean;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getFileIcon = (fileType: string) => {
  if (fileType === 'image') {
    return <PhotoIcon className="w-5 h-5 text-blue-500" />;
  } else if (fileType === 'pdf') {
    return <DocumentIcon className="w-5 h-5 text-red-500" />;
  }
  return <PaperClipIcon className="w-5 h-5 text-gray-500" />;
};

export const FileAttachment: React.FC<FileAttachmentProps> = ({
  attachments,
  onUpload,
  onDelete,
  readonly = false,
  maxFiles = 10,
  maxSizeMB = 10,
  loading = false,
}) => {
  const { t } = useTranslation('common');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError(t('upload.invalidType'));
      return;
    }

    // Validate file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setUploadError(t('upload.fileTooLarge'));
      return;
    }

    // Check max files limit
    if (attachments.length >= maxFiles) {
      setUploadError(t('attachments.maxFilesReached', { max: maxFiles }));
      return;
    }

    setSelectedFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }

    setShowUploadModal(true);

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      await onUpload(selectedFile, description || undefined);
      setShowUploadModal(false);
      setSelectedFile(null);
      setDescription('');
      setPreviewUrl(null);
    } catch (err: any) {
      setUploadError(err.response?.data?.message || t('upload.uploadError'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (attachmentId: string) => {
    if (!window.confirm(t('attachments.confirmDelete'))) return;

    setDeletingId(attachmentId);
    try {
      await onDelete(attachmentId);
    } catch (err: any) {
      console.error('Failed to delete attachment:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = (attachment: MedicalAttachment) => {
    window.open(attachment.fileUrl, '_blank');
  };

  const handleImageClick = (url: string) => {
    setImagePreview(url);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-brand-dark dark:text-[var(--app-text-primary)] flex items-center gap-2">
          <PaperClipIcon className="w-5 h-5" />
          {t('attachments.title')} ({attachments.length})
        </h4>
        {!readonly && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={loading || attachments.length >= maxFiles}
            className="btn btn-secondary btn-sm flex items-center gap-1"
          >
            <PlusIcon className="w-4 h-4" />
            {t('attachments.addAttachment')}
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Error Message */}
      {uploadError && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-lg text-sm">
          {uploadError}
        </div>
      )}

      {/* Attachments List */}
      {attachments.length === 0 ? (
        <div className="text-center py-6 text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-[var(--app-bg-tertiary)] rounded-lg">
          <PaperClipIcon className="w-8 h-8 mx-auto mb-2" />
          <p>{t('attachments.noAttachments')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-[var(--app-bg-tertiary)] rounded-lg hover:bg-gray-100 dark:hover:bg-[var(--app-bg-elevated)] transition-colors"
            >
              {/* File Icon / Thumbnail */}
              {attachment.fileType === 'image' ? (
                <img
                  src={attachment.fileUrl}
                  alt={attachment.fileName}
                  className="w-12 h-12 object-cover rounded cursor-pointer"
                  onClick={() => handleImageClick(attachment.fileUrl)}
                />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center bg-white dark:bg-[var(--app-bg-card)] rounded border dark:border-[var(--app-border-default)]">
                  {getFileIcon(attachment.fileType)}
                </div>
              )}

              {/* File Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-brand-dark dark:text-[var(--app-text-primary)] truncate">
                  {attachment.fileName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {formatFileSize(attachment.fileSize)}
                  {attachment.description && ` - ${attachment.description}`}
                </p>
                {attachment.uploader && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {attachment.uploader.firstName} {attachment.uploader.lastName}
                  </p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => handleDownload(attachment)}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30 rounded-lg transition-colors"
                    title={t('attachments.download')}
                  >
                    <ArrowDownTrayIcon className="w-5 h-5" />
                  </button>
                )}
                {!readonly && (
                  <button
                    type="button"
                    onClick={() => handleDelete(attachment.id)}
                    disabled={deletingId === attachment.id}
                    className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title={t('attachments.delete')}
                  >
                    {deletingId === attachment.id ? (
                      <ArrowPathIcon className="w-5 h-5 animate-spin" />
                    ) : (
                      <TrashIcon className="w-5 h-5" />
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-[var(--app-bg-card)] rounded-xl shadow-xl dark:shadow-2xl dark:shadow-black/50 max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-brand-dark dark:text-[var(--app-text-primary)]">
                {t('attachments.addAttachment')}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setDescription('');
                  setPreviewUrl(null);
                }}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Preview */}
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Preview"
                className="w-full h-48 object-contain bg-gray-100 dark:bg-[var(--app-bg-tertiary)] rounded-lg mb-4"
              />
            ) : selectedFile && (
              <div className="w-full h-48 flex items-center justify-center bg-gray-100 dark:bg-[var(--app-bg-tertiary)] rounded-lg mb-4">
                {getFileIcon(selectedFile.type === 'application/pdf' ? 'pdf' : 'document')}
                <span className="ml-2 text-gray-600 dark:text-gray-400">{selectedFile.name}</span>
              </div>
            )}

            {/* File Info */}
            {selectedFile && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                {selectedFile.name} ({formatFileSize(selectedFile.size)})
              </p>
            )}

            {/* Description Input */}
            <div className="mb-4">
              <label className="label">{t('attachments.description')}</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('attachments.description')}
                className="input"
              />
            </div>

            {/* Error */}
            {uploadError && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-lg text-sm mb-4">
                {uploadError}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setDescription('');
                  setPreviewUrl(null);
                }}
                className="btn btn-secondary flex-1"
                disabled={isUploading}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                onClick={handleUpload}
                className="btn btn-primary flex-1 flex items-center justify-center gap-2"
                disabled={isUploading}
              >
                {isUploading ? (
                  <>
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    {t('upload.uploading')}
                  </>
                ) : (
                  t('upload.uploadSuccess').replace('تم الرفع بنجاح', 'رفع').replace('Upload successful', 'Upload')
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {imagePreview && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setImagePreview(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300"
            onClick={() => setImagePreview(null)}
          >
            <XMarkIcon className="w-8 h-8" />
          </button>
          <img
            src={imagePreview}
            alt="Preview"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};
