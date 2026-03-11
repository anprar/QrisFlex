import { handleOptions, jsonResponse, widgetCorsHeaders } from "@/lib/api";
import { getBaseUrl } from "@/lib/utils";
import { getWidgetConfig, listSources } from "@/lib/store";

export const runtime = "nodejs";

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const widget = await getWidgetConfig(id);

  if (!widget) {
    return jsonResponse({ success: false, message: "Widget tidak ditemukan." }, { status: 404, headers: widgetCorsHeaders });
  }

  const source = (await listSources()).find((item) => item.id === widget.sourceId);
  const url = new URL(request.url);
  const embedUrl = `${getBaseUrl()}/widget/${id}`;

  if (url.searchParams.get("format") === "iframe") {
    const iframe = `<iframe src="${embedUrl}?theme=${widget.theme}" width="100%" height="720" style="border:0;border-radius:24px;overflow:hidden" loading="lazy"></iframe>`;
    return new Response(iframe, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        ...widgetCorsHeaders,
      },
    });
  }

  return jsonResponse(
    {
      success: true,
      widget,
      source: source
        ? {
            id: source.id,
            label: source.label,
            merchantName: source.merchantName,
          }
        : null,
      embedUrl,
      iframeSnippet: `<iframe src="${embedUrl}?theme=${widget.theme}" width="100%" height="720" style="border:0;border-radius:24px;overflow:hidden" loading="lazy"></iframe>`,
    },
    { headers: widgetCorsHeaders },
  );
}
