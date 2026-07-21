import { ReminderResponseDto } from '@modules/reminders';

export const sortRemindersByUrgency = (
  reminders: ReminderResponseDto[],
  currentMileageByVehicleId: Map<string, number>,
): ReminderResponseDto[] => {
  const withDueDate = [...reminders]
    .filter((reminder) => reminder.dueDate !== null)
    .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime());

  const withMileageOnly = [...reminders]
    .filter((reminder) => reminder.dueDate === null && reminder.dueMileage !== null)
    .sort((a, b) => {
      const remainingA = a.dueMileage! - (currentMileageByVehicleId.get(a.vehicleId) ?? 0);
      const remainingB = b.dueMileage! - (currentMileageByVehicleId.get(b.vehicleId) ?? 0);
      return remainingA - remainingB;
    });

  const withoutDueInfo = reminders.filter(
    (reminder) => reminder.dueDate === null && reminder.dueMileage === null,
  );

  return [...withDueDate, ...withMileageOnly, ...withoutDueInfo];
};
