import Foundation

public struct SnapshotService: Sendable {
    public static let defaultWatchedPorts = [3000, 3001, 5000, 5173, 5432, 5433, 6006, 6379, 8080, 8081, 9229]
    public static let diagnosticCommands = [
        "lsof -nP -Fpcuftn -iTCP -sTCP:LISTEN",
        "ps -p <pids> -o pid=,ppid=,etime=,state=,command=",
        "lsof -a -p <pid> -d cwd -Fn",
        "ps -eo pid=,rss=,command=",
    ]

    private let listenerProbe: ListenerProbing
    private let metadataProbe: ProcessMetadataProbing
    private let projectResolver: ProjectResolving
    private let exporter: SnapshotExporting
    private let classifier = NodeProcessClassifier()
    private let shellRunner: ShellCommandRunning

    public init(
        listenerProbe: ListenerProbing = LsofListenerProbe(),
        metadataProbe: ProcessMetadataProbing = PSProcessMetadataProbe(),
        projectResolver: ProjectResolving = DefaultProjectResolver(),
        exporter: SnapshotExporting = JSONSnapshotExporter(),
        shellRunner: ShellCommandRunning = ProcessShellRunner()
    ) {
        self.listenerProbe = listenerProbe
        self.metadataProbe = metadataProbe
        self.projectResolver = projectResolver
        self.exporter = exporter
        self.shellRunner = shellRunner
    }

    public func captureLiveOwnershipSnapshot(watchedPorts: [Int]) throws -> PortOwnershipSnapshot {
        let listeners = self.normalizeListeners(try self.listenerProbe.listeners())
        return try self.buildOwnershipSnapshot(listeners: listeners, watchedPorts: watchedPorts, source: "live")
    }

    public func captureLiveProcessInventory() throws -> ProcessInventorySnapshot {
        try self.buildProcessInventory(source: "live")
    }

    public func captureLiveSnapshot(watchedPorts: [Int]) throws -> AppSnapshot {
        let ownership = try self.captureLiveOwnershipSnapshot(watchedPorts: watchedPorts)
        let inventory = (try? self.captureLiveProcessInventory()) ?? .empty
        return AppSnapshot(ownership: ownership, inventory: inventory)
    }

    public func exportJSON(snapshot: AppSnapshot) throws -> Data {
        try self.exporter.export(snapshot: snapshot)
    }

    private func buildOwnershipSnapshot(
        listeners: [ListenerSnapshot],
        watchedPorts: [Int],
        source: String
    ) throws -> PortOwnershipSnapshot {
        let pidSet = Array(Set(listeners.map(\.pid))).sorted()
        let rawProcesses = try self.metadataProbe.processes(for: pidSet)
        let cwdMapping = try self.metadataProbe.currentWorkingDirectories(for: pidSet)

        let parentIDs = Array(Set(rawProcesses.values.map(\.ppid))).sorted()
        let parentProcesses = try self.metadataProbe.processes(for: parentIDs)

        let processes = rawProcesses.values.map { raw in
            let cwd = cwdMapping[raw.pid]
            let parentCommand = parentProcesses[raw.ppid]?.commandLine
            return self.classifier.classify(
                pid: raw.pid,
                ppid: raw.ppid,
                state: raw.state,
                uptime: raw.uptime,
                commandLine: raw.commandLine,
                parentCommandLine: parentCommand,
                cwd: cwd
            )
        }

        let listenersByPID = Dictionary(grouping: listeners, by: \.pid)
        let tracked = processes
            .filter { listenersByPID[$0.pid] != nil }
            .map { process -> TrackedProcessSnapshot in
                let ownedListeners = (listenersByPID[process.pid] ?? []).sorted {
                    if $0.port == $1.port {
                        return $0.hostScope.rawValue < $1.hostScope.rawValue
                    }
                    return $0.port < $1.port
                }
                let displayProcess = self.decorate(process: process, listeners: ownedListeners)
                let ports = Array(Set(ownedListeners.map(\.port))).sorted()
                let isWatchedConflict = ports.contains(where: watchedPorts.contains) && !displayProcess.isNodeFamily
                return TrackedProcessSnapshot(
                    process: displayProcess,
                    listeners: ownedListeners,
                    ports: ports,
                    isWatchedConflict: isWatchedConflict
                )
            }

        var projectGroups: [String: (ResolvedProject, [TrackedProcessSnapshot])] = [:]
        var otherProcesses: [TrackedProcessSnapshot] = []

        for trackedProcess in tracked {
            if trackedProcess.process.isNodeFamily,
               let resolved = self.projectResolver.resolveProject(for: trackedProcess.process)
            {
                projectGroups[resolved.rootPath, default: (resolved, [])].1.append(trackedProcess)
            } else {
                otherProcesses.append(trackedProcess)
            }
        }

        let projects = projectGroups.values
            .map { resolved, processes in
                let sortedProcesses = processes.sorted { lhs, rhs in
                    if lhs.isWatchedConflict != rhs.isWatchedConflict {
                        return lhs.isWatchedConflict && !rhs.isWatchedConflict
                    }
                    return lhs.process.toolLabel < rhs.process.toolLabel
                }
                let ports = Array(Set(sortedProcesses.flatMap(\.ports))).sorted()
                return ProjectSnapshot(
                    projectRoot: resolved.rootPath,
                    displayName: resolved.displayName,
                    processes: sortedProcesses,
                    ports: ports,
                    isWorktreeLike: resolved.isWorktreeLike
                )
            }
            .sorted { Self.compareProjects(lhs: $0, rhs: $1, watchedPorts: watchedPorts) }

        let watchedStatuses = watchedPorts.sorted().map { port in
            self.statusForWatchedPort(port, trackedProcesses: tracked)
        }

        otherProcesses.sort { lhs, rhs in
            if lhs.isWatchedConflict != rhs.isWatchedConflict {
                return lhs.isWatchedConflict && !rhs.isWatchedConflict
            }
            return lhs.process.commandLine < rhs.process.commandLine
        }

        return PortOwnershipSnapshot(
            generatedAt: Date(),
            watchedPorts: watchedStatuses,
            projects: projects,
            otherProcesses: otherProcesses,
            diagnostics: ProbeDiagnostics(commands: Self.diagnosticCommands, source: source)
        )
    }

    private func buildProcessInventory(source: String) throws -> ProcessInventorySnapshot {
        ProcessInventorySnapshot(
            generatedAt: Date(),
            nodeProcessGroups: try self.scanAllNodeProcesses()
        )
    }

    private func scanAllNodeProcesses() throws -> [NodeProcessGroup] {
        let output = try self.shellRunner.run(
            launchPath: "/bin/ps",
            arguments: ["-eo", "pid=,rss=,command="],
            allowNonZeroExitCodes: []
        )

        struct RawProcess {
            let pid: Int
            let rssKB: Int
            let commandLine: String
        }

        var rawProcesses: [RawProcess] = []
        for line in output.stdout.split(separator: "\n") {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            let tokens = trimmed.split(maxSplits: 2, omittingEmptySubsequences: true, whereSeparator: \.isWhitespace)
            guard tokens.count >= 3,
                  let pid = Int(tokens[0]),
                  let rss = Int(tokens[1]) else { continue }
            let command = String(tokens[2])
            rawProcesses.append(RawProcess(pid: pid, rssKB: rss, commandLine: command))
        }

        let nodeProcesses = rawProcesses.filter {
            self.classifier.isNodeFamily(commandLine: $0.commandLine, parentCommandLine: nil)
        }

        var groups: [String: (count: Int, totalBytes: Int, pids: [Int])] = [:]
        for process in nodeProcesses {
            let label = self.classifier.classify(
                pid: process.pid, ppid: 0, state: "", uptime: "",
                commandLine: process.commandLine, parentCommandLine: nil, cwd: nil
            ).toolLabel
            var entry = groups[label, default: (0, 0, [])]
            entry.count += 1
            entry.totalBytes += process.rssKB * 1024
            entry.pids.append(process.pid)
            groups[label] = entry
        }

        return groups.map { label, data in
            NodeProcessGroup(
                toolLabel: label,
                count: data.count,
                totalMemoryBytes: data.totalBytes,
                pids: data.pids.sorted()
            )
        }
        .sorted { $0.totalMemoryBytes > $1.totalMemoryBytes }
    }

    private func normalizeListeners(_ listeners: [ListenerSnapshot]) -> [ListenerSnapshot] {
        var mapping: [String: ListenerSnapshot] = [:]
        for listener in listeners {
            let key = "\(listener.pid)-\(listener.port)-\(listener.hostScope.rawValue)"
            if mapping[key] == nil {
                mapping[key] = listener
            }
        }
        return mapping.values.sorted {
            if $0.pid == $1.pid {
                return $0.port < $1.port
            }
            return $0.pid < $1.pid
        }
    }

    private func statusForWatchedPort(_ port: Int, trackedProcesses: [TrackedProcessSnapshot]) -> WatchedPortStatus {
        let owners = trackedProcesses.filter { $0.ports.contains(port) }
        let isBusy = !owners.isEmpty
        let ownerSummary = owners.isEmpty
            ? "Free"
            : owners.map {
                "\($0.process.toolLabel) (\($0.process.pid))"
            }
            .joined(separator: ", ")

        let nodeOwned = isBusy && owners.allSatisfy { $0.process.isNodeFamily }
        let isConflict = isBusy && (!nodeOwned || owners.count > 1)

        return WatchedPortStatus(
            port: port,
            isBusy: isBusy,
            ownerSummary: ownerSummary,
            isNodeOwned: nodeOwned,
            isConflict: isConflict
        )
    }

    private func decorate(process: ProcessSnapshot, listeners: [ListenerSnapshot]) -> ProcessSnapshot {
        guard !process.isNodeFamily, let commandName = listeners.first?.commandName, !commandName.isEmpty else {
            return process
        }

        return ProcessSnapshot(
            pid: process.pid,
            ppid: process.ppid,
            state: process.state,
            uptime: process.uptime,
            commandLine: process.commandLine,
            parentCommandLine: process.parentCommandLine,
            cwd: process.cwd,
            isNodeFamily: process.isNodeFamily,
            toolLabel: commandName
        )
    }

    private static func compareProjects(lhs: ProjectSnapshot, rhs: ProjectSnapshot, watchedPorts: [Int]) -> Bool {
        let lhsWatched = lhs.ports.filter { watchedPorts.contains($0) }.count
        let rhsWatched = rhs.ports.filter { watchedPorts.contains($0) }.count
        if lhsWatched != rhsWatched {
            return lhsWatched > rhsWatched
        }

        let nameComparison = lhs.displayName.localizedCaseInsensitiveCompare(rhs.displayName)
        if nameComparison != .orderedSame {
            return nameComparison == .orderedAscending
        }

        if lhs.isWorktreeLike != rhs.isWorktreeLike {
            return lhs.isWorktreeLike == false
        }

        if lhs.projectRoot != rhs.projectRoot {
            return lhs.projectRoot < rhs.projectRoot
        }

        return lhs.ports.lexicographicallyPrecedes(rhs.ports)
    }
}

public struct JSONSnapshotExporter: SnapshotExporting {
    public init() {}

    public func export(snapshot: AppSnapshot) throws -> Data {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        return try encoder.encode(snapshot)
    }
}
