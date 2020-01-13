import {Behavior} from './behavior';
import {Builder, BUILDER} from './builder';
import {CONTAINER_HARVESTER, ContainerHarvester} from './containerHarvester';
import {Depositer, DEPOSITER} from './depositer';
import {EMERGENCY_MINER, EmergencyMiner} from './emergencyMiner';
import {ENET_BUILDER, ENetBuilder} from './eNetBuilder';
import {ENET_DEPOSITER, ENetDepositer} from './eNetDepositer';
import {ENET_FETCHER, ENetFetcher} from './eNetFetcher';
import {Fetcher, FETCHER} from './fetcher';
import {Harvester, HARVESTER} from './harvester';
import {Repairer, REPAIRER} from './repairer';
import {SOURCE_BUILDER, SourceBuilder} from './sourceBuilder';
import {Upgrader, UPGRADER} from './upgrader';

export interface BehaviorMap {
  [name: string]: Behavior<any>;
}

/** Convenience mapping of behavior key to behavior update function. */
global.behaviors = {
  [HARVESTER]: new Harvester(),
  [REPAIRER]: new Repairer(),
  [FETCHER]: new Fetcher(),
  [DEPOSITER]: new Depositer(),
  [CONTAINER_HARVESTER]: new ContainerHarvester(),
  [EMERGENCY_MINER]: new EmergencyMiner(),
  [BUILDER]: new Builder(),
  [SOURCE_BUILDER]: new SourceBuilder(),
  [ENET_BUILDER]: new ENetBuilder(),
  [ENET_FETCHER]: new ENetFetcher(),
  [ENET_DEPOSITER]: new ENetDepositer(),
  [UPGRADER]: new Upgrader(),
};
