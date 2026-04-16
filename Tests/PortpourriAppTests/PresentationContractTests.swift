import XCTest
@testable import PortpourriApp
@testable import PortpourriCore

final class PresentationContractTests: XCTestCase {
    func testWatchedPortHeadlineUsesOccupancyFirstLanguage() {
        XCTAssertEqual(
            DisplayText.watchedPortHeadline(WatchedPortStatus(port: 3000, isBusy: true, ownerSummary: "ControlCenter (1151)", isNodeOwned: false, isConflict: true)),
            "ControlCenter"
        )
        XCTAssertEqual(
            DisplayText.watchedPortHeadline(WatchedPortStatus(port: 3000, isBusy: true, ownerSummary: "vite (1)", isNodeOwned: true, isConflict: false)),
            "vite"
        )
    }

    func testBlockerDetailShowsPidOnlyAndHoverUsesPath() {
        let process = TrackedProcessSnapshot(
            process: ProcessSnapshot(
                pid: 47371,
                ppid: 1,
                state: "S",
                uptime: "00:01",
                commandLine: "python3 -m http.server 3000",
                parentCommandLine: "zsh",
                cwd: "/Users/jk/Desktop/portpourri-main",
                isNodeFamily: false,
                toolLabel: "Python"
            ),
            listeners: [],
            ports: [3000],
            isWatchedConflict: true
        )

        XCTAssertEqual(DisplayText.blockerDetail(process), "PID 47371")
        XCTAssertEqual(DisplayText.blockerHoverDetail(process), "~/Desktop/portpourri-main")
    }

    func testWatchedPortDotStateMatchesOwnershipRules() {
        XCTAssertEqual(
            WatchedPortDotState(from: WatchedPortStatus(port: 3000, isBusy: false, ownerSummary: "Free", isNodeOwned: false, isConflict: false)),
            .free
        )
        XCTAssertEqual(
            WatchedPortDotState(from: WatchedPortStatus(port: 3000, isBusy: true, ownerSummary: "vite (1)", isNodeOwned: true, isConflict: false)),
            .owned
        )
        XCTAssertEqual(
            WatchedPortDotState(from: WatchedPortStatus(port: 3000, isBusy: true, ownerSummary: "postgres (2)", isNodeOwned: false, isConflict: true)),
            .blocked
        )
        XCTAssertEqual(
            WatchedPortDotState(from: WatchedPortStatus(port: 3000, isBusy: true, ownerSummary: "vite (1), next dev (2)", isNodeOwned: true, isConflict: true)),
            .conflict
        )
    }

    func testStatusChipRendererUsesConfiguredDisplayMode() {
        let summary = SnapshotSummary(
            nodeProjectCount: 3,
            watchedBusyCount: 2,
            otherListenerCount: 1,
            watchedNonNodeConflictCount: 1,
            nodeProcessTotalCount: 5,
            nodeProcessTotalMemoryBytes: 2_147_483_648
        )

        XCTAssertEqual(StatusChipRenderer.statusText(for: summary, displayMode: .countOnly), "3")
        XCTAssertEqual(StatusChipRenderer.statusText(for: summary, displayMode: .iconOnly), "N")
        XCTAssertEqual(StatusChipRenderer.statusText(for: summary, displayMode: .memoryOnly), "2.0G")
    }
}
