import Foundation

struct LsofListenerParser {
    func parse(_ raw: String) -> [ListenerSnapshot] {
        var listeners: [ListenerSnapshot] = []
        var currentPID: Int?
        var currentCommand = ""
        var currentTransport: Transport?

        for line in raw.split(whereSeparator: \.isNewline).map(String.init) {
            guard let prefix = line.first else { continue }
            let value = String(line.dropFirst())

            switch prefix {
            case "p":
                currentPID = Int(value)
                currentTransport = nil
            case "c":
                currentCommand = value
            case "f":
                currentTransport = nil
            case "t":
                currentTransport = self.transport(for: value)
            case "n":
                guard let pid = currentPID,
                      let transport = currentTransport,
                      let parsed = self.parseAddress(value)
                else { continue }
                listeners.append(
                    ListenerSnapshot(
                        pid: pid,
                        port: parsed.port,
                        hostScope: parsed.scope,
                        transport: transport,
                        commandName: currentCommand
                    )
                )
            default:
                continue
            }
        }

        return listeners
    }

    private func transport(for value: String) -> Transport? {
        switch value {
        case "IPv4": .tcp4
        case "IPv6": .tcp6
        default: nil
        }
    }

    private func parseAddress(_ value: String) -> (port: Int, scope: HostScope)? {
        guard let port = Int(value.split(separator: ":").last ?? "") else { return nil }
        let host = value.replacingOccurrences(of: ":\(port)", with: "")
            .replacingOccurrences(of: "[", with: "")
            .replacingOccurrences(of: "]", with: "")

        let scope: HostScope
        switch host {
        case "*", "::", "0.0.0.0":
            scope = .any
        case "127.0.0.1", "::1", "localhost":
            scope = .loopback
        case "":
            scope = .unknown
        default:
            scope = .specific
        }

        return (port, scope)
    }
}

struct ProcessMetadataRecord: Hashable, Sendable {
    let pid: Int
    let ppid: Int
    let uptime: String
    let state: String
    let commandLine: String
}

struct PSProcessParser {
    private static let regex = try? NSRegularExpression(pattern: #"^\s*(\d+)\s+(\d+)\s+(\S+)\s+(\S+)\s+(.+)$"#)

    func parse(_ raw: String) -> [Int: ProcessMetadataRecord] {
        guard let regex = Self.regex else { return [:] }
        var records: [Int: ProcessMetadataRecord] = [:]

        for line in raw.split(whereSeparator: \.isNewline).map(String.init) {
            let range = NSRange(location: 0, length: line.utf16.count)
            guard let match = regex.firstMatch(in: line, range: range),
                  match.numberOfRanges == 6,
                  let pid = self.capture(1, in: line, match: match).flatMap(Int.init),
                  let ppid = self.capture(2, in: line, match: match).flatMap(Int.init),
                  let uptime = self.capture(3, in: line, match: match),
                  let state = self.capture(4, in: line, match: match),
                  let commandLine = self.capture(5, in: line, match: match)
            else { continue }

            records[pid] = ProcessMetadataRecord(
                pid: pid,
                ppid: ppid,
                uptime: uptime,
                state: state,
                commandLine: commandLine
            )
        }

        return records
    }

    private func capture(_ group: Int, in line: String, match: NSTextCheckingResult) -> String? {
        let range = match.range(at: group)
        guard let swiftRange = Range(range, in: line) else { return nil }
        return String(line[swiftRange])
    }
}

struct CWDParser {
    func parse(_ raw: String) -> [Int: String] {
        var mapping: [Int: String] = [:]
        var currentPID: Int?
        var sawCWDField = false

        for line in raw.split(whereSeparator: \.isNewline).map(String.init) {
            guard let prefix = line.first else { continue }
            let value = String(line.dropFirst())

            switch prefix {
            case "p":
                currentPID = Int(value)
                sawCWDField = false
            case "f":
                sawCWDField = value == "cwd"
            case "n":
                if sawCWDField, let pid = currentPID {
                    mapping[pid] = value
                }
            default:
                continue
            }
        }

        return mapping
    }
}

public struct LsofListenerProbe: ListenerProbing {
    private let runner: ShellCommandRunning
    private let parser = LsofListenerParser()

    public init(runner: ShellCommandRunning = ProcessShellRunner()) {
        self.runner = runner
    }

    public func listeners() throws -> [ListenerSnapshot] {
        let output = try self.runner.run(
            launchPath: "/usr/sbin/lsof",
            arguments: ["-nP", "-Fpcuftn", "-iTCP", "-sTCP:LISTEN"],
            allowNonZeroExitCodes: [1]
        )
        return self.parser.parse(output.stdout)
    }
}

public struct PSProcessMetadataProbe: ProcessMetadataProbing {
    private let runner: ShellCommandRunning
    private let parser = PSProcessParser()
    private let cwdParser = CWDParser()

    public init(runner: ShellCommandRunning = ProcessShellRunner()) {
        self.runner = runner
    }

    public func processes(for pids: [Int]) throws -> [Int: ProcessSnapshot] {
        let sorted = Array(Set(pids)).sorted()
        guard !sorted.isEmpty else { return [:] }

        let output = try self.runner.run(
            launchPath: "/bin/ps",
            arguments: ["-p", sorted.map(String.init).joined(separator: ","), "-o", "pid=,ppid=,etime=,state=,command="],
            allowNonZeroExitCodes: [1]
        )

        let records = self.parser.parse(output.stdout)
        return Dictionary(uniqueKeysWithValues: records.map { key, record in
            (
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

    public func currentWorkingDirectories(for pids: [Int]) throws -> [Int: String] {
        let sorted = Array(Set(pids)).sorted()
        guard !sorted.isEmpty else { return [:] }

        let pidList = sorted.map(String.init).joined(separator: ",")
        let output = try self.runner.run(
            launchPath: "/usr/sbin/lsof",
            arguments: ["-a", "-p", pidList, "-d", "cwd", "-Fn"],
            allowNonZeroExitCodes: [1]
        )
        return self.cwdParser.parse(output.stdout)
    }
}
