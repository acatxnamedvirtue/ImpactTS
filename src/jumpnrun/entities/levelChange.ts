import { igEntity } from "../../impact/entity";
import { ig } from "../../impact/impact";

import LevelSnowhills from "../levels/snowhills.json";
import LevelGrasslands from "../levels/grasslands.json";

import { entityMap } from "../main";
import { EntityTrigger } from "./trigger";

const levelMap = {
  LevelSnowhills,
  LevelGrasslands,
};

/*
This entity calls ig.game.loadLevel() when its triggeredBy() method is called -
usually through an EntityTrigger entity.


Keys for Weltmeister:

level
	Name of the level to load. E.g. "LevelTest1" or just "test1" will load the 
	'LevelTest1' level.
*/

export class EntityLevelChange extends igEntity {
  size = { x: 32, y: 32 };
  level: string | null;

  constructor(x: number, y: number, settings: Record<string, any>) {
    super(x, y, settings);
    this.level = settings.level;
  }

  triggeredBy(_entity: igEntity, _trigger: EntityTrigger): void {
    if (this.level) {
      const levelName = this.level.replace(/^(Level)?(\w)(\w*)/, function (_m: any, _l: any, a: string, b: string) {
        return a.toUpperCase() + b;
      });

      const key = `Level${levelName}` as keyof typeof levelMap;
      ig.game.loadLevelDeferred(levelMap[key], entityMap);
    }
  }

  override update(): void {}
}
