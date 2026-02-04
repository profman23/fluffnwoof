/**
 * Form Sign Page
 * Customer can view and sign forms
 */

import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SignaturePad from 'signature_pad';
import { customerPortalApi, PortalFormDetail } from '../../api/customerPortal';
import { Card } from '../../components/portal/ui/Card';
import { Button } from '../../components/portal/ui/Button';
import { PortalLogoLoader } from '../../components/portal/ui/PortalLogoLoader';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { fadeInUpSimple } from '../../styles/portal/animations';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

// Icons
const DocumentIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  BOARDING: 'from-blue-500 to-blue-600',
  SURGERY: 'from-red-500 to-red-600',
  VACCINATION: 'from-green-500 to-green-600',
  GROOMING: 'from-purple-500 to-purple-600',
  CONSENT: 'from-yellow-500 to-yellow-600',
  DISCHARGE: 'from-orange-500 to-orange-600',
  OTHER: 'from-gray-500 to-gray-600',
};

const CATEGORY_ICONS: Record<string, string> = {
  BOARDING: '🏠',
  SURGERY: '🏥',
  VACCINATION: '💉',
  GROOMING: '✂️',
  CONSENT: '✅',
  DISCHARGE: '📋',
  OTHER: '📄',
};

export const FormSignPage: React.FC = () => {
  const { i18n } = useTranslation('portal');
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isDark } = usePortalTheme();
  const isRtl = i18n.language === 'ar';
  const locale = isRtl ? ar : enUS;

  const [form, setForm] = useState<PortalFormDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [signSuccess, setSignSuccess] = useState(false);
  const [showLanguage, setShowLanguage] = useState<'ar' | 'en'>(isRtl ? 'ar' : 'en');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  // Fetch form details
  useEffect(() => {
    const fetchForm = async () => {
      if (!id) return;

      try {
        const data = await customerPortalApi.getFormById(id);
        setForm(data);
      } catch (err: any) {
        setError(err.response?.data?.error || err.response?.data?.errorEn || 'Failed to load form');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [id]);

  // Initialize signature pad
  useEffect(() => {
    if (canvasRef.current && form && !form.clientSignedAt) {
      const canvas = canvasRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);

      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d')?.scale(ratio, ratio);

      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: isDark ? '#374151' : '#f9fafb',
        penColor: isDark ? '#fff' : '#000',
      });
    }

    return () => {
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
      }
    };
  }, [form, isDark]);

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const handleSign = async () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      alert(isRtl ? 'يرجى التوقيع أولاً' : 'Please sign first');
      return;
    }

    if (!id) return;

    setSigning(true);
    try {
      const signatureData = signaturePadRef.current.toDataURL();
      await customerPortalApi.signForm(id, signatureData);
      setSignSuccess(true);

      // Refresh form data
      const updatedForm = await customerPortalApi.getFormById(id);
      setForm(updatedForm);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to sign form');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return <PortalLogoLoader fullScreen={false} size="lg" />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="w-20 h-20 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
          <DocumentIcon className="w-10 h-10 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {isRtl ? 'حدث خطأ' : 'Error'}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-4">{error}</p>
        <Button onClick={() => navigate('/portal/forms')} variant="secondary">
          {isRtl ? 'العودة' : 'Go Back'}
        </Button>
      </div>
    );
  }

  if (!form) return null;

  const categoryColor = CATEGORY_COLORS[form.template.category] || CATEGORY_COLORS.OTHER;
  const categoryIcon = CATEGORY_ICONS[form.template.category] || '📄';

  return (
    <motion.div
      initial={fadeInUpSimple.initial}
      animate={fadeInUpSimple.animate}
      transition={fadeInUpSimple.transition}
      className="space-y-6 pb-6"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/portal/forms')}
          className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow-sm hover:shadow-md transition-shadow"
        >
          <ArrowLeftIcon className={`w-5 h-5 ${isRtl ? 'rotate-180' : ''}`} />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">
            {isRtl ? form.template.nameAr : form.template.nameEn}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            🐾 {form.pet.name}
          </p>
        </div>
        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryColor} flex items-center justify-center text-2xl text-white shadow-lg`}>
          {categoryIcon}
        </div>
      </div>

      {/* Success message */}
      {signSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-2xl p-4 flex items-center gap-3"
        >
          <CheckCircleIcon className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-300">
              {isRtl ? 'تم التوقيع بنجاح!' : 'Signed Successfully!'}
            </p>
            <p className="text-sm text-green-600 dark:text-green-400">
              {isRtl ? 'شكراً لك على توقيع النموذج' : 'Thank you for signing the form'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Language Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowLanguage('ar')}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
            showLanguage === 'ar'
              ? 'bg-mint-500 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          🇸🇦 العربية
        </button>
        <button
          onClick={() => setShowLanguage('en')}
          className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${
            showLanguage === 'en'
              ? 'bg-mint-500 text-white shadow-md'
              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
          }`}
        >
          🇬🇧 English
        </button>
      </div>

      {/* Form Content */}
      <Card>
        <div
          className={`prose prose-sm dark:prose-invert max-w-none ${showLanguage === 'ar' ? 'text-right' : 'text-left'}`}
          dir={showLanguage === 'ar' ? 'rtl' : 'ltr'}
          dangerouslySetInnerHTML={{
            __html: showLanguage === 'ar' ? form.contentAr : form.contentEn,
          }}
        />
      </Card>

      {/* Signature Section */}
      {form.template.requiresClientSignature && (
        <Card>
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            ✍️ {isRtl ? 'توقيعك' : 'Your Signature'}
          </h3>

          {form.clientSignedAt ? (
            <div className="text-center py-6">
              <CheckCircleIcon className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <p className="text-green-600 dark:text-green-400 font-medium">
                {isRtl ? 'تم التوقيع' : 'Already Signed'}
              </p>
              {form.clientSignedAt && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  {format(new Date(form.clientSignedAt), 'PPpp', { locale })}
                </p>
              )}
            </div>
          ) : (
            <>
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-2 mb-4">
                <canvas
                  ref={canvasRef}
                  className="w-full h-40 rounded-lg touch-none"
                  style={{ backgroundColor: isDark ? '#374151' : '#f9fafb' }}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={clearSignature}
                  className="flex items-center gap-2"
                >
                  <TrashIcon className="w-4 h-4" />
                  {isRtl ? 'مسح' : 'Clear'}
                </Button>
                <Button
                  onClick={handleSign}
                  disabled={signing}
                  className="flex-1"
                >
                  {signing
                    ? (isRtl ? 'جاري التوقيع...' : 'Signing...')
                    : (isRtl ? 'توقيع النموذج' : 'Sign Form')}
                </Button>
              </div>
            </>
          )}
        </Card>
      )}

      {/* Form Info */}
      <Card className="bg-gray-50 dark:bg-gray-800/50">
        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
          {isRtl ? 'معلومات النموذج' : 'Form Information'}
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">{isRtl ? 'تاريخ الإنشاء' : 'Created'}</span>
            <span className="text-gray-900 dark:text-white">
              {format(new Date(form.createdAt), 'PPp', { locale })}
            </span>
          </div>
          {form.appointment && (
            <div className="flex justify-between">
              <span className="text-gray-500">{isRtl ? 'الموعد' : 'Appointment'}</span>
              <span className="text-gray-900 dark:text-white">
                {format(new Date(form.appointment.appointmentDate), 'PP', { locale })} - {form.appointment.appointmentTime}
              </span>
            </div>
          )}
          {form.vet && (
            <div className="flex justify-between">
              <span className="text-gray-500">{isRtl ? 'الطبيب' : 'Doctor'}</span>
              <span className="text-gray-900 dark:text-white">
                Dr. {form.vet.firstName} {form.vet.lastName}
              </span>
            </div>
          )}
          {form.expiresAt && (
            <div className="flex justify-between">
              <span className="text-gray-500">{isRtl ? 'ينتهي في' : 'Expires'}</span>
              <span className="text-gray-900 dark:text-white">
                {format(new Date(form.expiresAt), 'PPp', { locale })}
              </span>
            </div>
          )}
        </div>
      </Card>
    </motion.div>
  );
};

export default FormSignPage;
