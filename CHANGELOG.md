# Changelog

## v0.3.1

### App Renamed to Portpourri
- App renamed from NodeWatcher to **Portpourri**
- GitHub repository moved to [jskoiz/portpourri](https://github.com/jskoiz/portpourri)
- Swift modules renamed: `NodeTrackerCore` → `PortpourriCore`, `NodeTrackerApp` → `PortpourriApp`, `NodeTrackerCLI` → `PortpourriCLI`
- CLI binary renamed: `nodetracker` → `portpourri`
- Bundle ID updated to `dev.portpourri.app`
- Homebrew cask updated to `portpourri`

### Fixes
- Fix pre-existing test assertions to match current sample data (display names and port setup)

## v0.3.0

### New: Full Settings Window
- 5-tab preferences window: General, Display, Watched Ports, Shortcuts, About
- Configurable global hotkey — set any modifier+key combination to toggle the popover
- Watched ports onboarding flow on first launch with preset port groups
- Port suggestion command template — customize what gets copied when suggesting a free port (default: `PORT={port}`)

### New: Dev Servers Section
- "Other listeners" renamed and split into a dedicated **Dev Servers** section
- Accurate running count in section header
- Full command line shown as tooltip on hover for dev server rows

### New: Stale Worktree Detection
- Worktrees untouched for 3+ days are flagged as stale with a visual indicator
- Stale worktrees surfaced for cleanup actions in the AI Tools section

### UX Overhaul
- Fixed layout with animated drawer for node process groups (replaces scrolling popover)
- Process groups only shown when 3+ instances exist — reduces noise
- Smarter conflict actions: SSH tunnels through Docker now show "Stop tunnel" instead of "Open Docker"
- Removed low-value buttons ("Copy all fixes", "Open Docker")
- Drawer animates open/close instead of pushing content

### Dev Experience
- Added LICENSE (MIT), CONTRIBUTING.md, issue/PR templates, and CI workflow
- Swift 6 concurrency fixes for brand icon rendering
- Memory leak fixes and cancellable cleanup
- Trimmed dead code and hardened for distribution

## v0.2.9

### Dark Mode
- Popover now follows system appearance (light/dark) automatically
- Removed forced light mode — all colors use system-adaptive tokens

### Polish Pass
- Consistent text sizing across all rows (no more tiny caption2 mixed with caption)
- Process group counts, memory values, and port badges all bumped to caption size
- Unified chevron size (9pt) across all expandable rows
- AI tool icons slightly larger with better baseline alignment
- Worktree tag bumped from 9pt to 10pt
- Port badge padding refined

## v0.2.8

### New: Dot Matrix Menu Bar Mode
- Visual dot matrix display mode — top row shows project dots, bottom row shows memory gauge blocks
- Green→amber→red color coding based on memory pressure thresholds
- Select in Settings → Display → Menu bar display

### New: Brand Icons
- Claude Code and Codex rows now show their actual brand logos (SVG assets)
- Template images adapt automatically to light/dark menu bar

### Sample Data Overhaul
- Fully synthetic screenshot-ready demo: monorepo with api, web, mobile projects
- Realistic process groups, port assignments, and AI tool worktree counts
- Removed misleading Docker "conflict" (Docker on Postgres port is normal)
- Removed "Sample data mode" label for clean screenshots

### Polish
- Node processes expanded by default
- Shorter timestamp ("Just now" instead of "Updated just now")
- Tighter header spacing — summary stays on one line
- "Scanning worktrees..." loading state while AI tools probe runs

## v0.2.7

### New: AI Tools Section
- Shows Claude Code and Codex worktrees with count, session count, and total disk size
- Scans ~/.claude/, ~/.codex/, and per-project .claude/worktrees/ directories
- Expand to see individual worktrees sorted by size
- Actions: Reveal in Finder, Delete individual, Clear all
- Sizes over 1 GB highlighted in red
- Background async scanning — doesn't block the main snapshot refresh

### Fixes
- Fix popover dismiss animation snap (removed blanket .animation modifier)
- Add idle state view when no Node processes are running
- Scrollable worktree list (max 180pt) prevents popover overflow

## v0.2.6

### Visual Polish
- Lighter popover background with improved material vibrancy
- Better text contrast using system semantic colors (secondaryLabelColor)
- Semibold project names for faster scanning
- Animated chevron rotation on expand/collapse
- Hover highlights on project and process group rows

### UX Improvements
- Process group rows are now expandable — click to reveal Kill all + Copy PIDs
- ControlCenter filtered from port conflicts (macOS default, not actionable)
- Narrower popover width (330pt) for a tighter fit

### Sample Data
- More realistic process group counts and memory values

## v0.2.5

- Multi-owner conflict detail improvements
- Fix multi-owner conflict card labeling

## v0.2.1

- Fix launch crash when requesting notifications

## v0.1.1

- Release pipeline: code signing, notarization, Homebrew
- CI validation fixes

## v0.1.0

- Initial release
