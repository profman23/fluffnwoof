/**
 * Public Form Sign Page
 * Allows clients to sign forms from email links without login
 */

import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import SignaturePad from 'signature_pad';
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface PublicFormData {
  id: string;
  status: string;
  contentEn: string;
  contentAr: string;
  createdAt: string;
  expiresAt: string | null;
  template: {
    nameEn: string;
    nameAr: string;
    category: string;
    requiresClientSignature: boolean;
    requiresVetSignature: boolean;
  };
  pet: {
    name: string;
  };
  owner: {
    firstName: string;
    lastName: string;
  };
  clientSigned: boolean;
  clientSignedAt: string | null;
  vetSigned: boolean;
  vetSignedAt: string | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  BOARDING: '🏠',
  SURGERY: '🏥',
  VACCINATION: '💉',
  GROOMING: '✂️',
  CONSENT: '✅',
  DISCHARGE: '📋',
  OTHER: '📄',
};

export const PublicFormSign: React.FC = () => {
  const { formId } = useParams<{ formId: string }>();
  const [form, setForm] = useState<PublicFormData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signing, setSigning] = useState(false);
  const [signSuccess, setSignSuccess] = useState(false);
  const [showLanguage, setShowLanguage] = useState<'ar' | 'en'>('ar');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePad | null>(null);

  // Fetch form data
  useEffect(() => {
    const fetchForm = async () => {
      if (!formId) return;

      try {
        const response = await axios.get(`${API_BASE_URL}/public/forms/${formId}`);
        setForm(response.data.data);
      } catch (err: any) {
        setError(err.response?.data?.errorAr || err.response?.data?.error || 'Failed to load form');
      } finally {
        setLoading(false);
      }
    };

    fetchForm();
  }, [formId]);

  // Initialize signature pad
  useEffect(() => {
    if (canvasRef.current && form && !form.clientSigned) {
      const canvas = canvasRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);

      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext('2d')?.scale(ratio, ratio);

      signaturePadRef.current = new SignaturePad(canvas, {
        backgroundColor: '#f9fafb',
        penColor: '#000',
      });
    }

    return () => {
      if (signaturePadRef.current) {
        signaturePadRef.current.off();
      }
    };
  }, [form]);

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const handleSign = async () => {
    if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
      alert('يرجى التوقيع أولاً / Please sign first');
      return;
    }

    if (!formId) return;

    setSigning(true);
    try {
      const signatureData = signaturePadRef.current.toDataURL();
      await axios.post(`${API_BASE_URL}/public/forms/${formId}/sign`, { signatureData });
      setSignSuccess(true);

      // Refresh form data
      const response = await axios.get(`${API_BASE_URL}/public/forms/${formId}`);
      setForm(response.data.data);
    } catch (err: any) {
      alert(err.response?.data?.errorAr || err.response?.data?.error || 'Failed to sign form');
    } finally {
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-mint-50 via-pink-50 to-gold-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-mint-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحميل... / Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-pink-50 to-orange-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">❌</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">حدث خطأ / Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  if (!form) return null;

  const categoryIcon = CATEGORY_ICONS[form.template.category] || '📄';

  return (
    <div className="min-h-screen bg-gradient-to-br from-mint-50 via-pink-50 to-gold-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center text-2xl shadow-lg">
              {categoryIcon}
            </div>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-gray-800">Fluff N' Woof</h1>
              <p className="text-sm text-gray-500">فلف أند ووف</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Success Message */}
        {signSuccess && (
          <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">✅</span>
            </div>
            <h3 className="text-xl font-bold text-green-800 mb-2">
              تم التوقيع بنجاح!
            </h3>
            <p className="text-green-600">
              Signed Successfully!
            </p>
            <p className="text-sm text-green-500 mt-2">
              شكراً لك على توقيع النموذج - Thank you for signing
            </p>
          </div>
        )}

        {/* Form Info Card */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-r from-mint-400 via-pink-400 to-gold-400 h-2"></div>
          <div className="p-6">
            <div className="text-center mb-6">
              <p className="text-4xl mb-3">{categoryIcon}</p>
              <h2 className="text-xl font-bold text-gray-800">{form.template.nameAr}</h2>
              <p className="text-gray-600">{form.template.nameEn}</p>
              <p className="text-sm text-mint-600 mt-2">🐾 {form.pet.name}</p>
              <p className="text-sm text-gray-500">
                {form.owner.firstName} {form.owner.lastName}
              </p>
            </div>
          </div>
        </div>

        {/* Language Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowLanguage('ar')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
              showLanguage === 'ar'
                ? 'bg-mint-500 text-white shadow-md'
                : 'bg-white text-gray-600 shadow-sm'
            }`}
          >
            🇸🇦 العربية
          </button>
          <button
            onClick={() => setShowLanguage('en')}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${
              showLanguage === 'en'
                ? 'bg-mint-500 text-white shadow-md'
                : 'bg-white text-gray-600 shadow-sm'
            }`}
          >
            🇬🇧 English
          </button>
        </div>

        {/* Form Content */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div
            className={`prose prose-sm max-w-none ${showLanguage === 'ar' ? 'text-right' : 'text-left'}`}
            dir={showLanguage === 'ar' ? 'rtl' : 'ltr'}
            dangerouslySetInnerHTML={{
              __html: showLanguage === 'ar' ? form.contentAr : form.contentEn,
            }}
          />
        </div>

        {/* Signature Section */}
        {form.template.requiresClientSignature && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="font-bold text-gray-800 mb-4 text-center flex items-center justify-center gap-2">
              <span className="text-2xl">✍️</span>
              <span>توقيعك / Your Signature</span>
            </h3>

            {form.clientSigned ? (
              <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-4xl">✅</span>
                </div>
                <p className="text-green-600 font-medium text-lg">
                  تم التوقيع / Already Signed
                </p>
                {form.clientSignedAt && (
                  <p className="text-sm text-gray-500 mt-2">
                    {new Date(form.clientSignedAt).toLocaleString('ar-SA')}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-2 mb-4 bg-gray-50">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-48 rounded-lg touch-none"
                    style={{ backgroundColor: '#f9fafb' }}
                  />
                </div>

                <p className="text-center text-sm text-gray-500 mb-4">
                  وقّع في المربع أعلاه / Sign in the box above
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={clearSignature}
                    className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                  >
                    🗑️ مسح / Clear
                  </button>
                  <button
                    onClick={handleSign}
                    disabled={signing}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-mint-500 to-mint-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {signing ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        جاري التوقيع...
                      </>
                    ) : (
                      <>✅ توقيع / Sign</>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 py-4">
          <p>© {new Date().getFullYear()} Fluff N' Woof - فلف أند ووف</p>
          <p className="mt-1">جميع الحقوق محفوظة / All Rights Reserved</p>
        </div>
      </div>
    </div>
  );
};

export default PublicFormSign;
