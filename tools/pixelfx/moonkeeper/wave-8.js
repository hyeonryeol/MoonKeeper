// Wave 8 banner, see _banner.js
import { meta as m, banner, GOLD } from "./_banner.js";

export const meta = m("Wave 8 banner", "웨이브 8", "Wave 8 announcement: 웨이브 8 in gold pixel strokes, characters drop in and slam down, a light sweep, then dither away.");

export function draw(p, t, o) {
  banner(p, t, o, GOLD);
}
