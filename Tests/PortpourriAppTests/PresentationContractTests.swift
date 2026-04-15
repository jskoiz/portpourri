import XCTest
@testable import PortpourriApp
@testable import PortpourriCore

final class PresentationContractTests: XCTestCase {
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
