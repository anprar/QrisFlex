import { auth } from "@/auth";
import { errorResponse, jsonResponse } from "@/lib/api";
import { getTimeseries } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const session = await auth();

  if (!session?.user.id) {
    return errorResponse("Login dibutuhkan.", 401);
  }

  return jsonResponse(await getTimeseries(session.user.id));
}
