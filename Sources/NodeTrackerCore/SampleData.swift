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
        let catalog = FixtureCatalog()
        guard let fixture = catalog.fixture(named: fixtureName) else {
            return .empty(watchedPorts: watchedPorts, source: "sample")
        }
        let service = SnapshotService(
            listenerProbe: FixtureListenerProbe(fixture: fixture),
            metadataProbe: FixtureProcessMetadataProbe(fixture: fixture),
            projectResolver: FixtureProjectResolver(fixture: fixture)
        )
        guard let liveSnapshot = try? service.captureLiveSnapshot(watchedPorts: watchedPorts) else {
            return .empty(watchedPorts: watchedPorts, source: "sample")
        }

        return AppSnapshot(
            generatedAt: liveSnapshot.generatedAt,
            summary: liveSnapshot.summary,
            watchedPorts: liveSnapshot.watchedPorts,
            projects: liveSnapshot.projects,
            otherProcesses: liveSnapshot.otherProcesses,
            diagnostics: ProbeDiagnostics(commands: SnapshotService.diagnosticCommands, source: "sample")
        )
    }
}
