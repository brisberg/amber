/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {setCreepBehavior} from 'behaviors/behavior';
import {Depositer, DEPOSITER} from 'behaviors/depositer';
import {Fetcher, FETCHER} from 'behaviors/fetcher';
import {IDLER} from 'behaviors/idler';
import {OR_HAULER} from 'spawn-system/bodyTypes';

const RESOURCE_SCORE: ResourceConstant = 'score' as ResourceConstant;
const FIND_SCORE_COLLECTORS: FindConstant = 10012 as FindConstant;

export interface ScoreTransportMemory {
  source: string|null;
  waypoints: string[];
  creep: string|null;
  travelIdx: number;  // Index through the waypoint list
}

/**
 * Temporary Mission construct to facilitate hauling Score from Room Terminal to
 * a foreign collector.
 *
 * This mission will request a hauler creeps.
 */
export class ScoreTransportMission {
  protected readonly spawnPriority = 5;
  protected readonly bodyType = OR_HAULER;

  public source: StructureTerminal|null = null;
  public collector: StructureContainer|null = null;

  constructor(private mem: ScoreTransportMemory) {}

  /** @override */
  public init(): boolean {
    if (!this.mem.source || !Game.rooms[this.mem.source]) {
      console.log(`Score Transport ${this.mem.source}: No source room found.`);
      return false;
    }

    const room = Game.rooms[this.mem.source];
    if (!room.controller || !room.controller.my || !room.terminal) {
      console.log(`Score Transport ${
          this.mem.source}: Room not owned or has no Terminal. Retiring`);
      return false;
    }

    this.source = room.terminal;
    if (this.source.store[RESOURCE_SCORE] <= 1250) {
      return false;
    }

    return true;
  }

  /** Executes one update tick for this mission */
  public run(): void {
    if (!this.source || !this.mem.creep) {
      return;
    }

    /**
     * One way fetching, deliver and suicide.
     */

    // Direct each creep to pick up or dropoff
    const creep = Game.creeps[this.mem.creep];
    if (!creep) return;

    if (creep.memory.behavior === IDLER) {
      // Pickup newly spawned idle creeps
      creep.memory.behavior = FETCHER;
      creep.memory.mission = 'score';
      this.mem.travelIdx = -1;
    }

    if (creep.memory.behavior === FETCHER) {
      // Pick up phase
      if (this.mem.travelIdx === -1) {
        if (Fetcher.getTarget(creep.memory.mem) !== this.source.id) {
          // Update fetch target
          setCreepBehavior(
              creep,
              FETCHER,
              Fetcher.initMemory(this.source, RESOURCE_SCORE),
          );
        }

        if (creep.store.getFreeCapacity() === 0) {
          // Got score, begin waypoints
          this.mem.travelIdx = 0;
          creep.memory.mem.targetID = '';
        }
        return;
      }

      if (this.mem.travelIdx === this.mem.waypoints.length) {
        // Arrived in collector room
        const room = creep.room;
        const collector: StructureContainer =
            room.find(FIND_SCORE_COLLECTORS)[0] as StructureContainer;
        if (collector) {
          setCreepBehavior(
              creep,
              DEPOSITER,
              Depositer.initMemory(collector, RESOURCE_SCORE),
          );
        }
      } else {
        // Travel down waypoints
        const nextRoom = this.mem.waypoints[this.mem.travelIdx];
        if (creep.pos.roomName !== nextRoom) {
          creep.moveTo(new RoomPosition(25, 25, nextRoom));
        } else {
          creep.moveTo(
              new RoomPosition(25, 25, creep.pos.roomName),
              {range: 10},
          );
          this.mem.travelIdx = this.mem.travelIdx + 1;
        }
      }

      creep.memory.mission = 'score';
    } else if (creep.memory.behavior === DEPOSITER) {
      if (creep.store.getUsedCapacity() === 0) {
        // Hardcoded 250 value. Twice the distance from Season E1S29 to W1S30
        if ((creep.ticksToLive || CREEP_LIFE_TIME) > 250) {
          creep.memory.behavior = FETCHER;
          this.mem.travelIdx = -1;
        } else {
          // Creep is too old to complete another round
          creep.suicide();
        }
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

    if (!this.mem.source || !Game.rooms[this.mem.source] ||
        !Game.rooms[this.mem.source].terminal) {
      return false;
    }
    const terminal = Game.rooms[this.mem.source].terminal!;
    // Only request a new creep if we have a chunk of score to move
    if (terminal.store[RESOURCE_SCORE] <= 10000) {
      return false;
    }

    // Request a new hauler creep
    const queue = global.spawnQueues[this.mem.source!];
    this.mem.creep = queue.requestCreep({
      bodyRatio: this.bodyType,
      mission: 'score',
      priority: this.spawnPriority,
    });
    return true;
  }
}
