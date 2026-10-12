// Compact per-street data for client-side filtering, embedded once in the page by Explorer.astro.
import type { Item } from "./state";

const el = document.getElementById("street-items");
export const items: (Item & { county: string })[] = el ? JSON.parse(el.textContent || "[]") : [];
export const itemById = new Map(items.map((i) => [i.id, i]));
