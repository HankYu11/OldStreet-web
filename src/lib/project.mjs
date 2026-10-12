// Shared projection for the Taiwan map (used at build time and in the browser).
// Equirectangular, scaled for latitude ~23.7°. Kinmen and Matsu sit far to the
// west, so — like most Taiwanese maps — they are drawn as insets in the empty
// sea north-west of the main island.
export const VIEW = { w: 900, h: 1200 };
const LNG0 = 119.2;
const LAT0 = 25.42;
const K = 338;
const COS = Math.cos((23.7 * Math.PI) / 180);

/** Offsets (degrees) applied to outlying islands so they land in an inset. */
export function inset(lng, lat) {
  if (lng < 119.0) return { lng: lng + 1.12, lat: lat + 0.33, area: "kinmen" }; // Kinmen → (119.5, 24.8)
  if (lat > 25.85 && lng < 120.6) return { lng: lng - 0.45, lat: lat - 0.88, area: "matsu" }; // Matsu → (119.5, 25.3)
  return { lng, lat, area: null };
}

export function project(lng, lat) {
  const p = inset(lng, lat);
  return [+((p.lng - LNG0) * K * COS).toFixed(1), +((LAT0 - p.lat) * K).toFixed(1)];
}

/** Inset frames (in projected units) for drawing the boxes around Kinmen / Matsu. */
export const INSETS = [
  { id: "matsu", label: { zh: "馬祖", en: "Matsu" }, box: [119.35, 25.45, 119.65, 25.1] },
  { id: "kinmen", label: { zh: "金門", en: "Kinmen" }, box: [119.3, 24.95, 119.7, 24.65] },
].map((i) => {
  const [x1, y1] = [((i.box[0] - LNG0) * K * COS), (LAT0 - i.box[1]) * K];
  const [x2, y2] = [((i.box[2] - LNG0) * K * COS), (LAT0 - i.box[3]) * K];
  return { ...i, x: +x1.toFixed(1), y: +y1.toFixed(1), w: +(x2 - x1).toFixed(1), h: +(y2 - y1).toFixed(1) };
});
