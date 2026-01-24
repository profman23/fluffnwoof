import api from './client';
import { User, Pet, MedicalAttachment } from '../types';

export const uploadApi = {
  // Upload user avatar
  uploadUserAvatar: async (file: File): Promise<User> => {
    const formData = new FormData();
    formData.append('avatar', file);

    const response = await api.post('/upload/user-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Remove user avatar
  removeUserAvatar: async (): Promise<User> => {
    const response = await api.delete('/upload/user-avatar');
    return response.data;
  },

  // Upload pet photo
  uploadPetPhoto: async (petId: string, file: File): Promise<Pet> => {
    const formData = new FormData();
    formData.append('photo', file);

    const response = await api.post(`/upload/pet/${petId}/photo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Remove pet photo
  removePetPhoto: async (petId: string): Promise<Pet> => {
    const response = await api.delete(`/upload/pet/${petId}/photo`);
    return response.data;
  },

  // Upload medical attachment
  uploadMedicalAttachment: async (
    recordId: string,
    file: File,
    description?: string
  ): Promise<MedicalAttachment> => {
    const formData = new FormData();
    formData.append('file', file);
    if (description) {
      formData.append('description', description);
    }

    const response = await api.post(`/upload/medical/${recordId}/attachment`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // Get medical attachments for a record
  getMedicalAttachments: async (recordId: string): Promise<MedicalAttachment[]> => {
    const response = await api.get(`/upload/medical/${recordId}/attachments`);
    return response.data;
  },

  // Delete medical attachment
  deleteMedicalAttachment: async (attachmentId: string): Promise<void> => {
    await api.delete(`/upload/medical/attachment/${attachmentId}`);
  },
};
