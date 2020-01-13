/**
 * Signature of a Behavior update function. Takes a Creep and a Memory object
 * and executes one update tick modifying the Memory object and optionally
 * triggering a Creep game action.
 *
 * Returns true if this update queued a movement command.
 *
 * TODO: Maybe this should return a result enum? (Success, error, tired, etc)
 */
export type BehaviorUpdateFunction<M extends BehaviorMemory> =
    (creep: Creep, mem: M) => boolean;

/**
 * Abstract interface for Behavior Memory. All behavior memories should
 * implement this. Mainly for standardizing sub-behaviors.
 */
export interface BehaviorMemory {
  subBehavior?: string;
  mem?: any;
}

export function clearSubBehavior(mem: BehaviorMemory) {
  delete mem.subBehavior;
  delete mem.mem;
}

/** Abstract interface for behavior classes */
interface BehaviorInterface<M extends BehaviorMemory> {
  run: BehaviorUpdateFunction<M>;
}

/**
 * Abstract Behavior base class. Extended by all other behaviors to
 * implement their specific business logic.
 */
export abstract class Behavior<M extends BehaviorMemory> implements
    BehaviorInterface<M> {
  protected abstract behaviorActions(creep: Creep, mem: M): boolean;

  /** Execute this behavior and optionally chain to sub behavior */
  public run(creep: Creep, mem: M): boolean {
    let moved = this.behaviorActions(creep, mem);

    if (!moved && mem.subBehavior) {
      moved = global.behaviors[mem.subBehavior].run(creep, mem.mem);
    }

    return moved;
  }
}
