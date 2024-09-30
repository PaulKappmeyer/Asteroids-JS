import {
  Sprite,
  Assets,
  ParticleContainer,
  Container,
  BitmapText,
  BitmapFont,
} from "pixi.js";
import { Emitter, EmitterConfigV3 } from "@pixi/particle-emitter";
import { SceneManager } from "../SceneManager";
import { Keyboard } from "../Keyboard";
import { GameScene } from "./GameScene";
import { Bullet } from "./Bullet";

export class Rocket extends Sprite {
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

  constructor(container: Container) {
    super(Assets.get("rocket"));
    // creating the rocket/player
    this.scale.set(0.25);
    this.anchor.set(0.5);
    this.position.set(SceneManager.width / 2, SceneManager.height / 2);
    
    // create the particle emitter for boost animation
    const particleContainer: ParticleContainer = new ParticleContainer();
    const particleSettings: EmitterConfigV3 = Assets.get("particleSettings");
    this.emitter = new Emitter(particleContainer, particleSettings);

    // create the variables for rocket shooting
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

    // add components to container
    container.addChild(particleContainer);
    container.addChild(this.shootContainer);
    container.addChild(this);
    container.addChild(this.ammoText);
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
    this.emitter.rotate(Math.PI + this.rotation);
    this.emitter.updateSpawnPos(this.x, this.y);
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
    this.x += this.speed * Math.sin(this.rotation) * framesPassed;
    this.y -= this.speed * Math.cos(this.rotation) * framesPassed;
    this.rotation += this.rotationSpeed * framesPassed;

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
          bullet.x = this.x;
          bullet.y = this.y;
          bullet.rotation = this.rotation;
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
}
