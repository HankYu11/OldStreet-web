// Builds src/data/taiwan.json: one SVG path per county, projected with src/lib/project.mjs.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { feature } from "topojson-client";
import { project } from "../src/lib/project.mjs";

const require = createRequire(import.meta.url);
const topo = JSON.parse(readFileSync(require.resolve("taiwan-atlas/counties-10t.json"), "utf8"));
const fc = feature(topo, topo.objects.counties);

// Rounded to whole units and thinned to points ≥ 2.5 units apart: the map is a
// backdrop, so ~1/4 px precision is plenty and keeps the inline SVG small.
const MIN_STEP = 2.5;
const MIN_AREA = 6; // drop islets smaller than this (projected units²)
const ring = (coords) => {
  const pts = [];
  for (const [lng, lat] of coords) {
    const [x, y] = project(lng, lat).map(Math.round);
    const last = pts[pts.length - 1];
    if (!last || Math.hypot(x - last[0], y - last[1]) >= MIN_STEP) pts.push([x, y]);
  }
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
    area += x1 * y2 - x2 * y1;
  }
  if (pts.length < 3 || Math.abs(area / 2) < MIN_AREA) return "";
  return `M${pts.map((p) => p.join(",")).join("L")}Z`;
};

const counties = fc.features.map((f) => {
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  return {
    name: f.properties.COUNTYNAME,
    d: polys.flatMap((p) => p.map(ring)).join(""),
  };
});
writeFileSync(new URL("../src/data/taiwan.json", import.meta.url), JSON.stringify(counties));
console.log(`taiwan.json: ${counties.length} counties`);
