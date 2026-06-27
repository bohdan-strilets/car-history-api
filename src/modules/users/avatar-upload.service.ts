import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { dirname, extname, resolve } from 'path';

import { SECURITY } from '@common/constants';
import { BadRequestException, ErrorCodes } from '@common/exceptions';
import { AppConfigService } from '@config/config.service';
import { Injectable } from '@nestjs/common';

import { UploadedFile } from './types';

@Injectable()
export class AvatarUploadService {
  constructor(private readonly config: AppConfigService) {}

  async uploadAvatar(userId: string, file: UploadedFile): Promise<string> {
    this.validateFile(file);
    await this.scanFile(file);

    const extension =
      extname(file.originalname).toLowerCase() || this.resolveExtension(file.mimetype);
    const fileName = `${randomUUID()}${extension}`;
    const relativePath = `avatars/${userId}/${fileName}`;
    const fullPath = resolve(process.cwd(), this.config.uploadStoragePath, relativePath);

    await mkdir(dirname(fullPath), { recursive: true });
    await writeFile(fullPath, file.buffer);

    return `private://${relativePath.replaceAll('\\', '/')}`;
  }

  private validateFile(file: UploadedFile): void {
    if (!file) {
      throw new BadRequestException(ErrorCodes.Media.UPLOAD_FAILED);
    }

    const allowedMimeTypes = this.config.uploadAllowedMimeTypes;
    const mimeType = file.mimetype.toLowerCase();

    if (!allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(ErrorCodes.Media.INVALID_FILE_TYPE);
    }

    const maxBytes = this.config.uploadMaxFileSizeMb * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new BadRequestException(ErrorCodes.Media.FILE_TOO_LARGE, { maxBytes });
    }

    const extension = extname(file.originalname).toLowerCase();
    const blockedExtensions = SECURITY.UPLOAD.BLOCKED_EXTENSIONS as readonly string[];
    if (blockedExtensions.includes(extension)) {
      throw new BadRequestException(ErrorCodes.Media.INVALID_FILE_TYPE);
    }
  }

  private async scanFile(file: UploadedFile): Promise<void> {
    if (!this.config.enableAntivirusScan) {
      return;
    }

    const content = file.buffer.toString('utf8');
    if (content.includes(SECURITY.UPLOAD.EICAR_SIGNATURE)) {
      throw new BadRequestException(ErrorCodes.Media.UPLOAD_FAILED);
    }
  }

  private resolveExtension(mimeType: string): string {
    if (mimeType === 'image/jpeg') return '.jpg';
    if (mimeType === 'image/png') return '.png';
    if (mimeType === 'image/webp') return '.webp';
    if (mimeType === 'image/gif') return '.gif';
    return '.bin';
  }
}
