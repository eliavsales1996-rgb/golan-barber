"use server";

import { prisma } from "./prisma";
import { revalidatePath } from "next/cache";
import webpush from "web-push";

let vapidReady = false;
try {
  const subject = process.env.VAPID_SUBJECT;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  if (subject && pub && priv) {
    webpush.setVapidDetails(subject, pub, priv);
    vapidReady = true;
  } else {
    console.warn("[Push] VAPID env vars missing — push notifications disabled");
  }
} catch (err) {
  console.error("[Push] VAPID init failed:", err);
}

async function sendPush(pushSubscription: string | null, title: string, body: string) {
  if (!pushSubscription || !vapidReady) return;
  try {
    await webpush.sendNotification(
      JSON.parse(pushSubscription),
      JSON.stringify({ title, body })
    );
  } catch (err) {
    console.error("[Push] send failed:", err);
  }
}

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
  pushSubscription?: string;
}) {
  try {
    const bookingDate = new Date(data.date + "T00:00:00.000Z");

    const dayOff = await prisma.dayOff.findFirst({ where: { date: bookingDate } });
    if (dayOff) {
      return { success: false, error: "הספר לא עובד ביום זה" };
    }

    await prisma.booking.create({
      data: {
        customerName: data.customerName,
        customerPhone: data.customerPhone,
        date: bookingDate,
        timeSlot: data.timeSlot,
        status: "PENDING",
        pushSubscription: data.pushSubscription ?? null,
      },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Booking error:", error);
    return { success: false, error: "Failed to create booking" };
  }
}

export async function approveBooking(id: string) {
  try {
    const booking = await prisma.booking.update({
      where: { id },
      data: { status: "APPROVED" },
    });
    await sendPush(
      booking.pushSubscription,
      "✅ התור אושר!",
      `שלום ${booking.customerName}! התור שלך ב-${booking.timeSlot} אושר על ידי גולן ✂️`
    );
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false };
  }
}

export async function rejectBooking(id: string) {
  try {
    const booking = await prisma.booking.update({
      where: { id },
      data: { status: "REJECTED" },
    });
    await sendPush(
      booking.pushSubscription,
      "❌ התור נדחה",
      `שלום ${booking.customerName}, לצערנו התור שלך ב-${booking.timeSlot} נדחה. ניתן להזמין תור חדש באתר.`
    );
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
  const start = new Date(dateStr + "T00:00:00.000Z");
  const end = new Date(dateStr + "T23:59:59.999Z");

  const bookings = await prisma.booking.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: { timeSlot: "asc" },
  });

  return bookings.map((b) => ({
    id: b.id,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    date: b.date.toISOString(),
    timeSlot: b.timeSlot,
    status: b.status,
    createdAt: b.createdAt.toISOString(),
  }));
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
  const [bookings, blockedHoursRows] = await Promise.all([
    getBookingsForDate(dateStr),
    prisma.blockedHours.findMany({
      where: { date: new Date(dateStr + "T00:00:00.000Z") },
    }),
  ]);

  const interval = 45;
  const slots = [];
  let current = new Date(`${dateStr}T09:30:00`);
  const end = new Date(`${dateStr}T20:31:00`);

  while (current < end) {
    const hours = current.getHours().toString().padStart(2, "0");
    const minutes = current.getMinutes().toString().padStart(2, "0");
    const timeStr = `${hours}:${minutes}`;

    const isTaken = bookings.some(
      (b: any) => b.timeSlot === timeStr && b.status !== "REJECTED" && b.status !== "CANCELLED"
    );
    const isBlocked = blockedHoursRows.some(
      (bh) => timeStr >= bh.startTime && timeStr < bh.endTime
    );

    slots.push({ time: timeStr, available: !isTaken && !isBlocked });
    current = new Date(current.getTime() + interval * 60000);
  }

  return slots;
}

export async function addBlockedHours(
  dateStr: string,
  startTime: string,
  endTime: string,
  reason?: string
) {
  try {
    await prisma.blockedHours.create({
      data: {
        date: new Date(dateStr + "T00:00:00.000Z"),
        startTime,
        endTime,
        reason: reason || null,
      },
    });
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    console.error("[addBlockedHours] error:", error);
    return { success: false, error: "שגיאה בחסימת השעות" };
  }
}

export async function getBlockedHours() {
  const hours = await prisma.blockedHours.findMany({
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });
  return hours.map((h) => ({
    id: h.id,
    date: h.date.toISOString().split("T")[0],
    startTime: h.startTime,
    endTime: h.endTime,
    reason: h.reason ?? null,
  }));
}

export async function deleteBlockedHours(id: string) {
  try {
    await prisma.blockedHours.delete({ where: { id } });
    revalidatePath("/admin");
    revalidatePath("/");
    return { success: true };
  } catch {
    return { success: false };
  }
}
