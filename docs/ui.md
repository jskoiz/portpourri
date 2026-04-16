# UI

Portpourri is a watched-port ownership tool. Every UI surface should answer the same story first: which watched ports matter, who owns or blocks them, and what safe action you can take next.

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
2. **Primary grouping** — The popover can be grouped by project or by port. Project mode shows compact project rows first, with process details nested behind disclosure rows. Port mode shows watched-port rows first, but only for ports that are currently in use. Port mode is the default presentation.
3. **Other listeners / Blockers** — Non-Node processes occupying ports. Collapsed by default with disclosure toggle.
4. **Active Node** — Listener-backed Node processes grouped within an explicit project ownership boundary, then by tool type (node, next dev, expo start, etc.). This section appears in Port mode, where the popover needs a separate machine/process summary. In Project mode it is intentionally hidden because the project rows already carry that information.
5. **Background Node** — Machine-wide Node-family inventory that is not already represented by the listener-backed Active Node section. Collapsed by default. Only grouped buckets with 3 or more processes are shown, so background Node load stays visible without surfacing one-off noise.
6. **AI tools** — Claude Code and Codex worktree summary with count and total size. Collapsed by default. Lists worktrees with name, project, size, and stale badge (3+ days untouched). Read-only display only; no cleanup action is exposed in Phase 2.5.

### Accessibility

- Interactive rows and actions expose explicit accessibility labels and hints instead of relying on visible copy alone.
- Dense summary rows combine their text into a single VoiceOver announcement, while action buttons remain individually focusable.
- Key popover and settings controls also expose stable accessibility identifiers so UI automation can be added without renaming the visible product copy.

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
- Start at login (available only for a signed app installed in `/Applications` or `~/Applications`)
- Refresh cadence (15s, 1m, 5m)
- Keyboard shortcut (modifier + key pickers with live preview)
- Confirm destructive actions toggle
- Notifications: conflict notification toggle, sound toggle

### Display
- Appearance picker: System / Light / Dark for the popover and settings window
- Menu bar display mode picker with live preview
- Dot Matrix legend (shown when Dot Matrix mode is selected)
- Show conflict badge toggle
- Hide icon when idle toggle
- Popover grouping mode (Project / Port), which switches the popover between project-first and port-first layouts
- Show non-Node listeners toggle

### Ports
- Watched ports list (comma-separated)
- Port suggestion command template

### Advanced
- Copy latest snapshot JSON
- Live probe diagnostics with listener / metadata / inventory status
- Shell command diagnostics

### About
- App info (version, build, build time)
- Links: Website, GitHub, Issues & Feedback, Release Notes, @jskoiz on X
