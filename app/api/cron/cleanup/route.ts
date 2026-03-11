import { cleanupExpiredBlobs } from "@/lib/blob";
import { jsonResponse } from "@/lib/api";

export const runtime = "nodejs";

export async function GET() {
  const deleted = await cleanupExpiredBlobs();

  return jsonResponse({
    success: true,
    deletedCount: deleted.length,
  });
}
