import { Assets, Container, Text } from "pixi.js";
import { IScene, SceneManager } from "../SceneManager";
import { Rocket } from "./Rocket";
import { Asteroid } from "./Asteroid";
import { Keyboard } from "../Keyboard";

export class GameScene extends Container implements IScene {
  assetBundles: string[] = ["game"];

  private player: Rocket;

  private readonly NUMBER_OF_ASTEROIDS = 5;
  private asteroids: Asteroid[] = [];

  private running: boolean = true;

  private gameoverText1: Text;
  private gameoverText2: Text;

  constructor() {
    super(); // Mandatory! This calls the superclass constructor.
  }

  constructorWithAssets(): void {
    // create asteroids
    for (let _ = 0; _ < this.NUMBER_OF_ASTEROIDS; _++) {
      this.asteroids.push(new Asteroid());
    }

    // create player
    this.player = new Rocket();

    // create gameover text
    this.gameoverText1 = new Text("Gameover", Assets.get("gameoverTextstyle"));
    this.gameoverText1.anchor.set(0.5);
    this.gameoverText1.position.set(SceneManager.width / 2, SceneManager.height / 2);
    this.gameoverText1.visible = false;

    this.gameoverText2 = new Text("Press 'R' to continue", Assets.get("gameoverTextstyle"));
    this.gameoverText2.anchor.set(0.5);
    this.gameoverText2.position.set(SceneManager.width / 2, SceneManager.height / 2 + 100);
    this.gameoverText2.style.fontSize = (this.gameoverText1.style.fontSize as number) * 0.5;
    this.gameoverText2.visible = false;

    // ------------------------------------------ add objects to container
    // add bullets to container
    for (const bullet of this.player.bullets) {
      bullet.spriteClones.forEach((e) => this.addChild(e));
      this.addChild(bullet);
    }

    // add player to container
    this.addChild(this.player.particleContainer);
    this.player.spriteClones.forEach((e) => this.addChild(e));
    this.addChild(this.player);
    this.addChild(this.player.ammoText);

    // add asteroids
    for (const asteroid of this.asteroids) {
      this.addChild(asteroid.particleContainer);
      asteroid.spriteClones.forEach((e) => this.addChild(e));
      this.addChild(asteroid);
    }

    // add text to container
    this.addChild(this.gameoverText1);
    this.addChild(this.gameoverText2);

    // ------------------------------------------ start
    this.startGame();
  }

  private startGame(): void {
    this.player.start();
    for (const asteroid of this.asteroids) {
      asteroid.start();
    }
    this.gameoverText1.visible = false;
    this.gameoverText2.visible = false;
    this.running = true;
  }

  private endGame(): void {
    this.running = false;
    this.gameoverText1.visible = true;
    this.gameoverText2.visible = true;
  }

  public update(framesPassed: number): void {
    // is game running?
    if (this.running == false) {
      if (Keyboard.state.get("KeyR")) {
        this.startGame();
      }
      return;
    }

    // ------------------------------------------ update asteroids:
    for (const asteroid of this.asteroids) {
      asteroid.update(framesPassed);
    }

    // ------------------------------------------ update player:
    this.player.update(framesPassed);

    // ------------------------------------------ check collisions
    // player - asteroid collision
    for (const asteroid of this.asteroids) {
      if (asteroid.visible == false) {
        continue;
      }

      const distanceSquared: number = Math.pow(asteroid.x - this.player.x, 2) + Math.pow(asteroid.y - this.player.y, 2);
      const radiiSumSquared: number = Math.pow(0.3 * (asteroid.width + this.player.width), 2);
      if (distanceSquared < radiiSumSquared) {
        this.endGame();
      }
    }

    // asteroid - bullet collision
    for (const asteroid of this.asteroids) {
      if (asteroid.visible == false) {
        continue;
      }

      for (const bullet of this.player.bullets) {
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

    // ------------------------------------------ spawn new asteroids:
    for (const asteroid of this.asteroids) {
      if (asteroid.visible == false) {
        asteroid.start();
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

  public static modRange(value: number, min: number, max: number): number {
    return this.modAbs(value - min, max - min) + min;
  }

  public static randomNumber(min: number, max: number): number {
    return Math.random() * (max - min) + min;
  }

  public static isBetween(value: number, min: number, max: number) {
    return min <= value && value <= max;
  }
}
