import QRCode from "qrcode";
import { describe, expect, it } from "vitest";

import { decodeQrFromBuffer } from "@/lib/qris/decode-image";
import { generateDynamicQris } from "@/lib/qris/generator";
import { parseQrisPayload } from "@/lib/qris/parser";
import { sampleQrCatalog } from "@/lib/qris/samples";

describe("qris core", () => {
  it("validates sample payload CRC", () => {
    const parsed = parseQrisPayload(sampleQrCatalog[0].payload);

    expect(parsed.valid).toBe(true);
    expect(parsed.isDynamic).toBe(false);
    expect(parsed.merchant.name).toBe("Kopi Nusantara");
  });

  it("generates dynamic qris with fee", () => {
    const result = generateDynamicQris({
      payload: sampleQrCatalog[0].payload,
      amount: 25000,
      fee: {
        type: "rp",
        value: 500,
      },
      notes: "INV-2026-001",
    });

    expect(result.parsed.valid).toBe(true);
    expect(result.parsed.isDynamic).toBe(true);
    expect(result.total).toBe(25500);
    expect(result.parsed.amount).toBe(25000);
  });

  it("encodes and decodes qr image roundtrip", async () => {
    const result = generateDynamicQris({
      payload: sampleQrCatalog[1].payload,
      amount: 42000,
      fee: {
        type: "percent",
        value: 2,
      },
    });

    const pngBuffer = await QRCode.toBuffer(result.payload, {
      type: "png",
      width: 512,
      errorCorrectionLevel: "H",
      margin: 2,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    });
    const decoded = await decodeQrFromBuffer(pngBuffer);

    expect(decoded).toBe(result.payload);
  });
});
