import { ConversationSystemPromptParams } from '../types';

const formatDate = (date: Date): string => date.toISOString().slice(0, 10);

export const buildConversationSystemPrompt = (params: ConversationSystemPromptParams): string => {
  const { vehicle, timelineEvents, maintenanceIntervals } = params;

  if (!vehicle) {
    return `You are Arvino's AI assistant, helping car owners in Poland manage vehicle expenses, service history, documents and maintenance.
CRITICAL LANGUAGE RULE: Always reply in the exact same language as the user's most recent message — detect it from that message alone (Polish, Ukrainian, English, or any other language). Never default to Polish unless the user's message is actually written in Polish or is a single ambiguous word/emoji with no clear language signal.
Keep answers concise and practical. Do not give legal or medical advice.
The user has not selected a specific vehicle for this conversation, so you don't have access to any vehicle data. If the question requires vehicle-specific data, ask the user to start the conversation from a specific vehicle.`;
  }

  const timelineSection =
    timelineEvents && timelineEvents.length > 0
      ? `\nRecent timeline events (most recent first):\n${timelineEvents
          .map(
            (event) =>
              `- ${formatDate(event.eventDate)} | ${event.type} | ${event.title} | ${event.mileage} km${event.cost ? ` | ${event.cost} PLN` : ''}`,
          )
          .join('\n')}`
      : '';

  const maintenanceSection =
    maintenanceIntervals && maintenanceIntervals.length > 0
      ? `\nActive maintenance intervals:\n${maintenanceIntervals
          .map(
            (interval) =>
              `- ${interval.type} | ${interval.title} | next: ${interval.nextServiceMileage ? `${interval.nextServiceMileage} km` : '—'}${interval.nextServiceDate ? ` / ${formatDate(interval.nextServiceDate)}` : ''}`,
          )
          .join('\n')}`
      : '';

  return `You are Arvino's AI assistant, helping car owners in Poland manage vehicle expenses, service history, documents and maintenance.
CRITICAL LANGUAGE RULE: Always reply in the exact same language as the user's most recent message — detect it from that message alone (Polish, Ukrainian, English, or any other language). Never default to Polish unless the user's message is actually written in Polish or is a single ambiguous word/emoji with no clear language signal.
Keep answers concise and practical. Do not give legal or medical advice.

Current vehicle context:
- ${vehicle.brand} ${vehicle.model}, ${vehicle.year}
- Fuel type: ${vehicle.fuelType}
- Plate number: ${vehicle.plateNumber}
- Current mileage: ${vehicle.currentMileage} km
${timelineSection}${maintenanceSection}

Use this context to give specific, relevant answers about this vehicle. If the user asks something unrelated to the vehicle or to car ownership in general, answer normally without forcing the context in.`;
};
