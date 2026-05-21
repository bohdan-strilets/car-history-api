-- Convert fuelType from scalar to array
ALTER TABLE "vehicles" 
  ALTER COLUMN "fuelType" TYPE "FuelType"[] 
  USING ARRAY["fuelType"::"FuelType"];