# Design: Five New Features — Golan Barber App
**Date:** 2026-04-21

---

## 1. Push Notification to Waitlist When Slot Opens

**Schema change:** Add `pushSubscription String?` to the `Waitlist` model.

**Subscription flow:** When a customer joins the waitlist, they see an "Enable Notifications" button (same UI pattern as the regular booking flow). The push subscription JSON is saved alongside their waitlist record.

**Trigger:** Whenever a booking transitions to CANCELLED or REJECTED — by the barber in the admin panel OR by the customer self-cancelling (Feature 2) — the server checks for waitlist entries matching that date. It sends a push notification to every waitlist entry that has a stored `pushSubscription`.

**Notification content:** "פנה תור! — תור ל-[date] התפנה. לחץ להזמנה."

**Edge cases:**
- Waitlist entries with no `pushSubscription` are silently skipped (customer didn't allow notifications).
- Notification is sent per-slot (any opening on that date), not per specific time.

---

## 2. Client Self-Cancellation (up to 3 hours before)

**Entry point:** A "הזמנות שלי" button on the home page opens a slide-in panel or new section.

**Flow:**
1. Customer enters first name + phone number → clicks "חפש".
2. Server action `getBookingsByPhone(phone)` returns PENDING and APPROVED bookings for that phone number.
3. Each booking card shows: date, time, service, status.
4. If the appointment is **more than 3 hours away** → "בטל תור" button is active.
5. If the appointment is **3 hours or less away** → button is disabled with tooltip "לא ניתן לבטל פחות מ-3 שעות לפני התספורת".

**Server action `cancelBookingByCustomer(bookingId, phone)`:**
- Verifies the booking's `customerPhone` matches the provided phone (authorization check).
- Verifies the appointment is > 3 hours from `Date.now()`.
- Sets `status = CANCELLED`.
- Triggers waitlist push notifications for that date (same helper as Feature 1).

---

## 3. Barber Push Notification on New Booking

**Storing the barber's subscription:** A new button "הפעל התראות על הזמנות חדשות" appears in the admin dashboard settings section. Clicking it subscribes the barber's device and stores the subscription JSON in a new `barberPushSubscription String?` field on `StoreSettings`.

**Trigger:** At the end of `createBooking()` in `actions.ts`, after the booking record is created, send a push to the barber's subscription if one is stored.

**Notification content:** "הזמנה חדשה! — [customerName] הזמין תור ל-[date] בשעה [time] ([service])."

**Edge case:** If `barberPushSubscription` is null (not yet set up), skip silently.

---

## 4. Block Specific Hours on Specific Days

**New Prisma model:**
```prisma
model BlockedHours {
  id        String   @id @default(cuid())
  date      DateTime
  startTime String   // e.g. "14:00"
  endTime   String   // e.g. "16:00"
  reason    String?
  createdAt DateTime @default(now())
}
```

**Slot generation logic:** In `getAvailableSlots()`, after filtering out full-day blocks (DayOff), also fetch `BlockedHours` for that date. A slot is marked `available: false` if its time falls within any blocked range (`startTime <= slot < endTime`).

**Admin UI:** New sub-section "חסום שעות" under the day-blocking section:
- Date picker + start time selector + end time selector + optional reason → "חסום" button.
- List of existing hour blocks for upcoming dates, each with a delete button.

---

## 5. Time Slots: 09:30 to 20:30

**Change in `getAvailableSlots()`:**
- First slot: `09:30` (was `08:00`).
- Interval: 45 minutes (unchanged).
- Last slot: the last slot whose start time is ≤ `20:30`.

With 45-minute intervals from 09:30, the generated slots are:
`09:30, 10:15, 11:00, 11:45, 12:30, 13:15, 14:00, 14:45, 15:30, 16:15, 17:00, 17:45, 18:30, 19:15, 20:00`

The next slot (20:45) exceeds 20:30, so the last slot is **20:00**. This is the only file change needed for this feature.

---

## Implementation Order

1. **Feature 5** — smallest change, no schema change, good warm-up.
2. **Feature 4** — new schema model + admin UI + slot logic.
3. **Feature 3** — StoreSettings schema change + admin UI + createBooking trigger.
4. **Feature 1** — Waitlist schema change + UI change + notification trigger helper.
5. **Feature 2** — new server action + customer-facing UI + integrates with Feature 1 trigger.
