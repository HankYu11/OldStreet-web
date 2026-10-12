// Map interactions: hover tooltip + links to nearest neighbours, pointer parallax,
// live dimming from the shared filter state, and a "ping" when a list card is hovered.
import { items } from "./items";
import { matches, subscribe } from "./state";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fine = matchMedia("(pointer: fine)").matches;

export function initMap(root: HTMLElement) {
  const stage = root.querySelector<HTMLElement>("[data-stage]")!;
  const svg = stage.querySelector("svg")!;
  const dotsG = root.querySelector<SVGGElement>("[data-dots]")!;
  const linksG = root.querySelector<SVGGElement>("[data-links]")!;
  const ping = root.querySelector<SVGGElement>("[data-ping]")!;
  const tip = root.querySelector<HTMLElement>("[data-tip]")!;
  const tipData: Record<string, [string, string, string, string, number, number, number, number]> = JSON.parse(
    root.querySelector("template[data-tip-data]")!.innerHTML,
  );
  const lang = root.dataset.lang;
  const short = lang === "zh" ? ["食", "史", "建", "逛"] : ["Food", "Story", "Bldg", "Shops"];

  const dots = new Map<string, SVGGElement>();
  const pos = new Map<string, [number, number]>();
  dotsG.querySelectorAll<SVGGElement>(".dot").forEach((g, i) => {
    dots.set(g.dataset.id!, g);
    const m = g.getAttribute("transform")!.match(/translate\(([\d.]+) ([\d.]+)\)/)!;
    pos.set(g.dataset.id!, [+m[1], +m[2]]);
    g.style.setProperty("--i", String(i));
  });

  /* ---- tooltip ---- */
  const toScreen = (x: number, y: number) => {
    const p = svg.createSVGPoint();
    p.x = x;
    p.y = y;
    const sp = p.matrixTransform(svg.getScreenCTM()!);
    const r = stage.getBoundingClientRect();
    return [sp.x - r.left, sp.y - r.top];
  };
  let current: string | null = null;
  const show = (id: string) => {
    if (current === id) return;
    hide();
    current = id;
    const g = dots.get(id)!;
    g.classList.add("hover");
    const [name, tagline, status, place, ...sc] = tipData[id];
    tip.innerHTML = `<span class="meta">${status} · ${place}</span><b>${name}</b><p>${tagline}</p><div class="bars">${sc
      .map((v, i) => `<span>${short[i]}<i style="--v:${v}"></i></span>`)
      .join("")}</div>`;
    tip.hidden = false;
    const [x, y] = pos.get(id)!;
    const [sx, sy] = toScreen(x, y);
    const w = stage.clientWidth;
    const tw = tip.offsetWidth;
    const left = sx + tw + 24 > w ? sx - tw - 18 : sx + 18;
    tip.style.setProperty("--tx", `${Math.max(0, left)}px`);
    tip.style.setProperty("--ty", `${Math.max(0, sy - 40)}px`);
    // link to the 3 nearest visible neighbours
    const near = [...pos.entries()]
      .filter(([o]) => o !== id && !dots.get(o)!.classList.contains("off"))
      .map(([o, [ox, oy]]) => [o, Math.hypot(ox - x, oy - y)] as const)
      .sort((a, b) => a[1] - b[1])
      .slice(0, 3);
    linksG.innerHTML = near
      .map(([o]) => {
        const [ox, oy] = pos.get(o)!;
        return `<line x1="${x}" y1="${y}" x2="${ox}" y2="${oy}"/>`;
      })
      .join("");
  };
  const hide = () => {
    if (!current) return;
    dots.get(current)?.classList.remove("hover");
    current = null;
    tip.hidden = true;
    linksG.innerHTML = "";
  };
  dotsG.addEventListener("pointerover", (e) => {
    const g = (e.target as Element).closest<SVGGElement>(".dot");
    if (g) show(g.dataset.id!);
  });
  dotsG.addEventListener("pointerleave", hide);
  dotsG.addEventListener("click", (e) => {
    const g = (e.target as Element).closest<SVGGElement>(".dot");
    if (!g) return;
    // on touch, first tap previews, second tap opens
    if (!fine && current !== g.dataset.id) return show(g.dataset.id!);
    location.href = g.dataset.href!;
  });

  /* ---- 3D parallax ---- */
  if (fine && !reduce) {
    root.addEventListener("pointermove", (e) => {
      const r = root.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      stage.style.setProperty("--ry", `${x * 10}deg`);
      stage.style.setProperty("--rx", `${-y * 8}deg`);
    });
    root.addEventListener("pointerleave", () => {
      stage.style.setProperty("--ry", "0deg");
      stage.style.setProperty("--rx", "0deg");
    });
  }

  /* ---- filtering ---- */
  const counties = root.querySelectorAll<SVGPathElement>(".land path");
  subscribe((st) => {
    const filtering = st.mood !== "all" || st.region !== "all" || !!st.q || st.vendors || st.heritage || st.hideFaded;
    dotsG.classList.toggle("filtering", filtering);
    const hot = new Set<string>();
    items.forEach((it) => {
      const on = matches(it);
      const g = dots.get(it.id);
      g?.classList.toggle("on", on);
      g?.classList.toggle("off", !on);
      if (on && filtering) hot.add(it.county);
    });
    counties.forEach((p) => p.classList.toggle("hot", hot.has(p.dataset.county!)));
  });

  /* ---- ping a street from elsewhere (list hover) ---- */
  addEventListener("street:focus", (e) => {
    const id = (e as CustomEvent<string | null>).detail;
    const p = id && pos.get(id);
    if (!p) return ping.setAttribute("opacity", "0");
    ping.setAttribute("transform", `translate(${p[0]} ${p[1]})`);
    ping.setAttribute("opacity", "1");
  });
}
