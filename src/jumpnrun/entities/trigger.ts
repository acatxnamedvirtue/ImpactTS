import { igEntity, igEntityCollides, igEntityType } from "../../impact/entity";
import { igTimer } from "../../impact/timer";
import { ig } from "../../impact/impact";

/*
This entity calls the triggeredBy( entity, trigger ) method of each of its
targets. #entity# is the entity that triggered this trigger and #trigger# 
is the trigger entity itself.


Keys for Weltmeister:

checks
	Specifies which type of entity can trigger this trigger. A, B or BOTH 
	Default: A

wait
	Time in seconds before this trigger can be triggered again. Set to -1
	to specify "never" - e.g. the trigger can only be triggered once.
	Default: -1
	
target.1, target.2 ... target.n
	Names of the entities whose triggeredBy() method will be called.
*/

export class EntityTrigger extends igEntity {
  name = "trigger";
  size = { x: 32, y: 32 };

  target: Record<string, igEntity>;
  wait = -1;
  canFire = true;

  type = igEntityType.NONE;
  checkAgainst = igEntityType.A;
  collides = igEntityCollides.NEVER;

  waitTimer: igTimer;

  constructor(x: number, y: number, settings: Record<string, any>) {
    super(x, y, settings);
    this.target = settings.target;

    if (settings.checks) {
      // @ts-ignore need to figure out dynamic enum lookups
      this.checkAgainst = igEntityType[settings.checks.toUpperCase()] || igEntityType.A;
      delete settings.check;
    }

    this.waitTimer = new igTimer();
  }

  override check(other: igEntity): void {
    if (this.canFire && this.waitTimer.delta() >= 0) {
      if (typeof this.target == "object") {
        for (const t in this.target) {
          const ent = ig.game.getEntityByName(this.target[t]);
          if (ent && typeof ent.triggeredBy == "function") {
            ent.triggeredBy(other, this);
          }
        }
      }

      if (this.wait == -1) {
        this.canFire = false;
      } else {
        this.waitTimer.set(this.wait);
      }
    }
  }

  override update(): void {}
}
