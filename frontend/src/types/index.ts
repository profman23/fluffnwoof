export enum UserRole {
  ADMIN = 'ADMIN',
  VET = 'VET',
  RECEPTIONIST = 'RECEPTIONIST',
}

export interface Role {
  id?: string;
  name: string;
  displayNameEn?: string;
  displayNameAr?: string;
  description?: string;
  isSystem?: boolean;
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  CHECK_IN = 'CHECK_IN',
  IN_PROGRESS = 'IN_PROGRESS',
  HOSPITALIZED = 'HOSPITALIZED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum VisitType {
  GENERAL_CHECKUP = 'GENERAL_CHECKUP',
  GROOMING = 'GROOMING',
  SURGERY = 'SURGERY',
  VACCINATION = 'VACCINATION',
  EMERGENCY = 'EMERGENCY',
}

export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum Species {
  DOG = 'DOG',
  CAT = 'CAT',
  BIRD = 'BIRD',
  RABBIT = 'RABBIT',
  HAMSTER = 'HAMSTER',
  GUINEA_PIG = 'GUINEA_PIG',
  TURTLE = 'TURTLE',
  FISH = 'FISH',
  HORSE = 'HORSE',
  GOAT = 'GOAT',
  SHEEP = 'SHEEP',
  COW = 'COW',
  CAMEL = 'CAMEL',
  DONKEY = 'DONKEY',
  MONKEY = 'MONKEY',
  FERRET = 'FERRET',
  HEDGEHOG = 'HEDGEHOG',
  SNAKE = 'SNAKE',
  LIZARD = 'LIZARD',
  FROG = 'FROG',
  CHICKEN = 'CHICKEN',
  DUCK = 'DUCK',
  PIG = 'PIG',
  ALPACA = 'ALPACA',
  OTHER = 'OTHER',
}

export enum InvoiceStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  OVERDUE = 'OVERDUE',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  MADA = 'MADA',
  TABBY = 'TABBY',
  TAMARA = 'TAMARA',
  BANK_TRANSFER = 'BANK_TRANSFER',
  OTHER = 'OTHER',
}

export interface User {
  id: string;
  email: string;
  roleId?: string;
  role: Role;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  isBookable?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Owner {
  id: string;
  customerCode?: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address?: string;
  nationalId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  pets?: Pet[];
}

export interface Pet {
  id: string;
  petCode?: string;
  name: string;
  species: Species;
  breed?: string;
  gender: Gender;
  birthDate?: string;
  color?: string;
  weight?: number;
  microchipId?: string;
  photoUrl?: string;
  notes?: string;
  isActive: boolean;
  ownerId: string;
  owner?: Owner;
  createdAt: string;
  updatedAt: string;
}

export interface Appointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  status: AppointmentStatus;
  visitType?: VisitType;
  reason?: string;
  notes?: string;
  petId: string;
  pet?: Pet;
  vetId: string;
  vet?: User;
  createdAt: string;
  updatedAt: string;
}

export interface FlowBoardAppointment {
  id: string;
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  status: AppointmentStatus;
  isConfirmed: boolean;
  visitType?: VisitType;
  reason?: string; // Visit reason from booking - maps to chiefComplaint
  pet: {
    id: string;
    name: string;
    species: Species;
    owner?: {
      id: string;
      firstName: string;
      lastName: string;
      phone: string;
    };
  };
  vet: {
    id: string;
    firstName: string;
    lastName: string;
  };
  invoice?: {
    invoiceNumber: string;
    isFinalized: boolean;
  };
  medicalRecord?: {
    recordCode: string | null;
    isClosed: boolean;
  } | null;
}

export interface FlowBoardData {
  scheduled: FlowBoardAppointment[];
  checkIn: FlowBoardAppointment[];
  inProgress: FlowBoardAppointment[];
  hospitalized: FlowBoardAppointment[];
  completed: FlowBoardAppointment[];
}

export interface MedicalRecord {
  id: string;
  visitDate: string;

  // SOAP - Subjective
  chiefComplaint?: string;
  history?: string;

  // SOAP - Objective (Vital Signs)
  weight?: number;
  temperature?: number;
  heartRate?: number;
  respirationRate?: number;
  bodyConditionScore?: number;
  muscleCondition?: string;
  painScore?: number;
  hydration?: string;
  attitude?: string;
  behaviour?: string;
  mucousMembranes?: string;
  crt?: number;

  // SOAP - Assessment & Plan
  diagnosis?: string;
  symptoms?: string;
  treatment?: string;
  notes?: string;

  // Relations
  petId: string;
  pet?: Pet;
  vetId: string;
  vet?: User;
  appointmentId?: string;
  appointment?: Appointment;
  prescriptions?: Prescription[];

  // Metadata
  createdById?: string;
  createdBy?: User;
  updatedById?: string;
  updatedBy?: User;
  createdAt: string;
  updatedAt: string;

  // Close/Reopen status
  isClosed?: boolean;
  closedAt?: string;
  closedById?: string;
  closedBy?: User;
}

export interface MedicalRecordInput {
  // SOAP - Subjective
  chiefComplaint?: string;
  history?: string;

  // SOAP - Objective (Vital Signs)
  weight?: number;
  temperature?: number;
  heartRate?: number;
  respirationRate?: number;
  bodyConditionScore?: number;
  muscleCondition?: string;
  painScore?: number;
  hydration?: string;
  attitude?: string;
  behaviour?: string;
  mucousMembranes?: string;
  crt?: number;

  // SOAP - Assessment & Plan
  diagnosis?: string;
  symptoms?: string;
  treatment?: string;
  notes?: string;
}

export interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
  medicalRecordId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Vaccination {
  id: string;
  vaccineName: string;
  vaccineDate: string;
  nextDueDate?: string;
  batchNumber?: string;
  notes?: string;
  petId: string;
  pet?: Pet;
  vetId: string;
  vet?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  status: InvoiceStatus;
  notes?: string;
  ownerId: string;
  owner?: Owner;
  appointmentId?: string;
  items?: InvoiceItem[];
  payments?: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  invoiceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  paymentDate: string;
  amount: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  invoiceId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ';
  resource: string;
  resourceId?: string;
  details?: unknown;
  ipAddress?: string;
  createdAt: string;
}

// User Preferences & Theme Customization
export interface FlowBoardColorConfig {
  scheduled?: string;
  checkIn?: string;
  inProgress?: string;
  hospitalized?: string;
  completed?: string;
}

export interface UserPreferences {
  id: string | null;
  userId: string;
  headerBgColor?: string;
  sidebarBgColor?: string;
  sidebarHoverColor?: string;
  flowBoardColors?: FlowBoardColorConfig;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface UpdatePreferencesInput {
  headerBgColor?: string;
  sidebarBgColor?: string;
  sidebarHoverColor?: string;
  flowBoardColors?: FlowBoardColorConfig;
}

export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
}

// Medical Attachment for lab reports, x-rays, etc.
export interface MedicalAttachment {
  id: string;
  medicalRecordId: string;
  fileName: string;
  fileUrl: string;
  publicId?: string;
  fileType: 'image' | 'pdf' | 'document';
  fileSize: number;
  description?: string;
  uploadedBy: string;
  uploader?: {
    id: string;
    firstName: string;
    lastName: string;
  };
  createdAt: string;
}
