import { Assets, Sprite } from "pixi.js";
import { GameScene } from "./GameScene";
import { SceneManager } from "../SceneManager";

export class Asteroid extends Sprite {
  private minScale: number = 0.25;
  private maxScale: number = 0.5;

  // variables for movement
  private direction: number; // angle of movement
  private speed: number;
  private readonly minSpeed: number = 3;
  private readonly maxSpeed: number = 5;
  private rotationSpeed: number;
  private readonly minRotationSpeed: number = 0.01;
  private readonly maxRotationSpeed: number = 0.05;

  //  variables for smooth looking looping around edges
  public readonly spriteClones: Sprite[] = [];

  constructor() {
    super(Assets.get("asteroid"));
    this.anchor.set(0.5);
    this.visible = false;

    // create the clones for smooth looping around edges
    for (let _ = 0; _ < 4; _++) {
      let sprite = Sprite.from(Assets.get("asteroid"));
      sprite.anchor.set(0.5);
      sprite.visible = false;
      this.spriteClones.push(sprite);
    }
  }

  public update(framesPassed: number): void {
    // is asteroid active?
    if (this.visible == false) {
      return;
    }

    // update position and rotation: pos += v * dt
    this.x += this.speed * Math.sin(this.direction) * framesPassed;
    this.y -= this.speed * Math.cos(this.direction) * framesPassed;
    this.rotation += this.rotationSpeed * framesPassed;

    // loop rocket around edges
    this.x = GameScene.modAbs(this.x, SceneManager.width);
    this.y = GameScene.modAbs(this.y, SceneManager.height);

    // update position and rotation of clones
    this.spriteClones[0].position.set(this.x - SceneManager.width, this.y);
    this.spriteClones[1].position.set(this.x + SceneManager.width, this.y);
    this.spriteClones[2].position.set(this.x, this.y - SceneManager.height);
    this.spriteClones[3].position.set(this.x, this.y + SceneManager.height);
    this.spriteClones.forEach((e) => (e.rotation = this.rotation));
  }

  public start(): void {
    this.scale.set(GameScene.randomNumber(this.minScale, this.maxScale));
    this.direction = GameScene.randomNumber(0, 2 * Math.PI);
    this.speed = GameScene.randomNumber(this.minSpeed, this.maxSpeed);
    this.rotationSpeed = GameScene.randomNumber(this.minRotationSpeed, this.maxRotationSpeed);
    this.visible = true;

    this.spriteClones.forEach((e) => {
      e.scale.set(this.scale.x, this.scale.y);
      e.visible = true;
    });
  }

  public stop(): void {
    this.visible = false;
    this.spriteClones.forEach((e) => (e.visible = false));
  }
}
