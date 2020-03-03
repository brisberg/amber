import {ClaimMission} from 'missions/claim';
import {getUsername} from 'utils/settings';

import {CLAIM_MISSION_FLAG} from '../flagConstants';

/**
 * Colonization Operation
 *
 * This operation will claim a new room as a new Colony. Claiming the
 * controller, and transporting energy to the room to build the initial Spawn.
 */

export interface ConlonizationOperationMemory {
  claimMsn: string|null;  // Claim Mission
  roomname: string;
}

export class ConlonizationOperation {
  public readonly name: string;

  private readonly flag: Flag;
  private readonly mem: ConlonizationOperationMemory;

  private claimMsn: ClaimMission|null = null;

  constructor(flag: Flag) {
    this.name = flag.name;
    this.flag = flag;

    // Init memory
    if (!Memory.operations[this.name]) {
      const mem: ConlonizationOperationMemory = {
        claimMsn: null,
        roomname: this.flag.pos.roomName,
      };
      Memory.operations[this.name] = mem;
    }
    this.mem = Memory.operations[this.name] as ConlonizationOperationMemory;
  }

  public init(): boolean {
    // Validate missions cache
    if (this.mem.claimMsn) {
      if (!Game.flags[this.mem.claimMsn]) {
        this.mem.claimMsn = null;
      } else {
        this.claimMsn = new ClaimMission(Game.flags[this.mem.claimMsn]);
      }
    }

    return true;
  }

  public run() {
    const room = Game.rooms[this.mem.roomname];
    if (room && room.controller && room.controller.owner &&
        room.controller.owner.username !== getUsername()) {
      console.log(`Retiring Colonization Operation for ${
          this.mem.roomname}. Room is not claimable or has no controller`);
      return;
    }


    if (room && room.controller && !room.controller.my && !this.claimMsn) {
      // Set up a Claim mission to supply spawn/extensions
      const claimMsn = this.setUpClaimMission(this.name + '_dist');
      claimMsn.setRoomname(this.mem.roomname);
      claimMsn.init();
      this.mem.claimMsn = claimMsn.name;
    }
    if (room && room.controller && room.controller.my && this.claimMsn) {
      // Retire claim mission
      this.claimMsn.retire();
      this.mem.claimMsn = null;
    }
  }

  private setUpClaimMission(name: string) {
    this.flag.pos.createFlag(
        name, CLAIM_MISSION_FLAG.color, CLAIM_MISSION_FLAG.secondaryColor);
    const flag = Game.flags[name];
    return new ClaimMission(flag);
  }

  public retire() {
    console.log('Retiring Colonization Operation: ' + this.name);
    if (this.claimMsn) {
      this.claimMsn.retire();
    }
    this.flag.remove();
    delete Memory.operations[this.name];
  }
}
