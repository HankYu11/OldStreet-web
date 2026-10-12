// Shared filter state for the home page: the hero mood buttons, the map and the
// explorer list all read and write it. Mirrored to the URL so a view can be shared.

export type Mood = "all" | "food" | "story" | "heritage" | "market" | "quiet" | "family";
export type Sort = "recommended" | "food" | "history" | "architecture" | "nearby";
export type State = {
  mood: Mood;
  region: string; // "all" | region id
  q: string;
  vendors: boolean;
  heritage: boolean;
  hideFaded: boolean;
  sort: Sort;
};

export type Item = {
  id: string;
  region: string;
  status: string;
  food: number;
  history: number;
  architecture: number;
  shopping: number;
  crowd: number;
  bestFor: string[];
  rec: number;
  lat: number;
  lng: number;
  text: string;
};

const DEFAULT: State = {
  mood: "all",
  region: "all",
  q: "",
  vendors: false,
  heritage: false,
  hideFaded: false,
  sort: "recommended",
};

const MOOD_SORT: Record<Mood, Sort> = {
  all: "recommended",
  food: "food",
  story: "history",
  heritage: "architecture",
  market: "recommended",
  quiet: "architecture",
  family: "recommended",
};

export function moodMatch(m: Mood, s: Item) {
  switch (m) {
    case "food":
      return s.food >= 2;
    case "story":
      return s.history >= 2 && s.status !== "faded";
    case "heritage":
      return s.architecture >= 2;
    case "market":
      return s.shopping >= 2;
    case "quiet":
      return s.crowd <= 1 && s.architecture >= 2 && s.status !== "faded";
    case "family":
      return s.bestFor.includes("family") || (s.shopping >= 2 && s.food >= 2 && s.status !== "faded");
    default:
      return true;
  }
}

const listeners = new Set<(s: State, changed: (keyof State)[]) => void>();
let state: State = { ...DEFAULT };

export const get = () => state;
export function set(patch: Partial<State>) {
  if (patch.mood && !("sort" in patch)) patch = { ...patch, sort: MOOD_SORT[patch.mood] };
  const changed = (Object.keys(patch) as (keyof State)[]).filter((k) => patch[k] !== state[k]);
  if (!changed.length) return;
  state = { ...state, ...patch };
  writeUrl();
  listeners.forEach((fn) => fn(state, changed));
}
export function subscribe(fn: (s: State, changed: (keyof State)[]) => void) {
  listeners.add(fn);
  fn(state, Object.keys(state) as (keyof State)[]);
}
export const reset = () => set({ ...DEFAULT });

export function matches(s: Item, st: State = state) {
  if (!moodMatch(st.mood, s)) return false;
  if (st.region !== "all" && s.region !== st.region) return false;
  if (st.vendors && !(s.shopping >= 2 || s.food >= 2)) return false;
  if (st.heritage && s.architecture < 2) return false;
  if (st.hideFaded && s.status === "faded") return false;
  if (st.q) {
    const words = st.q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!words.every((w) => s.text.includes(w))) return false;
  }
  return true;
}

function readUrl() {
  const p = new URLSearchParams(location.search);
  const s: Partial<State> = {};
  const mood = p.get("mood") as Mood | null;
  if (mood && mood in MOOD_SORT) s.mood = mood;
  if (p.get("region")) s.region = p.get("region")!;
  if (p.get("q")) s.q = p.get("q")!;
  if (p.has("vendors")) s.vendors = true;
  if (p.has("heritage")) s.heritage = true;
  if (p.has("hideFaded")) s.hideFaded = true;
  const sort = p.get("sort") as Sort | null;
  if (sort && sort !== "nearby") s.sort = sort;
  else if (s.mood) s.sort = MOOD_SORT[s.mood];
  state = { ...DEFAULT, ...s };
}
function writeUrl() {
  const p = new URLSearchParams();
  (Object.keys(state) as (keyof State)[]).forEach((k) => {
    const v = state[k];
    if (v === DEFAULT[k] || (k === "sort" && v === MOOD_SORT[state.mood])) return;
    if (typeof v === "boolean") p.set(k, "");
    else p.set(k, String(v));
  });
  const qs = p.toString().replace(/=(&|$)/g, "$1");
  history.replaceState(null, "", `${location.pathname}${qs ? `?${qs}` : ""}${location.hash}`);
}
readUrl();
