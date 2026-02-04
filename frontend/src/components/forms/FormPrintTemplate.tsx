/**
 * Professional Form Print Template
 * Modern design with QR codes, watermarks, decorative borders, and security features
 */

import { forwardRef, useImperativeHandle, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { getFormSettings, FormSettings } from '../../api/clinicSettings';
import QRCode from 'qrcode';

interface FormPrintTemplateProps {
  content: string;
  contentAr?: string;
  formName?: string;
  formNameAr?: string;
  showClientSignature?: boolean;
  showVetSignature?: boolean;
  clientSignatureUrl?: string;
  vetSignatureUrl?: string;
  clientSignedAt?: string;
  vetSignedAt?: string;
  petName?: string;
  ownerName?: string;
  documentNumber?: string;
  className?: string;
}

export interface FormPrintTemplateRef {
  print: () => void;
  printProfessional: () => Promise<void>;
}

// Generate document number if not provided
const generateDocNumber = (): string => {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `FNW-${dateStr}-${random}`;
};

// Format date for display
const formatDateDisplay = (lang: 'en' | 'ar'): string => {
  const date = new Date();
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return date.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US', options);
};

// Generate real QR code as data URL using qrcode library
const generateQRCodeDataUrl = async (data: string): Promise<string> => {
  try {
    const dataUrl = await QRCode.toDataURL(data, {
      width: 100,
      margin: 1,
      color: {
        dark: '#1a1a1a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    // Return a fallback placeholder
    return 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="white" width="100" height="100"/><text x="50" y="55" text-anchor="middle" font-size="12" fill="gray">QR</text></svg>';
  }
};

// Professional print CSS styles
const getProfessionalPrintStyles = (settings: FormSettings | undefined) => `
  :root {
    --primary-color: #1a1a1a;
    --primary-light: #333333;
    --primary-dark: #000000;
    --gold: #d4a574;
    --gold-light: #f5e6d3;
    --text-primary: #1f2937;
    --text-secondary: #4b5563;
    --text-muted: #9ca3af;
    --border-color: #e5e7eb;
    --bg-light: #f9fafb;
  }

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  @page {
    size: A4;
    margin: 15mm;
  }

  body {
    font-family: 'Cairo', 'Segoe UI', system-ui, sans-serif;
    font-size: ${settings?.fontSize || 14}px;
    line-height: 1.8;
    color: var(--text-primary);
    background: #fff;
  }

  .page {
    position: relative;
    min-height: 100vh;
    padding: 40px;
    page-break-after: always;
    background: #fff;
  }

  .page:last-child {
    page-break-after: avoid;
  }

  /* Corner frames removed */
  .corner-frame {
    display: none;
  }

  /* Watermark */
  .watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-30deg);
    font-size: 100px;
    font-weight: 800;
    color: rgba(0, 0, 0, 0.03);
    white-space: nowrap;
    pointer-events: none;
    z-index: 0;
    letter-spacing: 8px;
  }

  /* Paw Print Decoration */
  .paw-decoration {
    position: absolute;
    opacity: 0.03;
    font-size: 180px;
    z-index: 0;
    pointer-events: none;
  }

  .paw-decoration.top-right {
    top: 100px;
    right: 50px;
    transform: rotate(15deg);
  }

  .paw-decoration.bottom-left {
    bottom: 150px;
    left: 50px;
    transform: rotate(-15deg);
  }

  /* Header */
  .header {
    position: relative;
    z-index: 1;
    text-align: center;
    padding-bottom: 25px;
    margin-bottom: 25px;
    border-bottom: 2px solid var(--border-color);
  }

  .header::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: 100px;
    height: 2px;
    background: linear-gradient(90deg, var(--primary-color), var(--gold));
  }

  .logo-container {
    margin-bottom: 15px;
  }

  .logo-container.left { text-align: left; }
  .logo-container.center { text-align: center; }
  .logo-container.right { text-align: right; }

  .logo {
    max-height: 80px;
    max-width: 200px;
    object-fit: contain;
  }

  .clinic-name {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: 1.8em;
    font-weight: 700;
    color: var(--primary-dark);
    margin: 10px 0 5px;
    letter-spacing: 1px;
  }

  .clinic-info {
    color: var(--text-secondary);
    font-size: 0.9em;
    margin: 3px 0;
  }

  /* Document Info Bar */
  .doc-info-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: linear-gradient(135deg, var(--bg-light), #fff);
    border: 1px solid var(--border-color);
    border-radius: 10px;
    padding: 12px 20px;
    margin-bottom: 25px;
    position: relative;
    z-index: 1;
  }

  .doc-info-item {
    text-align: center;
  }

  .doc-info-label {
    font-size: 0.7em;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: var(--text-muted);
    margin-bottom: 3px;
  }

  .doc-info-value {
    font-weight: 600;
    color: var(--primary-dark);
    font-size: 0.9em;
  }

  .qr-code {
    width: 70px;
    height: 70px;
    padding: 5px;
    background: #fff;
    border: 1px solid var(--border-color);
    border-radius: 8px;
  }

  /* Form Title */
  .form-title {
    text-align: center;
    margin-bottom: 25px;
    position: relative;
    z-index: 1;
  }

  .form-title h1 {
    font-size: 1.4em;
    font-weight: 700;
    color: var(--primary-dark);
    margin: 0;
    padding: 10px 30px;
    display: inline-block;
    position: relative;
  }

  .form-title h1::before,
  .form-title h1::after {
    content: '✦';
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    color: var(--gold);
    font-size: 0.6em;
  }

  .form-title h1::before { left: 0; }
  .form-title h1::after { right: 0; }

  /* Content */
  .content {
    position: relative;
    z-index: 1;
    background: #fff;
    padding: 20px;
    margin-bottom: 30px;
    text-align: justify;
  }

  .content p {
    margin: 12px 0;
  }

  .content ul, .content ol {
    margin: 12px 0;
    padding-left: 25px;
  }

  [dir="rtl"] .content ul, [dir="rtl"] .content ol {
    padding-left: 0;
    padding-right: 25px;
  }

  .content li {
    margin: 6px 0;
  }

  .content h1, .content h2, .content h3 {
    color: var(--primary-dark);
    margin: 18px 0 10px;
  }

  .content h1 { font-size: 1.5em; }
  .content h2 { font-size: 1.3em; }
  .content h3 { font-size: 1.1em; }

  /* Signatures Section */
  .signatures-section {
    position: relative;
    z-index: 1;
    margin-top: 40px;
    padding-top: 25px;
    border-top: 2px dashed var(--border-color);
  }

  .signatures-title {
    text-align: center;
    font-size: 0.85em;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 2px;
    margin-bottom: 25px;
  }

  .signatures-grid {
    display: flex;
    justify-content: space-around;
    align-items: flex-start;
    gap: 40px;
  }

  .signature-box {
    flex: 1;
    max-width: 220px;
    text-align: center;
  }

  .signature-area {
    height: 70px;
    border: 2px solid var(--border-color);
    border-radius: 8px;
    background: linear-gradient(to bottom, #fff, var(--bg-light));
    margin-bottom: 8px;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .signature-area img {
    max-height: 60px;
    max-width: 180px;
  }

  .signature-area .sign-here {
    position: absolute;
    bottom: 4px;
    right: 8px;
    font-size: 0.6em;
    color: var(--text-muted);
    font-style: italic;
  }

  [dir="rtl"] .signature-area .sign-here {
    right: auto;
    left: 8px;
  }

  .signature-line {
    border-bottom: 2px solid var(--text-primary);
    margin-bottom: 6px;
  }

  .signature-label {
    font-weight: 600;
    color: var(--text-secondary);
    font-size: 0.85em;
  }

  .signature-sublabel {
    font-size: 0.75em;
    color: var(--text-muted);
    margin-top: 3px;
  }

  .signature-date {
    font-size: 0.7em;
    color: var(--text-muted);
    margin-top: 4px;
  }

  /* Security Strip */
  .security-strip {
    position: absolute;
    bottom: 75px;
    left: 40px;
    right: 40px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 15px;
    background: linear-gradient(90deg, var(--gold-light), #fff, var(--gold-light));
    border-radius: 5px;
    font-size: 0.7em;
    color: var(--text-muted);
  }

  .security-strip svg {
    width: 16px;
    height: 16px;
    fill: var(--gold);
    flex-shrink: 0;
  }

  /* Footer */
  .footer {
    position: absolute;
    bottom: 25px;
    left: 40px;
    right: 40px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.75em;
    color: var(--text-muted);
    padding-top: 12px;
    border-top: 1px solid var(--border-color);
  }

  .page-number {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    background: var(--primary-color);
    color: #fff;
    border-radius: 50%;
    font-weight: 600;
    font-size: 0.85em;
  }

  /* Print-specific styles */
  @media print {
    body {
      background: #fff;
      print-color-adjust: exact;
      -webkit-print-color-adjust: exact;
    }

    .page {
      padding: 25px;
      min-height: auto;
    }

    .watermark {
      font-size: 80px;
    }

    .no-print {
      display: none !important;
    }
  }
`;

// Generate professional print HTML
const generateProfessionalPrintHTML = (
  settings: FormSettings | undefined,
  props: FormPrintTemplateProps,
  docNumber: string,
  qrCodeAr: string,
  qrCodeEn: string
): string => {
  const formatSignatureDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${props.formName || 'Document'} - ${docNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>${getProfessionalPrintStyles(settings)}</style>
</head>
<body>
  <!-- Arabic Page -->
  <div class="page" dir="rtl">
    <div class="watermark">${settings?.clinicNameAr || 'فلف أند ووف'}</div>
    <div class="paw-decoration top-right">🐾</div>
    <div class="paw-decoration bottom-left">🐾</div>

    <div class="header">
      ${settings?.logoUrl ? `
        <div class="logo-container ${settings.logoPosition || 'center'}">
          <img src="${settings.logoUrl}" alt="Logo" class="logo" />
        </div>
      ` : ''}
      <h2 class="clinic-name">${settings?.clinicNameAr || 'فلف أند ووف'}</h2>
      ${settings?.addressAr ? `<p class="clinic-info">📍 ${settings.addressAr}</p>` : ''}
      ${settings?.phoneNumber ? `<p class="clinic-info">📞 ${settings.phoneNumber}</p>` : ''}
    </div>

    <div class="doc-info-bar">
      <div class="doc-info-item">
        <div class="doc-info-label">رقم الوثيقة</div>
        <div class="doc-info-value">${docNumber}</div>
      </div>
      <div class="doc-info-item">
        <div class="doc-info-label">التاريخ</div>
        <div class="doc-info-value">${formatDateDisplay('ar')}</div>
      </div>
      ${props.petName ? `
        <div class="doc-info-item">
          <div class="doc-info-label">اسم الحيوان</div>
          <div class="doc-info-value">${props.petName}</div>
        </div>
      ` : ''}
      ${props.ownerName ? `
        <div class="doc-info-item">
          <div class="doc-info-label">اسم المالك</div>
          <div class="doc-info-value">${props.ownerName}</div>
        </div>
      ` : ''}
      <img src="${qrCodeAr}" alt="QR Code" class="qr-code" />
    </div>

    ${props.formNameAr ? `
      <div class="form-title">
        <h1>${props.formNameAr}</h1>
      </div>
    ` : ''}

    <div class="content">
      ${props.contentAr || props.content}
    </div>

    ${(settings?.showClientSignature && props.showClientSignature) || (settings?.showVetSignature && props.showVetSignature) ? `
      <div class="signatures-section">
        <div class="signatures-title">التوقيعات</div>
        <div class="signatures-grid">
          ${settings?.showClientSignature && props.showClientSignature ? `
            <div class="signature-box">
              <div class="signature-area">
                ${props.clientSignatureUrl ? `<img src="${props.clientSignatureUrl}" alt="Client Signature" />` : '<span class="sign-here">وقّع هنا</span>'}
              </div>
              <div class="signature-line"></div>
              <div class="signature-label">${settings.clientSignatureLabelAr || 'توقيع العميل'}</div>
              ${props.clientSignedAt ? `<div class="signature-date">${formatSignatureDate(props.clientSignedAt)}</div>` : '<div class="signature-sublabel">التاريخ: ___/___/_____</div>'}
            </div>
          ` : ''}
          ${settings?.showVetSignature && props.showVetSignature ? `
            <div class="signature-box">
              <div class="signature-area">
                ${props.vetSignatureUrl ? `<img src="${props.vetSignatureUrl}" alt="Vet Signature" />` : '<span class="sign-here">وقّع هنا</span>'}
              </div>
              <div class="signature-line"></div>
              <div class="signature-label">${settings.vetSignatureLabelAr || 'توقيع الطبيب البيطري'}</div>
              ${props.vetSignedAt ? `<div class="signature-date">${formatSignatureDate(props.vetSignedAt)}</div>` : '<div class="signature-sublabel">التاريخ: ___/___/_____</div>'}
            </div>
          ` : ''}
        </div>
      </div>
    ` : ''}

    <div class="security-strip">
      <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
      <span>هذه الوثيقة محمية | رقم التحقق: ${docNumber}</span>
    </div>

    <div class="footer">
      <div><span class="page-number">١</span></div>
      <div>© ${new Date().getFullYear()} ${settings?.clinicNameAr || 'فلف أند ووف'} - جميع الحقوق محفوظة</div>
      <div>الصفحة ١ من ٢</div>
    </div>
  </div>

  <!-- English Page -->
  <div class="page" dir="ltr">
    <div class="watermark">${settings?.clinicNameEn || 'FLUFF N\' WOOF'}</div>
    <div class="paw-decoration top-right">🐾</div>
    <div class="paw-decoration bottom-left">🐾</div>

    <div class="header">
      ${settings?.logoUrl ? `
        <div class="logo-container ${settings.logoPosition || 'center'}">
          <img src="${settings.logoUrl}" alt="Logo" class="logo" />
        </div>
      ` : ''}
      <h2 class="clinic-name">${settings?.clinicNameEn || 'Fluff N\' Woof'}</h2>
      ${settings?.addressEn ? `<p class="clinic-info">📍 ${settings.addressEn}</p>` : ''}
      ${settings?.phoneNumber ? `<p class="clinic-info">📞 ${settings.phoneNumber}</p>` : ''}
    </div>

    <div class="doc-info-bar">
      <img src="${qrCodeEn}" alt="QR Code" class="qr-code" />
      <div class="doc-info-item">
        <div class="doc-info-label">Document No.</div>
        <div class="doc-info-value">${docNumber}</div>
      </div>
      <div class="doc-info-item">
        <div class="doc-info-label">Date</div>
        <div class="doc-info-value">${formatDateDisplay('en')}</div>
      </div>
      ${props.petName ? `
        <div class="doc-info-item">
          <div class="doc-info-label">Pet Name</div>
          <div class="doc-info-value">${props.petName}</div>
        </div>
      ` : ''}
      ${props.ownerName ? `
        <div class="doc-info-item">
          <div class="doc-info-label">Owner</div>
          <div class="doc-info-value">${props.ownerName}</div>
        </div>
      ` : ''}
    </div>

    ${props.formName ? `
      <div class="form-title">
        <h1>${props.formName}</h1>
      </div>
    ` : ''}

    <div class="content">
      ${props.content}
    </div>

    ${(settings?.showClientSignature && props.showClientSignature) || (settings?.showVetSignature && props.showVetSignature) ? `
      <div class="signatures-section">
        <div class="signatures-title">Signatures</div>
        <div class="signatures-grid">
          ${settings?.showClientSignature && props.showClientSignature ? `
            <div class="signature-box">
              <div class="signature-area">
                ${props.clientSignatureUrl ? `<img src="${props.clientSignatureUrl}" alt="Client Signature" />` : '<span class="sign-here">Sign Here</span>'}
              </div>
              <div class="signature-line"></div>
              <div class="signature-label">${settings.clientSignatureLabelEn || 'Client Signature'}</div>
              ${props.clientSignedAt ? `<div class="signature-date">${formatSignatureDate(props.clientSignedAt)}</div>` : '<div class="signature-sublabel">Date: ___/___/_____</div>'}
            </div>
          ` : ''}
          ${settings?.showVetSignature && props.showVetSignature ? `
            <div class="signature-box">
              <div class="signature-area">
                ${props.vetSignatureUrl ? `<img src="${props.vetSignatureUrl}" alt="Vet Signature" />` : '<span class="sign-here">Sign Here</span>'}
              </div>
              <div class="signature-line"></div>
              <div class="signature-label">${settings.vetSignatureLabelEn || 'Veterinarian Signature'}</div>
              ${props.vetSignedAt ? `<div class="signature-date">${formatSignatureDate(props.vetSignedAt)}</div>` : '<div class="signature-sublabel">Date: ___/___/_____</div>'}
            </div>
          ` : ''}
        </div>
      </div>
    ` : ''}

    <div class="security-strip">
      <svg viewBox="0 0 24 24"><path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/></svg>
      <span>This document is protected | Verification No.: ${docNumber}</span>
    </div>

    <div class="footer">
      <div><span class="page-number">2</span></div>
      <div>© ${new Date().getFullYear()} ${settings?.clinicNameEn || 'Fluff N\' Woof'} - All Rights Reserved</div>
      <div>Page 2 of 2</div>
    </div>
  </div>

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>
`;
};

const FormPrintTemplate = forwardRef<FormPrintTemplateRef, FormPrintTemplateProps>(
  (props, ref) => {
    const { i18n } = useTranslation();
    const isRTL = i18n.language === 'ar';
    const printRef = useRef<HTMLDivElement>(null);

    const {
      content,
      contentAr,
      formName,
      formNameAr,
      showClientSignature = true,
      showVetSignature = true,
      clientSignatureUrl,
      vetSignatureUrl,
      clientSignedAt,
      vetSignedAt,
      petName,
      ownerName,
      documentNumber,
      className = '',
    } = props;

    // Fetch form settings
    const { data: settings } = useQuery({
      queryKey: ['formSettings'],
      queryFn: getFormSettings,
    });

    // Expose print methods to parent
    useImperativeHandle(ref, () => ({
      // Simple print
      print: () => {
        if (printRef.current) {
          const printWindow = window.open('', '_blank');
          if (printWindow) {
            printWindow.document.write(`
              <!DOCTYPE html>
              <html dir="${isRTL ? 'rtl' : 'ltr'}">
              <head>
                <meta charset="UTF-8">
                <title>Print Form</title>
                <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet">
                <style>
                  * { margin: 0; padding: 0; box-sizing: border-box; }
                  body {
                    font-family: 'Cairo', sans-serif;
                    font-size: ${settings?.fontSize || 14}px;
                    line-height: 1.6;
                    padding: 20px;
                    direction: ${isRTL ? 'rtl' : 'ltr'};
                  }
                  .form-container { max-width: 800px; margin: 0 auto; }
                </style>
              </head>
              <body>
                ${printRef.current.innerHTML}
              </body>
              </html>
            `);
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
              printWindow.print();
            }, 250);
          }
        }
      },

      // Professional print with all features
      printProfessional: async () => {
        const docNumber = documentNumber || generateDocNumber();

        // Generate QR codes
        const qrDataAr = JSON.stringify({
          doc: docNumber,
          clinic: settings?.clinicNameAr,
          form: formNameAr,
          date: new Date().toISOString(),
        });
        const qrDataEn = JSON.stringify({
          doc: docNumber,
          clinic: settings?.clinicNameEn,
          form: formName,
          date: new Date().toISOString(),
        });

        const [qrCodeAr, qrCodeEn] = await Promise.all([
          generateQRCodeDataUrl(qrDataAr),
          generateQRCodeDataUrl(qrDataEn),
        ]);

        const printWindow = window.open('', '_blank');
        if (printWindow) {
          const html = generateProfessionalPrintHTML(settings, props, docNumber, qrCodeAr, qrCodeEn);
          printWindow.document.write(html);
          printWindow.document.close();
        }
      },
    }));

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const getLogoAlignment = () => {
      switch (settings?.logoPosition) {
        case 'left':
          return 'items-start text-left';
        case 'right':
          return 'items-end text-right';
        default:
          return 'items-center text-center';
      }
    };

    return (
      <div ref={printRef} className={`form-container bg-white ${className}`} dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className={`flex flex-col ${getLogoAlignment()} mb-8 pb-6 border-b-2 border-gray-200`}>
          {settings?.logoUrl && (
            <img src={settings.logoUrl} alt="Clinic Logo" className="max-w-[150px] max-h-[80px] mb-3" />
          )}
          <h1 className="text-2xl font-bold text-gray-800">
            {isRTL ? settings?.clinicNameAr : settings?.clinicNameEn}
          </h1>
          {(settings?.clinicNameAr || settings?.clinicNameEn) && (
            <p className="text-lg text-gray-600">
              {isRTL ? settings?.clinicNameEn : settings?.clinicNameAr}
            </p>
          )}
          <p className="text-sm text-gray-500 mt-1">
            {isRTL ? settings?.addressAr : settings?.addressEn}
          </p>
          {settings?.phoneNumber && <p className="text-sm text-gray-500">{settings.phoneNumber}</p>}
        </div>

        {/* Document Info */}
        {(documentNumber || petName || ownerName) && (
          <div className="flex justify-between items-center mb-6 p-3 bg-gray-50 rounded-lg text-sm">
            {documentNumber && (
              <div>
                <span className="text-gray-500">{isRTL ? 'رقم الوثيقة:' : 'Doc No.:'}</span>
                <span className="font-semibold ms-2">{documentNumber}</span>
              </div>
            )}
            {petName && (
              <div>
                <span className="text-gray-500">{isRTL ? 'الحيوان:' : 'Pet:'}</span>
                <span className="font-semibold ms-2">{petName}</span>
              </div>
            )}
            {ownerName && (
              <div>
                <span className="text-gray-500">{isRTL ? 'المالك:' : 'Owner:'}</span>
                <span className="font-semibold ms-2">{ownerName}</span>
              </div>
            )}
          </div>
        )}

        {/* Form Title */}
        {(formName || formNameAr) && (
          <h2 className="text-xl font-bold text-center text-primary-700 mb-6">
            {isRTL ? formNameAr : formName}
          </h2>
        )}

        {/* Content */}
        <div
          className="min-h-[300px] mb-10"
          style={{ fontSize: `${settings?.fontSize || 14}px` }}
          dangerouslySetInnerHTML={{ __html: isRTL ? (contentAr || content) : content }}
        />

        {/* Footer - Signatures */}
        {(showClientSignature || showVetSignature) && (
          <div className="flex justify-between gap-10 pt-8 border-t-2 border-dashed border-gray-200">
            {showClientSignature && settings?.showClientSignature && (
              <div className="flex-1 text-center">
                <p className="font-semibold text-gray-700 mb-2">
                  {isRTL ? settings.clientSignatureLabelAr : settings.clientSignatureLabelEn}
                </p>
                <div className="h-[80px] border-2 border-gray-300 rounded-lg mb-2 flex items-center justify-center bg-gray-50">
                  {clientSignatureUrl ? (
                    <img src={clientSignatureUrl} alt="Client Signature" className="max-h-[70px] max-w-[180px]" />
                  ) : (
                    <span className="text-xs text-gray-400">{isRTL ? 'وقّع هنا' : 'Sign Here'}</span>
                  )}
                </div>
                <div className="border-t-2 border-gray-700 mb-1"></div>
                {clientSignedAt && (
                  <p className="text-xs text-gray-500">{formatDate(clientSignedAt)}</p>
                )}
              </div>
            )}

            {showVetSignature && settings?.showVetSignature && (
              <div className="flex-1 text-center">
                <p className="font-semibold text-gray-700 mb-2">
                  {isRTL ? settings.vetSignatureLabelAr : settings.vetSignatureLabelEn}
                </p>
                <div className="h-[80px] border-2 border-gray-300 rounded-lg mb-2 flex items-center justify-center bg-gray-50">
                  {vetSignatureUrl ? (
                    <img src={vetSignatureUrl} alt="Vet Signature" className="max-h-[70px] max-w-[180px]" />
                  ) : (
                    <span className="text-xs text-gray-400">{isRTL ? 'وقّع هنا' : 'Sign Here'}</span>
                  )}
                </div>
                <div className="border-t-2 border-gray-700 mb-1"></div>
                {vetSignedAt && <p className="text-xs text-gray-500">{formatDate(vetSignedAt)}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
);

FormPrintTemplate.displayName = 'FormPrintTemplate';

export default FormPrintTemplate;

// Export standalone print function for use outside of React components
export const printProfessionalForm = async (
  settings: FormSettings | undefined,
  formData: {
    content: string;
    contentAr?: string;
    formName?: string;
    formNameAr?: string;
    showClientSignature?: boolean;
    showVetSignature?: boolean;
    clientSignatureUrl?: string;
    vetSignatureUrl?: string;
    clientSignedAt?: string;
    vetSignedAt?: string;
    petName?: string;
    ownerName?: string;
    documentNumber?: string;
  }
) => {
  const docNumber = formData.documentNumber || generateDocNumber();

  // Generate QR codes
  const qrDataAr = JSON.stringify({
    doc: docNumber,
    clinic: settings?.clinicNameAr,
    form: formData.formNameAr,
    date: new Date().toISOString(),
  });
  const qrDataEn = JSON.stringify({
    doc: docNumber,
    clinic: settings?.clinicNameEn,
    form: formData.formName,
    date: new Date().toISOString(),
  });

  const [qrCodeAr, qrCodeEn] = await Promise.all([
    generateQRCodeDataUrl(qrDataAr),
    generateQRCodeDataUrl(qrDataEn),
  ]);

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    const html = generateProfessionalPrintHTML(settings, formData as FormPrintTemplateProps, docNumber, qrCodeAr, qrCodeEn);
    printWindow.document.write(html);
    printWindow.document.close();
  }
};
