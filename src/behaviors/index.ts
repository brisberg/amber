import {Behavior} from './behavior';
import {CONTAINER_HARVESTER_KEY, ContainerHarvester} from './containerHarvester';
import {Depositer, DEPOSITER_KEY} from './depositer';
import {EMERGENCY_MINER_KEY, EmergencyMiner} from './emergencyMiner';
import {Fetcher, FETCHER_KEY} from './fetcher';
import {Harvester, HARVESTER_KEY} from './harvester';
import {Repairer, REPAIRER_KEY} from './repairer';

/** Convenience mapping of behavior key to behavior update function. */
export const behaviors: {[name: string]: Behavior<any>} = {
  [HARVESTER_KEY]: new Harvester(),
  [REPAIRER_KEY]: new Repairer(),
  [FETCHER_KEY]: new Fetcher(),
  [DEPOSITER_KEY]: new Depositer(),
  [CONTAINER_HARVESTER_KEY]: new ContainerHarvester(),
  [EMERGENCY_MINER_KEY]: new EmergencyMiner(),
};
