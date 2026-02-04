import axios from 'axios';
import { Capacitor } from '@capacitor/core';

// Automatically detect the correct API URL based on platform
const getApiUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;

  // If running on Android emulator, use special IP
  if (Capacitor.getPlatform() === 'android') {
    return 'http://10.0.2.2:5000/api';
  }

  return envUrl || 'http://localhost:5000/api';
};

const API_URL = getApiUrl();

// Separate axios instance for customer portal
export const portalClient = axios.create({
  baseURL: `${API_URL}/portal`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add customer auth token and language
portalClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('customerToken');
    const language = localStorage.getItem('language') || 'ar';

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['Accept-Language'] = language;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors and bilingual messages
portalClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle rate limiting (429) - don't logout, just show error
    if (error.response?.status === 429) {
      const language = localStorage.getItem('language') || 'ar';
      if (error.response?.data) {
        const { messageEn } = error.response.data;
        if (language === 'en' && messageEn) {
          error.response.data.message = messageEn;
        }
      }
      return Promise.reject(error);
    }

    // Handle unauthorized (401) - logout and redirect
    if (error.response?.status === 401) {
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customer');
      // Redirect to portal login, not staff login
      if (window.location.pathname.startsWith('/portal')) {
        window.location.href = '/portal/login';
      }
    }

    // Handle bilingual error messages
    const language = localStorage.getItem('language') || 'ar';
    if (error.response?.data) {
      const { messageEn } = error.response.data;
      // Use English message if language is English and messageEn exists
      if (language === 'en' && messageEn) {
        error.response.data.message = messageEn;
      }
    }

    return Promise.reject(error);
  }
);

// =====================================
// Auth API
// =====================================

export interface RegisterInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  nationalId?: string;
  preferredLang?: string;
}

export interface VerifyOtpInput {
  email: string;
  code: string;
  type: 'registration' | 'password_reset';
}

export interface CompleteRegistrationInput {
  ownerId: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface CustomerProfile {
  id: string;
  customerCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address?: string;
  preferredLang: string;
  pets: PortalPet[];
}

export interface PortalPet {
  id: string;
  petCode: string;
  name: string;
  species: string;
  breed?: string;
  gender: string;
  birthDate?: string;
  photoUrl?: string;
  color?: string;
  weight?: number;
}

export interface PortalMedicalRecord {
  id: string;
  visitDate: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  vet: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export interface PortalPetAppointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  status: string;
  visitType: string;
  vet: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
}

export interface PortalPetDetail extends PortalPet {
  medicalRecords: PortalMedicalRecord[];
  appointments: PortalPetAppointment[];
}

export interface AddPetInput {
  name: string;
  species: string;
  breed?: string;
  gender: string;
  birthDate?: string;
  color?: string;
  weight?: number;
  notes?: string;
}

export interface PortalVisitType {
  code: string;
  nameEn: string;
  nameAr: string;
  duration: number;
  color: string;
}

export interface VetSchedule {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  isWorkingDay: boolean;
}

export interface PortalVet {
  id: string;
  firstName: string;
  lastName: string;
  avatar?: string;
  schedule: VetSchedule[];
}

export interface AvailabilityResponse {
  date: string;
  vetId: string;
  slots: string[];
  unavailableReason?: 'dayOff' | 'weekendOff' | 'noSchedule' | 'fullyBooked';
}

export interface BookAppointmentInput {
  petId: string;
  vetId: string;
  visitType: string;
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
}

export interface PortalAppointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  status: string;
  visitType: string;
  reason?: string;
  source?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  pet: {
    id: string;
    name: string;
    species: string;
    petCode: string;
  };
  vet: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface PortalAppointmentDetail extends PortalAppointment {
  pet: {
    id: string;
    name: string;
    species: string;
    petCode: string;
    photoUrl?: string;
  };
  vet: {
    id: string;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  medicalRecord?: {
    id: string;
    diagnosis?: string;
    treatment?: string;
    notes?: string;
    visitDate: string;
  };
}

export interface PortalFormTemplate {
  id: string;
  nameEn: string;
  nameAr: string;
  category: string;
  requiresClientSignature: boolean;
  requiresVetSignature: boolean;
}

export interface PortalFormSignature {
  id: string;
  signerType: 'CLIENT' | 'VET';
  signerName: string;
  signedAt: string;
}

export interface PortalForm {
  id: string;
  template: PortalFormTemplate;
  pet: {
    id: string;
    name: string;
    species: string;
    petCode: string;
  };
  status: 'PENDING' | 'AWAITING_VET' | 'COMPLETED';
  clientSignedAt?: string;
  vetSignedAt?: string;
  expiresAt?: string;
  createdAt: string;
  signatures: PortalFormSignature[];
}

export interface PortalFormDetail extends PortalForm {
  contentEn: string;
  contentAr: string;
  appointment?: {
    id: string;
    appointmentDate: string;
    appointmentTime: string;
    reason?: string;
  };
  vet?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CheckEmailResponse {
  status: 'NOT_FOUND' | 'REGISTERED' | 'CLAIMABLE';
  ownerId?: string;
}

// Auth endpoints
export const customerPortalApi = {
  // Email check (for smart registration flow)
  checkEmail: async (email: string): Promise<CheckEmailResponse> => {
    const response = await portalClient.post('/check-email', { email });
    return response.data.data;
  },

  claimAccount: async (email: string) => {
    const response = await portalClient.post('/claim-account', { email });
    return response.data;
  },

  // Registration
  register: async (data: RegisterInput) => {
    const response = await portalClient.post('/register', data);
    return response.data;
  },

  verifyOtp: async (data: VerifyOtpInput) => {
    const response = await portalClient.post('/verify-otp', data);
    return response.data;
  },

  resendOtp: async (email: string, type: 'registration' | 'password_reset') => {
    const response = await portalClient.post('/resend-otp', { email, type });
    return response.data;
  },

  completeRegistration: async (data: CompleteRegistrationInput) => {
    const response = await portalClient.post('/complete-registration', data);
    return response.data;
  },

  // Login
  login: async (data: LoginInput) => {
    const response = await portalClient.post('/login', data);
    return response.data;
  },

  // Password reset
  forgotPassword: async (email: string) => {
    const response = await portalClient.post('/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (email: string, newPassword: string) => {
    const response = await portalClient.post('/reset-password', { email, newPassword });
    return response.data;
  },

  // Profile
  getProfile: async (): Promise<CustomerProfile> => {
    const response = await portalClient.get('/me');
    return response.data.data;
  },

  updateProfile: async (data: Partial<CustomerProfile>) => {
    const response = await portalClient.put('/me', data);
    return response.data.data;
  },

  // Pets
  getPets: async (): Promise<PortalPet[]> => {
    const response = await portalClient.get('/pets');
    return response.data.data;
  },

  getPetById: async (id: string): Promise<PortalPetDetail> => {
    const response = await portalClient.get(`/pets/${id}`);
    return response.data.data;
  },

  addPet: async (data: AddPetInput): Promise<PortalPet> => {
    const response = await portalClient.post('/pets', data);
    return response.data.data;
  },

  updatePet: async (id: string, data: Partial<AddPetInput>): Promise<PortalPet> => {
    const response = await portalClient.put(`/pets/${id}`, data);
    return response.data.data;
  },

  // Pet photo upload
  uploadPetPhoto: async (petId: string, file: File): Promise<PortalPet> => {
    const formData = new FormData();
    formData.append('photo', file);
    const response = await portalClient.post(`/pets/${petId}/photo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data.data;
  },

  removePetPhoto: async (petId: string): Promise<PortalPet> => {
    const response = await portalClient.delete(`/pets/${petId}/photo`);
    return response.data.data;
  },

  // Booking data (public)
  getVisitTypes: async (): Promise<PortalVisitType[]> => {
    const response = await portalClient.get('/visit-types');
    return response.data.data;
  },

  getVets: async (): Promise<PortalVet[]> => {
    const response = await portalClient.get('/vets');
    return response.data.data;
  },

  getAvailability: async (vetId: string, date: string, duration: number): Promise<AvailabilityResponse> => {
    const response = await portalClient.get(`/availability/${vetId}/${date}?duration=${duration}`);
    return response.data.data;
  },

  // Appointments
  getAppointments: async (filter?: 'upcoming' | 'past' | 'all'): Promise<PortalAppointment[]> => {
    const response = await portalClient.get('/appointments', { params: { filter } });
    return response.data.data;
  },

  getAppointmentById: async (id: string): Promise<PortalAppointmentDetail> => {
    const response = await portalClient.get(`/appointments/${id}`);
    return response.data.data;
  },

  bookAppointment: async (data: BookAppointmentInput) => {
    const response = await portalClient.post('/appointments', data);
    return response.data;
  },

  cancelAppointment: async (id: string) => {
    const response = await portalClient.delete(`/appointments/${id}`);
    return response.data;
  },

  // Forms
  getForms: async (status?: 'pending' | 'signed'): Promise<PortalForm[]> => {
    const response = await portalClient.get('/forms', { params: { status } });
    return response.data.data;
  },

  getFormById: async (id: string): Promise<PortalFormDetail> => {
    const response = await portalClient.get(`/forms/${id}`);
    return response.data.data;
  },

  signForm: async (id: string, signatureData: string) => {
    const response = await portalClient.post(`/forms/${id}/sign`, { signatureData });
    return response.data;
  },
};

export default customerPortalApi;
