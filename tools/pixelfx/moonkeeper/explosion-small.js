import { boom } from "./_boom.js";

export const meta = {
  name: "Asteroid break", desc: "A small asteroid shatters: white flash, a quick ring, tumbling chunks, sparks and a puff of dust.",
  tags: ["moonkeeper", "explosion", "one-shot"], size: [48, 48], origin: [24, 24], duration: 0.7, loop: false, fps: 12, bg: "dark",
  options: { seed: 3 },
};

export function draw(p, t, o) {
  boom(p, t, o, 1, meta.duration);
}
