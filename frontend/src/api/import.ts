import api from './client';

export type ImportRowStatus = 'imported' | 'pet_added' | 'skipped' | 'error';

export interface ImportOwnerInput {
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
}

export interface ImportPetInput {
  name: string;
  species: string;
  gender: string;
  breed?: string;
  birthDate?: string;
  color?: string;
  weight?: number;
}

export interface ImportRow {
  owner: ImportOwnerInput;
  pet: ImportPetInput;
}

export interface ImportRowResult {
  row: number;
  status: ImportRowStatus;
  ownerName?: string;
  customerCode?: string;
  petName?: string;
  petCode?: string;
  error?: string;
}

export interface ImportSummary {
  total: number;
  imported: number;
  petAdded: number;
  skipped: number;
  errors: number;
  results: ImportRowResult[];
  skippedValidation: number;
  validationErrors: string[];
}

export const importApi = {
  clientsPets: async (rows: ImportRow[]): Promise<ImportSummary> => {
    const response = await api.post('/import/clients-pets', { rows });
    return response.data.data;
  },
};
