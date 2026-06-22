import { VehicleConstraints } from '@common/validation';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateVehicleSpecsDto {
  @IsOptional()
  @IsString()
  declare engineCode?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(VehicleConstraints.ENGINE_POWER_HP_MAX)
  declare enginePowerHp?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(VehicleConstraints.ENGINE_POWER_KW_MAX)
  declare enginePowerKw?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(VehicleConstraints.TORQUE_NM_MAX)
  declare torqueNm?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(VehicleConstraints.CYLINDERS_MAX)
  declare cylindersCount?: number;

  @IsOptional()
  @IsString()
  declare engineLayout?: string;

  @IsOptional()
  @IsBoolean()
  declare turbo?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(VehicleConstraints.GEARS_MAX)
  declare gearsCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(VehicleConstraints.FUEL_TANK_MAX)
  declare fuelTankCapacity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(VehicleConstraints.CONSUMPTION_MAX)
  declare cityConsumption?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(VehicleConstraints.CONSUMPTION_MAX)
  declare highwayConsumption?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(VehicleConstraints.CONSUMPTION_MAX)
  declare combinedConsumption?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(VehicleConstraints.BATTERY_KWH_MAX)
  declare batteryCapacityKwh?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(VehicleConstraints.ELECTRIC_RANGE_MAX)
  declare electricRangeKm?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(VehicleConstraints.ACCELERATION_MAX)
  declare accelerationSec?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(VehicleConstraints.TOP_SPEED_MAX)
  declare topSpeedKmh?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(VehicleConstraints.LENGTH_MAX)
  declare lengthMm?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(VehicleConstraints.WIDTH_MAX)
  declare widthMm?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(VehicleConstraints.HEIGHT_MAX)
  declare heightMm?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(VehicleConstraints.WEIGHT_MAX)
  declare weightKg?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(VehicleConstraints.WHEELBASE_MAX)
  declare wheelbaseMm?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(VehicleConstraints.GROUND_CLEARANCE_MAX)
  declare groundClearanceMm?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(VehicleConstraints.TRUNK_MAX)
  declare trunkVolumeLiters?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(VehicleConstraints.DOORS_MAX)
  declare numberOfDoors?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(VehicleConstraints.SEATS_MAX)
  declare numberOfSeats?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(VehicleConstraints.AIRBAGS_MAX)
  declare airbagsCount?: number;

  @IsOptional()
  @IsString()
  @MaxLength(VehicleConstraints.EURO_STANDARD_MAX)
  declare euroStandard?: string;

  @IsOptional()
  @IsInt()
  @Min(VehicleConstraints.NCAP_MIN)
  @Max(VehicleConstraints.NCAP_MAX)
  declare ncapRating?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(VehicleConstraints.CO2_MAX)
  declare co2EmissionGKm?: number;

  @IsOptional()
  @IsString()
  @MaxLength(VehicleConstraints.TIRE_SIZE_MAX)
  declare tireSizeFront?: string;

  @IsOptional()
  @IsString()
  @MaxLength(VehicleConstraints.TIRE_SIZE_MAX)
  declare tireSizeRear?: string;
}
