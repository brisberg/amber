/**
 * This file is a temporary solution to create a one-way link from Storage to
 * Room Controller to simplify energy distribution.
 */

/**
 * operateLinks takes a room, determines the storage and controller pair of
 * links and pushes energy storage->controller.
 */
export function operateLinks(room: Room): void {
  if (!room.storage || !room.controller || !room.controller.my) return;

  const sLink: StructureLink|null =
      room.storage.pos.findClosestByRange(
          FIND_MY_STRUCTURES,
          {filter: (s) => s.structureType === STRUCTURE_LINK},
          ) as StructureLink |
      null;
  const cLink: StructureLink|null =
      room.controller.pos.findClosestByRange(
          FIND_MY_STRUCTURES,
          {filter: (s) => s.structureType === STRUCTURE_LINK},
          ) as StructureLink |
      null;

  if (!sLink || !cLink || sLink.id === cLink.id) return;

  // Add a buffer so upgraders are never interrupted
  if (cLink.store.energy <= 100) {
    sLink.transferEnergy(cLink);
  }
}
