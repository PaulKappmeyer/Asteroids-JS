import { Application, DisplayObject, Assets } from "pixi.js";
import { manifest } from "../assets";

export class SceneManager {
  private constructor() {
    /*this class is purely static. No constructor to see here*/
  }

  // Safely store variables for our game
  private static app: Application;
  private static currentScene: IScene;

  // Width and Height are read-only after creation (for now)
  private static _width: number;
  private static _height: number;

  // With getters but not setters, these variables become read-only
  public static get width(): number {
    return SceneManager._width;
  }
  public static get height(): number {
    return SceneManager._height;
  }

  // This is a promise that will resolve when Assets has been initialized.
  // Promise<unknown> means this is a promise but we don't care what value it resolves to, only that it resolves.
  private static initializeAssetsPromise: Promise<unknown>;

  // Use this function ONCE to start the entire machinery
  public static initialize(
    width: number,
    height: number,
    background: number
  ): void {
    // We store it to be sure we can use Assets later on
    SceneManager.initializeAssetsPromise = Assets.init({ manifest: manifest });

    // Black js magic to extract the bundle names into an array.
    const bundleNames = manifest.bundles.map((b) => b.name);

    // Initialize the assets and then start downloading the bundles in the background
    SceneManager.initializeAssetsPromise.then(() =>
      Assets.backgroundLoadBundle(bundleNames)
    );

    // store our width and height
    SceneManager._width = width;
    SceneManager._height = height;

    // Create our pixi app
    SceneManager.app = new Application<HTMLCanvasElement>({
      view: document.getElementById("pixi-canvas") as HTMLCanvasElement,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      backgroundColor: background,
      width: width,
      height: height,
    });

    // Add the ticker
    SceneManager.app.ticker.add(SceneManager.update);

    // listen for the browser telling us that the screen size changed
    window.addEventListener("resize", SceneManager.resize);

    // call it manually once so we are sure we are the correct size after starting
    SceneManager.resize();
  }

  // Call this function when you want to go to a new scene
  public static async changeScene(newScene: IScene): Promise<void> {
    // let's make sure our Assets were initialized correctly
    await SceneManager.initializeAssetsPromise;

    // Remove and destroy old scene... if we had one..
    if (SceneManager.currentScene) {
      SceneManager.app.stage.removeChild(SceneManager.currentScene);
      SceneManager.currentScene.destroy();
    }

    // If you were to show a loading thingy, this will be the place to show it...

    // Now, let's start downloading the assets we need and wait for them...
    await Assets.loadBundle(newScene.assetBundles);

    // If you have shown a loading thingy, this will be the place to hide it...

    // when we have assets, we tell that scene
    newScene.constructorWithAssets();

    // we now store it and show it, as it is completely created
    SceneManager.currentScene = newScene;
    SceneManager.app.stage.addChild(SceneManager.currentScene);
  }

  // This update will be called by a pixi ticker and tell the scene that a tick happened
  private static update(framesPassed: number): void {
    // Let the current scene know that we updated it...
    // Just for funzies, sanity check that it exists first.
    if (SceneManager.currentScene) {
      SceneManager.currentScene.update(framesPassed);
    }

    // as I said before, I HATE the "frame passed" approach. I would rather use `SceneManager.app.ticker.deltaMS`
  }

  public static resize(): void {
    // current screen size
    const screenWidth = Math.max(
      document.documentElement.clientWidth,
      window.innerWidth || 0
    );
    const screenHeight = Math.max(
      document.documentElement.clientHeight,
      window.innerHeight || 0
    );

    // uniform scale for our game
    const scale = Math.min(
      screenWidth / SceneManager.width,
      screenHeight / SceneManager.height
    );

    // the "uniformly englarged" size for our game
    const enlargedWidth = Math.floor(scale * SceneManager.width);
    const enlargedHeight = Math.floor(scale * SceneManager.height);

    // margins for centering our game
    const horizontalMargin = (screenWidth - enlargedWidth) / 2;
    const verticalMargin = (screenHeight - enlargedHeight) / 2;

    // now we use css trickery to set the sizes and margins
    // @ts-ignore: Object is possibly 'null'.
    SceneManager.app.view.style.width = `${enlargedWidth}px`;
    // @ts-ignore: Object is possibly 'null'.
    SceneManager.app.view.style.height = `${enlargedHeight}px`;
    // @ts-ignore: Object is possibly 'null'.
    SceneManager.app.view.style.marginLeft =
      // @ts-ignore: Object is possibly 'null'.
      SceneManager.app.view.style.marginRight = `${horizontalMargin}px`;
    // @ts-ignore: Object is possibly 'null'.
    SceneManager.app.view.style.marginTop =
      // @ts-ignore: Object is possibly 'null'.
      SceneManager.app.view.style.marginBottom = `${verticalMargin}px`;
  }
}

// This could have a lot more generic functions that you force all your scenes to have. Update is just an example.
// Also, this could be in its own file...
export interface IScene extends DisplayObject {
  update(framesPassed: number): void;

  assetBundles: string[];
  constructorWithAssets(): void;
}
