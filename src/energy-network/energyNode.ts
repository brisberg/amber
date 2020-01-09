/**
 * Energy Node is a generic representation of a Node of the Energy network. This
 * could a Structure (Container, Link, Storage, Terminal) or a Creep drop zone.
 */

export interface EnergyNode {
  ID: string;
  room: string;
  pos: [number, number];
  polarity: 'source'|'sink';
  type: 'link'|'structure'|'creep';
  persistant: boolean;  // Unused for now
}

// TODO: maybe we need classes here, they would abstract the .withdraw() and
// .transfer() actions.
