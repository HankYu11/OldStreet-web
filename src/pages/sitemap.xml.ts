import type { APIRoute } from "astro";
import { streets } from "../lib/streets";
import { streetPath } from "../i18n/copy";

export const GET: APIRoute = ({ site }) => {
  const abs = (p: string) => new URL(p, site).href;
  const pairs = [
    { zh: "/", en: "/en/" },
    ...streets.map((s) => ({ zh: streetPath("zh", s.id), en: streetPath("en", s.id) })),
  ];
  const urls = pairs
    .flatMap((p) =>
      [p.zh, p.en].map(
        (loc) => `<url><loc>${abs(loc)}</loc><xhtml:link rel="alternate" hreflang="zh-Hant-TW" href="${abs(p.zh)}"/><xhtml:link rel="alternate" hreflang="en" href="${abs(p.en)}"/></url>`,
      ),
    )
    .join("");
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${urls}</urlset>`,
    { headers: { "Content-Type": "application/xml" } },
  );
};
