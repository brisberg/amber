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
function getBehaviorMemory(creep: Creep): BehaviorMemory {
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
  getTarget(mem: BehaviorMemory): RoomObject|null {
    return Game.getObjectById(mem.target.id);
  }


  // Abstract methods for sub-behaviors to implement

  /** Check if the work has been completed */
  protected abstract isValidTask(creep: Creep): boolean;

  /** Check if the target is still valid for this behavior */
  protected abstract isValidTarget(creep: Creep): boolean;

  /** Perform the behavior. Implemented in sub-behaviors */
  protected abstract work(creep: Creep): number;

  /**
   * Test if the task is valid; if it is not, automatically remove task and
   * transition to parent
   */
  isValid(creep: Creep): boolean {
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
      // this.finish();
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
   * Takes a Creep and a Memory object and executes one update tick
   * modifying the Memory object and optionally triggering a Creep game
   * action.
   *
   * Returns true if this update queued a movement command.
   *
   * TODO: Maybe this should return a result enum? (Success, error, tired,
   * etc)
   */
  protected abstract behaviorActions(creep: Creep, mem: BehaviorMemory):
      boolean;

  /** Execute this behavior and optionally chain to sub behavior */
  public run(creep: Creep): boolean {
    const mem = getBehaviorMemory(creep);
    const moved = this.behaviorActions(creep, mem);

    // if behavior is finished, switch to parent

    return moved;
  }
}
