/**
 * Behavior class for Tower defense turrets
 *
 * For now, they have simplistic defense behavior:
 *
 * Scan every tick for hostiles in the room, fire on them in order if found.
 * Scan every tick for damaged friendly creeps, heal them if found.
 * Scan every 50 ticks for damaged structures in a 5x5 around them, record their
 * IDs in memory. If there are any damaged structures recorded, go down the list
 * repairing them in order.
 */
export class TowerBehavior {
  public run(tower: StructureTower): void {
    if (!Memory.rooms[tower.room.name].damaged) {
      Memory.rooms[tower.room.name].damaged = [];
    }

    // Attack hostile creeps
    const hostiles = tower.room.find(FIND_HOSTILE_CREEPS);
    if (hostiles.length > 0) {
      tower.attack(hostiles[0]);
      return;
    }

    // Attack hostile power creeps
    const powerCreeps = tower.room.find(FIND_HOSTILE_POWER_CREEPS);
    if (powerCreeps.length > 0) {
      tower.attack(powerCreeps[0]);
      return;
    }

    // Heal damaged friendly creeps
    const hurtCreeps = tower.room.find(
        FIND_MY_CREEPS, {filter: (creep) => creep.hits < creep.hitsMax});
    if (hurtCreeps.length > 0) {
      tower.heal(hurtCreeps[0]);
      return;
    }

    // Scan for damaged structures every 100 ticks
    if (Game.time % 100 === 0) {
      const lookRanges = [
        Math.max(tower.pos.y - 7, 1),
        Math.max(tower.pos.x - 7, 1),
        Math.min(tower.pos.y + 7, 49),
        Math.min(tower.pos.x + 7, 49),
      ];
      const structs =
          tower.room
              .lookForAtArea(
                  LOOK_STRUCTURES, lookRanges[0], lookRanges[1], lookRanges[2],
                  lookRanges[3], true)
              .map((result) => result.structure)
              .filter((struct) => struct.structureType !== STRUCTURE_WALL);
      const damaged = structs.filter(
          (struct) => struct.hitsMax - struct.hits >= TOWER_POWER_REPAIR);
      Memory.rooms[tower.room.name].damaged =
          damaged.map((struct) => struct.id);
    }

    // Repair damaged structures
    const damagedIDs = Memory.rooms[tower.room.name].damaged;
    let repaired = false;
    // Filter the cached damaged Ids for still damaged, existing structures
    const finalIDs = damagedIDs.filter((id) => {
      const struct = Game.getObjectById(id);
      if (!struct || (struct.hitsMax - struct.hits) < TOWER_POWER_REPAIR) {
        return false;
      } else {
        if (!repaired) {
          tower.repair(struct);
          repaired = true;
        }
        return true;
      }
    });
    // Save the filtered list to memory
    Memory.rooms[tower.room.name].damaged = finalIDs;

    return;
  }
}

global.tower = new TowerBehavior();
