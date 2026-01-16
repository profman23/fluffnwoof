import { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon, ArrowUpTrayIcon, DocumentIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { serviceProductsApi } from '../../api/serviceProducts';
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
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />

        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-semibold">{t('import.title')}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Format Info */}
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start justify-between gap-4">
                <div className="text-sm text-blue-700">
                  <p className="font-medium mb-2">{t('import.formatTitle')}</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li><span className="font-medium">A:</span> {t('import.colName')}</li>
                    <li><span className="font-medium">C:</span> {t('import.colCategory')}</li>
                    <li><span className="font-medium">F:</span> {t('import.colPriceBeforeTax')}</li>
                    <li><span className="font-medium">G:</span> {t('import.colTaxRate')}</li>
                    <li><span className="font-medium">H:</span> {t('import.colPriceAfterTax')}</li>
                  </ul>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
                >
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  {t('import.downloadTemplate')}
                </button>
              </div>
            </div>

            {/* Drop Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
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
                  <DocumentIcon className="w-10 h-10 text-blue-600" />
                  <div className="text-start">
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <ArrowUpTrayIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">{t('import.dropZone')}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    {t('import.supportedFormats')}
                  </p>
                </>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Result */}
            {result && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  result.failed > 0 ? 'bg-yellow-50' : 'bg-green-50'
                }`}
              >
                <p
                  className={`font-medium ${
                    result.failed > 0 ? 'text-yellow-700' : 'text-green-700'
                  }`}
                >
                  {t('import.result', {
                    success: result.success,
                    failed: result.failed,
                  })}
                </p>
                {result.errors.length > 0 && (
                  <ul className="mt-2 text-xs text-yellow-600 list-disc list-inside">
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
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                {result ? t('import.close') : t('import.cancel')}
              </button>
              {!result && (
                <button
                  onClick={handleImport}
                  disabled={!file || loading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? t('import.importing') : t('import.importBtn')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
