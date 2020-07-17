import CHarvestBehavior from 'v2/behaviors/c-harvest';
import HarvestBehavior from 'v2/behaviors/harvest';
import PickupBehavior from 'v2/behaviors/pickup';
import RelieveBehavior from 'v2/behaviors/relieve';
import {constructMissionFromType} from 'v2/missions';
import Mission from 'v2/missions/mission';
import {constructOperationFromType} from 'v2/operations';
import Operation from 'v2/operations/operation';
import {Registry} from 'v2/registry/registry';
import * as Logistics from 'v2/logistics';
import FetchBehavior from 'v2/behaviors/fetch';
import DeliverBehavior from 'v2/behaviors/deliver';

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
    'c-harvest': new CHarvestBehavior(),
    'relieve': new RelieveBehavior(),
    'pickup': new PickupBehavior(),
    'fetch': new FetchBehavior(),
    'deliver': new DeliverBehavior(),
  };

  // Set up Mission Registry
  global.msnRegistry = new Registry<Mission>(constructMissionFromType);
  global.msnRegistry.init(Memory.missions);

  // Set up Operation Registry
  global.opRegistry = new Registry<Operation>(constructOperationFromType);
  global.opRegistry.init(Memory.operations);

  // Set up Logistics Network Registry
  global.netRegistry =
    new Registry<Logistics.Network>(Logistics.constructNetworkFromName);
  global.netRegistry.init(Memory.networks);
}
