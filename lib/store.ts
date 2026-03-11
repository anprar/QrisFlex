import { kv } from "@vercel/kv";
import { sql } from "@vercel/postgres";

import { featureFlags } from "@/lib/env";
import { parseQrisPayload } from "@/lib/qris/parser";
import { sampleQrCatalog } from "@/lib/qris/samples";

export interface SourceRecord {
  id: string;
  ownerId: string | null;
  label: string;
  payload: string;
  merchantName: string;
  merchantCity: string;
  merchantCountry: string;
  merchantId: string;
  bank: string;
  createdAt: string;
  updatedAt: string;
  usageCount: number;
}

export interface GenerateEventRecord {
  id: string;
  ownerId: string | null;
  sourceId: string | null;
  merchantName: string;
  amount: number;
  total: number;
  payload: string;
  feeType?: "rp" | "percent";
  feeValue?: number;
  notes?: string;
  channel: "web" | "api" | "widget" | "offline";
  webhookStatus: "idle" | "delivered" | "pending";
  scans: number;
  createdAt: string;
}

export interface WidgetConfigRecord {
  id: string;
  ownerId: string | null;
  sourceId: string;
  label: string;
  theme: "emerald" | "amber" | "ocean";
  logoUrl?: string;
  callbackUrl?: string;
  createdAt: string;
}

export interface WebhookRecord {
  id: string;
  ownerId: string | null;
  referenceId: string;
  event: string;
  amount: number;
  signatureValid: boolean;
  payload: Record<string, unknown>;
  createdAt: string;
}

interface MemoryStore {
  sources: SourceRecord[];
  events: GenerateEventRecord[];
  widgets: WidgetConfigRecord[];
  webhooks: WebhookRecord[];
}

const globalForStore = globalThis as typeof globalThis & {
  __qrisflexStore?: MemoryStore;
  __qrisflexSchemaReady?: boolean;
};

function buildSeedStore(): MemoryStore {
  const sources = sampleQrCatalog.map((item, index) => {
    const parsed = parseQrisPayload(item.payload);
    return {
      id: item.id,
      ownerId: "demo@qrisflex.id",
      label: item.label,
      payload: item.payload,
      merchantName: parsed.merchant.name,
      merchantCity: parsed.merchant.city,
      merchantCountry: parsed.merchant.country,
      merchantId: parsed.merchant.merchantId,
      bank: parsed.merchant.bank,
      createdAt: new Date(Date.now() - index * 86_400_000).toISOString(),
      updatedAt: new Date(Date.now() - index * 18_000_000).toISOString(),
      usageCount: 18 + index * 7,
    } satisfies SourceRecord;
  });

  const events: GenerateEventRecord[] = sources.flatMap((source, sourceIndex) =>
    Array.from({ length: 5 }).map((_, index) => ({
      id: crypto.randomUUID(),
      ownerId: "demo@qrisflex.id",
      sourceId: source.id,
      merchantName: source.merchantName,
      amount: 15000 + sourceIndex * 5000 + index * 1000,
      total: 15000 + sourceIndex * 5000 + index * 1000 + 500,
      payload: source.payload,
      feeType: "rp",
      feeValue: 500,
      notes: "Promo komunitas",
      channel: (index % 2 === 0 ? "web" : "widget") as GenerateEventRecord["channel"],
      webhookStatus: (index % 3 === 0 ? "delivered" : "idle") as GenerateEventRecord["webhookStatus"],
      scans: 3 + index,
      createdAt: new Date(Date.now() - (index + sourceIndex) * 86_400_000).toISOString(),
    })),
  );

  const widgets: WidgetConfigRecord[] = sources.map((source, index) => ({
    id: source.id,
    ownerId: source.ownerId,
    sourceId: source.id,
    label: `${source.label} Widget`,
    theme: (["emerald", "amber", "ocean"] as const)[index % 3],
    callbackUrl: "https://example.com/qris/callback",
    createdAt: source.createdAt,
  }));

  return {
    sources,
    events,
    widgets,
    webhooks: [],
  };
}

const memoryStore = globalForStore.__qrisflexStore ??= buildSeedStore();

function toNumber(value: unknown) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

async function ensurePostgresSchema() {
  if (!featureFlags.postgres || globalForStore.__qrisflexSchemaReady) {
    return;
  }

  await sql.query(`
    CREATE TABLE IF NOT EXISTS qris_sources (
      id TEXT PRIMARY KEY,
      owner_id TEXT,
      label TEXT NOT NULL,
      payload TEXT NOT NULL,
      merchant_name TEXT NOT NULL,
      merchant_city TEXT NOT NULL,
      merchant_country TEXT NOT NULL,
      merchant_id TEXT NOT NULL,
      bank TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      usage_count INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS generate_events (
      id TEXT PRIMARY KEY,
      owner_id TEXT,
      source_id TEXT,
      merchant_name TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      total NUMERIC NOT NULL,
      payload TEXT NOT NULL,
      fee_type TEXT,
      fee_value NUMERIC,
      notes TEXT,
      channel TEXT NOT NULL,
      webhook_status TEXT NOT NULL DEFAULT 'idle',
      scans INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS widget_configs (
      id TEXT PRIMARY KEY,
      owner_id TEXT,
      source_id TEXT NOT NULL,
      label TEXT NOT NULL,
      theme TEXT NOT NULL,
      logo_url TEXT,
      callback_url TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS webhook_events (
      id TEXT PRIMARY KEY,
      owner_id TEXT,
      reference_id TEXT NOT NULL,
      event TEXT NOT NULL,
      amount NUMERIC NOT NULL,
      signature_valid BOOLEAN NOT NULL DEFAULT FALSE,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  globalForStore.__qrisflexSchemaReady = true;
}

function mapSourceRow(row: Record<string, unknown>): SourceRecord {
  return {
    id: String(row.id),
    ownerId: row.owner_id ? String(row.owner_id) : null,
    label: String(row.label),
    payload: String(row.payload),
    merchantName: String(row.merchant_name),
    merchantCity: String(row.merchant_city),
    merchantCountry: String(row.merchant_country),
    merchantId: String(row.merchant_id),
    bank: String(row.bank),
    createdAt: new Date(String(row.created_at)).toISOString(),
    updatedAt: new Date(String(row.updated_at)).toISOString(),
    usageCount: toNumber(row.usage_count),
  };
}

function mapEventRow(row: Record<string, unknown>): GenerateEventRecord {
  return {
    id: String(row.id),
    ownerId: row.owner_id ? String(row.owner_id) : null,
    sourceId: row.source_id ? String(row.source_id) : null,
    merchantName: String(row.merchant_name),
    amount: toNumber(row.amount),
    total: toNumber(row.total),
    payload: String(row.payload),
    feeType: row.fee_type ? (String(row.fee_type) as "rp" | "percent") : undefined,
    feeValue: row.fee_value ? toNumber(row.fee_value) : undefined,
    notes: row.notes ? String(row.notes) : undefined,
    channel: String(row.channel) as GenerateEventRecord["channel"],
    webhookStatus: String(row.webhook_status) as GenerateEventRecord["webhookStatus"],
    scans: toNumber(row.scans),
    createdAt: new Date(String(row.created_at)).toISOString(),
  };
}

export async function listSources(ownerId?: string | null) {
  if (!featureFlags.postgres) {
    return memoryStore.sources.filter((source) => !ownerId || source.ownerId === ownerId);
  }

  await ensurePostgresSchema();
  const { rows } = ownerId
    ? await sql`SELECT * FROM qris_sources WHERE owner_id = ${ownerId} ORDER BY updated_at DESC`
    : await sql`SELECT * FROM qris_sources ORDER BY updated_at DESC LIMIT 20`;

  if (rows.length === 0) {
    return ownerId ? memoryStore.sources.filter((source) => source.ownerId === ownerId) : memoryStore.sources;
  }

  return rows.map((row) => mapSourceRow(row));
}

export async function saveSource(input: {
  ownerId?: string | null;
  label: string;
  payload: string;
}) {
  const parsed = parseQrisPayload(input.payload);
  const record: SourceRecord = {
    id: crypto.randomUUID(),
    ownerId: input.ownerId ?? null,
    label: input.label,
    payload: input.payload,
    merchantName: parsed.merchant.name,
    merchantCity: parsed.merchant.city,
    merchantCountry: parsed.merchant.country,
    merchantId: parsed.merchant.merchantId,
    bank: parsed.merchant.bank,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    usageCount: 0,
  };

  if (!featureFlags.postgres) {
    memoryStore.sources.unshift(record);
    return record;
  }

  await ensurePostgresSchema();
  await sql`
    INSERT INTO qris_sources (
      id, owner_id, label, payload, merchant_name, merchant_city, merchant_country, merchant_id, bank, created_at, updated_at, usage_count
    ) VALUES (
      ${record.id}, ${record.ownerId}, ${record.label}, ${record.payload}, ${record.merchantName}, ${record.merchantCity}, ${record.merchantCountry}, ${record.merchantId}, ${record.bank}, ${record.createdAt}, ${record.updatedAt}, ${record.usageCount}
    )
  `;

  return record;
}

export async function createGenerateEvent(input: {
  ownerId?: string | null;
  sourceId?: string | null;
  merchantName: string;
  amount: number;
  total: number;
  payload: string;
  feeType?: "rp" | "percent";
  feeValue?: number;
  notes?: string;
  channel: GenerateEventRecord["channel"];
}) {
  const record: GenerateEventRecord = {
    id: crypto.randomUUID(),
    ownerId: input.ownerId ?? null,
    sourceId: input.sourceId ?? null,
    merchantName: input.merchantName,
    amount: input.amount,
    total: input.total,
    payload: input.payload,
    feeType: input.feeType,
    feeValue: input.feeValue,
    notes: input.notes,
    channel: input.channel,
    webhookStatus: "idle",
    scans: 0,
    createdAt: new Date().toISOString(),
  };

  if (!featureFlags.postgres) {
    memoryStore.events.unshift(record);
    const source = memoryStore.sources.find((item) => item.id === input.sourceId);
    if (source) {
      source.usageCount += 1;
      source.updatedAt = new Date().toISOString();
    }
    return record;
  }

  await ensurePostgresSchema();
  await sql`
    INSERT INTO generate_events (
      id, owner_id, source_id, merchant_name, amount, total, payload, fee_type, fee_value, notes, channel, webhook_status, scans, created_at
    ) VALUES (
      ${record.id}, ${record.ownerId}, ${record.sourceId}, ${record.merchantName}, ${record.amount}, ${record.total}, ${record.payload}, ${record.feeType ?? null}, ${record.feeValue ?? null}, ${record.notes ?? null}, ${record.channel}, ${record.webhookStatus}, ${record.scans}, ${record.createdAt}
    )
  `;

  if (record.sourceId) {
    await sql`UPDATE qris_sources SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = ${record.sourceId}`;
  }

  if (featureFlags.kv) {
    await kv.set(`analytics:last:${record.ownerId ?? "guest"}`, Date.now()).catch(() => null);
  }

  return record;
}

export async function listGenerateEvents(ownerId?: string | null) {
  if (!featureFlags.postgres) {
    return memoryStore.events.filter((event) => !ownerId || event.ownerId === ownerId);
  }

  await ensurePostgresSchema();
  const { rows } = ownerId
    ? await sql`SELECT * FROM generate_events WHERE owner_id = ${ownerId} ORDER BY created_at DESC LIMIT 200`
    : await sql`SELECT * FROM generate_events ORDER BY created_at DESC LIMIT 200`;

  if (rows.length === 0) {
    return ownerId ? memoryStore.events.filter((event) => event.ownerId === ownerId) : memoryStore.events;
  }

  return rows.map((row) => mapEventRow(row));
}

export async function getAnalyticsOverview(ownerId?: string | null) {
  const events = await listGenerateEvents(ownerId);
  const sources = await listSources(ownerId);

  const today = new Date().toDateString();
  const dailyGenerates = events.filter((event) => new Date(event.createdAt).toDateString() === today).length;
  const totalNominalProcessed = events.reduce((sum, event) => sum + event.total, 0);
  const topMerchants = Array.from(
    events.reduce((map, event) => {
      map.set(event.merchantName, (map.get(event.merchantName) ?? 0) + event.total);
      return map;
    }, new Map<string, number>()),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([name, total]) => ({ name, total }));

  return {
    dailyGenerates,
    totalNominalProcessed,
    totalSources: sources.length,
    totalHistory: events.length,
    totalScans: events.reduce((sum, event) => sum + event.scans, 0),
    webhookDeliveries: events.filter((event) => event.webhookStatus === "delivered").length,
    topMerchants,
  };
}

export async function getTimeseries(ownerId?: string | null, days = 7) {
  const events = await listGenerateEvents(ownerId);
  const bucket = new Map<string, { date: string; generates: number; total: number }>();

  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - offset);
    const key = date.toISOString().slice(0, 10);
    bucket.set(key, { date: key, generates: 0, total: 0 });
  }

  for (const event of events) {
    const key = event.createdAt.slice(0, 10);
    const existing = bucket.get(key);

    if (existing) {
      existing.generates += 1;
      existing.total += event.total;
    }
  }

  return Array.from(bucket.values());
}

export async function recordWebhookEvent(input: {
  ownerId?: string | null;
  referenceId: string;
  event: string;
  amount: number;
  signatureValid: boolean;
  payload: Record<string, unknown>;
}) {
  const record: WebhookRecord = {
    id: crypto.randomUUID(),
    ownerId: input.ownerId ?? null,
    referenceId: input.referenceId,
    event: input.event,
    amount: input.amount,
    signatureValid: input.signatureValid,
    payload: input.payload,
    createdAt: new Date().toISOString(),
  };

  if (!featureFlags.postgres) {
    memoryStore.webhooks.unshift(record);
    return record;
  }

  await ensurePostgresSchema();
  await sql`
    INSERT INTO webhook_events (id, owner_id, reference_id, event, amount, signature_valid, payload, created_at)
    VALUES (${record.id}, ${record.ownerId}, ${record.referenceId}, ${record.event}, ${record.amount}, ${record.signatureValid}, ${JSON.stringify(record.payload)}, ${record.createdAt})
  `;

  return record;
}

export async function getWidgetConfig(id: string) {
  if (!featureFlags.postgres) {
    return memoryStore.widgets.find((widget) => widget.id === id) ?? null;
  }

  await ensurePostgresSchema();
  const { rows } = await sql`SELECT * FROM widget_configs WHERE id = ${id} LIMIT 1`;

  if (rows[0]) {
    const row = rows[0];
    return {
      id: String(row.id),
      ownerId: row.owner_id ? String(row.owner_id) : null,
      sourceId: String(row.source_id),
      label: String(row.label),
      theme: String(row.theme) as WidgetConfigRecord["theme"],
      logoUrl: row.logo_url ? String(row.logo_url) : undefined,
      callbackUrl: row.callback_url ? String(row.callback_url) : undefined,
      createdAt: new Date(String(row.created_at)).toISOString(),
    } satisfies WidgetConfigRecord;
  }

  return memoryStore.widgets.find((widget) => widget.id === id) ?? null;
}

export async function syncOfflineEvents(ownerId: string | null, items: Array<{
  payload: string;
  amount: number;
  total: number;
  merchantName: string;
  channel: "offline" | "web" | "widget";
  notes?: string;
  createdAt: string;
}>) {
  const inserted: GenerateEventRecord[] = [];

  for (const item of items) {
    inserted.push(
      await createGenerateEvent({
        ownerId,
        merchantName: item.merchantName,
        amount: item.amount,
        total: item.total,
        payload: item.payload,
        notes: item.notes,
        channel: item.channel,
      }),
    );
  }

  return inserted;
}
