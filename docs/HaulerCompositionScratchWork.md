# OffRoad

## Mid-distance
Lets assume we are trying to transport energy 20 cells of plains, using 300 enery cost creeps. what is the best way?

### Haulers:

3 Carry, 3 Move
Fetch (unloaded) -> 0 - 6, 1 cell per tick -> 20 ticks
Carry (loaded) -> 6 - 6, 1 cell per tick -> 20 ticks
Payload = 150 E

150 E / 40 ticks = 3.75 E/tick

4 Carry, 2 Move
Fetch (unloaded) -> 0 - 4, 1 cell per tick -> 20 ticks
Carry (loaded) -> 8 - 4, 1 cell per 2 ticks -> 40 ticks
Payload = 200 E

200 E / 60 ticks = 3.33 E/tick

5 Carry, 1 Move
Fetch (unloaded) -> 0 - 2, 1 cell per tick -> 20 ticks
Carry (loaded) -> 10 - 2, 1 cell per 4 ticks -> 80 ticks
Payload = 200 E

250 E / 100 ticks = 2.5 E/tick


### Workers:

1 Work, 2 Carry, 2 Move
Fetch (unloaded) -> 2 - 4, 1 cell per tick -> 20 ticks
Carry (loaded) -> 6 - 4, 1 cell per 2 ticks -> 40 ticks
Payload = 100 E

100 E / 60 ticks = 1.66 E/tick

2 Work, 1 Carry, 1 Move
Fetch (unloaded) -> 4 - 2, 1 cell per 2 ticks -> 40 ticks
Carry (loaded) -> 6 - 2, 1 cell per 3 ticks -> 60 ticks
Payload = 50 E

50 E / 100 ticks = 0.5 E/tick



## Short distance
5 cells of plains, using 300 enery cost creeps. what is the best way?

### Haulers:

3 Carry, 3 Move
Fetch (unloaded) -> 0 - 6, 1 cell per tick -> 5 ticks
Carry (loaded) -> 6 - 6, 1 cell per tick -> 5 ticks
Payload = 150 E

150 E / 10 ticks = 15 E/tick

4 Carry, 2 Move
Fetch (unloaded) -> 0 - 4, 1 cell per tick -> 5 ticks
Carry (loaded) -> 8 - 4, 1 cell per 2 ticks -> 10 ticks
Payload = 200 E

200 E / 15 ticks = 13.33 E/tick

5 Carry, 1 Move
Fetch (unloaded) -> 0 - 2, 1 cell per tick -> 5 ticks
Carry (loaded) -> 10 - 2, 1 cell per 4 ticks -> 20 ticks
Payload = 200 E

250 E / 25 ticks = 10 E/tick


### Workers:

1 Work, 2 Carry, 2 Move
Fetch (unloaded) -> 2 - 4, 1 cell per tick -> 5 ticks
Carry (loaded) -> 6 - 4, 1 cell per 2 ticks -> 10 ticks
Payload = 100 E

100 E / 15 ticks = 6.66 E/tick

2 Work, 1 Carry, 1 Move
Fetch (unloaded) -> 4 - 2, 1 cell per 2 ticks -> 10 ticks
Carry (loaded) -> 6 - 2, 1 cell per 3 ticks -> 15 ticks
Payload = 50 E

50 E / 25 ticks = 2 E/tick


Conclusion: For off road travel, balanced Haulers are the best (7.5x efficientcy of workers).


# Roads

## Mid-distance
Lets assume we are trying to transport energy 20 cells of road, using 300 enery cost creeps. what is the best way?

### Haulers:

3 Carry, 3 Move
Fetch (unloaded) -> 0 - 6, 1 cell per tick -> 20 ticks
Carry (loaded) -> 3 - 6, 1 cell per tick -> 20 ticks
Payload = 150 E

150 E / 40 ticks = 3.75 E/tick

4 Carry, 2 Move
Fetch (unloaded) -> 0 - 4, 1 cell per tick -> 20 ticks
Carry (loaded) -> 4 - 4, 1 cell per tick -> 20 ticks
Payload = 200 E

200 E / 40 ticks = 5 E/tick

5 Carry, 1 Move
Fetch (unloaded) -> 0 - 2, 1 cell per tick -> 20 ticks
Carry (loaded) -> 5 - 2, 1 cell per 3 ticks -> 60 ticks
Payload = 200 E

250 E / 80 ticks = 3.125 E/tick


### Workers:

1 Work, 2 Carry, 2 Move
Fetch (unloaded) -> 1 - 4, 1 cell per tick -> 20 ticks
Carry (loaded) -> 3 - 4, 1 cell per 2 ticks -> 20 ticks
Payload = 100 E

100 E / 40 ticks = 2.5 E/tick

2 Work, 1 Carry, 1 Move
Fetch (unloaded) -> 2 - 2, 1 cell per tick -> 20 ticks
Carry (loaded) -> 3 - 2, 1 cell per 2 ticks -> 40 ticks
Payload = 50 E

50 E / 60 ticks = 0.82 E/tick



## Short distance
5 cells of plains, using 300 enery cost creeps. what is the best way?

### Haulers:

3 Carry, 3 Move
Fetch (unloaded) -> 0 - 6, 1 cell per tick -> 5 ticks
Carry (loaded) -> 3 - 6, 1 cell per tick -> 5 ticks
Payload = 150 E

150 E / 10 ticks = 15 E/tick

4 Carry, 2 Move
Fetch (unloaded) -> 0 - 4, 1 cell per tick -> 5 ticks
Carry (loaded) -> 4 - 4, 1 cell per tick -> 5 ticks
Payload = 200 E

200 E / 10 ticks = 20 E/tick

5 Carry, 1 Move
Fetch (unloaded) -> 0 - 2, 1 cell per tick -> 5 ticks
Carry (loaded) -> 5 - 2, 1 cell per 3 ticks -> 15 ticks
Payload = 200 E

250 E / 20 ticks = 12.5 E/tick


### Workers:

1 Work, 2 Carry, 2 Move
Fetch (unloaded) -> 1 - 4, 1 cell per tick -> 5 ticks
Carry (loaded) -> 3 - 4, 1 cell per tick -> 5 ticks
Payload = 100 E

100 E / 10 ticks = 10 E/tick

2 Work, 1 Carry, 1 Move
Fetch (unloaded) -> 2 - 2, 1 cell per tick -> 5 ticks
Carry (loaded) -> 3 - 2, 1 cell per 2 ticks -> 10 ticks
Payload = 50 E

50 E / 15 ticks = 3.33 E/tick


Conclusion: For road travel, 2C1M haulers are the best, near 5 times as good as heavy workers. Surprisingly 1W2C2M workers are not too bad (66% of a hauler).
