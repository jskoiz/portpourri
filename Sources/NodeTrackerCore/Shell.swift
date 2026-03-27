import Foundation

public struct CommandOutput: Sendable {
    public let stdout: String
    public let stderr: String
    public let exitCode: Int32
}

public enum ShellCommandError: Error, CustomStringConvertible {
    case executableNotFound(String)
    case failed(command: String, exitCode: Int32, stderr: String)

    public var description: String {
        switch self {
        case let .executableNotFound(path):
            "Executable not found: \(path)"
        case let .failed(command, exitCode, stderr):
            "Command failed (\(exitCode)): \(command)\n\(stderr)"
        }
    }
}

public protocol ShellCommandRunning: Sendable {
    func run(
        launchPath: String,
        arguments: [String],
        allowNonZeroExitCodes: Set<Int32>
    ) throws -> CommandOutput
}

public struct ProcessShellRunner: ShellCommandRunning {
    public init() {}

    public func run(
        launchPath: String,
        arguments: [String],
        allowNonZeroExitCodes: Set<Int32> = []
    ) throws -> CommandOutput {
        guard FileManager.default.isExecutableFile(atPath: launchPath) else {
            throw ShellCommandError.executableNotFound(launchPath)
        }

        let process = Process()
        let stdoutPipe = Pipe()
        let stderrPipe = Pipe()
        process.executableURL = URL(fileURLWithPath: launchPath)
        process.arguments = arguments
        process.standardOutput = stdoutPipe
        process.standardError = stderrPipe

        try process.run()

        // Read pipe data before waitUntilExit to avoid deadlock when
        // output exceeds the pipe buffer size (~64 KB on macOS).
        let stdoutData = stdoutPipe.fileHandleForReading.readDataToEndOfFile()
        let stderrData = stderrPipe.fileHandleForReading.readDataToEndOfFile()

        process.waitUntilExit()
        let stdout = String(decoding: stdoutData, as: UTF8.self)
        let stderr = String(decoding: stderrData, as: UTF8.self)

        let output = CommandOutput(stdout: stdout, stderr: stderr, exitCode: process.terminationStatus)
        if output.exitCode != 0 && !allowNonZeroExitCodes.contains(output.exitCode) {
            let command = ([launchPath] + arguments).joined(separator: " ")
            throw ShellCommandError.failed(command: command, exitCode: output.exitCode, stderr: output.stderr)
        }
        return output
    }
}
