// The orbit dial made small for the HUD in the corner of the playfield, drawn 1x. See _speedo.js.
import { STEPS, dial } from "./_speedo.js";

export const meta = {
  name: "Speedometer HUD", desc: "The orbit dial speedometer made small for the HUD corner, one frame per speed step.",
  tags: ["moonkeeper", "ui", "gauge"], size: [60, 60], origin: [30, 30], duration: STEPS + 1, loop: true, fps: 1, bg: "dark",
  options: { seed: 81 },
};

export function draw(p, t, o) {
  dial(p, t, 60, 26, 6, 3);
}
