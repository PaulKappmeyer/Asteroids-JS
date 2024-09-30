import { SceneManager } from "./SceneManager";
import { Keyboard } from "./Keyboard";
import { GameScene } from "./scenes/GameScene";

// initalize keyboard input
Keyboard.initialize();

SceneManager.initialize(1920, 1080, 0x000000);

const game: GameScene = new GameScene();
SceneManager.changeScene(game);
