import XCTest
@testable import PortpourriApp
@testable import PortpourriCore

final class AppDiagnosticsTests: XCTestCase {
    func testPermissionDeniedLsofErrorGetsHelpfulRecoveryText() {
        let issue = AppDiagnostics.issue(for: ShellCommandError.failed(
            command: "/usr/sbin/lsof -nP -Fpcuftn -iTCP -sTCP:LISTEN",
            exitCode: 1,
            stderr: "lsof: status error on 1234: Operation not permitted"
        ))

        XCTAssertEqual(issue.severity, .error)
        XCTAssertEqual(issue.title, "macOS blocked the live port scan.")
        XCTAssertTrue(issue.recoverySuggestion?.contains("doctor") == true)
    }

    func testDoctorReportFailureSurfacesWarning() {
        let report = SnapshotDoctorReport(
            generatedAt: .now,
            watchedPorts: [3000],
            diagnostics: ProbeDiagnostics(commands: SnapshotService.diagnosticCommands, source: "live"),
            listenerProbe: ProbeCheckResult(status: .ok, detail: "Found 1 listener"),
            metadataEnrichment: ProbeCheckResult(status: .failed, detail: "Command failed (1): /bin/ps"),
            inventoryScan: ProbeCheckResult(status: .ok, detail: "Found 0 node process groups")
        )

        let issue = AppDiagnostics.issue(from: report)

        XCTAssertEqual(issue?.severity, .warning)
        XCTAssertEqual(issue?.title, "Process metadata is incomplete.")
    }

    func testLaunchAtLoginInstallErrorGetsSpecificRecoveryText() {
        let issue = AppDiagnostics.issue(for: LaunchAtLoginError.requiresApplicationsInstall)

        XCTAssertEqual(issue.severity, .warning)
        XCTAssertEqual(issue.title, "Launch at login requires Portpourri to be installed in Applications.")
        XCTAssertTrue(issue.recoverySuggestion?.contains("/Applications") == true)
    }
}
