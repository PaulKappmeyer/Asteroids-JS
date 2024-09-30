import type { AssetsManifest } from "pixi.js";

export const manifest: AssetsManifest = {
  bundles: [
    {
      name: "game",
      assets: {
        rocket: "./rocket.png",
        particleSettings: "./emitter.json",
      },
    },
  ],
};
