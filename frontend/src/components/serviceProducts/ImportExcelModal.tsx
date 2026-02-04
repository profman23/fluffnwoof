import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowUpTrayIcon, DocumentIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { serviceProductsApi } from '../../api/serviceProducts';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import * as XLSX from 'xlsx';

interface Props {
  onClose: () => void;
}

export const ImportExcelModal = ({ onClose }: Props) => {
  const { t } = useTranslation('serviceProducts');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      if (
        droppedFile.type ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
        droppedFile.type === 'application/vnd.ms-excel'
      ) {
        setFile(droppedFile);
        setError('');
        setResult(null);
      } else {
        setError(t('import.invalidFileType'));
      }
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const importResult = await serviceProductsApi.importFromExcel(file);
      setResult(importResult);
    } catch (err: any) {
      setError(err.response?.data?.message || t('import.error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create workbook
    const wb = XLSX.utils.book_new();

    // Create worksheet with proper structure
    const ws: XLSX.WorkSheet = {};

    // Header row (Row 1) - Clear column names with proper spacing
    ws['A1'] = { t: 's', v: 'Name / الاسم' };
    ws['B1'] = { t: 's', v: '' };
    ws['C1'] = { t: 's', v: 'Category / التصنيف' };
    ws['D1'] = { t: 's', v: '' };
    ws['E1'] = { t: 's', v: '' };
    ws['F1'] = { t: 's', v: 'Price Before Tax / السعر قبل الضريبة' };
    ws['G1'] = { t: 's', v: 'Tax Rate % / نسبة الضريبة' };
    ws['H1'] = { t: 's', v: 'Price After Tax / السعر بعد الضريبة' };

    // Sample row 1 (Row 2)
    ws['A2'] = { t: 's', v: 'فحص عام - General Checkup' };
    ws['B2'] = { t: 's', v: '' };
    ws['C2'] = { t: 's', v: 'خدمات طبية - Medical Services' };
    ws['D2'] = { t: 's', v: '' };
    ws['E2'] = { t: 's', v: '' };
    ws['F2'] = { t: 'n', v: 100 };
    ws['G2'] = { t: 'n', v: 15 };
    ws['H2'] = { t: 'n', f: 'F2*(1+G2/100)', v: 115 };

    // Sample row 2 (Row 3)
    ws['A3'] = { t: 's', v: 'تطعيم - Vaccination' };
    ws['B3'] = { t: 's', v: '' };
    ws['C3'] = { t: 's', v: 'خدمات طبية - Medical Services' };
    ws['D3'] = { t: 's', v: '' };
    ws['E3'] = { t: 's', v: '' };
    ws['F3'] = { t: 'n', v: 200 };
    ws['G3'] = { t: 'n', v: 0 };
    ws['H3'] = { t: 'n', f: 'F3*(1+G3/100)', v: 200 };

    // Add 20 empty rows with formulas ready for user to fill
    for (let row = 4; row <= 23; row++) {
      ws[`A${row}`] = { t: 's', v: '' };
      ws[`B${row}`] = { t: 's', v: '' };
      ws[`C${row}`] = { t: 's', v: '' };
      ws[`D${row}`] = { t: 's', v: '' };
      ws[`E${row}`] = { t: 's', v: '' };
      ws[`F${row}`] = { t: 'n', v: 0 };
      ws[`G${row}`] = { t: 'n', v: 15 };
      ws[`H${row}`] = { t: 'n', f: `F${row}*(1+G${row}/100)`, v: 0 };
    }

    // Set worksheet range
    ws['!ref'] = 'A1:H23';

    // Set column widths for better readability
    ws['!cols'] = [
      { wch: 40 }, // A - Name
      { wch: 3 },  // B (hidden/empty)
      { wch: 35 }, // C - Category
      { wch: 3 },  // D (hidden/empty)
      { wch: 3 },  // E (hidden/empty)
      { wch: 35 }, // F - Price Before Tax
      { wch: 25 }, // G - Tax Rate
      { wch: 35 }, // H - Price After Tax
    ];

    // Set row height for header
    ws['!rows'] = [{ hpt: 25 }];

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Services & Products');

    // Download file
    XLSX.writeFile(wb, 'services_products_template.xlsx');
  };

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`📥 ${t('import.title')}`}
      size="md"
    >
      <div className="space-y-4">
        {/* Format Info */}
        <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
          <div className="flex items-start justify-between gap-4">
            <div className="text-sm text-blue-700 dark:text-blue-300">
              <p className="font-medium mb-2">📋 {t('import.formatTitle')}</p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li><span className="font-medium">A:</span> {t('import.colName')}</li>
                <li><span className="font-medium">C:</span> {t('import.colCategory')}</li>
                <li><span className="font-medium">F:</span> {t('import.colPriceBeforeTax')}</li>
                <li><span className="font-medium">G:</span> {t('import.colTaxRate')}</li>
                <li><span className="font-medium">H:</span> {t('import.colPriceAfterTax')}</li>
              </ul>
            </div>
            <Button
              variant="secondary"
              type="button"
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 whitespace-nowrap"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              {t('import.downloadTemplate')}
            </Button>
          </div>
        </div>

        {/* Drop Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-[var(--app-border-default)] rounded-lg p-8 text-center cursor-pointer hover:border-secondary-400 dark:hover:border-secondary-500 hover:bg-secondary-50 dark:hover:bg-secondary-900/20 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileChange}
            className="hidden"
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <DocumentIcon className="w-10 h-10 text-secondary-600 dark:text-secondary-400" />
              <div className="text-start">
                <p className="font-medium text-gray-900 dark:text-[var(--app-text-primary)]">{file.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
          ) : (
            <>
              <ArrowUpTrayIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-300">{t('import.dropZone')}</p>
              <p className="text-sm text-gray-400 mt-1">
                {t('import.supportedFormats')}
              </p>
            </>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <div
            className={`p-3 rounded-lg text-sm ${
              result.failed > 0 ? 'bg-yellow-50 dark:bg-yellow-900/30' : 'bg-green-50 dark:bg-green-900/30'
            }`}
          >
            <p
              className={`font-medium ${
                result.failed > 0 ? 'text-yellow-700 dark:text-yellow-400' : 'text-green-700 dark:text-green-400'
              }`}
            >
              {result.failed > 0 ? '⚠️' : '✅'} {t('import.result', {
                success: result.success,
                failed: result.failed,
              })}
            </p>
            {result.errors.length > 0 && (
              <ul className="mt-2 text-xs text-yellow-600 dark:text-yellow-400 list-disc list-inside">
                {result.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {result.errors.length > 5 && (
                  <li>...{result.errors.length - 5} more</li>
                )}
              </ul>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            {result ? t('import.close') : t('import.cancel')}
          </Button>
          {!result && (
            <Button
              variant="primary"
              onClick={handleImport}
              disabled={!file || loading}
              className="flex-1"
            >
              {loading ? t('import.importing') : t('import.importBtn')}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
