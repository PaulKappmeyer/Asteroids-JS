import { Container } from "pixi.js";
import { IScene } from "../SceneManager";
import { Rocket } from "./Rocket";
import { Asteroid } from "./Asteroid";
import { Bullet } from "./Bullet";

export class GameScene extends Container implements IScene {
  assetBundles: string[] = ["game"];

  private player: Rocket;
  private asteroids: Asteroid[] = [];

  constructor() {
    super(); // Mandatory! This calls the superclass constructor.
  }

  constructorWithAssets(): void {
    // create asteroids
    for (let _ = 0; _ < 4; _++) {
      let asteroid: Asteroid = new Asteroid();
      this.asteroids.push(asteroid);
      this.addChild(asteroid);
      asteroid.spriteClones.forEach((e) => this.addChild(e));
      asteroid.start();
    }

    // create player
    this.player = new Rocket(this);
  }

  public update(framesPassed: number): void {
    // ------------------------------------------ update asteroids:
    this.asteroids.forEach((e) => e.update(framesPassed));

    // ------------------------------------------ update player:
    this.player.update(framesPassed);

    // ------------------------------------------ check collisions
    for (let i: number = 0; i < this.asteroids.length; i++) {
      const asteroid: Asteroid = this.asteroids[i];
      if (asteroid.visible == false) {
        continue;
      }

      const distanceSquared: number = Math.pow(asteroid.x - this.player.x, 2) + Math.pow(asteroid.y - this.player.y, 2);
      const radiiSumSquared: number = Math.pow(0.5 * (asteroid.width + this.player.width), 2);
      if (distanceSquared < radiiSumSquared) {
        // TODO: handle damage / gameover
      }
    }

    for (let i: number = 0; i < this.asteroids.length; i++) {
      const asteroid: Asteroid = this.asteroids[i];
      if (asteroid.visible == false) {
        continue;
      }

      for (let j: number = 0; j < this.player.shootContainer.children.length; j++) {
        const bullet: Bullet = this.player.shootContainer.getChildAt(j) as Bullet;
        if (bullet.visible == false) {
          continue;
        }

        const distanceSquared: number = Math.pow(asteroid.x - bullet.x, 2) + Math.pow(asteroid.y - bullet.y, 2);
        const radiiSumSquared: number = Math.pow(0.5 * (bullet.width + asteroid.width), 2);
        if (distanceSquared < radiiSumSquared) {
          asteroid.stop();
          bullet.stop();
        }
      }
    }
  }

  // helper function for math
  public static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  public static modAbs(value: number, modulo: number): number {
    return ((value % modulo) + modulo) % modulo;
  }

  public static randomNumber(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }
}
