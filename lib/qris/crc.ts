export function computeCrc16(payload: string) {
  let crc = 0xffff;

  for (let index = 0; index < payload.length; index += 1) {
    crc ^= payload.charCodeAt(index) << 8;

    for (let bit = 0; bit < 8; bit += 1) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }

      crc &= 0xffff;
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function stripTrailingCrc(payload: string) {
  return payload.replace(/6304[0-9A-Fa-f]{4}$/, "");
}

export function appendCrc(payloadWithoutCrc: string) {
  const seed = `${stripTrailingCrc(payloadWithoutCrc)}6304`;
  return `${seed}${computeCrc16(seed)}`;
}
