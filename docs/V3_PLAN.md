# V3 implementation plan

Upgrade the existing V2 district, engine, storage key and Pages URL.

1. Remove all standard-action scheduling. Apply costs, game-time advancement, rewards and saves in one synchronous transaction. Preserve interactive timing input; remove the post-minigame wait and slot-animation locks. Settle already-paid V2 pending actions once during migration.
2. Retain the XP curves and existing salaries/costs. Add six job roles and four qualifications (18 jobs, 10 qualifications), current employment and a dedicated career screen.
3. Add Thieving XP, training, instant pickpocketing and tiered building robberies with visible requirements, success percentages and payout ranges. Failed robberies start an interactive 30-second police pursuit with pathfinding, cover, projectiles, damage and clinic recovery on defeat. Preserve pursuit state across reloads; ordinary menus cannot grant invulnerability.
4. Add four varied mission steps, contextual NPC choices and six useful consumable/equipment items. Keep equipment effects explicit and non-stacking.
5. Preserve the Developer Menu, adding clean modifier reset, skill/mission reset, clock/day setting and career unlocks. Include Thieving in skill tools.
6. Refine reusable artwork/HUD without moving the map. Test instant transactions, migration, careers, missions, equipment, robbery odds and police behavior; inspect browser captures, then push and verify the existing deployment.

No wall-clock levelling target applies in V3. Police pursuit is an active escape mechanic, not a substitute waiting period for an ordinary action. Original formulas not recoverable from accessible evidence will be identified as remake choices in the crime notes.
