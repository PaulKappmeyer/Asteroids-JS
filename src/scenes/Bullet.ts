import { Sprite, Assets } from "pixi.js";
import { SceneManager } from "../SceneManager";
import { GameScene } from "./GameScene";

export class Bullet extends Sprite {
  private readonly speed: number = 50;
  private currentTraveltime: number = 0;
  private readonly maxTraveltime: number = 15;

  //  variables for smooth looking looping around edges
  public readonly spriteClones: Sprite[] = [];

  constructor() {
    super(Assets.get("bullet"));
    this.scale.set(0.1);
    this.anchor.set(0.5);
    this.visible = false;

    // create the clones for smooth looping around edges
    for (let _ = 0; _ < 4; _++) {
      let sprite = Sprite.from(Assets.get("bullet"));
      sprite.scale.set(0.1);
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.spriteClones.push(sprite);
    }
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
    this.x = GameScene.modAbs(this.x, SceneManager.width);
    this.y = GameScene.modAbs(this.y, SceneManager.height);

    // update position and rotation of clones
    this.spriteClones[0].position.set(this.x - SceneManager.width, this.y);
    this.spriteClones[1].position.set(this.x + SceneManager.width, this.y);
    this.spriteClones[2].position.set(this.x, this.y - SceneManager.height);
    this.spriteClones[3].position.set(this.x, this.y + SceneManager.height);
    this.spriteClones.forEach((e) => {
      e.rotation = this.rotation;
      e.alpha = this.alpha;
    });

    // update time and look
    this.currentTraveltime += framesPassed;
    this.alpha = (2 * this.maxTraveltime - this.currentTraveltime) / (2 * this.maxTraveltime);
    if (this.currentTraveltime > this.maxTraveltime) {
      this.stop();
    }
  }

  public start(x: number, y: number, rotation: number): void {
    this.x = x;
    this.y = y;
    this.rotation = rotation;
    this.currentTraveltime = 0;
    this.visible = true;
    this.spriteClones.forEach((e) => (e.visible = true));
  }

  public stop(): void {
    this.visible = false;
    this.spriteClones.forEach((e) => (e.visible = false));
  }
}
