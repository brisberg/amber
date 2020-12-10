/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {setCreepBehavior} from 'behaviors/behavior';
import {Demolisher, DEMOLISHER} from 'behaviors/demolish';
import {IDLER} from 'behaviors/idler';
import {WORKER} from 'spawn-system/bodyTypes';

export interface ExcavationMemory {
  room: string|null;    // Spawn Room
  target: string|null;  // Target Room
  path: [number, number][];
  creep: string|null;
}

/**
 * Temporary Mission construct to facilitate excavating to a ScoreCollector.
 *
 * This mission will request a digger creeps.
 */
export class ExcavationMission {
  protected readonly spawnPriority = 3;
  protected readonly bodyType = WORKER;

  public spawnSource: Room|null = null;
  public target: Room|null = null;

  constructor(private mem: ExcavationMemory) {}

  /** @override */
  public init(): boolean {
    if (this.mem.room && Game.rooms[this.mem.room]) {
      this.spawnSource = Game.rooms[this.mem.room];
    }

    if (this.mem.target && Game.rooms[this.mem.target]) {
      this.target = Game.rooms[this.mem.target];
    }

    return true;
  }

  /** Executes one update tick for this mission */
  public run(): void {
    if (!this.spawnSource || !this.mem.path || !this.mem.creep) {
      return;
    }

    /**
     * Spawn a Worker creep with no carry, send it to the dig site.
     * Dismantle the walls in order.
     */

    // Direct each creep to pick up or dropoff
    const creep = Game.creeps[this.mem.creep];
    if (!creep) return;

    if (creep.memory.behavior === IDLER) {
      // Pickup newly spawned idle creeps
      creep.memory.behavior = DEMOLISHER;
      creep.memory.mission = 'score';
    }

    if (creep.memory.behavior === DEMOLISHER) {
      if (!this.target) {
        // Lost vision of room
        creep.moveTo(new RoomPosition(25, 25, this.mem.target!), {range: 10});
      } else {
        let wall: StructureWall|null = null;
        const path = [...this.mem.path];

        while (!wall) {
          const coords = path.shift();
          if (!coords) break;

          const structs = this.target.lookAt(coords[0], coords[1]);
          const wallr = structs.find((s) => {
            return s.structure && s.structure.structureType === STRUCTURE_WALL;
          });
          wall = wallr ? wallr.structure as StructureWall : null;
        }

        if (!wall) {
          // We are finished
          // TODO: Clean up excavation mission
          return;
        }

        if (Demolisher.getTargetID(creep.memory.mem) !== wall.id) {
          // Update fetch target
          setCreepBehavior(
              creep,
              DEMOLISHER,
              Demolisher.initMemory(this.target.name, wall),
          );
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

    // Request a new hauler creep
    const queue = global.spawnQueues[this.mem.room!];
    this.mem.creep = queue.requestCreep({
      bodyRatio: this.bodyType,
      mission: 'score',
      priority: this.spawnPriority,
    });
    return true;
  }
}
