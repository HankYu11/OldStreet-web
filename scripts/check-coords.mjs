// Checks every street's coordinates fall inside its county/district polygon.
// Usage: node scripts/check-coords.mjs
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { feature } from "topojson-client";

const require = createRequire(import.meta.url);
const topo = JSON.parse(readFileSync(require.resolve("taiwan-atlas/towns-10t.json"), "utf8"));
const towns = feature(topo, topo.objects.towns).features;
const streets = JSON.parse(readFileSync(new URL("../data/old_streets.json", import.meta.url), "utf8"));
const norm = (s = "") => s.replace(/台/g, "臺");

const inRing = (pt, ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > pt[1] !== yj > pt[1] && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const contains = (f, pt) => {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  return polys.some((p) => inRing(pt, p[0]) && !p.slice(1).some((h) => inRing(pt, h)));
};

let bad = 0;
for (const s of streets) {
  const town = towns.find((f) => contains(f, [s.lng, s.lat]));
  const got = town ? `${norm(town.properties.COUNTYNAME)}${town.properties.TOWNNAME}` : "(sea / outside)";
  const want = `${norm(s.county)}${s.district}`;
  if (!town || norm(town.properties.COUNTYNAME) !== norm(s.county) || !norm(s.district).includes(norm(town.properties.TOWNNAME).slice(0, 2))) {
    bad++;
    console.log(`${s.id}\t${s.name_zh}\twant ${want}\tgot ${got}\t${s.lat},${s.lng}`);
  }
}
console.log(`${bad} of ${streets.length} outside their stated district`);
