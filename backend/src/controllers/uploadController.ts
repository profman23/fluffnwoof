import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import * as uploadService from '../services/uploadService';
import prisma from '../lib/prisma';
import { v2 as cloudinaryV2 } from 'cloudinary';

// Ensure cloudinary is configured (config is loaded in cloudinary.ts at import time)
import '../config/cloudinary';
import { inflateRawSync } from 'zlib';

// Extract first file from ZIP buffer (handles data descriptor flag)
function extractFileFromZip(zipBuffer: Buffer): Buffer | null {
  try {
    // ZIP local file header signature: PK\x03\x04
    if (zipBuffer[0] !== 0x50 || zipBuffer[1] !== 0x4B) return null;

    const compressionMethod = zipBuffer.readUInt16LE(8);
    let compressedSize = zipBuffer.readUInt32LE(18);
    const fileNameLength = zipBuffer.readUInt16LE(26);
    const extraFieldLength = zipBuffer.readUInt16LE(28);
    const dataOffset = 30 + fileNameLength + extraFieldLength;

    // If compressedSize is 0 (data descriptor flag set), read from Central Directory
    if (compressedSize === 0) {
      // Find Central Directory: scan from end for PK\x01\x02
      for (let i = zipBuffer.length - 22; i >= 0; i--) {
        // End of central directory signature: PK\x05\x06
        if (zipBuffer.readUInt32LE(i) === 0x06054b50) {
          const cdOffset = zipBuffer.readUInt32LE(i + 16);
          // Central directory file header: PK\x01\x02
          if (zipBuffer.readUInt32LE(cdOffset) === 0x02014b50) {
            compressedSize = zipBuffer.readUInt32LE(cdOffset + 20);
          }
          break;
        }
      }
    }

    if (compressedSize === 0) return null;

    const compressedData = zipBuffer.subarray(dataOffset, dataOffset + compressedSize);

    if (compressionMethod === 0) {
      return Buffer.from(compressedData);
    } else if (compressionMethod === 8) {
      return Buffer.from(inflateRawSync(compressedData));
    }
    return null;
  } catch {
    return null;
  }
}

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

// Download medical attachment via backend proxy
export const downloadMedicalAttachment = async (req: Request, res: Response) => {
  try {
    const { attachmentId } = req.params;
    if (!attachmentId) {
      return res.status(400).json({ message: 'Attachment ID is required' });
    }

    const attachment = await prisma.medicalAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    if (!attachment.publicId) {
      return res.status(400).json({ message: 'Attachment has no public ID' });
    }

    // Use Cloudinary generate_archive API to download the file (bypasses access restrictions)
    const archiveUrl = cloudinaryV2.utils.download_zip_url({
      public_ids: [attachment.publicId],
      resource_type: 'image',
    });

    const archiveResponse = await fetch(archiveUrl);
    if (!archiveResponse.ok) {
      return res.status(502).json({ message: 'Failed to fetch file from storage' });
    }

    const zipBuffer = Buffer.from(await archiveResponse.arrayBuffer());
    const fileData = extractFileFromZip(zipBuffer);
    if (!fileData) {
      return res.status(502).json({ message: 'Failed to extract file from archive' });
    }

    const mimeTypes: Record<string, string> = {
      pdf: 'application/pdf',
      image: 'image/jpeg',
      document: 'application/octet-stream',
    };
    const contentType = mimeTypes[attachment.fileType] || 'application/octet-stream';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(attachment.fileName)}"`);
    res.setHeader('Content-Length', fileData.length);
    res.send(fileData);
  } catch (error: any) {
    console.error('Error downloading attachment:', error);
    res.status(500).json({ message: error.message || 'Failed to download attachment' });
  }
};
