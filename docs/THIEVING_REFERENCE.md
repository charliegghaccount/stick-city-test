# Thieving and robbery reference notes

Sources revisited for V3:

- [Original developer announcement](https://forums.macrumors.com/threads/stick-city-rpg-free-a-stick-figure-rpg-game-with-a-lot-of-depth-to-it-set-in-a-massive-city.1920414/): describes robbing buildings, pickpocketing and gun shootouts; advertises “Rob buildings for huge cash.”
- [Original TouchArcade listing](https://toucharcade.com/games/stick-city-rpg): advertises robbing buildings, pickpocketing and “Outrun the cops.”
- [148Apps contemporary review](https://www.148apps.com/stick-town-rpg/stick-city-rpg-review/): confirms bank robbery/criminal play and optional Gang/Mayor missions.
- [AppsHunter archive](https://appshunter.io/ios/app/stick-city-rpg/id1003767328) and [AppStorio](https://stick-city-rpg.appstor.io/): original listing and screenshot references; initial V3 requests received upstream 403/520 errors; a standard browser user-agent then retrieved the developer announcement and AppStorio listing successfully (HTTP 200). Both were read again for the original crime descriptions. Authentic developer screenshots retained during V1/V2 research remain the visual reference.

The accessible text confirms the original crime and pursuit loop. It does not expose a complete original Thieving level table, robbery success formula, payout table or verified pursuit length. Thieving is implemented as requested by the owner. The exact skill-XP curve, tier requirements, percentages, rewards, 30-second pursuit, damage and defeat penalties below are explicit remake choices, not claimed extracted original code.

## V3 target table

| Target | Thieving | Character level | Payout | Base success | Energy | Game minutes | Security reset (game minutes) |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Café | 1 | 1 | $25–45 | 55% | 14 | 30 | 240 |
| General store | 2 | 1 | $60–100 | 52% | 18 | 40 | 360 |
| Diner | 2 | 1 | $55–95 | 54% | 18 | 40 | 360 |
| Post depot | 3 | 2 | $90–150 | 50% | 22 | 45 | 480 |
| Garage | 4 | 2 | $130–210 | 48% | 24 | 50 | 600 |
| Offices | 5 | 3 | $200–330 | 45% | 28 | 60 | 720 |
| Casino | 7 | 4 | $350–550 | 40% | 34 | 90 | 1,080 |
| Bank | 10 | 5 | $600–950 | 35% | 40 | 120 | 1,440 |

Actual success = base + 3.5 percentage points per Thieving level above the target's requirement + 0.3 points per Charm level (up to ten) + six points with lockpicks, capped at 92%. The game displays the calculated chance before the attempt. Success awards 8–24 Thieving XP by target; failure awards 2 and starts pursuit. No reward is delayed.

Two armed officers navigate around buildings and aim discrete projectiles at the player's current position. Buildings block their shots; movement can dodge them. They pursue for 30 active seconds. Reloading preserves the remaining wanted time. Police can reduce health to zero; the player is then revived at the clinic with 60 health/40 energy, two extra game hours and a bill capped at $150 (bank savings untouched). Escape clears wanted status. This minimal pursuit is deliberately not a full combat system.

V3 validation includes a full 30-second browser pursuit (infinite health explicitly enabled for duration testing), a separate unmodified-health browser take-down and a successful normal-health moving escape, path/cover tests, odds/payout tests and wanted persistence after reload.
