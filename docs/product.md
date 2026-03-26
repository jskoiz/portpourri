# Product

## Problem

Local development often fails because common ports like `3000`, `5173`, or `8081` are already occupied. Today that means switching to Terminal, checking PIDs, and manually tracing the owning process back to a project.

## V1 goal

Make port ownership obvious from the menu bar in one click.

## Core behaviors

- Show watched-port occupancy at a glance.
- Group Node-family listeners by project.
- Highlight conflicts where a watched port is held by a non-Node process.
- Keep actions safe and local-first.

## Not in v1

- Privileged inspection.
- Force kill.
- Restart automation.
- Update infrastructure, widgets, or telemetry backends.
