import Foundation
import PortpourriCore

enum CLIError: Error, CustomStringConvertible {
    case usage(String)
    case fixtureNotFound(String)
    case invalidPort(String)

    var description: String {
        switch self {
        case let .usage(message): message
        case let .fixtureNotFound(name): "Unknown fixture: \(name)"
        case let .invalidPort(value): "Invalid port: \(value)"
        }
    }
}

enum CLIResponse {
    case text(String)
    case data(Data)
}

struct PortpourriCLIEnvironment {
    let watchedPorts: [Int]
    let fixtureCatalog: FixtureCatalog
    let liveSnapshot: () throws -> AppSnapshot
    let fixtureSnapshot: (String) -> AppSnapshot?
    let exportJSON: (AppSnapshot) throws -> Data
    let doctorReport: () -> SnapshotDoctorReport

    static func live(
        watchedPorts: [Int] = SnapshotService.defaultWatchedPorts,
        fixtureCatalog: FixtureCatalog = FixtureCatalog()
    ) -> PortpourriCLIEnvironment {
        let service = SnapshotService()
        return PortpourriCLIEnvironment(
            watchedPorts: watchedPorts,
            fixtureCatalog: fixtureCatalog,
            liveSnapshot: { try service.captureLiveSnapshot(watchedPorts: watchedPorts) },
            fixtureSnapshot: { name in
                guard fixtureCatalog.availableNames.contains(name) else { return nil }
                return SnapshotService.sampleSnapshot(watchedPorts: watchedPorts, fixtureName: name)
            },
            exportJSON: { snapshot in try service.exportJSON(snapshot: snapshot) },
            doctorReport: { service.captureDoctorReport(watchedPorts: watchedPorts) }
        )
    }
}

struct PortpourriCLICommandRunner {
    let environment: PortpourriCLIEnvironment

    init(environment: PortpourriCLIEnvironment = .live()) {
        self.environment = environment
    }

    func run(arguments: [String]) throws -> CLIResponse {
        guard let command = arguments.first else {
            throw CLIError.usage(Self.helpText)
        }

        switch command {
        case "snapshot":
            return try self.runSnapshot(arguments: Array(arguments.dropFirst()))
        case "fixtures":
            return try self.runFixtures(arguments: Array(arguments.dropFirst()))
        case "why":
            return try self.runWhy(arguments: Array(arguments.dropFirst()))
        case "list":
            return try self.runList(arguments: Array(arguments.dropFirst()))
        case "doctor":
            return self.runDoctor()
        case "help", "--help", "-h":
            return .text(Self.helpText)
        default:
            throw CLIError.usage(Self.helpText)
        }
    }

    private func runSnapshot(arguments: [String]) throws -> CLIResponse {
        let sample = arguments.contains("--sample-data")
        let wantsJSON = arguments.contains("--json")
        let snapshot = sample
            ? SnapshotService.sampleSnapshot(watchedPorts: self.environment.watchedPorts)
            : try self.environment.liveSnapshot()

        if wantsJSON {
            return .data(try self.environment.exportJSON(snapshot))
        }

        return .text(self.formatSummary(snapshot))
    }

    private func runFixtures(arguments: [String]) throws -> CLIResponse {
        if arguments.isEmpty || arguments.contains("--list") {
            return .text(self.environment.fixtureCatalog.availableNames.joined(separator: "\n"))
        }

        guard let nameIndex = arguments.firstIndex(of: "--name"),
              arguments.indices.contains(nameIndex + 1)
        else {
            throw CLIError.usage("Usage: portpourri fixtures --name <fixture> [--json]")
        }

        let name = arguments[nameIndex + 1]
        guard let snapshot = self.environment.fixtureSnapshot(name) else {
            throw CLIError.fixtureNotFound(name)
        }

        if arguments.contains("--json") {
            return .data(try self.environment.exportJSON(snapshot))
        }

        return .text(self.formatSummary(snapshot))
    }

    private func runWhy(arguments: [String]) throws -> CLIResponse {
        guard arguments.count == 1 else {
            throw CLIError.usage("Usage: portpourri why <port>")
        }
        guard let port = Int(arguments[0]) else {
            throw CLIError.invalidPort(arguments[0])
        }

        let snapshot = try self.environment.liveSnapshot()
        return .text(self.formatWhy(port: port, snapshot: snapshot))
    }

    private func runList(arguments: [String]) throws -> CLIResponse {
        let snapshot = try self.environment.liveSnapshot()
        let wantsWatched = arguments.contains("--watched")
        let wantsAll = arguments.contains("--all")

        guard wantsWatched != wantsAll else {
            throw CLIError.usage("Usage: portpourri list --watched | --all")
        }

        if wantsWatched {
            return .text(self.formatWatchedList(snapshot))
        }

        return .text(self.formatAllList(snapshot))
    }

    private func runDoctor() -> CLIResponse {
        .text(self.formatDoctor(self.environment.doctorReport()))
    }

    private func formatSummary(_ snapshot: AppSnapshot) -> String {
        var lines = [
            "Portpourri snapshot",
            "Updated: \(snapshot.generatedAt)",
            "Node projects: \(snapshot.summary.nodeProjectCount)",
            "Busy watched ports: \(snapshot.summary.watchedBusyCount)",
            "Other listeners: \(snapshot.summary.otherListenerCount)",
        ]

        if !snapshot.projects.isEmpty {
            lines.append("")
            for project in snapshot.projects {
                lines.append("\(project.displayName)  \(project.ports.map(String.init).joined(separator: ", "))")
            }
        }

        if !snapshot.otherProcesses.isEmpty {
            lines.append("")
            lines.append("Other listeners:")
            for process in snapshot.otherProcesses {
                lines.append("- PID \(process.process.pid): \(process.process.commandLine)")
            }
        }

        return lines.joined(separator: "\n")
    }

    private func formatWhy(port: Int, snapshot: AppSnapshot) -> String {
        let watchedStatus = snapshot.watchedPorts.first(where: { $0.port == port })
        let owners = self.owners(for: port, snapshot: snapshot)
        var lines = ["Port \(port)"]

        if let status = watchedStatus {
            if !status.isBusy {
                lines.append("Status: watched, free")
                return lines.joined(separator: "\n")
            }

            if status.isNodeOwned {
                lines.append("Status: watched, owned by your project")
            } else if self.isExplicitConflict(status: status, owners: owners) {
                lines.append("Status: watched, conflict")
            } else {
                lines.append("Status: watched, blocked")
            }

            lines.append("Owner: \(status.ownerSummary)")

            if let project = self.projectOwning(port: port, snapshot: snapshot) {
                lines.append("Project: \(project.displayName)")
                lines.append("Root: \(project.projectRoot)")
            } else if let owner = owners.first {
                lines.append("Tool: \(owner.process.toolLabel)")
                lines.append("PID: \(owner.process.pid)")
                lines.append("Command: \(owner.process.commandLine)")
            }

            return lines.joined(separator: "\n")
        }

        guard !owners.isEmpty else {
            lines.append("Status: not watched, free")
            return lines.joined(separator: "\n")
        }

        if let project = self.projectOwning(port: port, snapshot: snapshot) {
            lines.append("Status: not watched, owned by project")
            lines.append("Owner: \(project.displayName)")
            lines.append("Root: \(project.projectRoot)")
            return lines.joined(separator: "\n")
        }

        if owners.count > 1 {
            lines.append("Status: not watched, conflict")
            lines.append("Owner: \(owners.map { "\($0.process.toolLabel) (\($0.process.pid))" }.joined(separator: ", "))")
            return lines.joined(separator: "\n")
        }

        let owner = owners[0]
        lines.append("Status: not watched, busy")
        lines.append("Owner: \(owner.process.toolLabel) (\(owner.process.pid))")
        lines.append("Command: \(owner.process.commandLine)")
        return lines.joined(separator: "\n")
    }

    private func formatWatchedList(_ snapshot: AppSnapshot) -> String {
        snapshot.watchedPorts
            .sorted { $0.port < $1.port }
            .map { status in
                let summary: String
                if !status.isBusy {
                    summary = "free"
                } else if status.isNodeOwned {
                    summary = "owned by \(self.nodeOwnerLabel(for: status.port, snapshot: snapshot) ?? status.ownerSummary)"
                } else if self.isExplicitConflict(status: status, owners: self.owners(for: status.port, snapshot: snapshot)) {
                    summary = "conflict: \(status.ownerSummary)"
                } else {
                    summary = "blocked by \(status.ownerSummary)"
                }

                return "\(status.port)  \(summary)"
            }
            .joined(separator: "\n")
    }

    private func formatAllList(_ snapshot: AppSnapshot) -> String {
        var lines = ["Projects:"]

        for project in snapshot.projects {
            lines.append(project.displayName)
            for process in project.processes.sorted(by: Self.compareProcesses) {
                let ports = process.ports.map(String.init).joined(separator: ",")
                lines.append("  \(ports)  \(process.process.toolLabel)  pid \(process.process.pid)")
            }
        }

        lines.append("")
        lines.append("Other listeners:")
        for process in snapshot.otherProcesses.sorted(by: Self.compareProcesses) {
            let ports = process.ports.map(String.init).joined(separator: ",")
            lines.append("  \(ports)  \(process.process.toolLabel)  pid \(process.process.pid)")
        }

        return lines.joined(separator: "\n")
    }

    private func formatDoctor(_ report: SnapshotDoctorReport) -> String {
        let watchedPorts = report.watchedPorts.map(String.init).joined(separator: ", ")
        let lines = [
            "Portpourri doctor",
            "Source: \(report.diagnostics.source)",
            "Watched ports: \(watchedPorts)",
            "Listener probe: \(self.formatCheck(report.listenerProbe))",
            "Metadata enrichment: \(self.formatCheck(report.metadataEnrichment))",
            "Inventory scan: \(self.formatCheck(report.inventoryScan))",
            "",
            "Commands:",
        ] + report.diagnostics.commands.map { "- \($0)" } + [
            "",
            "Troubleshooting:",
            "- If a watched port looks wrong, run the commands above manually.",
            "- Portpourri can map Node-family tools and common blockers, but it cannot infer intent for every non-Node listener.",
        ]

        return lines.joined(separator: "\n")
    }

    private func owners(for port: Int, snapshot: AppSnapshot) -> [TrackedProcessSnapshot] {
        snapshot.allProcesses
            .filter { $0.ports.contains(port) }
            .sorted(by: Self.compareProcesses)
    }

    private func projectOwning(port: Int, snapshot: AppSnapshot) -> ProjectSnapshot? {
        snapshot.projects.first { $0.ports.contains(port) }
    }

    private func nodeOwnerLabel(for port: Int, snapshot: AppSnapshot) -> String? {
        self.projectOwning(port: port, snapshot: snapshot)?.displayName
    }

    private func isExplicitConflict(status: WatchedPortStatus, owners: [TrackedProcessSnapshot]) -> Bool {
        status.isConflict && owners.count > 1
    }

    private func formatCheck(_ result: ProbeCheckResult) -> String {
        let status = result.status == .ok ? "ok" : "failed"
        guard let detail = result.detail, !detail.isEmpty else { return status }
        return "\(status) — \(detail)"
    }

    private static func compareProcesses(lhs: TrackedProcessSnapshot, rhs: TrackedProcessSnapshot) -> Bool {
        let lhsPorts = lhs.ports.map(String.init).joined(separator: ",")
        let rhsPorts = rhs.ports.map(String.init).joined(separator: ",")
        if lhsPorts == rhsPorts {
            if lhs.process.toolLabel == rhs.process.toolLabel {
                return lhs.process.pid < rhs.process.pid
            }
            return lhs.process.toolLabel.localizedCaseInsensitiveCompare(rhs.process.toolLabel) == .orderedAscending
        }
        return lhsPorts.localizedStandardCompare(rhsPorts) == .orderedAscending
    }

    static let helpText = """
    Usage:
      portpourri snapshot [--json] [--sample-data]
      portpourri fixtures --list
      portpourri fixtures --name mixed [--json]
      portpourri why <port>
      portpourri list --watched
      portpourri list --all
      portpourri doctor
    """
}
