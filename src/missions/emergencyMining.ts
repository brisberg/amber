import {SpawnReservation} from 'spawnQueue';
import {createWorkerBody} from 'utils/workerUtils';

interface EmergencyMiningMemory {
  creeps: string[];
  nextId: number;
  reservations: SpawnReservation[];
}

export class EmergencyMining {
  private static maxMiners = 3;
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
        nextId: 0,
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
      const name = this.name + this.mem.nextId;
      const res = global.spawnQueue.requestCreep({
        body: this.createMinerBody(),
        name,
        options: {
          memory: {
            containerID: null,
            role: 'miner',
            sourceID: this.room.find(FIND_SOURCES)[0].id,
          },
        },
        priority: EmergencyMining.spawnPriority,
      });
      this.mem.reservations.push(res);
      this.mem.nextId++;
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
}
