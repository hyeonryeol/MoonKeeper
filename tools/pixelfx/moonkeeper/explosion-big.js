import { boom } from "./_boom.js";

export const meta = {
  name: "Big asteroid break", desc: "A big asteroid blows apart: a bigger flash and ring, more chunks, a long cloud of dust.",
  tags: ["moonkeeper", "explosion", "one-shot"], size: [108, 108], origin: [54, 54], duration: 1.1, loop: false, fps: 12, bg: "dark",
  options: { seed: 8 },
};

export function draw(p, t, o) {
  boom(p, t, o, 2, meta.duration);
}
