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

public struct NodeProcessGroup: Codable, Hashable, Sendable, Identifiable {
    public let toolLabel: String
    public let count: Int
    public let totalMemoryBytes: Int
    public let pids: [Int]

    public init(toolLabel: String, count: Int, totalMemoryBytes: Int, pids: [Int]) {
        self.toolLabel = toolLabel
        self.count = count
        self.totalMemoryBytes = totalMemoryBytes
        self.pids = pids
    }

    public var id: String { self.toolLabel }

    public var formattedMemory: String {
        let mb = Double(self.totalMemoryBytes) / (1024 * 1024)
        if mb >= 1024 {
            return String(format: "%.1f GB", mb / 1024)
        }
        return String(format: "%.0f MB", mb)
    }
}

public struct SnapshotSummary: Codable, Hashable, Sendable {
    public let nodeProjectCount: Int
    public let watchedBusyCount: Int
    public let otherListenerCount: Int
    public let watchedNonNodeConflictCount: Int
    public let nodeProcessTotalCount: Int
    public let nodeProcessTotalMemoryBytes: Int

    public init(
        nodeProjectCount: Int,
        watchedBusyCount: Int,
        otherListenerCount: Int,
        watchedNonNodeConflictCount: Int,
        nodeProcessTotalCount: Int = 0,
        nodeProcessTotalMemoryBytes: Int = 0
    ) {
        self.nodeProjectCount = nodeProjectCount
        self.watchedBusyCount = watchedBusyCount
        self.otherListenerCount = otherListenerCount
        self.watchedNonNodeConflictCount = watchedNonNodeConflictCount
        self.nodeProcessTotalCount = nodeProcessTotalCount
        self.nodeProcessTotalMemoryBytes = nodeProcessTotalMemoryBytes
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

public struct PortOwnershipSnapshot: Codable, Hashable, Sendable {
    public let generatedAt: Date
    public let watchedPorts: [WatchedPortStatus]
    public let projects: [ProjectSnapshot]
    public let otherProcesses: [TrackedProcessSnapshot]
    public let diagnostics: ProbeDiagnostics

    public init(
        generatedAt: Date,
        watchedPorts: [WatchedPortStatus],
        projects: [ProjectSnapshot],
        otherProcesses: [TrackedProcessSnapshot],
        diagnostics: ProbeDiagnostics
    ) {
        self.generatedAt = generatedAt
        self.watchedPorts = watchedPorts
        self.projects = projects
        self.otherProcesses = otherProcesses
        self.diagnostics = diagnostics
    }

    public static func empty(watchedPorts: [Int], source: String = "empty") -> PortOwnershipSnapshot {
        let statuses = watchedPorts.sorted().map {
            WatchedPortStatus(port: $0, isBusy: false, ownerSummary: "Free", isNodeOwned: false, isConflict: false)
        }
        return PortOwnershipSnapshot(
            generatedAt: Date(),
            watchedPorts: statuses,
            projects: [],
            otherProcesses: [],
            diagnostics: ProbeDiagnostics(commands: SnapshotService.diagnosticCommands, source: source)
        )
    }

    public var summary: SnapshotSummary {
        SnapshotSummary(
            nodeProjectCount: self.projects.count,
            watchedBusyCount: self.watchedPorts.filter(\.isBusy).count,
            otherListenerCount: self.otherProcesses.count,
            watchedNonNodeConflictCount: self.watchedPorts.filter(\.isConflict).count
        )
    }
}

public struct ProcessInventorySnapshot: Codable, Hashable, Sendable {
    public let generatedAt: Date
    public let nodeProcessGroups: [NodeProcessGroup]

    public init(generatedAt: Date, nodeProcessGroups: [NodeProcessGroup]) {
        self.generatedAt = generatedAt
        self.nodeProcessGroups = nodeProcessGroups
    }

    public static var empty: ProcessInventorySnapshot {
        ProcessInventorySnapshot(generatedAt: Date(), nodeProcessGroups: [])
    }

    public var totalNodeCount: Int {
        self.nodeProcessGroups.reduce(0) { $0 + $1.count }
    }

    public var totalNodeMemoryBytes: Int {
        self.nodeProcessGroups.reduce(0) { $0 + $1.totalMemoryBytes }
    }
}

public struct AppSnapshot: Codable, Hashable, Sendable {
    public let generatedAt: Date
    public let summary: SnapshotSummary
    public let watchedPorts: [WatchedPortStatus]
    public let projects: [ProjectSnapshot]
    public let otherProcesses: [TrackedProcessSnapshot]
    public let nodeProcessGroups: [NodeProcessGroup]
    public let diagnostics: ProbeDiagnostics

    public init(
        generatedAt: Date,
        summary: SnapshotSummary,
        watchedPorts: [WatchedPortStatus],
        projects: [ProjectSnapshot],
        otherProcesses: [TrackedProcessSnapshot],
        nodeProcessGroups: [NodeProcessGroup] = [],
        diagnostics: ProbeDiagnostics
    ) {
        self.generatedAt = generatedAt
        self.summary = summary
        self.watchedPorts = watchedPorts
        self.projects = projects
        self.otherProcesses = otherProcesses
        self.nodeProcessGroups = nodeProcessGroups
        self.diagnostics = diagnostics
    }

    public init(ownership: PortOwnershipSnapshot, inventory: ProcessInventorySnapshot = .empty) {
        self.generatedAt = ownership.generatedAt
        self.summary = SnapshotSummary(
            nodeProjectCount: ownership.summary.nodeProjectCount,
            watchedBusyCount: ownership.summary.watchedBusyCount,
            otherListenerCount: ownership.summary.otherListenerCount,
            watchedNonNodeConflictCount: ownership.summary.watchedNonNodeConflictCount,
            nodeProcessTotalCount: inventory.totalNodeCount,
            nodeProcessTotalMemoryBytes: inventory.totalNodeMemoryBytes
        )
        self.watchedPorts = ownership.watchedPorts
        self.projects = ownership.projects
        self.otherProcesses = ownership.otherProcesses
        self.nodeProcessGroups = inventory.nodeProcessGroups
        self.diagnostics = ownership.diagnostics
    }

    public static func empty(watchedPorts: [Int], source: String = "empty") -> AppSnapshot {
        AppSnapshot(ownership: .empty(watchedPorts: watchedPorts, source: source))
    }

    public var allProcesses: [TrackedProcessSnapshot] {
        self.projects.flatMap(\.processes) + self.otherProcesses
    }
}

public struct SnapshotExportEnvelope: Codable, Hashable, Sendable {
    public static let currentSchemaVersion = "0.1"

    public let schemaVersion: String
    public let snapshot: AppSnapshot

    public init(schemaVersion: String = Self.currentSchemaVersion, snapshot: AppSnapshot) {
        self.schemaVersion = schemaVersion
        self.snapshot = snapshot
    }
}

public enum ProbeCheckStatus: String, Codable, CaseIterable, Sendable {
    case ok
    case failed
}

public struct ProbeCheckResult: Codable, Hashable, Sendable {
    public let status: ProbeCheckStatus
    public let detail: String?

    public init(status: ProbeCheckStatus, detail: String? = nil) {
        self.status = status
        self.detail = detail
    }
}

public struct SnapshotDoctorReport: Codable, Hashable, Sendable {
    public let generatedAt: Date
    public let watchedPorts: [Int]
    public let diagnostics: ProbeDiagnostics
    public let listenerProbe: ProbeCheckResult
    public let metadataEnrichment: ProbeCheckResult
    public let inventoryScan: ProbeCheckResult

    public init(
        generatedAt: Date,
        watchedPorts: [Int],
        diagnostics: ProbeDiagnostics,
        listenerProbe: ProbeCheckResult,
        metadataEnrichment: ProbeCheckResult,
        inventoryScan: ProbeCheckResult
    ) {
        self.generatedAt = generatedAt
        self.watchedPorts = watchedPorts
        self.diagnostics = diagnostics
        self.listenerProbe = listenerProbe
        self.metadataEnrichment = metadataEnrichment
        self.inventoryScan = inventoryScan
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

// MARK: - AI Tool Models

public struct AIWorktreeEntry: Codable, Hashable, Sendable, Identifiable {
    public let path: String
    public let name: String
    public let sizeBytes: Int64
    public let projectName: String?
    public let lastModified: Date

    public init(path: String, name: String, sizeBytes: Int64, projectName: String?, lastModified: Date = Date()) {
        self.path = path
        self.name = name
        self.sizeBytes = sizeBytes
        self.projectName = projectName
        self.lastModified = lastModified
    }

    public var id: String { self.path }

    public var formattedSize: String {
        let mb = Double(self.sizeBytes) / (1024 * 1024)
        if mb >= 1024 {
            return String(format: "%.1f GB", mb / 1024)
        }
        return String(format: "%.0f MB", mb)
    }

    public var daysSinceModified: Int {
        Int(Date().timeIntervalSince(self.lastModified) / 86400)
    }

    public var isStale: Bool {
        self.daysSinceModified >= 3
    }
}

public struct AIToolSnapshot: Codable, Hashable, Sendable {
    public let claudeWorktrees: [AIWorktreeEntry]
    public let codexWorktrees: [AIWorktreeEntry]
    public let claudeSessionCount: Int
    public let codexSessionCount: Int
    public let totalSizeBytes: Int64

    public init(
        claudeWorktrees: [AIWorktreeEntry] = [],
        codexWorktrees: [AIWorktreeEntry] = [],
        claudeSessionCount: Int = 0,
        codexSessionCount: Int = 0,
        totalSizeBytes: Int64 = 0
    ) {
        self.claudeWorktrees = claudeWorktrees
        self.codexWorktrees = codexWorktrees
        self.claudeSessionCount = claudeSessionCount
        self.codexSessionCount = codexSessionCount
        self.totalSizeBytes = totalSizeBytes
    }

    public static let empty = AIToolSnapshot()

    public var claudeTotalSize: Int64 {
        self.claudeWorktrees.reduce(0) { $0 + $1.sizeBytes }
    }

    public var codexTotalSize: Int64 {
        self.codexWorktrees.reduce(0) { $0 + $1.sizeBytes }
    }

    public var hasContent: Bool {
        !self.claudeWorktrees.isEmpty || !self.codexWorktrees.isEmpty
            || self.claudeSessionCount > 0 || self.codexSessionCount > 0
    }

    public var staleClaudeWorktrees: [AIWorktreeEntry] {
        self.claudeWorktrees.filter(\.isStale)
    }

    public var staleCodexWorktrees: [AIWorktreeEntry] {
        self.codexWorktrees.filter(\.isStale)
    }

    public var totalStaleCount: Int {
        self.staleClaudeWorktrees.count + self.staleCodexWorktrees.count
    }

    public var totalStaleSize: Int64 {
        self.staleClaudeWorktrees.reduce(0) { $0 + $1.sizeBytes }
            + self.staleCodexWorktrees.reduce(0) { $0 + $1.sizeBytes }
    }
}
