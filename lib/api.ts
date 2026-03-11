import { NextResponse } from "next/server";

export const widgetCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-QrisFlex-Signature",
};

export function jsonResponse(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function errorResponse(message: string, status = 400, details?: unknown) {
  return NextResponse.json(
    {
      success: false,
      message,
      details,
    },
    { status },
  );
}

export function handleOptions() {
  return new NextResponse(null, {
    status: 204,
    headers: widgetCorsHeaders,
  });
}
