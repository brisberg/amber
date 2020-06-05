import {WORKER} from 'spawn-system/bodyTypes';

export interface SingleHarvestMsnMemory {
  creep?: string;        // Creep name
  replacement?: string;  // Creep name
  sourceIdx: number;
}

/**
 * SingleHarvestMsn is a specialized mission to maintain a single harvest creep
 * on a source at a specific location. Utilizing drop mining.
 *
 * If the position contains a container, the creep will repair it when damaged.
 */
export default class SingleHarvestMsn {
  private flag: Flag;
  private source: Source|null = null;
  private container: StructureContainer|null = null;
  private creep: Creep|null = null;
  private replacement: Creep|null = null;

  protected name: string;
  protected mem: SingleHarvestMsnMemory;

  constructor(flag: Flag) {
    this.flag = flag;
    this.name = flag.name;
    this.mem = Memory.missions[this.name];
  }

  public init(): void {
    const room = this.flag.room;

    if (room) {
      this.source = room.find(FIND_SOURCES)[this.mem.sourceIdx];
      this.creep = Game.creeps[this.mem.creep || ''] || null;
      this.replacement = Game.creeps[this.mem.replacement || ''] || null;

      const conts = this.flag.pos.findInRange(FIND_MY_STRUCTURES, 0, {
        filter: {
          structureType: STRUCTURE_CONTAINER,
        },
      });
      if (conts.length > 0) {
        this.container = conts[0] as unknown as StructureContainer;
      }
    }
  }

  public valid(): boolean {
    if (!this.source) {
      return false;
    }

    return true;
  }

  public run(): void {
    // Purge old names
    // if (!Game.creeps[this.mem.creep])

    // Request new creeps
    if (!this.creep) {
      this.mem.creep = global.spawnQueues[this.flag.pos.roomName].requestCreep({
        bodyOptions: {max: {work: 6}},
        bodyRatio: WORKER,
        mission: this.name,
        priority: 1,
      });
      return;
    }

    if ((this.creep.ticksToLive || CREEP_LIFE_TIME) < 100 &&
        !this.mem.replacement) {
      this.mem.replacement =
          global.spawnQueues[this.flag.pos.roomName].requestCreep({
            bodyOptions: {max: {work: 6}},
            bodyRatio: WORKER,
            mission: this.name,
            priority: 1,
          });
    }
  }
}
