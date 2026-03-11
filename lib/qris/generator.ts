import { appendCrc, stripTrailingCrc } from "@/lib/qris/crc";
import { parseQrisPayload } from "@/lib/qris/parser";
import { composeTlv, getNode, parseTlv, removeNode, TLVNode, upsertNode } from "@/lib/qris/tlv";
import { formatAmountValue } from "@/lib/utils";

export interface FeeInput {
  type: "rp" | "percent";
  value: number;
}

export interface GenerateDynamicInput {
  payload: string;
  amount: number;
  fee?: FeeInput;
  notes?: string;
}

export interface GenerateDynamicResult {
  payload: string;
  amount: number;
  total: number;
  parsed: ReturnType<typeof parseQrisPayload>;
}

function buildAdditionalDataField(nodes: TLVNode[], notes?: string) {
  const additional = getNode(nodes, "62");
  const children = additional?.children ? [...additional.children] : [];
  const filtered = children.filter((child) => child.id !== "08");

  if (notes) {
    filtered.push({ id: "08", length: notes.length, value: notes.slice(0, 25) });
  }

  if (filtered.length === 0) {
    return removeNode(nodes, "62");
  }

  return upsertNode(nodes, "62", composeTlv(filtered));
}

function calculateTotal(amount: number, fee?: FeeInput) {
  if (!fee) {
    return amount;
  }

  if (fee.type === "rp") {
    return amount + fee.value;
  }

  return amount + amount * (fee.value / 100);
}

export function generateDynamicQris({ payload, amount, fee, notes }: GenerateDynamicInput): GenerateDynamicResult {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Nominal harus lebih besar dari 0.");
  }

  if (fee && (!Number.isFinite(fee.value) || fee.value <= 0)) {
    throw new Error("Fee harus lebih besar dari 0.");
  }

  const baseTags = parseTlv(stripTrailingCrc(payload));
  let nextTags = removeNode(baseTags, "63");

  nextTags = upsertNode(nextTags, "01", "12");
  nextTags = upsertNode(nextTags, "54", formatAmountValue(amount));
  nextTags = removeNode(nextTags, "55");
  nextTags = removeNode(nextTags, "56");
  nextTags = removeNode(nextTags, "57");

  if (fee?.type === "rp") {
    nextTags = upsertNode(nextTags, "55", "02");
    nextTags = upsertNode(nextTags, "56", formatAmountValue(fee.value));
  }

  if (fee?.type === "percent") {
    nextTags = upsertNode(nextTags, "55", "03");
    nextTags = upsertNode(nextTags, "57", formatAmountValue(fee.value));
  }

  nextTags = buildAdditionalDataField(nextTags, notes);

  const generated = appendCrc(composeTlv(nextTags));

  return {
    payload: generated,
    amount,
    total: Number(calculateTotal(amount, fee).toFixed(0)),
    parsed: parseQrisPayload(generated),
  };
}
