import Foundation
import PortpourriCore

enum CLIError: Error, CustomStringConvertible {
    case usage(String)
    case fixtureNotFound(String)

    var description: String {
        switch self {
        case let .usage(message): message
        case let .fixtureNotFound(name): "Unknown fixture: \(name)"
        }
    }
}

@main
struct PortpourriCLI {
    static func main() {
        do {
            try Self.run(arguments: Array(CommandLine.arguments.dropFirst()))
        } catch {
            fputs("\(error)\n", stderr)
            exit(1)
        }
    }

    private static func run(arguments: [String]) throws {
        guard let command = arguments.first else {
            throw CLIError.usage(Self.helpText)
        }

        switch command {
        case "snapshot":
            try self.runSnapshot(arguments: Array(arguments.dropFirst()))
        case "fixtures":
            try self.runFixtures(arguments: Array(arguments.dropFirst()))
        case "help", "--help", "-h":
            print(Self.helpText)
        default:
            throw CLIError.usage(Self.helpText)
        }
    }

    private static func runSnapshot(arguments: [String]) throws {
        let sample = arguments.contains("--sample-data")
        let wantsJSON = arguments.contains("--json")
        let service = SnapshotService()
        let snapshot = sample
            ? SnapshotService.sampleSnapshot()
            : try service.captureLiveSnapshot(watchedPorts: SnapshotService.defaultWatchedPorts)

        if wantsJSON {
            let data = try service.exportJSON(snapshot: snapshot)
            FileHandle.standardOutput.write(data)
            FileHandle.standardOutput.write(Data("\n".utf8))
            return
        }

        printSummary(snapshot)
    }

    private static func runFixtures(arguments: [String]) throws {
        let catalog = FixtureCatalog()

        if arguments.isEmpty || arguments.contains("--list") {
            print(catalog.availableNames.joined(separator: "\n"))
            return
        }

        guard let nameIndex = arguments.firstIndex(of: "--name"),
              arguments.indices.contains(nameIndex + 1)
        else {
            throw CLIError.usage("Usage: portpourri fixtures --name <fixture> [--json]")
        }

        let name = arguments[nameIndex + 1]
        guard catalog.availableNames.contains(name) else {
            throw CLIError.fixtureNotFound(name)
        }

        let service = SnapshotService()
        let snapshot = SnapshotService.sampleSnapshot(fixtureName: name)
        if arguments.contains("--json") {
            let data = try service.exportJSON(snapshot: snapshot)
            FileHandle.standardOutput.write(data)
            FileHandle.standardOutput.write(Data("\n".utf8))
            return
        }

        printSummary(snapshot)
    }

    private static func printSummary(_ snapshot: AppSnapshot) {
        print("Portpourri snapshot")
        print("Updated: \(snapshot.generatedAt)")
        print("Node projects: \(snapshot.summary.nodeProjectCount)")
        print("Busy watched ports: \(snapshot.summary.watchedBusyCount)")
        print("Other listeners: \(snapshot.summary.otherListenerCount)")
        print("")

        for project in snapshot.projects {
            print("\(project.displayName)  \(project.ports.map { String($0) }.joined(separator: ", "))")
        }

        if !snapshot.otherProcesses.isEmpty {
            print("")
            print("Other listeners:")
            for process in snapshot.otherProcesses {
                print("- PID \(process.process.pid): \(process.process.commandLine)")
            }
        }
    }

    private static let helpText = """
    Usage:
      portpourri snapshot [--json] [--sample-data]
      portpourri fixtures --list
      portpourri fixtures --name mixed [--json]
    """
}
