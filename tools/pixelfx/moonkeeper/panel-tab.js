// The gear panel shown while Tab is held: the same riveted plate as panel-frame.js, cut to the height of its contents.
// 100 x 172, drawn 2x over the top right of the playfield.
import { plate, meta as frameMeta } from "./panel-frame.js";

export const meta = {
  name: "Gear panel", desc: "Gear panel plate shown while Tab is held: the riveted iron and brass plate cut short to fit the gear list.",
  tags: ["moonkeeper", "ui", "panel"], size: [100, 172], origin: [0, 0], duration: 1, loop: true, fps: 1, bg: "dark",
  options: { ...frameMeta.options },
};

export function draw(p, t, o) {
  plate(p, o, 100, 172);
}
