import { notFound } from "next/navigation";

import { WidgetGenerator } from "@/components/widget-generator";
import { getWidgetConfig, listSources } from "@/lib/store";

export async function generateMetadata({ params }: { params: Promise<{ qrisId: string }> }) {
  const { qrisId } = await params;
  const widget = await getWidgetConfig(qrisId);

  return {
    title: widget?.label ?? "Widget QRIS",
    description: "Embed widget generator QRIS dinamis dari QrisFlex.",
  };
}

export default async function WidgetPage({ params }: { params: Promise<{ qrisId: string }> }) {
  const { qrisId } = await params;
  const widget = await getWidgetConfig(qrisId);

  if (!widget) {
    notFound();
  }

  const source = (await listSources()).find((item) => item.id === widget.sourceId);

  if (!source) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-transparent p-4">
      <WidgetGenerator
        source={{ id: source.id, label: source.label, payload: source.payload, merchantName: source.merchantName }}
        widget={{ id: widget.id, label: widget.label, theme: widget.theme, callbackUrl: widget.callbackUrl }}
      />
    </main>
  );
}
