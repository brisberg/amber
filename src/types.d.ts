// example declaration file - remove these and add your own custom typings

// memory extension samples
interface CreepMemory {
  role: string;
  room?: string;
  working?: boolean;
  sourceID: Id<Source>;
  containerID: Id<StructureContainer|ConstructionSite<STRUCTURE_CONTAINER>>|
      null;
}

interface Memory {
  nextID: number;
  missions: {[name: string]: any};
  uuid: number;
  log: any;
}

interface SpawnMemory {
  requests: any[];
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    // Global Spawn Queue instance
    spawnQueue:
        import('/Users/brisberg/DevProjects/amber/src/spawnQueue').SpawnQueue;
    // Console Commands
    cc: {[command: string]: () => void};
  }
}
