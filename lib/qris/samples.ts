import { createStaticSamplePayload } from "@/lib/qris/parser";

export const sampleQrCatalog = [
  {
    id: "kopi-nusa",
    label: "Kopi Nusantara",
    city: "JAKARTA",
    payload: createStaticSamplePayload({
      merchantName: "Kopi Nusantara",
      city: "JAKARTA",
      merchantId: "ID102300000001",
    }),
  },
  {
    id: "bakmie-88",
    label: "Bakmie 88",
    city: "BANDUNG",
    payload: createStaticSamplePayload({
      merchantName: "Bakmie 88",
      city: "BANDUNG",
      merchantId: "ID102300000002",
    }),
  },
  {
    id: "mart-24",
    label: "Mart 24 Express",
    city: "SURABAYA",
    payload: createStaticSamplePayload({
      merchantName: "Mart 24 Express",
      city: "SURABAYA",
      merchantId: "ID102300000003",
    }),
  },
];
