export interface CloudinaryVariant {
  url: string;
  width: number | null;
  height: number | null;
  bytes: number;
}

export interface CloudinaryUploadResult {
  publicId: string;
  url: string;
  format: string;
  width: number | null;
  height: number | null;
  bytes: number;
  resourceType: 'image' | 'video';
  durationSeconds: number | null;
  variants: {
    thumbnail: CloudinaryVariant | null;
    small: CloudinaryVariant | null;
    medium: CloudinaryVariant | null;
    large: CloudinaryVariant | null;
  };
}
