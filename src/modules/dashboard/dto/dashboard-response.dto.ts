import { ReminderResponseDto } from '@modules/reminders';

import { DashboardExpensesSummaryResponseDto } from './dashboard-expenses-summary-response.dto';
import { DashboardVehicleResponseDto } from './dashboard-vehicle-response.dto';

export class DashboardResponseDto {
  declare vehicles: DashboardVehicleResponseDto[];
  declare expensesSummary: DashboardExpensesSummaryResponseDto;
  declare upcomingReminders: ReminderResponseDto[];
}
