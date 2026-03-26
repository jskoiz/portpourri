import Foundation

public enum HostScope: String, Codable, CaseIterable, Sendable {
    case any
    case loopback
    case specific
    case unknown

    public var label: String {
        switch self {
        case .any: "all interfaces"
        case .loopback: "localhost only"
        case .specific: "specific interface"
        case .unknown: "unknown interface"
        }
    }
}

public enum Transport: String, Codable, CaseIterable, Sendable {
    case tcp4
    case tcp6
}

public struct ListenerSnapshot: Codable, Hashable, Sendable, Identifiable {
    public let pid: Int
    public let port: Int
    public let hostScope: HostScope
    public let transport: Transport
    public let commandName: String

    public init(pid: Int, port: Int, hostScope: HostScope, transport: Transport, commandName: String) {
        self.pid = pid
        self.port = port
        self.hostScope = hostScope
        self.transport = transport
        self.commandName = commandName
    }

    public var id: String {
        "\(self.pid)-\(self.port)-\(self.hostScope.rawValue)"
    }
}

public struct ProcessSnapshot: Codable, Hashable, Sendable, Identifiable {
    public let pid: Int
    public let ppid: Int
    public let state: String
    public let uptime: String
    public let commandLine: String
    public let parentCommandLine: String?
    public let cwd: String?
    public let isNodeFamily: Bool
    public let toolLabel: String

    public init(
        pid: Int,
        ppid: Int,
        state: String,
        uptime: String,
        commandLine: String,
        parentCommandLine: String?,
        cwd: String?,
        isNodeFamily: Bool,
        toolLabel: String
    ) {
        self.pid = pid
        self.ppid = ppid
        self.state = state
        self.uptime = uptime
        self.commandLine = commandLine
        self.parentCommandLine = parentCommandLine
        self.cwd = cwd
        self.isNodeFamily = isNodeFamily
        self.toolLabel = toolLabel
    }

    public var id: Int { self.pid }
}

public struct TrackedProcessSnapshot: Codable, Hashable, Sendable, Identifiable {
    public let process: ProcessSnapshot
    public let listeners: [ListenerSnapshot]
    public let ports: [Int]
    public let isWatchedConflict: Bool

    public init(process: ProcessSnapshot, listeners: [ListenerSnapshot], ports: [Int], isWatchedConflict: Bool) {
        self.process = process
        self.listeners = listeners
        self.ports = ports
        self.isWatchedConflict = isWatchedConflict
    }

    public var id: Int { self.process.pid }
}

public struct ProjectSnapshot: Codable, Hashable, Sendable, Identifiable {
    public let projectRoot: String
    public let displayName: String
    public let processes: [TrackedProcessSnapshot]
    public let ports: [Int]
    public let isWorktreeLike: Bool

    public init(
        projectRoot: String,
        displayName: String,
        processes: [TrackedProcessSnapshot],
        ports: [Int],
        isWorktreeLike: Bool
    ) {
        self.projectRoot = projectRoot
        self.displayName = displayName
        self.processes = processes
        self.ports = ports
        self.isWorktreeLike = isWorktreeLike
    }

    public var id: String { self.projectRoot }
}

public struct WatchedPortStatus: Codable, Hashable, Sendable, Identifiable {
    public let port: Int
    public let isBusy: Bool
    public let ownerSummary: String
    public let isNodeOwned: Bool
    public let isConflict: Bool

    public init(port: Int, isBusy: Bool, ownerSummary: String, isNodeOwned: Bool, isConflict: Bool) {
        self.port = port
        self.isBusy = isBusy
        self.ownerSummary = ownerSummary
        self.isNodeOwned = isNodeOwned
        self.isConflict = isConflict
    }

    public var id: Int { self.port }
}

public struct SnapshotSummary: Codable, Hashable, Sendable {
    public let nodeProjectCount: Int
    public let watchedBusyCount: Int
    public let otherListenerCount: Int
    public let watchedNonNodeConflictCount: Int

    public init(
        nodeProjectCount: Int,
        watchedBusyCount: Int,
        otherListenerCount: Int,
        watchedNonNodeConflictCount: Int
    ) {
        self.nodeProjectCount = nodeProjectCount
        self.watchedBusyCount = watchedBusyCount
        self.otherListenerCount = otherListenerCount
        self.watchedNonNodeConflictCount = watchedNonNodeConflictCount
    }
}

public struct ProbeDiagnostics: Codable, Hashable, Sendable {
    public let commands: [String]
    public let source: String

    public init(commands: [String], source: String) {
        self.commands = commands
        self.source = source
    }
}

public struct AppSnapshot: Codable, Hashable, Sendable {
    public let generatedAt: Date
    public let summary: SnapshotSummary
    public let watchedPorts: [WatchedPortStatus]
    public let projects: [ProjectSnapshot]
    public let otherProcesses: [TrackedProcessSnapshot]
    public let diagnostics: ProbeDiagnostics

    public init(
        generatedAt: Date,
        summary: SnapshotSummary,
        watchedPorts: [WatchedPortStatus],
        projects: [ProjectSnapshot],
        otherProcesses: [TrackedProcessSnapshot],
        diagnostics: ProbeDiagnostics
    ) {
        self.generatedAt = generatedAt
        self.summary = summary
        self.watchedPorts = watchedPorts
        self.projects = projects
        self.otherProcesses = otherProcesses
        self.diagnostics = diagnostics
    }

    public static func empty(watchedPorts: [Int], source: String = "empty") -> AppSnapshot {
        let statuses = watchedPorts.sorted().map {
            WatchedPortStatus(port: $0, isBusy: false, ownerSummary: "Free", isNodeOwned: false, isConflict: false)
        }
        return AppSnapshot(
            generatedAt: Date(),
            summary: SnapshotSummary(
                nodeProjectCount: 0,
                watchedBusyCount: 0,
                otherListenerCount: 0,
                watchedNonNodeConflictCount: 0
            ),
            watchedPorts: statuses,
            projects: [],
            otherProcesses: [],
            diagnostics: ProbeDiagnostics(commands: SnapshotService.diagnosticCommands, source: source)
        )
    }

    public var allProcesses: [TrackedProcessSnapshot] {
        self.projects.flatMap(\.processes) + self.otherProcesses
    }
}

public struct ResolvedProject: Codable, Hashable, Sendable {
    public let rootPath: String
    public let displayName: String
    public let isWorktreeLike: Bool

    public init(rootPath: String, displayName: String, isWorktreeLike: Bool) {
        self.rootPath = rootPath
        self.displayName = displayName
        self.isWorktreeLike = isWorktreeLike
    }
}

public protocol ListenerProbing: Sendable {
    func listeners() throws -> [ListenerSnapshot]
}

public protocol ProcessMetadataProbing: Sendable {
    func processes(for pids: [Int]) throws -> [Int: ProcessSnapshot]
    func currentWorkingDirectories(for pids: [Int]) throws -> [Int: String]
}

public protocol ProjectResolving: Sendable {
    func resolveProject(for process: ProcessSnapshot) -> ResolvedProject?
}

public protocol SnapshotExporting: Sendable {
    func export(snapshot: AppSnapshot) throws -> Data
}
