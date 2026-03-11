import { jsonResponse } from "@/lib/api";
import { openApiDocument } from "@/lib/openapi";

export const runtime = "edge";

export async function GET() {
  return jsonResponse(openApiDocument);
}
