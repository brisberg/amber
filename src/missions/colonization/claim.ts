import {setCreepBehavior} from 'behaviors/behavior';
import {Claimer, CLAIMER} from 'behaviors/claimer';
import {
  CLAIMER as CLAIMER_BODY,
  GenerateCreepBodyOptions,
} from 'spawn-system/bodyTypes';

import {Mission, MissionMemory} from '../mission';

interface ClaimMissionMemory extends MissionMemory {
  roomName: string|null;
  controllerID: Id<StructureController>|null;
}

/**
 * Mission to claim a foreign room Controller.
 *
 * This mission will request a claimer creep.
 */
export class ClaimMission extends Mission<ClaimMissionMemory> {
  protected readonly spawnPriority = 5;
  protected readonly bodyType = CLAIMER_BODY;
  protected readonly bodyOptions: GenerateCreepBodyOptions = {
    max: {claim: 1, move: 1},
  };

  private controller: StructureController|null = null;

  constructor(flag: Flag) {
    super(flag);
  }

  protected initialMemory(): ClaimMissionMemory {
    return {
      controllerID: null,
      creeps: [],
      roomName: null,
    };
  }

  public init(): boolean {
    if (!this.mem.roomName || !Game.map.isRoomAvailable(this.mem.roomName)) {
      console.log(`Claim Mission: Room ${
          this.mem.roomName} is not available. Retiring`);
      return false;
    }

    // TODO: Validate that the room has a claimable controller
    // if (Game.rooms[this.mem.roomName] && this.mem.controllerID ||
    // !Game.getObjectById(this.mem.controllerID)) {
    //   console.log('Upgrade Mission: Controller Missing. Retiring');
    //   return false;
    // }

    if (this.mem.controllerID) {
      this.controller = Game.getObjectById(this.mem.controllerID);
    }
    return true;
  }

  public setRoomName(roomName: string): void {
    this.mem.roomName = roomName;
  }

  /** Executes one update tick for this mission */
  public run(): void {
    if (!this.mem.roomName) {
      return;
    }

    // Direct each creep to claim the controller
    this.creeps.forEach((creep) => {
      if (creep.memory.behavior !== CLAIMER) {
        // Upgrade controller
        setCreepBehavior(
            creep,
            CLAIMER,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            Claimer.initMemory(this.mem.roomName!),
        );
        creep.memory.mission = this.name;
      }
    });
  }

  private get maxClaimers(): number {
    return 1;
  }

  /**
   * @override
   * Returns true if we need another Claimer.
   */
  protected needMoreCreeps(): boolean {
    const creeps = this.getYoungCreeps();
    if (creeps.length >= this.maxClaimers) {
      return false;
    }

    return true;
  }

  /** @override */
  /** This mission is never critical. */
  protected needMoreCreepsCritical(): boolean {
    return false;
  }
}
