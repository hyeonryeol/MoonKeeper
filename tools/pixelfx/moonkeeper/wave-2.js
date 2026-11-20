// Wave 2 banner, see _banner.js
import { meta as m, banner, GOLD } from "./_banner.js";

export const meta = m("Wave 2 banner", "웨이브 2", "Wave 2 announcement: 웨이브 2 in gold pixel strokes, characters drop in and slam down, a light sweep, then dither away.");

export function draw(p, t, o) {
  banner(p, t, o, GOLD);
}
