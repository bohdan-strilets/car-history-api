import { ErrorCodes, NotFoundException } from '@common/exceptions';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

@Injectable()
export class VehicleAccessGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const workspaceId = request.params?.workspaceId;
    const vehicleId = request.params?.vehicleId;

    if (!workspaceId || !vehicleId) {
      return true;
    }

    const vehicle = await this.prisma.vehicle.findFirst({
      where: {
        id: vehicleId,
        workspaceId,
        deletedAt: null,
      },
    });

    if (!vehicle) {
      throw new NotFoundException(ErrorCodes.Vehicle.NOT_FOUND);
    }

    request.vehicle = vehicle;
    return true;
  }
}
