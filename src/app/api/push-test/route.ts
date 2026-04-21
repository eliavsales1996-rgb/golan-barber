import { NextResponse } from "next/server";
import webpush from "web-push";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const result: Record<string, unknown> = {};

  // Check VAPID env vars
  const subject = process.env.VAPID_SUBJECT;
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  result.vapid = { subject: !!subject, pub: !!pub, priv: !!priv };

  if (!subject || !pub || !priv) {
    return NextResponse.json({ ...result, error: "VAPID env vars missing" });
  }

  webpush.setVapidDetails(subject, pub, priv);

  // Get barber subscription
  const settings = await prisma.storeSettings.findFirst();
  result.barberSubExists = !!settings?.barberPushSubscription;
  result.barberSubEndpoint = settings?.barberPushSubscription
    ? JSON.parse(settings.barberPushSubscription).endpoint?.slice(0, 60) + "..."
    : null;

  // Try sending test push to barber
  if (settings?.barberPushSubscription) {
    try {
      await webpush.sendNotification(
        JSON.parse(settings.barberPushSubscription),
        JSON.stringify({ title: "🔔 בדיקת Push", body: "הודעת בדיקה - אם קיבלת אותה Push עובד!" })
      );
      result.barberPushResult = "SUCCESS";
    } catch (err: unknown) {
      const e = err as { statusCode?: number; body?: string; message?: string };
      result.barberPushResult = "FAILED";
      result.barberPushError = {
        statusCode: e.statusCode,
        body: e.body,
        message: e.message,
      };
    }
  }

  return NextResponse.json(result);
}
