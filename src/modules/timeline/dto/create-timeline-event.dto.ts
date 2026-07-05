import { TimelineConstraints as C } from '@common/validation';
import {
  ChargeType,
  DocumentType,
  ExpenseCategory,
  FuelType,
  PurchaseFrom,
  ServiceCategory,
  SoldTo,
  TimelineType,
  TireChangeType,
  TripPurpose,
} from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsBoolean,
  IsDateString,
  IsDecimal,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

// ─── Nested DTOs ──────────────────────────────────────────────────────────────

export class WorkItemDto {
  @IsString()
  @MinLength(C.WORK_NAME_MIN)
  @MaxLength(C.WORK_NAME_MAX)
  declare name: string;

  @IsDecimal({ decimal_digits: '0,2' })
  declare price: string;

  @IsOptional()
  @IsString()
  @MaxLength(C.WORK_DESCRIPTION_MAX)
  declare description?: string;
}

export class PartItemDto {
  @IsString()
  @MinLength(C.PART_NAME_MIN)
  @MaxLength(C.PART_NAME_MAX)
  declare name: string;

  @IsDecimal({ decimal_digits: '0,2' })
  declare price: string;

  @IsInt()
  @Min(C.PART_QUANTITY_MIN)
  @Max(C.PART_QUANTITY_MAX)
  declare quantity: number;

  @IsOptional()
  @IsString()
  @MaxLength(C.PART_DESCRIPTION_MAX)
  declare description?: string;
}

// ─── Main DTO ─────────────────────────────────────────────────────────────────

export class CreateTimelineEventDto {
  // ─── Shared ───────────────────────────────────────────────────────────────

  @IsEnum(TimelineType)
  declare type: TimelineType;

  @IsString()
  @MinLength(C.TITLE_MIN)
  @MaxLength(C.TITLE_MAX)
  declare title: string;

  @IsDateString()
  declare eventDate: string;

  @IsInt()
  @Min(C.MILEAGE_MIN)
  @Max(C.MILEAGE_MAX)
  declare mileage: number;

  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  declare cost?: string;

  @IsOptional()
  @IsString()
  @MaxLength(C.DESCRIPTION_MAX)
  declare description?: string;

  @IsOptional()
  @IsString()
  declare serviceStationId?: string;

  // ─── REFUEL ───────────────────────────────────────────────────────────────

  @ValidateIf((o) => o.type === TimelineType.REFUEL)
  @IsDecimal({ decimal_digits: '0,2' })
  declare liters?: string;

  @ValidateIf((o) => o.type === TimelineType.REFUEL)
  @IsDecimal({ decimal_digits: '0,3' })
  declare pricePerLiter?: string;

  @ValidateIf((o) => o.type === TimelineType.REFUEL)
  @IsEnum(FuelType)
  declare fuelType?: FuelType;

  @ValidateIf((o) => o.type === TimelineType.REFUEL)
  @IsBoolean()
  declare isFullTank?: boolean;

  // ─── CHARGE ───────────────────────────────────────────────────────────────

  @ValidateIf((o) => o.type === TimelineType.CHARGE)
  @IsDecimal({ decimal_digits: '0,2' })
  declare kWh?: string;

  @ValidateIf((o) => o.type === TimelineType.CHARGE)
  @IsDecimal({ decimal_digits: '0,3' })
  declare pricePerKWh?: string;

  @ValidateIf((o) => o.type === TimelineType.CHARGE)
  @IsEnum(ChargeType)
  declare chargeType?: ChargeType;

  @ValidateIf((o) => o.type === TimelineType.CHARGE)
  @IsOptional()
  @IsString()
  @MaxLength(C.CHARGER_NETWORK_MAX)
  declare chargerNetwork?: string;

  @ValidateIf((o) => o.type === TimelineType.CHARGE)
  @IsOptional()
  @IsInt()
  @Min(C.BATTERY_PERCENT_MIN)
  @Max(C.BATTERY_PERCENT_MAX)
  declare batteryBefore?: number;

  @ValidateIf((o) => o.type === TimelineType.CHARGE)
  @IsOptional()
  @IsInt()
  @Min(C.BATTERY_PERCENT_MIN)
  @Max(C.BATTERY_PERCENT_MAX)
  declare batteryAfter?: number;

  // ─── SERVICE ──────────────────────────────────────────────────────────────

  @ValidateIf((o) => o.type === TimelineType.SERVICE)
  @IsEnum(ServiceCategory)
  declare serviceCategory?: ServiceCategory;

  @ValidateIf((o) => o.type === TimelineType.SERVICE)
  @IsOptional()
  @ValidateNested({ each: true })
  @ArrayMaxSize(C.WORKS_MAX_ITEMS)
  @Type(() => WorkItemDto)
  declare works?: WorkItemDto[];

  @ValidateIf((o) => o.type === TimelineType.SERVICE)
  @IsOptional()
  @ValidateNested({ each: true })
  @ArrayMaxSize(C.PARTS_MAX_ITEMS)
  @Type(() => PartItemDto)
  declare parts?: PartItemDto[];

  // ─── DOCUMENT ─────────────────────────────────────────────────────────────

  @ValidateIf((o) => o.type === TimelineType.DOCUMENT)
  @IsEnum(DocumentType)
  declare documentType?: DocumentType;

  @ValidateIf((o) => o.type === TimelineType.DOCUMENT)
  @IsOptional()
  @IsString()
  @MaxLength(C.DOCUMENT_NUMBER_MAX)
  declare documentNumber?: string;

  @ValidateIf((o) => o.type === TimelineType.DOCUMENT)
  @IsOptional()
  @IsString()
  @MaxLength(C.ISSUED_BY_MAX)
  declare issuedBy?: string;

  @ValidateIf((o) => o.type === TimelineType.DOCUMENT)
  @IsOptional()
  @IsDateString()
  declare issueDate?: string;

  @ValidateIf((o) => o.type === TimelineType.DOCUMENT)
  @IsOptional()
  @IsDateString()
  declare expireDate?: string;

  // ─── EXPENSE ──────────────────────────────────────────────────────────────

  @ValidateIf((o) => o.type === TimelineType.EXPENSE)
  @IsEnum(ExpenseCategory)
  declare expenseCategory?: ExpenseCategory;

  // ─── TIRE_CHANGE ──────────────────────────────────────────────────────────
  @ValidateIf((o) => o.type === TimelineType.TIRE_CHANGE)
  @IsEnum(TireChangeType)
  declare changeType?: TireChangeType;

  @ValidateIf((o) => o.type === TimelineType.TIRE_CHANGE)
  @IsString()
  declare tireId?: string;

  @ValidateIf((o) => o.type === TimelineType.TIRE_CHANGE)
  @IsOptional()
  @IsInt()
  @Min(C.MILEAGE_MIN)
  @Max(C.MILEAGE_MAX)
  declare installedMileage?: number;

  @ValidateIf((o) => o.type === TimelineType.TIRE_CHANGE)
  @IsOptional()
  @IsInt()
  @Min(C.MILEAGE_MIN)
  @Max(C.MILEAGE_MAX)
  declare removedMileage?: number;

  @ValidateIf((o) => o.type === TimelineType.TIRE_CHANGE)
  @IsOptional()
  @IsDateString()
  declare removedDate?: string;

  // ─── TRIP ─────────────────────────────────────────────────────────────────

  @ValidateIf((o) => o.type === TimelineType.TRIP)
  @IsInt()
  @Min(C.MILEAGE_MIN)
  @Max(C.MILEAGE_MAX)
  declare startMileage?: number;

  @ValidateIf((o) => o.type === TimelineType.TRIP)
  @IsInt()
  @Min(C.MILEAGE_MIN)
  @Max(C.MILEAGE_MAX)
  declare endMileage?: number;

  @ValidateIf((o) => o.type === TimelineType.TRIP)
  @IsOptional()
  @IsString()
  @MaxLength(C.START_LOCATION_MAX)
  declare startLocation?: string;

  @ValidateIf((o) => o.type === TimelineType.TRIP)
  @IsOptional()
  @IsString()
  @MaxLength(C.END_LOCATION_MAX)
  declare endLocation?: string;

  @ValidateIf((o) => o.type === TimelineType.TRIP)
  @IsDecimal({ decimal_digits: '0,2' })
  declare distanceKm?: string;

  @ValidateIf((o) => o.type === TimelineType.TRIP)
  @IsEnum(TripPurpose)
  declare purpose?: TripPurpose;

  // ─── PURCHASE ─────────────────────────────────────────────────────────────

  @ValidateIf((o) => o.type === TimelineType.PURCHASE)
  @IsEnum(PurchaseFrom)
  declare purchasedFrom?: PurchaseFrom;

  @ValidateIf((o) => o.type === TimelineType.PURCHASE)
  @IsOptional()
  @IsString()
  @MaxLength(C.COUNTRY_MAX)
  declare country?: string;

  // ─── SALE ─────────────────────────────────────────────────────────────────

  @ValidateIf((o) => o.type === TimelineType.SALE)
  @IsEnum(SoldTo)
  declare soldTo?: SoldTo;
}
