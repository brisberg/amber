/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {setCreepBehavior} from 'behaviors/behavior';
import {Depositer, DEPOSITER} from 'behaviors/depositer';
import {Fetcher, FETCHER} from 'behaviors/fetcher';
import {IDLER} from 'behaviors/idler';
import {GenerateCreepBodyOptions, OR_HAULER} from 'spawn-system/bodyTypes';
import {declareOrphan} from 'spawn-system/orphans';
import {RESOURCE_SCORE} from './types';

export interface ScoreCollectMemory {
  room: string|null;
  // TODO: Update screeps types with score container
  scoreID: Id<StructureContainer>|null;
  creep: string|null;
}

/**
 * Temporary Mission construct to facilitate hauling Score from a ScoreContainer
 * to Storage.
 *
 * This mission will request a hauler creeps.
 */
export class ScoreMission {
  protected readonly spawnPriority = 3;
  protected readonly bodyType = OR_HAULER;
  protected readonly bodyOptions: GenerateCreepBodyOptions = {max: {carry: 25}};

  public container: StructureContainer|null = null;
  public dest: StructureStorage|null = null;

  constructor(private mem: ScoreCollectMemory) {}

  /** @override */
  public init(): boolean {
    if (!this.mem.scoreID || !Game.getObjectById(this.mem.scoreID)) {
      console.log(
          `Score Mission ${this.mem.room}: Could not find Score Container ${
              this.mem.scoreID}. Retiring`);
      return false;
    }

    if (!this.mem.room || !Game.rooms[this.mem.room] ||
        !Game.rooms[this.mem.room].controller!.my) {
      console.log(
          `Score Mission ${this.mem.room}: Does not own room. Retiring`);
      return false;
    }

    this.dest = Game.rooms[this.mem.room].storage || null;
    this.container = Game.getObjectById(this.mem.scoreID);

    return true;
  }

  /** Executes one update tick for this mission */
  public run(): void {
    if (!this.container || !this.dest || !this.mem.creep) {
      return;
    }

    /**
     * If they are fetching
     *    and source is not correct, fixit
     *    and they are full, swap
     * If they are depositing
     *    and dest is wrong, fix it
     *    and they are empty, swap
     */

    // Direct each creep to pick up or dropoff
    const creep = Game.creeps[this.mem.creep];
    if (!creep) return;

    if (creep.memory.behavior === IDLER) {
      // Pickup newly spawned idle creeps
      creep.memory.behavior = FETCHER;
      creep.memory.mission = 'score';
    }

    if (creep.memory.behavior === FETCHER) {
      if (Fetcher.getTarget(creep.memory.mem) !== this.container.id) {
        // Update fetch target
        setCreepBehavior(
            creep,
            FETCHER,
            Fetcher.initMemory(this.container, RESOURCE_SCORE),
        );
      }

      if (creep.store.getFreeCapacity() === 0 ||
          this.container.store[RESOURCE_SCORE] === 0) {
        // Have score, travel to destination
        setCreepBehavior(
            creep,
            DEPOSITER,
            Depositer.initMemory(this.dest, RESOURCE_SCORE),
        );
        creep.memory.mission = 'score';
      }
    } else if (creep.memory.behavior === DEPOSITER) {
      if (Depositer.getTarget(creep.memory.mem) !== this.dest.id) {
        // Update fetch target
        creep.memory.mem = Depositer.initMemory(this.dest, RESOURCE_SCORE);
      }

      if (creep.store[RESOURCE_SCORE] === 0) {
        if ((creep.ticksToLive || 100) < 100) {
          // Decommission this hauler after it has delivered its payload
          console.log(
              'ScoreCollector ' + this.mem.room + ' decommissioning a hauler ' +
              creep.name);
          declareOrphan(creep);
          this.mem.creep = null;
        } else {
          // Fetch more energy
          setCreepBehavior(
              creep,
              FETCHER,
              Fetcher.initMemory(this.container, RESOURCE_SCORE),
          );
          creep.memory.mission = 'score';
        }
      }

      if (this.container.store[RESOURCE_SCORE] === 0 &&
          creep.store[RESOURCE_SCORE] === 0) {
        // Operation finished. Disolve
        declareOrphan(creep);
      }
    }
  }

  /**
   * @override
   * Requests a creep if needed for this mission
   */
  public requestCreep(): boolean {
    const creep = Game.creeps[this.mem.creep || ''];
    if (creep) {
      return false;
    }

    // Request a new hauler creep
    const queue = global.spawnQueues[this.mem.room!];
    if (queue) {
      this.mem.creep = queue.requestCreep({
        bodyOptions: this.bodyOptions,
        bodyRatio: this.bodyType,
        mission: 'score',
        priority: this.spawnPriority,
      });
    }
    return true;
  }
}
