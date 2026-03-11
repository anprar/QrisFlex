import { auth } from "@/auth";
import { errorResponse, jsonResponse } from "@/lib/api";
import { getAnalyticsOverview } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();

  if (!session?.user.id) {
    return errorResponse("Login dibutuhkan.", 401);
  }

  return jsonResponse(await getAnalyticsOverview(session.user.id));
}
