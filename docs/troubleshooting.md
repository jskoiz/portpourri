# Troubleshooting

## Common cases

### A watched port is blocked

Run:

```bash
swift run portpourri why 3000
swift run portpourri list --watched
```

`why` tells you whether the port is free, owned by one of your Node projects, or blocked by another process. `list --watched` gives you the full watched-port picture in one pass.

### The app and the CLI disagree

Run:

```bash
swift run portpourri snapshot --json
swift run portpourri doctor
```

`snapshot --json` is the canonical machine-readable export. `doctor` summarizes which probes succeeded and prints the exact shell commands Portpourri uses.

### You need the raw probe commands

Portpourri relies on these commands:

```bash
lsof -nP -Fpcuftn -iTCP -sTCP:LISTEN
ps -p <pids> -o pid=,ppid=,etime=,state=,command=
lsof -a -p <pid> -d cwd -Fn
ps -eo pid=,rss=,command=
```

Run them manually if you need to compare Portpourri's interpretation with raw system output.

## What Portpourri can infer

- which watched ports are free, owned by your Node project, or blocked
- which project root a Node-family listener belongs to
- which non-Node listener is occupying a watched port
- machine-wide Node inventory for secondary process-group reporting

## What Portpourri cannot infer

- user intent for arbitrary non-Node background processes
- whether a non-Node listener is safe to terminate
- privileged or hidden listeners outside the normal probe surface
- every project relationship in mixed-language or non-Node ecosystems
