import { igFont, igFontAlign } from "../impact/font";
import { igGame, WMData } from "../impact/game";
import { igImage } from "../impact/image";
import { ig } from "../impact/impact";
import { Camera } from "./plugins/camera";
import LevelGrasslands from "./levels/grasslands.json";
import LevelTitle from "./levels/title.json";

import { EntityBlob } from "./entities/blob";
import { EntityCoin } from "./entities/coin";
import { EntityFireball } from "./entities/fireball";
import { EntityHurt } from "./entities/hurt";
import { EntityLevelChange } from "./entities/levelChange";
import { EntityPlayer } from "./entities/player";
import { EntityTrigger } from "./entities/trigger";
import { KEYS } from "../impact/input";
import { igEntity } from "../impact/entity";

export const entityMap: Record<string, typeof igEntity> = {
  EntityBlob,
  EntityCoin,
  EntityFireball,
  EntityHurt,
  EntityLevelChange,
  EntityPlayer,
  EntityTrigger,
};

export class MyGame extends igGame {
  player: EntityPlayer = null;
  currentLevel: WMData;
  camera: Camera = null;
  clearColor = "#d0f4f7";
  gravity = 800; // All entities are affected by this

  // Load a font
  font = new igFont("media/fredoka-one.font.png");

  // HUD icons
  heartFull = new igImage("media/heart-full.png");
  heartEmpty = new igImage("media/heart-empty.png");
  coinIcon = new igImage("media/coin.png");

  constructor() {
    super();

    // We want the font's chars to slightly touch each other,
    // so set the letter spacing to -2px.
    this.font.letterSpacing = -2;

    // Load the LevelGrasslands as required above
    this.currentLevel = LevelGrasslands;
    this.loadLevel(LevelGrasslands, entityMap);
  }

  loadLevel(data: WMData, entityMap: Record<string, any>): void {
    this.currentLevel = data;

    super.loadLevel(data, entityMap);
    this.player = this.getEntitiesByType(EntityPlayer)[0] as EntityPlayer;
    this.setupCamera();
  }

  setupCamera(): void {
    // Set up the camera. The camera's center is at a third of the screen
    // size, i.e. somewhat shift left and up. Damping is set to 3px.
    this.camera = new Camera(ig.system.width / 3, ig.system.height / 3, 3);

    // The camera's trap (the deadzone in which the player can move with the
    // camera staying fixed) is set to according to the screen size as well.
    this.camera.trap.size.x = ig.system.width / 10;
    this.camera.trap.size.y = ig.system.height / 3;

    // The lookahead always shifts the camera in walking position; you can
    // set it to 0 to disable.
    this.camera.lookAhead.x = ig.system.width / 6;

    // Set camera's screen bounds and reposition the trap on the player
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore hmmm what is up with pxWidth and pxHeight?
    this.camera.max.x = this.collisionMap.pxWidth - ig.system.width;
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore hmmm what is up with pxWidth and pxHeight?
    this.camera.max.y = this.collisionMap.pxHeight - ig.system.height;

    if (this.player) {
      this.camera.set(this.player);
    }
  }

  reloadLevel(): void {
    this.loadLevelDeferred(this.currentLevel, entityMap);
  }

  update(): void {
    // Update all entities and BackgroundMaps
    super.update();

    // Camera follows the player
    this.camera.follow(this.player);

    // Instead of using the camera plugin, we could also just center
    // the screen on the player directly, like this:
    // this.screen.x = ig.system.width / 2;
    // this.screen.y = ig.system.height / 2;
  }

  draw(): void {
    // Call the parent implementation to draw all Entities and BackgroundMaps
    super.draw();

    // Draw the heart and number of coins in the upper left corner.
    // 'this.player' is set by the player's init method
    if (this.player) {
      let x = 16;
      const y = 16;

      for (let i = 0; i < this.player.maxHealth; i++) {
        // Full or empty heart?
        if (this.player.health > i) {
          this.heartFull.draw(x, y);
        } else {
          this.heartEmpty.draw(x, y);
        }

        x += this.heartEmpty.width + 8;
      }

      // We only want to draw the 0th tile of coin sprite-sheet
      x += 48;
      this.coinIcon.drawTile(x, y + 6, 0, 36);

      x += 42;
      this.font.draw("x " + this.player.coins, x, y + 10);
    }
  }
}

export class MyTitle extends igGame {
  clearColor = "#d0f4f7";
  gravity = 800;
  maxY = 0;
  titleAlpha = 1;

  // The title image
  title = new igImage("media/title.png");

  // Load a font
  font = new igFont("media/fredoka-one.font.png");

  constructor() {
    super();

    // Bind keys
    ig.input.bind(KEYS.LEFT_ARROW, "left");
    ig.input.bind(KEYS.RIGHT_ARROW, "right");
    ig.input.bind(KEYS.X, "jump");
    ig.input.bind(KEYS.C, "shoot");

    // ig.input.bind(ig.GAMEPAD.PAD_LEFT, 'left');
    // ig.input.bind(ig.GAMEPAD.PAD_RIGHT, 'right');
    // ig.input.bind(ig.GAMEPAD.FACE_1, 'jump');
    // ig.input.bind(ig.GAMEPAD.FACE_2, 'shoot');
    // ig.input.bind(ig.GAMEPAD.FACE_3, 'shoot');

    // We want the font's chars to slightly touch each other,
    // so set the letter spacing to -2px.
    this.font.letterSpacing = -2;

    this.loadLevel(LevelTitle, entityMap);
    this.maxY = this.backgroundMaps[0].pxHeight - ig.system.height;
  }

  update(): void {
    // Check for buttons; start the game if pressed
    if (ig.input.pressed("jump") || ig.input.pressed("shoot")) {
      ig.system.setGame(MyGame);
      return;
    }

    super.update();

    // Scroll the screen down; apply some damping.
    const move = this.maxY - this.screen.y;
    if (move > 5) {
      this.screen.y += move * ig.system.tick;
      this.titleAlpha = this.screen.y / this.maxY;
    }
    this.screen.x = (this.backgroundMaps[0].pxWidth - ig.system.width) / 2;
  }

  draw(): void {
    super.draw();

    const cx = ig.system.width / 2;
    this.title.draw(cx - this.title.width / 2, 60);

    const startText = ig.ua.mobile ? "Press Button to Play!" : "Press X or C to Play!";

    this.font.draw(startText, cx, 420, igFontAlign.CENTER);
  }
}
