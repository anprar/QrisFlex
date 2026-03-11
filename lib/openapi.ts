import { getBaseUrl } from "@/lib/utils";
import { sampleQrCatalog } from "@/lib/qris/samples";

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "QrisFlex API",
    version: "1.0.0",
    description:
      "API untuk decode QRIS statis, generate QRIS dinamis, menerima webhook pembayaran, dan menyiapkan widget embed.",
  },
  servers: [{ url: getBaseUrl() }],
  paths: {
    "/api/qris/generate": {
      post: {
        summary: "Generate payload QRIS dinamis",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  qrisBase64: { type: "string" },
                  payload: { type: "string" },
                  amount: { type: "number" },
                  fee: {
                    type: "object",
                    properties: {
                      type: { type: "string", enum: ["rp", "percent"] },
                      value: { type: "number" },
                    },
                  },
                  notes: { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    "/api/qris/decode": {
      post: {
        summary: "Decode QR statis dari PNG/JPG base64",
      },
    },
    "/api/qris/webhook": {
      post: {
        summary: "Terima callback pembayaran manual dengan signature HMAC",
      },
    },
    "/api/widget/{id}": {
      get: {
        summary: "Ambil konfigurasi widget atau snippet iframe",
      },
    },
  },
} as const;

export const apiExamples = {
  curlGenerate: `curl -X POST ${getBaseUrl()}/api/qris/generate \\
  -H "Content-Type: application/json" \\
  -d '{
    "payload": "${sampleQrCatalog[0].payload}",
    "amount": 25000,
    "fee": { "type": "rp", "value": 500 },
    "notes": "Order INV-2026-001"
  }'`,
  curlDecode: `curl -X POST ${getBaseUrl()}/api/qris/decode \\
  -H "Content-Type: application/json" \\
  -d '{
    "imageBase64": "data:image/png;base64,iVBOR..."
  }'`,
  curlWebhook: `curl -X POST ${getBaseUrl()}/api/qris/webhook \\
  -H "Content-Type: application/json" \\
  -H "X-QrisFlex-Signature: sha256=<signature>" \\
  -d '{
    "event": "payment.confirmed",
    "referenceId": "INV-2026-001",
    "amount": 25500,
    "payload": { "status": "paid" }
  }'`,
};
