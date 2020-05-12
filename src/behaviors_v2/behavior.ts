import {
  BehaviorMemory,
  BehaviorOptions,
  BehaviorSettings,
} from './types';


/**
 * Cleanly modifies the given creep's memory to change its behavior class.
 */
export function setCreepBehavior<M>(creep: Creep, memory: M): void {
  creep.memory.mem = memory;
}

/** Utility function to fetch the current behavior memory from a creep */
export function getBehaviorMemory(creep: Creep): BehaviorMemory {
  return creep.memory.mem as BehaviorMemory;
}

/**
 * Abstract Behavior base class. Extended by all other behaviors to
 * implement their specific business logic.
 *
 * Includes logic to move to the target site, do the behavior, check if the
 * behavior is completed or no longer valid.
 */
export abstract class Behavior {
  /** Settings object unique to each Behavior Type */
  protected abstract settings: BehaviorSettings;
  /** Unique name for this behavior */
  protected abstract name: string;

  // Abstract methods for sub-behaviors to implement

  /** Check if the work has been completed */
  protected abstract isValidTask(creep: Creep): boolean;

  /** Check if the target is still valid for this behavior */
  protected abstract isValidTarget(creep: Creep): boolean;

  /** Perform the behavior. Implemented in sub-behaviors */
  protected abstract work(creep: Creep): number;

  /** Returns a new behavior memory */
  public new(target: RoomObject&{id: string}, options: BehaviorOptions = {}):
      BehaviorMemory {
    return {
      name: this.name,
      target: {
        id: target.id,
        pos: {
          x: target.pos.x,
          y: target.pos.y,
          room: target.pos.roomName,
        },
      },
      options,
      tick: Game.time,
      data: {},
    };
  }

  /** Returns the Target object */
  protected getTarget(mem: BehaviorMemory): RoomObject|null {
    return Game.getObjectById(mem.target.id);
  }

  /**
   * Move to within range of the target
   */
  protected moveToTarget(creep: Creep, range = this.settings.range): number {
    const tar = this.getTarget(getBehaviorMemory(creep));
    if (tar) {
      return creep.moveTo(tar.pos.x, tar.pos.y, {range: range});
    }
    return ERR_INVALID_TARGET;
  }

  /**
   * Test if the task is valid; if it is not, automatically remove task and
   * transition to parent
   */
  public isValid(creep: Creep): boolean {
    const mem = getBehaviorMemory(creep);
    let validTask = false;
    if (creep) {
      validTask = this.isValidTask(creep) &&
          Game.time - mem.tick < this.settings.timeout;
    }
    let validTarget = false;
    if (this.getTarget(mem)) {
      validTarget = this.isValidTarget(creep);
    } else if (
        (this.settings.blind || mem.options.blind) &&
        !Game.rooms[mem.target.pos.room]) {
      // If you can't see the target's room but you have blind enabled, then
      // that's okay
      validTarget = true;
    }
    // Return if the task is valid; if not, finalize/delete the task and return
    // false
    if (validTask && validTarget) {
      return true;
    } else {
      // Switch to parent task if there is one
      this.finish();
      const isValid = mem.parent ? this.isValid(creep) : false;
      return isValid;
    }
  }

  /** Determine if the creep is in range to perform the work */
  protected isWorking(creep: Creep): boolean {
    const mem = getBehaviorMemory(creep);
    return creep.pos.inRangeTo(
        mem.target.pos.x,
        mem.target.pos.y,
        this.settings.range,
    );
    // TODO: Check if creep is on edge
  }

  /**
   * Execute this behavior returns work() result or nothing if no work was done.
   */
  public run(creep: Creep): number|undefined {
    if (this.isWorking(creep)) {
      // delete this.creep.memory._go;
      // if (this.settings.workOffRoad) { // this is disabled as movement
      // priorities makes it unnecessary
      //  // Move to somewhere nearby that isn't on a road
      //  this.creep.park(this.targetPos, true);
      // }
      const result = this.work(creep);
      // if (this.settings.oneShot && result === OK) {
      //  this.finish();
      // }
      return result;
    } else {
      this.moveToTarget(creep);
      return;
    }
  }

  /**
   * Finalize the task and switch to parent task (or null if there is none)
   */
  finish(): void {
    // this.moveToNextPos();
    // if (creep) {
    //  creep.task = this.parent;
    // } else {
    //  log.debug(`No creep executing ${this.name}! Proto:
    // ${JSON.stringify(this.proto)}`);
    // }
  }
}
