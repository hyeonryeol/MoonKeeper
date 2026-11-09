import { gear, SPIKES } from "./_gear.js";

export const meta = {
  name: "Spike armour", desc: "A plate of three steel spikes: ram asteroids without losing speed.",
  tags: ["moonkeeper", "gear"], size: [12, 16], origin: [2, 8], duration: 1, loop: true, fps: 12, bg: "dark",
  options: { seed: 1 },
};

export function draw(p) {
  gear(p, SPIKES);
}
