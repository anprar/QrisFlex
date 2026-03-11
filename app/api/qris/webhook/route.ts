import { createHmac, timingSafeEqual } from "node:crypto";

import { auth } from "@/auth";
import { errorResponse, jsonResponse } from "@/lib/api";
import { env } from "@/lib/env";
import { webhookSchema } from "@/lib/qris/schemas";
import { recordWebhookEvent } from "@/lib/store";

export const runtime = "nodejs";

function verifySignature(rawBody: string, signatureHeader: string | null) {
  if (!env.WEBHOOK_SECRET) {
    return true;
  }

  if (!signatureHeader) {
    return false;
  }

  const digest = createHmac("sha256", env.WEBHOOK_SECRET).update(rawBody).digest("hex");
  const normalized = signatureHeader.replace(/^sha256=/, "");

  try {
    return timingSafeEqual(Buffer.from(digest), Buffer.from(normalized));
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const session = await auth();
  const rawBody = await request.text();
  const signatureValid = verifySignature(rawBody, request.headers.get("x-qrisflex-signature"));

  if (!signatureValid) {
    return errorResponse("Signature webhook tidak valid.", 401);
  }

  const body = JSON.parse(rawBody || "{}");
  const parsedBody = webhookSchema.safeParse(body);

  if (!parsedBody.success) {
    return errorResponse("Payload webhook tidak valid.", 400, parsedBody.error.flatten());
  }

  const record = await recordWebhookEvent({
    ownerId: session?.user.id ?? null,
    referenceId: parsedBody.data.referenceId,
    event: parsedBody.data.event,
    amount: parsedBody.data.amount,
    signatureValid,
    payload: parsedBody.data.payload,
  });

  return jsonResponse({
    success: true,
    id: record.id,
    receivedAt: record.createdAt,
  });
}
