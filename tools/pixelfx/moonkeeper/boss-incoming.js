// Boss banner shown in the rest before wave 10, see _banner.js
import { meta as m, banner, RED } from "./_banner.js";

export const meta = m("Boss incoming banner", "보스 등장", "Boss announcement: 보스 등장 in ember red pixel strokes, characters drop in and slam down, a light sweep, then dither away.");

export function draw(p, t, o) {
  banner(p, t, o, RED);
}
