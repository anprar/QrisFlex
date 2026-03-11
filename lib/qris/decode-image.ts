import {
  BarcodeFormat,
  BinaryBitmap,
  DecodeHintType,
  GlobalHistogramBinarizer,
  HybridBinarizer,
  MultiFormatReader,
  RGBLuminanceSource,
} from "@zxing/library";
import { Jimp } from "jimp";

function normalizeBase64(input: string) {
  return input.includes(",") ? input.split(",").pop() ?? "" : input;
}

export function base64ToBuffer(base64: string) {
  return Buffer.from(normalizeBase64(base64), "base64");
}

export async function decodeQrFromBuffer(buffer: Buffer | Uint8Array) {
  const image = await Jimp.read(Buffer.from(buffer));
  image.greyscale().contrast(0.2);
  const luminances = new Uint8ClampedArray(image.bitmap.width * image.bitmap.height);

  for (let index = 0; index < luminances.length; index += 1) {
    const offset = index * 4;
    const red = image.bitmap.data[offset] ?? 0;
    const green = image.bitmap.data[offset + 1] ?? 0;
    const blue = image.bitmap.data[offset + 2] ?? 0;
    const alpha = image.bitmap.data[offset + 3] ?? 255;
    const normalized = alpha === 0 ? 255 : (red + green * 2 + blue) / 4;

    luminances[index] = normalized;
  }

  const luminance = new RGBLuminanceSource(luminances, image.bitmap.width, image.bitmap.height);

  const reader = new MultiFormatReader();
  const hints = new Map();

  hints.set(DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.QR_CODE]);
  hints.set(DecodeHintType.TRY_HARDER, true);
  reader.setHints(hints);

  try {
    return reader.decode(new BinaryBitmap(new HybridBinarizer(luminance))).getText();
  } catch {
    return reader.decode(new BinaryBitmap(new GlobalHistogramBinarizer(luminance))).getText();
  }
}

export async function decodeQrFromBase64(base64: string) {
  return decodeQrFromBuffer(base64ToBuffer(base64));
}
