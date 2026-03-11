import { auth } from "@/auth";
import { errorResponse, jsonResponse } from "@/lib/api";
import { saveEphemeralImage } from "@/lib/blob";
import { decodeQrFromBase64, base64ToBuffer } from "@/lib/qris/decode-image";
import { parseQrisPayload } from "@/lib/qris/parser";
import { decodeSchema } from "@/lib/qris/schemas";
import { consumeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

function getRequesterKey(request: Request) {
  return request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "anonymous";
}

export async function POST(request: Request) {
  const session = await auth();
  const rate = await consumeRateLimit({
    key: `decode:${session?.user.id ?? getRequesterKey(request)}`,
    plan: session?.user.plan,
  });

  if (!rate.allowed) {
    return errorResponse("Rate limit tercapai.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsedBody = decodeSchema.safeParse(body);

  if (!parsedBody.success) {
    return errorResponse("Payload decode tidak valid.", 400, parsedBody.error.flatten());
  }

  try {
    const payload = await decodeQrFromBase64(parsedBody.data.imageBase64);
    const parsed = parseQrisPayload(payload);
    const mime = parsedBody.data.imageBase64.startsWith("data:image/jpeg") ? "image/jpeg" : "image/png";
    const blob = await saveEphemeralImage({
      filename: `qris-${Date.now()}`,
      contentType: mime,
      body: base64ToBuffer(parsedBody.data.imageBase64),
    }).catch(() => null);

    return jsonResponse({
      success: true,
      payload,
      valid: parsed.valid,
      merchant: parsed.merchant,
      blob,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Gagal decode QRIS.", 422);
  }
}
