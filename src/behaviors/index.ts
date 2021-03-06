import {ATTACKER, Attacker} from './attack';
import {Behavior} from './behavior';
import {Builder, BUILDER} from './builder';
import {CLAIM_ATTTACK, ClaimAttacker} from './claimAttack';
import {Claimer, CLAIMER} from './claimer';
import {CONTAINER_HARVESTER, ContainerHarvester} from './containerHarvester';
import {CONTAINER_UPGRADER, ContainerUpgrader} from './containerUpgrader';
import {Demolisher, DEMOLISHER} from './demolish';
import {Depositer, DEPOSITER} from './depositer';
import {Distributor, DISTRIBUTOR} from './distributor';
import {EMERGENCY_MINER, EmergencyMiner} from './emergencyMiner';
import {ENET_BUILDER, ENetBuilder} from './eNetBuilder';
import {ENET_DEPOSITER, ENetDepositer} from './eNetDepositer';
import {ENET_FETCHER, ENetFetcher} from './eNetFetcher';
import {Fetcher, FETCHER} from './fetcher';
import {Harvester, HARVESTER} from './harvester';
import {Idler, IDLER} from './idler';
import {LINK_UPGRADER, LinkUpgrader} from './linkUpgrader';
import {Pioneer, PIONEER} from './pioneer';
import {Ranger, RANGER} from './range';
import {Repairer, REPAIRER} from './repairer';
import {SENTRY, Sentry} from './sentry';
import {SOURCE_BUILDER, SourceBuilder} from './sourceBuilder';
import {Upgrader, UPGRADER} from './upgrader';

export type BehaviorKey = typeof ATTACKER|typeof PIONEER|typeof REPAIRER|
    typeof FETCHER|typeof DEPOSITER|typeof CONTAINER_HARVESTER|
    typeof EMERGENCY_MINER|typeof BUILDER|typeof SOURCE_BUILDER|
    typeof ENET_BUILDER|typeof ENET_FETCHER|typeof ENET_DEPOSITER|
    typeof UPGRADER|typeof CONTAINER_UPGRADER|typeof LINK_UPGRADER|
    typeof DISTRIBUTOR|typeof DEMOLISHER|typeof CLAIMER|typeof CLAIM_ATTTACK|
    typeof RANGER|typeof SENTRY|typeof IDLER;

export interface BehaviorMap {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [name: string]: Behavior<any>;
}

/** Convenience mapping of behavior key to behavior update function. */
global.behaviors = {
  [ATTACKER]: new Attacker(),
  [RANGER]: new Ranger(),
  [PIONEER]: new Pioneer(),
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
  [CONTAINER_UPGRADER]: new ContainerUpgrader(),
  [LINK_UPGRADER]: new LinkUpgrader(),
  [DISTRIBUTOR]: new Distributor(),
  [DEMOLISHER]: new Demolisher(),
  [CLAIMER]: new Claimer(),
  [CLAIM_ATTTACK]: new ClaimAttacker(),
  [SENTRY]: new Sentry(),
  [IDLER]: new Idler(),
};
