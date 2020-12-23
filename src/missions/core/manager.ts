/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {setCreepBehavior} from 'behaviors/behavior';
import {Depositer, DEPOSITER} from 'behaviors/depositer';
import {Fetcher, FETCHER} from 'behaviors/fetcher';
import {Sentry, SENTRY} from 'behaviors/sentry';
import {GenerateCreepBodyOptions, TANKER} from 'spawn-system/bodyTypes';

import {Mission, MissionMemory} from '../mission';

interface ManagerMemory extends MissionMemory {
  storageID: Id<StructureStorage>|null;
  terminalID: Id<StructureTerminal>|null;
  linkID: Id<StructureLink>|null;
}

const RESOURCE_SCORE = 'score' as ResourceConstant;

/**
 * Mission construct to facilitate transfering energy from Storage to the core
 * Link in the main base.
 */
export class ManagerMission extends Mission<ManagerMemory> {
  protected readonly bodyType = TANKER;
  // Must have 1 move for tankers
  protected readonly bodyOptions: GenerateCreepBodyOptions = {
    max: {carry: 4},
    min: {
      move: 1,
      carry: 0,
      work: 0,
      attack: 0,
      range: 0,
      heal: 0,
      tough: 0,
      claim: 0,
    },
  };
  protected readonly spawnPriority = 2;

  private storage: StructureStorage|null = null;
  private terminal: StructureTerminal|null = null;
  private link: StructureLink|null = null;

  constructor(flag: Flag) {
    super(flag);
  }

  public setStorage(storage: StructureStorage): void {
    this.storage = storage;
    this.mem.storageID = storage.id;
  }

  public setTerminal(terminal: StructureTerminal): void {
    this.terminal = terminal;
    this.mem.terminalID = terminal.id;
  }

  public setLink(link: StructureLink): void {
    this.link = link;
    this.mem.linkID = link.id;
  }

  /** @override */
  protected initialMemory(): ManagerMemory {
    return {
      creeps: [],
      storageID: null,
      terminalID: null,
      linkID: null,
    };
  }

  /** @override */
  public init(): boolean {
    if (!this.mem.storageID || !this.mem.linkID) {
      return false;
    }

    this.storage = Game.getObjectById(this.mem.storageID);
    this.terminal = Game.getObjectById(this.mem.terminalID || '');
    this.link = Game.getObjectById(this.mem.linkID);
    return true;
  }

  /** Executes one update tick for this mission */
  public run(): void {
    if (!this.storage || !this.link) {
      return;
    }

    this.creeps.forEach((manager) => {
      manager.memory.mission = this.name;

      if (!manager.pos.isEqualTo(this.flag.pos)) {
        setCreepBehavior(manager, SENTRY, Sentry.initMemory(this.name));
        return;
      }

      if (manager.store.getUsedCapacity() > 0) {
        if (manager.store[RESOURCE_ENERGY] > 0) {
          if (manager.memory.behavior !== DEPOSITER) {
            // Keep terminal energy up
            if (this.terminal && this.terminal.store[RESOURCE_ENERGY] <= 2000) {
              setCreepBehavior(
                  manager, DEPOSITER,
                  Depositer.initMemory(
                      this.terminal as unknown as StructureStorage,
                      RESOURCE_ENERGY));
              return;
            } else {
              setCreepBehavior(
                  manager, DEPOSITER,
                  Depositer.initMemory(this.link!, RESOURCE_ENERGY));
              return;
            }
          }
        } else if (manager.store[RESOURCE_SCORE] > 0) {
          // Season 1
          if (this.terminal) {
            setCreepBehavior(
                manager, DEPOSITER,
                Depositer.initMemory(this.terminal, RESOURCE_SCORE));
            return;
          } else {
            setCreepBehavior(
                manager, DEPOSITER,
                Depositer.initMemory(this.storage!, RESOURCE_SCORE));
            return;
          }
        }
      }
      if (this.terminal && this.storage!.store[RESOURCE_SCORE] > 0) {
        // Season 1 Extract score
        if (manager.memory.behavior !== FETCHER ||
            manager.memory.mem.resource !== RESOURCE_SCORE) {
          setCreepBehavior(
              manager, FETCHER,
              Fetcher.initMemory(this.storage!, RESOURCE_SCORE));
          return;
        }
      } else if (this.storage!.store[RESOURCE_ENERGY] >= 100000) {
        // Limit managers from taking energy from low energy storage
        if (manager.memory.behavior !== FETCHER ||
            manager.memory.mem.resource !== RESOURCE_ENERGY) {
          setCreepBehavior(
              manager, FETCHER,
              Fetcher.initMemory(this.storage!, RESOURCE_ENERGY));
          return;
        }
      }
    });
  }

  private get maxManagers(): number {
    return 1;
  }

  /**
   * @override
   * Returns true if we need another Distributor.
   */
  protected needMoreCreeps(): boolean {
    if (this.getYoungCreeps().length >= this.maxManagers) {
      return false;
    }

    return true;
  }

  /** @override */
  /** Returns false Managers are never critical. */
  protected needMoreCreepsCritical(): boolean {
    return false;
  }
}
