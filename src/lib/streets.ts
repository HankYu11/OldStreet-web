import raw from "../../data/old_streets.json";
import { project } from "./project.mjs";

export type Status = "thriving" | "active" | "quiet" | "faded";
export type Scores = { food: number; history: number; architecture: number; shopping: number; crowd: number };
export type Street = {
  id: string;
  name_zh: string;
  name_en: string;
  aliases: string[];
  region: "north" | "central" | "south" | "east" | "islands";
  county: string;
  district: string;
  address_hint: string;
  lat: number;
  lng: number;
  status: Status;
  scores: Scores;
  architecture_styles: string[];
  themes: string[];
  best_for: string[];
  signature_foods: string[];
  specialties: string[];
  landmarks: string[];
  tagline_zh: string;
  tagline_en: string;
  story_zh: string;
  story_en: string;
  getting_there: string;
  visit_duration: string;
  best_time: string;
  confidence: "high" | "medium" | "low";
  wikipedia: string | null;
  image: { commons_file: string } | null;
  sources: string[];
  source_list: "wikipedia" | "addition";
};

const STATUS_RANK: Record<Status, number> = { thriving: 3, active: 2, quiet: 1, faded: 0 };
const CONF_RANK = { high: 1, medium: 0.5, low: 0 };

/** Default ordering: how rewarding a visit is likely to be, for a generic visitor. */
export function recommendScore(s: Street) {
  const { food, history, architecture, shopping } = s.scores;
  return STATUS_RANK[s.status] * 3 + food + history + architecture + shopping * 0.5 + CONF_RANK[s.confidence];
}

export const streets: Street[] = (raw as Street[])
  .map((s) => ({ ...s, aliases: s.aliases ?? [], signature_foods: s.signature_foods ?? [] }))
  .sort((a, b) => recommendScore(b) - recommendScore(a));

export const byId = new Map(streets.map((s) => [s.id, s]));

export function xy(s: Pick<Street, "lat" | "lng">) {
  return project(s.lng, s.lat) as [number, number];
}

export function km(a: Street, b: Street) {
  const r = Math.PI / 180;
  const h =
    Math.sin(((b.lat - a.lat) * r) / 2) ** 2 +
    Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(((b.lng - a.lng) * r) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

/** Closest other streets, worth chaining into the same day. */
export function nearby(s: Street, n = 4, maxKm = 45) {
  return streets
    .filter((o) => o.id !== s.id && o.status !== "faded")
    .map((o) => ({ street: o, km: km(s, o) }))
    .filter((o) => o.km <= maxKm)
    .sort((a, b) => a.km - b.km)
    .slice(0, n);
}

/** Wikimedia Commons thumbnail URL for a file name. */
export function commonsUrl(file: string, width = 1200) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file.replace(/ /g, "_"))}?width=${width}`;
}
export function commonsPage(file: string) {
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file.replace(/ /g, "_"))}`;
}

export const hasVendors = (s: Street) => s.scores.shopping >= 2 || s.scores.food >= 2;
export const hasHeritage = (s: Street) => s.scores.architecture >= 2;

type En = Partial<{
  getting_there_en: string;
  best_time_en: string;
  address_hint_en: string;
  district_en: string;
  signature_foods_en: string[];
  specialties_en: string[];
  landmarks_en: string[];
}>;
const enFiles = import.meta.glob<{ default: Record<string, En> }>("../../data/translations_en.json", { eager: true });
const en: Record<string, En> = Object.values(enFiles)[0]?.default ?? {};

type TextField = "getting_there" | "best_time" | "address_hint" | "district";
type ListField = "signature_foods" | "specialties" | "landmarks";
/** A street's text in the page language, falling back to Chinese. */
export function text(s: Street, field: TextField, lang: "zh" | "en"): string {
  return (lang === "en" && en[s.id]?.[`${field}_en`]) || s[field] || "";
}
export function list(s: Street, field: ListField, lang: "zh" | "en"): string[] {
  const t = lang === "en" ? en[s.id]?.[`${field}_en`] : undefined;
  return t && t.length === (s[field] ?? []).length ? t : (s[field] ?? []);
}

export const counties = [...new Set(streets.map((s) => s.county))];
