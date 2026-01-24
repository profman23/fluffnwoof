import { PrismaClient } from '@prisma/client';
import cloudinary from '../config/cloudinary';

const prisma = new PrismaClient();

interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  bytes: number;
  format: string;
  resource_type: string;
}

// Upload user avatar
export const uploadUserAvatar = async (userId: string, file: Express.Multer.File) => {
  // File is already uploaded to Cloudinary via multer-storage-cloudinary
  const result = file as unknown as { path: string; filename: string };

  // Update user with new avatar URL
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: result.path },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      phone: true,
      isActive: true,
      role: {
        select: {
          id: true,
          name: true,
          displayNameEn: true,
          displayNameAr: true,
        },
      },
    },
  });

  return updatedUser;
};

// Remove user avatar
export const removeUserAvatar = async (userId: string) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarUrl: true },
  });

  if (user?.avatarUrl) {
    // Extract public_id from URL and delete from Cloudinary
    const publicId = extractPublicIdFromUrl(user.avatarUrl);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Failed to delete avatar from Cloudinary:', error);
      }
    }
  }

  // Update user to remove avatar URL
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl: null },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      phone: true,
      isActive: true,
      role: {
        select: {
          id: true,
          name: true,
          displayNameEn: true,
          displayNameAr: true,
        },
      },
    },
  });

  return updatedUser;
};

// Upload pet photo
export const uploadPetPhoto = async (petId: string, file: Express.Multer.File) => {
  // File is already uploaded to Cloudinary via multer-storage-cloudinary
  const result = file as unknown as { path: string; filename: string };

  // Get existing pet to check for old photo
  const existingPet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { photoUrl: true },
  });

  // Delete old photo if exists
  if (existingPet?.photoUrl) {
    const publicId = extractPublicIdFromUrl(existingPet.photoUrl);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Failed to delete old pet photo from Cloudinary:', error);
      }
    }
  }

  // Update pet with new photo URL
  const updatedPet = await prisma.pet.update({
    where: { id: petId },
    data: { photoUrl: result.path },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          customerCode: true,
        },
      },
    },
  });

  return updatedPet;
};

// Remove pet photo
export const removePetPhoto = async (petId: string) => {
  const pet = await prisma.pet.findUnique({
    where: { id: petId },
    select: { photoUrl: true },
  });

  if (pet?.photoUrl) {
    const publicId = extractPublicIdFromUrl(pet.photoUrl);
    if (publicId) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.error('Failed to delete pet photo from Cloudinary:', error);
      }
    }
  }

  const updatedPet = await prisma.pet.update({
    where: { id: petId },
    data: { photoUrl: null },
    include: {
      owner: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          customerCode: true,
        },
      },
    },
  });

  return updatedPet;
};

// Upload medical attachment
export const uploadMedicalAttachment = async (
  recordId: string,
  file: Express.Multer.File,
  uploaderId: string,
  description?: string
) => {
  // Verify medical record exists
  const record = await prisma.medicalRecord.findUnique({
    where: { id: recordId },
  });

  if (!record) {
    throw new Error('Medical record not found');
  }

  // File is already uploaded to Cloudinary via multer-storage-cloudinary
  const result = file as unknown as { path: string; filename: string; size?: number };

  // Determine file type from mimetype
  let fileType = 'document';
  if (file.mimetype.startsWith('image/')) {
    fileType = 'image';
  } else if (file.mimetype === 'application/pdf') {
    fileType = 'pdf';
  }

  // Create attachment record
  const attachment = await prisma.medicalAttachment.create({
    data: {
      medicalRecordId: recordId,
      fileName: file.originalname,
      fileUrl: result.path,
      publicId: result.filename,
      fileType,
      fileSize: file.size || result.size || 0,
      description,
      uploadedBy: uploaderId,
    },
    include: {
      uploader: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  return attachment;
};

// Get medical attachments for a record
export const getMedicalAttachments = async (recordId: string) => {
  const attachments = await prisma.medicalAttachment.findMany({
    where: { medicalRecordId: recordId },
    include: {
      uploader: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return attachments;
};

// Delete medical attachment
export const deleteMedicalAttachment = async (attachmentId: string, userId: string) => {
  const attachment = await prisma.medicalAttachment.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment) {
    throw new Error('Attachment not found');
  }

  // Delete from Cloudinary
  if (attachment.publicId) {
    try {
      // Determine resource type based on file type
      const resourceType = attachment.fileType === 'pdf' ? 'raw' : 'image';
      await cloudinary.uploader.destroy(attachment.publicId, { resource_type: resourceType });
    } catch (error) {
      console.error('Failed to delete attachment from Cloudinary:', error);
    }
  }

  // Delete from database
  await prisma.medicalAttachment.delete({
    where: { id: attachmentId },
  });

  return { success: true };
};

// Helper function to extract Cloudinary public_id from URL
function extractPublicIdFromUrl(url: string): string | null {
  try {
    // Cloudinary URLs typically look like:
    // https://res.cloudinary.com/cloud_name/image/upload/v1234567890/folder/filename.ext
    const regex = /\/v\d+\/(.+)\.\w+$/;
    const match = url.match(regex);
    if (match && match[1]) {
      return match[1];
    }
    return null;
  } catch {
    return null;
  }
}
