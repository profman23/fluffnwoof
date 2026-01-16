export type Permission =
  // Owner Management
  | 'owners.create'
  | 'owners.read'
  | 'owners.update'
  | 'owners.delete'
  // Pet Management
  | 'pets.create'
  | 'pets.read'
  | 'pets.update'
  | 'pets.delete'
  // Appointment Management
  | 'appointments.create'
  | 'appointments.read'
  | 'appointments.update'
  | 'appointments.delete'
  | 'appointments.assign'
  // Medical Records Management
  | 'medical.create'
  | 'medical.read'
  | 'medical.update'
  | 'medical.delete'
  // Prescription Management
  | 'prescriptions.create'
  | 'prescriptions.read'
  | 'prescriptions.update'
  | 'prescriptions.delete'
  // Vaccination Management
  | 'vaccinations.create'
  | 'vaccinations.read'
  | 'vaccinations.update'
  | 'vaccinations.delete'
  // Invoice Management
  | 'invoices.create'
  | 'invoices.read'
  | 'invoices.update'
  | 'invoices.delete'
  | 'invoices.markPaid'
  // User Management
  | 'users.create'
  | 'users.read'
  | 'users.update'
  | 'users.deactivate'
  | 'users.managePermissions'
  // System & Audit
  | 'audit.read'
  | 'dashboard.view'
  | 'reports.generate';

export interface UserPermissions {
  permissions: Permission[];
}

export interface PermissionInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  action: string;
  createdAt: string;
}

export interface RolePermissions {
  role: 'ADMIN' | 'VET' | 'RECEPTIONIST';
  permissions: Permission[];
}
