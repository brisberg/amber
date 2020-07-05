/**
 * General Purpose Energy Harvesting Mission
 *
 * Uses Source Analysis on the source to determine how many and what size
 * workers to request.
 * Attempts to position the largest one on the Primary
 * position.
 * Uses the room available energy capacity to decide which set of creep sizes to
 * use.
 * Performs "Drop Mining", registers Logistics Nodes on each working creep
 * based on their WORK parts.
 * Spawns new creeps when one is old.
 * New creeps will "Relieve" the oldest creep.
 */

describe('Harvest Mission v2', () => {
  describe('Spawning', () => {
    it.todo('should request largest creep possible given room energy capacity');

    it.todo('should request max number of creeps based on harvest positions');

    it.todo('should request smaller creep up to WORK part limit');

    it.todo('should request replacement creeps when one is too old');
  });

  describe('Running', () => {
    it.todo(`should send each creep to 'drop harvest' the source`);

    it.todo(`should send each new creep to 'relieve' the oldest creep`);

    it.todo('should register a Logistic Node for each working creep');
  });
});
