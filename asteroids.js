// Aliases
const Application = PIXI.Application;
const loader = PIXI.Loader.shared;
const resources = PIXI.Loader.shared.resources;
const Sprite = PIXI.Sprite;
const Container = PIXI.Container;

// Create a Pixi Application
let windowSize = [0, 0];
const app = new Application({
  autoResize: true,
  autoDensity: true, // Handles high DPI screens
  antialias: true, // default: false
  transparent: false, // default: false
  resolution: devicePixelRatio, // default: 1
  backgroundColor: 0x000000, // default: 0x000000
});
// Add the canvas that Pixi automatically created for you to the HTML document
document.querySelector("#frame").appendChild(app.view);

// Listen for window resize events (TODO: fix resolution/scaling and resizing)
window.addEventListener("resize", resize);
// Resize function window
function resize() {
  // Get the parent node
  const parent = app.view.parentNode;

  // Resize the renderer
  app.renderer.resize(parent.clientWidth, parent.clientHeight);
  windowSize = [parent.clientWidth, parent.clientHeight];
}
resize();

// load an image and run the `setup` function when it's done
loader
  .add("images/rocket.png")
  .add("images/rocket-boost.png")
  .load(setup);

// Define any variables that are used in more than one function
let gamestate;
let gameScene;
let rocket;

// Capture the keyboard arrow keys
const UP_KEY = keyboard("ArrowUp");
const W_KEY = keyboard("w");

const DOWN_KEY = keyboard("ArrowDown");
const S_KEY = keyboard("s");

const LEFT_KEY = keyboard("ArrowLeft");
const A_KEY = keyboard("a");

const RIGHT_KEY = keyboard("ArrowRight");
const D_KEY = keyboard("d");

const SPACEBAR_KEY = keyboard(32);

// physic constants
const FRICTION = 0.1;
const ROTATION_FRICTION = 0.0025;

//This `setup` function will run when the image has loaded
function setup() {
  // Make the game scene and add it to the stage
  gameScene = new Container();
  app.stage.addChild(gameScene);

  // Create the rocket sprite
  rocket = new Sprite(resources["images/rocket.png"].texture);
  rocket.scale.set(0.25, 0.25);
  rocket.anchor.set(0.5, 0.5);
  rocket.position.set(windowSize[0] / 2, windowSize[1] / 2);
  // variables for rocket movement
  rocket.accelerationBoost = 0.5; // applied when up key pressed
  rocket.maxSpeed = 10;
  rocket.speed = 0;
  rocket.acceleration = 0;
  // variables for rocket rotation
  rocket.rotationAccelerationBoost = 0.01; // applied when left/right key pressed
  rocket.maxRotationSpeed = 0.075;
  rocket.rotationSpeed = 0;
  rocket.rotationAcceleration = 0;
  // add the rocket to the scene
  gameScene.addChild(rocket);

  // Set the game state
  gamestate = gamePlaying;

  // Start the game loop
  app.ticker.add((delta) => gameLoop(delta));
}

// main game loop
function gameLoop(delta) {
  // Update the current game state:
  gamestate(delta);
}

// game state = playing
function gamePlaying(delta) {
  // ------------------------------------------ update player movement:
  // update texture
  rocket.texture = resources["images/rocket.png"].texture;

  // apply friction and check for complete stop of motion
  if (Math.abs(rocket.speed) > FRICTION) {
    rocket.acceleration = -Math.sign(rocket.speed) * FRICTION;
  } else {
    rocket.acceleration = 0;
    rocket.speed = 0;
  }

  if (Math.abs(rocket.rotationSpeed) > ROTATION_FRICTION) {
    rocket.rotationAcceleration =
      -Math.sign(rocket.rotationSpeed) * ROTATION_FRICTION;
  } else {
    rocket.rotationAcceleration = 0;
    rocket.rotationSpeed = 0;
  }

  // check keyboard input: apply boost
  if (UP_KEY.isDown || W_KEY.isDown) {
    rocket.texture = resources["images/rocket-boost.png"].texture;
    rocket.acceleration += rocket.accelerationBoost;
  }
  if (DOWN_KEY.isDown || S_KEY.isDown) {
    rocket.texture = resources["images/rocket-boost.png"].texture;
    rocket.acceleration += -rocket.accelerationBoost * 0.5;
  }
  if (LEFT_KEY.isDown || A_KEY.isDown) {
    rocket.rotationAcceleration += -rocket.rotationAccelerationBoost;
  }
  if (RIGHT_KEY.isDown || D_KEY.isDown) {
    rocket.rotationAcceleration += rocket.rotationAccelerationBoost;
  }

  // update speed: v += a * dt
  newSpeed = rocket.speed + rocket.acceleration * delta;
  rocket.speed = clamp(newSpeed, -rocket.maxSpeed * 0.5, rocket.maxSpeed);

  newRotationSpeed = rocket.rotationSpeed + rocket.rotationAcceleration * delta;
  rocket.rotationSpeed = clamp(
    newRotationSpeed,
    -rocket.maxRotationSpeed,
    rocket.maxRotationSpeed
  );

  // update player position and rotation: pos += v * dt
  rocket.x += rocket.speed * Math.sin(rocket.rotation) * delta;
  rocket.y -= rocket.speed * Math.cos(rocket.rotation) * delta;
  rocket.rotation += rocket.rotationSpeed * delta;

  // loop rocket around edges
  while (rocket.x < 0) {
    rocket.x += windowSize[0];
  }
  while (rocket.x > windowSize[0]) {
    rocket.x -= windowSize[0];
  }
  while (rocket.y < 0) {
    rocket.y += windowSize[1];
  }
  while (rocket.y > windowSize[1]) {
    rocket.y -= windowSize[1];
  }
}

// ------------------------------------------------------- Helper
// helper function for math
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// helper function for keyboard input
function keyboard(value) {
  const key = {};
  key.value = value;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  // The `downHandler`
  key.downHandler = (event) => {
    if (event.key === key.value) {
      if (key.isUp && key.press) {
        key.press();
      }
      key.isDown = true;
      key.isUp = false;
      event.preventDefault();
    }
  };

  // The `upHandler`
  key.upHandler = (event) => {
    if (event.key === key.value) {
      if (key.isDown && key.release) {
        key.release();
      }
      key.isDown = false;
      key.isUp = true;
      event.preventDefault();
    }
  };

  // Attach event listeners
  const downListener = key.downHandler.bind(key);
  const upListener = key.upHandler.bind(key);

  window.addEventListener("keydown", downListener, false);
  window.addEventListener("keyup", upListener, false);

  // Detach event listeners
  key.unsubscribe = () => {
    window.removeEventListener("keydown", downListener);
    window.removeEventListener("keyup", upListener);
  };

  return key;
}
