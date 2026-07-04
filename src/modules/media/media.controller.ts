import { Auth, CurrentUserId } from '@common/decorators';
import { UploadedFile as UploadedFileType } from '@common/files';
import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { UploadMediaDto } from './dto';
import { MediaService } from './media.service';

@Controller('media')
@Auth()
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 100 * 1024 * 1024 },
    }),
  )
  upload(
    @CurrentUserId() userId: string,
    @UploadedFile() file: UploadedFileType,
    @Body() dto: UploadMediaDto,
  ) {
    return this.mediaService.upload(userId, file, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.mediaService.delete(userId, id);
  }

  @Patch(':id/primary')
  setPrimary(@CurrentUserId() userId: string, @Param('id') id: string) {
    return this.mediaService.setPrimary(userId, id);
  }
}
