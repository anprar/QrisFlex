import { auth } from "@/auth";
import { errorResponse, jsonResponse } from "@/lib/api";
import { offlineSyncSchema } from "@/lib/qris/schemas";
import { listGenerateEvents, syncOfflineEvents } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();

  if (!session?.user.id) {
    return errorResponse("Login dibutuhkan untuk melihat history dashboard.", 401);
  }

  const history = await listGenerateEvents(session.user.id);
  return jsonResponse(history.slice(0, 24));
}

export async function POST(request: Request) {
  const session = await auth();
  const body = await request.json().catch(() => null);
  const parsed = offlineSyncSchema.safeParse(body);

  if (!parsed.success) {
    return errorResponse("Payload sinkronisasi offline tidak valid.", 400, parsed.error.flatten());
  }

  const inserted = await syncOfflineEvents(session?.user.id ?? null, parsed.data.items);

  return jsonResponse({
    success: true,
    inserted: inserted.length,
  });
}
