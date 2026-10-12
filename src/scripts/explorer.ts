// Explorer list: binds the filter controls to the shared state, then filters, sorts and
// re-orders the server-rendered cards. Re-orders run inside a View Transition so cards
// glide to their new places.
import { items } from "./items";
import { get, matches, reset, set, subscribe, type Item, type Mood, type Sort, type State } from "./state";

const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

export function initExplorer(root: HTMLElement) {
  const PAGE = Number(root.dataset.page) || 24;
  const grid = root.querySelector<HTMLUListElement>("[data-grid]")!;
  const cards = new Map<string, HTMLLIElement>();
  grid.querySelectorAll<HTMLLIElement>("[data-card]").forEach((li) => cards.set(li.dataset.card!, li));
  const more = root.querySelector<HTMLButtonElement>("[data-more]")!;
  const empty = root.querySelector<HTMLElement>("[data-empty]")!;
  const countEl = root.querySelector<HTMLElement>("[data-count-label]")!;
  const q = root.querySelector<HTMLInputElement>("[data-q]")!;
  const region = root.querySelector<HTMLSelectElement>("[data-region]")!;
  const sort = root.querySelector<HTMLSelectElement>("[data-sort]")!;
  const moodBtns = document.querySelectorAll<HTMLButtonElement>("[data-mood]"); // hero + bar
  const toggles = root.querySelectorAll<HTMLInputElement>("[data-toggle]");

  let limit = PAGE;
  let distances: Map<string, number> | null = null;

  /* ---- controls → state ---- */
  moodBtns.forEach((b) =>
    b.addEventListener("click", () => {
      limit = PAGE;
      set({ mood: b.dataset.mood as Mood });
    }),
  );
  let qTimer = 0;
  q.addEventListener("input", () => {
    clearTimeout(qTimer);
    qTimer = window.setTimeout(() => {
      limit = PAGE;
      set({ q: q.value.trim() });
    }, 160);
  });
  region.addEventListener("change", () => {
    limit = PAGE;
    set({ region: region.value });
  });
  toggles.forEach((t) =>
    t.addEventListener("change", () => {
      limit = PAGE;
      set({ [t.dataset.toggle!]: t.checked } as Partial<State>);
    }),
  );
  sort.addEventListener("change", () => {
    const v = sort.value as Sort;
    if (v !== "nearby") return set({ sort: v });
    if (!("geolocation" in navigator)) return (sort.value = get().sort);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        distances = new Map(items.map((i) => [i.id, km(coords.latitude, coords.longitude, i.lat, i.lng)]));
        cards.forEach((li, id) => {
          const d = li.querySelector<HTMLElement>("[data-dist]");
          if (d) {
            d.textContent = `${Math.round(distances!.get(id)!)} km`;
            d.hidden = false;
          }
        });
        set({ sort: "nearby" });
      },
      () => (sort.value = get().sort),
      { timeout: 10000, maximumAge: 600000 },
    );
  });
  more.addEventListener("click", () => {
    limit += PAGE;
    render(get(), false);
  });
  root.querySelector("[data-reset]")!.addEventListener("click", () => {
    limit = PAGE;
    reset();
  });

  /* ---- state → controls + list ---- */
  const syncControls = (st: State) => {
    moodBtns.forEach((b) => b.setAttribute("aria-checked", String(b.dataset.mood === st.mood)));
    if (document.activeElement !== q) q.value = st.q;
    region.value = st.region;
    sort.value = st.sort;
    toggles.forEach((t) => (t.checked = Boolean(st[t.dataset.toggle as keyof State])));
  };

  const sorter = (st: State) => {
    const by = (k: keyof Item) => (a: Item, b: Item) => (b[k] as number) - (a[k] as number) || b.rec - a.rec;
    switch (st.sort) {
      case "food":
      case "history":
      case "architecture":
        return by(st.sort);
      case "nearby":
        return (a: Item, b: Item) => (distances?.get(a.id) ?? 0) - (distances?.get(b.id) ?? 0);
      default:
        return by("rec");
    }
  };

  let first = true;
  const render = (st: State, animate = true) => {
    const list = items.filter((i) => matches(i, st)).sort(sorter(st));
    const show = list.slice(0, limit);
    const apply = () => {
      const visible = new Set(show.map((i) => i.id));
      cards.forEach((li, id) => (li.hidden = !visible.has(id)));
      show.forEach((i) => grid.appendChild(cards.get(i.id)!));
      empty.hidden = list.length > 0;
      more.hidden = list.length <= limit;
      countEl.textContent = countEl.dataset.tpl!.replace("{n}", String(list.length));
    };
    const canVT = animate && !first && !reduce && "startViewTransition" in document;
    first = false;
    if (!canVT) return apply();
    // Name only the cards that are on screen before/after, so the transition stays cheap.
    const named: HTMLElement[] = [];
    const name = (ids: Iterable<string>) => {
      for (const id of ids) {
        const li = cards.get(id);
        if (!li || li.hidden && !show.some((i) => i.id === id)) continue;
        const r = li.getBoundingClientRect();
        if (r.bottom < -200 || r.top > innerHeight + 200) continue;
        li.style.viewTransitionName = `c-${id}`;
        named.push(li);
      }
    };
    name([...cards.keys()].filter((id) => !cards.get(id)!.hidden).slice(0, 40));
    const vt = (document as any).startViewTransition(() => {
      named.forEach((el) => (el.style.viewTransitionName = ""));
      named.length = 0;
      apply();
      name(show.slice(0, 40).map((i) => i.id));
    });
    vt.finished.finally(() => named.forEach((el) => (el.style.viewTransitionName = "")));
  };

  subscribe((st, changed) => {
    syncControls(st);
    if (changed.every((k) => k === "q") && st.q === q.value.trim() && !first) return render(st, false);
    render(st);
  });

  /* ---- hovering a card pings it on the map; clicking morphs it into the detail page ---- */
  grid.addEventListener("pointerover", (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>("[data-card]");
    dispatchEvent(new CustomEvent("street:focus", { detail: li?.dataset.card ?? null }));
  });
  grid.addEventListener("pointerleave", () => dispatchEvent(new CustomEvent("street:focus", { detail: null })));
  grid.addEventListener("click", (e) => {
    const li = (e.target as HTMLElement).closest<HTMLElement>("[data-card]");
    if (!li) return;
    li.querySelector<HTMLElement>("[data-name]")!.style.viewTransitionName = "street-title";
    li.querySelector<HTMLElement>(".cover")!.style.viewTransitionName = "street-cover";
  });
  // Coming back from a street page: give the matching card the shared names again.
  addEventListener("pagereveal", (e: any) => {
    const from = (window as any).navigation?.activation?.from?.url as string | undefined;
    const id = from?.match(/streets\/([^/]+)\//)?.[1];
    const li = id && cards.get(id);
    if (!e.viewTransition || !li || li.hidden) return;
    const n = li.querySelector<HTMLElement>("[data-name]")!;
    const c = li.querySelector<HTMLElement>(".cover")!;
    n.style.viewTransitionName = "street-title";
    c.style.viewTransitionName = "street-cover";
    e.viewTransition.finished.finally(() => {
      n.style.viewTransitionName = "";
      c.style.viewTransitionName = "";
    });
  });
  // Restore names cleanly if the user returns via bfcache.
  addEventListener("pageshow", () =>
    grid.querySelectorAll<HTMLElement>("[data-name], .cover").forEach((el) => (el.style.viewTransitionName = "")),
  );
}

function km(la1: number, lo1: number, la2: number, lo2: number) {
  const r = Math.PI / 180;
  const h = Math.sin(((la2 - la1) * r) / 2) ** 2 + Math.cos(la1 * r) * Math.cos(la2 * r) * Math.sin(((lo2 - lo1) * r) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}
