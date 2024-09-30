import type { AssetsManifest } from "pixi.js";

export const manifest: AssetsManifest = {
  bundles: [
    {
      name: "game",
      assets: {
        rocket: "./rocket.png",
        bullet: "./bullet.png",
        particleSettings: "./emitter.json",
      },
    },
  ],
};
