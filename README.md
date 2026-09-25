# VORTEX GLIDE

**Vortex Glide** is a high-speed 3D tunnel arcade game built for HTML5 Web and CrazyGames. Inspired by the responsive flow of *Tunnel Rush* and *Tunnel Rush 2*, the player pilots an interceptor glider through an infinite neon vortex, weaving through incoming hazard gates as velocity relentlessly mounts.

---

## Game Loop & Features

1. **Continuous Forward Acceleration**: Smooth procedural speed scaling from 45 m/s up to 135+ m/s.
2. **True 3D Hardware Accelerated Tunnel**: Built with Three.js WebGL (decagonal modular tunnel, glowing neon ribs, longitudinal guide rails, and speed streaks).
3. **Responsive Banking Flight Controls**:
   - **Keyboard**: `A` / `D` or `Left` / `Right` arrows to steer; `P` or `Escape` to pause.
   - **Touch**: Full-height responsive left/right touch zones with interactive visual ripple indicators.
4. **5 Fair Obstacle Families**:
   - Horizontal blockers with open safe gaps (left/center/right).
   - Vertical blockers with lane separation.
   - Diagonal hazard wedges.
   - Multi-spoke segmented gates.
   - Continuous rotating gates with predictable passing rhythms.
5. **Fair Reachability Validator**: Seeded procedural generation mathematically verifies the player has sufficient reaction time and lateral speed before committing any obstacle pattern.
6. **Dual Audio Architecture**:
   - Web Audio API synthesizer for zero-latency engine hum and backup sounds.
   - **Kenney CC0 Audio Assets** for high-impact crashes, clicks, swooshes, and ambient soundscapes.
7. **CrazyGames Platform Ready**: Clean `CrazyGamesAdapter` managing gameplay lifecycle hooks (`gameplayStart`, `gameplayStop`, `happytime`) and natural break ad triggers with standalone fallback.

---

## Project Structure

```
├── index.html                  # Root HTML5 entry & WebGL canvas
├── css/
│   ├── main.css                # Master design tokens & typography
│   ├── menu.css                # Home, Tutorial, Settings & Game Over screens
│   ├── gameplay.css            # HUD, 3-2-1 Countdown & FX
│   └── responsive.css          # Mobile landscape & safe-area rules
├── js/
│   ├── main.js                 # App bootstrapper
│   ├── core/
│   │   ├── Game.js             # Master coordinator & Three.js scene
│   │   ├── GameState.js        # State machine (Boot, Home, Playing, etc.)
│   │   └── GameLoop.js         # Single RAF loop with delta-time clamping
│   ├── player/
│   │   ├── Player.js           # 3D craft mesh, cockpit glow & thruster trail
│   │   └── PlayerController.js # Lateral steering, banking lean & smoothing
│   ├── world/
│   │   ├── Tunnel.js           # Endless tunnel pipeline & color progression
│   │   ├── TunnelSegment.js    # Reusable 3D decagonal tunnel segment
│   │   └── WorldManager.js     # Speed streaks, space dust & camera tilt/shake
│   ├── obstacles/
│   │   ├── Obstacle.js         # 3D obstacle entity with geometric colliders
│   │   ├── ObstacleFactory.js  # 5 readable core obstacle families
│   │   ├── PatternGenerator.js # Seeded PRNG with reachability validation
│   │   └── SpawnManager.js     # Object pooling & distance-based spawning
│   ├── systems/
│   │   ├── CollisionSystem.js  # Fair collision check & near-miss triggers
│   │   ├── DifficultyManager.js# Asymptotic speed scaling & obstacle tiers
│   │   ├── ScoreManager.js     # Distance tracking & high score persistence
│   │   ├── InputManager.js     # State-aware keyboard & touch handling
│   │   ├── AudioManager.js     # Web Audio synth + Kenney CC0 SFX
│   │   └── SaveManager.js      # Safe LocalStorage persistence
│   ├── ui/
│   │   ├── UIManager.js        # Screen orchestrator & countdown FX
│   │   ├── HUD.js              # Distance, speed & near-miss banner
│   │   ├── HomeScreen.js       # Play, tutorial, settings & best distance
│   │   ├── HowToPlayScreen.js  # Mission briefing modal
│   │   ├── SettingsScreen.js   # SFX, music, effects & sensitivity toggles
│   │   ├── PauseScreen.js      # Dimmed pause menu
│   │   └── GameOverScreen.js   # Score summary & instant replay
│   ├── platform/
│   │   └── CrazyGamesAdapter.js# CrazyGames SDK v2/v3 adapter
│   └── vendor/
│       └── three.module.js     # Offline self-contained Three.js library
└── assets/
    ├── audio/                  # Kenney CC0 audio assets (clicks, crash, etc.)
    └── icons/                  # SVG icons and favicon
```

---

## Asset Attribution & Licensing

- All audio assets are CC0 (Public Domain) sourced from [Kenney Assets](https://kenney.nl/assets).
- 3D models, procedural geometry, shaders, UI designs, and code are 100% original implementation.
