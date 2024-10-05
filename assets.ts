import type { AssetsManifest } from "pixi.js";

export const manifest: AssetsManifest = {
  bundles: [
    {
      name: "game",
      assets: {
        rocket: "./rocket.png",
        bullet: "./bullet.png",
        asteroid: "./asteroid.png",
        boostParticles: "./boostParticles.json",
        asteroidExplodeParticles: "./asteroidExplodeParticles.json",
        gameoverTextstyle: "./gameoverTextstyle.json",
      },
    },
  ],
};
