// example declaration file - remove these and add your own custom typings

// memory extension samples
interface CreepMemory {
  mission: string|null;
  bodyType: string;
  behavior: string;
  mem: any;
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

interface FlagMemory {
  state?: any;
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    // Global Spawn Queue instance
    spawnQueue: import('./spawn-system/spawnQueue').SpawnQueue;
    // Global Energy Network instance
    eNetwork: import('./energy-network/roomEnergyNetwork').RoomEnergyNetwork;
    // Console Commands
    cc: {[command: string]: (args: any) => void};
  }
}
