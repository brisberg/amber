/**
 * Utility package for interacting with BodyPartManifests.
 *
 * A BodyPartManifest is a easily serializable defintion for creeps body. It is
 * a simple array of integers which count each body part type in the creep.
 */

// TODO: Should come up with a more concise serialization format for these. It
// could be done with a single integer instead of an array of 8.

/** Lightweight representation of a Creeps body. */
export type BodyPartManifest = number[];

/** Lookup table from BodyPartConstant to Manifest array index */
export const BODY_MANIFEST_INDEX = {
  work: 0,
  carry: 1,
  move: 2,
  attack: 3,
  ranged_attack: 4,
  heal: 5,
  tough: 6,
  claim: 7,
};

/** Generates a BodyPartManifest from a Creep Body array */
export function generateManifestFromBody(body: BodyPartConstant[]):
    BodyPartManifest {
  const manifest: BodyPartManifest = Array<number>(8).fill(0);

  body.forEach((part) => {
    manifest[BODY_MANIFEST_INDEX[part]]++;
  });

  return manifest;
}
