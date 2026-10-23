# Version 2 implementation plan

Upgrade the existing Phaser / TypeScript / Vite project, district and Pages URL. Keep the 16 locations and current missions; add no frameworks.

## V1 audit

- `content.ts` defines 16 buildings, 19 activities, four consumables and three missions. Diner, office, post and garage are the existing jobs.
- `model.ts` owns money, energy, clock, XP, skills and local storage. Character XP uses `level * 50`; training and work grant entire skill levels. All activities resolve immediately. Free sleep awards XP, making repetition a progression exploit.
- `scene.ts` handles collision-aware walking and camera following. Cars use independent absolute-time loops, have no headway checks and jump between lane coordinates at turns.
- `ui.ts` provides working grey mobile menus, inventory, banking, missions and minigames. It has no developer tools or qualifications. Skill bars represent level rather than earned skill XP.
- `art.ts` caches the static district, but many building details are embedded in the world painter. V1 is dominated by grey roofs and muted grass.

## Implementation

1. Add central balance, incremental skill XP, persistent activity timers and V1 migration at the existing save key, retaining a pre-migration backup. Validate developer imports before replacing state.
2. Add a separate Settings → DEV / F2 menu. Temporary modifiers reset on reload; progression-changing tools mark the save. Teleports and turning noclip off must recover to valid terrain.
3. Add 12 working roles across hospitality, corporate, healthcare, retail, post and garage, plus persistent courses. Show concrete requirements and actual rewards.
4. Extract reusable building/environment drawing helpers, brighten the existing district, improve vehicles and animated feet, and retain compact retro menus. Keep map coordinates unchanged.
5. Replace formula traffic with continuous rounded lanes, following gaps, braking and conservative conflict checks; pause/resume without simulation jumps.
6. Test XP curves, pacing bounds, skill XP, careers, costs, migration, developer tools, save validation and traffic. Exercise menus and touch input in Chromium, compare V1/V2 screenshots, then build, push and verify the existing Pages deployment.

Activity timers are needed to make a real-playtime target meaningful. Activity time advances only during active play, survives reload and cannot be bypassed by changing the in-game clock. Developer completion remains an explicit marked cheat. The 45–90 minute level-5 target is provisional and will be evaluated with a deterministic early-game simulation, not described as a measured human playthrough.
