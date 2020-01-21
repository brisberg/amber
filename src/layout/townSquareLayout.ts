/**
 *  The 6x7 Layout is like so:
 *
 *  `-`: Road, `S`: Spawn, `G`: Storage, `L`: Link, `F`: Factory, `T`: Terminal,
 * `P`: Power Spawn, `C`: Operator Creep, `R`: Tower
 *
 *  -  R  -  -  -  R  -
 *  R  -  -  F  L  -  R
 *  -  -  P  C  T  -  -
 *  R  -  -  G  -  -  R
 *  -  S  -  -  -  S  -
 *     -  -  S  -  -
 *
 * layout[Y][X] = Structure
 */
export const layout = [
  [
    STRUCTURE_ROAD,
    STRUCTURE_TOWER,
    STRUCTURE_ROAD,
    STRUCTURE_ROAD,
    STRUCTURE_ROAD,
    STRUCTURE_TOWER,
    STRUCTURE_ROAD,
  ],
  [
    STRUCTURE_TOWER,
    STRUCTURE_ROAD,
    STRUCTURE_ROAD,
    STRUCTURE_FACTORY,
    STRUCTURE_LINK,
    STRUCTURE_ROAD,
    STRUCTURE_TOWER,
  ],
  [
    STRUCTURE_ROAD,
    STRUCTURE_ROAD,
    STRUCTURE_POWER_SPAWN,
    STRUCTURE_ROAD,
    STRUCTURE_TERMINAL,
    STRUCTURE_ROAD,
    STRUCTURE_ROAD,
  ],
  [
    STRUCTURE_TOWER,
    STRUCTURE_ROAD,
    STRUCTURE_ROAD,
    STRUCTURE_STORAGE,
    STRUCTURE_ROAD,
    STRUCTURE_ROAD,
    STRUCTURE_TOWER,
  ],
  [
    STRUCTURE_ROAD,
    STRUCTURE_SPAWN,
    STRUCTURE_ROAD,
    STRUCTURE_ROAD,
    STRUCTURE_ROAD,
    STRUCTURE_SPAWN,
    STRUCTURE_ROAD,
  ],
  [
    STRUCTURE_ROAD,
    STRUCTURE_ROAD,
    STRUCTURE_ROAD,
    STRUCTURE_SPAWN,
    STRUCTURE_ROAD,
    STRUCTURE_ROAD,
    STRUCTURE_ROAD,
  ],
];
