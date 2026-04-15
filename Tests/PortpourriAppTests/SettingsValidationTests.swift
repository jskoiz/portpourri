import AppKit
import XCTest
@testable import PortpourriApp

final class SettingsValidationTests: XCTestCase {
    func testWatchedPortsValidationRejectsNonNumericEntries() {
        let issue = SettingsValidation.watchedPortsIssue(for: "3000, vite, 5173")

        XCTAssertEqual(issue, SettingsValidationIssue(
            severity: .error,
            message: "Watched ports must be comma-separated numbers. Invalid: vite."
        ))
    }

    func testWatchedPortsValidationWarnsOnDuplicates() {
        let issue = SettingsValidation.watchedPortsIssue(for: "3000,3000,5173")

        XCTAssertEqual(issue, SettingsValidationIssue(
            severity: .warning,
            message: "Duplicate ports are collapsed automatically: 3000."
        ))
        XCTAssertEqual(SettingsValidation.parsedWatchedPorts(from: "3000,3000,5173"), [3000, 5173])
    }

    func testPortCommandTemplateRequiresPlaceholder() {
        let issue = SettingsValidation.portCommandTemplateIssue(for: "npm run dev")

        XCTAssertEqual(issue, SettingsValidationIssue(
            severity: .error,
            message: "Include {port} so Portpourri knows where to insert the suggestion."
        ))
    }

    func testHotkeyOptionsProvideTypedDisplayData() {
        XCTAssertEqual(HotkeyModifierOption.commandOption.symbols, "\u{2318}\u{2325}")
        XCTAssertEqual(HotkeyModifierOption.commandOption.eventFlags, [.command, .option])
        XCTAssertEqual(HotkeyKeyOption.j.eventKey, "j")
    }
}
