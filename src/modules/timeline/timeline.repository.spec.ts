import { PAGINATION_DEFAULTS } from '@common/constants';
import { MileageSource, Prisma, TimelineType } from '@prisma/client';
import { PrismaService } from '@prisma/prisma.service';

import { mapTimelineEvent } from './mappers';
import { TimelineRepository } from './timeline.repository';

jest.mock('./mappers', () => ({
  mapTimelineEvent: jest.fn((event) => ({ id: event.id, type: event.type })),
}));

describe('TimelineRepository', () => {
  let repository: TimelineRepository;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(() => {
    prisma = {
      $transaction: jest.fn(),
      timelineEvent: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      mileageLog: {
        updateMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        deleteMany: jest.fn(),
      },
      vehicle: {
        update: jest.fn(),
        findUnique: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    repository = new TimelineRepository(prisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findMany', () => {
    it('повинен повертати пагінований список з дефолтними параметрами', async () => {
      const rawEvents = [{ id: 'event-1', type: TimelineType.REFUEL }];
      (prisma.timelineEvent.findMany as jest.Mock).mockReturnValue('events-query');
      (prisma.timelineEvent.count as jest.Mock).mockReturnValue('count-query');
      (prisma.$transaction as jest.Mock).mockResolvedValue([rawEvents, 1]);

      const result = await repository.findMany('vehicle-1', {});

      expect(prisma.timelineEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { vehicleId: 'vehicle-1', deletedAt: null },
          skip: 0,
          take: PAGINATION_DEFAULTS.DEFAULT_LIMIT,
        }),
      );
      expect(prisma.$transaction).toHaveBeenCalledWith(['events-query', 'count-query']);
      expect(mapTimelineEvent).toHaveBeenCalledWith(rawEvents[0], 0, rawEvents);
      expect(result.meta).toEqual({
        total: 1,
        page: PAGINATION_DEFAULTS.DEFAULT_PAGE,
        limit: PAGINATION_DEFAULTS.DEFAULT_LIMIT,
        totalPages: 1,
      });
    });

    it('повинен застосовувати фільтри type/date і кастомну пагінацію', async () => {
      (prisma.timelineEvent.findMany as jest.Mock).mockReturnValue('events-query');
      (prisma.timelineEvent.count as jest.Mock).mockReturnValue('count-query');
      (prisma.$transaction as jest.Mock).mockResolvedValue([[], 0]);

      await repository.findMany('vehicle-1', {
        page: 2,
        limit: 10,
        type: [TimelineType.SERVICE, TimelineType.EXPENSE],
        dateFrom: '2026-01-01',
        dateTo: '2026-01-31',
      });

      expect(prisma.timelineEvent.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            vehicleId: 'vehicle-1',
            type: { in: [TimelineType.SERVICE, TimelineType.EXPENSE] },
            eventDate: {
              gte: new Date('2026-01-01'),
              lte: new Date('2026-01-31'),
            },
          }),
          skip: 10,
          take: 10,
        }),
      );
    });
  });

  describe('findById', () => {
    it('повинен повертати mapped івент', async () => {
      const rawEvent = { id: 'event-1', type: TimelineType.REFUEL };
      (prisma.timelineEvent.findUnique as jest.Mock).mockResolvedValue(rawEvent);

      const result = await repository.findById('event-1');

      expect(prisma.timelineEvent.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'event-1', deletedAt: null } }),
      );
      expect(result).toEqual({ id: 'event-1', type: TimelineType.REFUEL });
    });

    it('повинен повертати null коли івент не знайдено', async () => {
      (prisma.timelineEvent.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await repository.findById('event-404');

      expect(result).toBeNull();
    });
  });

  describe('create/update/delete', () => {
    it('повинен створювати івент з nested даними', async () => {
      const rawEvent = { id: 'event-1', type: TimelineType.SERVICE };
      (prisma.timelineEvent.create as jest.Mock).mockResolvedValue(rawEvent);

      const result = await repository.create({
        vehicleId: 'vehicle-1',
        type: TimelineType.SERVICE,
        title: 'Service',
        eventDate: new Date('2026-01-10'),
        service: { category: 'MAINTENANCE', works: ['Oil'], parts: [] },
      } as any);

      expect(prisma.timelineEvent.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            vehicleId: 'vehicle-1',
            type: TimelineType.SERVICE,
            service: {
              create: { category: 'MAINTENANCE', works: ['Oil'], parts: [] },
            },
          }),
        }),
      );
      expect(result).toEqual({ id: 'event-1', type: TimelineType.SERVICE });
    });

    it('повинен оновлювати івент', async () => {
      const rawEvent = { id: 'event-1', type: TimelineType.EXPENSE };
      (prisma.timelineEvent.update as jest.Mock).mockResolvedValue(rawEvent);

      const result = await repository.update('event-1', { title: 'Updated title' } as any);

      expect(prisma.timelineEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'event-1' },
          data: { title: 'Updated title' },
        }),
      );
      expect(result).toEqual({ id: 'event-1', type: TimelineType.EXPENSE });
    });

    it('повинен робити soft delete', async () => {
      (prisma.timelineEvent.update as jest.Mock).mockResolvedValue({});

      await repository.softDelete('event-1');

      expect(prisma.timelineEvent.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'event-1' },
          data: expect.objectContaining({ deletedAt: expect.any(Date) }),
        }),
      );
    });
  });

  describe('mileage operations', () => {
    it('updateMileageLog: оновлює mileage і currentMileage якщо є maxLog', async () => {
      (prisma.mileageLog.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.mileageLog.findFirst as jest.Mock).mockResolvedValue({ mileage: 145000 });
      (prisma.vehicle.update as jest.Mock).mockResolvedValue({});

      await repository.updateMileageLog('vehicle-1', 'event-1', 120000);

      expect(prisma.mileageLog.updateMany).toHaveBeenCalledWith({
        where: { eventId: 'event-1' },
        data: { mileage: 120000 },
      });
      expect(prisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: 'vehicle-1' },
        data: { currentMileage: 145000 },
      });
    });

    it('updateMileageLog: не оновлює vehicle якщо maxLog відсутній', async () => {
      (prisma.mileageLog.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.mileageLog.findFirst as jest.Mock).mockResolvedValue(null);

      await repository.updateMileageLog('vehicle-1', 'event-1', 120000);

      expect(prisma.vehicle.update).not.toHaveBeenCalled();
    });

    it('createMileageLog: створює log і оновлює vehicle із maxLog або fallback', async () => {
      (prisma.mileageLog.create as jest.Mock).mockResolvedValue({});
      (prisma.mileageLog.findFirst as jest.Mock).mockResolvedValue({ mileage: 100500 });
      (prisma.vehicle.update as jest.Mock).mockResolvedValue({});

      await repository.createMileageLog('vehicle-1', 'event-1', 100000, MileageSource.MANUAL);

      expect(prisma.mileageLog.create).toHaveBeenCalledWith({
        data: {
          vehicleId: 'vehicle-1',
          eventId: 'event-1',
          mileage: 100000,
          source: MileageSource.MANUAL,
        },
      });
      expect(prisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: 'vehicle-1' },
        data: { currentMileage: 100500 },
      });
    });

    it('deleteMileageLog: видаляє log і ставить 0 якщо maxLog немає', async () => {
      (prisma.mileageLog.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });
      (prisma.mileageLog.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.vehicle.update as jest.Mock).mockResolvedValue({});

      await repository.deleteMileageLog('vehicle-1', 'event-1');

      expect(prisma.mileageLog.deleteMany).toHaveBeenCalledWith({ where: { eventId: 'event-1' } });
      expect(prisma.vehicle.update).toHaveBeenCalledWith({
        where: { id: 'vehicle-1' },
        data: { currentMileage: 0 },
      });
    });
  });

  describe('helpers', () => {
    it('getVehicleCurrentMileage: повертає mileage або 0', async () => {
      (prisma.vehicle.findUnique as jest.Mock).mockResolvedValueOnce({ currentMileage: 98765 });
      (prisma.vehicle.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(repository.getVehicleCurrentMileage('vehicle-1')).resolves.toBe(98765);
      await expect(repository.getVehicleCurrentMileage('vehicle-2')).resolves.toBe(0);
    });

    it('findRawById: повертає raw event', async () => {
      const rawEvent = { id: 'event-1' };
      (prisma.timelineEvent.findUnique as jest.Mock).mockResolvedValue(rawEvent);

      const result = await repository.findRawById('event-1');

      expect(result).toEqual(rawEvent);
      expect(prisma.timelineEvent.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'event-1', deletedAt: null },
        }),
      );
    });

    it('countByType: рахує івенти по типу', async () => {
      (prisma.timelineEvent.count as jest.Mock).mockResolvedValue(3);

      const result = await repository.countByType('vehicle-1', TimelineType.PURCHASE);

      expect(result).toBe(3);
      expect(prisma.timelineEvent.count).toHaveBeenCalledWith({
        where: { vehicleId: 'vehicle-1', type: TimelineType.PURCHASE, deletedAt: null },
      });
    });

    it('syncVehicleInfoFromEvent: оновлює purchaseInfo/saleInfo і status', async () => {
      (prisma.vehicle.update as jest.Mock).mockResolvedValue({});

      await repository.syncVehicleInfoFromEvent('vehicle-1', TimelineType.PURCHASE, {
        date: new Date('2026-02-01'),
        price: 10000,
      });
      await repository.syncVehicleInfoFromEvent('vehicle-1', TimelineType.SALE, null);

      expect(prisma.vehicle.update).toHaveBeenNthCalledWith(1, {
        where: { id: 'vehicle-1' },
        data: { purchaseInfo: { date: new Date('2026-02-01'), price: 10000 } },
      });
      expect(prisma.vehicle.update).toHaveBeenNthCalledWith(2, {
        where: { id: 'vehicle-1' },
        data: {
          saleInfo: Prisma.JsonNull,
          status: 'ACTIVE',
        },
      });
    });

    it('getVehicleFuelTypes: повертає fuel types або порожній масив', async () => {
      (prisma.vehicle.findUnique as jest.Mock).mockResolvedValueOnce({ fuelType: ['GASOLINE'] });
      (prisma.vehicle.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(repository.getVehicleFuelTypes('vehicle-1')).resolves.toEqual(['GASOLINE']);
      await expect(repository.getVehicleFuelTypes('vehicle-2')).resolves.toEqual([]);
    });
  });
});
