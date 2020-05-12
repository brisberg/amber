import {Behavior, getBehaviorMemory} from './behavior';
import {BehaviorSettings} from './types';

export default class BuildBehavior extends Behavior {
  protected name = 'dropMining';

  protected settings: BehaviorSettings = {
    timeout: Infinity,
    range: 3,
    blind: false,
  }

  /** Build the target site if we have energy */
  protected work(creep: Creep): number {
    return ERR_INVALID_ARGS;
  }

  /** Determines if the source is a valid target. */
  protected isValidTarget(creep: Creep): boolean {
    return false;
  }

  /** Determines if the creep can perform this task. */
  protected isValidTask(creep: Creep): boolean {
    return false;
  }
}
