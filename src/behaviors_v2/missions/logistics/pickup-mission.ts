import {HAULER} from 'spawn-system/bodyTypes';

import {Mission, MissionMemory} from '../../../missions/mission';

import PickupBehavior from '../../behaviors/pickup';

interface PickupMemory extends MissionMemory {
  resID: Id<Resource>|null;
}

/**
 * Mission construct to facilitate transporting energy from loose resource piles
 * to spawn.
 *
 * This mission will maintain a single creep (up to 4 carry in size)
 * transporting energy from loose piles to spawn. It will request new ones and
 * relieve the older creep when it arrives.
 */
export class PickupMission extends Mission<PickupMemory> {
  public resource: Resource|null = null;

  protected readonly bodyType: string = HAULER;
  protected readonly bodyOptions = {
    max: {carry: 4},
  };
  protected readonly spawnPriority = 2;

  constructor(flag: Flag) {
    super(flag);
  }

  public setResource(resource: Resource): void {
    this.resource = resource;
    this.mem.resID = resource.id;
  }

  /** @override */
  protected initialMemory(): PickupMemory {
    return {
      creeps: [],
      resID: null,
    };
  }

  /** @override */
  public init(): boolean {
    if (!this.mem.resID || !Game.getObjectById(this.mem.resID)) {
      return false;
    }

    const res = Game.getObjectById(this.mem.resID);
    this.resource = res;
    return true;
  }

  /** Executes one update tick for this mission */
  public run(): void {
    if (!this.resource) return;

    const resource = this.resource;
    this.creeps.forEach((hauler, index) => {
      if (index === 0) {
        // Reassign the haulers if they were given to us
        if (hauler.memory.mem.name !== 'pickup') {
          hauler.memory.mem = new PickupBehavior().new(resource);
        }
      }
    });
  }

  /**
   * @override
   * Returns true if we need another hauler.
   *
   */
  protected needMoreCreeps(): boolean {
    const creeps = this.getYoungCreeps();
    if (creeps.length >= 1) {
      return false;
    }

    return true;
  }
}
