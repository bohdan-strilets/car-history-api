import { Injectable } from '@nestjs/common';
import { Prisma, Tire, TireStatus } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { CreateTireInput, UpdateTireInput } from './types';

@Injectable()
export class TiresRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByVehicleId(vehicleId: string): Promise<Tire[]> {
    return this.prisma.tire.findMany({
      where: { vehicleId },
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findById(id: string): Promise<Tire | null> {
    return this.prisma.tire.findUnique({ where: { id } });
  }

  async findMountedByVehicleId(vehicleId: string, tx?: Prisma.TransactionClient): Promise<Tire[]> {
    const client = tx ?? this.prisma;
    return client.tire.findMany({
      where: { vehicleId, status: TireStatus.MOUNTED },
    });
  }

  async create(data: CreateTireInput): Promise<Tire> {
    return this.prisma.tire.create({
      data: {
        vehicleId: data.vehicleId,
        brand: data.brand,
        model: data.model,
        type: data.type as never,
        width: data.width,
        aspectRatio: data.aspectRatio,
        rimDiameter: data.rimDiameter,
        price: data.price,
        status: data.status as never,
        storageLocation: data.storageLocation,
        mileageAtPurchase: data.mileageAtPurchase,
        quantity: data.quantity,
        purchaseAt: data.purchaseAt,
      },
    });
  }

  async update(id: string, data: UpdateTireInput, tx?: Prisma.TransactionClient): Promise<Tire> {
    const client = tx ?? this.prisma;
    return client.tire.update({
      where: { id },
      data: data as Prisma.TireUpdateInput,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.tire.delete({ where: { id } });
  }
}
