import { Auth, CurrentUserId, EmailVerified } from '@common/decorators';
import { Body, Controller, Delete, HttpCode, HttpStatus, Param, Patch } from '@nestjs/common';

import { TireResponseDto, UpdateTireDto } from './dto';
import { TiresService } from './tires.service';

@Controller('tires')
@Auth()
export class TireController {
  constructor(private readonly tiresService: TiresService) {}

  @Patch(':id')
  @EmailVerified()
  update(
    @CurrentUserId() userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTireDto,
  ): Promise<TireResponseDto> {
    return this.tiresService.update(userId, id, dto);
  }

  @Delete(':id')
  @EmailVerified()
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@CurrentUserId() userId: string, @Param('id') id: string): Promise<void> {
    return this.tiresService.delete(userId, id);
  }
}
