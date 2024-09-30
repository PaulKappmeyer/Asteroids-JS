import { Container } from "pixi.js";
import { IScene } from "../SceneManager";
import { Rocket } from "./Rocket";

export class GameScene extends Container implements IScene {
  assetBundles: string[] = ["game"];

  private player: Rocket;

  constructor() {
    super(); // Mandatory! This calls the superclass constructor.
  }

  constructorWithAssets(): void {
    // create player
    this.player = new Rocket(this);
  }

  public update(framesPassed: number): void {
    // ------------------------------------------ update player:
    this.player.update(framesPassed);
  }

  // helper function for math
  public static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
