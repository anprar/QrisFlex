import { jsonResponse } from "@/lib/api";

export const runtime = "edge";

export async function GET() {
  return jsonResponse({
    success: true,
    service: "qrisflex",
    timestamp: new Date().toISOString(),
  });
}
