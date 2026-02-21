import React, { useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import * as XLSX from 'xlsx';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { ScreenPermissionGuard } from '../components/common/ScreenPermissionGuard';
import { importApi, ImportRow, ImportRowResult, ImportSummary } from '../api/import';

// ─────────────────────────────────────────────
// Valid enum values (must match Prisma schema)
// ─────────────────────────────────────────────
const VALID_SPECIES = [
  'DOG', 'CAT', 'BIRD', 'RABBIT', 'HAMSTER', 'GUINEA_PIG', 'TURTLE', 'FISH',
  'HORSE', 'GOAT', 'SHEEP', 'COW', 'CAMEL', 'DONKEY', 'MONKEY', 'FERRET',
  'HEDGEHOG', 'SNAKE', 'LIZARD', 'FROG', 'CHICKEN', 'DUCK', 'PIG', 'ALPACA', 'OTHER',
];
const VALID_GENDERS = ['MALE', 'FEMALE'];

// ─────────────────────────────────────────────
// Template column definitions
// ─────────────────────────────────────────────
const HEADERS_EN = [
  'First Name *',
  'Last Name *',
  'Phone *',
  'Email',
  'Pet Name *',
  'Species *',
  'Gender *',
  'Breed',
  'Birth Date (YYYY-MM-DD)',
  'Color',
  'Weight (kg)',
];
const HEADERS_AR = [
  'الاسم الأول *',
  'الاسم الثاني *',
  'رقم الهاتف *',
  'البريد الإلكتروني',
  'اسم الأليف *',
  'نوع الأليف *',
  'الجنس *',
  'السلالة',
  'تاريخ الميلاد (YYYY-MM-DD)',
  'اللون',
  'الوزن (كجم)',
];
const EXAMPLE_ROW = [
  'محمد',
  'العمري',
  '0501234567',
  'owner@email.com',
  'بسبوس',
  'CAT',
  'MALE',
  'Persian',
  '2022-06-15',
  'رمادي',
  '4.5',
];

// ─────────────────────────────────────────────
// Row validation
// ─────────────────────────────────────────────
interface ParsedRow {
  index: number; // 1-based row number (excluding header rows)
  raw: Record<string, string>;
  owner: ImportRow['owner'];
  pet: ImportRow['pet'];
  errors: string[];
  isValid: boolean;
}

function validateParsedRow(raw: string[], rowIndex: number, t: any): ParsedRow {
  const [firstName, lastName, phone, email, petName, species, gender, breed, birthDate, color, weight] = raw.map(
    (v) => String(v ?? '').trim()
  );

  const errors: string[] = [];

  if (!firstName) errors.push(t('errors.firstNameRequired'));
  if (!lastName) errors.push(t('errors.lastNameRequired'));
  if (!phone) errors.push(t('errors.phoneRequired'));
  if (!petName) errors.push(t('errors.petNameRequired'));

  const speciesUpper = species.toUpperCase();
  if (!species) {
    errors.push(t('errors.speciesRequired'));
  } else if (!VALID_SPECIES.includes(speciesUpper)) {
    errors.push(t('errors.speciesInvalid', { value: species }));
  }

  const genderUpper = gender.toUpperCase();
  if (!gender) {
    errors.push(t('errors.genderRequired'));
  } else if (!VALID_GENDERS.includes(genderUpper)) {
    errors.push(t('errors.genderInvalid'));
  }

  if (birthDate) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(birthDate)) {
      errors.push(t('errors.birthDateInvalid'));
    } else if (new Date(birthDate) > new Date()) {
      errors.push(t('errors.birthDateFuture'));
    }
  }

  const parsedWeight = weight ? parseFloat(weight) : undefined;
  if (weight && (isNaN(parsedWeight!) || parsedWeight! <= 0)) {
    errors.push(t('errors.weightInvalid'));
  }

  return {
    index: rowIndex,
    raw: {
      firstName, lastName, phone, email, petName, species, gender, breed, birthDate, color, weight,
    },
    owner: {
      firstName,
      lastName,
      phone,
      email: email || undefined,
    },
    pet: {
      name: petName,
      species: speciesUpper,
      gender: genderUpper,
      breed: breed || undefined,
      birthDate: birthDate || undefined,
      color: color || undefined,
      weight: parsedWeight && !isNaN(parsedWeight) ? parsedWeight : undefined,
    },
    errors,
    isValid: errors.length === 0,
  };
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────
type PageState = 'initial' | 'preview' | 'results';

export const ImportClientsPage: React.FC = () => {
  const { t, i18n } = useTranslation('import');
  const isRtl = i18n.language === 'ar';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [pageState, setPageState] = useState<PageState>('initial');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [importResults, setImportResults] = useState<ImportSummary | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [parseError, setParseError] = useState('');

  // ──────────────────────────────────────────
  // Download Template
  // ──────────────────────────────────────────
  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const wsData = [HEADERS_EN, HEADERS_AR, EXAMPLE_ROW];
    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Set column widths
    ws['!cols'] = [
      { wch: 16 }, // First Name
      { wch: 16 }, // Last Name
      { wch: 16 }, // Phone
      { wch: 24 }, // Email
      { wch: 14 }, // Pet Name
      { wch: 12 }, // Species
      { wch: 10 }, // Gender
      { wch: 16 }, // Breed
      { wch: 22 }, // Birth Date
      { wch: 12 }, // Color
      { wch: 12 }, // Weight
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Clients & Pets');

    // Species reference sheet
    const speciesData = [
      ['Valid Species Values / قيم النوع المقبولة'],
      ...VALID_SPECIES.map((s) => [s]),
    ];
    const wsSpecies = XLSX.utils.aoa_to_sheet(speciesData);
    wsSpecies['!cols'] = [{ wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsSpecies, 'Species List');

    XLSX.writeFile(wb, 'clients-pets-template.xlsx');
  };

  // ──────────────────────────────────────────
  // Parse File
  // ──────────────────────────────────────────
  const parseFile = useCallback(
    (file: File) => {
      setParseError('');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const wb = XLSX.read(data, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          // header: 1 → array of arrays; defval → empty cells become ''
          const allRows = XLSX.utils.sheet_to_json<string[]>(ws, { header: 1, defval: '' });

          // Skip first 2 rows (EN headers + AR headers) and the example row (row 3)
          const dataRows = allRows.slice(3).filter((row) => row.some((cell) => String(cell).trim() !== ''));

          if (dataRows.length === 0) {
            setParseError(t('errors.noValidRows'));
            return;
          }

          if (dataRows.length > 5000) {
            setParseError(t('errors.tooManyRows'));
            return;
          }

          const parsed = dataRows.map((row, i) => validateParsedRow(row, i + 1, t));
          setParsedRows(parsed);
          setFileName(file.name);
          setPageState('preview');
        } catch {
          setParseError(t('errors.parseError'));
        }
      };
      reader.readAsArrayBuffer(file);
    },
    [t]
  );

  const handleFileSelect = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(ext ?? '')) {
      setParseError(t('errors.parseError'));
      return;
    }
    parseFile(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
  };

  // ──────────────────────────────────────────
  // Import
  // ──────────────────────────────────────────
  const handleImport = async () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setIsImporting(true);
    try {
      const rows: ImportRow[] = validRows.map((r) => ({ owner: r.owner, pet: r.pet }));
      const summary = await importApi.clientsPets(rows);
      setImportResults(summary);
      setPageState('results');
    } catch (error: any) {
      setParseError(error.response?.data?.message || t('errors.importFailed'));
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = () => {
    setPageState('initial');
    setParsedRows([]);
    setImportResults(null);
    setFileName('');
    setParseError('');
    setIsDragging(false);
  };

  // ──────────────────────────────────────────
  // Counts
  // ──────────────────────────────────────────
  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.filter((r) => !r.isValid).length;

  // ──────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────
  return (
    <ScreenPermissionGuard screenName="importClients">
      <div className="page-container">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-[var(--app-text-primary)] mb-6">
          📥 {t('clientsPets.title')}
        </h1>

        {/* ── INITIAL STATE ── */}
        {pageState === 'initial' && (
          <div className="space-y-6">
            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((step) => (
                <Card key={step} className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center font-bold text-sm shrink-0">
                      {step}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-[var(--app-text-primary)] text-sm mb-1">
                        {t(`clientsPets.steps.step${step}Title`)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {t(`clientsPets.steps.step${step}Desc`)}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Download Template */}
            <Card className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-gray-800 dark:text-[var(--app-text-primary)] mb-1">
                    📄 {t('clientsPets.steps.step1Title')}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {t('clientsPets.templateNote')}
                  </p>
                </div>
                <Button variant="primary" onClick={handleDownloadTemplate} className="shrink-0">
                  ⬇️ {t('clientsPets.downloadTemplate')}
                </Button>
              </div>
            </Card>

            {/* Upload Area */}
            <Card className="p-6">
              <h2 className="font-semibold text-gray-800 dark:text-[var(--app-text-primary)] mb-4">
                📤 {t('clientsPets.uploadSection.title')}
              </h2>

              {parseError && (
                <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {parseError}
                </div>
              )}

              <div
                className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                  isDragging
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                    : 'border-gray-300 dark:border-[var(--app-border-default)] hover:border-primary-400 dark:hover:border-primary-600'
                }`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
              >
                <div className="text-4xl mb-3">📁</div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">
                  {t('clientsPets.uploadSection.dragDrop')}
                </p>
                <p className="text-gray-400 dark:text-gray-500 text-sm mb-3">
                  {t('clientsPets.uploadSection.or')}
                </p>
                <span className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors">
                  {t('clientsPets.uploadSection.browse')}
                </span>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
                  {t('clientsPets.uploadSection.supportedFormats')} · {t('clientsPets.uploadSection.maxRows')}
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleInputChange}
              />
            </Card>

            {/* Species reference */}
            <Card className="p-4">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                ℹ️ {t('clientsPets.speciesNote')}
              </p>
            </Card>
          </div>
        )}

        {/* ── PREVIEW STATE ── */}
        {pageState === 'preview' && (
          <div className="space-y-4">
            {/* Summary bar */}
            <Card className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    📄 {fileName}
                  </span>
                  <span className="badge-success px-2 py-1 rounded-full text-xs font-medium">
                    ✅ {validCount} {isRtl ? 'صالح' : 'valid'}
                  </span>
                  {invalidCount > 0 && (
                    <span className="badge-danger px-2 py-1 rounded-full text-xs font-medium">
                      ❌ {invalidCount} {isRtl ? 'خطأ' : 'invalid'}
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={handleReset} disabled={isImporting}>
                    {t('clientsPets.preview.changeFile')}
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleImport}
                    disabled={validCount === 0 || isImporting}
                  >
                    {isImporting
                      ? t('clientsPets.importing')
                      : t('clientsPets.preview.importBtn', { count: validCount })}
                  </Button>
                </div>
              </div>
              {parseError && (
                <div className="mt-3 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-lg text-sm">
                  {parseError}
                </div>
              )}
            </Card>

            {/* Preview Table */}
            <Card className="p-0 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-3 py-3 text-center w-10">{t('clientsPets.preview.columns.row')}</th>
                      <th className="px-3 py-3 text-center w-24">{t('clientsPets.preview.columns.status')}</th>
                      <th className="px-3 py-3">{t('clientsPets.preview.columns.firstName')}</th>
                      <th className="px-3 py-3">{t('clientsPets.preview.columns.lastName')}</th>
                      <th className="px-3 py-3">{t('clientsPets.preview.columns.phone')}</th>
                      <th className="px-3 py-3">{t('clientsPets.preview.columns.email')}</th>
                      <th className="px-3 py-3">{t('clientsPets.preview.columns.petName')}</th>
                      <th className="px-3 py-3">{t('clientsPets.preview.columns.species')}</th>
                      <th className="px-3 py-3">{t('clientsPets.preview.columns.gender')}</th>
                      <th className="px-3 py-3">{t('clientsPets.preview.columns.breed')}</th>
                      <th className="px-3 py-3 min-w-[200px]">{t('clientsPets.preview.columns.error')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.map((row) => (
                      <tr
                        key={row.index}
                        className={
                          row.isValid
                            ? 'bg-green-50 dark:bg-green-900/10'
                            : 'bg-red-50 dark:bg-red-900/10'
                        }
                      >
                        <td className="px-3 py-2 text-center text-gray-500 dark:text-gray-400 text-xs">{row.index}</td>
                        <td className="px-3 py-2 text-center">
                          {row.isValid ? (
                            <span className="badge-success px-2 py-0.5 rounded-full text-xs">✅ {t('clientsPets.status.valid')}</span>
                          ) : (
                            <span className="badge-danger px-2 py-0.5 rounded-full text-xs">❌ {t('clientsPets.status.invalid')}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 dark:text-[var(--app-text-primary)]">{row.raw.firstName}</td>
                        <td className="px-3 py-2 dark:text-[var(--app-text-primary)]">{row.raw.lastName}</td>
                        <td className="px-3 py-2 dark:text-[var(--app-text-secondary)] font-mono text-xs" dir="ltr">{row.raw.phone}</td>
                        <td className="px-3 py-2 dark:text-[var(--app-text-secondary)] text-xs" dir="ltr">{row.raw.email}</td>
                        <td className="px-3 py-2 dark:text-[var(--app-text-primary)]">{row.raw.petName}</td>
                        <td className="px-3 py-2 dark:text-[var(--app-text-secondary)] text-xs font-mono">{row.raw.species}</td>
                        <td className="px-3 py-2 dark:text-[var(--app-text-secondary)] text-xs font-mono">{row.raw.gender}</td>
                        <td className="px-3 py-2 dark:text-[var(--app-text-secondary)] text-xs">{row.raw.breed}</td>
                        <td className="px-3 py-2 text-red-600 dark:text-red-400 text-xs">
                          {row.errors.join(' · ')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {/* ── RESULTS STATE ── */}
        {pageState === 'results' && importResults && (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Card className="p-5 text-center">
                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                  {importResults.imported}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  ✅ {t('clientsPets.status.imported')}
                </div>
              </Card>
              <Card className="p-5 text-center">
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-1">
                  {importResults.petAdded}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  🐾 {t('clientsPets.status.petAdded')}
                </div>
              </Card>
              <Card className="p-5 text-center">
                <div className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mb-1">
                  {importResults.skipped || 0}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  ⏭️ {t('clientsPets.status.skipped')}
                </div>
              </Card>
              <Card className="p-5 text-center">
                <div className="text-3xl font-bold text-red-600 dark:text-red-400 mb-1">
                  {importResults.errors}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  ❌ {t('clientsPets.status.error')}
                </div>
              </Card>
            </div>

            {/* Results Table */}
            <Card className="p-0 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-[var(--app-border-default)] flex items-center justify-between">
                <h2 className="font-semibold text-gray-800 dark:text-[var(--app-text-primary)]">
                  📊 {t('clientsPets.results.title')}
                </h2>
                <Button variant="secondary" onClick={handleReset}>
                  {t('clientsPets.results.importAnother')}
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="table w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-3 py-3 text-center w-10">{t('clientsPets.results.columns.row')}</th>
                      <th className="px-3 py-3 text-center w-28">{t('clientsPets.results.columns.status')}</th>
                      <th className="px-3 py-3">{t('clientsPets.results.columns.ownerName')}</th>
                      <th className="px-3 py-3">{t('clientsPets.results.columns.customerCode')}</th>
                      <th className="px-3 py-3">{t('clientsPets.results.columns.petName')}</th>
                      <th className="px-3 py-3">{t('clientsPets.results.columns.petCode')}</th>
                      <th className="px-3 py-3">{t('clientsPets.results.columns.error')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importResults.results.map((result: ImportRowResult) => (
                      <tr
                        key={result.row}
                        className={
                          result.status === 'imported'
                            ? 'bg-green-50 dark:bg-green-900/10'
                            : result.status === 'pet_added'
                            ? 'bg-blue-50 dark:bg-blue-900/10'
                            : result.status === 'skipped'
                            ? 'bg-yellow-50 dark:bg-yellow-900/10'
                            : 'bg-red-50 dark:bg-red-900/10'
                        }
                      >
                        <td className="px-3 py-2 text-center text-gray-500 dark:text-gray-400 text-xs">{result.row}</td>
                        <td className="px-3 py-2 text-center">
                          {result.status === 'imported' && (
                            <span className="badge-success px-2 py-0.5 rounded-full text-xs">✅ {t('clientsPets.status.imported')}</span>
                          )}
                          {result.status === 'pet_added' && (
                            <span className="badge-info px-2 py-0.5 rounded-full text-xs">🐾 {t('clientsPets.status.petAdded')}</span>
                          )}
                          {result.status === 'skipped' && (
                            <span className="badge-warning px-2 py-0.5 rounded-full text-xs">⏭️ {t('clientsPets.status.skipped')}</span>
                          )}
                          {result.status === 'error' && (
                            <span className="badge-danger px-2 py-0.5 rounded-full text-xs">❌ {t('clientsPets.status.error')}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 dark:text-[var(--app-text-primary)]">{result.ownerName}</td>
                        <td className="px-3 py-2 font-mono text-xs dark:text-[var(--app-text-secondary)]">{result.customerCode || '—'}</td>
                        <td className="px-3 py-2 dark:text-[var(--app-text-primary)]">{result.petName}</td>
                        <td className="px-3 py-2 font-mono text-xs dark:text-[var(--app-text-secondary)]">{result.petCode || '—'}</td>
                        <td className="px-3 py-2 text-red-600 dark:text-red-400 text-xs">{result.error || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </div>
    </ScreenPermissionGuard>
  );
};

export default ImportClientsPage;
