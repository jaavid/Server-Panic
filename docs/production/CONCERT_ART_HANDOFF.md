# Concert Night: Blender → Three.js handoff

`concert/` is the playable baseline. The visible geometry is placeholder art.
This brief is an implementation target rather than a claim that art or publishing is done.

## First shot

Build one small city, with the same playable districts and a constrained three-quarter
camera. A terracotta Iranian courtyard, restrained turquoise tiles, arches and a
warm concert stage make the foreground distinctive. Put three recognizable navy racks and
their cool data paths in the distance, with a separate command center and drone pad.
Design for a 360px-wide display before adding decorative density.

Build and review one transition end to end: broadcast normal → outage → backup.
The screen, audience and data path should react to the same mission state. Animate the
drone flying from the control center to a rack. Do not replace the deterministic seven-minute
mission, controls or replay with a showcase timer. Leave the Classic game intact.

## Deliverables

- Editable Blender source with separate Concert, Datacenter, Control and Drone collections,
  an original asset/provenance manifest and repeatable export instructions or Python script.
- Local GLB assets with stable documented nodes for all three zones, three racks, screen and
  drone pad. Validate axes, pivots and pick areas in Three.js with a matching-version loader,
  and retain the low-resource fallback. No third-party CDN at runtime.
- Original visuals without commercial game graphics, logos or music. Reduce repeated draw calls
  with instancing; avoid relying on real-time shadows for legibility. Initial targets:
  up to 4 MB first-load assets, fewer than 120 draw calls during peak action and 30 FPS
  on a physical midrange Android phone. Report what was actually measured.
- In-game screenshots at normal, outage and recovery; test touch at 360×800 and desktop,
  routing, drone, backup, pause, victory and replay. Rebuild and verify locally, including
  the offline build. Document any new Edge asset packaging assumptions instead of guessing
  the active plan's size or runtime limits.

Leaderboard, Edge score replay and AIaaS are separate work, described in
[the competition architecture](../EDGE_GAMES_RULES_AND_ARCHITECTURE.md).
Do not publish or submit the game based on prototype or desktop checks alone.
