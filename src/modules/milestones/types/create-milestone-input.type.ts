export interface CreateMilestoneInput {
  userId: string;
  vehicleId: string;
  milestoneDefinitionId: string;
  value: number;
  mileage: number;
  achievedAt: Date;
}
