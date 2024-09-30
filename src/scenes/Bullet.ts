import { Sprite, Assets } from "pixi.js";
import { SceneManager } from "../SceneManager";

export class Bullet extends Sprite {
  private readonly speed: number = 50;
  private currentTraveltime: number = 0;
  private readonly maxTraveltime: number = 15;

  constructor() {
    super(Assets.get("bullet"));
    this.scale.set(0.1);
    this.anchor.set(0.5);
    this.visible = false;
  }

  public update(framesPassed: number): void {
    // is bullet active?
    if (this.visible == false) {
      return;
    }

    // update position:
    this.x += this.speed * Math.sin(this.rotation) * framesPassed;
    this.y -= this.speed * Math.cos(this.rotation) * framesPassed;

    // loop rocket around edges
    while (this.x < 0) {
      this.x += SceneManager.width;
    }
    while (this.x > SceneManager.width) {
      this.x -= SceneManager.width;
    }
    while (this.y < 0) {
      this.y += SceneManager.height;
    }
    while (this.y > SceneManager.height) {
      this.y -= SceneManager.height;
    }

    // update time and look
    this.currentTraveltime += framesPassed;
    this.alpha =
      (2 * this.maxTraveltime - this.currentTraveltime) /
      (2 * this.maxTraveltime);
    if (this.currentTraveltime > this.maxTraveltime) {
      this.currentTraveltime = 0;
      this.visible = false;
    }
  }
}
