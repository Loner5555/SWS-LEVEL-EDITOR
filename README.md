# SWS Level Studio Web

A browser-based Level Editor / Level Composer for **Stick War Saga** campaign levels.

> **This is NOT a JSON viewer.** This is a full Level Editor with smart asset picking, category-aware UI, and rich property editing.

## Quick Start

1. Open `index.html` in a modern browser (Chrome/Edge recommended).
2. Load metadata using one of these methods:
   - **Scan** a folder (light, AssetResources.asset only) — fastest startup.
   - **Build** a folder (deep, scans all `.asset` files) — richer metadata but heavier.
   - Place `metadata.json` in `local/` folder for auto-load on startup.
3. Load a level `.asset` file via the **Load Level** button.
4. Start editing!

## Setup — Local Data Folder

Place the following files in the `local/` folder for auto-load:

### metadata.json
- Automatically generated after scanning/building metadata.
- Or export using the 💾 **Save Metadata** button.

### AssetResources.asset
- Copy from: `ExportedProject/Assets/Resources/AssetResources.asset`
- The tool will auto-detect and build `metadata.json` if missing.

## Features

### Level Hierarchy
- Full tree view of **Settings → Teams → Events → Triggers + Actions**.
- Click any node to inspect and edit its properties.
- Right-click events for **Duplicate / Move Up / Move Down / Delete**.

### Team Editing
- Edit **LeftTeams** and **RightTeams** with all properties.
- Custom **Team Name** display (e.g., "Atreyos", "Borderland Flamefeaders").
- Team names are resolved everywhere: Spawn Actions, AI commands, etc.
- Edit **Loadout** — click `+ Add Item` to pick from all Slottable units.
- Edit **Customizations** — picks from `UnitCustomization` category.
- Edit **Techs**, **AiBuildTargets**, **UnitsToSpawn** with smart pickers.
- Edit **ExtraSlotsForDifficulty** and **DifficultiesToSpawnOn** as numeric arrays.

### AssetRef Fields (Profile Pic, Statue Skin, Banner, Wall, etc.)
- All `AssetRef*` fields show resolved names instead of raw IDs.
- Click the **⟳** button to open a category-filtered asset picker.
- Picker auto-detects category from field name:
  - `AssetRefProfilePicSpec` → ProfilePic picker
  - `AssetRefStatuePersonalizationSpec` → Statue picker
  - `AssetRefBannerPersonalizationSpec` → Banner picker
  - `AssetRefWallPersonalizationSpec` → Wall picker
  - `DefaultCampaignGeneralSpec` → General picker
  - `AssetRefAiUpgradeBuildingResearchPlanSpec` → TechTree picker

### Event & Action Editing
- **15+ custom Action inspectors** with smart UI:
  - Spawn Units — unit cards with count, team, side, hold position.
  - Spawn General — general picker with team assignment.
  - Camera Pan — position editor with X/Y coordinates.
  - Give Speech — text editor with position.
  - Research, Gesture, AI Command, Cutscene Mode, and more.
- **Add Action** — categorized dropdown with all action types.
- **Delete Action** — via ⋮ menu or `Del` key.
- **Copy/Paste Actions** — `Ctrl+C` / `Ctrl+V`.
- **Undo** — `Ctrl+Z` for all operations.

### Smart Add Item
- Arrays with known types open the correct **asset picker**:
  - `Loadout` → Slottable (Units, Generals, Spells)
  - `Customizations` → UnitCustomization
  - `Techs` → Tech
  - `AiBuildTargets` → Unit
  - `UnitsToSpawn` → Unit (creates full spawn unit with count=1)
  - `Spells` → Spell
- Scalar arrays (`DifficultiesToSpawnOn`, `ExtraSlotsForDifficulty`) add `0`.
- Curve `Keys` arrays add proper `{Time, Value, InTangent, OutTangent}` objects.
- Populated arrays **clone the last item** for quick duplication.

### Asset Metadata
- **Scan** mode: Parses `AssetResources.asset` for ID → path mapping.
- **Build** mode: Deep-scans all `.asset` files for rich metadata (descriptions, buildable flags, etc.).
- Smart **category classification** from folder paths:
  - `/slottables/campaign/generals/` → General
  - `/slottables/campaign/` → Unit
  - `/slottables/spell/` → Spell
  - `/slottables/research/` → Research
  - `/slottables/tech/` → Tech
  - `/unitcustomizations/` → UnitCustomization
  - `/levels/`, `/cutscenes/` → Level (not Unit!)
  - `/profilepic/` → ProfilePic
  - `/statues/` → Statue
  - `/banner/` → Banner
  - `/walls/` → Wall

### UI Features
- **Global Search** (`Ctrl+F`) — search assets and events.
- **Reference Explorer** — click any resolved asset name to see its details (category, path, description) and where it's referenced.
- **Palette** — side panel with categorized asset tabs (Units, Generals, Spells, etc.). Click to smart-add to current event.
- **Timeline** — visual strip of events with type badges.
- **Dark theme** with smooth animations and hover effects.

## Keyboard Shortcuts

| Key | Action |
|---|---|
| `Ctrl+Z` | Undo |
| `Ctrl+S` | Save level |
| `Ctrl+F` | Global search |
| `Ctrl+C` | Copy selected action |
| `Ctrl+V` | Paste action into current event |
| `Del` | Delete selected action/trigger/event |

## Architecture

- `index.html` — Entry point with layout structure.
- `styles.css` — Full dark theme styling.
- `engine.js` — Core logic:
  - `LevelParser` — Level data management (load, save, get/set, undo).
  - `Schema` — Action/Trigger templates and blank object factories.
  - `MetadataDB` — Asset metadata database with category classification.
  - `YAMLParser` — Unity `.asset` file parser.
- `app.js` — UI rendering, inspector, asset picker, palette, timeline.
