import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import arCommon from '../locales/ar/common.json';
import arAuth from '../locales/ar/auth.json';
import arDashboard from '../locales/ar/dashboard.json';
import arSidebar from '../locales/ar/sidebar.json';
import arHeader from '../locales/ar/header.json';
import arUsers from '../locales/ar/users.json';
import arRoles from '../locales/ar/roles.json';
import arPatients from '../locales/ar/patients.json';
import arFlowBoard from '../locales/ar/flowBoard.json';
import arPatientRecord from '../locales/ar/patientRecord.json';
import arMedicalRecords from '../locales/ar/medicalRecords.json';
import arReports from '../locales/ar/reports.json';

import enCommon from '../locales/en/common.json';
import enAuth from '../locales/en/auth.json';
import enDashboard from '../locales/en/dashboard.json';
import enSidebar from '../locales/en/sidebar.json';
import enHeader from '../locales/en/header.json';
import enUsers from '../locales/en/users.json';
import enRoles from '../locales/en/roles.json';
import enPatients from '../locales/en/patients.json';
import enFlowBoard from '../locales/en/flowBoard.json';
import enPatientRecord from '../locales/en/patientRecord.json';
import enMedicalRecords from '../locales/en/medicalRecords.json';
import enReports from '../locales/en/reports.json';

const resources = {
  ar: {
    common: arCommon,
    auth: arAuth,
    dashboard: arDashboard,
    sidebar: arSidebar,
    header: arHeader,
    users: arUsers,
    roles: arRoles,
    patients: arPatients,
    flowBoard: arFlowBoard,
    patientRecord: arPatientRecord,
    medicalRecords: arMedicalRecords,
    reports: arReports,
  },
  en: {
    common: enCommon,
    auth: enAuth,
    dashboard: enDashboard,
    sidebar: enSidebar,
    header: enHeader,
    users: enUsers,
    roles: enRoles,
    patients: enPatients,
    flowBoard: enFlowBoard,
    patientRecord: enPatientRecord,
    medicalRecords: enMedicalRecords,
    reports: enReports,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ar',
    defaultNS: 'common',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'language',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
