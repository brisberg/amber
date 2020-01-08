import {Harvester} from 'roles/harvester';
import {createWorkerBody} from 'utils/workerUtils';

interface SpawnReservation {
  creepName: string;
}

interface MiningMemory {
  harvesters: string[];
  nextId: number;
  reservations: SpawnReservation[];
  sourceId: Id<Source>|null;
}

export class Mining {
  private static spawnPriority = 1;

  public name: string;
  public room: Room;
  public source: Source;

  private harvesters: Creep[] = [];
  private mem: MiningMemory;

  constructor(name: string, source: Source) {
    this.name = name;
    this.room = source.room;
    this.source = source;

    // Init memory
    if (!Memory.missions[name]) {
      const mem: MiningMemory = {
        harvesters: [],
        nextId: 0,
        reservations: [],
        sourceId: source.id,
      };
      Memory.missions[name] = mem;
    }
    this.mem = Memory.missions[name] as MiningMemory;

    this.harvesters = this.mem.harvesters.map((cName) => Game.creeps[cName]);
  }

  /** Executes one update tick for this mission */
  public run() {
    // Check for creep allocation
    if ((this.harvesters.length + this.mem.reservations.length) < 2) {
      this.requestHarvester();
    }

    // Claim reserved creeps
    this.mem.reservations = this.mem.reservations.filter((reserve) => {
      const creep = Game.creeps[reserve.creepName];
      if (creep) {
        this.mem.harvesters.push(reserve.creepName);
        this.harvesters.push(creep);
        return false;
      }
      return true;
    });

    // Execute creep update ticks
    this.harvesters.forEach((creep) => {
      const harvester = new Harvester(creep);
      harvester.run();
    });
  }

  private requestHarvester() {
    // Request another harvester
    const name = this.name + this.mem.nextId;
    global.spawnQueue.requestCreep({
      body: this.createHarvesterBody(),
      name,
      options: {
        memory: {
          containerID: null,
          role: 'harvester',
          sourceID: this.room.find(FIND_SOURCES)[0].id,
        },
      },
      priority: Mining.spawnPriority,
    });
    this.mem.reservations.push({creepName: name});
    this.mem.nextId++;
  }

  private createHarvesterBody() {
    return createWorkerBody(2, 1, 1);
  }
}
