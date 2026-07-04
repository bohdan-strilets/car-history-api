import { MappedMedia } from '../types';

export const mapMedia = (media: MappedMedia) => {
  const primaryUsage = media.usages[0] ?? null;

  return {
    id: media.id,
    cloudinaryUrl: media.cloudinaryUrl,
    type: media.type,
    mimeType: media.mimeType,
    width: media.width,
    height: media.height,
    durationSeconds: media.durationSeconds,
    variants: media.variants.map((v) => ({
      type: v.type,
      cloudinaryUrl: v.cloudinaryUrl,
      width: v.width,
      height: v.height,
    })),
    usage: primaryUsage
      ? {
          entityType: primaryUsage.entityType,
          entityId: primaryUsage.entityId,
          category: primaryUsage.category,
          isPrimary: primaryUsage.isPrimary,
        }
      : null,
    createdAt: media.createdAt,
  };
};
