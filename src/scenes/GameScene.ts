import {
  Container,
  Sprite,
  ParticleContainer,
  Assets,
  BitmapText,
  BitmapFont,
} from "pixi.js";
import { IScene, SceneManager } from "../SceneManager";
import { Emitter, EmitterConfigV3 } from "@pixi/particle-emitter";
import { Keyboard } from "../Keyboard";
import { Bullet } from "./Bullet";

export class GameScene extends Container implements IScene {
  assetBundles: string[] = ["game"];

  private rocket: Sprite;
  // particle emitter for boost animation
  private emitter: Emitter;

  // varaibles for rocket movement
  private speed: number = 0;
  private maxSpeed: number = 10;
  private acceleration: number = 0;
  private accelerationBoost: number = 0.5; // applied when up key is pressed

  // variables for rocket rotation movement
  private rotationSpeed: number = 0;
  private maxRotationSpeed = 0.075;
  private rotationAcceleration = 0;
  private rotationAccelerationBoost = 0.01; // applied when left/right key is pressed

  // physic constants for movement
  private readonly FRICTION: number = 0.1;
  private readonly ROTATION_FRICTION: number = 0.0025;

  // varaibles for rocket shooting
  private shootContainer: Container = new Container();
  private canShoot: boolean = true;
  private shootDeltaTime: number = 0;
  private shootTime: number = 5; // time between each shot
  private maxAmmo: number = 50;
  private ammo: number = this.maxAmmo;
  private reloadTime: number = 120; // time to reload
  private ammoText: BitmapText; // (TODO: better HUD system)

  constructor() {
    super(); // Mandatory! This calls the superclass constructor.
  }

  constructorWithAssets(): void {
    // create the variables for rocket shooting
    this.addChild(this.shootContainer);
    for (let i: number = 0; i < this.maxAmmo; i++) {
      this.shootContainer.addChild(new Bullet());
    }
    BitmapFont.from("comic 32", {
      fill: "#ffffff", // White, will be colored later
      fontFamily: "Comic Sans MS",
      fontSize: 32,
    });
    this.ammoText = new BitmapText("Ammo " + this.ammo, {
      fontName: "comic 32",
      fontSize: 24, // Making it too big or too small will look bad
      tint: 0xffffff, // Here we make it red.
    });
    this.addChild(this.ammoText);

    // create the particle emitter for boost animation
    const particleContainer: ParticleContainer = new ParticleContainer();
    const particleSettings: EmitterConfigV3 = Assets.get("particleSettings");
    this.addChild(particleContainer);
    this.emitter = new Emitter(particleContainer, particleSettings);

    // creating the rocket/player
    this.rocket = Sprite.from("rocket");
    this.rocket.scale.set(0.25);
    this.rocket.anchor.set(0.5);
    this.rocket.position.set(SceneManager.width / 2, SceneManager.height / 2);
    this.addChild(this.rocket);
  }

  public update(framesPassed: number): void {
    // ------------------------------------------ update player movement:
    // apply friction and check for complete stop of motion
    if (Math.abs(this.speed) > this.FRICTION) {
      this.acceleration = -Math.sign(this.speed) * this.FRICTION;
    } else {
      this.acceleration = 0;
      this.speed = 0;
    }

    if (Math.abs(this.rotationSpeed) > this.ROTATION_FRICTION) {
      this.rotationAcceleration =
        -Math.sign(this.rotationSpeed) * this.ROTATION_FRICTION;
    } else {
      this.rotationAcceleration = 0;
      this.rotationSpeed = 0;
    }

    // update emitter rotation and spawn position
    this.emitter.rotate(Math.PI + this.rocket.rotation);
    this.emitter.updateSpawnPos(this.rocket.x, this.rocket.y);
    this.emitter.update(framesPassed);
    this.emitter.emit = false;

    // check keyboard input: apply boost
    if (Keyboard.state.get("KeyW") || Keyboard.state.get("ArrowUp")) {
      this.acceleration += this.accelerationBoost;
      this.emitter.emit = true; // start emitting of particles
    }
    if (Keyboard.state.get("KeyS") || Keyboard.state.get("ArrowDown")) {
      this.acceleration += -this.accelerationBoost * 0.5;
      this.emitter.emit = true; // start emitting of particles
    }
    if (Keyboard.state.get("KeyA") || Keyboard.state.get("ArrowLeft")) {
      this.rotationAcceleration += -this.rotationAccelerationBoost;
    }
    if (Keyboard.state.get("KeyD") || Keyboard.state.get("ArrowRight")) {
      this.rotationAcceleration += this.rotationAccelerationBoost;
    }

    // update speed: v += a * dt
    let newSpeed: number = this.speed + this.acceleration * framesPassed;
    this.speed = GameScene.clamp(newSpeed, -this.maxSpeed * 0.5, this.maxSpeed);

    let newRotationSpeed: number =
      this.rotationSpeed + this.rotationAcceleration * framesPassed;
    this.rotationSpeed = GameScene.clamp(
      newRotationSpeed,
      -this.maxRotationSpeed,
      this.maxRotationSpeed
    );

    // update player position and rotation: pos += v * dt
    this.rocket.x += this.speed * Math.sin(this.rocket.rotation) * framesPassed;
    this.rocket.y -= this.speed * Math.cos(this.rocket.rotation) * framesPassed;
    this.rocket.rotation += this.rotationSpeed * framesPassed;

    // loop rocket around edges
    while (this.rocket.x < 0) {
      this.rocket.x += SceneManager.width;
    }
    while (this.rocket.x > SceneManager.width) {
      this.rocket.x -= SceneManager.width;
    }
    while (this.rocket.y < 0) {
      this.rocket.y += SceneManager.height;
    }
    while (this.rocket.y > SceneManager.height) {
      this.rocket.y -= SceneManager.height;
    }

    // ------------------------------------------ update player shooting:
    // update the bullets:
    this.shootContainer.children.forEach((bullet) => {
      (bullet as Bullet).update(framesPassed);
    });

    // check keyboard input: shoot
    if (this.canShoot && Keyboard.state.get("Space")) {
      for (let i: number = 0; i < this.shootContainer.children.length; i++) {
        const bullet = this.shootContainer.getChildAt(i);
        if (bullet.visible == false) {
          bullet.x = this.rocket.x;
          bullet.y = this.rocket.y;
          bullet.rotation = this.rocket.rotation;
          bullet.visible = true;
          this.canShoot = false;
          this.ammo--;
          this.ammoText.text = "Ammo " + this.ammo;
          break;
        }
      }
    }

    // update timers:
    if (this.canShoot == false) {
      if (this.ammo > 0) {
        // update cooldown timer
        this.shootDeltaTime += framesPassed;
        if (this.shootDeltaTime >= this.shootTime) {
          this.shootDeltaTime -= this.shootTime;
          this.canShoot = true;
        }
      } else {
        // update reload timer
        this.ammoText.text = "Reloading";
        this.shootDeltaTime += framesPassed;
        if (this.shootDeltaTime > this.reloadTime) {
          this.shootDeltaTime = 0;
          this.canShoot = true;
          this.ammo = this.maxAmmo;
          this.ammoText.text = "Ammo " + this.ammo;
        }
      }
    }
  }

  // helper function for math
  private static clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }
}
