import QRCode from "qrcode";

import { auth } from "@/auth";
import { errorResponse, jsonResponse } from "@/lib/api";
import { decodeQrFromBase64 } from "@/lib/qris/decode-image";
import { generateDynamicQris } from "@/lib/qris/generator";
import { parseQrisPayload } from "@/lib/qris/parser";
import { generateSchema } from "@/lib/qris/schemas";
import { consumeRateLimit } from "@/lib/rate-limit";
import { createGenerateEvent, listSources, saveSource } from "@/lib/store";

export const runtime = "nodejs";

function getRequesterKey(request: Request) {
  return request.headers.get("x-forwarded-for") ?? request.headers.get("x-real-ip") ?? "anonymous";
}

export async function POST(request: Request) {
  const session = await auth();
  const rate = await consumeRateLimit({
    key: `generate:${session?.user.id ?? getRequesterKey(request)}`,
    plan: session?.user.plan,
  });

  if (!rate.allowed) {
    return errorResponse("Rate limit tercapai.", 429);
  }

  const body = await request.json().catch(() => null);
  const parsedBody = generateSchema.safeParse(body);

  if (!parsedBody.success) {
    return errorResponse("Payload generate tidak valid.", 400, parsedBody.error.flatten());
  }

  try {
    const basePayload = parsedBody.data.payload ?? (await decodeQrFromBase64(parsedBody.data.qrisBase64!));
    const sourceParsed = parseQrisPayload(basePayload);
    const result = generateDynamicQris({
      payload: basePayload,
      amount: parsedBody.data.amount,
      fee: parsedBody.data.fee,
      notes: parsedBody.data.notes,
    });

    let sourceId: string | null = null;

    if (session?.user.id && parsedBody.data.persist) {
      const existingSource = (await listSources(session.user.id)).find((item) => item.payload === basePayload);
      sourceId = existingSource?.id ?? null;

      if (!sourceId) {
        const saved = await saveSource({
          ownerId: session.user.id,
          label: parsedBody.data.label ?? sourceParsed.merchant.name,
          payload: basePayload,
        });
        sourceId = saved.id;
      }
    }

    const event = await createGenerateEvent({
      ownerId: session?.user.id ?? null,
      sourceId,
      merchantName: result.parsed.merchant.name,
      amount: parsedBody.data.amount,
      total: result.total,
      payload: result.payload,
      feeType: parsedBody.data.fee?.type,
      feeValue: parsedBody.data.fee?.value,
      notes: parsedBody.data.notes,
      channel: parsedBody.data.channel,
    });

    const [qrPngDataUrl, qrSvg] = await Promise.all([
      QRCode.toDataURL(result.payload, {
        width: 640,
        margin: 1,
        errorCorrectionLevel: "H",
      }),
      QRCode.toString(result.payload, {
        type: "svg",
        errorCorrectionLevel: "H",
        margin: 1,
      }),
    ]);

    return jsonResponse({
      success: true,
      id: event.id,
      sourceId,
      payload: result.payload,
      amount: parsedBody.data.amount,
      total: result.total,
      merchant: result.parsed.merchant,
      qrPngDataUrl,
      qrSvg,
      valid: result.parsed.valid,
      mockScanReady: true,
    });
  } catch (error) {
    return errorResponse(error instanceof Error ? error.message : "Gagal generate QRIS dinamis.", 422);
  }
}
