import {
  Charge,
  Document,
  Expense,
  Purchase,
  Refuel,
  Sale,
  Service,
  TireChange,
  Trip,
} from '@prisma/client';

import { TimelineEventWithRelations } from '../types';

// ─── Detail mappers ───────────────────────────────────────────────────────────

const mapRefuelDetails = (refuel: Refuel) => {
  return {
    liters: refuel.liters.toString(),
    pricePerLiter: refuel.pricePerLiter.toString(),
    fuelType: refuel.fuelType,
    isFullTank: refuel.isFullTank,
  };
};

const mapChargeDetails = (charge: Charge) => {
  return {
    kWh: charge.kWh.toString(),
    pricePerKWh: charge.pricePerKWh.toString(),
    chargeType: charge.chargeType,
    chargerNetwork: charge.chargerNetwork,
    batteryBefore: charge.batteryBefore,
    batteryAfter: charge.batteryAfter,
  };
};

const mapServiceDetails = (service: Service) => {
  return {
    category: service.category,
    works: service.works,
    parts: service.parts,
    maintenanceIntervalId: service.maintenanceIntervalId,
  };
};

const mapDocumentDetails = (document: Document) => {
  return {
    documentType: document.type,
    documentNumber: document.documentNumber,
    issuedBy: document.issuedBy,
    issueDate: document.issueDate,
    expireDate: document.expireDate,
  };
};

const mapExpenseDetails = (expense: Expense) => {
  return {
    expenseCategory: expense.category,
  };
};

const mapTireChangeDetails = (tireChange: TireChange) => {
  return {
    tireId: tireChange.tireId,
    installedMileage: tireChange.installedMileage,
    removedMileage: tireChange.removedMileage,
    removedDate: tireChange.removedDate,
  };
};

const mapTripDetails = (trip: Trip) => {
  return {
    startMileage: trip.startMileage,
    endMileage: trip.endMileage,
    startLocation: trip.startLocation,
    endLocation: trip.endLocation,
    distanceKm: trip.distanceKm.toString(),
    purpose: trip.purpose,
  };
};

const mapPurchaseDetails = (purchase: Purchase) => {
  return {
    purchasedFrom: purchase.purchasedFrom,
    country: purchase.country,
  };
};

const mapSaleDetails = (sale: Sale) => {
  return {
    soldTo: sale.soldTo,
  };
};

// ─── Details resolver ─────────────────────────────────────────────────────────

const resolveDetails = (event: TimelineEventWithRelations): Record<string, unknown> | null => {
  switch (event.type) {
    case 'REFUEL':
      return event.refuel ? mapRefuelDetails(event.refuel) : null;
    case 'CHARGE':
      return event.charge ? mapChargeDetails(event.charge) : null;
    case 'SERVICE':
      return event.service ? mapServiceDetails(event.service) : null;
    case 'DOCUMENT':
      return event.document ? mapDocumentDetails(event.document) : null;
    case 'EXPENSE':
      return event.expense ? mapExpenseDetails(event.expense) : null;
    case 'TIRE_CHANGE':
      return event.tireChange ? mapTireChangeDetails(event.tireChange) : null;
    case 'TRIP':
      return event.trip ? mapTripDetails(event.trip) : null;
    case 'PURCHASE':
      return event.purchase ? mapPurchaseDetails(event.purchase) : null;
    case 'SALE':
      return event.sale ? mapSaleDetails(event.sale) : null;
    default:
      return null;
  }
};

// ─── Public mapper ────────────────────────────────────────────────────────────

export const mapTimelineEvent = (event: TimelineEventWithRelations) => {
  return {
    id: event.id,
    vehicleId: event.vehicleId,
    type: event.type,
    title: event.title,
    eventDate: event.eventDate,
    mileage: event.mileage,
    cost: event.cost?.toString() ?? null,
    description: event.description,
    serviceStation: event.serviceStation
      ? {
          id: event.serviceStation.id,
          name: event.serviceStation.name,
          type: event.serviceStation.type,
        }
      : null,
    details: resolveDetails(event),
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  };
};
