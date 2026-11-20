// Wave 4 banner, see _banner.js
import { meta as m, banner, GOLD } from "./_banner.js";

export const meta = m("Wave 4 banner", "웨이브 4", "Wave 4 announcement: 웨이브 4 in gold pixel strokes, characters drop in and slam down, a light sweep, then dither away.");

export function draw(p, t, o) {
  banner(p, t, o, GOLD);
}
