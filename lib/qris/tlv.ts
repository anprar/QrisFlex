export interface TLVNode {
  id: string;
  length: number;
  value: string;
  children?: TLVNode[];
}

function isNestedTag(id: string) {
  const numeric = Number(id);
  return (numeric >= 26 && numeric <= 51) || id === "62" || id === "64";
}

export function composeTlv(nodes: Array<Pick<TLVNode, "id" | "value">>) {
  return nodes
    .filter((node) => node.value !== "")
    .map((node) => `${node.id}${node.value.length.toString().padStart(2, "0")}${node.value}`)
    .join("");
}

export function parseTlv(input: string): TLVNode[] {
  const nodes: TLVNode[] = [];
  let cursor = 0;

  while (cursor < input.length) {
    const id = input.slice(cursor, cursor + 2);
    const length = Number(input.slice(cursor + 2, cursor + 4));

    if (!/^\d{2}$/.test(id) || Number.isNaN(length)) {
      throw new Error(`Format TLV tidak valid pada posisi ${cursor}`);
    }

    const valueStart = cursor + 4;
    const valueEnd = valueStart + length;
    const value = input.slice(valueStart, valueEnd);

    if (value.length !== length) {
      throw new Error(`Panjang TLV untuk tag ${id} tidak sesuai`);
    }

    const node: TLVNode = { id, length, value };

    if (isNestedTag(id)) {
      try {
        node.children = parseTlv(value);
      } catch {
        node.children = undefined;
      }
    }

    nodes.push(node);
    cursor = valueEnd;
  }

  return nodes;
}

export function upsertNode(nodes: TLVNode[], id: string, value: string) {
  const next = [...nodes];
  const existingIndex = next.findIndex((node) => node.id === id);

  if (existingIndex >= 0) {
    next[existingIndex] = { id, length: value.length, value };
    return next;
  }

  const crcIndex = next.findIndex((node) => node.id === "63");

  if (crcIndex >= 0) {
    next.splice(crcIndex, 0, { id, length: value.length, value });
    return next;
  }

  next.push({ id, length: value.length, value });
  return next;
}

export function removeNode(nodes: TLVNode[], id: string) {
  return nodes.filter((node) => node.id !== id);
}

export function getNode(nodes: TLVNode[], id: string) {
  return nodes.find((node) => node.id === id);
}
