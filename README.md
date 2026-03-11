# QrisFlex

QrisFlex adalah aplikasi Next.js App Router untuk mengubah QRIS statis menjadi QRIS dinamis dengan UI modern, dashboard analytics, widget iframe, webhook callback, dan PWA offline-ready.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4 + komponen gaya shadcn/ui
- NextAuth beta (credentials + Google opsional)
- `qrcode.react` + `@zxing/library` + `jimp`
- Vercel KV untuk rate limit/cache dan Vercel Postgres untuk analytics/history bila env tersedia
- PWA service worker + IndexedDB queue untuk sinkronisasi offline
- Vitest untuk QR encode/decode

## Fitur utama

- Landing page animatif dengan quick generate tanpa login
- Decode QR statis PNG/JPG, ekstraksi merchant metadata, dan generate QRIS dinamis dengan nominal/fee/catatan
- Dashboard login-only untuk melihat QR tersimpan, history, top merchant, dan grafik generate
- API docs gaya OpenAPI di `/api/docs` dan spec JSON di `/api/docs/openapi`
- Widget iframe di `/widget/[qrisId]` dan endpoint embed helper di `/api/widget/[id]`
- Webhook callback manual dengan verifikasi HMAC SHA-256
- Offline-capable PWA: decode/generate lokal, simpan antrean, sinkron saat online

## Menjalankan lokal

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Environment

Buat file `.env.local` jika ingin mengaktifkan fitur produksi penuh.

```env
NEXTAUTH_SECRET=replace-me
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000

AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=

KV_REST_API_URL=
KV_REST_API_TOKEN=

POSTGRES_URL=
VERCEL_POSTGRES_URL=

BLOB_READ_WRITE_TOKEN=
WEBHOOK_SECRET=replace-me
```

Catatan:

- Tanpa KV/Postgres/Blob, aplikasi tetap jalan dengan fallback memory store untuk demo.
- Jika `AUTH_GOOGLE_ID` dan `AUTH_GOOGLE_SECRET` kosong, login Google disembunyikan otomatis.
- Jika `WEBHOOK_SECRET` kosong, webhook mode demo menerima signature apa saja.

## Endpoint utama

- `POST /api/qris/generate`
- `POST /api/qris/decode`
- `POST /api/qris/webhook`
- `GET /api/widget/[id]`
- `GET /api/analytics/overview`
- `GET /api/analytics/timeseries`
- `GET|POST /api/history`
- `GET /api/docs/openapi`

## Deploy

```bash
vercel --prod
```

Pengaturan yang direkomendasikan:

- `NEXTAUTH_URL=production.com`
- Custom domain: `qrisflex.id`
- Scale: Auto (Edge Functions)

## Vercel runtime notes

- Endpoint ringan seperti health check dan OpenAPI spec dijalankan di Edge Runtime.
- Decode image, generate dengan fallback base64, webhook verification, dan analytics storage memakai Node runtime.
- `vercel.json` menambahkan CORS widget, security headers, dan cron cleanup blob.

## Testing

```bash
npm run test
```

Yang diuji:

- Validasi CRC QRIS
- Transformasi statis -> dinamis dengan nominal dan fee
- Roundtrip encode/decode QR image menggunakan PNG + ZXing

## Seed data

Contoh payload QRIS tersedia di `lib/qris/samples.ts` dan langsung dipakai untuk:

- quick demo landing page
- dashboard demo
- widget default

## Struktur singkat

```text
app/
components/
hooks/
lib/
public/
tests/
auth.ts
middleware.ts
vercel.json
```
