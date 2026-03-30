# UI

Portpourri is a watched-port ownership and conflict tool. Every UI surface reinforces the same story: which project owns each watched port, and what safe action you can take when something is blocking.

## Menu bar

Five display modes are available. The default for first-run users is `countAndMemory`.

| Mode | Appearance | Description |
|------|------------|-------------|
| Projects + Memory | `3 · 2.1G` | Project count and total Node memory |
| Project Count | `3` | Project count only |
| Memory Usage | `2.1G` | Total Node memory only |
| Icon Only | `N` | Minimal indicator |
| Dot Matrix | `●●○` | Two-row glyph showing project and port status |

### Dot Matrix semantics

The Dot Matrix is a port-status glyph, not a memory gauge.

- **Top row**: one dot per active project (green, up to 5)
- **Bottom row**: first 5 watched ports in deterministic port-number order

Bottom-row dot states:

| State | Color | Condition |
|-------|-------|-----------|
| Free | dim | Port not busy |
| Owned by your project | green | Busy, single Node owner, no conflict |
| Busy non-owned | amber | Busy, non-Node owner (or mixed) |
| Explicit conflict | red | Busy, multiple Node owners fighting |

The conflict badge (white circle with count) overlays the Dot Matrix when conflicts exist and the badge setting is enabled. There is no separate overflow indicator if more than 5 watched ports are configured; only the first 5 are rendered.

### Tooltip

The tooltip is dynamic and reflects current state:

```
3 projects · 2 watched ports busy · 1 conflict (⌃⇧P)
```

When idle: `Idle (⌃⇧P)`.

## Popover

The popover answers three questions in order:

1. Which watched ports matter right now?
2. Who owns or blocks them?
3. What safe action can I take?

### Section order

1. **Header** — App title, sample/live indicator, summary line (conflict count + running count), last updated time.
2. **Watched Ports** — All configured watched ports sorted conflicts-first, then blocked, then owned, then free. Each row shows a color-coded port badge (matching Dot Matrix states), an ownership headline, and an action button if applicable.
3. **Other listeners / Blockers** — Non-Node processes occupying ports. Collapsed by default with disclosure toggle.
4. **Process groups** — Active-listener Node processes grouped within an explicit project ownership boundary, then by tool type (node, next dev, expo start, etc.). Each row shows count, project identity, watched-port summary, and Kill group. Groups are derived only from current active listeners and never merge unrelated projects that share a tool label.
5. **AI tools** — Claude Code and Codex worktree summary with count and total size. Collapsed by default. Lists worktrees with name, project, size, and stale badge (3+ days untouched). Read-only display only; no cleanup action is exposed in Phase 2.5.

## Action labels

Labels are ownership-aware and use specific verbs:

| Context | Label | Tone |
|---------|-------|------|
| Your Node project owns the port | **Stop server** | green |
| External blocker on watched port | **Free port** | red |
| SSH tunnel | **Stop tunnel** | red |
| Generic terminable process | **Stop blocker** | red |
| Grouped Node process cleanup | **Kill group** | red |

### Confirmation prompts

When destructive confirmations are enabled, the prompt copy must match the action:

- **Stop server** — names the watched port and states that only the selected server receives `SIGTERM`
- **Free port** — states that only the selected blocker is being stopped to free the watched port
- **Stop tunnel** — states that only the selected SSH tunnel receives `SIGTERM`
- **Kill group** — states that only the active-listener group inside the named project boundary is affected

## Settings

Five tabs:

### General
- Start at login
- Refresh cadence (15s, 1m, 5m)
- Keyboard shortcut (modifier + key pickers with live preview)
- Confirm destructive actions toggle
- Notifications: conflict notification toggle, sound toggle

### Display
- Menu bar display mode picker with live preview
- Dot Matrix legend (shown when Dot Matrix mode is selected)
- Show conflict badge toggle
- Hide icon when idle toggle
- Popover grouping mode (Project / Port)
- Show non-Node listeners toggle

### Ports
- Watched ports list (comma-separated)
- Port suggestion command template

### Advanced
- Copy latest snapshot JSON
- Shell command diagnostics

### About
- App info (version, build, build time)
- Links: Website, GitHub, Issues & Feedback, Release Notes, @jskoiz on X
