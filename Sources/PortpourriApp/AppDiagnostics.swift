import Foundation
import PortpourriCore

enum IssueSeverity: Equatable {
    case warning
    case error
}

struct AppIssue: Equatable {
    let severity: IssueSeverity
    let title: String
    let recoverySuggestion: String?
    let detail: String?

    var accessibilityText: String {
        [self.title, self.recoverySuggestion, self.detail]
            .compactMap { $0 }
            .joined(separator: ". ")
    }
}

enum AppDiagnostics {
    static func issue(for error: Error) -> AppIssue {
        if let shellError = error as? ShellCommandError {
            return shellIssue(for: shellError)
        }

        if let launchError = error as? LaunchAtLoginError {
            return AppIssue(
                severity: .warning,
                title: launchError.localizedDescription,
                recoverySuggestion: launchError.recoverySuggestion,
                detail: nil
            )
        }

        return AppIssue(
            severity: .error,
            title: "Portpourri could not finish that action.",
            recoverySuggestion: "Run `swift run portpourri doctor` for live probe details and try again.",
            detail: String(describing: error)
        )
    }

    static func issue(from report: SnapshotDoctorReport?) -> AppIssue? {
        guard let report else { return nil }

        if report.listenerProbe.status == .failed {
            return diagnosticIssue(
                title: "Live port scans are blocked.",
                detail: report.listenerProbe.detail,
                fallbackRecovery: "Portpourri relies on `lsof` for listener discovery. Run `swift run portpourri doctor` to inspect the exact probe failure."
            )
        }

        if report.metadataEnrichment.status == .failed {
            return diagnosticIssue(
                title: "Process metadata is incomplete.",
                detail: report.metadataEnrichment.detail,
                fallbackRecovery: "Portpourri found listeners, but `ps` or cwd enrichment failed. Run `swift run portpourri doctor` for the exact probe output."
            )
        }

        if report.inventoryScan.status == .failed {
            return diagnosticIssue(
                title: "Background Node inventory is unavailable.",
                detail: report.inventoryScan.detail,
                fallbackRecovery: "The main watched-port view still works, but the machine-wide inventory probe needs attention."
            )
        }

        return nil
    }

    private static func shellIssue(for error: ShellCommandError) -> AppIssue {
        switch error {
        case let .executableNotFound(path):
            return AppIssue(
                severity: .error,
                title: "Required system tool is missing.",
                recoverySuggestion: "Portpourri expected to find \(path). Run `swift run portpourri doctor` to verify the live probe installation.",
                detail: "Missing executable: \(path)"
            )

        case let .failed(command, exitCode, stderr):
            let stderrLower = stderr.lowercased()

            if command.contains("/usr/sbin/lsof") {
                if stderrLower.contains("operation not permitted") || stderrLower.contains("not permitted") || stderrLower.contains("permission denied") {
                    return AppIssue(
                        severity: .error,
                        title: "macOS blocked the live port scan.",
                        recoverySuggestion: "Grant the packaged app permission to inspect processes, then reopen the popover or run `swift run portpourri doctor`.",
                        detail: "lsof exited with status \(exitCode): \(stderr.trimmingCharacters(in: .whitespacesAndNewlines))"
                    )
                }

                return AppIssue(
                    severity: .error,
                    title: "Portpourri could not inspect listening ports.",
                    recoverySuggestion: "Run `swift run portpourri doctor` to see the exact `lsof` failure and retry once the probe succeeds.",
                    detail: "lsof exited with status \(exitCode): \(stderr.trimmingCharacters(in: .whitespacesAndNewlines))"
                )
            }

            if command.contains("/bin/ps") {
                return AppIssue(
                    severity: .warning,
                    title: "Portpourri found listeners but could not resolve process details.",
                    recoverySuggestion: "Retry once `ps` is available, or run `swift run portpourri doctor` to inspect the metadata probe.",
                    detail: "ps exited with status \(exitCode): \(stderr.trimmingCharacters(in: .whitespacesAndNewlines))"
                )
            }

            return AppIssue(
                severity: .error,
                title: "A supporting system command failed.",
                recoverySuggestion: "Run `swift run portpourri doctor` for a full probe report.",
                detail: "Command failed: \(command)\n\(stderr.trimmingCharacters(in: .whitespacesAndNewlines))"
            )
        }
    }

    private static func diagnosticIssue(title: String, detail: String?, fallbackRecovery: String) -> AppIssue {
        let normalizedDetail = detail?.trimmingCharacters(in: .whitespacesAndNewlines)
        let detailLower = normalizedDetail?.lowercased() ?? ""

        if detailLower.contains("operation not permitted") || detailLower.contains("not permitted") || detailLower.contains("permission denied") {
            return AppIssue(
                severity: .error,
                title: title,
                recoverySuggestion: "macOS denied one of the process probes. Re-run the packaged app after granting access, or inspect the failure with `swift run portpourri doctor`.",
                detail: normalizedDetail
            )
        }

        return AppIssue(
            severity: .warning,
            title: title,
            recoverySuggestion: fallbackRecovery,
            detail: normalizedDetail
        )
    }
}
