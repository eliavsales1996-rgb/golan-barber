// src/lib/reminders.ts

import { Booking } from './bookings';

export const sendReminder = async (booking: Booking) => {
  console.log(`[Reminder Service] Sending WhatsApp/SMS to ${booking.customerPhone}: "היי ${booking.customerName}, תזכורת לתור שלך ב-${booking.time}!"`);
  
  // Simulated delay
  return new Promise(resolve => setTimeout(resolve, 800));
};
