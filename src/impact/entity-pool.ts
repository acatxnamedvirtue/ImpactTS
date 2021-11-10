import { igEntity } from "./entity";
import { inject } from "./util";

export const igEntityPool = {
  pools: {} as Record<string, igEntity[]>,

  mixin: {
    erase(): void {
      igEntityPool.putInPool(this);
    },
  },

  enableFor(Class: any): void {
    inject(Class, this.mixin);
  },

  getFromPool(classId: string, x: number, y: number, z: number, settings: Record<string, any>): igEntity {
    const pool = this.pools[classId];
    if (!pool || !pool.length) {
      return null;
    }

    const instance = pool.pop();
    instance.reset(x, y, z, settings);
    return instance;
  },

  putInPool(instance: igEntity): void {
    const classId = instance.constructor.prototype.classId as string;

    if (!this.pools[classId]) {
      this.pools[classId] = [instance];
    } else {
      this.pools[classId].push(instance);
    }
  },

  drainPool(classId: string): void {
    delete this.pools[classId];
  },

  drainAllPools(): void {
    this.pools = {};
  },
};
