"use server";

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";

export async function createBooking(data: {
  customerName: string;
  customerPhone: string;
  date: string;
  timeSlot: string;
}) {
  try {
    const booking = await prisma.booking.create({
      data: {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        date: new Date(data.date),
        timeSlot: data.timeSlot,
      },
    });
    revalidatePath("/admin");
    return { success: true, booking };
  } catch (error) {
    console.error("Booking error:", error);
    return { success: false, error: "Failed to create booking" };
  }
}

export async function getBookingsForDate(dateStr: string) {
  const start = new Date(dateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateStr);
  end.setHours(23, 59, 59, 999);

  return await prisma.booking.findMany({
    where: {
      date: {
        gte: start,
        lte: end,
      },
    },
    orderBy: {
      timeSlot: "asc",
    },
  });
}

export async function getAvailableSlots(dateStr: string) {
  const bookings = await getBookingsForDate(dateStr);
  const interval = 45;
  const slots = [];
  let current = new Date(`${dateStr}T08:00:00`);
  const end = new Date(`${dateStr}T20:00:00`);

  while (current < end) {
    const hours = current.getHours().toString().padStart(2, '0');
    const minutes = current.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    
    const isTaken = bookings.some((b: any) => b.timeSlot === timeStr);
    
    slots.push({
      time: timeStr,
      available: !isTaken,
    });
    
    current = new Date(current.getTime() + interval * 60000);
  }
  
  return slots;
}
