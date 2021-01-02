import {EMERGENCY_MINER, EmergencyMiner} from 'behaviors/emergencyMiner';
import {CARRY_WORKER} from 'spawn-system/bodyTypes';
import {declareOrphan} from 'spawn-system/orphans';

interface EmergencyMiningMemory {
  creeps: string[];
  nextCreep?: string;
}

/**
 * Emergency Mining missions is used to bootstrap a damage or new colony.
 * Directly harvests energy from sources and feeds spawn to kickstart other
 * systems.
 */
export class EmergencyMining {
  private static maxMiners = 2;
  private static spawnPriority = 0;

  public name: string;
  public room: Room;

  private miners: Creep[] = [];
  private mem: EmergencyMiningMemory;

  constructor(name: string, room: Room) {
    this.name = name;
    this.room = room;

    if (!Memory.missions[name]) {
      const mem: EmergencyMiningMemory = {
        creeps: [],
      };
      Memory.missions[name] = mem;
    }
    this.mem = Memory.missions[name] as EmergencyMiningMemory;

    this.miners = this.mem.creeps.map((cName) => Game.creeps[cName]);
  }

  /** Executes one update tick for this mission */
  public run(): void {
    // Claim reserved creep if it exists
    if (this.mem.nextCreep && Game.creeps[this.mem.nextCreep]) {
      const creep = Game.creeps[this.mem.nextCreep];
      this.mem.creeps.push(creep.name);
      this.miners.push(creep);
      delete this.mem.nextCreep;
    } else {
      // Oh well, it wasn't spawned afterall
      delete this.mem.nextCreep;
    }

    // Check for creep allocation
    if (this.miners.length < EmergencyMining.maxMiners) {
      // Request another miner
      const spawn = this.room.find(FIND_MY_SPAWNS)[0];
      const source = spawn.pos.findClosestByPath(FIND_SOURCES);
      const queue = global.spawnQueues[this.room.name];
      if (!queue) {
        return;
      }
      this.mem.nextCreep = queue.requestCreep({
        bodyRatio: CARRY_WORKER,
        mission: this.name,
        options: {
          memory: {
            behavior: EMERGENCY_MINER,
            bodyRatio: CARRY_WORKER,  // not needed
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            mem: EmergencyMiner.initMemory(spawn, source!),
            mission: this.name,  // not needed
          },
        },
        priority: EmergencyMining.spawnPriority,
      });
    }
  }

  /**
   * Cleans up the memory associated with this missions, returns the list names
   * of orphaned creeps.
   */
  public static cleanup(name: string): string[] {
    const creeps: string[] = Memory.missions[name].creeps;
    creeps.forEach((cName) => declareOrphan(Game.creeps[cName]));
    delete Memory.missions[name];
    return creeps;
  }
}
