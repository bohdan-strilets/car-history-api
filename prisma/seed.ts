import { Logger } from '@nestjs/common';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const adapter = new PrismaPg({ connectionString: process.env['DATABASE_URL'] });
const prisma = new PrismaClient({ adapter });
const logger = new Logger('prisma:seed');

async function main() {
  const milestones = [
    // MILEAGE
    {
      code: 'MILEAGE_1000',
      category: 'MILEAGE',
      title: '1 000 km',
      description: 'Your vehicle reached 1 000 km since registration',
      condition: { type: 'MILEAGE_SINCE_REGISTRATION', value: 1000 },
    },
    {
      code: 'MILEAGE_5000',
      category: 'MILEAGE',
      title: '5 000 km',
      description: 'Your vehicle reached 5 000 km since registration',
      condition: { type: 'MILEAGE_SINCE_REGISTRATION', value: 5000 },
    },
    {
      code: 'MILEAGE_10000',
      category: 'MILEAGE',
      title: '10 000 km',
      description: 'Your vehicle reached 10 000 km since registration',
      condition: { type: 'MILEAGE_SINCE_REGISTRATION', value: 10000 },
    },
    {
      code: 'MILEAGE_25000',
      category: 'MILEAGE',
      title: '25 000 km',
      description: 'Your vehicle reached 25 000 km since registration',
      condition: { type: 'MILEAGE_SINCE_REGISTRATION', value: 25000 },
    },
    {
      code: 'MILEAGE_50000',
      category: 'MILEAGE',
      title: '50 000 km',
      description: 'Your vehicle reached 50 000 km since registration',
      condition: { type: 'MILEAGE_SINCE_REGISTRATION', value: 50000 },
    },
    {
      code: 'MILEAGE_75000',
      category: 'MILEAGE',
      title: '75 000 km',
      description: 'Your vehicle reached 75 000 km since registration',
      condition: { type: 'MILEAGE_SINCE_REGISTRATION', value: 75000 },
    },
    {
      code: 'MILEAGE_100000',
      category: 'MILEAGE',
      title: '100 000 km',
      description: 'Your vehicle reached 100 000 km since registration',
      condition: { type: 'MILEAGE_SINCE_REGISTRATION', value: 100000 },
    },
    {
      code: 'MILEAGE_150000',
      category: 'MILEAGE',
      title: '150 000 km',
      description: 'Your vehicle reached 150 000 km since registration',
      condition: { type: 'MILEAGE_SINCE_REGISTRATION', value: 150000 },
    },
    {
      code: 'MILEAGE_200000',
      category: 'MILEAGE',
      title: '200 000 km',
      description: 'Your vehicle reached 200 000 km since registration',
      condition: { type: 'MILEAGE_SINCE_REGISTRATION', value: 200000 },
    },

    // TIME
    {
      code: 'ONE_WEEK',
      category: 'TIME',
      title: 'One Week',
      description: 'You have owned your vehicle for one week',
      condition: { type: 'OWNERSHIP_DAYS', value: 7 },
    },
    {
      code: 'ONE_MONTH',
      category: 'TIME',
      title: 'One Month',
      description: 'You have owned your vehicle for one month',
      condition: { type: 'OWNERSHIP_DAYS', value: 30 },
    },
    {
      code: 'THREE_MONTHS',
      category: 'TIME',
      title: 'Three Months',
      description: 'You have owned your vehicle for three months',
      condition: { type: 'OWNERSHIP_DAYS', value: 90 },
    },
    {
      code: 'SIX_MONTHS',
      category: 'TIME',
      title: 'Six Months',
      description: 'You have owned your vehicle for six months',
      condition: { type: 'OWNERSHIP_DAYS', value: 180 },
    },
    {
      code: 'ONE_YEAR',
      category: 'TIME',
      title: 'One Year',
      description: 'You have owned your vehicle for one year',
      condition: { type: 'OWNERSHIP_DAYS', value: 365 },
    },
    {
      code: 'TWO_YEARS',
      category: 'TIME',
      title: 'Two Years',
      description: 'You have owned your vehicle for two years',
      condition: { type: 'OWNERSHIP_DAYS', value: 730 },
    },

    // EXPENSES
    {
      code: 'EXPENSES_500',
      category: 'EXPENSES',
      title: '500 PLN spent',
      description: 'You have spent 500 PLN on your vehicle',
      condition: { type: 'TOTAL_EXPENSES', value: 500 },
    },
    {
      code: 'EXPENSES_1000',
      category: 'EXPENSES',
      title: '1 000 PLN spent',
      description: 'You have spent 1 000 PLN on your vehicle',
      condition: { type: 'TOTAL_EXPENSES', value: 1000 },
    },
    {
      code: 'EXPENSES_5000',
      category: 'EXPENSES',
      title: '5 000 PLN spent',
      description: 'You have spent 5 000 PLN on your vehicle',
      condition: { type: 'TOTAL_EXPENSES', value: 5000 },
    },
    {
      code: 'EXPENSES_10000',
      category: 'EXPENSES',
      title: '10 000 PLN spent',
      description: 'You have spent 10 000 PLN on your vehicle',
      condition: { type: 'TOTAL_EXPENSES', value: 10000 },
    },
    {
      code: 'EXPENSES_25000',
      category: 'EXPENSES',
      title: '25 000 PLN spent',
      description: 'You have spent 25 000 PLN on your vehicle',
      condition: { type: 'TOTAL_EXPENSES', value: 25000 },
    },
    {
      code: 'EXPENSES_50000',
      category: 'EXPENSES',
      title: '50 000 PLN spent',
      description: 'You have spent 50 000 PLN on your vehicle',
      condition: { type: 'TOTAL_EXPENSES', value: 50000 },
    },
    {
      code: 'EXPENSES_100000',
      category: 'EXPENSES',
      title: '100 000 PLN spent',
      description: 'You have spent 100 000 PLN on your vehicle',
      condition: { type: 'TOTAL_EXPENSES', value: 100000 },
    },
    {
      code: 'EXPENSES_200000',
      category: 'EXPENSES',
      title: '200 000 PLN spent',
      description: 'You have spent 200 000 PLN on your vehicle',
      condition: { type: 'TOTAL_EXPENSES', value: 200000 },
    },

    // FUEL
    {
      code: 'FIRST_REFUEL',
      category: 'FUEL',
      title: 'First Refuel',
      description: 'First time you refueled your vehicle',
      condition: { type: 'EVENT_COUNT', value: 1, eventType: 'REFUEL' },
    },
    {
      code: 'REFUEL_10',
      category: 'FUEL',
      title: '10 Refuels',
      description: 'You have refueled your vehicle 10 times',
      condition: { type: 'EVENT_COUNT', value: 10, eventType: 'REFUEL' },
    },
    {
      code: 'REFUEL_50',
      category: 'FUEL',
      title: '50 Refuels',
      description: 'You have refueled your vehicle 50 times',
      condition: { type: 'EVENT_COUNT', value: 50, eventType: 'REFUEL' },
    },
    {
      code: 'REFUEL_100',
      category: 'FUEL',
      title: '100 Refuels',
      description: 'You have refueled your vehicle 100 times',
      condition: { type: 'EVENT_COUNT', value: 100, eventType: 'REFUEL' },
    },
    {
      code: 'REFUEL_500',
      category: 'FUEL',
      title: '500 Refuels',
      description: 'You have refueled your vehicle 500 times',
      condition: { type: 'EVENT_COUNT', value: 500, eventType: 'REFUEL' },
    },
    {
      code: 'FUEL_1000L',
      category: 'FUEL',
      title: '1 000 Liters',
      description: 'You have fueled 1 000 liters in total',
      condition: { type: 'TOTAL_LITERS', value: 1000 },
    },
    {
      code: 'FUEL_5000L',
      category: 'FUEL',
      title: '5 000 Liters',
      description: 'You have fueled 5 000 liters in total',
      condition: { type: 'TOTAL_LITERS', value: 5000 },
    },

    // ACTIVITY
    {
      code: 'FIRST_TIMELINE_EVENT',
      category: 'ACTIVITY',
      title: 'First Timeline Event',
      description: 'You added your first event to the timeline',
      condition: { type: 'EVENT_COUNT', value: 1, eventType: 'ANY' },
    },
    {
      code: 'FIRST_SERVICE',
      category: 'ACTIVITY',
      title: 'First Service',
      description: 'You added your first service record',
      condition: { type: 'EVENT_COUNT', value: 1, eventType: 'SERVICE' },
    },
    {
      code: 'FIRST_DOCUMENT',
      category: 'ACTIVITY',
      title: 'First Document',
      description: 'You added your first document',
      condition: { type: 'EVENT_COUNT', value: 1, eventType: 'DOCUMENT' },
    },
    {
      code: 'FIRST_TRIP',
      category: 'ACTIVITY',
      title: 'First Trip',
      description: 'You logged your first trip',
      condition: { type: 'EVENT_COUNT', value: 1, eventType: 'TRIP' },
    },
    {
      code: 'FIRST_TIRE_CHANGE',
      category: 'ACTIVITY',
      title: 'First Tire Change',
      description: 'You logged your first tire change',
      condition: { type: 'EVENT_COUNT', value: 1, eventType: 'TIRE_CHANGE' },
    },
    {
      code: 'FIRST_SERVICE_STATION',
      category: 'ACTIVITY',
      title: 'First Service Station',
      description: 'You added your first service station',
      condition: { type: 'SERVICE_STATION_COUNT', value: 1 },
    },
    {
      code: 'TIMELINE_10',
      category: 'ACTIVITY',
      title: '10 Timeline Events',
      description: 'You have logged 10 events in the timeline',
      condition: { type: 'EVENT_COUNT', value: 10, eventType: 'ANY' },
    },
    {
      code: 'TIMELINE_50',
      category: 'ACTIVITY',
      title: '50 Timeline Events',
      description: 'You have logged 50 events in the timeline',
      condition: { type: 'EVENT_COUNT', value: 50, eventType: 'ANY' },
    },
    {
      code: 'SERVICE_5',
      category: 'ACTIVITY',
      title: '5 Services',
      description: 'You have logged 5 service records',
      condition: { type: 'EVENT_COUNT', value: 5, eventType: 'SERVICE' },
    },
    {
      code: 'SERVICE_10',
      category: 'ACTIVITY',
      title: '10 Services',
      description: 'You have logged 10 service records',
      condition: { type: 'EVENT_COUNT', value: 10, eventType: 'SERVICE' },
    },
    {
      code: 'FIRST_PHOTO',
      category: 'ACTIVITY',
      title: 'First Photo',
      description: 'You uploaded your first photo',
      condition: { type: 'MEDIA_COUNT', value: 1 },
    },
    {
      code: 'FIRST_AI_MESSAGE',
      category: 'ACTIVITY',
      title: 'First AI Message',
      description: 'You sent your first message to the AI assistant',
      condition: { type: 'AI_MESSAGE_COUNT', value: 1 },
    },

    // ACHIEVEMENT
    {
      code: 'PROFILE_COMPLETE',
      category: 'ACHIEVEMENT',
      title: 'Profile Complete',
      description: 'Your vehicle profile is 100% complete',
      condition: { type: 'PROFILE_COMPLETE' },
    },
    {
      code: 'ALL_DOCUMENTS_VALID',
      category: 'ACHIEVEMENT',
      title: 'All Documents Valid',
      description: 'All your documents are up to date',
      condition: { type: 'ALL_DOCUMENTS_VALID' },
    },
    {
      code: 'STREAK_7',
      category: 'ACHIEVEMENT',
      title: '7 Day Streak',
      description: 'You have been active for 7 days in a row',
      condition: { type: 'ACTIVITY_STREAK', value: 7 },
    },
    {
      code: 'STREAK_30',
      category: 'ACHIEVEMENT',
      title: '30 Day Streak',
      description: 'You have been active for 30 days in a row',
      condition: { type: 'ACTIVITY_STREAK', value: 30 },
    },
    {
      code: 'FIRST_INVITE',
      category: 'ACHIEVEMENT',
      title: 'First Invite',
      description: 'You invited someone to your workspace',
      condition: { type: 'INVITE_COUNT', value: 1 },
    },
    {
      code: 'FIRST_SHARED_WORKSPACE',
      category: 'ACHIEVEMENT',
      title: 'First Shared Workspace',
      description: 'You created your first shared workspace',
      condition: { type: 'SHARED_WORKSPACE_COUNT', value: 1 },
    },
    {
      code: 'VEHICLE_SOLD',
      category: 'ACHIEVEMENT',
      title: 'Vehicle Sold',
      description: 'You sold your vehicle',
      condition: { type: 'EVENT_COUNT', value: 1, eventType: 'SALE' },
    },
    {
      code: 'NEW_VEHICLE',
      category: 'ACHIEVEMENT',
      title: 'New Vehicle',
      description: 'You added a new vehicle',
      condition: { type: 'VEHICLE_COUNT', value: 2 },
    },
  ];

  for (const milestone of milestones) {
    await prisma.milestoneDefinition.upsert({
      where: { code: milestone.code },
      update: {},
      create: milestone,
    });
  }

  logger.log(`✅ Seeded ${milestones.length} milestone definitions`);
}

main()
  .catch((e) => {
    logger.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
