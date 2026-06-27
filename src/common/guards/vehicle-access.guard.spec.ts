import { ErrorCodes } from '@common/exceptions';
import { ExecutionContext } from '@nestjs/common';
import { PrismaService } from '@prisma/prisma.service';

import { VehicleAccessGuard } from './vehicle-access.guard';

describe('VehicleAccessGuard', () => {
  const createContext = (): ExecutionContext =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          params: {
            workspaceId: 'workspace-1',
            vehicleId: 'vehicle-1',
          },
        }),
      }),
    }) as ExecutionContext;

  it('дозволяє доступ до авто в межах workspace', async () => {
    const prisma = {
      vehicle: {
        findFirst: jest.fn().mockResolvedValue({ id: 'vehicle-1', workspaceId: 'workspace-1' }),
      },
    } as unknown as PrismaService;
    const guard = new VehicleAccessGuard(prisma);

    await expect(guard.canActivate(createContext())).resolves.toBe(true);
  });

  it('блокує IDOR при доступі до авто іншого workspace', async () => {
    const prisma = {
      vehicle: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as unknown as PrismaService;
    const guard = new VehicleAccessGuard(prisma);

    await expect(guard.canActivate(createContext())).rejects.toMatchObject({
      errorCode: ErrorCodes.Vehicle.NOT_FOUND,
    });
  });
});
