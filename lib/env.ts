import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXTAUTH_SECRET: z.string().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  KV_REST_API_URL: z.string().optional(),
  KV_REST_API_TOKEN: z.string().optional(),
  POSTGRES_URL: z.string().optional(),
  VERCEL_POSTGRES_URL: z.string().optional(),
  BLOB_READ_WRITE_TOKEN: z.string().optional(),
  WEBHOOK_SECRET: z.string().optional(),
});

export const env = envSchema.parse({
  NODE_ENV: process.env.NODE_ENV,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID,
  AUTH_GOOGLE_SECRET: process.env.AUTH_GOOGLE_SECRET,
  KV_REST_API_URL: process.env.KV_REST_API_URL,
  KV_REST_API_TOKEN: process.env.KV_REST_API_TOKEN,
  POSTGRES_URL: process.env.POSTGRES_URL,
  VERCEL_POSTGRES_URL: process.env.VERCEL_POSTGRES_URL,
  BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
});

export const featureFlags = {
  googleAuth: Boolean(env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET),
  kv: Boolean(env.KV_REST_API_URL && env.KV_REST_API_TOKEN),
  postgres: Boolean(env.POSTGRES_URL || env.VERCEL_POSTGRES_URL),
  blob: Boolean(env.BLOB_READ_WRITE_TOKEN),
};
