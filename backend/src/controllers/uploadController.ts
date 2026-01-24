import { Response } from 'express';
import { AuthRequest } from '../types';
import * as uploadService from '../services/uploadService';

// Upload user avatar
export const uploadUserAvatar = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const updatedUser = await uploadService.uploadUserAvatar(userId, req.file);
    res.json(updatedUser);
  } catch (error: any) {
    console.error('Error uploading user avatar:', error);
    res.status(500).json({ message: error.message || 'Failed to upload avatar' });
  }
};

// Remove user avatar
export const removeUserAvatar = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const updatedUser = await uploadService.removeUserAvatar(userId);
    res.json(updatedUser);
  } catch (error: any) {
    console.error('Error removing user avatar:', error);
    res.status(500).json({ message: error.message || 'Failed to remove avatar' });
  }
};

// Upload pet photo
export const uploadPetPhoto = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { petId } = req.params;
    if (!petId) {
      return res.status(400).json({ message: 'Pet ID is required' });
    }

    const updatedPet = await uploadService.uploadPetPhoto(petId, req.file);
    res.json(updatedPet);
  } catch (error: any) {
    console.error('Error uploading pet photo:', error);
    res.status(500).json({ message: error.message || 'Failed to upload pet photo' });
  }
};

// Remove pet photo
export const removePetPhoto = async (req: AuthRequest, res: Response) => {
  try {
    const { petId } = req.params;
    if (!petId) {
      return res.status(400).json({ message: 'Pet ID is required' });
    }

    const updatedPet = await uploadService.removePetPhoto(petId);
    res.json(updatedPet);
  } catch (error: any) {
    console.error('Error removing pet photo:', error);
    res.status(500).json({ message: error.message || 'Failed to remove pet photo' });
  }
};

// Upload medical attachment
export const uploadMedicalAttachment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { recordId } = req.params;
    if (!recordId) {
      return res.status(400).json({ message: 'Medical record ID is required' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { description } = req.body;
    const attachment = await uploadService.uploadMedicalAttachment(
      recordId,
      req.file,
      userId,
      description
    );

    res.status(201).json(attachment);
  } catch (error: any) {
    console.error('Error uploading medical attachment:', error);
    res.status(500).json({ message: error.message || 'Failed to upload attachment' });
  }
};

// Get medical attachments for a record
export const getMedicalAttachments = async (req: AuthRequest, res: Response) => {
  try {
    const { recordId } = req.params;
    if (!recordId) {
      return res.status(400).json({ message: 'Medical record ID is required' });
    }

    const attachments = await uploadService.getMedicalAttachments(recordId);
    res.json(attachments);
  } catch (error: any) {
    console.error('Error fetching medical attachments:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch attachments' });
  }
};

// Delete medical attachment
export const deleteMedicalAttachment = async (req: AuthRequest, res: Response) => {
  try {
    const { attachmentId } = req.params;
    if (!attachmentId) {
      return res.status(400).json({ message: 'Attachment ID is required' });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    await uploadService.deleteMedicalAttachment(attachmentId, userId);
    res.json({ message: 'Attachment deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting medical attachment:', error);
    res.status(500).json({ message: error.message || 'Failed to delete attachment' });
  }
};
