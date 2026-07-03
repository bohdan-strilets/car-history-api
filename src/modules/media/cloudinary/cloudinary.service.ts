import { UploadedFile } from '@common/files';
import { AppConfigService } from '@config/config.service';
import { Injectable, Logger } from '@nestjs/common';
import { UploadApiErrorResponse, UploadApiResponse, v2 as cloudinary } from 'cloudinary';

import { EAGER_TRANSFORMATIONS } from './cloudinary.transformation';
import { CloudinaryUploadResult, CloudinaryVariant } from './cloudinary.types';

@Injectable()
export class CloudinaryService {
  private readonly logger = new Logger(CloudinaryService.name);

  constructor(private readonly config: AppConfigService) {
    cloudinary.config({
      cloud_name: this.config.cloudinaryCloudName,
      api_key: this.config.cloudinaryApiKey,
      api_secret: this.config.cloudinaryApiSecret,
      secure: true,
    });
  }

  async upload(file: UploadedFile, folder: string): Promise<CloudinaryUploadResult> {
    const isVideo = file.mimetype.startsWith('video/');
    const resourceType = isVideo ? 'video' : 'image';

    const result = await new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          eager: isVideo
            ? undefined
            : EAGER_TRANSFORMATIONS.map(({ transformation: _transformation, ...t }) => t),
          eager_async: false,
        },
        (error: UploadApiErrorResponse | undefined, response?: UploadApiResponse) => {
          if (error || !response) {
            return reject(error);
          }
          resolve(response);
        },
      );

      stream.end(file.buffer);
    });

    return this.mapResult(result, resourceType, isVideo);
  }

  async destroy(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
    } catch (error) {
      this.logger.error(`Failed to destroy Cloudinary asset ${publicId}`, error);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private mapResult(
    result: UploadApiResponse,
    resourceType: 'image' | 'video',
    isVideo: boolean,
  ): CloudinaryUploadResult {
    const findEager = (name: string): CloudinaryVariant | null => {
      const index = EAGER_TRANSFORMATIONS.findIndex((t) => t.transformation === name);
      const eager = result.eager?.[index];
      if (!eager) return null;

      return {
        url: eager.secure_url,
        width: eager.width ?? null,
        height: eager.height ?? null,
        bytes: eager.bytes,
      };
    };

    return {
      publicId: result.public_id,
      url: result.secure_url,
      format: result.format,
      width: result.width ?? null,
      height: result.height ?? null,
      bytes: result.bytes,
      resourceType,
      durationSeconds: isVideo ? Math.round(result.duration ?? 0) : null,
      variants: {
        thumbnail: findEager('thumbnail'),
        small: findEager('small'),
        medium: findEager('medium'),
        large: findEager('large'),
      },
    };
  }
}
