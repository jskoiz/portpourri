import Foundation
import PortpourriCore

enum DestructiveActionKind {
    case stopServer
    case freePort
    case stopTunnel
    case stopBlocker
    case killGroup

    var label: String {
        switch self {
        case .stopServer: "Stop server"
        case .freePort: "Free port"
        case .stopTunnel: "Stop tunnel"
        case .stopBlocker: "Stop blocker"
        case .killGroup: "Kill group"
        }
    }
}

struct ActiveListenerGroup: Identifiable, Hashable {
    let projectRoot: String
    let displayName: String
    let isWorktreeLike: Bool
    let toolLabel: String
    let processes: [TrackedProcessSnapshot]

    var id: String { "\(self.projectRoot)#\(self.toolLabel)" }
    var count: Int { self.processes.count }
    var pids: [Int] { self.processes.map(\.process.pid) }
}

struct DestructiveActionConfirmation {
    let kind: DestructiveActionKind
    let messageText: String
    let informativeText: String
    let confirmButtonTitle: String
}

enum DestructiveActionAdvisor {
    static func kind(for process: TrackedProcessSnapshot, portContext: Int?) -> DestructiveActionKind? {
        let command = process.process.commandLine
        let lowercasedCommand = command.lowercased()
        let tool = process.process.toolLabel.lowercased()

        if process.process.isNodeFamily, portContext != nil {
            return .stopServer
        }

        let listenerIsSSH = process.listeners.contains {
            $0.commandName.lowercased() == "ssh" || $0.commandName.lowercased() == "sshd"
        }
        if tool == "ssh" || tool == "sshd" || lowercasedCommand.hasPrefix("ssh ") || listenerIsSSH {
            return .stopTunnel
        }

        if DestructiveActionPolicy.canTerminate(process) {
            return portContext != nil ? .freePort : .stopBlocker
        }

        return nil
    }

    static func confirmation(for process: TrackedProcessSnapshot, portContext: Int?) -> DestructiveActionConfirmation? {
        guard let kind = self.kind(for: process, portContext: portContext) else { return nil }
        let pid = process.process.pid
        let target = process.process.toolLabel
        let portText = portContext.map { " on port \($0)" } ?? ""
        let command = process.process.commandLine

        switch kind {
        case .stopServer:
            return DestructiveActionConfirmation(
                kind: kind,
                messageText: "Stop server listening\(portText)?",
                informativeText: "Sends SIGTERM to \(target) (PID \(pid)) only. Other Node work stays untouched.\n\(command)",
                confirmButtonTitle: kind.label
            )
        case .freePort:
            return DestructiveActionConfirmation(
                kind: kind,
                messageText: "Free port\(portText) by stopping \(target)?",
                informativeText: "Sends SIGTERM to PID \(pid) only. Portpourri will not terminate unrelated listeners.\n\(command)",
                confirmButtonTitle: kind.label
            )
        case .stopTunnel:
            return DestructiveActionConfirmation(
                kind: kind,
                messageText: "Stop tunnel\(portText)?",
                informativeText: "Sends SIGTERM to the SSH process (PID \(pid)) and closes this tunnel only.\n\(command)",
                confirmButtonTitle: kind.label
            )
        case .stopBlocker:
            return DestructiveActionConfirmation(
                kind: kind,
                messageText: "Stop blocker \(target)?",
                informativeText: "Sends SIGTERM to PID \(pid) only.\n\(command)",
                confirmButtonTitle: kind.label
            )
        case .killGroup:
            return nil
        }
    }

    static func confirmation(for group: ActiveListenerGroup) -> DestructiveActionConfirmation {
        let ports = Set(group.processes.flatMap(\.ports)).sorted()
        let portList = ports.map(String.init).joined(separator: ", ")
        let portText = portList.isEmpty ? "active listeners" : "ports \(portList)"
        return DestructiveActionConfirmation(
            kind: .killGroup,
            messageText: "Kill \(group.toolLabel) group for \(group.displayName)?",
            informativeText: "Sends SIGTERM to \(group.count) active-listener process\(group.count == 1 ? "" : "es") in \(group.displayName) tied to \(portText) only. Other projects and unrelated Node processes are excluded.",
            confirmButtonTitle: DestructiveActionKind.killGroup.label
        )
    }
}

enum DestructiveActionPolicy {
    static func hasMeaningfulDirectory(_ process: TrackedProcessSnapshot) -> Bool {
        guard let cwd = process.process.cwd, cwd != "/" else { return false }
        return FileManager.default.fileExists(atPath: cwd)
    }

    static func canTerminate(_ process: TrackedProcessSnapshot) -> Bool {
        if process.process.isNodeFamily {
            return true
        }

        guard hasMeaningfulDirectory(process) else { return false }

        let command = process.process.commandLine
        if command.hasPrefix("/System/") || command.hasPrefix("/usr/") || command.hasPrefix("/Applications/") {
            return false
        }

        return true
    }

    static func sortedProcesses(_ processes: [TrackedProcessSnapshot]) -> [TrackedProcessSnapshot] {
        processes.sorted { lhs, rhs in
            let lhsPorts = lhs.ports.map(String.init).joined(separator: ",")
            let rhsPorts = rhs.ports.map(String.init).joined(separator: ",")
            if lhsPorts == rhsPorts {
                return lhs.process.toolLabel.localizedCaseInsensitiveCompare(rhs.process.toolLabel) == .orderedAscending
            }
            return lhsPorts.localizedStandardCompare(rhsPorts) == .orderedAscending
        }
    }
}
