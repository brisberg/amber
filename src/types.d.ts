// example declaration file - remove these and add your own custom typings

// memory extension samples
interface CreepMemory {
  role: string;
  room?: string;
  working?: boolean;
  phase?: string;
  sourceID?: Id<Source>;
  structID?: Id<StructureContainer|StructureStorage|StructureLink>;
  containerID?: Id<StructureContainer|ConstructionSite<STRUCTURE_CONTAINER>>|
      null;
  targetSiteID?: Id<ConstructionSite>;
  controllerID?: Id<StructureController>;
  energyNode?: any;
}

interface Memory {
  nextID: number;
  missions: {[name: string]: any};
  spawns: {[name: string]: any};
  operations: {[name: string]: any};
  uuid: number;
  log: any;
}

interface RoomMemory {
  network: any;
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
    cc: {[command: string]: (args: any) => void};
  }
}
