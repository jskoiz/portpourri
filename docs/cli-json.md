# CLI JSON Contract

Portpourri's stable machine-readable output is the snapshot JSON envelope emitted by:

```bash
swift run portpourri snapshot --json
swift run portpourri fixtures --name mixed --json
```

`fixtures --name mixed --json` uses the same envelope with deterministic fixture data, which makes it the preferred source for CI checks, docs examples, and integration tests. `list` and `why` are human-readable commands today; automation should consume `snapshot --json` and derive those views from the fields below.

## Envelope

Every JSON export has this top-level shape:

```json
{
  "schemaVersion": "0.1",
  "snapshot": {}
}
```

- `schemaVersion` identifies the JSON contract version, not the app release version.
- Consumers should require a known major contract before parsing. For the current `0.x` contract, treat unknown fields as additive and tolerate them.
- Patch-compatible changes may add fields or enum cases without changing existing field meanings.
- Breaking changes require a schema version change and migration notes.

## Snapshot Shape

The `snapshot` object contains:

- `generatedAt`: ISO-8601 timestamp for when the snapshot was captured.
- `summary`: aggregate counts for projects, watched ports, other listeners, and Node-family process inventory.
- `watchedPorts`: sorted watched-port status records. This is the JSON source for `list --watched` and simple CI checks.
- `projects`: Node-family project groups with project root, display name, process records, and owned ports.
- `otherProcesses`: non-project listeners and blockers.
- `nodeProcessGroups`: Node-family process inventory grouped by tool label.
- `diagnostics`: probe metadata, including the source (`live`, `fixture`, or `empty`) and the commands used to capture the snapshot.

## List Shape

`portpourri list --watched` is a text rendering of `snapshot.watchedPorts`.

Use these fields for automation:

- `port`: numeric port.
- `isBusy`: whether any listener owns the port.
- `isNodeOwned`: whether Portpourri mapped the owner to a Node-family project.
- `isConflict`: whether a watched port is busy with a non-project listener or competing owners.
- `ownerSummary`: concise owner label, usually `<tool> (<pid>)` or `Free`.

`portpourri list --all` is a text rendering of `snapshot.projects` plus `snapshot.otherProcesses`.

Use:

- `projects[].displayName`, `projects[].projectRoot`, and `projects[].ports` for project-level ownership.
- `projects[].processes[]` and `otherProcesses[]` for process-level ownership.
- `process.toolLabel`, `process.pid`, `process.commandLine`, `ports`, and `listeners[]` for exact owner details.

## Why Shape

`portpourri why <port>` is a text rendering of one port lookup. For JSON automation, find the requested port in:

- `snapshot.watchedPorts[]` for watched/free/blocked status.
- `snapshot.projects[]` when `projects[].ports` contains the port.
- `snapshot.otherProcesses[]` when `otherProcesses[].ports` contains the port.

The typical status mapping is:

- Watched and `isBusy == false`: watched, free.
- Watched and `isNodeOwned == true`: watched, owned by your project.
- Watched and `isConflict == true`: watched, blocked or conflict, depending on the number of owners.
- Not present in `watchedPorts` and no owner record contains the port: not watched, free.
- Not watched and owned by one `projects[]` or `otherProcesses[]` record: not watched, busy or owned by project.

## Fixture Sample

The sample below is generated from the golden CLI JSON fixture used by `PortpourriCLITests`.

```json portpourri-fixture-sample
{
  "schemaVersion" : "0.1",
  "snapshot" : {
    "diagnostics" : {
      "commands" : [
        "lsof -nP -Fpcuftn -iTCP -sTCP:LISTEN",
        "ps -p <pids> -o pid=,ppid=,etime=,state=,command=",
        "lsof -a -p <pid> -d cwd -Fn",
        "ps -eo pid=,rss=,command="
      ],
      "source" : "fixture"
    },
    "generatedAt" : "2026-03-29T00:00:00Z",
    "nodeProcessGroups" : [
      {
        "count" : 3,
        "pids" : [
          123,
          124,
          125
        ],
        "toolLabel" : "vite",
        "totalMemoryBytes" : 150994944
      }
    ],
    "otherProcesses" : [
      {
        "isWatchedConflict" : true,
        "listeners" : [
          {
            "commandName" : "python3",
            "hostScope" : "loopback",
            "pid" : 456,
            "port" : 5433,
            "transport" : "tcp4"
          }
        ],
        "ports" : [
          5433
        ],
        "process" : {
          "commandLine" : "python3 -m http.server 5433",
          "cwd" : "/Users/example/tools",
          "isNodeFamily" : false,
          "pid" : 456,
          "ppid" : 1,
          "state" : "S",
          "toolLabel" : "python3",
          "uptime" : "00:05"
        }
      }
    ],
    "projects" : [
      {
        "displayName" : "@acme/web",
        "isWorktreeLike" : false,
        "ports" : [
          3000
        ],
        "processes" : [
          {
            "isWatchedConflict" : false,
            "listeners" : [
              {
                "commandName" : "node",
                "hostScope" : "loopback",
                "pid" : 123,
                "port" : 3000,
                "transport" : "tcp4"
              }
            ],
            "ports" : [
              3000
            ],
            "process" : {
              "commandLine" : "node /Users/example/acme/web/node_modules/.bin/vite",
              "cwd" : "/Users/example/acme/web",
              "isNodeFamily" : true,
              "parentCommandLine" : "npm exec vite",
              "pid" : 123,
              "ppid" : 1,
              "state" : "S",
              "toolLabel" : "vite",
              "uptime" : "00:10"
            }
          }
        ],
        "projectRoot" : "/Users/example/acme/web"
      }
    ],
    "summary" : {
      "nodeProcessTotalCount" : 3,
      "nodeProcessTotalMemoryBytes" : 150994944,
      "nodeProjectCount" : 1,
      "otherListenerCount" : 1,
      "watchedBusyCount" : 2,
      "watchedNonNodeConflictCount" : 1
    },
    "watchedPorts" : [
      {
        "isBusy" : true,
        "isConflict" : false,
        "isNodeOwned" : true,
        "ownerSummary" : "vite (123)",
        "port" : 3000
      },
      {
        "isBusy" : true,
        "isConflict" : true,
        "isNodeOwned" : false,
        "ownerSummary" : "python3 (456)",
        "port" : 5433
      }
    ]
  }
}
```
