import {EMERGENCY_MINER, EmergencyMiner} from 'behaviors/emergencyMiner';
import {declareOrphan} from 'spawn-system/orphans';
import {SpawnReservation} from 'spawn-system/spawnQueue';
import {createWorkerBody} from 'utils/workerUtils';

interface EmergencyMiningMemory {
  creeps: string[];
  reservations: SpawnReservation[];
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
      Memory.missions[name] = {
        creeps: [],
        reservations: [],
      };
    }
    this.mem = Memory.missions[name] as EmergencyMiningMemory;

    this.miners = this.mem.creeps.map((cName) => Game.creeps[cName]);
  }

  /** Executes one update tick for this mission */
  public run() {
    // Check for creep allocation
    if ((this.miners.length + this.mem.reservations.length) <
        EmergencyMining.maxMiners) {
      // Request another miner
      const name = this.name + Game.time;
      const spawn = this.room.find(FIND_MY_SPAWNS)[0];
      const source = spawn.pos.findClosestByPath(FIND_SOURCES);
      const res = global.spawnQueue.requestCreep({
        body: this.createMinerBody(),
        bodyType: 'miner',
        name,
        options: {
          memory: {
            behavior: EMERGENCY_MINER,
            bodyType: 'worker',  // carryminer
            mem: EmergencyMiner.initMemory(spawn, source!),
            mission: this.name,
          },
        },
        priority: EmergencyMining.spawnPriority,
      });
      if (res instanceof Creep) {
        res.memory.mission = this.name;
        this.miners.push(res);
      } else {
        this.mem.reservations.push(res);
      }
    }

    // Claim reserved creeps
    this.mem.reservations = this.mem.reservations.filter((reserve) => {
      const creep = Game.creeps[reserve.name];
      if (creep) {
        this.mem.creeps.push(reserve.name);
        this.miners.push(creep);
        return false;
      }
      return true;
    });
  }

  private createMinerBody() {
    return createWorkerBody(1, 2, 2);
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
