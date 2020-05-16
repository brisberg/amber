import {setCreepBehavior} from 'behaviors/behavior';
import {CLAIM_ATTTACK, ClaimAttacker} from 'behaviors/claimAttack';
import {
  CLAIMER as CLAIMER_BODY,
  GenerateCreepBodyOptions,
} from 'spawn-system/bodyTypes';

import {Mission, MissionMemory} from './mission';

interface AttackControllerMissionMemory extends MissionMemory {
  roomName: string|null;
  controllerID: Id<StructureController>|null;
}

/**
 * Mission to attack a foreign room Controller.
 *
 * This mission will request a claimer creep.
 */
export class AttackControllerMission extends
    Mission<AttackControllerMissionMemory> {
  protected readonly spawnPriority = 5;
  protected readonly bodyType = CLAIMER_BODY;
  protected readonly bodyOptions: GenerateCreepBodyOptions = {
    max: {claim: 5, move: 5},
  };

  private controller: StructureController|null = null;

  constructor(flag: Flag) {
    super(flag);
  }

  protected initialMemory(): AttackControllerMissionMemory {
    return {
      controllerID: null,
      creeps: [],
      roomName: null,
    };
  }

  public init(): boolean {
    if (!this.mem.roomName || !Game.map.isRoomAvailable(this.mem.roomName)) {
      console.log(`Attack controller Mission: Room ${
          this.mem.roomName} is not available. Retiring`);
      return false;
    }

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
      if (creep.memory.behavior !== CLAIM_ATTTACK) {
        // Upgrade controller
        setCreepBehavior(
            creep,
            CLAIM_ATTTACK,
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            ClaimAttacker.initMemory(this.mem.roomName!),
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
