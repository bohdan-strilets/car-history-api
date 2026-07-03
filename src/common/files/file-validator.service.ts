import { extname } from 'path';

import { SECURITY } from '@common/constants';
import { BadRequestException, ErrorCodes } from '@common/exceptions';
import { FileConstraints } from '@common/validation';
import { AppConfigService } from '@config/config.service';
import { Injectable } from '@nestjs/common';

import { UploadedFile, ValidateFileParams } from './types/uploaded-file.type';

@Injectable()
export class FileValidatorService {
  constructor(private readonly config: AppConfigService) {}

  validate(file: UploadedFile, params: ValidateFileParams): void {
    if (!file) {
      throw new BadRequestException(ErrorCodes.Media.UPLOAD_FAILED);
    }

    const mimeType = file.mimetype.toLowerCase();
    if (!params.allowedMimeTypes.includes(mimeType)) {
      throw new BadRequestException(ErrorCodes.Media.INVALID_FILE_TYPE);
    }

    if (file.size > params.maxSizeBytes) {
      throw new BadRequestException(ErrorCodes.Media.FILE_TOO_LARGE, {
        maxBytes: params.maxSizeBytes,
      });
    }

    const extension = extname(file.originalname).toLowerCase();
    const blockedExtensions = FileConstraints.BLOCKED_EXTENSIONS as readonly string[];
    if (blockedExtensions.includes(extension)) {
      throw new BadRequestException(ErrorCodes.Media.INVALID_FILE_TYPE);
    }
  }

  async scan(file: UploadedFile): Promise<void> {
    if (!this.config.enableAntivirusScan) {
      return;
    }

    const content = file.buffer.toString('utf8');
    if (content.includes(SECURITY.UPLOAD.EICAR_SIGNATURE)) {
      throw new BadRequestException(ErrorCodes.Media.UPLOAD_FAILED);
    }
  }
}
