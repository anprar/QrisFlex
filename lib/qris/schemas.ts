import { z } from "zod";

export const feeSchema = z.object({
  type: z.enum(["rp", "percent"]),
  value: z.coerce.number().positive(),
});

export const generateSchema = z
  .object({
    qrisBase64: z.string().optional(),
    payload: z.string().optional(),
    amount: z.coerce.number().positive(),
    fee: feeSchema.optional(),
    notes: z.string().max(25).optional(),
    persist: z.boolean().optional(),
    label: z.string().max(40).optional(),
    channel: z.enum(["web", "api", "widget", "offline"]).default("web"),
  })
  .refine((value) => Boolean(value.qrisBase64 || value.payload), {
    message: "qrisBase64 atau payload wajib diisi.",
    path: ["qrisBase64"],
  });

export const decodeSchema = z.object({
  imageBase64: z.string().min(32),
});

export const offlineSyncSchema = z.object({
  items: z.array(
    z.object({
      payload: z.string().min(16),
      amount: z.number().positive(),
      total: z.number().positive(),
      merchantName: z.string(),
      channel: z.enum(["offline", "web", "widget"]).default("offline"),
      notes: z.string().optional(),
      createdAt: z.string(),
    }),
  ),
});

export const webhookSchema = z.object({
  event: z.enum(["payment.confirmed", "payment.pending", "payment.failed"]),
  referenceId: z.string().min(4),
  amount: z.number().positive(),
  payload: z.record(z.string(), z.unknown()).default({}),
  paidAt: z.string().optional(),
});
