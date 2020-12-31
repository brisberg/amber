import {ClaimMission} from 'missions/colonization/claim';
import {BuildMission} from 'missions/core/build';
import {getUsername} from 'utils/settings';

import {BUILD_TARGET_FLAG, CLAIM_MISSION_FLAG} from '../flagConstants';

/**
 * Colonization Operation
 *
 * This operation will claim a new room as a new Colony. Claiming the
 * controller, and transporting energy to the room to build the initial Spawn.
 */

export interface ColonizeOperationMemory {
  claimMsn: string|null;  // Claim Mission
  buildMsn: string|null;  // Build Mission
  spawnSite: Id<ConstructionSite<STRUCTURE_SPAWN>>|null;
  roomname: string;
  host?: string;  // Room name of the spawngroup to use
}

export class ColonizeOperation {
  public readonly name: string;

  private readonly flag: Flag;
  private readonly mem: ColonizeOperationMemory;

  private buildMsn: BuildMission|null = null;
  private claimMsn: ClaimMission|null = null;
  private spawnSite: ConstructionSite<STRUCTURE_SPAWN>|null = null;

  constructor(flag: Flag) {
    this.name = flag.name;
    this.flag = flag;

    // Init memory
    if (!Memory.operations[this.name]) {
      const mem: ColonizeOperationMemory = {
        buildMsn: null,
        claimMsn: null,
        roomname: this.flag.pos.roomName,
        spawnSite: null,
      };
      Memory.operations[this.name] = mem;
    }
    this.mem = Memory.operations[this.name] as ColonizeOperationMemory;
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

    if (this.mem.buildMsn) {
      if (!Game.flags[this.mem.buildMsn]) {
        this.mem.buildMsn = null;
      } else {
        this.buildMsn = new BuildMission(Game.flags[this.mem.buildMsn]);
      }
    }

    if (this.mem.spawnSite) {
      if (!Game.getObjectById(this.mem.spawnSite)) {
        this.mem.spawnSite = null;
      } else {
        this.spawnSite = Game.getObjectById(this.mem.spawnSite);
      }
    }

    return true;
  }

  public run(): void {
    const room = Game.rooms[this.mem.roomname];

    if (room && !room.controller) {
      console.log(`Retiring Colonization Operation for ${
          this.mem.roomname}. Target Room has no controller`);
      return;
    }

    if (room && room.controller && room.controller.my &&
        room.find(FIND_MY_SPAWNS).length > 0) {
      // Built a new spawn, operation complete!
      console.log(`Colonization of ${room.name} complete! Retiring Operation.`);
      this.retire();
      return;
    }

    if (room && room.controller && !room.controller.my && !this.claimMsn) {
      // Set up a Claim mission to claim the target room
      const claimMsn = this.setUpClaimMission(this.name + '_claim');
      claimMsn.setRoomName(this.mem.roomname);
      claimMsn.setSpawnSource(this.spawnSource);
      claimMsn.init();
      this.mem.claimMsn = claimMsn.name;
    }
    if (room && room.controller && room.controller.my) {
      if (this.claimMsn) {
        // Retire claim mission
        this.claimMsn.retire();
        this.mem.claimMsn = null;
      }

      // Begin setting up the initial spawn
      if (!this.mem.spawnSite && room.find(FIND_MY_SPAWNS).length === 0) {
        const sites = room.find(FIND_MY_CONSTRUCTION_SITES, {
          filter: {structureType: STRUCTURE_SPAWN},
        }) as Array<ConstructionSite<STRUCTURE_SPAWN>>;
        if (sites.length === 0) {
          this.flag.pos.createConstructionSite(STRUCTURE_SPAWN);
        } else {
          this.spawnSite = sites[0];
          this.mem.spawnSite = sites[0].id;
        }
      }
    }

    // Build the spawn
    if (this.spawnSite && !this.buildMsn) {
      const buildMsn = this.setUpBuildMission(this.name + '_build');
      buildMsn.setSpawnSource(this.spawnSource);
      buildMsn.setTargetSite(this.spawnSite);
      buildMsn.useRawSource(room.find(FIND_SOURCES)[0]);
      buildMsn.init();
    }
  }

  /**
   * Get the roomName of the host colony to fuel this operation
   *
   * Caches the result in operation memory once computed.
   */
  private get spawnSource(): string {
    if (this.mem.host) {
      return this.mem.host;
    }

    let closest = {name: '', dist: 99};
    for (const name in Game.rooms) {
      if ({}.hasOwnProperty.call(Game.rooms, name)) {
        const room = Game.rooms[name];
        if (room.controller && room.controller.owner &&
            room.controller.owner.username === getUsername()) {
          const dist = Game.map.findRoute(room, this.mem.roomname);
          if (dist === ERR_NO_PATH) {
            continue;
          }

          if (dist.length < closest.dist) {
            closest = {name, dist: dist.length};
          }
        }
      }
    }

    if (closest.name === '') {
      // Throw error? No acceptable closest spawn found
      return '';
    }

    // HACK for now
    this.mem.host = 'E6S28';
    return 'E6S28';

    // this.mem.host = closest.name;
    // return closest.name;
  }

  private setUpClaimMission(name: string): ClaimMission {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const room = this.flag.room!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    room.controller!.pos.createFlag(
        name, CLAIM_MISSION_FLAG.color, CLAIM_MISSION_FLAG.secondaryColor);
    const flag = Game.flags[name];
    return new ClaimMission(flag);
  }

  private setUpBuildMission(name: string): BuildMission {
    this.flag.pos.createFlag(
        name, BUILD_TARGET_FLAG.color, BUILD_TARGET_FLAG.secondaryColor);
    const flag = Game.flags[name];
    return new BuildMission(flag);
  }

  public retire(): void {
    console.log('Retiring Colonization Operation: ' + this.name);
    if (this.claimMsn) {
      this.claimMsn.retire();
    }
    this.flag.remove();
    delete Memory.operations[this.name];
  }
}
