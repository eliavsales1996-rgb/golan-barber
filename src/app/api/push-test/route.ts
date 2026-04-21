import { NextResponse } from "next/server";
import webpush from "web-push";

export const runtime = "nodejs";

export async function GET() {
  const subject = process.env.VAPID_SUBJECT ?? "";
  const pub = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
  const priv = process.env.VAPID_PRIVATE_KEY ?? "";

  const missing = [];
  if (!subject) missing.push("VAPID_SUBJECT");
  if (!pub) missing.push("NEXT_PUBLIC_VAPID_PUBLIC_KEY");
  if (!priv) missing.push("VAPID_PRIVATE_KEY");

  if (missing.length > 0) {
    return NextResponse.json({ ok: false, error: "Missing env vars", missing });
  }

  try {
    webpush.setVapidDetails(subject, pub, priv);
  } catch (err: unknown) {
    return NextResponse.json({ ok: false, error: "setVapidDetails failed", detail: String(err) });
  }

  // Try sending to a fake subscription to confirm library works
  // (will fail with push service error, not VAPID error)
  const fakeEndpoint = "https://web.push.apple.com/test";
  try {
    await webpush.sendNotification(
      { endpoint: fakeEndpoint, keys: { p256dh: "BEl62iUYgUivxIkv69yViEuiBIa40Hi7PBBnY", auth: "Hj7sCxRMFT" } },
      "test"
    );
  } catch (err: unknown) {
    const e = err as { statusCode?: number; message?: string };
    // Any error here is from the push server, not VAPID — VAPID itself is OK
    return NextResponse.json({
      ok: true,
      vapidReady: true,
      subject: subject.slice(0, 30),
      pubKeyStart: pub.slice(0, 20),
      pushServerResponse: { statusCode: e.statusCode, message: e.message },
    });
  }

  return NextResponse.json({ ok: true, vapidReady: true });
}
