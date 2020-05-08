import {Behavior, getBehaviorMemory} from './behavior';
import DropMiningBehavior from './drop-mining';

const dropMining = new DropMiningBehavior();

const behaviors: {[name: string]: Behavior} = {
  'dropMining': dropMining,
};

if (!global.cc) {
  global.cc = {};
  global.cc.spawnMiner = (): void => {
    const spawn = Game.spawns.Spawn1;
    const source = spawn.room.find(FIND_SOURCES)[0];
    spawn.spawnCreep([WORK, CARRY, MOVE], 'miner1', {
      memory: {
        mission: '',
        bodyRatio: '',
        behavior: '',
        mem: dropMining.new(source, {}),
      },
    });
  };
}

export const loop = (): void => {
  // Run all creep behaviors
  for (const name in Game.creeps) {
    if ({}.hasOwnProperty.call(Game.creeps, name)) {
      const creep = Game.creeps[name];

      if (creep.spawning) {
        continue;
      }

      const mem = getBehaviorMemory(creep);
      behaviors[mem.name].run(creep);
    }
  }
};
