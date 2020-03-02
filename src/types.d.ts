// example declaration file - remove these and add your own custom typings

// memory extension samples
interface CreepMemory {
  mission: string|null;
  bodyRatio: string;
  behavior: string;
  mem: any;
}

interface Memory {
  auto?: {[subsystem: string]: boolean};
  pauseUtil?: number;  // Script paused until this Game Tick
  nextID: number;
  missions: {[name: string]: any};
  operations: {[name: string]: any};
  uuid: number;
  log: any;
}

interface RoomMemory {
  damaged: Array<Id<Structure>>;  // List of damaged structures
  network: any;                   // Energy Network Memory
}

interface FlagMemory {
  state?: any;
}

// `global` extension samples
declare namespace NodeJS {
  interface Global {
    // Global creep behavior registry
    behaviors: import('./behaviors').BehaviorMap;
    // Global tower behavior registry
    tower: import('./towers/tower').TowerBehavior;
    // Global creep behavior registry
    missions: import('./missions').MissionMap;
    // Global creep behavior registry
    operations: import('./operations').OperationMap;
    // Global Spawn Queue instances
    spawnQueues: {
      [roomname: string]: import('./spawn-system/spawnQueue').SpawnQueue,
    };
    // Global Energy Network instance
    eNetwork: import('./energy-network/roomEnergyNetwork').RoomEnergyNetwork;
    // Console Commands
    cc: {[command: string]: (...args: any) => any};
  }
}
