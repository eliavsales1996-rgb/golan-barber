# Five New Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add waitlist push notifications, client self-cancellation, barber push on new booking, hour-level day blocking, and adjusted slot times (09:30–20:00) to the Golan Barber booking app.

**Architecture:** All business logic lives in `src/lib/actions.ts` as Next.js server actions. Schema changes are handled via Prisma migrations against Supabase PostgreSQL. The two UI files (`src/app/page.tsx` and `src/app/admin/page.tsx`) receive new sections without restructuring existing code.

**Tech Stack:** Next.js App Router, Prisma 6 + PostgreSQL (Supabase), web-push, Tailwind CSS 4, React 19 server actions.

---

## File Map

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Add `BlockedHours` model; add `barberPushSubscription` to `StoreSettings`; add `pushSubscription` to `Waitlist` |
| `src/lib/actions.ts` | Change slot times; add blocked-hours actions; add barber push; add waitlist notify helper; modify `rejectBooking`/`cancelBooking`; add customer cancel actions |
| `src/app/admin/page.tsx` | Add blocked-hours section; add barber subscription button |
| `src/app/page.tsx` | Add push step to waitlist form; add "הזמנות שלי" panel |

---

## Task 1: Change slot times to 09:30–20:00

**Files:**
- Modify: `src/lib/actions.ts` (lines 228–245, `getAvailableSlots`)

- [ ] **Step 1: Edit `getAvailableSlots` in `src/lib/actions.ts`**

Replace the current function (lines 228–245) with:

```typescript
export async function getAvailableSlots(dateStr: string) {
  const bookings = await getBookingsForDate(dateStr);
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
    slots.push({ time: timeStr, available: !isTaken });
    current = new Date(current.getTime() + interval * 60000);
  }

  return slots;
}
```

> Note: end is `T20:31:00` so the last accepted slot is 20:00 (next would be 20:45 which exceeds 20:30). Also added `CANCELLED` to the taken-check since the new feature adds that status.

- [ ] **Step 2: Start dev server and verify**

```bash
npm run dev
```

Open `http://localhost:3000`, pick today's date, confirm the time slots start at `09:30` and the last slot shown is `20:00`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions.ts
git commit -m "feat: change slot times to 09:30–20:00 (45-min intervals)"
```

---

## Task 2: Schema migration — BlockedHours + barberPushSubscription + Waitlist pushSubscription

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: Update `prisma/schema.prisma`**

Add after the `DayOff` model (after line 35):

```prisma
model BlockedHours {
  id        String   @id @default(cuid())
  date      DateTime
  startTime String
  endTime   String
  reason    String?
  createdAt DateTime @default(now())
}
```

Change `StoreSettings` to add the new field:

```prisma
model StoreSettings {
  id                     String   @id @default(cuid())
  message                String
  isActive               Boolean  @default(false)
  barberPushSubscription String?
  updatedAt              DateTime @updatedAt
}
```

Change `Waitlist` to add the new field:

```prisma
model Waitlist {
  id               String   @id @default(cuid())
  customerName     String
  phoneNumber      String
  requestedDate    String
  pushSubscription String?
  createdAt        DateTime @default(now())
}
```

- [ ] **Step 2: Push schema to database**

```bash
npx prisma db push
```

Expected output: `Your database is now in sync with your Prisma schema.`

- [ ] **Step 3: Regenerate Prisma client**

```bash
npx prisma generate
```

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma
git commit -m "feat: add BlockedHours model, barberPushSubscription, Waitlist.pushSubscription"
```

---

## Task 3: Feature 4 — Blocked hours server actions + slot filtering

**Files:**
- Modify: `src/lib/actions.ts`

- [ ] **Step 1: Add blocked-hours actions to `src/lib/actions.ts`**

Add these three exported functions at the end of `src/lib/actions.ts`:

```typescript
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
```

- [ ] **Step 2: Update `getAvailableSlots` to filter blocked hours**

Replace the entire `getAvailableSlots` function with:

```typescript
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
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions.ts
git commit -m "feat: add blocked-hours server actions and slot filtering"
```

---

## Task 4: Feature 4 — Admin UI for blocked hours

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Add imports and state to `src/app/admin/page.tsx`**

In the import line (line 4), add `addBlockedHours`, `getBlockedHours`, `deleteBlockedHours` to the destructured imports:

```typescript
import { getBookingsForDate, getAvailableSlots, getDaysOff, addDayOff, deleteDayOff, approveBooking, rejectBooking, cancelBooking, getStoreSettings, saveStoreSettings, getWaitlist, removeFromWaitlist, addBlockedHours, getBlockedHours, deleteBlockedHours } from "@/lib/actions";
```

- [ ] **Step 2: Add state variables for blocked hours (inside `AdminPage` component, after existing state)**

Add after `const [waitlist, setWaitlist] = useState<any[]>([]);` (line 21):

```typescript
const [blockedHours, setBlockedHours] = useState<{ id: string; date: string; startTime: string; endTime: string; reason: string | null }[]>([]);
const [bhDate, setBhDate] = useState(new Date().toISOString().split("T")[0]);
const [bhStart, setBhStart] = useState("14:00");
const [bhEnd, setBhEnd] = useState("16:00");
const [bhReason, setBhReason] = useState("");
const [bhLoading, setBhLoading] = useState(false);
```

- [ ] **Step 3: Add useEffect to load blocked hours (after existing useEffects)**

Add after the `getWaitlist` useEffect:

```typescript
useEffect(() => {
  getBlockedHours().then(setBlockedHours);
}, []);
```

- [ ] **Step 4: Add handler for adding blocked hours**

Add this function after `handleDeleteDayOff`:

```typescript
async function handleAddBlockedHours() {
  if (bhEnd <= bhStart) {
    alert("שעת הסיום חייבת להיות אחרי שעת ההתחלה");
    return;
  }
  setBhLoading(true);
  const result = await addBlockedHours(bhDate, bhStart, bhEnd, bhReason || undefined);
  if (!result.success) alert(result.error || "שגיאה בחסימת השעות");
  const updated = await getBlockedHours();
  setBlockedHours(updated);
  setBhLoading(false);
}
```

- [ ] **Step 5: Add blocked hours section to admin JSX**

Add this section after the closing `</section>` of the "Days Off Management" section (after line 312, before `</>}`):

```tsx
{/* Blocked Hours Management */}
<section className="reveal text-right">
  <label className="text-[10px] uppercase tracking-[0.2em] font-black text-primary/60 ml-2 mb-4 block underline">חסום שעות ביום מסוים</label>

  <div className="bg-white/[0.03] border border-white/[0.08] rounded-[28px] p-6 mb-4 space-y-4">
    <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-black">בחר יום וטווח שעות</p>
    <input
      type="date"
      value={bhDate}
      onChange={(e) => setBhDate(e.target.value)}
      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 px-6 font-bold text-white outline-none focus:border-primary/50 text-right"
    />
    <div className="grid grid-cols-2 gap-3">
      <div className="text-right">
        <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mb-2">משעה</p>
        <input
          type="time"
          value={bhStart}
          onChange={(e) => setBhStart(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 px-4 font-bold text-white outline-none focus:border-primary/50 text-right"
        />
      </div>
      <div className="text-right">
        <p className="text-[9px] text-white/20 font-black uppercase tracking-widest mb-2">עד שעה</p>
        <input
          type="time"
          value={bhEnd}
          onChange={(e) => setBhEnd(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 px-4 font-bold text-white outline-none focus:border-primary/50 text-right"
        />
      </div>
    </div>
    <input
      type="text"
      placeholder="סיבה (אופציונלי)"
      value={bhReason}
      onChange={(e) => setBhReason(e.target.value)}
      className="w-full bg-white/[0.03] border border-white/[0.08] rounded-2xl py-4 px-6 font-bold text-white outline-none focus:border-primary/50 text-right placeholder:text-white/20"
    />
    <button
      onClick={handleAddBlockedHours}
      disabled={bhLoading}
      className="w-full h-12 rounded-2xl font-bold text-sm bg-orange-500/20 border border-orange-500/30 text-orange-400 hover:bg-orange-500/30 transition-all disabled:opacity-40"
    >
      {bhLoading ? "חוסם..." : "חסום שעות אלו"}
    </button>
  </div>

  <div className="space-y-3">
    {blockedHours.length === 0 ? (
      <p className="text-center text-white/20 text-sm py-4">אין שעות חסומות כרגע</p>
    ) : (
      blockedHours.map((h) => (
        <div
          key={h.id}
          className="p-5 rounded-[20px] bg-orange-500/[0.07] border border-orange-500/20 flex items-center justify-between flex-row-reverse"
        >
          <div className="text-right">
            <span className="font-bold text-orange-400 tracking-widest block">{h.date}</span>
            <span className="text-sm text-white/60 block">{h.startTime} – {h.endTime}</span>
            {h.reason && <span className="text-[11px] text-white/40 mt-0.5 block">{h.reason}</span>}
          </div>
          <button
            onClick={async () => {
              await deleteBlockedHours(h.id);
              setBlockedHours((prev) => prev.filter((e) => e.id !== h.id));
            }}
            className="text-[10px] font-black uppercase tracking-widest text-white/40 border border-white/10 px-4 py-2 rounded-xl hover:border-orange-500/40 hover:text-orange-400 transition-all"
          >
            בטל חסימה
          </button>
        </div>
      ))
    )}
  </div>
</section>
```

- [ ] **Step 6: Verify in browser**

Open `http://localhost:3000/admin` (user: גולן, pass: גולן). Go to "תורים" tab, scroll to the new "חסום שעות ביום מסוים" section. Add a block (e.g., today, 13:00–15:00). Then go to the customer page and verify those slots show as unavailable.

- [ ] **Step 7: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: add blocked hours admin UI"
```

---

## Task 5: Feature 3 — Barber push notification on new booking

**Files:**
- Modify: `src/lib/actions.ts`

- [ ] **Step 1: Add `saveBarberPushSubscription` action to `src/lib/actions.ts`**

Add at the end of the file:

```typescript
export async function saveBarberPushSubscription(sub: string) {
  try {
    const existing = await prisma.storeSettings.findFirst();
    if (existing) {
      await prisma.storeSettings.update({
        where: { id: existing.id },
        data: { barberPushSubscription: sub },
      });
    } else {
      await prisma.storeSettings.create({
        data: { message: "", isActive: false, barberPushSubscription: sub },
      });
    }
    return { success: true };
  } catch {
    return { success: false };
  }
}
```

- [ ] **Step 2: Modify `createBooking` to notify the barber**

Replace the entire `createBooking` function with:

```typescript
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

    // Notify barber
    const settings = await prisma.storeSettings.findFirst();
    if (settings?.barberPushSubscription) {
      await sendPush(
        settings.barberPushSubscription,
        "📅 הזמנה חדשה!",
        `${data.customerName} הזמין תור ל-${data.date} בשעה ${data.timeSlot}`
      );
    }

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("Booking error:", error);
    return { success: false, error: "Failed to create booking" };
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/actions.ts
git commit -m "feat: notify barber via push when new booking is created"
```

---

## Task 6: Feature 3 — Admin UI for barber push subscription

**Files:**
- Modify: `src/app/admin/page.tsx`

- [ ] **Step 1: Add import for `saveBarberPushSubscription`**

Add `saveBarberPushSubscription` to the existing import line:

```typescript
import { ..., saveBarberPushSubscription } from "@/lib/actions";
```

- [ ] **Step 2: Add state for barber subscription**

Add after existing state declarations:

```typescript
const [barberSubActive, setBarberSubActive] = useState(false);
```

- [ ] **Step 3: Add barber push button to the announcement section**

Inside the announcement section's `<div className="bg-white/[0.03] border...rounded-[28px] p-6 space-y-4">` (after the save button row), add:

```tsx
{/* Barber push subscription */}
<div className="pt-2 border-t border-white/[0.06] flex items-center justify-between flex-row-reverse">
  <p className="text-[10px] text-white/30 font-black uppercase tracking-widest text-right">
    {barberSubActive ? "✅ מנוי להתראות פעיל" : "התראות על הזמנות חדשות"}
  </p>
  <button
    type="button"
    onClick={async () => {
      if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert("הדפדפן לא תומך בהתראות");
        return;
      }
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { alert("יש לאשר הרשאת התראות"); return; }
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      const sub = existing ?? await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: (() => {
          const base64 = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY! + '='.repeat((4 - process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!.length % 4) % 4)).replace(/-/g, '+').replace(/_/g, '/');
          return Uint8Array.from([...atob(base64)].map(c => c.charCodeAt(0)));
        })(),
      });
      const result = await saveBarberPushSubscription(JSON.stringify(sub));
      if (result.success) setBarberSubActive(true);
    }}
    disabled={barberSubActive}
    className="text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all disabled:opacity-40"
  >
    {barberSubActive ? "פעיל" : "הפעל התראות"}
  </button>
</div>
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:3000/admin`. In the announcement section, find the new "הפעל התראות" button. Click it and grant notification permission. Then open a new tab, go to `http://localhost:3000`, and create a test booking — the admin device should receive a push notification.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: add barber push subscription button in admin"
```

---

## Task 7: Feature 1 — Waitlist push notification helper + actions

**Files:**
- Modify: `src/lib/actions.ts`

- [ ] **Step 1: Add `notifyWaitlistForDate` helper to `src/lib/actions.ts`**

Add this private (non-exported) function right after the existing `sendPush` function (after line 32):

```typescript
async function notifyWaitlistForDate(dateStr: string) {
  const entries = await prisma.waitlist.findMany({
    where: { requestedDate: dateStr, pushSubscription: { not: null } },
  });
  await Promise.all(
    entries.map((e) =>
      sendPush(
        e.pushSubscription,
        "✂️ פנה תור!",
        `תור ל-${dateStr} התפנה אצל גולן ברבר. לחץ להזמנה.`
      )
    )
  );
}
```

- [ ] **Step 2: Update `addToWaitlist` to accept `pushSubscription`**

Replace the existing `addToWaitlist` function with:

```typescript
export async function addToWaitlist(
  customerName: string,
  phoneNumber: string,
  requestedDate: string,
  pushSubscription?: string
) {
  try {
    await prisma.waitlist.create({
      data: { customerName, phoneNumber, requestedDate, pushSubscription: pushSubscription ?? null },
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    console.error("[addToWaitlist] error:", error);
    return { success: false };
  }
}
```

- [ ] **Step 3: Update `rejectBooking` to notify waitlist**

Replace the existing `rejectBooking` function with:

```typescript
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
    const dateStr = booking.date.toISOString().split("T")[0];
    await notifyWaitlistForDate(dateStr);
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false };
  }
}
```

- [ ] **Step 4: Update `cancelBooking` (admin) to notify waitlist**

Replace the existing `cancelBooking` function with:

```typescript
export async function cancelBooking(id: string) {
  try {
    const booking = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
    });
    await sendPush(
      booking.pushSubscription,
      "❌ התור בוטל",
      `שלום ${booking.customerName}, התור שלך ב-${booking.timeSlot} בוטל.`
    );
    const dateStr = booking.date.toISOString().split("T")[0];
    await notifyWaitlistForDate(dateStr);
    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false };
  }
}
```

- [ ] **Step 5: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/actions.ts
git commit -m "feat: notify waitlist via push when booking is rejected or cancelled"
```

---

## Task 8: Feature 1 — Waitlist UI: collect push subscription

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add `waitlistPushSub` state to `page.tsx`**

Add after `const [waitlistDone, setWaitlistDone] = useState(false);` (line 127):

```typescript
const [waitlistPushSub, setWaitlistPushSub] = useState<string | undefined>(undefined);
```

- [ ] **Step 2: Update `addToWaitlist` call to pass the subscription**

Find the `addToWaitlist(waitlistName, waitlistPhone, selectedDate)` call (inside the waitlist button's onClick, around line 478) and replace with:

```typescript
await addToWaitlist(waitlistName, waitlistPhone, selectedDate, waitlistPushSub);
```

- [ ] **Step 3: Add push subscription step to the waitlist form**

In the waitlist form section (after the two `<input>` fields for name and phone, before the submit button), add:

```tsx
{!waitlistPushSub && (
  <button
    type="button"
    onClick={async () => {
      const sub = await subscribeToPush();
      if (sub) setWaitlistPushSub(sub);
    }}
    className="w-full h-10 rounded-xl font-bold text-xs bg-white/[0.03] border border-white/[0.07] text-white/40 hover:border-primary/30 hover:text-primary/60 transition-all"
  >
    🔔 אפשר התראה כשיפנה מקום
  </button>
)}
{waitlistPushSub && (
  <p className="text-[11px] text-primary/60 text-right">✓ תקבל התראה כשיפנה מקום</p>
)}
```

- [ ] **Step 4: Verify in browser**

Open `http://localhost:3000`. Pick a date that's fully booked or blocked. The waitlist panel should appear. Verify the new push subscription button is visible. Click it and confirm it shows the success message.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: collect push subscription when joining waitlist"
```

---

## Task 9: Feature 2 — Customer self-cancellation server actions

**Files:**
- Modify: `src/lib/actions.ts`

- [ ] **Step 1: Add `getBookingsByPhone` and `cancelBookingByCustomer` to `src/lib/actions.ts`**

Add at the end of the file:

```typescript
export async function getBookingsByPhone(phone: string) {
  const bookings = await prisma.booking.findMany({
    where: {
      customerPhone: phone,
      status: { in: ["PENDING", "APPROVED"] },
    },
    orderBy: { date: "asc" },
  });
  return bookings.map((b) => ({
    id: b.id,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    date: b.date.toISOString().split("T")[0],
    timeSlot: b.timeSlot,
    status: b.status,
  }));
}

export async function cancelBookingByCustomer(bookingId: string, phone: string) {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return { success: false, error: "תור לא נמצא" };
    if (booking.customerPhone !== phone) return { success: false, error: "פרטים לא תואמים" };
    if (booking.status !== "PENDING" && booking.status !== "APPROVED") {
      return { success: false, error: "לא ניתן לבטל תור זה" };
    }

    // 3-hour rule: booking.date is midnight UTC, timeSlot is "HH:MM"
    const [slotHours, slotMinutes] = booking.timeSlot.split(":").map(Number);
    const appointmentMs = booking.date.getTime() + (slotHours * 60 + slotMinutes) * 60000;
    const threeHoursMs = 3 * 60 * 60 * 1000;

    if (Date.now() > appointmentMs - threeHoursMs) {
      return { success: false, error: "לא ניתן לבטל פחות מ-3 שעות לפני התספורת" };
    }

    await prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });

    const dateStr = booking.date.toISOString().split("T")[0];
    await notifyWaitlistForDate(dateStr);

    revalidatePath("/admin");
    return { success: true };
  } catch {
    return { success: false, error: "שגיאה בביטול התור" };
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/actions.ts
git commit -m "feat: add getBookingsByPhone and cancelBookingByCustomer server actions"
```

---

## Task 10: Feature 2 — Customer cancel UI

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Add imports and state for the cancel panel**

Add `getBookingsByPhone` and `cancelBookingByCustomer` to the import line (line 4):

```typescript
import { createBooking, getAvailableSlots, getDaysOff, getStoreSettings, addToWaitlist, getBookingsByPhone, cancelBookingByCustomer } from '../lib/actions';
```

Add these state variables after `const step3Ref = useRef<HTMLDivElement>(null);` (line 128):

```typescript
const [showMyBookings, setShowMyBookings] = useState(false);
const [myBookingsPhone, setMyBookingsPhone] = useState("");
const [myBookings, setMyBookings] = useState<any[]>([]);
const [myBookingsLoading, setMyBookingsLoading] = useState(false);
const [myBookingsSearched, setMyBookingsSearched] = useState(false);
const [cancellingId, setCancellingId] = useState<string | null>(null);
```

- [ ] **Step 2: Add "הזמנות שלי" button and panel to `page.tsx`**

Add this block right after the announcement banner section and before the `{/* ── Hero Section ── */}` comment (around line 270):

```tsx
{/* My Bookings Button */}
<div className="w-full px-6 pt-4 z-50 relative flex justify-end">
  <button
    onClick={() => setShowMyBookings((v) => !v)}
    className="text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-white/30 hover:border-primary/30 hover:text-primary/60 transition-all"
  >
    הזמנות שלי
  </button>
</div>

{/* My Bookings Panel */}
{showMyBookings && (
  <div className="w-full px-6 pt-3 z-50 relative max-w-xl mx-auto">
    <div className="bg-white/[0.03] border border-white/[0.08] rounded-[24px] p-6 text-right space-y-4">
      <p className="text-[9px] uppercase tracking-[0.3em] font-black text-primary/50">בדוק / בטל תור קיים</p>
      <div className="flex gap-2">
        <input
          type="tel"
          placeholder="מספר טלפון"
          value={myBookingsPhone}
          onChange={(e) => setMyBookingsPhone(e.target.value)}
          className="flex-1 bg-white/[0.03] border border-white/[0.07] rounded-xl py-3 px-4 text-white outline-none focus:border-primary/45 text-right placeholder:text-white/15 text-sm"
        />
        <button
          onClick={async () => {
            if (!myBookingsPhone) return;
            setMyBookingsLoading(true);
            const results = await getBookingsByPhone(myBookingsPhone);
            setMyBookings(results);
            setMyBookingsSearched(true);
            setMyBookingsLoading(false);
          }}
          disabled={myBookingsLoading || !myBookingsPhone}
          className="px-5 py-3 rounded-xl font-bold text-sm bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20 transition-all disabled:opacity-30"
        >
          {myBookingsLoading ? "..." : "חפש"}
        </button>
      </div>

      {myBookingsSearched && myBookings.length === 0 && (
        <p className="text-white/30 text-sm text-center py-2">לא נמצאו תורים פעילים</p>
      )}

      {myBookings.map((b) => {
        const [slotHours, slotMinutes] = b.timeSlot.split(":").map(Number);
        const appointmentMs = new Date(b.date + "T00:00:00.000Z").getTime() + (slotHours * 60 + slotMinutes) * 60000;
        const canCancel = Date.now() < appointmentMs - 3 * 60 * 60 * 1000;

        return (
          <div key={b.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.07] flex items-center justify-between flex-row-reverse">
            <div className="text-right">
              <p className="text-xs font-black text-primary">{b.timeSlot} · {b.date}</p>
              <p className="text-sm font-bold text-white/80">{b.customerName}</p>
              <p className="text-[10px] text-white/30">{b.status === "APPROVED" ? "מאושר" : "ממתין לאישור"}</p>
            </div>
            <button
              disabled={!canCancel || cancellingId === b.id}
              title={canCancel ? "בטל תור" : "לא ניתן לבטל פחות מ-3 שעות לפני"}
              onClick={async () => {
                if (!canCancel) return;
                setCancellingId(b.id);
                const result = await cancelBookingByCustomer(b.id, myBookingsPhone);
                if (result.success) {
                  setMyBookings((prev) => prev.filter((x) => x.id !== b.id));
                } else {
                  alert(result.error || "שגיאה בביטול");
                }
                setCancellingId(null);
              }}
              className={`text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-xl transition-all ${
                canCancel
                  ? "bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30"
                  : "opacity-25 bg-white/[0.03] border border-white/10 text-white/30 cursor-not-allowed"
              }`}
            >
              {cancellingId === b.id ? "מבטל..." : "בטל תור"}
            </button>
          </div>
        );
      })}
    </div>
  </div>
)}
```

- [ ] **Step 3: Verify in browser**

Open `http://localhost:3000`. A small "הזמנות שלי" button should appear in the top right. Click it, enter a phone number that has a booking, click "חפש", and verify the booking appears. For a booking more than 3 hours away, the cancel button should be active. For a booking within 3 hours, the button should be disabled/greyed out.

- [ ] **Step 4: TypeScript check**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add customer self-cancellation panel (הזמנות שלי)"
```

---

## Final Verification

- [ ] **Run full dev build**

```bash
npm run build
```

Expected: build succeeds with no errors (warnings are acceptable).

- [ ] **Manual smoke test checklist**
  1. Slot times start at 09:30 and last at 20:00 ✓
  2. Blocking 13:00–15:00 on a date makes those slots unavailable ✓
  3. Creating a booking sends a push to the barber's device (if subscribed) ✓
  4. Rejecting/cancelling a booking in admin sends push to waitlist members ✓
  5. Customer can find their booking by phone and cancel (if > 3h before) ✓
  6. Customer cannot cancel within 3h — button is disabled ✓

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat: complete five-feature implementation for Golan Barber"
```
