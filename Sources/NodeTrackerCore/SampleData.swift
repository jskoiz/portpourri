import Foundation

public struct SnapshotFixture: Sendable {
    public let name: String
    public let lsofOutput: String
    public let psOutput: String
    public let cwdOutput: String
    public let projectsByPID: [Int: ResolvedProject]

    public init(
        name: String,
        lsofOutput: String,
        psOutput: String,
        cwdOutput: String,
        projectsByPID: [Int: ResolvedProject]
    ) {
        self.name = name
        self.lsofOutput = lsofOutput
        self.psOutput = psOutput
        self.cwdOutput = cwdOutput
        self.projectsByPID = projectsByPID
    }
}

public struct FixtureCatalog: Sendable {
    public init() {}

    public var availableNames: [String] { ["mixed"] }

    public func fixture(named name: String) -> SnapshotFixture? {
        guard name == "mixed" else { return nil }

        guard let lsofURL = Bundle.module.url(forResource: "mixed", withExtension: "lsof"),
              let psURL = Bundle.module.url(forResource: "mixed", withExtension: "ps"),
              let cwdURL = Bundle.module.url(forResource: "mixed", withExtension: "cwd"),
              let lsofOutput = try? String(contentsOf: lsofURL),
              let psOutput = try? String(contentsOf: psURL),
              let cwdOutput = try? String(contentsOf: cwdURL)
        else { return nil }

        return SnapshotFixture(
            name: "mixed",
            lsofOutput: lsofOutput,
            psOutput: psOutput,
            cwdOutput: cwdOutput,
            projectsByPID: [
                61619: ResolvedProject(
                    rootPath: "/Users/example/acme/backend",
                    displayName: "@acme/backend",
                    isWorktreeLike: false
                ),
                62620: ResolvedProject(
                    rootPath: "/Users/example/acme/web",
                    displayName: "@acme/web",
                    isWorktreeLike: false
                ),
                63630: ResolvedProject(
                    rootPath: "/Users/example/acme/.claude/worktrees/focused/mobile",
                    displayName: "@acme/mobile",
                    isWorktreeLike: true
                ),
            ]
        )
    }
}

struct FixtureListenerProbe: ListenerProbing {
    let fixture: SnapshotFixture
    private let parser = LsofListenerParser()

    func listeners() throws -> [ListenerSnapshot] {
        self.parser.parse(self.fixture.lsofOutput)
    }
}

struct FixtureProcessMetadataProbe: ProcessMetadataProbing {
    let fixture: SnapshotFixture
    private let psParser = PSProcessParser()
    private let cwdParser = CWDParser()

    func processes(for pids: [Int]) throws -> [Int: ProcessSnapshot] {
        let available = self.psParser.parse(self.fixture.psOutput)
        let requested = Set(pids)
        return Dictionary(uniqueKeysWithValues: available.compactMap { key, record in
            guard requested.contains(key) else { return nil }
            return (
                key,
                ProcessSnapshot(
                    pid: record.pid,
                    ppid: record.ppid,
                    state: record.state,
                    uptime: record.uptime,
                    commandLine: record.commandLine,
                    parentCommandLine: nil,
                    cwd: nil,
                    isNodeFamily: false,
                    toolLabel: "unknown"
                )
            )
        })
    }

    func currentWorkingDirectories(for pids: [Int]) throws -> [Int: String] {
        let available = self.cwdParser.parse(self.fixture.cwdOutput)
        let requested = Set(pids)
        return Dictionary(uniqueKeysWithValues: available.filter { requested.contains($0.key) })
    }
}

struct FixtureProjectResolver: ProjectResolving {
    let fixture: SnapshotFixture

    func resolveProject(for process: ProcessSnapshot) -> ResolvedProject? {
        self.fixture.projectsByPID[process.pid]
    }
}

public extension SnapshotService {
    static func sampleSnapshot(
        watchedPorts: [Int] = SnapshotService.defaultWatchedPorts,
        fixtureName: String = "mixed"
    ) -> AppSnapshot {
        // Fully synthetic snapshot — no fixture files needed

        // --- Projects: a realistic monorepo dev session ---
        let backendProcesses: [TrackedProcessSnapshot] = [
            Self.makeProcess(pid: 41200, tool: "nest start", command: "node ./node_modules/.bin/nest start --watch", port: 3000, cwd: "/Users/dev/myapp/apps/api"),
            Self.makeProcess(pid: 41201, tool: "node", command: "node dist/main.js", port: nil, cwd: "/Users/dev/myapp/apps/api"),
        ]

        let webProcesses: [TrackedProcessSnapshot] = [
            Self.makeProcess(pid: 42300, tool: "next dev", command: "node ./node_modules/.bin/next dev --turbopack", port: 3001, cwd: "/Users/dev/myapp/apps/web"),
        ]

        let mobileProcesses: [TrackedProcessSnapshot] = [
            Self.makeProcess(pid: 43400, tool: "expo start", command: "node ./node_modules/.bin/expo start", port: 8081, cwd: "/Users/dev/myapp/.claude/worktrees/feature-auth/apps/mobile"),
        ]

        let storybookProcesses: [TrackedProcessSnapshot] = [
            Self.makeProcess(pid: 44500, tool: "storybook", command: "node ./node_modules/.bin/storybook dev -p 6006", port: 6006, cwd: "/Users/dev/myapp/apps/web"),
        ]

        let projects: [ProjectSnapshot] = [
            ProjectSnapshot(
                projectRoot: "/Users/dev/myapp/apps/api",
                displayName: "api",
                processes: backendProcesses,
                ports: [3000],
                isWorktreeLike: false
            ),
            ProjectSnapshot(
                projectRoot: "/Users/dev/myapp/apps/web",
                displayName: "web",
                processes: webProcesses + storybookProcesses,
                ports: [3001, 6006],
                isWorktreeLike: false
            ),
            ProjectSnapshot(
                projectRoot: "/Users/dev/myapp/.claude/worktrees/feature-auth/apps/mobile",
                displayName: "mobile",
                processes: mobileProcesses,
                ports: [8081],
                isWorktreeLike: true
            ),
        ]

        // --- Watched ports ---
        let watchedStatuses: [WatchedPortStatus] = [
            WatchedPortStatus(port: 3000, isBusy: true, ownerSummary: "nest start (41200)", isNodeOwned: true, isConflict: false),
            WatchedPortStatus(port: 3001, isBusy: true, ownerSummary: "next dev (42300)", isNodeOwned: true, isConflict: false),
            WatchedPortStatus(port: 5173, isBusy: false, ownerSummary: "Free", isNodeOwned: false, isConflict: false),
            WatchedPortStatus(port: 6006, isBusy: true, ownerSummary: "storybook (44500)", isNodeOwned: true, isConflict: false),
            WatchedPortStatus(port: 8080, isBusy: false, ownerSummary: "Free", isNodeOwned: false, isConflict: false),
            WatchedPortStatus(port: 8081, isBusy: true, ownerSummary: "expo start (43400)", isNodeOwned: true, isConflict: false),
        ]

        // --- Node process groups ---
        let nodeGroups: [NodeProcessGroup] = [
            NodeProcessGroup(toolLabel: "node", count: 12, totalMemoryBytes: 420 * 1024 * 1024, pids: Array(50000..<50012)),
            NodeProcessGroup(toolLabel: "next dev", count: 4, totalMemoryBytes: 310 * 1024 * 1024, pids: Array(51000..<51004)),
            NodeProcessGroup(toolLabel: "npm", count: 6, totalMemoryBytes: 145 * 1024 * 1024, pids: Array(52000..<52006)),
            NodeProcessGroup(toolLabel: "nest start", count: 3, totalMemoryBytes: 92 * 1024 * 1024, pids: Array(53000..<53003)),
            NodeProcessGroup(toolLabel: "expo start", count: 3, totalMemoryBytes: 88 * 1024 * 1024, pids: Array(54000..<54003)),
        ]

        let totalCount = nodeGroups.reduce(0) { $0 + $1.count }
        let totalMem = nodeGroups.reduce(0) { $0 + $1.totalMemoryBytes }

        // --- AI Tools ---
        let aiTools = AIToolSnapshot(
            claudeWorktrees: [
                AIWorktreeEntry(path: "/Users/dev/myapp/.claude/worktrees/feature-auth", name: "feature-auth", sizeBytes: 280 * 1024 * 1024, projectName: "myapp"),
                AIWorktreeEntry(path: "/Users/dev/myapp/.claude/worktrees/fix-ci", name: "fix-ci", sizeBytes: 245 * 1024 * 1024, projectName: "myapp"),
                AIWorktreeEntry(path: "/Users/dev/docs-site/.claude/worktrees/rewrite", name: "rewrite", sizeBytes: 62 * 1024 * 1024, projectName: "docs-site"),
            ],
            codexWorktrees: [
                AIWorktreeEntry(path: "/Users/dev/.codex/worktrees/a1b2", name: "a1b2", sizeBytes: 890 * 1024 * 1024, projectName: nil),
                AIWorktreeEntry(path: "/Users/dev/.codex/worktrees/c3d4", name: "c3d4", sizeBytes: 720 * 1024 * 1024, projectName: nil),
                AIWorktreeEntry(path: "/Users/dev/.codex/worktrees/e5f6", name: "e5f6", sizeBytes: 410 * 1024 * 1024, projectName: nil),
                AIWorktreeEntry(path: "/Users/dev/.codex/worktrees/g7h8", name: "g7h8", sizeBytes: 380 * 1024 * 1024, projectName: nil),
                AIWorktreeEntry(path: "/Users/dev/.codex/worktrees/i9j0", name: "i9j0", sizeBytes: 195 * 1024 * 1024, projectName: nil),
            ],
            claudeSessionCount: 8,
            codexSessionCount: 42,
            totalSizeBytes: (280 + 245 + 62 + 890 + 720 + 410 + 380 + 195) * 1024 * 1024
        )

        let summary = SnapshotSummary(
            nodeProjectCount: projects.count,
            watchedBusyCount: watchedStatuses.filter(\.isBusy).count,
            otherListenerCount: 0,
            watchedNonNodeConflictCount: 0,
            nodeProcessTotalCount: totalCount,
            nodeProcessTotalMemoryBytes: totalMem
        )

        return AppSnapshot(
            generatedAt: Date(),
            summary: summary,
            watchedPorts: watchedStatuses,
            projects: projects,
            otherProcesses: [],
            nodeProcessGroups: nodeGroups,
            aiTools: aiTools,
            diagnostics: ProbeDiagnostics(commands: Self.diagnosticCommands, source: "sample")
        )
    }

    private static func makeProcess(pid: Int, tool: String, command: String, port: Int?, cwd: String) -> TrackedProcessSnapshot {
        let listeners: [ListenerSnapshot]
        let ports: [Int]
        if let port {
            listeners = [ListenerSnapshot(pid: pid, port: port, hostScope: .loopback, transport: .tcp4, commandName: tool)]
            ports = [port]
        } else {
            listeners = []
            ports = []
        }
        return TrackedProcessSnapshot(
            process: ProcessSnapshot(
                pid: pid,
                ppid: pid - 1,
                state: "S",
                uptime: "01:23:45",
                commandLine: command,
                parentCommandLine: nil,
                cwd: cwd,
                isNodeFamily: true,
                toolLabel: tool
            ),
            listeners: listeners,
            ports: ports,
            isWatchedConflict: false
        )
    }
}
