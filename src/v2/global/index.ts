import HarvestBehavior from 'v2/behaviors/harvest';
import PickupBehavior from 'v2/behaviors/pickup';
import RelieveBehavior from 'v2/behaviors/relieve';
import {constructMissionFromType} from 'v2/missions';
import Mission from 'v2/missions/mission';
import {constructOperationFromType} from 'v2/operations';
import Operation from 'v2/operations/operation';
import {Registry} from 'v2/registry/registry';

/**
 * Set up all Global Objects.
 */
export function setupGlobal(): void {
  // Set up Consol Commands
  global.cc = {};
  global.cc.spawnMiner = (): void => {
    const spawn = Game.spawns.Spawn1;
    const source = spawn.room.find(FIND_SOURCES)[0];
    spawn.spawnCreep([WORK, CARRY, MOVE], 'miner1', {
      memory: {
        mission: '',
        bodyRatio: '',
        behavior: '',
        mem: global.behaviorsMap['harvest'].new(source, {}),
      },
    });
  };

  // Set up Behavior Map
  global.behaviorsMap = {
    'harvest': new HarvestBehavior(),
    'relieve': new RelieveBehavior(),
    'pickup': new PickupBehavior(),
  };

  // Set up Mission Registry
  global.msnRegistry = new Registry<Mission>(constructMissionFromType);
  global.msnRegistry.init(Memory.missions);

  // Set up Operation Registry
  global.opRegistry = new Registry<Operation>(constructOperationFromType);
  global.opRegistry.init(Memory.operations);
}
