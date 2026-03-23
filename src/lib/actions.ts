"use server";

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";

export async function getDaysOff() {
  const daysOff = await prisma.dayOff.findMany({ orderBy: { date: "asc" } });
  return daysOff.map((d) => ({
    id: d.id,
    date: d.date.toISOString().split("T")[0],
    reason: d.reason ?? null,
  }));
}

export async function addDayOff(startDateStr: string, endDateStr: string, reason?: string) {
  try {
    // Force UTC midnight to avoid timezone shifts (e.g. "2026-03-25" -> 2026-03-25T00:00:00.000Z)
    const start = new Date(startDateStr + "T00:00:00.000Z");
    const end = new Date(endDateStr + "T00:00:00.000Z");

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
      return { success: false, error: "טווח תאריכים לא תקין" };
    }

    const dates: Date[] = [];
    const current = new Date(start);
    while (current <= end) {
      dates.push(new Date(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }

    // upsert each day: updates reason if date already blocked, creates if not
    await Promise.all(
      dates.map((date) =>
        prisma.dayOff.upsert({
          where: { date },
          update: { reason: reason || null },
          create: { date, reason: reason || null },
        })
      )
    );

    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[addDayOff] error:", error);
    return { success: false, error: "שגיאה בחסימת הימים" };
  }
}

export async function deleteDayOff(id: string) {
  try {
    await prisma.dayOff.delete({ where: { id } });
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function createBooking(data: {
  customerName: string;
  customerPhone: string;
  date: string;
  timeSlot: string;
}) {
  try {
    const dayOff = await prisma.dayOff.findFirst({
      where: { date: new Date(data.date) },
    });
    if (dayOff) {
      return { success: false, error: "הספר לא עובד ביום זה" };
    }

    const booking = await prisma.booking.create({
      data: {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        date: new Date(data.date),
        timeSlot: data.timeSlot,
        status: "PENDING",
      },
    });
    revalidatePath("/admin");
    return { success: true, booking };
  } catch (error) {
    console.error("Booking error:", error);
    return { success: false, error: "Failed to create booking" };
  }
}

export async function approveBooking(id: string) {
  try {
    await prisma.booking.update({ where: { id }, data: { status: "APPROVED" } });
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function rejectBooking(id: string) {
  try {
    await prisma.booking.update({ where: { id }, data: { status: "REJECTED" } });
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function cancelBooking(id: string) {
  return rejectBooking(id);
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

export async function getStoreSettings() {
  return await prisma.storeSettings.findFirst();
}

export async function saveStoreSettings(message: string, isActive: boolean) {
  try {
    const existing = await prisma.storeSettings.findFirst();
    if (existing) {
      await prisma.storeSettings.update({ where: { id: existing.id }, data: { message, isActive } });
    } else {
      await prisma.storeSettings.create({ data: { message, isActive } });
    }
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[saveStoreSettings] error:", error);
    return { success: false };
  }
}

export async function addToWaitlist(customerName: string, phoneNumber: string, requestedDate: string) {
  try {
    await prisma.waitlist.create({ data: { customerName, phoneNumber, requestedDate } });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("[addToWaitlist] error:", error);
    return { success: false };
  }
}

export async function getWaitlist() {
  return await prisma.waitlist.findMany({ orderBy: { createdAt: "asc" } });
}

export async function removeFromWaitlist(id: string) {
  try {
    await prisma.waitlist.delete({ where: { id } });
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false };
  }
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

    // REJECTED bookings free up the slot
    const isTaken = bookings.some((b: any) => b.timeSlot === timeStr && b.status !== "REJECTED");

    slots.push({
      time: timeStr,
      available: !isTaken,
    });

    current = new Date(current.getTime() + interval * 60000);
  }

  return slots;
}
