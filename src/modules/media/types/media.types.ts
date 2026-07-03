import { Media, MediaCategory, MediaEntity, MediaUsage, MediaVariant } from '@prisma/client';

export interface EntityContext {
  workspaceId: string | null;
  vehicleId: string | null;
}

export interface CreateMediaInput {
  uploadedBy: string;
  cloudinaryId: string;
  cloudinaryUrl: string;
  type: 'IMAGE' | 'VIDEO';
  mimeType: string;
  originalName: string;
  storageKey: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
  variants: Array<{
    type: 'THUMBNAIL' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ORIGINAL';
    cloudinaryUrl: string;
    storageKey: string;
    width: number | null;
    height: number | null;
    sizeBytes: number;
  }>;
  usage: {
    entityType: MediaEntity;
    entityId: string;
    category: MediaCategory;
    isPrimary: boolean;
  };
}

export type MappedMedia = Media & {
  variants: MediaVariant[];
  usages: MediaUsage[];
};
