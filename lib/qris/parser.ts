import { appendCrc, computeCrc16, stripTrailingCrc } from "@/lib/qris/crc";
import { composeTlv, getNode, parseTlv, TLVNode } from "@/lib/qris/tlv";

export interface MerchantInfo {
  name: string;
  city: string;
  country: string;
  merchantId: string;
  bank: string;
  mcc: string;
  currency: string;
}

export interface ParsedQrisPayload {
  payload: string;
  valid: boolean;
  crc: {
    expected: string;
    actual: string;
  };
  isDynamic: boolean;
  amount?: number;
  fee?: {
    type: "rp" | "percent";
    value: number;
  };
  merchant: MerchantInfo;
  tags: TLVNode[];
}

function prettifyBank(value: string) {
  return value.replace(/^ID\.CO\./, "").replace(/\./g, " ").trim() || "QRIS";
}

function extractMerchantAccount(tags: TLVNode[]) {
  return tags.find((tag) => {
    const number = Number(tag.id);
    return number >= 26 && number <= 51;
  });
}

function parseMerchant(tags: TLVNode[]): MerchantInfo {
  const merchantTemplate = extractMerchantAccount(tags);
  const nested = merchantTemplate?.children ?? [];
  const gui = nested.find((child) => child.id === "00")?.value ?? "ID.CO.QRIS.WWW";

  return {
    name: getNode(tags, "59")?.value ?? "Merchant QRIS",
    city: getNode(tags, "60")?.value ?? "INDONESIA",
    country: getNode(tags, "58")?.value ?? "ID",
    merchantId:
      nested.find((child) => ["01", "02", "03"].includes(child.id))?.value ??
      "UNKNOWN-MID",
    bank: prettifyBank(gui),
    mcc: getNode(tags, "52")?.value ?? "0000",
    currency: getNode(tags, "53")?.value ?? "360",
  };
}

export function validateQrisPayload(payload: string) {
  const stripped = stripTrailingCrc(payload);
  const expectedSeed = `${stripped}6304`;
  const expected = computeCrc16(expectedSeed);
  const actual = payload.slice(-4).toUpperCase();

  return {
    valid: payload.endsWith(expected),
    expected,
    actual,
  };
}

export function parseQrisPayload(payload: string): ParsedQrisPayload {
  if (!payload || payload.length < 16) {
    throw new Error("Payload QRIS kosong atau terlalu pendek.");
  }

  const tags = parseTlv(payload);
  const crc = validateQrisPayload(payload);
  const feeIndicator = getNode(tags, "55")?.value;

  let fee: ParsedQrisPayload["fee"];

  if (feeIndicator === "02") {
    fee = {
      type: "rp",
      value: Number(getNode(tags, "56")?.value ?? 0),
    };
  }

  if (feeIndicator === "03") {
    fee = {
      type: "percent",
      value: Number(getNode(tags, "57")?.value ?? 0),
    };
  }

  return {
    payload,
    valid: crc.valid,
    crc,
    isDynamic: getNode(tags, "01")?.value === "12",
    amount: getNode(tags, "54") ? Number(getNode(tags, "54")?.value ?? 0) : undefined,
    fee,
    merchant: parseMerchant(tags),
    tags,
  };
}

export function createStaticSamplePayload(input: {
  merchantName: string;
  city: string;
  merchantId: string;
  bankGui?: string;
  reference?: string;
}) {
  const accountInfo = composeTlv([
    { id: "00", value: input.bankGui ?? "ID.CO.QRIS.WWW" },
    { id: "01", value: input.merchantId },
  ]);

  const additional = composeTlv([{ id: "08", value: input.reference ?? input.merchantId.slice(-6) }]);

  return appendCrc(
    composeTlv([
      { id: "00", value: "01" },
      { id: "01", value: "11" },
      { id: "26", value: accountInfo },
      { id: "52", value: "5812" },
      { id: "53", value: "360" },
      { id: "58", value: "ID" },
      { id: "59", value: input.merchantName.slice(0, 25) },
      { id: "60", value: input.city.slice(0, 15) },
      { id: "62", value: additional },
    ]),
  );
}
