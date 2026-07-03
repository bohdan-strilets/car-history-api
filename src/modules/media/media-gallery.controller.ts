import { Auth, WorkspaceMember } from '@common/decorators';
import { VehicleAccessGuard } from '@common/guards';
import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { MediaCategory } from '@prisma/client';

import { MediaService } from './media.service';

@Controller('workspaces/:workspaceId/vehicles/:vehicleId/gallery')
@Auth()
@WorkspaceMember()
@UseGuards(VehicleAccessGuard)
export class MediaGalleryController {
  constructor(private readonly mediaService: MediaService) {}

  @Get()
  getGallery(@Param('vehicleId') vehicleId: string, @Query('category') category?: MediaCategory) {
    return this.mediaService.getGallery(vehicleId, category);
  }
}
