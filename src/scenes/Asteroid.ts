import { Assets, ParticleContainer, Sprite } from "pixi.js";
import { GameScene } from "./GameScene";
import { SceneManager } from "../SceneManager";
import { Emitter } from "@pixi/particle-emitter";

export class Asteroid extends Sprite {
  // variables for size
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
  private tightLoopAround: boolean;
  public readonly spriteClones: Sprite[] = [];

  // particle emitter for explode animation
  public readonly particleContainer: ParticleContainer = new ParticleContainer();
  private readonly emitter: Emitter;

  private readonly minHealth = 3;
  private readonly maxHealth = 8;
  private health: number;

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

    // create the particle emitter for boost animation
    this.emitter = new Emitter(this.particleContainer, Assets.get("asteroidExplodeParticles"));
    this.emitter.emit = false;
    // this.emitter.autoUpdate = true;
  }

  public update(framesPassed: number): void {
    // update emitter
    this.emitter.update(framesPassed * 0.05);

    // is asteroid active?
    if (this.visible == false) {
      return;
    }

    // update position and rotation: pos += v * dt
    this.x += this.speed * Math.sin(this.direction) * framesPassed;
    this.y -= this.speed * Math.cos(this.direction) * framesPassed;
    this.rotation += this.rotationSpeed * framesPassed;

    // has asteroid fully entered the view?
    if (
      GameScene.isBetween(this.x, this.width, SceneManager.width - this.width) &&
      GameScene.isBetween(this.y, this.height, SceneManager.height - this.height)
    ) {
      this.tightLoopAround = true;
      this.spriteClones.forEach((e) => (e.visible = true));
    }

    // loop around edges if in "thight mode" otherwise use a wider area
    if (this.tightLoopAround) {
      this.x = GameScene.modAbs(this.x, SceneManager.width);
      this.y = GameScene.modAbs(this.y, SceneManager.height);

      // update position and rotation of clones
      this.spriteClones[0].position.set(this.x - SceneManager.width, this.y);
      this.spriteClones[1].position.set(this.x + SceneManager.width, this.y);
      this.spriteClones[2].position.set(this.x, this.y - SceneManager.height);
      this.spriteClones[3].position.set(this.x, this.y + SceneManager.height);
      this.spriteClones.forEach((e) => (e.rotation = this.rotation));
    } else {
      this.x = GameScene.modRange(this.x, -SceneManager.width * 0.2, SceneManager.width * 1.2);
      this.y = GameScene.modRange(this.y, -SceneManager.height * 0.2, SceneManager.height * 1.2);
    }
  }

  public damage(amount: number): void {
    this.health -= amount;
    this.alpha *= this.health / (this.health + 1);
    this.spriteClones.forEach((e) => (e.alpha = this.alpha));
    if (this.health <= 0) {
      this.stop();
    }
  }

  public start(): void {
    this.position.set(-SceneManager.width * 0.2, -SceneManager.height * 0.2);
    this.scale.set(GameScene.randomNumber(this.minScale, this.maxScale));
    this.direction = GameScene.randomNumber(0, 2 * Math.PI);
    this.speed = GameScene.randomNumber(this.minSpeed, this.maxSpeed);
    this.rotationSpeed = GameScene.randomNumber(this.minRotationSpeed, this.maxRotationSpeed);
    this.health = Math.floor(GameScene.randomNumber(this.minHealth, this.maxHealth));
    this.alpha = 1;
    this.visible = true;

    this.tightLoopAround = false;
    this.spriteClones.forEach((e) => {
      e.scale.set(this.scale.x, this.scale.y);
      e.visible = false;
    });
  }

  public stop(): void {
    this.visible = false;
    this.spriteClones.forEach((e) => (e.visible = false));

    // start particle explosion
    this.emitter.updateSpawnPos(this.x, this.y);
    this.emitter.resetPositionTracking();
    this.emitter.playOnce();
  }
}
