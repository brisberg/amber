# Extension Layout

Though this may extend to Base Layout in general, a core part of the early game is layingout and refilling your spawn extensions as your controller level increases.

--
One idea is to completely hapazardly lay them out, looking in all directions around the spawn. This will work eventually but it isn't particularly CPU efficient and will likely result in messy bases. (Messy bases aren't necessarily a bad thing).

--
Another idea is to break up the map in to Extension blocks. Basically 5 Extensions in an X shape with roads between. This would reduce the total number of units to place from 60 at RC8 to 12. We always gain extensions in blocks of 5 or 10, so we would always be able to fully place them.

This would be nice because it would automatically cluster them into 'refillable' units. And it means that any node in the cluster is accessible from any cell adjacent to the square, because of diagonal roads.

-- I often see people laying out their extensions in a checker grid. This makes sense as it ensure that each extension is accessible, but I believe they are laid out by hand. I can't imagine an algorithm which would nicely do this.

-- Update: An improvement on the Extension Block idea above is to layout each group as 6 instead of 5. In either of these configurations: `o`: Extension, `x`: Road

```
A: o o x      B: x o o
   o x o         o x o
   x o o         o o x
```

These fit 6 Extensions in a 3x3 instead of only 5, and if they are tiled alternating, all roads will be accessible.

They can be filled in a CPU efficient manner as the center Road cell is in range of all 6 Extensions. Meaning we can fill it in 2 Moves and 6 Transfers (which each have flat CPU cost).

With the Space Saving, cumulatively this layout can fit 60 extensions into 90 Cells (33% less than the 120 required for a checker board).

## Mission Structure

-- DistributionMission
I am imagining a Distributor Mission, which is attached to an Energy Node.

This mission will request Hauler Creeps, who will transport Energy from the energy node, to an Extension Group.

Each Creep will be asigned one group at a time, and it will keep fetching energy for it until it is done.

Then the Distributor Mission will look at the next lowest Extension Group and reassign the Distributor.

-- Distribution Operation
This Operation will take a Spawn, and it will decide where each of the Extension Groups will go.
